import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Platform, OrderStatus } from '@prisma/client';

interface DateRange {
  startDate: string;
  endDate: string;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getDefaultRange(): { startDate: string; endDate: string } {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }

  private resolveRange(startDate?: string, endDate?: string): DateRange {
    if (startDate && endDate) return { startDate, endDate };
    return this.getDefaultRange();
  }

  async getConsolidatedKPIs(workspaceId: string, startDate?: string, endDate?: string) {
    const range = this.resolveRange(startDate, endDate);
    const start = new Date(range.startDate);
    const end = new Date(range.endDate + 'T23:59:59.999Z');

    const [adMetrics, paidOrders, allOrders, connections] = await Promise.all([
      this.prisma.adMetric.findMany({
        where: {
          workspaceId,
          date: { gte: start, lte: end },
        },
      }),
      this.prisma.order.findMany({
        where: {
          workspaceId,
          orderDate: { gte: start, lte: end },
          status: OrderStatus.PAID,
        },
      }),
      this.prisma.order.findMany({
        where: {
          workspaceId,
          orderDate: { gte: start, lte: end },
        },
        select: { status: true },
      }),
      this.prisma.connection.findMany({
        where: { workspaceId },
        select: { platform: true, status: true, lastSyncAt: true },
      }),
    ]);

    const totalSpend = adMetrics.reduce((s, m) => s + Number(m.spend), 0);
    const totalRevenueReported = adMetrics.reduce((s, m) => s + Number(m.revenue), 0);
    const totalRevenueReal = paidOrders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = paidOrders.length;
    const canceledOrders = allOrders.filter(o => o.status === OrderStatus.CANCELED).length;
    const totalClicks = adMetrics.reduce((s, m) => s + m.clicks, 0);
    const totalImpressions = adMetrics.reduce((s, m) => s + m.impressions, 0);
    const totalConversions = adMetrics.reduce((s, m) => s + m.conversions, 0);

    const roasReported = totalSpend > 0 ? totalRevenueReported / totalSpend : 0;
    const roasReal = totalSpend > 0 ? totalRevenueReal / totalSpend : 0;
    const roasDiscrepancy = roasReported > 0
      ? ((roasReported - roasReal) / roasReported) * 100
      : 0;
    const avgTicket = totalOrders > 0 ? totalRevenueReal / totalOrders : 0;
    const cancelRate = allOrders.length > 0
      ? (canceledOrders / allOrders.length) * 100
      : 0;
    const avgCPA = totalOrders > 0 ? totalSpend / totalOrders : 0;

    return {
      totalSpend,
      totalRevenueReported,
      totalRevenueReal,
      roasReported,
      roasReal,
      roasDiscrepancy,
      totalOrders,
      avgTicket,
      cancelRate,
      totalClicks,
      totalImpressions,
      totalConversions,
      avgCPA,
      connections: connections.map(c => ({
        platform: c.platform,
        status: c.status,
        lastSyncAt: c.lastSyncAt,
      })),
    };
  }

  async getChannelComparison(workspaceId: string, startDate?: string, endDate?: string) {
    const range = this.resolveRange(startDate, endDate);
    const start = new Date(range.startDate);
    const end = new Date(range.endDate + 'T23:59:59.999Z');

    const [adMetrics, orders] = await Promise.all([
      this.prisma.adMetric.findMany({
        where: {
          workspaceId,
          date: { gte: start, lte: end },
        },
      }),
      this.prisma.order.findMany({
        where: {
          workspaceId,
          orderDate: { gte: start, lte: end },
          status: OrderStatus.PAID,
        },
        select: { total: true, utmSource: true },
      }),
    ]);

    // Group ad metrics by platform
    const adByPlatform: Record<string, { spend: number; revenueReported: number; clicks: number; impressions: number; conversions: number }> = {};

    for (const metric of adMetrics) {
      const p = metric.platform;
      if (!adByPlatform[p]) {
        adByPlatform[p] = { spend: 0, revenueReported: 0, clicks: 0, impressions: 0, conversions: 0 };
      }
      adByPlatform[p].spend += Number(metric.spend);
      adByPlatform[p].revenueReported += Number(metric.revenue);
      adByPlatform[p].clicks += metric.clicks;
      adByPlatform[p].impressions += metric.impressions;
      adByPlatform[p].conversions += metric.conversions;
    }

    // UTM source → platform mapping
    const utmToPlatform: Record<string, Platform> = {
      facebook: Platform.META_ADS,
      instagram: Platform.META_ADS,
      meta: Platform.META_ADS,
      google: Platform.GOOGLE_ADS,
      tiktok: Platform.TIKTOK_ADS,
      mercadolivre: Platform.MERCADO_LIVRE,
      'mercado livre': Platform.MERCADO_LIVRE,
      'mercado_livre': Platform.MERCADO_LIVRE,
    };

    // Group real orders by platform via UTM
    const realByPlatform: Record<string, { revenue: number; orders: number }> = {};

    for (const order of orders) {
      const src = (order.utmSource || '').toLowerCase();
      const mapped = utmToPlatform[src];
      const key = mapped || 'OTHER';
      if (!realByPlatform[key]) realByPlatform[key] = { revenue: 0, orders: 0 };
      realByPlatform[key].revenue += Number(order.total);
      realByPlatform[key].orders += 1;
    }

    // Build result for platforms with data
    const platforms = new Set([
      ...Object.keys(adByPlatform),
      ...Object.keys(realByPlatform).filter(k => k !== 'OTHER'),
    ]);

    return Array.from(platforms).map(platform => {
      const ad = adByPlatform[platform] || { spend: 0, revenueReported: 0, clicks: 0, impressions: 0, conversions: 0 };
      const real = realByPlatform[platform] || { revenue: 0, orders: 0 };
      const roasReported = ad.spend > 0 ? ad.revenueReported / ad.spend : 0;
      const roasReal = ad.spend > 0 ? real.revenue / ad.spend : 0;
      const cpa = real.orders > 0 ? ad.spend / real.orders : 0;

      return {
        platform,
        spend: ad.spend,
        revenueReported: ad.revenueReported,
        revenueReal: real.revenue,
        roasReported,
        roasReal,
        clicks: ad.clicks,
        impressions: ad.impressions,
        conversions: ad.conversions,
        cpa,
        orders: real.orders,
      };
    });
  }

