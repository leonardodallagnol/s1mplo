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
export class GoogleAnalyticsAdapter extends BasePlatformAdapter {
  platform: Platform = Platform.GOOGLE_ANALYTICS;
  apiVersion: string = API_VERSIONS.GOOGLE_ANALYTICS;

  private readonly logger = new Logger(GoogleAnalyticsAdapter.name);
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private configService: ConfigService) {
    super();
    this.clientId = configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.clientSecret = configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
  }

  private get baseUrl(): string {
    return `https://analyticsdata.googleapis.com/${this.apiVersion}`;
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

  async fetchAdMetrics(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<UnifiedAdMetric[]> {
    return [];
  }

  async fetchOrders(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<UnifiedOrder[]> {
    return [];
  }

  async fetchAnalytics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<UnifiedAnalyticsMetric[]> {
    const propertyId = connection.platformAccountId;
    const since = dateRange.startDate.toISOString().split('T')[0];
    const until = dateRange.endDate.toISOString().split('T')[0];

    return this.retryWithBackoff(async () => {
      const response = await axios.post(
        `${this.baseUrl}/properties/${propertyId}:runReport`,
        {
          dateRanges: [{ startDate: since, endDate: until }],
          dimensions: [
            { name: 'date' },
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'sessionCampaignName' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'transactions' },
            { name: 'purchaseRevenue' },
            { name: 'addToCarts' },
            { name: 'checkouts' },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const rows = response.data.rows || [];
      const dimensionHeaders: string[] = (response.data.dimensionHeaders || []).map(
        (h: any) => h.name,
      );
      const metricHeaders: string[] = (response.data.metricHeaders || []).map(
        (h: any) => h.name,
      );

      return rows.map((row: any): UnifiedAnalyticsMetric => {
        const dims: Record<string, string> = {};
        row.dimensionValues?.forEach((v: any, i: number) => {
          dims[dimensionHeaders[i]] = v.value;
        });

        const mets: Record<string, number> = {};
        row.metricValues?.forEach((v: any, i: number) => {
          mets[metricHeaders[i]] = parseFloat(v.value) || 0;
        });

        // GA4 date format: YYYYMMDD
        const rawDate = dims['date'];
        const date = rawDate
          ? new Date(`${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`)
          : new Date();

        return {
          date,
          sessions: Math.round(mets['sessions'] || 0),
          users: Math.round(mets['activeUsers'] || 0),
          newUsers: Math.round(mets['newUsers'] || 0),
          pageviews: Math.round(mets['screenPageViews'] || 0),
          bounceRate: mets['bounceRate'],
          avgSessionDuration: mets['averageSessionDuration'],
          source: dims['sessionSource'] || undefined,
          medium: dims['sessionMedium'] || undefined,
          campaign: dims['sessionCampaignName'] || undefined,
          transactions: Math.round(mets['transactions'] || 0),
          ecommerceRevenue: mets['purchaseRevenue'],
          addToCarts: Math.round(mets['addToCarts'] || 0),
          checkouts: Math.round(mets['checkouts'] || 0),
        };
      });
    });
  }

  async refreshToken(connection: Connection): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }> {
    if (!connection.refreshToken) {
      throw new Error('No refresh token available for Google Analytics connection');
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
      const propertyId = connection.platformAccountId;
      const response = await axios.get(
        `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}`,
        { headers: { Authorization: `Bearer ${connection.accessToken}` } },
      );

      return {
        healthy: true,
        apiVersion: this.apiVersion,
        accountId: propertyId,
        accountName: response.data.displayName,
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
