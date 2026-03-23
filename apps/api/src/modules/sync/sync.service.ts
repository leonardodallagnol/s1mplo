import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { Platform, SyncStatus, AlertType, ConnectionStatus } from '@prisma/client';
import { MetaAdsAdapter } from './adapters/meta-ads.adapter';
import { GoogleAdsAdapter } from './adapters/google-ads.adapter';
import { GoogleAnalyticsAdapter } from './adapters/google-analytics.adapter';
import { NuvemshopAdapter } from './adapters/nuvemshop.adapter';
import { MercadoLivreAdapter } from './adapters/mercadolivre.adapter';
import { TikTokAdsAdapter } from './adapters/tiktok-ads.adapter';
import { BasePlatformAdapter, DateRange } from './adapters/base.adapter';
import { NotificationService } from './notification.service';

const CONSECUTIVE_FAILURE_THRESHOLD = 3;

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectQueue('sync') private syncQueue: Queue,
    private prisma: PrismaService,
    private metaAdsAdapter: MetaAdsAdapter,
    private googleAdsAdapter: GoogleAdsAdapter,
    private googleAnalyticsAdapter: GoogleAnalyticsAdapter,
    private nuvemshopAdapter: NuvemshopAdapter,
    private mercadoLivreAdapter: MercadoLivreAdapter,
    private tikTokAdsAdapter: TikTokAdsAdapter,
    private notificationService: NotificationService,
  ) {}

  // ==================== QUEUE MANAGEMENT ====================

  async scheduleConnectionSync(connectionId: string): Promise<void> {
    await this.syncQueue.add(
      'sync-connection',
      { connectionId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 30000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );
    this.logger.log(`Queued sync for connection ${connectionId}`);
  }

  async triggerWorkspaceSync(workspaceId: string): Promise<void> {
    const connections = await this.prisma.connection.findMany({
      where: {
        workspaceId,
        status: ConnectionStatus.ACTIVE,
      },
      select: { id: true, platform: true },
    });

    for (const connection of connections) {
      await this.scheduleConnectionSync(connection.id);
    }

    this.logger.log(
      `Queued ${connections.length} sync jobs for workspace ${workspaceId}`,
    );
  }

  // ==================== CRON JOB TRIGGERS ====================

  async triggerAllAdMetricsSync(): Promise<void> {
    const connections = await this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACTIVE,
        platform: { in: [Platform.META_ADS, Platform.GOOGLE_ADS, Platform.TIKTOK_ADS] },
      },
      select: { id: true },
    });

    for (const conn of connections) {
      await this.scheduleConnectionSync(conn.id);
    }
    this.logger.log(`Triggered ad metrics sync for ${connections.length} connections`);
  }

  async triggerAllAnalyticsSync(): Promise<void> {
    const connections = await this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACTIVE,
        platform: Platform.GOOGLE_ANALYTICS,
      },
      select: { id: true },
    });

    for (const conn of connections) {
      await this.scheduleConnectionSync(conn.id);
    }
    this.logger.log(`Triggered analytics sync for ${connections.length} connections`);
  }

  async triggerAllOrdersSync(): Promise<void> {
    const connections = await this.prisma.connection.findMany({
      where: {
        status: ConnectionStatus.ACTIVE,
        platform: { in: [Platform.NUVEMSHOP, Platform.MERCADO_LIVRE] },
      },
      select: { id: true },
    });

    for (const conn of connections) {
      await this.scheduleConnectionSync(conn.id);
    }
    this.logger.log(`Triggered orders sync for ${connections.length} connections`);
  }

  // ==================== CORE SYNC LOGIC ====================

  async syncConnection(connectionId: string): Promise<void> {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException(`Connection ${connectionId} not found`);
    }

    const adapter = this.getAdapter(connection.platform);
    const startedAt = new Date();

    // Create RUNNING sync log
    const syncLog = await this.prisma.syncLog.create({
      data: {
        workspaceId: connection.workspaceId,
        connectionId: connection.id,
        status: SyncStatus.RUNNING,
        startedAt,
      },
    });

    try {
      // Try to refresh token if near expiry (within 5 minutes)
      const updatedConnection = await this.maybeRefreshToken(connection, adapter);

      const dateRange: DateRange = {
        startDate: connection.lastSyncAt
          ? new Date(connection.lastSyncAt.getTime() - 24 * 60 * 60 * 1000) // 1 day overlap
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days back on first sync
        endDate: new Date(),
      };

      let recordsProcessed = 0;

      // Fetch and upsert based on platform type
      if (
        connection.platform === Platform.META_ADS ||
        connection.platform === Platform.GOOGLE_ADS ||
        connection.platform === Platform.TIKTOK_ADS
      ) {
        const metrics = await adapter.fetchAdMetrics(updatedConnection, dateRange);
        recordsProcessed += await this.upsertAdMetrics(
          connection.workspaceId,
          connection.id,
          connection.platform,
          metrics,
        );
      }

      if (connection.platform === Platform.GOOGLE_ANALYTICS) {
        const analytics = await adapter.fetchAnalytics(updatedConnection, dateRange);
        recordsProcessed += await this.upsertAnalyticsMetrics(
          connection.workspaceId,
          connection.id,
          analytics,
        );
      }

      if (
        connection.platform === Platform.NUVEMSHOP ||
        connection.platform === Platform.MERCADO_LIVRE
      ) {
        const orders = await adapter.fetchOrders(updatedConnection, dateRange);
        recordsProcessed += await this.upsertOrders(
          connection.workspaceId,
          connection.id,
          connection.platform,
          orders,
        );
      }

      // Success: update connection + sync log
      await this.prisma.connection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          lastSyncError: null,
          // Reset status to ACTIVE in case it was in a warning state
          status: ConnectionStatus.ACTIVE,
        },
      });

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncStatus.COMPLETED,
          recordsProcessed,
          completedAt: new Date(),
        },
      });

      this.logger.log(
        `Sync completed for connection ${connectionId}: ${recordsProcessed} records`,
      );
    } catch (err: any) {
      this.logger.error(`Sync failed for connection ${connectionId}`, err.message);

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncStatus.FAILED,
          errorMessage: err.message,
          completedAt: new Date(),
        },
      });

      await this.handleSyncFailure(connection, err.message);

      throw err; // Re-throw so BullMQ can retry
    }
  }

  // ==================== CIRCUIT BREAKER ====================

  private async handleSyncFailure(connection: any, errorMessage: string): Promise<void> {
    // Count consecutive failures
    const recentLogs = await this.prisma.syncLog.findMany({
      where: { connectionId: connection.id },
      orderBy: { startedAt: 'desc' },
      take: CONSECUTIVE_FAILURE_THRESHOLD,
    });

    const consecutiveFailures = recentLogs.filter(
      (log) => log.status === SyncStatus.FAILED,
    ).length;

    if (consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
      this.logger.error(
        `Circuit breaker triggered for connection ${connection.id}: ${consecutiveFailures} consecutive failures`,
      );

      // Set connection to ERROR
      await this.prisma.connection.update({
        where: { id: connection.id },
        data: {
          status: ConnectionStatus.ERROR,
          lastSyncError: errorMessage,
        },
      });

      // Create Alert
      await this.prisma.alert.create({
        data: {
          workspaceId: connection.workspaceId,
          type: AlertType.SYNC_FAILURE,
          message: `Connection ${connection.platformAccountName || connection.id} (${connection.platform}) has failed ${consecutiveFailures} times in a row.`,
          metadata: {
            connectionId: connection.id,
            platform: connection.platform,
            consecutiveFailures,
            lastError: errorMessage,
          },
        },
      });

      // Send webhook notification
      await this.notificationService.sendCriticalAlert(
        `Connection sync failure: ${connection.platformAccountName || connection.id} (${connection.platform})`,
        {
          connectionId: connection.id,
          workspaceId: connection.workspaceId,
          platform: connection.platform,
          consecutiveFailures,
          lastError: errorMessage,
        },
      );
    } else {
      // Just update the error message
      await this.prisma.connection.update({
        where: { id: connection.id },
        data: { lastSyncError: errorMessage },
      });
    }
  }

  // ==================== TOKEN REFRESH ====================

  private async maybeRefreshToken(connection: any, adapter: BasePlatformAdapter): Promise<any> {
    if (!connection.tokenExpiresAt) return connection;

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (connection.tokenExpiresAt > fiveMinutesFromNow) return connection;

    try {
      const { accessToken, refreshToken, expiresAt } = await adapter.refreshToken(connection);
      const updated = await this.prisma.connection.update({
        where: { id: connection.id },
        data: {
          accessToken,
          refreshToken: refreshToken || connection.refreshToken,
          tokenExpiresAt: expiresAt,
        },
      });
      this.logger.log(`Token refreshed for connection ${connection.id}`);
      return updated;
    } catch (err: any) {
      this.logger.warn(`Token refresh failed for connection ${connection.id}: ${err.message}`);
      return connection;
    }
  }

  // ==================== UPSERT HELPERS ====================

  private async upsertAdMetrics(
    workspaceId: string,
    connectionId: string,
    platform: Platform,
    metrics: any[],
  ): Promise<number> {
    let count = 0;
    for (const metric of metrics) {
      const cpc = metric.clicks > 0 ? metric.spend / metric.clicks : null;
      const ctr = metric.impressions > 0 ? metric.clicks / metric.impressions : null;
      const cpa = metric.conversions > 0 ? metric.spend / metric.conversions : null;
      const roas = metric.spend > 0 ? metric.revenue / metric.spend : null;

      await this.prisma.adMetric.upsert({
        where: {
          connectionId_date_campaignId: {
            connectionId,
            date: metric.date,
            campaignId: metric.campaignId || '',
          },
        },
        update: {
          impressions: metric.impressions,
          clicks: metric.clicks,
          spend: metric.spend,
          conversions: metric.conversions,
          revenue: metric.revenue,
          addToCart: metric.addToCart,
          initiateCheckout: metric.initiateCheckout,
          purchases: metric.purchases,
          adSetId: metric.adSetId,
          adSetName: metric.adSetName,
          campaignName: metric.campaignName,
          cpc,
          ctr,
          cpa,
          roas,
        },
        create: {
          workspaceId,
          connectionId,
          platform,
          date: metric.date,
          impressions: metric.impressions,
          clicks: metric.clicks,
          spend: metric.spend,
          conversions: metric.conversions,
          revenue: metric.revenue,
          addToCart: metric.addToCart,
          initiateCheckout: metric.initiateCheckout,
          purchases: metric.purchases,
          campaignId: metric.campaignId,
          campaignName: metric.campaignName,
          adSetId: metric.adSetId,
          adSetName: metric.adSetName,
          cpc,
          ctr,
          cpa,
          roas,
        },
      });
      count++;
    }
    return count;
  }

  private async upsertAnalyticsMetrics(
    workspaceId: string,
    connectionId: string,
    metrics: any[],
  ): Promise<number> {
    let count = 0;
    for (const metric of metrics) {
      await this.prisma.analyticsMetric.upsert({
        where: {
          connectionId_date_source_medium_campaign: {
            connectionId,
            date: metric.date,
            source: metric.source || '',
            medium: metric.medium || '',
            campaign: metric.campaign || '',
          },
        },
        update: {
          sessions: metric.sessions,
          users: metric.users,
          newUsers: metric.newUsers,
          pageviews: metric.pageviews,
          bounceRate: metric.bounceRate,
          avgSessionDuration: metric.avgSessionDuration,
          transactions: metric.transactions,
          ecommerceRevenue: metric.ecommerceRevenue,
          addToCarts: metric.addToCarts,
          checkouts: metric.checkouts,
        },
        create: {
          workspaceId,
          connectionId,
          date: metric.date,
          sessions: metric.sessions,
          users: metric.users,
          newUsers: metric.newUsers,
          pageviews: metric.pageviews,
          bounceRate: metric.bounceRate,
          avgSessionDuration: metric.avgSessionDuration,
          source: metric.source,
          medium: metric.medium,
          campaign: metric.campaign,
          transactions: metric.transactions,
          ecommerceRevenue: metric.ecommerceRevenue,
          addToCarts: metric.addToCarts,
          checkouts: metric.checkouts,
        },
      });
      count++;
    }
    return count;
  }

  private async upsertOrders(
    workspaceId: string,
    connectionId: string,
    platform: Platform,
    orders: any[],
  ): Promise<number> {
    let count = 0;
    for (const order of orders) {
      await this.prisma.order.upsert({
        where: {
          connectionId_platformOrderId: {
            connectionId,
            platformOrderId: order.platformOrderId,
          },
        },
        update: {
          status: order.status,
          subtotal: order.subtotal,
          shipping: order.shipping,
          discount: order.discount,
          total: order.total,
          utmSource: order.utmSource,
          utmMedium: order.utmMedium,
          utmCampaign: order.utmCampaign,
          utmContent: order.utmContent,
        },
        create: {
          workspaceId,
          connectionId,
          platform,
          platformOrderId: order.platformOrderId,
          orderDate: order.orderDate,
          status: order.status,
          subtotal: order.subtotal,
          shipping: order.shipping,
          discount: order.discount,
          total: order.total,
          utmSource: order.utmSource,
          utmMedium: order.utmMedium,
          utmCampaign: order.utmCampaign,
          utmContent: order.utmContent,
          customerEmail: order.customerEmail,
          customerCity: order.customerCity,
          customerState: order.customerState,
          itemCount: order.itemCount,
        },
      });
      count++;
    }
    return count;
  }

  // ==================== ADAPTER REGISTRY ====================

  private getAdapter(platform: Platform): BasePlatformAdapter {
    const adapters: Record<Platform, BasePlatformAdapter> = {
      [Platform.META_ADS]: this.metaAdsAdapter,
      [Platform.GOOGLE_ADS]: this.googleAdsAdapter,
      [Platform.GOOGLE_ANALYTICS]: this.googleAnalyticsAdapter,
      [Platform.NUVEMSHOP]: this.nuvemshopAdapter,
      [Platform.MERCADO_LIVRE]: this.mercadoLivreAdapter,
      [Platform.TIKTOK_ADS]: this.tikTokAdsAdapter,
    };

    const adapter = adapters[platform];
    if (!adapter) {
      throw new Error(`No adapter found for platform ${platform}`);
    }
    return adapter;
  }
}
