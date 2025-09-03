'use client';
import React, { useState } from "react";
import { FileText, LogOut, Menu, X, Clipboard } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { ProtectedRoute } from "../contexts/ProtectedRoute";
import {toast} from 'react-toastify';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    closeSidebar();
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      closeSidebar();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Single navigation item for operator
  const operatorPath = '/operation';
  const isActive = pathname === operatorPath;

  return (
    <ProtectedRoute allowedRoles={['MEMBER']}>
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Header with Hamburger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {isSidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <h1 className="ml-3 text-lg font-semibold text-gray-900">
            Operator Portal
          </h1>
        </div>
        
        {/* Mobile User Info */}
        {user && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
              {user.role}
            </span>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* User Profile Section */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                {user.firstName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 bg-blue-100 text-blue-700">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Single Navigation Item */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => handleNavigation(operatorPath)}
            className={`
              w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${isActive 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-2 border-transparent hover:border-blue-200'
              }
            `}
          >
            <Clipboard className="w-5 h-5 mr-3" />
            Operator Dashboard
          </button>
        </nav>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`
        transition-all duration-300 ease-in-out
        lg:ml-64
        pt-16 lg:pt-0
      `}>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
