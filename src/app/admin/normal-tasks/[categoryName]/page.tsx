'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CategoryDetailView from '../utils/CategoryDetailView';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

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
interface CategoryPageProps {
  params: Promise<{
    categoryName: string;
  }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ✅ Use React.use() to unwrap the params Promise
  const { categoryName } = React.use(params);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Decode the URL parameter and convert back to original format
        const decodedCategoryName = decodeURIComponent(categoryName).replace(/-/g, ' ');
        
        // Fetch all categories
        const response = await axios.get(`${backendUrl}/api/categories`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Fetched categories:', response.data);
        
        // Extract categories from the nested response structure
        const categoriesData = Array.isArray(response.data?.data) 
          ? response.data.data.map((category: Category) => ({
              ...category,
              subcategories: category.subcategories || [],
              directTasks: category.directTasks || []
            }))
          : [];
        
        // Find category by name (case-insensitive)
        const foundCategory = categoriesData.find((cat: Category) => 
          cat.name.toLowerCase() === decodedCategoryName.toLowerCase()
        );
        
        if (foundCategory) {
          setCategory(foundCategory);
        } else {
          setError('Category not found');
        }
      } catch (err) {
        console.error('Error fetching category:', err);
        setError('Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    if (categoryName) {
      fetchCategory();
    }
  }, [categoryName]); // ✅ Now using the unwrapped categoryName

  const handleBack = () => {
    router.push('/admin/normal-tasks');
  };

  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategory(updatedCategory);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading category...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Category Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            The requested category &quot;{decodeURIComponent(categoryName).replace(/-/g, ' ')}&quot; does not exist.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 font-medium"
          >
            ← Back to Categories
          </button>
        </div>
      </div>
    );
  }

  return (
    <CategoryDetailView
      category={category}
      onBack={handleBack}
      onUpdateCategory={handleUpdateCategory}
    />
  );
}
