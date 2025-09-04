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
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface TaskMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Schedule {
  scheduledDate: string;
}

interface TaskAssignment {
  id: string;
  taskId: string;
  scheduleId: string;
  assignedTo: string;
  assignedBy: string;
  status: 'PENDING' | 'COMPLETED';
  parameterValue: string | null;
  comment: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedToUser: TaskMember;
  schedule: Schedule;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Subcategory {
  id: string;
  name: string;
  description?: string;
}

interface CreatedByUser {
  firstName: string;
  lastName: string;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  taskType: 'ADHOC' | 'RECURRING';
  parameterLabel: string;
  parameterUnit?: string | null;
  dueDate?: string | null;
  category: Category;
  subcategory: Subcategory | null;
  lastGenerated: string;
  createdByUser: CreatedByUser;
  taskAssignments: TaskAssignment[];
}

interface TaskViewModalProps {
  taskId: string;
  onClose: () => void;
}

export default function TaskViewModal({ taskId, onClose }: TaskViewModalProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // ✅ IST timezone conversion utilities
  const formatDateTimeIST = (utcDateString: string): string => {
    try {
      const utcDate = new Date(utcDateString);
      return utcDate.toLocaleString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' IST';
    } catch (error) {
      console.error('Error formatting datetime in IST:', error);
      return '-';
    }
  };

  const formatDateIST = (utcDateString: string): string => {
    try {
      const utcDate = new Date(utcDateString);
      return utcDate.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date in IST:', error);
      return '-';
    }
  };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Completed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Unknown
          </span>
        );
    }
  };

  const getScheduleText = (task: TaskDetail): string => {
    if (task.taskType === 'ADHOC' && task.dueDate) {
      return formatDateTimeIST(task.dueDate);
    }
    
    if (task.taskType === 'RECURRING') {
      return 'Recurring Task';
    }
    
    return 'No schedule set';
  };

  // ✅ Get all assigned members with their details
  const getAssignedMembers = (taskAssignments: TaskAssignment[]): TaskMember[] => {
    return taskAssignments.map(assignment => assignment.assignedToUser);
  };

  // ✅ Format parameter value for display
  const formatParameterValue = (value: string | null, unit?: string | null): string => {
    if (!value) return '-';
    return value + (unit ? ` ${unit}` : '');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6">
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
      <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6">
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

  const assignedMembers = getAssignedMembers(task.taskAssignments);

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-xl border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{task.title || 'Untitled Task'}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Times shown in IST timezone
                </p>
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

        {/* ✅ Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="w-4 h-4 mr-2 inline" />
              Task Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClipboardDocumentListIcon className="w-4 h-4 mr-2 inline" />
              History ({task.taskAssignments.length})
            </button>
          </nav>
        </div>

        {/* ✅ Tab Content */}
        <div className="p-6">
          {activeTab === 'details' ? (
            /* Task Details Content */
            <div className="space-y-6">
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
                    {task.category?.name || 'No category'}
                  </p>
                </div>

                {/* Subcategory */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <FolderIcon className="w-4 h-4 mr-1" />
                    Subcategory
                  </h3>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                    {task.subcategory?.name || 'No subcategory'}
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

                {/* Due Date/Schedule */}
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
    Assigned Members ({assignedMembers.length})
  </h3>
  <div className="bg-gray-50 rounded-lg p-3">
    {assignedMembers.length > 0 ? (
      <div className="space-y-2">
        {assignedMembers.map((member) => (
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
                  {task.createdByUser ? `${task.createdByUser.firstName} ${task.createdByUser.lastName}` : 'Unknown'}
                </p>
              </div>
            </div>
          ) : (
            /* ✅ Task History Content */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
                  Task History
                </h3>
                <span className="text-sm text-gray-500">
                  {task.taskAssignments.length} record{task.taskAssignments.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* ✅ Task History Table */}
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-100">
        <tr>
          {/* ✅ REMOVED: Assigned To column */}
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Scheduled Date (IST)
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Parameter Value
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Completed At (IST)
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Comment
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {task.taskAssignments.length > 0 ? (
          task.taskAssignments.map((assignment) => (
            <tr key={assignment.id} className="hover:bg-gray-50">
              {/* ✅ REMOVED: Assigned To cell */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {assignment.schedule?.scheduledDate 
                  ? formatDateTimeIST(assignment.schedule.scheduledDate)
                  : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {getStatusBadge(assignment.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="font-mono">
                  {formatParameterValue(assignment.parameterValue, task.parameterUnit)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {assignment.completedAt 
                  ? formatDateTimeIST(assignment.completedAt)
                  : '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                {assignment.comment ? (
                  <div className="flex items-start">
                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{assignment.comment}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No comment</span>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
              {/* ✅ UPDATED: colSpan reduced from 6 to 5 */}
              <div className="flex flex-col items-center">
                <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-lg font-medium">No history records found</p>
                <p className="text-sm">Task assignments will appear here once created.</p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

              {/* ✅ History Summary */}
              {task.taskAssignments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-green-800 font-semibold">
                          {task.taskAssignments.filter(a => a.status === 'COMPLETED').length}
                        </p>
                        <p className="text-green-600 text-xs">Completed</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ClockIcon className="w-5 h-5 text-yellow-600 mr-2" />
                      <div>
                        <p className="text-yellow-800 font-semibold">
                          {task.taskAssignments.filter(a => a.status === 'PENDING').length}
                        </p>
                        <p className="text-yellow-600 text-xs">Pending</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-blue-800 font-semibold">
                          {task.taskAssignments.length}
                        </p>
                        <p className="text-blue-600 text-xs">Total Records</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Last generated: {task.lastGenerated ? formatDateTimeIST(task.lastGenerated) : 'Never'}
            </div>
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
