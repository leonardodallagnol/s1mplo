import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Redirect,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly configService: ConfigService,
  ) {}

  // ==================== META ADS ====================

  @UseGuards(JwtAuthGuard)
  @Get('meta-ads/authorize')
  @Redirect()
  metaAdsAuthorize(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    const url = this.oauthService.getMetaAdsAuthUrl(workspaceId);
    return { url };
  }

  @Get('meta-ads/callback')
  async metaAdsCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
  ) {
    if (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      return { redirect: `${frontendUrl}/connections?error=meta_denied` };
    }

    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    return this.oauthService.handleMetaAdsCallback(code, state);
  }

  @UseGuards(JwtAuthGuard)
  @Post('meta-ads/connect')
  connectMetaAccount(
    @Body()
    body: {
      workspaceId: string;
      accountId: string;
      accountName: string;
      accessToken: string;
      expiresIn?: number;
    },
  ) {
    return this.oauthService.connectMetaAdsAccount(
      body.workspaceId,
      body.accountId,
      body.accountName,
      body.accessToken,
      body.expiresIn,
    );
  }

  // ==================== GOOGLE ====================

  @UseGuards(JwtAuthGuard)
  @Get('google/authorize')
  @Redirect()
  googleAuthorize(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    const url = this.oauthService.getGoogleAuthUrl(workspaceId);
    return { url };
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
  ) {
    if (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      return { redirect: `${frontendUrl}/connections?error=google_denied` };
    }

    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    return this.oauthService.handleGoogleCallback(code, state);
  }

  @UseGuards(JwtAuthGuard)
  @Post('google/connect')
  connectGoogleAccount(
    @Body()
    body: {
      workspaceId: string;
      connectType: 'ads' | 'analytics' | 'both';
      tokens: { accessToken: string; refreshToken: string; expiresIn: number };
      adsAccount?: { customerId: string; descriptiveName: string };
      analyticsProperty?: { propertyId: string; displayName: string };
    },
  ) {
    return this.oauthService.connectGoogleAccount(
      body.workspaceId,
      body.connectType,
      body.tokens,
      body.adsAccount,
      body.analyticsProperty,
    );
  }

  // ==================== NUVEMSHOP ====================

  @UseGuards(JwtAuthGuard)
  @Get('nuvemshop/authorize')
  @Redirect()
  nuvemshopAuthorize(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    const url = this.oauthService.getNuvemshopAuthUrl(workspaceId);
    return { url };
  }

  @Get('nuvemshop/callback')
  async nuvemshopCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
  ) {
    if (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      return { redirect: `${frontendUrl}/connections?error=nuvemshop_denied` };
    }

    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    return this.oauthService.handleNuvemshopCallback(code, state);
  }

  // ==================== TIKTOK ADS ====================

  @UseGuards(JwtAuthGuard)
  @Get('tiktok-ads/authorize')
  @Redirect()
  tikTokAdsAuthorize(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    const url = this.oauthService.getTikTokAdsAuthUrl(workspaceId);
    return { url };
  }

  @Get('tiktok-ads/callback')
  async tikTokAdsCallback(
    @Query('auth_code') authCode: string,
    @Query('state') state: string,
    @Query('error') error: string,
  ) {
    if (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      return { redirect: `${frontendUrl}/connections?error=tiktok_denied` };
    }

    if (!authCode || !state) {
      throw new BadRequestException('Missing auth_code or state');
    }

    return this.oauthService.handleTikTokAdsCallback(authCode, state);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tiktok-ads/connect')
  connectTikTokAdsAccount(
    @Body()
    body: {
      workspaceId: string;
      advertiserId: string;
      advertiserName: string;
      accessToken: string;
    },
  ) {
    return this.oauthService.connectTikTokAdsAdvertiser(
      body.workspaceId,
      body.advertiserId,
      body.advertiserName,
      body.accessToken,
    );
  }

  // ==================== MERCADO LIVRE ====================

  @UseGuards(JwtAuthGuard)
  @Get('mercadolivre/authorize')
  @Redirect()
  mercadoLivreAuthorize(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    const url = this.oauthService.getMercadoLivreAuthUrl(workspaceId);
    return { url };
  }

  @Get('mercadolivre/callback')
  async mercadoLivreCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
  ) {
    if (error) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      return { redirect: `${frontendUrl}/connections?error=mercadolivre_denied` };
    }

    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    return this.oauthService.handleMercadoLivreCallback(code, state);
  }
}
