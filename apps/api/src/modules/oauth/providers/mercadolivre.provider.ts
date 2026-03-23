import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ConnectionsService } from '../../connections/connections.service';
import { Platform } from '../../connections/dto/create-connection.dto';

@Injectable()
export class MercadoLivreProvider {
  private readonly logger = new Logger(MercadoLivreProvider.name);

  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  private readonly ML_BASE = 'https://api.mercadolibre.com';

  constructor(
    private configService: ConfigService,
    private connectionsService: ConnectionsService,
  ) {
    this.appId = configService.getOrThrow<string>('ML_APP_ID');
    this.appSecret = configService.getOrThrow<string>('ML_SECRET_KEY');
    this.redirectUri = `${configService.getOrThrow<string>('BACKEND_URL')}/oauth/mercadolivre/callback`;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      state,
    });

    return `https://auth.mercadolivre.com.br/authorization?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    expiresIn: number;
  }> {
    const response = await axios.post(
      `${this.ML_BASE}/oauth/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.appId,
        client_secret: this.appSecret,
        code,
        redirect_uri: this.redirectUri,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' } },
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      userId: response.data.user_id?.toString(),
      expiresIn: response.data.expires_in || 21600, // 6 hours
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await axios.post(
      `${this.ML_BASE}/oauth/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.appId,
        client_secret: this.appSecret,
        refresh_token: refreshToken,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' } },
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in || 21600,
    };
  }

  async getUserInfo(accessToken: string): Promise<{
    id: string;
    nickname: string;
    email: string;
  }> {
    const response = await axios.get(`${this.ML_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      id: response.data.id?.toString(),
      nickname: response.data.nickname,
      email: response.data.email,
    };
  }

  async configureWebhook(accessToken: string, userId: string): Promise<void> {
    const notificationUrl = `${this.configService.getOrThrow<string>('BACKEND_URL')}/webhooks/mercadolivre`;

    try {
      await axios.post(
        `${this.ML_BASE}/applications/${this.appId}/subscriptions/orders_v2`,
        {
          topic: 'orders_v2',
          callback_url: notificationUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Webhook configured for ML user ${userId}`);
    } catch (err: any) {
      this.logger.warn(`Failed to configure ML webhook: ${err.message}`);
      // Non-fatal — sync still works via polling
    }
  }

  async saveConnection(
    workspaceId: string,
    accessToken: string,
    refreshToken: string,
    userId: string,
    accountName: string,
    expiresIn: number,
  ) {
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    return this.connectionsService.create(workspaceId, {
      platform: Platform.MERCADO_LIVRE,
      platformAccountId: userId,
      platformAccountName: accountName,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      scopes: 'read,write,offline_access',
    });
  }
}
