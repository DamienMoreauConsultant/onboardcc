import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import type { SessionUser, LoginInput } from '../api/auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: SessionUser | null;
  loading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleRoleRedirect = (role: string) => {
    switch (role) {
      case 'REC':
        setLocation('/recruteur');
        break;
      case 'CM1':
      case 'CM2':
      case 'CHZ':
        setLocation('/cm');
        break;
      case 'CAN':
        setLocation('/candidat/accueil');
        break;
      case 'ADMIN':
        setLocation('/admin/referentiels');
        break;
      default:
        setLocation('/');
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (err) {
      setUser(null);
    }
  }, []);

  const login = async (credentials: LoginInput) => {
    try {
      const userData = await authApi.login(credentials);
      setUser(userData);
      handleRoleRedirect(userData.role);
    } catch (err: any) {
      toast({
        title: 'Erreur de connexion',
        description: err.response?.data?.error || 'Identifiants invalides',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setLocation('/login');
    }
  };

  useEffect(() => {
    authApi.getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
