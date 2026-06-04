import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ems_user');
    const token = localStorage.getItem('ems_token');
    if (stored && token) {
      const parsed = JSON.parse(stored);
      // Check expiry
      if (new Date(parsed.expiresAt) > new Date()) {
        setUser(parsed);
      } else {
        localStorage.removeItem('ems_user');
        localStorage.removeItem('ems_token');
      }
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ems_user', JSON.stringify(userData));
    localStorage.setItem('ems_token', userData.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ems_user');
    localStorage.removeItem('ems_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
