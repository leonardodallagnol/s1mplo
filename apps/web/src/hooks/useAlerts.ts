import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface AlertItem {
  id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface StalenessItem {
  platform: string;
  accountName: string | null;
  status: string;
  lastSyncAt: string | null;
  hoursAgo: number | null;
  isStale: boolean;
  thresholdHours: number;
}

export function useAlerts(workspaceId: string, unreadOnly = false) {
  return useQuery({
    queryKey: ['alerts', workspaceId, unreadOnly],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspaceId}/alerts`, {
        params: unreadOnly ? { unreadOnly: 'true' } : {},
      });
      return data as AlertItem[];
    },
    enabled: !!workspaceId,
    staleTime: 60 * 1000,
  });
}

export function useStaleness(workspaceId: string) {
  return useQuery({
    queryKey: ['staleness', workspaceId],
    queryFn: async () => {
      const { data } = await api.get(`/workspaces/${workspaceId}/alerts/staleness`);
      return data as StalenessItem[];
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarkAlertRead(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data } = await api.put(
        `/workspaces/${workspaceId}/alerts/${alertId}/read`,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', workspaceId] });
    },
  });
}
