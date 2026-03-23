import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertType, ConnectionStatus, Platform, OrderStatus } from '@prisma/client';

const STALE_THRESHOLDS: Record<string, number> = {
  AD_METRICS: 8,    // hours
  ANALYTICS: 8,
  ORDERS: 4,
};

const AD_PLATFORMS: string[] = [Platform.META_ADS, Platform.GOOGLE_ADS, Platform.TIKTOK_ADS];
const ANALYTICS_PLATFORMS: string[] = [Platform.GOOGLE_ANALYTICS];
const ORDER_PLATFORMS: string[] = [Platform.NUVEMSHOP, Platform.MERCADO_LIVRE];

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async checkWorkspaceAlerts(workspaceId: string): Promise<void> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const connections = await this.prisma.connection.findMany({
      where: { workspaceId },
    });

    // Check connection errors
    for (const conn of connections) {
      if (conn.status === ConnectionStatus.ERROR) {
        const existing = await this.prisma.alert.findFirst({
          where: {
            workspaceId,
            type: AlertType.CONNECTION_ERROR,
            createdAt: { gte: oneDayAgo },
            metadata: { path: ['connectionId'], equals: conn.id },
          },
        });

        if (!existing) {
          await this.prisma.alert.create({
            data: {
              workspaceId,
              type: AlertType.CONNECTION_ERROR,
              message: `Conexão ${conn.platformAccountName || conn.platformAccountId} (${conn.platform}) está com erro.`,
              metadata: { connectionId: conn.id, platform: conn.platform },
            },
          });
        }
      }
    }

    // Aggregate ad metrics for current and previous 7-day windows
    const [currentMetrics, previousMetrics] = await Promise.all([
      this.prisma.adMetric.findMany({
        where: { workspaceId, date: { gte: sevenDaysAgo, lte: now } },
      }),
      this.prisma.adMetric.findMany({
        where: { workspaceId, date: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      }),
    ]);

    const sumMetrics = (metrics: typeof currentMetrics) => ({
      spend: metrics.reduce((s, m) => s + Number(m.spend), 0),
      conversions: metrics.reduce((s, m) => s + m.conversions, 0),
      revenue: metrics.reduce((s, m) => s + Number(m.revenue), 0),
    });

    const curr = sumMetrics(currentMetrics);
    const prev = sumMetrics(previousMetrics);

    const currROAS = curr.spend > 0 ? curr.revenue / curr.spend : 0;
    const prevROAS = prev.spend > 0 ? prev.revenue / prev.spend : 0;
    const currCPA = curr.conversions > 0 ? curr.spend / curr.conversions : 0;
    const prevCPA = prev.conversions > 0 ? prev.spend / prev.conversions : 0;

    // ROAS drop: > 20% drop
    if (prevROAS > 0 && currROAS < prevROAS * 0.8) {
      const existing = await this.prisma.alert.findFirst({
        where: {
          workspaceId,
          type: AlertType.ROAS_DROP,
          createdAt: { gte: oneDayAgo },
        },
      });

      if (!existing) {
        await this.prisma.alert.create({
          data: {
            workspaceId,
            type: AlertType.ROAS_DROP,
            message: `ROAS caiu ${(((prevROAS - currROAS) / prevROAS) * 100).toFixed(1)}% nos últimos 7 dias (${currROAS.toFixed(2)}x vs ${prevROAS.toFixed(2)}x anterior).`,
            metadata: { currROAS, prevROAS },
          },
        });
      }
    }

    // CPA spike: > 30% increase
    if (prevCPA > 0 && currCPA > prevCPA * 1.3) {
      const existing = await this.prisma.alert.findFirst({
        where: {
          workspaceId,
          type: AlertType.CPA_SPIKE,
          createdAt: { gte: oneDayAgo },
        },
      });

      if (!existing) {
        await this.prisma.alert.create({
          data: {
            workspaceId,
            type: AlertType.CPA_SPIKE,
            message: `CPA aumentou ${(((currCPA - prevCPA) / prevCPA) * 100).toFixed(1)}% nos últimos 7 dias (R$${currCPA.toFixed(2)} vs R$${prevCPA.toFixed(2)} anterior).`,
            metadata: { currCPA, prevCPA },
          },
        });
      }
    }

    // Spend anomaly: today's spend > 2x average daily spend
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMetrics = currentMetrics.filter(m => m.date >= today);
    const todaySpend = todayMetrics.reduce((s, m) => s + Number(m.spend), 0);
    const avgDailySpend = curr.spend / 7;

    if (avgDailySpend > 0 && todaySpend > avgDailySpend * 2) {
      const existing = await this.prisma.alert.findFirst({
        where: {
          workspaceId,
          type: AlertType.SPEND_ANOMALY,
          createdAt: { gte: oneDayAgo },
        },
      });

      if (!existing) {
        await this.prisma.alert.create({
          data: {
            workspaceId,
            type: AlertType.SPEND_ANOMALY,
            message: `Gasto de hoje (R$${todaySpend.toFixed(2)}) é ${((todaySpend / avgDailySpend) * 100 - 100).toFixed(0)}% acima da média diária dos últimos 7 dias.`,
            metadata: { todaySpend, avgDailySpend },
          },
        });
      }
    }

    // Conversion drop: current 7d CR < previous 7d CR * 0.7
    const currOrders = await this.prisma.order.count({
      where: {
        workspaceId,
        orderDate: { gte: sevenDaysAgo, lte: now },
        status: OrderStatus.PAID,
      },
    });
    const prevOrders = await this.prisma.order.count({
      where: {
        workspaceId,
        orderDate: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        status: OrderStatus.PAID,
      },
    });

    if (prevOrders > 0 && currOrders < prevOrders * 0.7) {
      const existing = await this.prisma.alert.findFirst({
        where: {
          workspaceId,
          type: AlertType.CONVERSION_DROP,
          createdAt: { gte: oneDayAgo },
        },
      });

      if (!existing) {
        await this.prisma.alert.create({
          data: {
            workspaceId,
            type: AlertType.CONVERSION_DROP,
            message: `Pedidos pagos caíram ${(((prevOrders - currOrders) / prevOrders) * 100).toFixed(1)}% (${currOrders} vs ${prevOrders} na semana anterior).`,
            metadata: { currOrders, prevOrders },
          },
        });
      }
    }
  }

  async getAlerts(workspaceId: string, unreadOnly = false) {
    return this.prisma.alert.findMany({
      where: {
        workspaceId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markAlertRead(workspaceId: string, alertId: string) {
    const alert = await this.prisma.alert.findFirst({
      where: { id: alertId, workspaceId },
    });

    if (!alert) throw new NotFoundException('Alert not found');

    return this.prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  async getStaleness(workspaceId: string) {
    const connections = await this.prisma.connection.findMany({
      where: { workspaceId },
      select: {
        id: true,
        platform: true,
        platformAccountName: true,
        status: true,
        lastSyncAt: true,
      },
    });

    const now = new Date();

    return connections.map(conn => {
      const threshold = AD_PLATFORMS.includes(conn.platform)
        ? STALE_THRESHOLDS.AD_METRICS
        : ANALYTICS_PLATFORMS.includes(conn.platform)
        ? STALE_THRESHOLDS.ANALYTICS
        : ORDER_PLATFORMS.includes(conn.platform)
        ? STALE_THRESHOLDS.ORDERS
        : 8;

      const lastSync = conn.lastSyncAt;
      const hoursAgo = lastSync
        ? (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
        : null;
      const isStale = hoursAgo !== null ? hoursAgo > threshold : true;

      return {
        platform: conn.platform,
        accountName: conn.platformAccountName,
        status: conn.status,
        lastSyncAt: conn.lastSyncAt,
        hoursAgo: hoursAgo !== null ? Math.round(hoursAgo * 10) / 10 : null,
        isStale,
        thresholdHours: threshold,
      };
    });
  }
}
