'use client';

import { useEffect, useState } from 'react';
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
import {toast} from 'react-toastify'

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

  const router = useRouter();

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/api/categories`, {
          withCredentials: true
        });
        console.log('Fetched categories:', response.data);
        
        // Extract categories from the nested response structure
        const categoriesData = Array.isArray(response.data?.data) 
          ? response.data.data
          : [];
        setCategories(categoriesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Create category via API
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
      
      // Refresh categories after creation
      const categoriesResponse = await axios.get(`${backendUrl}/api/categories`, {
        withCredentials: true
      });
      setCategories(categoriesResponse.data?.data || []);
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

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await axios.delete(`${backendUrl}/api/categories/${categoryToDelete.id}`, {
        withCredentials: true
      });

      toast.success('Category deleted successfully');
      // Refresh categories after deletion
      const categoriesResponse = await axios.get(`${backendUrl}/api/categories`, {
        withCredentials: true
      });
      setCategories(categoriesResponse.data?.data || []);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      setError(null);
      
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
      toast.error('Failed to delete category');
    }
  };

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
      
      // Refresh categories after update
      const categoriesResponse = await axios.get(`${backendUrl}/api/categories`, {
        withCredentials: true
      });
      setCategories(categoriesResponse.data?.data || []);
      setShowEditCategoryModal(false);
      setCategoryToEdit(null);
      setError(null);
      
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
      toast.error('Failed to update category');
    }
  };

  const filteredCategories = Array.isArray(categories) 
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const totalCategories = Array.isArray(categories) ? categories.length : 0;
  
  // Calculate today's totals from all categories
  const totalTodayTasks = Array.isArray(categories) 
    ? categories.reduce((sum, category) => sum + category.totalAssignmentsToday, 0) 
    : 0;
  
  const completedTodayTasks = Array.isArray(categories) 
    ? categories.reduce((sum, category) => sum + category.completedAssignmentsToday, 0) 
    : 0;

  if (showCategoryDetail && selectedCategory) {
    return (
      <CategoryDetailView
        category={selectedCategory as Category}
        onBack={() => {
          setShowCategoryDetail(false);
          setSelectedCategory(null);
        }}
        onUpdateCategory={(updatedCategory: Category) => {
          // Refresh categories when updated
          const fetchCategories = async () => {
            try {
              const response = await axios.get(`${backendUrl}/api/categories`, {
                withCredentials: true
              });
              setCategories(response.data?.data || []);
            } catch (err) {
              console.error('Error refreshing categories:', err);
            }
          };
          fetchCategories();
          setSelectedCategory(updatedCategory);
        }}
      />
    );
  }

  if (loading) {
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
            </div>
          </div>
          <button
            onClick={() => setShowCreateCategoryModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-150 hover:shadow-md"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Category
          </button>
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
