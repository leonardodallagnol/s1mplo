import { Injectable, Logger } from '@nestjs/common';
import { Platform, Connection } from '@prisma/client';
import axios from 'axios';
import {
  BasePlatformAdapter,
  DateRange,
  UnifiedAdMetric,
  UnifiedOrder,
  UnifiedAnalyticsMetric,
  HealthCheckResult,
} from './base.adapter';

@Injectable()
export class TikTokAdsAdapter extends BasePlatformAdapter {
  platform: Platform = Platform.TIKTOK_ADS;
  apiVersion: string = 'v1.3';

  private readonly logger = new Logger(TikTokAdsAdapter.name);

  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 1000;
        this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw new Error('Unreachable');
  }

  async fetchAdMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<UnifiedAdMetric[]> {
    const since = dateRange.startDate.toISOString().split('T')[0];
    const until = dateRange.endDate.toISOString().split('T')[0];

    return this.retryWithBackoff(async () => {
      const response = await axios.post(
        'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/',
        {
          advertiser_id: connection.platformAccountId,
          report_type: 'AUDIENCE',
          data_level: 'AUCTION_CAMPAIGN',
          dimensions: ['campaign_id', 'stat_time_day'],
          metrics: [
            'spend',
            'impressions',
            'clicks',
            'conversions',
            'conversion_value',
            'cost_per_conversion',
          ],
          start_date: since,
          end_date: until,
          page_size: 1000,
        },
        {
          headers: {
            'Access-Token': connection.accessToken,
          },
        },
      );

      const rows: any[] = response.data?.data?.list || [];
      return rows.map((row) => this.mapToUnifiedMetric(row));
    });
  }

  private mapToUnifiedMetric(row: any): UnifiedAdMetric {
    const metrics = row.metrics || {};
    const dimensions = row.dimensions || {};

    return {
      date: new Date(dimensions.stat_time_day),
      platform: Platform.TIKTOK_ADS,
      impressions: parseInt(metrics.impressions, 10) || 0,
      clicks: parseInt(metrics.clicks, 10) || 0,
      spend: parseFloat(metrics.spend) || 0,
      conversions: parseInt(metrics.conversions, 10) || 0,
      revenue: parseFloat(metrics.conversion_value) || 0,
      addToCart: 0,
      initiateCheckout: 0,
      purchases: parseInt(metrics.conversions, 10) || 0,
      campaignId: dimensions.campaign_id,
      campaignName: undefined,
    };
  }

  async fetchOrders(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<UnifiedOrder[]> {
    return [];
  }

  async fetchAnalytics(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<UnifiedAnalyticsMetric[]> {
    return [];
  }

  async refreshToken(connection: Connection): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }> {
    // TikTok tokens are long-lived, no refresh needed
    return { accessToken: connection.accessToken };
  }

  async healthCheck(connection: Connection): Promise<HealthCheckResult> {
    try {
      await axios.get(
        'https://business-api.tiktok.com/open_api/v1.3/advertiser/info/',
        {
          params: {
            access_token: connection.accessToken,
            advertiser_ids: JSON.stringify([connection.platformAccountId]),
          },
        },
      );
      return {
        healthy: true,
        apiVersion: this.apiVersion,
        accountId: connection.platformAccountId,
        accountName: connection.platformAccountName || undefined,
      };
    } catch (err: any) {
      return {
        healthy: false,
        apiVersion: this.apiVersion,
        error: err.response?.data?.message || err.message,
      };
    }
  }

  async validateConnection(connection: Connection): Promise<boolean> {
    const result = await this.healthCheck(connection);
    return result.healthy;
  }
}