  async getFunnel(workspaceId: string, startDate?: string, endDate?: string) {
    const range = this.resolveRange(startDate, endDate);
    const start = new Date(range.startDate);
    const end = new Date(range.endDate + 'T23:59:59.999Z');

    const [adMetrics, analyticsMetrics, paidOrders] = await Promise.all([
      this.prisma.adMetric.findMany({
        where: { workspaceId, date: { gte: start, lte: end } },
      }),
      this.prisma.analyticsMetric.findMany({
        where: { workspaceId, date: { gte: start, lte: end } },
      }),
      this.prisma.order.count({
        where: {
          workspaceId,
          orderDate: { gte: start, lte: end },
          status: OrderStatus.PAID,
        },
      }),
    ]);

    const impressions = adMetrics.reduce((s, m) => s + m.impressions, 0);
    const clicks = adMetrics.reduce((s, m) => s + m.clicks, 0);
    const sessions = analyticsMetrics.reduce((s, m) => s + m.sessions, 0);
    const ga4AddToCarts = analyticsMetrics.reduce((s, m) => s + m.addToCarts, 0);
    const adAddToCarts = adMetrics.reduce((s, m) => s + m.addToCart, 0);
    const addToCarts = Math.max(ga4AddToCarts, adAddToCarts);
    const ga4Checkouts = analyticsMetrics.reduce((s, m) => s + m.checkouts, 0);
    const adCheckouts = adMetrics.reduce((s, m) => s + m.initiateCheckout, 0);
    const checkouts = Math.max(ga4Checkouts, adCheckouts);
    const orders = paidOrders;

    // Calculate drop-offs
    const dropClicks = impressions > 0 ? ((impressions - clicks) / impressions) * 100 : 0;
    const dropSessions = clicks > 0 ? ((clicks - sessions) / clicks) * 100 : 0;
    const dropAddToCart = sessions > 0 ? ((sessions - addToCarts) / sessions) * 100 : 0;
    const dropCheckout = addToCarts > 0 ? ((addToCarts - checkouts) / addToCarts) * 100 : 0;
    const dropOrders = checkouts > 0 ? ((checkouts - orders) / checkouts) * 100 : 0;

    const drops = {
      clicks: dropClicks,
      sessions: dropSessions,
      addToCart: dropAddToCart,
      checkout: dropCheckout,
      orders: dropOrders,
    };

    const bottleneck = (Object.keys(drops) as Array<keyof typeof drops>).reduce(
      (max, key) => drops[key] > drops[max] ? key : max,
      'clicks' as keyof typeof drops,
    );

    return {
      steps: {
        impressions,
        clicks,
        sessions,
        addToCarts,
        checkouts,
        orders,
      },
      dropOffs: {
        impressionsToClicks: dropClicks,
        clicksToSessions: dropSessions,
        sessionsToAddToCart: dropAddToCart,
        addToCartToCheckout: dropCheckout,
        checkoutToOrders: dropOrders,
      },
      bottleneck,
    };
  }

