import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, TokenResponse, UserInfo, ApiError } from '../lib/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, recaptchaToken?: string) => Promise<TokenResponse>;
  register: (username: string, password: string, recaptchaToken?: string) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEYS = ['auth_token', 'user_id', 'username'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUserId = await AsyncStorage.getItem('user_id');
      const storedUsername = await AsyncStorage.getItem('username');

      if (storedToken && storedUserId && storedUsername) {
        setToken(storedToken);
        await api.setAuthToken(storedToken);
        setUser({ id: storedUserId, username: storedUsername, status: 'authenticated' });
        setUser(await api.auth.me());
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await api.clearAuthToken();
        setToken(null);
        setUser(null);
      }
      console.warn('Failed to load stored auth:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const userInfo = await api.auth.me();
      setUser(userInfo);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await logout();
      }
    }
  }, [token]);

  const login = useCallback(async (username: string, password: string, recaptchaToken?: string) => {
    const data = await api.auth.login({ username, password, recaptcha_token: recaptchaToken || '' });
    await api.setAuthToken(data.access_token);
    await AsyncStorage.setItem('auth_token', data.access_token);
    await AsyncStorage.setItem('user_id', data.user_id);
    await AsyncStorage.setItem('username', data.username);
    setToken(data.access_token);
    setUser({ id: data.user_id, username: data.username, status: 'authenticated' });
    return data;
  }, []);

  const register = useCallback(async (username: string, password: string, recaptchaToken?: string) => {
    const data = await api.auth.register({ username, password, recaptcha_token: recaptchaToken || '' });
    await api.setAuthToken(data.access_token);
    await AsyncStorage.setItem('auth_token', data.access_token);
    await AsyncStorage.setItem('user_id', data.user_id);
    await AsyncStorage.setItem('username', data.username);
    setToken(data.access_token);
    setUser({ id: data.user_id, username: data.username, status: 'authenticated' });
    return data;
  }, []);

  const logout = useCallback(async () => {
    await api.clearAuthToken();
    await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
