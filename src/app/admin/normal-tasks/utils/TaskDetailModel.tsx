'use client';

import { XMarkIcon, EyeIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Task {
  id: number;
  title: string;
  description: string;
  isRecurring: boolean;
  recurringType: string | null;
  recurringInterval: number | null;
  customDueDate: string | null;
  status: 'pending' | 'completed';
  assignedMembers: string[];
  createdDate: string;
}

interface TaskDetailModalProps {
  task: Task;
  context: string | number;
  onClose: () => void;
}

export default function TaskDetailModal({ task, context, onClose }: TaskDetailModalProps) {
  const getScheduleText = (task: Task): string => {
    if (!task.isRecurring && task.customDueDate) {
      return `Due: ${task.customDueDate}`;
    }
    
    if (task.isRecurring) {
      const interval = task.recurringInterval || 1;
      
      switch (task.recurringType) {
        case 'daily':
          return interval === 1 ? 'Daily' : `Every ${interval} days`;
        case 'weekly':
          return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
        case 'monthly':
          return interval === 1 ? 'Monthly' : `Every ${interval} months`;
        default:
          return 'Recurring';
      }
    }
    
    return 'No schedule';
  };

  const getStatusBadge = (status: 'pending' | 'completed') => {
    return status === 'completed' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircleIcon className="w-3 h-3 mr-1" />
        Completed
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <ClockIcon className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <EyeIcon className="w-5 h-5 mr-2 text-blue-600" />
              Task Details
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{task.title}</p>
          </div>

          {task.description && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{task.description}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Schedule</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{getScheduleText(task)}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned To</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{task.assignedMembers.join(', ')}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <div className="flex items-center space-x-2">
              {getStatusBadge(task.status)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Created Date</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{task.createdDate}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Context</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
              {context === 'direct' ? 'Direct Category Task' : 'Subcategory Task'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
