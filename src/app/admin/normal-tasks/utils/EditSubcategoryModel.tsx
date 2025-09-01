'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  tasks: unknown[];
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

interface EditSubcategoryModalProps {
  subcategory: Subcategory;
  onClose: () => void;
  onUpdateSubcategory: (subcategory: Subcategory) => void;
}

export default function EditSubcategoryModal({ subcategory, onClose, onUpdateSubcategory }: EditSubcategoryModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subcategory) {
      setName(subcategory.name || '');
      setDescription(subcategory.description || '');
    }
  }, [subcategory]);

  const updateSubcategory = async (subcategoryId: string, updateData: { name: string; description: string; categoryId: string }) => {
    try {
      const response = await axios.patch(`${backendUrl}/api/subcategories/${subcategoryId}`, updateData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating subcategory:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Call API to update subcategory
      const updatedSubcategory = await updateSubcategory(subcategory.id, {
        name,
        description,
        categoryId: subcategory.categoryId
      });
      
      // Update local state with API response
      const finalUpdatedSubcategory: Subcategory = {
        ...subcategory,
        ...updatedSubcategory,
        tasks: subcategory.tasks // Preserve existing tasks
      };
      
      onUpdateSubcategory(finalUpdatedSubcategory);
      onClose();
    } catch (error) {
      console.error('Failed to update subcategory:', error);
      // Handle error (show toast, alert, etc.)
      alert('Failed to update subcategory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Edit Subcategory</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              disabled={isLoading}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subcategory Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter subcategory name..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter subcategory description..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-150 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Update Subcategory
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
