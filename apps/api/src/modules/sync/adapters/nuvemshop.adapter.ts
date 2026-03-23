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
export class NuvemshopAdapter extends BasePlatformAdapter {
  platform: Platform = Platform.NUVEMSHOP;
  apiVersion: string = API_VERSIONS.NUVEMSHOP;

  private readonly logger = new Logger(NuvemshopAdapter.name);

  private baseUrl(storeId: string): string {
    return `https://api.tiendanube.com/${this.apiVersion}/${storeId}`;
  }

  private getHeaders(connection: Connection): Record<string, string> {
    return {
      Authentication: `bearer ${connection.accessToken}`,
      'User-Agent': 'S1mplo/1.0 (contato@s1mplo.com)',
      'Content-Type': 'application/json',
    };
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === maxRetries) throw err;
        const delay = Math.pow(2, attempt) * 1000;
        this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw new Error('Unreachable');
  }

  private mapOrderStatus(nuvemStatus: string): OrderStatus {
    const map: Record<string, OrderStatus> = {
      open: OrderStatus.PENDING,
      closed: OrderStatus.DELIVERED,
      cancelled: OrderStatus.CANCELED,
      paid: OrderStatus.PAID,
    };
    return map[nuvemStatus?.toLowerCase()] || OrderStatus.PENDING;
  }

  private extractUtmFromUrl(url?: string): {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
  } {
    if (!url) return {};
    try {
      const parsed = new URL(url);
      return {
        utmSource: parsed.searchParams.get('utm_source') || undefined,
        utmMedium: parsed.searchParams.get('utm_medium') || undefined,
        utmCampaign: parsed.searchParams.get('utm_campaign') || undefined,
        utmContent: parsed.searchParams.get('utm_content') || undefined,
      };
    } catch {
      return {};
    }
  }

  async fetchAdMetrics(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<UnifiedAdMetric[]> {
    return [];
  }

  async fetchOrders(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<UnifiedOrder[]> {
    const storeId = connection.platformAccountId;
    const since = dateRange.startDate.toISOString();
    const until = dateRange.endDate.toISOString();

    return this.retryWithBackoff(async () => {
      const allOrders: UnifiedOrder[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${this.baseUrl(storeId)}/orders`, {
          headers: this.getHeaders(connection),
          params: {
            per_page: 200,
            page,
            created_at_min: since,
            created_at_max: until,
            sort_by: 'created-at-ascending',
          },
        });

        const orders: any[] = response.data || [];
        if (orders.length === 0) {
          hasMore = false;
          break;
        }

        for (const order of orders) {
          const utms =
            this.extractUtmFromUrl(order.referring_url) ||
            {};

          // Also try marketing object if present
          if (!utms.utmSource && order.marketing) {
            utms.utmSource = order.marketing.type;
          }

          const subtotal = parseFloat(order.subtotal) || 0;
          const shipping = parseFloat(order.shipping_cost_owner) || 0;
          const discount = parseFloat(order.discount) || 0;
          const total = parseFloat(order.total) || 0;

          allOrders.push({
            platformOrderId: order.id?.toString(),
            orderDate: new Date(order.created_at),
            status: this.mapOrderStatus(order.status),
            subtotal,
            shipping,
            discount,
            total,
            utmSource: utms.utmSource,
            utmMedium: utms.utmMedium,
            utmCampaign: utms.utmCampaign,
            utmContent: utms.utmContent,
            customerEmail: order.contact_email || order.customer?.email,
            customerCity: order.billing_address?.city || order.customer?.billing_address?.city,
            customerState: order.billing_address?.province || order.customer?.billing_address?.province,
            itemCount: (order.products || []).length || 1,
          });
        }

        // Nuvemshop returns up to 200 per page; if fewer returned, no more pages
        if (orders.length < 200) {
          hasMore = false;
        } else {
          page++;
        }
      }

      return allOrders;
    });
  }

  async fetchAnalytics(
    _connection: Connection,
    _dateRange: DateRange,
  ): Promise<UnifiedAnalyticsMetric[]> {
    return [];
  }

  async refreshToken(connection: Connection): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }> {
    // Nuvemshop tokens don't expire
    return { accessToken: connection.accessToken };
  }

  async healthCheck(connection: Connection): Promise<HealthCheckResult> {
    const storeId = connection.platformAccountId;
    try {
      const response = await axios.get(`${this.baseUrl(storeId)}/store`, {
        headers: this.getHeaders(connection),
      });

      const storeName =
        response.data.name?.pt ||
        response.data.name?.es ||
        response.data.name?.en ||
        storeId;

      return {
        healthy: true,
        apiVersion: this.apiVersion,
        accountId: storeId,
        accountName: storeName,
      };
    } catch (err: any) {
      return {
        healthy: false,
        apiVersion: this.apiVersion,
        error: err.response?.data?.description || err.message,
      };
    }
  }

  async validateConnection(connection: Connection): Promise<boolean> {
    const result = await this.healthCheck(connection);
    return result.healthy;
  }
}
