import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ConnectionsService } from '../../connections/connections.service';
import { Platform } from '../../connections/dto/create-connection.dto';
import { API_VERSIONS } from '../../../common/config/api-versions';

@Injectable()
export class ShopifyProvider {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly redirectUri: string;
  private readonly apiVersion: string;
  private readonly scopes = 'read_orders,read_products,read_analytics';

  constructor(
    configService: ConfigService,
    private connectionsService: ConnectionsService,
  ) {
    this.apiKey = configService.getOrThrow<string>('SHOPIFY_API_KEY');
    this.apiSecret = configService.getOrThrow<string>('SHOPIFY_API_SECRET');
    this.redirectUri = `${configService.getOrThrow<string>('BACKEND_URL')}/oauth/shopify/callback`;
    this.apiVersion = API_VERSIONS.SHOPIFY;
  }

  /**
   * Shopify OAuth requires the shop domain before redirect.
   * shop: e.g. "my-store.myshopify.com"
   */
  getAuthorizationUrl(shop: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.apiKey,
      scope: this.scopes,
      redirect_uri: this.redirectUri,
      state,
    });
    return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(shop: string, code: string): Promise<string> {
    const response = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: this.apiKey,
        client_secret: this.apiSecret,
        code,
      },
    );
    return response.data.access_token as string;
  }

  async getShopInfo(shop: string, accessToken: string): Promise<{ name: string; id: number }> {
    const response = await axios.get(
      `https://${shop}/admin/api/${this.apiVersion}/shop.json`,
      { headers: { 'X-Shopify-Access-Token': accessToken } },
    );
    return { name: response.data.shop.name, id: response.data.shop.id };
  }

  async healthCheck(shop: string, accessToken: string): Promise<{ healthy: boolean; apiVersion: string; error?: string }> {
    try {
      await this.getShopInfo(shop, accessToken);
      return { healthy: true, apiVersion: this.apiVersion };
    } catch (err: any) {
      return {
        healthy: false,
        apiVersion: this.apiVersion,
        error: err.response?.data?.errors || err.message,
      };
    }
  }

  async saveConnection(
    workspaceId: string,
    shop: string,
    shopName: string,
    accessToken: string,
  ) {
    return this.connectionsService.create(workspaceId, {
      platform: Platform.SHOPIFY,
      platformAccountId: shop,       // shop domain is the unique identifier
      platformAccountName: shopName,
      accessToken,
      scopes: this.scopes,
    });
  }
}
