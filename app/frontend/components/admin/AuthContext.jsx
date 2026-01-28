import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi, SESSION_EXPIRED_EVENT } from '../../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Handle session expiration from API interceptor
  const handleSessionExpired = useCallback(() => {
    setAdmin(null);
    setSessionExpired(true);
  }, []);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin');
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
    }
    setLoading(false);

    // Listen for session expiration events
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [handleSessionExpired]);

  // Clear session expired flag when user logs in
  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await adminApi.login(email, password);
      const adminData = response.data.admin;
      setAdmin(adminData);
      setSessionExpired(false);
      localStorage.setItem('admin', JSON.stringify(adminData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setAdmin(null);
    localStorage.removeItem('admin');
  };

  return (
    <AuthContext.Provider value={{
      admin,
      loading,
      login,
      logout,
      isAuthenticated: !!admin,
      sessionExpired,
      clearSessionExpired,
    }}>
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

export default AuthContext;
