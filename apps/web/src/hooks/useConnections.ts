import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface Connection {
  id: string;
  platform: string;
  platformAccountId: string;
  platformAccountName?: string;
  status: string;
  lastSyncAt?: string;
  lastSyncError?: string;
}

export function useConnections(workspaceId: string) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/workspaces/${workspaceId}/connections`);
      setConnections(data.data);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetch(); }, [fetch]);

  const connectMetaAds = (workspaceId: string) => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/oauth/meta-ads/authorize?workspaceId=${workspaceId}`;
  };

  const disconnect = async (connectionId: string) => {
    await api.delete(`/workspaces/${workspaceId}/connections/${connectionId}`);
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  };

  const syncNow = async (connectionId: string) => {
    await api.post(`/workspaces/${workspaceId}/connections/${connectionId}/sync`);
  };

  return { connections, loading, connectMetaAds, disconnect, syncNow, refetch: fetch };
}
