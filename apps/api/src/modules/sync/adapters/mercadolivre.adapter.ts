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
import { MercadoLivreProvider } from '../../oauth/providers/mercadolivre.provider';

@Injectable()
export class MercadoLivreAdapter extends BasePlatformAdapter {
  platform: Platform = Platform.MERCADO_LIVRE;
  apiVersion: string = API_VERSIONS.MERCADO_LIVRE;

  private readonly logger = new Logger(MercadoLivreAdapter.name);
  private readonly ML_BASE = 'https://api.mercadolibre.com';

  constructor(private mlProvider: MercadoLivreProvider) {
    super();
  }

  private getHeaders(connection: Connection): Record<string, string> {
    return {
      Authorization: `Bearer ${connection.accessToken}`,
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

  private mapOrderStatus(mlStatus: string): OrderStatus {
    const map: Record<string, OrderStatus> = {
      confirmed: OrderStatus.PENDING,
      payment_required: OrderStatus.PENDING,
      payment_in_process: OrderStatus.PENDING,
      partially_refunded: OrderStatus.REFUNDED,
      pending_cancel: OrderStatus.CANCELED,
      cancelled: OrderStatus.CANCELED,
      paid: OrderStatus.PAID,
    };
    return map[mlStatus?.toLowerCase()] || OrderStatus.PENDING;
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
    const userId = connection.platformAccountId;
    const since = dateRange.startDate.toISOString();
    const until = dateRange.endDate.toISOString();

    return this.retryWithBackoff(async () => {
      const allOrders: UnifiedOrder[] = [];
      let offset = 0;
      const limit = 50;
      let total = Infinity;

      while (offset < total) {
        const response = await axios.get(`${this.ML_BASE}/orders/search`, {
          headers: this.getHeaders(connection),
          params: {
            seller: userId,
            sort: 'date_desc',
            'order.date_created.from': since,
            'order.date_created.to': until,
            offset,
            limit,
          },
        });

        const results = response.data?.results || [];
        total = response.data?.paging?.total || 0;

        if (results.length === 0) break;

        for (const order of results) {
          const items: any[] = order.order_items || [];
          const subtotal = items.reduce(
            (sum: number, item: any) =>
              sum + (parseFloat(item.unit_price) || 0) * (item.quantity || 1),
            0,
          );
          const shipping = parseFloat(order.shipping?.cost) || 0;
          const total = parseFloat(order.total_amount) || subtotal + shipping;

          allOrders.push({
            platformOrderId: order.id?.toString(),
            orderDate: new Date(order.date_created),
            status: this.mapOrderStatus(order.status),
            subtotal,
            shipping,
            discount: 0,
            total,
            customerEmail: order.buyer?.email,
            customerCity: order.shipping?.receiver_address?.city?.name,
            customerState: order.shipping?.receiver_address?.state?.name,
            itemCount: items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) || 1,
            // ML doesn't provide UTM parameters directly
            utmSource: undefined,
            utmMedium: undefined,
            utmCampaign: undefined,
          });
        }

        offset += results.length;
        if (results.length < limit) break;
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
    if (!connection.refreshToken) {
      throw new Error('No refresh token available for Mercado Livre connection');
    }

    const result = await this.mlProvider.refreshAccessToken(connection.refreshToken);

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: new Date(Date.now() + result.expiresIn * 1000),
    };
  }

  async healthCheck(connection: Connection): Promise<HealthCheckResult> {
    const userId = connection.platformAccountId;
    try {
      const response = await axios.get(`${this.ML_BASE}/users/${userId}`, {
        headers: this.getHeaders(connection),
      });

      return {
        healthy: true,
        apiVersion: this.apiVersion,
        accountId: userId,
        accountName: response.data.nickname,
      };
    } catch (err: any) {
      return {
        healthy: false,
        apiVersion: this.apiVersion,
        error: err.response?.data?.message || err.message,
      };
    }
  }

  async validateConnection(connection: Connection): Promise<boolean> {
    const result = await this.healthCheck(connection);
    return result.healthy;
  }
}
