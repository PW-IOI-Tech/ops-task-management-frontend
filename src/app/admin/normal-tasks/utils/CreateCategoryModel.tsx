'use client';

import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface CreateCategoryModalProps {
  onClose: () => void;
  onCreateCategory: (category: { name: string }) => Promise<void> | void; // ✅ Updated to handle async operations
}

export default function CreateCategoryModal({ onClose, onCreateCategory }: CreateCategoryModalProps) {
  const [name, setName] = useState('');
  // ✅ Add creating state
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // ✅ Handle submit with loading state
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreateCategory({ name: name.trim() });
      // Note: Modal should close from parent component after successful creation
    } catch (error) {
      console.error('Error during creation:', error);
      // Error handling should be done in parent component
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Create Category</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              disabled={isCreating} // ✅ Disable close button while creating
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
            <input
              type="text"
              required
              disabled={isCreating} // ✅ Disable input while creating
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter category name..."
              maxLength={100} // Optional: Add character limit
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating} // ✅ Disable cancel while creating
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()} // ✅ Disable button while creating or if name is empty
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
            >
              {/* ✅ Spinner animation */}
              {isCreating && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {/* ✅ Show CheckCircleIcon only when not creating */}
              {!isCreating && <CheckCircleIcon className="w-4 h-4 mr-2" />}
              {/* ✅ Dynamic text based on state */}
              {isCreating ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
