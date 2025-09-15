'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  FolderIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import CategoryDetailView from './utils/CategoryDetailView';
import CreateCategoryModal from './utils/CreateCategoryModel';
import EditCategoryModal from './utils/EditCategoryModel';
import DeleteConfirmModal from './utils/DeleteConfirmModel';
import axios from 'axios';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
import { useRouter } from 'next/navigation';
import { Category } from './utils/types';
import {toast} from 'react-toastify';
import { useAuth } from '@/app/contexts/AuthContext';
// Updated Category interface to match API response
interface ApiCategory {
  id: string;
  name: string;
  description?: string;
  subcategoryCount: number;
  totalAssignmentsToday: number;
  completedAssignmentsToday: number;
  pendingAssignmentsToday: number;
  createdByUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function NormalTasks() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryDetail, setShowCategoryDetail] = useState<boolean>(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState<boolean>(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Caching state
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  // ✅ Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const MIN_FETCH_INTERVAL = 10 * 1000; // Minimum 10 seconds between fetches

  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    if(!user){
      router.push('/auth/login');
    }
  }, [user, router]);

  // ✅ Check if cache is valid
  const isCacheValid = useCallback(() => {
    const now = Date.now();
    return (now - lastFetch) < CACHE_DURATION;
  }, [lastFetch]);

  // ✅ Optimized fetch categories with caching
  const fetchCategories = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    
    // Skip if not forced and cache is still valid
    if (!force && isCacheValid()) {
      console.log('Using cached categories data');
      return;
    }

    // Skip if too frequent (prevent spam)
    if (!force && (now - lastFetch) < MIN_FETCH_INTERVAL) {
      console.log('Category fetch too frequent, skipping');
      return;
    }

    // If a fetch is already in progress, wait for it
    if (isFetching && fetchPromiseRef.current) {
      console.log('Category fetch already in progress, waiting...');
      try {
        await fetchPromiseRef.current;
      } catch (error) {
        console.error('Error waiting for category fetch:', error);
      }
      return;
    }

    setIsFetching(true);
    setLoading(true);

    const fetchPromise = (async () => {
      try {
        console.log('Fetching fresh categories data');
        
        const response = await axios.get(`${backendUrl}/api/categories`, {
          withCredentials: true
        });
        
        console.log('Fetched categories:', response.data);
        
        // Extract categories from the nested response structure
        const categoriesData = Array.isArray(response.data?.data) 
          ? response.data.data
          : [];
        
        setCategories(categoriesData);
        setLastFetch(Date.now());
        setError(null);
        
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
        setIsFetching(false);
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = fetchPromise;
    await fetchPromise;
  }, [lastFetch, isCacheValid]);

  // ✅ Force refresh function
  const refreshCategories = useCallback(() => {
    setLastFetch(0); // Reset cache
    fetchCategories(true);
  }, [fetchCategories]);


  

  // ✅ Initial fetch on component mount
  useEffect(() => {
    fetchCategories(true); // Force initial fetch
  }, []);

  // ✅ Optimized create category with local state update
  const handleCreateCategory = async (newCategory: { name: string; description?: string }) => {
    try {
      const response = await axios.post(`${backendUrl}/api/categories`, {
        name: newCategory.name,
        description: newCategory.description || ''
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      toast.success('Category created successfully');
      
      // ✅ Update local state immediately instead of API call
      if (response.data?.data) {
        const newApiCategory: ApiCategory = {
          id: response.data.data.id,
          name: response.data.data.name,
          description: response.data.data.description,
          subcategoryCount: 0,
          totalAssignmentsToday: 0,
          completedAssignmentsToday: 0,
          pendingAssignmentsToday: 0,
          createdByUser: response.data.data.createdByUser
        };
        
        setCategories(prev => [...prev, newApiCategory]);
        setLastFetch(Date.now()); // Update cache timestamp
      }
      
      setShowCreateCategoryModal(false);
      setError(null);
      
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category');
      toast.error('Failed to create category');
    }
  };

  const handleCategoryClick = (category: ApiCategory) => {
    // Convert category name to URL-friendly slug
    const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
    router.push(`/admin/normal-tasks/${encodeURIComponent(categorySlug)}`);
  };

  const handleEditCategory = (category: ApiCategory, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    // Convert ApiCategory to Category for editing
    const categoryForEdit: Category = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      subcategories: [],
      directTasks: [],
      taskId: '',
      parameterType: '',
      assignedTo: []
    };
    setCategoryToEdit(categoryForEdit);
    setShowEditCategoryModal(true);
  };

  const handleDeleteCategory = (category: ApiCategory, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    // Convert ApiCategory to Category for deletion
    const categoryForDelete: Category = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      subcategories: [],
      directTasks: [],
      taskId: '',
      parameterType: '',
      assignedTo: []
    };
    setCategoryToDelete(categoryForDelete);
    setShowDeleteModal(true);
  };

  // ✅ Optimized delete with local state update
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await axios.delete(`${backendUrl}/api/categories/${categoryToDelete.id}`, {
        withCredentials: true
      });

      toast.success('Category deleted successfully');
      
      // ✅ Update local state immediately instead of API call
      setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
      setLastFetch(Date.now()); // Update cache timestamp
      
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      setError(null);
      
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
      toast.error('Failed to delete category');
    }
  };

  // ✅ Optimized update with local state update
  const handleUpdateCategory = async (updatedCategory: Category) => {
    try {
      const response = await axios.patch(`${backendUrl}/api/categories/${updatedCategory.id}`, {
        name: updatedCategory.name,
        description: updatedCategory.description || ''
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      toast.success('Category updated successfully');
      
      // ✅ Update local state immediately instead of API call
      setCategories(prev => prev.map(cat => 
        cat.id === updatedCategory.id 
          ? {
              ...cat,
              name: updatedCategory.name,
              description: updatedCategory.description || ''
            }
          : cat
      ));
      setLastFetch(Date.now()); // Update cache timestamp
      
      setShowEditCategoryModal(false);
      setCategoryToEdit(null);
      setError(null);
      
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
      toast.error('Failed to update category');
    }
  };

  // ✅ Optimized filtering
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCategories = categories.length;
  
  // Calculate today's totals from all categories
  const totalTodayTasks = categories.reduce((sum, category) => sum + category.totalAssignmentsToday, 0);
  const completedTodayTasks = categories.reduce((sum, category) => sum + category.completedAssignmentsToday, 0);

  // ✅ Auto-refresh every 5 minutes when component is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden && !isCacheValid()) {
        console.log('Auto-refreshing categories');
        fetchCategories();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchCategories, isCacheValid]);

  // ✅ Refresh on window focus if cache is stale
  useEffect(() => {
    let focusTimeout: NodeJS.Timeout;

    const handleFocus = () => {
      clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        if (!isCacheValid()) {
          console.log('Window focused and cache stale, refreshing categories');
          fetchCategories();
        }
      }, 1000); // 1 second debounce
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(focusTimeout);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchCategories, isCacheValid]);

  if (showCategoryDetail && selectedCategory) {
    return (
      <CategoryDetailView
        category={selectedCategory as Category}
        onBack={() => {
          setShowCategoryDetail(false);
          setSelectedCategory(null);
        }}
        onUpdateCategory={(updatedCategory: Category) => {
          // ✅ Only refresh if cache is stale, otherwise use existing data
          if (!isCacheValid()) {
            fetchCategories();
          }
          setSelectedCategory(updatedCategory);
        }}
      />
    );
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-600 text-sm">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FolderIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Normal Tasks</h1>
              <p className="text-sm text-gray-600 mt-1">Manage structured tasks by categories</p>
              {/* ✅ Show cache status for debugging */}
              {lastFetch > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {new Date(lastFetch).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshCategories}
              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors duration-150"
              disabled={isFetching}
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowCreateCategoryModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-150 hover:shadow-md"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Category
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Categories</p>
              <p className="text-3xl font-bold text-gray-900">{totalCategories}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
              <FolderIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Today&apos;s Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{totalTodayTasks}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900">{completedTodayTasks}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Categories */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const completionRate = category.totalAssignmentsToday > 0 
              ? Math.round((category.completedAssignmentsToday / category.totalAssignmentsToday) * 100) 
              : 0;

            return (
              <div
                key={category.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-200 cursor-pointer group"
              >
                {/* Header with title and action buttons */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                      <FolderIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1" onClick={() => handleCategoryClick(category)}>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 ml-3 flex-shrink-0">
                    <button
                      onClick={(e) => handleEditCategory(category, e)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit Category"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCategory(category, e)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="flex justify-end mb-4" onClick={() => handleCategoryClick(category)}>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-500">Today&apos;s Completion</div>
                    <div className="text-lg font-bold text-blue-600">{completionRate}%</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-4" onClick={() => handleCategoryClick(category)}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Today&apos;s Tasks</span>
                    <span className="font-semibold text-gray-900">{category.totalAssignmentsToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed Today</span>
                    <span className="font-semibold text-green-600">{category.completedAssignmentsToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Today</span>
                    <span className="font-semibold text-orange-600">{category.pendingAssignmentsToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subcategories</span>
                    <span className="font-semibold text-indigo-600">{category.subcategoryCount}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div onClick={() => handleCategoryClick(category)}>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && !loading && (
          <div className="text-center py-12">
            <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Try adjusting your search terms or create a new category.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateCategoryModal && (
        <CreateCategoryModal
          onClose={() => setShowCreateCategoryModal(false)}
          onCreateCategory={handleCreateCategory}
        />
      )}

      {showEditCategoryModal && categoryToEdit && (
        <EditCategoryModal
          category={categoryToEdit}
          onClose={() => {
            setShowEditCategoryModal(false);
            setCategoryToEdit(null);
          }}
          onUpdateCategory={handleUpdateCategory}
        />
      )}

      {showDeleteModal && categoryToDelete && (
        <DeleteConfirmModal
          title="Delete Category"
          message={`Are you sure you want to delete "${categoryToDelete.name}"? This will also delete all subcategories and tasks within this category. This action cannot be undone.`}
          confirmText="Delete Category"
          onConfirm={confirmDeleteCategory}
          onCancel={() => {
            setShowDeleteModal(false);
            setCategoryToDelete(null);
          }}
        />
      )}
    </div>
  );
}
