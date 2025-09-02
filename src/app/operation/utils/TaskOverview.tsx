// components/TaskOverview.tsx
'use client';
import React, { useState ,JSX} from 'react';
import { Search, Filter, Eye, Edit, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Interface to match the API response structure
interface Assignment {
  id: string;
  taskId: string;
  scheduleId: string | null;
  assignedTo: string;
  assignedBy: string;
  status: 'PENDING' | 'COMPLETED';
  parameterValue: string | null;
  comment: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  task: {
    id: string;
    title: string;
    description: string | null;
    categoryId: string | null;
    subcategoryId: string | null;
    createdBy: string;
    taskType: 'ADHOC' | 'RECURRING';
    parameterType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'DROPDOWN';
    parameterLabel: string;
    parameterUnit: string | null;
    parameterIsRequired: boolean;
    dropdownOptions: string[];
    dueDate: string | null; // For ADHOC tasks
    nextDueDate: string | null;
    category: {
      id: string;
      name: string;
      description: string | null;
    } | null;
    subcategory: {
      id: string;
      name: string;
      description: string | null;
    } | null;
  };
  schedule: {
    scheduledDate: string; // For RECURRING tasks
  } | null;
}

type TaskFilter = 'all' | 'ADHOC' | 'RECURRING';

interface TaskOverviewProps {
  assignments: Assignment[];
  loading: boolean;
  onUpdateTask?: (assignmentId: string, updatedFields: Partial<Assignment>) => void;
  onCompleteTask?: (assignmentId: string) => void;
  onSaveTask?: (assignmentId: string) => void;
  onRefresh?: () => void;
}

const TaskOverview: React.FC<TaskOverviewProps> = ({
  assignments,
  loading,
  onUpdateTask,
  onCompleteTask,
  onSaveTask,
  onRefresh
}) => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState<boolean>(false);
  const [showInputModal, setShowInputModal] = useState<boolean>(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [parameterInput, setParameterInput] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter only pending assignments for the overview
  const pendingAssignments = assignments.filter(assignment => assignment.status === 'PENDING');

  const handleTaskNameClick = (assignment: Assignment): void => {
    setSelectedAssignment(assignment);
    setShowTaskDetail(true);
  };

  const handleInputClick = (assignment: Assignment): void => {
    setSelectedAssignment(assignment);
    setParameterInput(assignment.parameterValue || '');
    setCommentInput(assignment.comment || '');
    setShowInputModal(true);
  };

  const handleInputSave = async (): Promise<void> => {
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    try {
      const payload: { parameterValue: string; comment?: string } = {
        parameterValue: parameterInput,
      };

      // Only include comment if provided
      if (commentInput && commentInput.trim()) {
        payload.comment = commentInput;
      }

      const response = await axios.patch(
        `${baseURL}/api/assignments/${selectedAssignment.id}/complete`,
        payload,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        // Call parent callback to remove completed assignment
        if (onCompleteTask) {
          onCompleteTask(selectedAssignment.id);
        }

        // Call save callback if provided
        if (onSaveTask) {
          onSaveTask(selectedAssignment.id);
        }

        // Close modal and reset states
        setShowInputModal(false);
        setParameterInput('');
        setCommentInput('');
        setSelectedAssignment(null);

        // Show success message
        toast.success('Task completed successfully');

        // Refresh data if callback provided
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      console.error('Error completing assignment:', error);
      alert('Failed to complete task. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSearch = (): void => {
    setSearchTerm('');
  };

  const filteredAssignments = pendingAssignments.filter((assignment: Assignment) => {
    const matchesFilter = 
      taskFilter === 'all' || 
      assignment.task.taskType === taskFilter;
    
    const matchesSearch = 
      assignment.task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.task.category?.name && assignment.task.category.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assignment.task.subcategory?.name && assignment.task.subcategory.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assignment.comment && assignment.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    
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

  const getDueDate = (assignment: Assignment): string => {
    if (assignment.task.taskType === 'ADHOC') {
      return assignment.task.dueDate 
        ? new Date(assignment.task.dueDate).toLocaleDateString('en-GB') 
        : 'No due date';
    } else {
      return assignment.schedule?.scheduledDate 
        ? new Date(assignment.schedule.scheduledDate).toLocaleDateString('en-GB') 
        : 'No schedule';
    }
  };

 

  if (loading && pendingAssignments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              Task Overview
            </h3>
            <p className="text-sm text-gray-600 mt-1">Latest & Pending assignments</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-white px-3 py-1 rounded-full shadow-sm">
              <span className="text-sm font-medium text-gray-700">{filteredAssignments.length} tasks</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Enhanced Search and Filter Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks, categories, or remarks..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-800 placeholder-gray-500"
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
              <option value="all">All Tasks</option>
              <option value="RECURRING">Recurring Tasks</option>
              <option value="ADHOC">Ad-hoc Tasks</option>
            </select>
          </div>
        </div>

        {/* Enhanced Table */}
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
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 px-6 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Eye className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No pending tasks found</p>
                        <p className="text-sm">All tasks have been completed or filtered out.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((assignment: Assignment, index: number) => (
                    <tr key={assignment.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-150">
                      <td className="py-4 px-6">
                        <div className="flex items-start space-x-3">
                          {getTaskTypeIcon(assignment.task.taskType)}
                          <div>
                            <button 
                              onClick={() => handleTaskNameClick(assignment)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-left hover:underline transition-colors"
                            >
                              {index + 1}. {assignment.task.title}
                            </button>
                            <div className="mt-1">
                              {getTaskTypeBadge(assignment.task.taskType)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-900 font-medium">
                          {assignment.task.taskType === 'ADHOC' ? '-' : (assignment.task.category?.name || '-')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-900 font-medium">
                          {assignment.task.taskType === 'ADHOC' ? '-' : (assignment.task.subcategory?.name || '-')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleInputClick(assignment)}
                          className="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg text-sm font-medium text-blue-800 transition-colors duration-150 hover:shadow-sm min-w-[140px]"
                        >
                          <Edit className="w-4 h-4 mr-2 text-blue-600" />
                          <div className="text-left">
                            <div className="text-xs text-blue-600">{assignment.task.parameterLabel}:</div>
                            <div className="font-medium">{assignment.parameterValue || 'Add Input'}</div>
                            {assignment.comment && (
                              <div className="text-xs text-gray-500 truncate max-w-[90px]">
                                {assignment.comment}
                              </div>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 font-medium">{getDueDate(assignment)}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredAssignments.length}</span> of <span className="font-medium">{pendingAssignments.length}</span> tasks
            </span>
            {searchTerm && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Filtered by: &quot;{searchTerm}&quot;
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Page 1 of 1</span>
            <button className="px-4 py-2 text-sm border text-black border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              Previous
            </button>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Task Detail Modal */}
      {showTaskDetail && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-blue-600" />
                  Task Details
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
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAssignment.task.title}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-[60px]">
                  {selectedAssignment.task.description || 'No description available'}
                </p>
              </div>
              {selectedAssignment.task.taskType !== 'ADHOC' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedAssignment.task.category?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-category</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedAssignment.task.subcategory?.name || '-'}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task Type</label>
                <div className="flex items-center space-x-2">
                  {getTaskTypeBadge(selectedAssignment.task.taskType)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{getDueDate(selectedAssignment)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combined Input Modal */}
      {showInputModal && selectedAssignment && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="border-b border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-blue-600" />
                  Complete Task
                </h3>
                <button 
                  onClick={() => setShowInputModal(false)} 
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
                  Parameter Input {selectedAssignment.task.parameterType} 
                  {selectedAssignment.task.parameterUnit && <span className="text-red-500"> in ({selectedAssignment.task.parameterUnit})</span>}
                </label>
               <input type="text" 
               value={parameterInput}
               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setParameterInput(e.target.value)}
               className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Comment <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  value={commentInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentInput(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-gray-800"
                  placeholder="Enter optional comment..."
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowInputModal(false)}
                  className="px-5 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInputSave}
                  disabled={
                    isSubmitting || 
                    (selectedAssignment.task.parameterIsRequired && !parameterInput.trim())
                  }
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Complete Task
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

export default TaskOverview;
