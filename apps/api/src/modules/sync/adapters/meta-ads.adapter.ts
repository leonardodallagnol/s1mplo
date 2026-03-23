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
import { API_VERSIONS } from '../../../common/config/api-versions';

@Injectable()
export class MetaAdsAdapter extends BasePlatformAdapter {
  platform: Platform = Platform.META_ADS;
  apiVersion: string = API_VERSIONS.META_ADS;

  private readonly logger = new Logger(MetaAdsAdapter.name);

  private graphUrl(path: string): string {
    return `https://graph.facebook.com/${this.apiVersion}${path}`;
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
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
    const accountId = connection.platformAccountId.replace('act_', '');
    const since = dateRange.startDate.toISOString().split('T')[0];
    const until = dateRange.endDate.toISOString().split('T')[0];

    return this.retryWithBackoff(async () => {
      const response = await axios.get(
        this.graphUrl(`/act_${accountId}/insights`),
        {
          params: {
            access_token: connection.accessToken,
            fields:
              'impressions,clicks,spend,actions,action_values,campaign_id,campaign_name,adset_id,adset_name,date_start',
            time_range: JSON.stringify({ since, until }),
            time_increment: 1,
            level: 'adset',
            limit: 500,
          },
        },
      );

      const rows: any[] = response.data.data || [];
      return rows.map((row) => this.mapToUnifiedMetric(row, connection));
    });
  }

  private mapToUnifiedMetric(row: any, connection: Connection): UnifiedAdMetric {
    const actions: any[] = row.actions || [];
    const actionValues: any[] = row.action_values || [];

    const getAction = (type: string): number => {
      const found = actions.find((a: any) => a.action_type === type);
      return found ? parseInt(found.value, 10) || 0 : 0;
    };

    const getActionValue = (type: string): number => {
      const found = actionValues.find((a: any) => a.action_type === type);
      return found ? parseFloat(found.value) || 0 : 0;
    };

    const purchases = getAction('purchase') + getAction('offsite_conversion.fb_pixel_purchase');
    const revenue =
      getActionValue('purchase') +
      getActionValue('offsite_conversion.fb_pixel_purchase');
    const conversions = purchases || getAction('offsite_conversion.fb_pixel_lead');

    return {
      date: new Date(row.date_start),
      platform: Platform.META_ADS,
      impressions: parseInt(row.impressions, 10) || 0,
      clicks: parseInt(row.clicks, 10) || 0,
      spend: parseFloat(row.spend) || 0,
      conversions,
      revenue,
      addToCart:
        getAction('add_to_cart') +
        getAction('offsite_conversion.fb_pixel_add_to_cart'),
      initiateCheckout:
        getAction('initiate_checkout') +
        getAction('offsite_conversion.fb_pixel_initiate_checkout'),
      purchases,
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      adSetId: row.adset_id,
      adSetName: row.adset_name,
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
    // Inspect current token via debug_token
    try {
      const response = await axios.get(this.graphUrl('/debug_token'), {
        params: {
          input_token: connection.accessToken,
          access_token: connection.accessToken,
        },
      });

      const data = response.data?.data;
      if (data?.expires_at && data.expires_at > 0) {
        return {
          accessToken: connection.accessToken,
          expiresAt: new Date(data.expires_at * 1000),
        };
      }
    } catch (err) {
      this.logger.warn('Token debug failed, token may be long-lived', err);
    }

    // Meta long-lived tokens typically don't need refreshing
    return {
      accessToken: connection.accessToken,
    };
  }

  async healthCheck(connection: Connection): Promise<HealthCheckResult> {
    try {
      const response = await axios.get(this.graphUrl('/me/adaccounts'), {
        params: {
          access_token: connection.accessToken,
          fields: 'id,name',
          limit: 1,
        },
      });

      const accounts = response.data?.data || [];
      return {
        healthy: true,
        apiVersion: this.apiVersion,
        accountId: connection.platformAccountId,
        accountName: accounts[0]?.name,
      };
    } catch (err: any) {
      return {
        healthy: false,
        apiVersion: this.apiVersion,
        error: err.response?.data?.error?.message || err.message,
      };
    }
  }

  async validateConnection(connection: Connection): Promise<boolean> {
    const result = await this.healthCheck(connection);
    return result.healthy;
  }
}
