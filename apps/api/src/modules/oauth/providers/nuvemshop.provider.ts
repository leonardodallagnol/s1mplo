import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ConnectionsService } from '../../connections/connections.service';
import { Platform } from '../../connections/dto/create-connection.dto';
import { API_VERSIONS } from '../../../common/config/api-versions';

@Injectable()
export class NuvemshopProvider {
  private readonly logger = new Logger(NuvemshopProvider.name);

  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;

  constructor(
    private configService: ConfigService,
    private connectionsService: ConnectionsService,
  ) {
    this.appId = configService.getOrThrow<string>('NUVEMSHOP_APP_ID');
    this.appSecret = configService.getOrThrow<string>('NUVEMSHOP_APP_SECRET');
    this.redirectUri = `${configService.getOrThrow<string>('BACKEND_URL')}/oauth/nuvemshop/callback`;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({ state });
    return `https://www.tiendanube.com/apps/${this.appId}/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    userId: string;
  }> {
    const response = await axios.post(
      'https://www.tiendanube.com/apps/authorize/token',
      new URLSearchParams({
        client_id: this.appId,
        client_secret: this.appSecret,
        grant_type: 'authorization_code',
        code,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return {
      accessToken: response.data.access_token,
      userId: response.data.user_id?.toString(),
    };
  }

  async getStoreInfo(accessToken: string, storeId: string): Promise<{
    name: string;
    email: string;
  }> {
    try {
      const response = await axios.get(
        `https://api.tiendanube.com/${API_VERSIONS.NUVEMSHOP}/${storeId}/store`,
        {
          headers: {
            Authentication: `bearer ${accessToken}`,
            'User-Agent': 'S1mplo/1.0 (contato@s1mplo.com)',
          },
        },
      );
      return {
        name: response.data.name?.pt || response.data.name?.es || storeId,
        email: response.data.email || '',
      };
    } catch {
      return { name: storeId, email: '' };
    }
  }

  async saveConnection(
    workspaceId: string,
    accessToken: string,
    storeId: string,
    storeName?: string,
  ) {
    return this.connectionsService.create(workspaceId, {
      platform: Platform.NUVEMSHOP,
      platformAccountId: storeId,
      platformAccountName: storeName || storeId,
      accessToken,
      scopes: 'read_orders,read_products,read_customers',
    });
  }
}
