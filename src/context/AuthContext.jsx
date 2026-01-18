import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { clearSession, loadSession, saveSession } from '../services/session';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => loadSession());

  const login = useCallback(({ token, user }) => {
    if (!token) {
      throw new Error('Thiếu token đăng nhập.');
    }

    saveSession({ token, user });
    setSession({ token, user: user ?? null });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession({ token: null, user: null });
  }, []);

  const value = useMemo(
    () => ({
      token: session?.token ?? null,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider.');
  }
  return context;
};

export default AuthContext;
