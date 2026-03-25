import { Module } from '@nestjs/common';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { MetaAdsProvider } from './providers/meta-ads.provider';
import { GoogleProvider } from './providers/google.provider';
import { NuvemshopProvider } from './providers/nuvemshop.provider';
import { MercadoLivreProvider } from './providers/mercadolivre.provider';
import { TikTokAdsProvider } from './providers/tiktok-ads.provider';
import { ShopifyProvider } from './providers/shopify.provider';
import { ConnectionsModule } from '../connections/connections.module';

@Module({
  imports: [ConnectionsModule],
  controllers: [OAuthController],
  providers: [
    OAuthService,
    MetaAdsProvider,
    GoogleProvider,
    NuvemshopProvider,
    MercadoLivreProvider,
    TikTokAdsProvider,
    ShopifyProvider,
  ],
  exports: [OAuthService, MercadoLivreProvider],
})
export class OAuthModule {}
