import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChange } from '@/lib/auth';
import { analytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);

      // Track auth state changes with Firebase Analytics
      if (user) {
        logEvent(analytics, 'login', {
          method: 'email',
          username: user.email ? user.email.split('@')[0] : 'unknown'
        });
      } else {
        logEvent(analytics, 'logout', {});
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};