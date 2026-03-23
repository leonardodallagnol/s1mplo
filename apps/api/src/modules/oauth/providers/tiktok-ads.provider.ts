import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ConnectionsService } from '../../connections/connections.service';
import { Platform } from '../../connections/dto/create-connection.dto';

@Injectable()
export class TikTokAdsProvider {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  constructor(
    configService: ConfigService,
    private connectionsService: ConnectionsService,
  ) {
    this.appId = configService.getOrThrow<string>('TIKTOK_APP_ID');
    this.appSecret = configService.getOrThrow<string>('TIKTOK_APP_SECRET');
    this.redirectUri = `${configService.getOrThrow<string>('BACKEND_URL')}/oauth/tiktok-ads/callback`;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      app_id: this.appId,
      redirect_uri: this.redirectUri,
      state,
    });

    return `https://business-api.tiktok.com/portal/auth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    scope: string;
  }> {
    const response = await axios.post(
      'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
      {
        app_id: this.appId,
        secret: this.appSecret,
        auth_code: code,
      },
    );

    const data = response.data.data;
    return {
      accessToken: data.access_token,
      scope: data.scope || '',
    };
  }

  async getAdvertisers(accessToken: string): Promise<
    Array<{
      advertiser_id: string;
      advertiser_name: string;
    }>
  > {
    const response = await axios.get(
      'https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/',
      {
        params: {
          access_token: accessToken,
          app_id: this.appId,
          secret: this.appSecret,
        },
      },
    );

    return response.data.data?.list || [];
  }

  async saveConnection(
    workspaceId: string,
    advertiserId: string,
    advertiserName: string,
    accessToken: string,
  ) {
    return this.connectionsService.create(workspaceId, {
      platform: Platform.TIKTOK_ADS,
      platformAccountId: advertiserId,
      platformAccountName: advertiserName,
      accessToken,
      scopes: 'ad.read',
    });
  }

  async healthCheck(accessToken: string, advertiserId: string): Promise<{
    healthy: boolean;
    error?: string;
  }> {
    try {
      await axios.get(
        'https://business-api.tiktok.com/open_api/v1.3/advertiser/info/',
        {
          params: {
            access_token: accessToken,
            advertiser_ids: JSON.stringify([advertiserId]),
          },
        },
      );
      return { healthy: true };
    } catch (err: any) {
      return {
        healthy: false,
        error: err.response?.data?.message || err.message,
      };
    }
  }
}
