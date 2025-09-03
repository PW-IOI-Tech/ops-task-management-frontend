'use client';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Eye, Edit, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {toast} from 'react-toastify';
import { Assignment } from '../utils/types';

// Updated interface to match your backend Assignment structure

type TaskFilter = 'all' | 'ADHOC' | 'RECURRING';

// Next.js App Router page component - no custom props needed
export default function CompletedTasksPage() {
  const router = useRouter();
  const [completedTasks, setCompletedTasks] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Assignment | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [parameterInput, setParameterInput] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Helper function to filter completed tasks
  const filterCompletedTasks = (allAssignments: Assignment[]): Assignment[] => {
    return allAssignments.filter(assignment => assignment.status === 'COMPLETED');
  };

  // Fetch all assignments from backend and filter completed ones
  const fetchCompletedTasks = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all assignments without status filter
      const response = await axios.get(`${backendURL}/api/assignments`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        const allAssignments = response.data.data;
        // Filter to only get completed tasks
        const completedAssignments = filterCompletedTasks(allAssignments);
        setCompletedTasks(completedAssignments);
        console.log(`Fetched ${allAssignments.length} total assignments, ${completedAssignments.length} completed`);
      } else {
        setError('Failed to fetch completed tasks');
      }
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      setError('Failed to fetch completed tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  const handleBackClick = () => {
    router.back();
  };

  const handleTaskNameClick = (task: Assignment): void => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

const handleInputClick = (task: Assignment): void => {
  setSelectedTask(task);
  
  // Handle different parameter types for initial values
  let initialValue = task.parameterValue || '';
  
  if (task.task.parameterType === 'DATETIME' && task.parameterValue) {
    try {
      // Convert UTC datetime back to local datetime-local format
      const utcDate = new Date(task.parameterValue);
      if (!isNaN(utcDate.getTime())) {
        // Format for datetime-local input (YYYY-MM-DDTHH:mm)
        const localDateTime = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
        initialValue = localDateTime.toISOString().slice(0, 16);
      }
    } catch (error) {
      console.error('Error parsing existing datetime value:', error);
      initialValue = '';
    }
  }
  
  setParameterInput(initialValue);
  setCommentInput(task.comment || '');
  setShowEditModal(true);
};

  // Handle editing completed task using the same API endpoint
  const handleEditSave = async (): Promise<void> => {
    if (!selectedTask) return;

    setIsSubmitting(true);
    try {
      const payload: { parameterValue: string; comment?: string } = {
        parameterValue: parameterInput,
      };

      // Only include comment if provided
      if (commentInput && commentInput.trim()) {
        payload.comment = commentInput;
      }

      // Use the same API endpoint to update the completed task
      const response = await axios.patch(
        `${backendURL}/api/assignments/${selectedTask.id}/complete`,
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        // Update local state
        setCompletedTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === selectedTask.id
              ? { 
                  ...task, 
                  parameterValue: parameterInput,
                  comment: commentInput || null,
                  updatedAt: new Date().toISOString()
                }
              : task
          )
        );

        // Close modal and reset states
        setShowEditModal(false);
        setParameterInput('');
        setCommentInput('');
        setSelectedTask(null);

        // Show success message
        toast.success('Task updated successfully');

        // Refresh data
        await fetchCompletedTasks();
      }
    } catch (error) {
      console.error('Error updating completed task:', error);
      alert('Failed to update task. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const filteredTasks = completedTasks.filter((task: Assignment) => {
    const matchesFilter = 
      taskFilter === 'all' || 
      (taskFilter === 'RECURRING' && task.task.taskType === 'RECURRING') ||
      (taskFilter === 'ADHOC' && task.task.taskType === 'ADHOC');
    
    const matchesSearch = task.task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.task.category && task.task.category.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.task.subcategory && task.task.subcategory.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.comment && task.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const getTaskTypeIcon = (taskType: string) => {
    return taskType === 'ADHOC' ? (
      <AlertCircle className="w-4 h-4 text-red-500" />
    ) : (
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    );
  };
  
  const getTaskTypeBadge = (taskType: string) => {
    return taskType === 'ADHOC' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Ad-hoc
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Recurring
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDueDate = (task: Assignment) => {
    if (task.task.taskType === 'ADHOC') {
      return task.task.dueDate ? formatDate(task.task.dueDate) : '-';
    } else {
      return task.schedule?.scheduledDate ? formatDate(task.schedule.scheduledDate) : '-';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading completed tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden p-8">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Error Loading Tasks</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchCompletedTasks}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={handleBackClick}
              className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 mr-4 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                Completed Tasks
              </h3>
              <p className="text-sm text-gray-600 mt-1">All finished tasks</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-white px-3 py-1 rounded-full shadow-sm">
              <span className="text-sm font-medium text-gray-700">{filteredTasks.length} completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Count Card */}
      <div className="p-6 border-b border-gray-200">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-700 mb-1">{completedTasks.length}</div>
              <div className="text-sm font-medium text-green-600">Total Completed Tasks</div>
            </div>
            <div className="bg-green-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-green-600 font-medium">
            <span>All tasks successfully completed</span>
            <CheckCircle2 className="w-3 h-3 ml-1" />
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search completed tasks..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-800 placeholder-gray-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
            <Filter className="w-4 h-4 text-gray-500 ml-2" />
            <select 
              value={taskFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTaskFilter(e.target.value as TaskFilter)}
              className="bg-transparent border-0 px-3 py-2 text-sm focus:outline-none focus:ring-0 text-gray-700 font-medium"
            >
              <option value="all">All Completed</option>
              <option value="RECURRING">Recurring Tasks</option>
              <option value="ADHOC">Ad-hoc Tasks</option>
            </select>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Task Details</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Category</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Sub-category</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Input</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Due Date</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task: Assignment, index: number) => (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-green-50 transition-colors duration-150">
                      <td className="py-4 px-6">
                        <div className="flex items-start space-x-3">
                          {getTaskTypeIcon(task.task.taskType)}
                          <div>
                            <button 
                              onClick={() => handleTaskNameClick(task)}
                              className="text-green-600 hover:text-green-800 font-medium text-left hover:underline transition-colors"
                            >
                              {index + 1}. {task.task.title}
                            </button>
                            <div className="mt-1">
                              {getTaskTypeBadge(task.task.taskType)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-900 font-medium">
                          {task.task.taskType === 'ADHOC' ? '-' : (task.task.category?.name || '-')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-900 font-medium">
                          {task.task.taskType === 'ADHOC' ? '-' : (task.task.subcategory?.name || '-')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleInputClick(task)}
                          className="inline-flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 border border-green-300 rounded-lg text-sm font-medium text-green-800 transition-colors duration-150 hover:shadow-sm min-w-[140px]"
                        >
                          <Edit className="w-4 h-4 mr-2 text-green-600" />
                          <div className="text-left">
                            <div className="text-xs text-green-600">
                              {task.task.parameterLabel}:
                            </div>
                            <div className="font-medium">
                              {task.parameterValue || 'Edit Input'}
                              {task.task.parameterUnit && ` ${task.task.parameterUnit}`}
                            </div>
                            {task.comment && (
                              <div className="text-xs text-gray-500 truncate max-w-[90px]">
                                {task.comment}
                              </div>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 font-medium">{getDueDate(task)}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 px-6 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <CheckCircle2 className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No completed tasks found</p>
                        <p className="text-sm">Complete some tasks to see them here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredTasks.length}</span> of <span className="font-medium">{completedTasks.length}</span> completed tasks
            </span>
            {searchTerm && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Filtered by: &quot;{searchTerm}&quot;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-green-600" />
                  Completed Task Details
                </h3>
                <button 
                  onClick={() => setShowTaskDetail(false)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.task.title}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-[60px]">{selectedTask.task.description || 'No description available'}</p>
              </div>
              {selectedTask.task.taskType !== 'ADHOC' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.task.category?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-category</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.task.subcategory?.name || '-'}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task Type</label>
                <div className="flex items-center space-x-2">
                  {getTaskTypeBadge(selectedTask.task.taskType)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Parameter Value</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedTask.parameterValue || 'No value entered'}
                  {selectedTask.task.parameterUnit && ` ${selectedTask.task.parameterUnit}`}
                </p>
              </div>
              {selectedTask.comment && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Comment</label>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedTask.comment}</p>
                </div>
              )}
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center text-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  <span className="font-medium">Task Completed</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Completed on: {selectedTask.completedAt ? formatDate(selectedTask.completedAt) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

     
     {/* Enhanced Edit Modal for Parameter and Comment */}
{showEditModal && selectedTask && (
  <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Edit className="w-5 h-5 mr-2 text-green-600" />
            Edit Completed Task
          </h3>
          <button 
            onClick={() => setShowEditModal(false)} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {selectedTask.task.parameterLabel}
            {selectedTask.task.parameterIsRequired && <span className="text-red-500"> *</span>}
            {selectedTask.task.parameterUnit && (
              <span className="text-gray-500"> ({selectedTask.task.parameterUnit})</span>
            )}
          </label>
          
          {/* Render different input types based on parameterType */}
          {selectedTask.task.parameterType === 'DROPDOWN' ? (
            <select
              value={parameterInput}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setParameterInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800"
              disabled={isSubmitting}
            >
              <option value="">Select an option</option>
              {selectedTask.task.dropdownOptions.map((option: string, index: number) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : selectedTask.task.parameterType === 'BOOLEAN' ? (
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="booleanValue"
                  value="true"
                  checked={parameterInput === 'true'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParameterInput(e.target.value)}
                  className="mr-2 text-green-600 focus:ring-green-500"
                  disabled={isSubmitting}
                />
                <span className="text-gray-700">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="booleanValue"
                  value="false"
                  checked={parameterInput === 'false'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParameterInput(e.target.value)}
                  className="mr-2 text-green-600 focus:ring-green-500"
                  disabled={isSubmitting}
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>
          ) : selectedTask.task.parameterType === 'DATETIME' ? (
            <input
              type="datetime-local"
              value={parameterInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParameterInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800"
              disabled={isSubmitting}
            />
          ) : selectedTask.task.parameterType === 'NUMBER' ? (
            <input
              type="number"
              value={parameterInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParameterInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800"
              placeholder="Enter a number..."
              disabled={isSubmitting}
            />
          ) : (
            // Default TEXT input
            <input
              type="text"
              value={parameterInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParameterInput(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-800"
              placeholder="Enter text..."
              disabled={isSubmitting}
            />
          )}
          
          {/* Show parameter type indicator */}
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              Type: {selectedTask.task.parameterType}
            </span>
            {selectedTask.task.parameterType === 'DATETIME' && (
              <span className="text-xs text-green-600">
                Local time (will be converted to UTC)
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Comment <span className="text-gray-400">(Optional)</span>
          </label>
          <textarea
            value={commentInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentInput(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none text-gray-800"
            placeholder="Edit optional comment..."
            disabled={isSubmitting}
          />
        </div>

        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <div className="flex items-center text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            <span className="font-medium">Editing completed task</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={() => setShowEditModal(false)}
            className="px-5 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 font-medium disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleEditSave}
            disabled={
              isSubmitting || 
              (selectedTask.task.parameterIsRequired && !parameterInput.trim())
            }
            className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-150 flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Update Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
};