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

interface Task {
  id: string; // Changed from number to string (taskId from API)
  title: string;
  description: string | null;
  taskType: 'ADHOC' | 'RECURRING';
  category?: string;
  subcategory?: string;
  parameterLabel: string;
  parameterUnit?: string | null;
  dueDate?: string | null;
  isAssigned: boolean;
  assignments: unknown[];
  createdBy: string;
  status?: 'pending' | 'completed'; // Default status if not in API
}
interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  tasks: Task[];
  category?: {
    id: string;
    name: string;
  };
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
interface Category {
  id: number;
  name: string;
  description?: string;
  subcategories: Subcategory[];
  directTasks: Task[];
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
  const [categories, setCategories] = useState<Category[]>([]);
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
        // Extract categories from the nested response structure and add default properties
        const categoriesData = Array.isArray(response.data?.data) 
          ? response.data.data.map((category: Category) => ({
              ...category,
              subcategories: category.subcategories || [],
              directTasks: category.directTasks || []
            }))
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

      console.log('Created category:', response.data);
      
      // Extract the created category from the response
      const createdCategory = response.data?.data || response.data;
      
      // Add the new category to state with defaults for missing properties
      const categoryWithDefaults: Category = {
        ...createdCategory,
        subcategories: createdCategory.subcategories || [],
        directTasks: createdCategory.directTasks || []
      };
      
      setCategories(prevCategories => [...prevCategories, categoryWithDefaults]);
      setShowCreateCategoryModal(false);
      setError(null);
      
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category');
      
      // Fallback: add to local state if API fails
      const categoryWithId: Category = {
        ...newCategory,
        id: Date.now(),
        subcategories: [],
        directTasks: []
      };
      setCategories(prevCategories => [...prevCategories, categoryWithId]);
      setShowCreateCategoryModal(false);
    }
  };

  const getCategoryStats = (category: Category) => {
    // Safely handle missing properties with fallbacks
    const directTasks = category.directTasks || [];
    const subcategories = category.subcategories || [];
    
    let totalTasks = directTasks.length;
    let completedTasks = directTasks.filter(task => task.status === 'completed').length;

    subcategories.forEach(subcategory => {
      const subcategoryTasks = subcategory.tasks || [];
      totalTasks += subcategoryTasks.length;
      completedTasks += subcategoryTasks.filter(task => task.status === 'completed').length;
    });

    return { totalTasks, completedTasks };
  };

  const handleCategoryClick = (category: Category) => {
  // Convert category name to URL-friendly slug
  const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
  router.push(`/admin/normal-tasks/${encodeURIComponent(categorySlug)}`);
};

  const handleEditCategory = (category: Category, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setCategoryToEdit(category);
    setShowEditCategoryModal(true);
  };

  const handleDeleteCategory = (category: Category, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories(categories.map(cat => 
      cat.id === updatedCategory.id ? updatedCategory : cat
    ));
    setShowEditCategoryModal(false);
    setCategoryToEdit(null);
  };

  const filteredCategories = Array.isArray(categories) 
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const totalCategories = Array.isArray(categories) ? categories.length : 0;
  const totalTasks = Array.isArray(categories) ? categories.reduce((sum, category) => {
    return sum + getCategoryStats(category).totalTasks;
  }, 0) : 0;
  const completedTasks = Array.isArray(categories) ? categories.reduce((sum, category) => {
    return sum + getCategoryStats(category).completedTasks;
  }, 0) : 0;

  if (showCategoryDetail && selectedCategory) {
    return (
      <CategoryDetailView
        category={selectedCategory as Category}
        onBack={() => {
          setShowCategoryDetail(false);
          setSelectedCategory(null);
        }}
        onUpdateCategory={(updatedCategory: Category) => {
          setCategories(categories.map(cat => 
            cat.id === updatedCategory.id ? updatedCategory : cat
          ));
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
              <p className="text-sm font-medium text-gray-600 mb-2">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{totalTasks}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Completed Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{completedTasks}</p>
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
            const { totalTasks, completedTasks } = getCategoryStats(category);
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
                      {category.description && (
                        <p className="text-sm text-gray-500 truncate mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons - Always visible on desktop, show on hover for mobile */}
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
                    <div className="text-sm font-medium text-gray-500">Completion</div>
                    <div className="text-lg font-bold text-blue-600">{completionRate}%</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-4" onClick={() => handleCategoryClick(category)}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Tasks</span>
                    <span className="font-semibold text-gray-900">{totalTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-semibold text-green-600">{completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subcategories</span>
                    <span className="font-semibold text-indigo-600">{(category.subcategories || []).length}</span>
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