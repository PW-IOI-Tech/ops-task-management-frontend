'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';

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
  checkAuthStatus: (force?: boolean) => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ Caching state
  const [lastCheck, setLastCheck] = useState<number>(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const checkInProgressRef = useRef<Promise<void> | null>(null);
  
  // ✅ Cache duration: 5 minutes (300 seconds)
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const MIN_CHECK_INTERVAL = 30 * 1000; // Minimum 30 seconds between checks

  const checkAuthStatus = async (force: boolean = false) => {
    const now = Date.now();
    
    // ✅ Skip if not forced and cache is still valid
    if (!force && (now - lastCheck) < CACHE_DURATION) {
      console.log('Using cached auth status');
      return;
    }

    // ✅ Skip if too frequent (prevent spam)
    if (!force && (now - lastCheck) < MIN_CHECK_INTERVAL) {
      console.log('Auth check too frequent, skipping');
      return;
    }

    // ✅ If a check is already in progress, wait for it
    if (isCheckingAuth && checkInProgressRef.current) {
      console.log('Auth check already in progress, waiting...');
      try {
        await checkInProgressRef.current;
      } catch (error) {
        console.error('Error waiting for auth check:', error);
      }
      return;
    }

    setIsCheckingAuth(true);
    setIsLoading(true);

    // ✅ Create and store the check promise
    const checkPromise = (async () => {
      try {
        console.log('Performing fresh auth check');
        
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
          setLastCheck(Date.now());
        } else {
          setUser(null);
          setLastCheck(Date.now());
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setLastCheck(Date.now());
      } finally {
        setIsLoading(false);
        setIsCheckingAuth(false);
        checkInProgressRef.current = null;
      }
    })();

    checkInProgressRef.current = checkPromise;
    await checkPromise;
  };

  // ✅ Force refresh auth (for manual refresh)

  const noAuthCheckPaths = ['/auth/login'];
  const refreshAuth = () => {
    
    setLastCheck(0); // Reset cache
    checkAuthStatus(true);
  };

  // ✅ Initial auth check on mount
  useEffect(() => {
    if(!noAuthCheckPaths.includes(window.location.pathname)) {
      checkAuthStatus(true);
    }
  }, []);

  // ✅ Optimized focus handler with debouncing
  useEffect(() => {
    let focusTimeout: NodeJS.Timeout;

    const handleFocus = () => {
      // ✅ Debounce focus events to prevent spam
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        const now = Date.now();
        // Only check if cache has expired
        if ((now - lastCheck) >= CACHE_DURATION) {
          console.log('Tab focused and cache expired, checking auth');
          checkAuthStatus();
        } else {
          console.log('Tab focused but cache still valid, skipping auth check');
        }
      }, 1000); // 1 second debounce
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    // ✅ Use both focus and visibility change for better tab detection
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(focusTimeout);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastCheck]); // Depend on lastCheck to update behavior

  // ✅ Periodic background refresh (optional)
  useEffect(() => {
    // Check auth every 10 minutes in the background if user is active
    const interval = setInterval(() => {
      if (!document.hidden && user) {
        const now = Date.now();
        if ((now - lastCheck) >= CACHE_DURATION) {
          console.log('Background auth refresh');
          checkAuthStatus();
        }
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [user, lastCheck]);

  const logout = async () => {
    try {
      setIsLoading(true);
      
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      setLastCheck(0); // Reset cache
      
      // Redirect to login after logout
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setLastCheck(0); // Reset cache
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
    refreshAuth,
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
