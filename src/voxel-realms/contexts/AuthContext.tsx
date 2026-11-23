/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local commander session context for Voxel Realms RPG.
 * Keeps all gameplay, progression, and local saves running seamlessly
 * without requiring an external cloud backend.
 */

import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ServerSessionInfo } from '../game/adminModeration';
import type { LocalAuthUser } from '../lib/firestore';

export interface GoogleSignInOptions {
  includeGmailScopes?: boolean;
}

export interface AuthContextValue {
  user: LocalAuthUser | null;
  idToken: string | null;
  serverSession: ServerSessionInfo | null;
  workspaceAccessToken: string | null;
  needsWorkspaceAuth: boolean;
  loading: boolean;
  isSigningIn: boolean;
  isRefreshingToken: boolean;
  authError: string | null;
  authErrorCode: string | null;
  clearAuthError: () => void;
  clearWorkspaceAccessToken: () => void;
  signInWithGoogle: (
    options?: GoogleSignInOptions
  ) => Promise<{ user: LocalAuthUser; accessToken: string | null } | null>;
  logout: () => Promise<void>;
  getFreshIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  refreshServerSession: (forceTokenRefresh?: boolean) => Promise<ServerSessionInfo | null>;
  authorizedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LOCAL_COMMANDER_KEY = 'voxel_realms_local_commander_v1';

function loadStoredLocalUser(): LocalAuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_COMMANDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalAuthUser;
    if (parsed && typeof parsed.uid === 'string') return parsed;
  } catch {
    // Ignore storage read errors
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalAuthUser | null>(() => loadStoredLocalUser());
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const clearWorkspaceAccessToken = useCallback(() => {
    // No external workspace token in local mode
  }, []);

  const signInWithGoogle = useCallback(async (_options?: GoogleSignInOptions) => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const localUser: LocalAuthUser = {
        uid: 'local_commander_01',
        email: 'commander@voxelrealms.local',
        displayName: 'Local Commander',
        emailVerified: true,
        photoURL: null,
      };
      setUser(localUser);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(LOCAL_COMMANDER_KEY, JSON.stringify(localUser));
        } catch {
          // Ignore quota errors
        }
      }
      return { user: localUser, accessToken: null };
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setAuthError(null);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(LOCAL_COMMANDER_KEY);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const getFreshIdToken = useCallback(async (_forceRefresh?: boolean): Promise<string | null> => {
    return null;
  }, []);

  const refreshServerSession = useCallback(
    async (_forceTokenRefresh?: boolean): Promise<ServerSessionInfo | null> => {
      return null;
    },
    []
  );

  const authorizedFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    return fetch(input, {
      ...init,
      credentials: 'same-origin',
    });
  }, []);

  const value: AuthContextValue = {
    user,
    idToken: null,
    serverSession: null,
    workspaceAccessToken: null,
    needsWorkspaceAuth: false,
    loading: false,
    isSigningIn,
    isRefreshingToken: false,
    authError,
    authErrorCode: null,
    clearAuthError,
    clearWorkspaceAccessToken,
    signInWithGoogle,
    logout,
    getFreshIdToken,
    refreshServerSession,
    authorizedFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
