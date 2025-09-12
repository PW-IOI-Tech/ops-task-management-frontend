'use client';

import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface CreateSubcategoryModalProps {
  onClose: () => void;
  onCreateSubcategory: (subcategory: { name: string }) => void;
}

export default function CreateSubcategoryModal({ onClose, onCreateSubcategory }: CreateSubcategoryModalProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // ✅ Start loading
    
    try {
      await onCreateSubcategory({ name });
    } catch (error) {
      console.error('Error creating subcategory:', error);
    } finally {
      setIsLoading(false); // ✅ Stop loading
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Create Subcategory</h3>
            <button 
              onClick={onClose} 
              disabled={isLoading} // ✅ Disable close button while loading
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading} // ✅ Disable input while loading
              className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter subcategory name..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading} // ✅ Disable cancel button while loading
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()} // ✅ Disable if loading or empty name
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-150 flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            >
              {isLoading ? (
                <>
                  {/* ✅ Loading spinner */}
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Create Subcategory
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
