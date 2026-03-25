import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export enum Platform {
  META_ADS = 'META_ADS',
  GOOGLE_ADS = 'GOOGLE_ADS',
  GOOGLE_ANALYTICS = 'GOOGLE_ANALYTICS',
  TIKTOK_ADS = 'TIKTOK_ADS',
  NUVEMSHOP = 'NUVEMSHOP',
  MERCADO_LIVRE = 'MERCADO_LIVRE',
  SHOPIFY = 'SHOPIFY',
}

export class CreateConnectionDto {
  @IsEnum(Platform)
  platform: Platform;

  @IsString()
  @IsNotEmpty()
  platformAccountId: string;

  @IsOptional()
  @IsString()
  platformAccountName?: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  tokenExpiresAt?: Date;

  @IsOptional()
  @IsString()
  scopes?: string;
}
