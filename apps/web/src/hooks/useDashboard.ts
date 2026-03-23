import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

function getDefaultDates() {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function buildParams(startDate?: string, endDate?: string) {
  const defaults = getDefaultDates();
  return {
    startDate: startDate || defaults.startDate,
    endDate: endDate || defaults.endDate,
  };
}

export function useConsolidatedKPIs(workspaceId: string, startDate?: string, endDate?: string) {
  const params = buildParams(startDate, endDate);
  return useQuery({
    queryKey: ['dashboard', 'kpis', workspaceId, params.startDate, params.endDate],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspaceId}/dashboard`, { params });
      return data;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChannelComparison(workspaceId: string, startDate?: string, endDate?: string) {
  const params = buildParams(startDate, endDate);
  return useQuery({
    queryKey: ['dashboard', 'channels', workspaceId, params.startDate, params.endDate],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspaceId}/dashboard/channels`, { params });
      return data as ChannelData[];
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFunnel(workspaceId: string, startDate?: string, endDate?: string) {
  const params = buildParams(startDate, endDate);
  return useQuery({
    queryKey: ['dashboard', 'funnel', workspaceId, params.startDate, params.endDate],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspaceId}/dashboard/funnel`, { params });
      return data as FunnelData;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRealRoas(workspaceId: string, startDate?: string, endDate?: string) {
  const params = buildParams(startDate, endDate);
  return useQuery({
    queryKey: ['dashboard', 'real-roas', workspaceId, params.startDate, params.endDate],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspaceId}/dashboard/real-roas`, { params });
      return data as RoasDataPoint[];
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useConversionValidation(workspaceId: string, startDate?: string, endDate?: string) {
  const params = buildParams(startDate, endDate);
  return useQuery({
    queryKey: ['dashboard', 'validation', workspaceId, params.startDate, params.endDate],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspaceId}/dashboard/validation`, { params });
      return data as ConversionValidation;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

// Types
export interface KPIData {
  totalSpend: number;
  totalRevenueReported: number;
  totalRevenueReal: number;
  roasReported: number;
  roasReal: number;
  roasDiscrepancy: number;
  totalOrders: number;
  avgTicket: number;
  cancelRate: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  avgCPA: number;
  connections: { platform: string; status: string; lastSyncAt: string | null }[];
}

export interface ChannelData {
  platform: string;
  spend: number;
  revenueReported: number;
  revenueReal: number;
  roasReported: number;
  roasReal: number;
  clicks: number;
  impressions: number;
  conversions: number;
  cpa: number;
  orders: number;
}

export interface FunnelData {
  steps: {
    impressions: number;
    clicks: number;
    sessions: number;
    addToCarts: number;
    checkouts: number;
    orders: number;
  };
  dropOffs: {
    impressionsToClicks: number;
    clicksToSessions: number;
    sessionsToAddToCart: number;
    addToCartToCheckout: number;
    checkoutToOrders: number;
  };
  bottleneck: string;
}

export interface RoasDataPoint {
  date: string;
  spendTotal: number;
  revenueReported: number;
  revenueReal: number;
  roasReported: number;
  roasReal: number;
}

export interface ConversionValidation {
  adsReportedConversions: number;
  ga4Transactions: number;
  realOrders: number;
  discrepancyAdsVsGA4: number;
  discrepancyAdsVsReal: number;
}
