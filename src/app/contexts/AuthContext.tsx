'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Updated User interface to match your API response
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for the complete API response structure
interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
  checkAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated via httpOnly cookie
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ApiResponse = await response.json();
        // Extract user from the nested data structure
        setUser(data.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth status on mount and when page is focused
  useEffect(() => {
    checkAuthStatus();

    // Check auth status when user returns to tab
    const handleFocus = () => {
      checkAuthStatus();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const logout = async () => {
    try {
      setIsLoading(true);
      
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      
      // Redirect to login after logout
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      window.location.href = '/auth/login';
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    logout,
    isAuthenticated: !!user,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
