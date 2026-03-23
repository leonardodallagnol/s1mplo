import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ConnectionsService } from '../../connections/connections.service';
import { Platform } from '../../connections/dto/create-connection.dto';

@Injectable()
export class GoogleProvider {
  private readonly logger = new Logger(GoogleProvider.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private configService: ConfigService,
    private connectionsService: ConnectionsService,
  ) {
    this.clientId = configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.clientSecret = configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
    this.redirectUri = `${configService.getOrThrow<string>('BACKEND_URL')}/oauth/google/callback`;
  }

  getAuthorizationUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/analytics.readonly',
      'openid',
      'email',
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  }> {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }

  async getGoogleAdsAccounts(
    accessToken: string,
    developerToken: string,
    managerCustomerId?: string,
  ): Promise<Array<{ customerId: string; descriptiveName: string; currencyCode: string }>> {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': developerToken,
      };

      if (managerCustomerId) {
        headers['login-customer-id'] = managerCustomerId;
      }

      const response = await axios.post(
        'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers',
        {},
        { headers },
      );

      const resourceNames: string[] = response.data.resourceNames || [];
      const accounts: Array<{ customerId: string; descriptiveName: string; currencyCode: string }> = [];

      for (const resourceName of resourceNames.slice(0, 20)) {
        const customerId = resourceName.replace('customers/', '');
        try {
          const infoResponse = await axios.post(
            `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`,
            {
              query: `SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1`,
            },
            { headers },
          );

          const results = infoResponse.data?.[0]?.results?.[0];
          if (results) {
            accounts.push({
              customerId,
              descriptiveName: results.customer?.descriptiveName || customerId,
              currencyCode: results.customer?.currencyCode || 'BRL',
            });
          }
        } catch {
          accounts.push({ customerId, descriptiveName: customerId, currencyCode: 'BRL' });
        }
      }

      return accounts;
    } catch (err: any) {
      this.logger.error('Failed to list Google Ads accounts', err.message);
      return [];
    }
  }

  async getGA4Properties(accessToken: string): Promise<
    Array<{ propertyId: string; displayName: string; websiteUri?: string }>
  > {
    try {
      const response = await axios.get(
        'https://analyticsadmin.googleapis.com/v1beta/properties',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { filter: 'parent:accounts/-' },
        },
      );

      const properties = response.data.properties || [];
      return properties.map((p: any) => ({
        propertyId: p.name.replace('properties/', ''),
        displayName: p.displayName,
        websiteUri: p.websiteUri,
      }));
    } catch (err: any) {
      this.logger.error('Failed to list GA4 properties', err.message);
      return [];
    }
  }

  /**
   * Save 1 or 2 connections — both sharing the same refresh_token.
   * connectType: 'ads' | 'analytics' | 'both'
   */
  async saveConnections(
    workspaceId: string,
    connectType: 'ads' | 'analytics' | 'both',
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    },
    adsAccount?: { customerId: string; descriptiveName: string },
    analyticsProperty?: { propertyId: string; displayName: string },
  ) {
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
    const results: any[] = [];

    if ((connectType === 'ads' || connectType === 'both') && adsAccount) {
      const conn = await this.connectionsService.create(workspaceId, {
        platform: Platform.GOOGLE_ADS,
        platformAccountId: adsAccount.customerId,
        platformAccountName: adsAccount.descriptiveName,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: expiresAt,
        scopes: 'https://www.googleapis.com/auth/adwords',
      });
      results.push(conn);
    }

    if ((connectType === 'analytics' || connectType === 'both') && analyticsProperty) {
      const conn = await this.connectionsService.create(workspaceId, {
        platform: Platform.GOOGLE_ANALYTICS,
        platformAccountId: analyticsProperty.propertyId,
        platformAccountName: analyticsProperty.displayName,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: expiresAt,
        scopes: 'https://www.googleapis.com/auth/analytics.readonly',
      });
      results.push(conn);
    }

    return results;
  }
}
