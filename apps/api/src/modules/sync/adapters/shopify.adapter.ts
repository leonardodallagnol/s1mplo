import { Injectable, Logger } from '@nestjs/common';
import { Platform, Connection, OrderStatus } from '@prisma/client';
import axios from 'axios';
import {
  BasePlatformAdapter,
  DateRange,
  UnifiedAdMetric,
  UnifiedOrder,
  UnifiedAnalyticsMetric,
  HealthCheckResult,
} from './base.adapter';
import { API_VERSIONS } from '../../../common/config/api-versions';

@Injectable()
export class ShopifyAdapter extends BasePlatformAdapter {
  platform: Platform = Platform.SHOPIFY;
  apiVersion: string = API_VERSIONS.SHOPIFY;

  private readonly logger = new Logger(ShopifyAdapter.name);

  private baseUrl(shop: string): string {
    return `https://${shop}/admin/api/${this.apiVersion}`;
  }

  private headers(connection: Connection): Record<string, string> {
    return { 'X-Shopify-Access-Token': connection.accessToken };
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        // Respect Shopify rate limit headers
        if (err.response?.status === 429) {
          const retryAfter = parseInt(err.response.headers['retry-after'] || '2', 10);
          this.logger.warn(`Rate limited by Shopify, waiting ${retryAfter}s`);
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          continue;
        }
        if (attempt === maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 1000;
        this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw new Error('Unreachable');
  }

  private mapOrderStatus(financialStatus: string, fulfillmentStatus: string | null): OrderStatus {
    if (financialStatus === 'refunded') return OrderStatus.REFUNDED;
    if (financialStatus === 'voided') return OrderStatus.CANCELED;
    if (financialStatus === 'paid' && fulfillmentStatus === 'fulfilled') return OrderStatus.DELIVERED;
    if (financialStatus === 'paid') return OrderStatus.PAID;
    if (financialStatus === 'pending') return OrderStatus.PENDING;
    return OrderStatus.PENDING;
  }

  private extractUtm(landingSite?: string): {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
  } {
    if (!landingSite) return {};
    try {
      // landingSite may be a path like /?utm_source=...
      const url = landingSite.startsWith('http')
        ? new URL(landingSite)
        : new URL(`https://placeholder.com${landingSite}`);
      return {
        utmSource: url.searchParams.get('utm_source') || undefined,
        utmMedium: url.searchParams.get('utm_medium') || undefined,
        utmCampaign: url.searchParams.get('utm_campaign') || undefined,
        utmContent: url.searchParams.get('utm_content') || undefined,
      };
    } catch {
      return {};
    }
  }

  async fetchAdMetrics(_connection: Connection, _dateRange: DateRange): Promise<UnifiedAdMetric[]> {
    // Shopify does not expose ad platform metrics — use Meta/Google/TikTok adapters for that
    return [];
  }

  async fetchOrders(connection: Connection, dateRange: DateRange): Promise<UnifiedOrder[]> {
    const shop = connection.platformAccountId;

    return this.retryWithBackoff(async () => {
      const allOrders: UnifiedOrder[] = [];
      let pageInfo: string | null = null;
      let hasMore = true;

      while (hasMore) {
        const params: Record<string, string | number> = {
          limit: 250,
          status: 'any',
          created_at_min: dateRange.startDate.toISOString(),
          created_at_max: dateRange.endDate.toISOString(),
          fields: 'id,created_at,financial_status,fulfillment_status,total_price,subtotal_price,total_discounts,total_shipping_price_set,landing_site,customer,billing_address,line_items',
        };

        if (pageInfo) {
          params.page_info = pageInfo;
          // When using cursor pagination, remove date filters
          delete params.created_at_min;
          delete params.created_at_max;
        }

        const response = await axios.get(`${this.baseUrl(shop)}/orders.json`, {
          headers: this.headers(connection),
          params,
        });

        const orders: any[] = response.data.orders || [];

        for (const order of orders) {
          const utms = this.extractUtm(order.landing_site);
          const total = parseFloat(order.total_price) || 0;
          const subtotal = parseFloat(order.subtotal_price) || 0;
          const discount = parseFloat(order.total_discounts) || 0;
          const shipping = parseFloat(
            order.total_shipping_price_set?.shop_money?.amount || '0',
          );

          allOrders.push({
            platformOrderId: String(order.id),
            orderDate: new Date(order.created_at),
            status: this.mapOrderStatus(order.financial_status, order.fulfillment_status),
            subtotal,
            shipping,
            discount,
            total,
            utmSource: utms.utmSource,
            utmMedium: utms.utmMedium,
            utmCampaign: utms.utmCampaign,
            utmContent: utms.utmContent,
            customerEmail: order.customer?.email,
            customerCity: order.billing_address?.city,
            customerState: order.billing_address?.province_code,
            itemCount: (order.line_items || []).length || 1,
          });
        }

        // Shopify cursor-based pagination via Link header
        const linkHeader: string = response.headers['link'] || '';
        const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/);
        if (nextMatch) {
          pageInfo = nextMatch[1];
        } else {
          hasMore = false;
        }
      }

      return allOrders;
    });
  }

  async fetchAnalytics(_connection: Connection, _dateRange: DateRange): Promise<UnifiedAnalyticsMetric[]> {
    // Analytics come from GA4 — not duplicated here
    return [];
  }

  async refreshToken(connection: Connection): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    // Shopify access tokens are permanent — no refresh needed
    return { accessToken: connection.accessToken };
  }

  async healthCheck(connection: Connection): Promise<HealthCheckResult> {
    const shop = connection.platformAccountId;
    try {
      const response = await axios.get(`${this.baseUrl(shop)}/shop.json`, {
        headers: this.headers(connection),
      });
      return {
        healthy: true,
        apiVersion: this.apiVersion,
        accountId: shop,
        accountName: response.data.shop?.name || shop,
      };
    } catch (err: any) {
      return {
        healthy: false,
        apiVersion: this.apiVersion,
        error: err.response?.data?.errors || err.message,
      };
    }
  }

  async validateConnection(connection: Connection): Promise<boolean> {
    const result = await this.healthCheck(connection);
    return result.healthy;
  }
}
