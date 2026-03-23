import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface AIInsight {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'OPPORTUNITY';
  title: string;
  summary: string;
  detail: string;
  recommendation: string;
  dataSnapshot: Record<string, unknown> | null;
  isRead: boolean;
  isDismissed: boolean;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export function useInsights(workspaceId: string) {
  return useQuery({
    queryKey: ['insights', workspaceId],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspaceId}/ai/insights`);
      return data as { insights: AIInsight[]; total: number; page: number; limit: number };
    },
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAnalyze(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params?: { startDate?: string; endDate?: string }) => {
      const { data } = await api.post(
        `/workspaces/${workspaceId}/ai/analyze`,
        {},
        { params },
      );
      return data as AIInsight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights', workspaceId] });
    },
  });
}

export function useAskCopilot(workspaceId: string) {
  return useMutation({
    mutationFn: async (payload: {
      question: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const { data } = await api.post(`/workspaces/${workspaceId}/ai/ask`, payload);
      return data as string;
    },
  });
}

export function useUpdateInsight(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      insightId,
      read,
      dismissed,
    }: {
      insightId: string;
      read?: boolean;
      dismissed?: boolean;
    }) => {
      const { data } = await api.put(
        `/workspaces/${workspaceId}/ai/insights/${insightId}`,
        { read, dismissed },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights', workspaceId] });
    },
  });
}
