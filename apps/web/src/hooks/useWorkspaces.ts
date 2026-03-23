import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
  connections: Array<{
    id: string;
    platform: string;
    status: string;
    lastSyncAt?: string;
  }>;
  _count: { members: number };
  createdAt: string;
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/workspaces');
      setWorkspaces(data.data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (name: string, slug?: string) => {
    const { data } = await api.post('/workspaces', { name, slug });
    setWorkspaces((prev) => [...prev, data.data]);
    return data.data;
  };

  const remove = async (id: string) => {
    await api.delete(`/workspaces/${id}`);
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
  };

  return { workspaces, loading, error, create, remove, refetch: fetch };
}
