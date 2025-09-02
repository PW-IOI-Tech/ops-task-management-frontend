'use client';

import { useEffect, useState } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UserIcon,
  TagIcon,
  FolderIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface TaskMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TaskDetail {
  taskId: string;
  title: string;
  description: string | null;
  taskType: 'ADHOC' | 'RECURRING';
  category: string | { id: string; name: string; description?: string };
  subcategory?: string | { id: string; name: string; description?: string };
  parameterLabel: string;
  parameterUnit?: string | null;
  dueDate?: string | null;
  assignedTo: TaskMember[];
  createdBy: string;
  status?: 'pending' | 'completed';
}

interface TaskViewModalProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskViewModal({ taskId, onClose }: TaskViewModalProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/api/tasks/${taskId}`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Task details response:', response.data);
        
        const taskData = response.data.success ? response.data.data : response.data;
        setTask(taskData);
      } catch (error) {
        console.error('Error fetching task details:', error);
        setError('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  const getStatusBadge = (status: string = 'pending') => {
    return status === 'completed' ? (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Completed
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
        <ClockIcon className="w-4 h-4 mr-1" />
        Pending
      </span>
    );
  };

  const getScheduleText = (task: TaskDetail): string => {
    if (task.taskType === 'ADHOC' && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (task.taskType === 'RECURRING') {
      return 'Recurring Task';
    }
    
    return 'No schedule set';
  };

  // Helper functions to safely extract string values
  const getCategoryName = (category: string | { name: string } | undefined): string => {
    if (!category) return 'No category';
    if (typeof category === 'string') return category;
    return category.name || 'No category';
  };

  const getSubcategoryName = (subcategory: string | { name: string } | undefined): string => {
    if (!subcategory) return 'No subcategory';
    if (typeof subcategory === 'string') return subcategory;
    return subcategory.name || 'No subcategory';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading task details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-red-600">Error</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 text-center">{error || 'Task not found'}</p>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-xl border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{task.title || 'Untitled Task'}</h2>
                <div className="mt-1">
                  {getStatusBadge(task.status)}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
              {task.description || 'No description provided'}
            </p>
          </div>

          {/* Task Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <TagIcon className="w-4 h-4 mr-1" />
                Category
              </h3>
              <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                {getCategoryName(task.category)}
              </p>
            </div>

            {/* Subcategory */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <FolderIcon className="w-4 h-4 mr-1" />
                Subcategory
              </h3>
              <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                {getSubcategoryName(task.subcategory)}
              </p>
            </div>

            {/* Task Type */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Task Type</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                task.taskType === 'ADHOC' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {task.taskType === 'ADHOC' ? 'Ad-hoc' : 'Recurring'}
              </span>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <CalendarDaysIcon className="w-4 h-4 mr-1" />
                Schedule
              </h3>
              <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                {getScheduleText(task)}
              </p>
            </div>
          </div>

          {/* Parameter Details */}
          {task.parameterLabel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Parameter</h3>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                  {task.parameterLabel}
                </p>
              </div>
              {task.parameterUnit && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">Unit</h3>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                    {task.parameterUnit}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Assigned Members */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <UserIcon className="w-4 h-4 mr-1" />
              Assigned Members ({Array.isArray(task.assignedTo) ? task.assignedTo.length : 0})
            </h3>
            <div className="bg-gray-50 rounded-lg p-3">
              {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 ? (
                <div className="space-y-2">
                  {task.assignedTo.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {(member.firstName || '').charAt(0)}{(member.lastName || '').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {member.firstName || ''} {member.lastName || ''}
                        </p>
                        <p className="text-sm text-gray-500">{member.email || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No members assigned</p>
              )}
            </div>
          </div>

          {/* Created By */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Created By</h3>
            <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
              {task.createdBy || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
