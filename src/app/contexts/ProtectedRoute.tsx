'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectPath = '/auth/login' 
}) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Handle redirects in useEffect to avoid render-phase side effects
  useEffect(() => {
    if (isLoading) return; // Don't do anything while loading

    // Redirect to login if not authenticated
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', pathname);
      router.push(redirectPath);
      return;
    }

    // Check role-based access if roles are specified
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
  }, [user, isLoading, router, pathname, redirectPath, allowedRoles]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render children if user is not authenticated or not authorized
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Redirecting to login...</div>
      </div>
    );
  }

  // Don't render if user doesn't have required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Redirecting...</div>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
};
