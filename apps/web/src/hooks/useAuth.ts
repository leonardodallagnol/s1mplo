import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { setTokens, clearTokens } from '../lib/auth';

interface User {
  id: string;
  email: string;
  name: string;
  country: string;
  subscription?: {
    plan: string;
    status: string;
    maxWorkspaces: number;
    aiCredits: number;
    trialEndsAt?: string;
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setState({ user: data.data, loading: false });
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchMe();
    } else {
      setState({ user: null, loading: false });
    }
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setTokens(data.data.accessToken, data.data.refreshToken);
    setState({ user: data.data.user, loading: false });
    return data.data.user;
  };

  const register = async (email: string, name: string, password: string, country?: string) => {
    const { data } = await api.post('/auth/register', { email, name, password, country });
    setTokens(data.data.accessToken, data.data.refreshToken);
    setState({ user: data.data.user, loading: false });
    return data.data.user;
  };

  const logout = () => {
    clearTokens();
    setState({ user: null, loading: false });
  };

  return {
    user: state.user,
    loading: state.loading,
    login,
    register,
    logout,
    isAuthenticated: !!state.user,
  };
}
