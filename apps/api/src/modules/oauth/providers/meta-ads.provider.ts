import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ConnectionsService } from '../../connections/connections.service';
import { Platform } from '../../connections/dto/create-connection.dto';
import { API_VERSIONS } from '../../../common/config/api-versions';

@Injectable()
export class MetaAdsProvider {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;
  private readonly apiVersion: string;

  constructor(
    configService: ConfigService,
    private connectionsService: ConnectionsService,
  ) {
    this.appId = configService.getOrThrow<string>('META_APP_ID');
    this.appSecret = configService.getOrThrow<string>('META_APP_SECRET');
    this.redirectUri = `${configService.getOrThrow<string>('BACKEND_URL')}/oauth/meta-ads/callback`;
    this.apiVersion = API_VERSIONS.META_ADS;
  }

  private graphUrl(path: string): string {
    return `https://graph.facebook.com/${this.apiVersion}${path}`;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: 'ads_read,ads_management,read_insights',
      state,
      response_type: 'code',
    });

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    tokenType: string;
    expiresIn?: number;
  }> {
    const response = await axios.get(this.graphUrl('/oauth/access_token'), {
      params: {
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: this.redirectUri,
        code,
      },
    });

    return {
      accessToken: response.data.access_token,
      tokenType: response.data.token_type,
      expiresIn: response.data.expires_in,
    };
  }

  async getLongLivedToken(shortLivedToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await axios.get(this.graphUrl('/oauth/access_token'), {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        fb_exchange_token: shortLivedToken,
      },
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }

  async getAdAccounts(accessToken: string): Promise<
    Array<{
      id: string;
      name: string;
      account_status: number;
      currency: string;
    }>
  > {
    const response = await axios.get(this.graphUrl('/me/adaccounts'), {
      params: {
        access_token: accessToken,
        fields: 'id,name,account_status,currency',
        limit: 50,
      },
    });

    return response.data.data;
  }

  async healthCheck(accessToken: string, accountId: string): Promise<{
    healthy: boolean;
    apiVersion: string;
    error?: string;
  }> {
    try {
      await axios.get(this.graphUrl(`/act_${accountId.replace('act_', '')}`), {
        params: {
          access_token: accessToken,
          fields: 'id,name,account_status',
        },
      });
      return { healthy: true, apiVersion: this.apiVersion };
    } catch (err: any) {
      return {
        healthy: false,
        apiVersion: this.apiVersion,
        error: err.response?.data?.error?.message || 'Health check failed',
      };
    }
  }

  async saveConnection(
    workspaceId: string,
    accountId: string,
    accountName: string,
    accessToken: string,
    expiresIn?: number,
  ) {
    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : undefined;

    return this.connectionsService.create(workspaceId, {
      platform: Platform.META_ADS,
      platformAccountId: accountId,
      platformAccountName: accountName,
      accessToken,
      scopes: 'ads_read,ads_management,read_insights',
      tokenExpiresAt,
    });
  }
}