  async getRealRoas(workspaceId: string, startDate?: string, endDate?: string) {
    const range = this.resolveRange(startDate, endDate);
    const start = new Date(range.startDate);
    const end = new Date(range.endDate + 'T23:59:59.999Z');

    const [adMetrics, orders] = await Promise.all([
      this.prisma.adMetric.findMany({
        where: { workspaceId, date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.order.findMany({
        where: {
          workspaceId,
          orderDate: { gte: start, lte: end },
          status: OrderStatus.PAID,
        },
        select: { orderDate: true, total: true },
      }),
    ]);

    // Group ad metrics by date
    const adByDate: Record<string, { spend: number; revenueReported: number }> = {};
    for (const m of adMetrics) {
      const d = m.date.toISOString().split('T')[0];
      if (!adByDate[d]) adByDate[d] = { spend: 0, revenueReported: 0 };
      adByDate[d].spend += Number(m.spend);
      adByDate[d].revenueReported += Number(m.revenue);
    }

    // Group orders by date
    const ordersByDate: Record<string, number> = {};
    for (const o of orders) {
      const d = o.orderDate.toISOString().split('T')[0];
      if (!ordersByDate[d]) ordersByDate[d] = 0;
      ordersByDate[d] += Number(o.total);
    }

    // Build time series
    const allDates = new Set([...Object.keys(adByDate), ...Object.keys(ordersByDate)]);
    const sorted = Array.from(allDates).sort();

    return sorted.map(date => {
      const ad = adByDate[date] || { spend: 0, revenueReported: 0 };
      const revenueReal = ordersByDate[date] || 0;
      const roasReported = ad.spend > 0 ? ad.revenueReported / ad.spend : 0;
      const roasReal = ad.spend > 0 ? revenueReal / ad.spend : 0;

      return {
        date,
        spendTotal: ad.spend,
        revenueReported: ad.revenueReported,
        revenueReal,
        roasReported,
        roasReal,
      };
    });
  }

  async getConversionValidation(workspaceId: string, startDate?: string, endDate?: string) {
    const range = this.resolveRange(startDate, endDate);
    const start = new Date(range.startDate);
    const end = new Date(range.endDate + 'T23:59:59.999Z');

    const [adMetrics, analyticsMetrics, realOrders] = await Promise.all([
      this.prisma.adMetric.findMany({
        where: { workspaceId, date: { gte: start, lte: end } },
      }),
      this.prisma.analyticsMetric.findMany({
        where: { workspaceId, date: { gte: start, lte: end } },
      }),
      this.prisma.order.count({
        where: {
          workspaceId,
          orderDate: { gte: start, lte: end },
          status: OrderStatus.PAID,
        },
      }),
    ]);

    const adsReportedConversions = adMetrics.reduce((s, m) => s + m.conversions, 0);
    const ga4Transactions = analyticsMetrics.reduce((s, m) => s + m.transactions, 0);

    const discrepancyAdsVsGA4 = adsReportedConversions > 0
      ? ((adsReportedConversions - ga4Transactions) / adsReportedConversions) * 100
      : 0;
    const discrepancyAdsVsReal = adsReportedConversions > 0
      ? ((adsReportedConversions - realOrders) / adsReportedConversions) * 100
      : 0;

    return {
      adsReportedConversions,
      ga4Transactions,
      realOrders,
      discrepancyAdsVsGA4,
      discrepancyAdsVsReal,
    };
  }

  async getTrafficBySource(workspaceId: string, startDate?: string, endDate?: string) {
    const range = this.resolveRange(startDate, endDate);
    const start = new Date(range.startDate);
    const end = new Date(range.endDate + 'T23:59:59.999Z');

    const analyticsMetrics = await this.prisma.analyticsMetric.findMany({
      where: { workspaceId, date: { gte: start, lte: end } },
    });

    // Group by source/medium
    const bySourceMedium: Record<string, { sessions: number; transactions: number; revenue: number }> = {};

    for (const m of analyticsMetrics) {
      const key = `${m.source || '(direct)'}|||${m.medium || '(none)'}`;
      if (!bySourceMedium[key]) bySourceMedium[key] = { sessions: 0, transactions: 0, revenue: 0 };
      bySourceMedium[key].sessions += m.sessions;
      bySourceMedium[key].transactions += m.transactions;
      bySourceMedium[key].revenue += Number(m.ecommerceRevenue || 0);
    }

    return Object.entries(bySourceMedium).map(([key, data]) => {
      const [source, medium] = key.split('|||');
      const conversionRate = data.sessions > 0
        ? (data.transactions / data.sessions) * 100
        : 0;

      return {
        source,
        medium,
        sessions: data.sessions,
        transactions: data.transactions,
        revenue: data.revenue,
        conversionRate,
      };
    }).sort((a, b) => b.sessions - a.sessions);
  }
}
