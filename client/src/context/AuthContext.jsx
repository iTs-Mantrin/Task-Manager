import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setAuthToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('ttm_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistToken = useCallback((nextToken) => {
    setTokenState(nextToken || '');

    if (nextToken) {
      localStorage.setItem('ttm_token', nextToken);
    } else {
      localStorage.removeItem('ttm_token');
    }

    setAuthToken(nextToken || '');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed with local logout even if API call fails
    }

    persistToken('');
    setUser(null);
  }, [persistToken]);

  const hydrateUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setAuthToken(token);
      const response = await authApi.me();
      setUser(response.data.data);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  const login = useCallback(
    async (payload) => {
      const response = await authApi.login(payload);
      persistToken(response.data.token);
      setUser(response.data.user);
      return response.data.user;
    },
    [persistToken],
  );

  const signup = useCallback(
    async (payload) => {
      const response = await authApi.signup(payload);
      persistToken(response.data.token);
      setUser(response.data.user);
      return response.data.user;
    },
    [persistToken],
  );

  const refreshUser = useCallback(async () => {
    if (!token) {
      return null;
    }

    const response = await authApi.me();
    setUser(response.data.data);
    return response.data.data;
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'Admin',
      login,
      signup,
      logout,
      refreshUser,
    }),
    [token, user, loading, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
