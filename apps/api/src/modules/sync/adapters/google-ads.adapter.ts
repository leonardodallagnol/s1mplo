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
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleAdsAdapter extends BasePlatformAdapter {
  platform: Platform = Platform.GOOGLE_ADS;
  apiVersion: string = API_VERSIONS.GOOGLE_ADS;

  private readonly logger = new Logger(GoogleAdsAdapter.name);
  private readonly developerToken: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private configService: ConfigService) {
    super();
    this.developerToken = configService.getOrThrow<string>('GOOGLE_DEVELOPER_TOKEN');
    this.clientId = configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.clientSecret = configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
  }

  private get baseUrl(): string {
    return `https://googleads.googleapis.com/${this.apiVersion}`;
  }

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

  private buildHeaders(connection: Connection): Record<string, string> {
    return {
      Authorization: `Bearer ${connection.accessToken}`,
      'developer-token': this.developerToken,
    };
  }

  async fetchAdMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<UnifiedAdMetric[]> {
    const customerId = connection.platformAccountId;
    const since = dateRange.startDate.toISOString().split('T')[0];
    const until = dateRange.endDate.toISOString().split('T')[0];

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.all_conversions,
        metrics.view_through_conversions
      FROM campaign
      WHERE segments.date BETWEEN '${since}' AND '${until}'
        AND campaign.status != 'REMOVED'
      ORDER BY segments.date DESC
    `;

    return this.retryWithBackoff(async () => {
      const response = await axios.post(
        `${this.baseUrl}/customers/${customerId}/googleAds:searchStream`,
        { query },
        { headers: this.buildHeaders(connection) },
      );

      const metrics: UnifiedAdMetric[] = [];

      for (const batch of response.data || []) {
        for (const row of batch.results || []) {
          metrics.push({
            date: new Date(row.segments?.date),
            platform: Platform.GOOGLE_ADS,
            impressions: Number(row.metrics?.impressions) || 0,
            clicks: Number(row.metrics?.clicks) || 0,
            spend: (Number(row.metrics?.costMicros) || 0) / 1_000_000,
            conversions: parseFloat(row.metrics?.conversions) || 0,
            revenue: parseFloat(row.metrics?.conversionsValue) || 0,
            addToCart: 0,
            initiateCheckout: 0,
            purchases: Math.round(parseFloat(row.metrics?.conversions) || 0),
            campaignId: row.campaign?.id?.toString(),
            campaignName: row.campaign?.name,
            adSetId: row.adGroup?.id?.toString(),
            adSetName: row.adGroup?.name,
          });
        }
      }

      return metrics;
    });
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
    if (!connection.refreshToken) {
      throw new Error('No refresh token available for Google Ads connection');
    }

    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: connection.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return {
      accessToken: response.data.access_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
    };
  }

  async healthCheck(connection: Connection): Promise<HealthCheckResult> {
    try {
      const customerId = connection.platformAccountId;
      const response = await axios.post(
        `${this.baseUrl}/customers/${customerId}/googleAds:searchStream`,
        { query: 'SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1' },
        { headers: this.buildHeaders(connection) },
      );

      const name = response.data?.[0]?.results?.[0]?.customer?.descriptiveName;
      return {
        healthy: true,
        apiVersion: this.apiVersion,
        accountId: customerId,
        accountName: name,
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
