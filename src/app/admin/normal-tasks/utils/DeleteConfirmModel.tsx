'use client';

import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => Promise<void> | void; // ✅ Updated to handle async operations
  onCancel: () => void;
}

export default function DeleteConfirmModal({ 
  title, 
  message, 
  confirmText, 
  onConfirm, 
  onCancel 
}: DeleteConfirmModalProps) {
  // ✅ Add deleting state
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // ✅ Handle confirm with loading state
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      // Note: Modal should close from parent component after successful deletion
    } catch (error) {
      console.error('Error during deletion:', error);
      // Error handling should be done in parent component
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            </div>
            <button 
              onClick={onCancel} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              disabled={isDeleting} // ✅ Disable close button while deleting
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">{message}</p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeleting} // ✅ Disable cancel while deleting
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting} // ✅ Disable button while deleting
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-150 flex items-center disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
            >
              {/* ✅ Spinner animation */}
              {isDeleting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {/* ✅ Dynamic text based on state */}
              {isDeleting ? 'Deleting...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
