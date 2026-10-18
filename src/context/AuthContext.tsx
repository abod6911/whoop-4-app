import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { UserProfile, UserSettings, AuthState } from '../types/whoop';
import { authService } from '../services/authService';

export interface AuthContextType {
  currentUser: UserProfile | null;
  profiles: UserProfile[];
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    settings?: Partial<UserSettings>;
    pairedDeviceId?: string | null;
    pairedDeviceName?: string | null;
  }) => Promise<UserProfile>;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<UserProfile>;
  updateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<UserProfile>;
  updatePairedDevice: (userId: string, deviceId: string | null, deviceName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => authService.getState());

  useEffect(() => {
    // Subscribe to reactive auth changes
    const unsubscribe = authService.subscribe((newState) => {
      setAuthState(newState);
    });

    // Initialize auth state asynchronously from IndexedDB
    authService.init().catch((err) => {
      console.warn('[AuthContext] Failed to initialize auth store:', err);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (params: {
      email: string;
      password: string;
      fullName: string;
      settings?: Partial<UserSettings>;
      pairedDeviceId?: string | null;
      pairedDeviceName?: string | null;
    }) => {
      return await authService.signUp(params);
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    return await authService.login(email, password);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
  }, []);

  const switchUser = useCallback(async (userId: string) => {
    return await authService.switchUser(userId);
  }, []);

  const updateProfile = useCallback(async (userId: string, updates: Partial<UserProfile>) => {
    return await authService.updateProfile(userId, updates);
  }, []);

  const updatePairedDevice = useCallback(
    async (userId: string, deviceId: string | null, deviceName?: string) => {
      await authService.updatePairedDevice(userId, deviceId, deviceName);
    },
    []
  );

  const contextValue = useMemo<AuthContextType>(() => ({
    currentUser: authState.currentUser,
    profiles: authState.profiles,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    signUp,
    login,
    logout,
    switchUser,
    updateProfile,
    updatePairedDevice,
  }), [
    authState.currentUser,
    authState.profiles,
    authState.isAuthenticated,
    authState.isLoading,
    signUp,
    login,
    logout,
    switchUser,
    updateProfile,
    updatePairedDevice,
  ]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
