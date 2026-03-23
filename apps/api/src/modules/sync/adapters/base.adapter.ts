import { Platform, Connection, OrderStatus } from '@prisma/client';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface UnifiedAdMetric {
  date: Date;
  platform: Platform;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  addToCart: number;
  initiateCheckout: number;
  purchases: number;
  campaignId?: string;
  campaignName?: string;
  adSetId?: string;
  adSetName?: string;
}

export interface UnifiedOrder {
  platformOrderId: string;
  orderDate: Date;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  customerEmail?: string;
  customerCity?: string;
  customerState?: string;
  itemCount: number;
}

export interface UnifiedAnalyticsMetric {
  date: Date;
  sessions: number;
  users: number;
  newUsers: number;
  pageviews: number;
  bounceRate?: number;
  avgSessionDuration?: number;
  source?: string;
  medium?: string;
  campaign?: string;
  transactions: number;
  ecommerceRevenue?: number;
  addToCarts: number;
  checkouts: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  apiVersion: string;
  accountId?: string;
  accountName?: string;
  error?: string;
}

export abstract class BasePlatformAdapter {
  abstract platform: Platform;
  abstract apiVersion: string;

  // For ad platforms (Meta, Google, TikTok)
  abstract fetchAdMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<UnifiedAdMetric[]>;

  // For e-commerce platforms (Nuvemshop, ML)
  abstract fetchOrders(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<UnifiedOrder[]>;

  // For analytics platforms (GA4)
  abstract fetchAnalytics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<UnifiedAnalyticsMetric[]>;

  abstract refreshToken(connection: Connection): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }>;

  abstract validateConnection(connection: Connection): Promise<boolean>;

  /**
   * Validates that the token is valid AND the API version is still operational.
   * Called before syncs and periodically to detect platform API deprecations.
   */
  abstract healthCheck(connection: Connection): Promise<HealthCheckResult>;
}
