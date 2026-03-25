import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MetaAdsProvider } from './providers/meta-ads.provider';
import { GoogleProvider } from './providers/google.provider';
import { NuvemshopProvider } from './providers/nuvemshop.provider';
import { MercadoLivreProvider } from './providers/mercadolivre.provider';
import { TikTokAdsProvider } from './providers/tiktok-ads.provider';
import { ShopifyProvider } from './providers/shopify.provider';

@Injectable()
export class OAuthService {
  constructor(
    private configService: ConfigService,
    private metaAdsProvider: MetaAdsProvider,
    private googleProvider: GoogleProvider,
    private nuvemshopProvider: NuvemshopProvider,
    private mercadoLivreProvider: MercadoLivreProvider,
    private tikTokAdsProvider: TikTokAdsProvider,
    private shopifyProvider: ShopifyProvider,
  ) {}

  // ==================== STATE MANAGEMENT ====================

  encryptState(data: Record<string, string>): string {
    const json = JSON.stringify(data);
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(secret).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decryptState(state: string): Record<string, string> {
    try {
      const [ivHex, encryptedHex] = state.split(':');
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      const key = crypto.createHash('sha256').update(secret).digest();
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return JSON.parse(decrypted.toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid OAuth state');
    }
  }

  // ==================== META ADS ====================

  getMetaAdsAuthUrl(workspaceId: string): string {
    const state = this.encryptState({ workspaceId });
    return this.metaAdsProvider.getAuthorizationUrl(state);
  }

  async handleMetaAdsCallback(code: string, state: string) {
    const { workspaceId } = this.decryptState(state);

    const { accessToken: shortLivedToken } =
      await this.metaAdsProvider.exchangeCodeForToken(code);

    const { accessToken, expiresIn: longExpiresIn } =
      await this.metaAdsProvider.getLongLivedToken(shortLivedToken);

    const adAccounts = await this.metaAdsProvider.getAdAccounts(accessToken);

    return {
      workspaceId,
      accessToken,
      expiresIn: longExpiresIn,
      adAccounts,
    };
  }

  async connectMetaAdsAccount(
    workspaceId: string,
    accountId: string,
    accountName: string,
    accessToken: string,
    expiresIn?: number,
  ) {
    return this.metaAdsProvider.saveConnection(
      workspaceId,
      accountId,
      accountName,
      accessToken,
      expiresIn,
    );
  }

  // ==================== GOOGLE ====================

  getGoogleAuthUrl(workspaceId: string): string {
    const state = this.encryptState({ workspaceId, provider: 'google' });
    return this.googleProvider.getAuthorizationUrl(state);
  }

  async handleGoogleCallback(code: string, state: string) {
    const { workspaceId } = this.decryptState(state);

    const tokens = await this.googleProvider.exchangeCodeForToken(code);
    const developerToken =
      this.configService.get<string>('GOOGLE_DEVELOPER_TOKEN') || '';

    const [adsAccounts, ga4Properties] = await Promise.all([
      this.googleProvider.getGoogleAdsAccounts(tokens.accessToken, developerToken),
      this.googleProvider.getGA4Properties(tokens.accessToken),
    ]);

    return {
      workspaceId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      adsAccounts,
      ga4Properties,
    };
  }

  async connectGoogleAccount(
    workspaceId: string,
    connectType: 'ads' | 'analytics' | 'both',
    tokens: { accessToken: string; refreshToken: string; expiresIn: number },
    adsAccount?: { customerId: string; descriptiveName: string },
    analyticsProperty?: { propertyId: string; displayName: string },
  ) {
    return this.googleProvider.saveConnections(
      workspaceId,
      connectType,
      tokens,
      adsAccount,
      analyticsProperty,
    );
  }

  // ==================== NUVEMSHOP ====================

  getNuvemshopAuthUrl(workspaceId: string): string {
    const state = this.encryptState({ workspaceId, provider: 'nuvemshop' });
    return this.nuvemshopProvider.getAuthorizationUrl(state);
  }

  async handleNuvemshopCallback(code: string, state: string) {
    const { workspaceId } = this.decryptState(state);

    const { accessToken, userId } =
      await this.nuvemshopProvider.exchangeCodeForToken(code);

    const storeInfo = await this.nuvemshopProvider.getStoreInfo(accessToken, userId);

    const connection = await this.nuvemshopProvider.saveConnection(
      workspaceId,
      accessToken,
      userId,
      storeInfo.name,
    );

    return {
      workspaceId,
      connection,
      storeName: storeInfo.name,
    };
  }

  // ==================== TIKTOK ADS ====================

  getTikTokAdsAuthUrl(workspaceId: string): string {
    const state = this.encryptState({ workspaceId, provider: 'tiktok-ads' });
    return this.tikTokAdsProvider.getAuthorizationUrl(state);
  }

  async handleTikTokAdsCallback(code: string, state: string) {
    const { workspaceId } = this.decryptState(state);

    const { accessToken } = await this.tikTokAdsProvider.exchangeCodeForToken(code);
    const advertisers = await this.tikTokAdsProvider.getAdvertisers(accessToken);

    return {
      workspaceId,
      advertisers,
      accessToken,
    };
  }

  async connectTikTokAdsAdvertiser(
    workspaceId: string,
    advertiserId: string,
    advertiserName: string,
    accessToken: string,
  ) {
    return this.tikTokAdsProvider.saveConnection(
      workspaceId,
      advertiserId,
      advertiserName,
      accessToken,
    );
  }

  // ==================== SHOPIFY ====================

  getShopifyAuthUrl(workspaceId: string, shop: string): string {
    const state = this.encryptState({ workspaceId, shop, provider: 'shopify' });
    return this.shopifyProvider.getAuthorizationUrl(shop, state);
  }

  async handleShopifyCallback(shop: string, code: string, state: string) {
    const { workspaceId } = this.decryptState(state);

    const accessToken = await this.shopifyProvider.exchangeCodeForToken(shop, code);
    const shopInfo = await this.shopifyProvider.getShopInfo(shop, accessToken);

    const connection = await this.shopifyProvider.saveConnection(
      workspaceId,
      shop,
      shopInfo.name,
      accessToken,
    );

    return { workspaceId, connection, shopName: shopInfo.name };
  }

  // ==================== MERCADO LIVRE ====================

  getMercadoLivreAuthUrl(workspaceId: string): string {
    const state = this.encryptState({ workspaceId, provider: 'mercadolivre' });
    return this.mercadoLivreProvider.getAuthorizationUrl(state);
  }

  async handleMercadoLivreCallback(code: string, state: string) {
    const { workspaceId } = this.decryptState(state);

    const { accessToken, refreshToken, userId, expiresIn } =
      await this.mercadoLivreProvider.exchangeCodeForToken(code);

    const userInfo = await this.mercadoLivreProvider.getUserInfo(accessToken);

    const connection = await this.mercadoLivreProvider.saveConnection(
      workspaceId,
      accessToken,
      refreshToken,
      userId,
      userInfo.nickname,
      expiresIn,
    );

    // Register webhook in background (non-blocking)
    this.mercadoLivreProvider
      .configureWebhook(accessToken, userId)
      .catch(() => {/* already logged in provider */});

    return {
      workspaceId,
      connection,
      accountName: userInfo.nickname,
    };
  }
}
