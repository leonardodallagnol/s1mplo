/**
 * Centralized API version configuration.
 * Update here when platforms release new API versions.
 * Also configurable via environment variables for zero-downtime version upgrades.
 */
export const API_VERSIONS = {
  META_ADS: process.env.META_API_VERSION || 'v21.0',
  GOOGLE_ADS: process.env.GOOGLE_ADS_API_VERSION || 'v17',
  TIKTOK_ADS: process.env.TIKTOK_API_VERSION || 'v1.3',
  NUVEMSHOP: process.env.NUVEMSHOP_API_VERSION || 'v1',
  MERCADO_LIVRE: process.env.ML_API_VERSION || 'v1',
  GOOGLE_ANALYTICS: 'v1beta', // GA4 Data API — stable version
  SHOPIFY: process.env.SHOPIFY_API_VERSION || '2024-01',
} as const;

export type ApiVersionKey = keyof typeof API_VERSIONS;
