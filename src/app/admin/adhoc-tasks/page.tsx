'use client';

import { useState, useEffect, } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  UserIcon,
  ExclamationTriangleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Updated interfaces to match your API response
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}


interface Assignment {
  assignmentId: string;
  status: string;
  parameterValue: unknown;
  comment: unknown;
  completedAt: unknown;
  assignedTo: {
    id: string;
    fullName: string;
    email: string;
  };
  dueDate: string;
}


// Updated Task interface to match your API response
interface Task {
  createdAt: unknown;
  parameterIsRequired: unknown;
  parameterType: string;
  dropdownOptions: unknown;
  taskId: string; // Use taskId instead of id
  title: string;
  description?: string;
  taskType: 'ADHOC' | 'RECURRING';
  parameterLabel: string;
  parameterUnit?: string;
  dueDate?: string | null;
  isAssigned: boolean;
  assignments?: Assignment[];
  createdBy: string;
  // Remove the old interface fields that don't match your API
}


interface CreateTaskForm {
  title: string;
  description: string;
  taskType: 'ADHOC' | 'RECURRING';
  parameterType: 'NUMBER' | 'TEXT' | 'DATETIME' | 'DROPDOWN' | 'BOOLEAN' | 'COMMENT';
  parameterLabel: string;
  parameterUnit: string;
  dropdownOptions: string;
  dueDate: string;
}

interface EditTaskForm {
  title: string;
  description: string;
  parameterLabel: string;
  parameterUnit: string;
  dropdownOptions: string;
  dueDate: string;
}

export default function AdHocTasks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date filtering states
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Modal states
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Assignment states
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateTaskForm>({
    title: '',
    description: '',
    taskType: 'ADHOC',
    parameterType: 'TEXT',
    parameterLabel: '',
    parameterUnit: '',
    dropdownOptions: '',
    dueDate: ''
  });
  
  const [editForm, setEditForm] = useState<EditTaskForm>({
    title: '',
    description: '',
    parameterLabel: '',
    parameterUnit: '',
    dropdownOptions: '',
    dueDate: ''
  });

  // Fetch tasks and members on mount
  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, []);

  const fetchTasks = async (from?: string, to?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `${backendUrl}/api/tasks?taskType=ADHOC`;
      if (from && to) {
        url += `&from=${from}&to=${to}`;
      }
      
      const response = await axios.get(url, {
        withCredentials: true
      });
      
      const tasksData = response.data?.data || [];
      
      if (Array.isArray(tasksData)) {
        // Map taskId to id for compatibility with existing code
        const mappedTasks = tasksData.map(task => ({
          ...task,
          id: task.taskId, // Add id field for compatibility
          createdAt: new Date().toISOString(), // Add default createdAt
          updatedAt: new Date().toISOString(), // Add default updatedAt
          parameterType: 'TEXT' as const, // Add default parameterType
          parameterIsRequired: true,
          dropdownOptions: [],
          timezone: 'UTC'
        }));
        setTasks(mappedTasks);
      } else {
        console.error('Tasks data is not an array:', tasksData);
        setTasks([]);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch tasks:', error);
      setError('Failed to fetch tasks. Please try again.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/users/members`, {
        withCredentials: true
      });
      
      console.log('Members API Response:', response.data);
      const membersData = response.data?.data || [];
      
      if (Array.isArray(membersData)) {
        setMembers(membersData);
      } else {
        console.error('Members data is not an array:', membersData);
        setMembers([]);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch members:', error);
      setMembers([]);
    }
  };

  // Handle date filtering
  const handleDateFilter = () => {
    if (dateFrom && dateTo) {
      fetchTasks(dateFrom, dateTo);
    } else {
      fetchTasks(); // Fetch all tasks if no date range specified
    }
    setShowDateFilter(false);
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    fetchTasks(); // Fetch all tasks
    setShowDateFilter(false);
  };

  // Create new task - Fixed API call
  const handleCreateTask = async () => {
  try {
    // Format dueDate to ISO date string or omit if invalid/empty
    const formattedDueDate = createForm.dueDate ? new Date(createForm.dueDate + 'T00:00:00.000Z').toISOString() : undefined;

    const taskData = {
      title: createForm.title,
      description: createForm.description || undefined,
      taskType: createForm.taskType,
      parameterType: createForm.parameterType,
      parameterLabel: createForm.parameterLabel,
      parameterUnit: createForm.parameterUnit || undefined,
      dueDate: formattedDueDate,
      dropdownOptions: createForm.dropdownOptions 
        ? createForm.dropdownOptions.split(',').map(opt => opt.trim())
        : undefined
    };

    console.log('Creating task with data:', taskData); // For debugging

    await axios.post(`${backendUrl}/api/tasks`, taskData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    setShowCreateModal(false);
    setCreateForm({
      title: '',
      description: '',
      taskType: 'ADHOC',
      parameterType: 'TEXT',
      parameterLabel: '',
      parameterUnit: '',
      dropdownOptions: '',
      dueDate: ''
    });
    fetchTasks();
  } catch (error: unknown) {
    console.error('Failed to create task:', error);
    setError('Failed to create task. Please try again.');
  }
};

  // Update existing task
 const handleEditSave = async () => {
  if (!selectedTask) return;

  try {
    const updateData = {
      title: editForm.title,
      description: editForm.description || undefined,
      parameterLabel: editForm.parameterLabel,
      parameterUnit: editForm.parameterUnit || undefined,
      dropdownOptions: editForm.dropdownOptions 
        ? editForm.dropdownOptions.split(',').map(opt => opt.trim())
        : undefined,
      dueDate: editForm.dueDate || undefined
    };

    // Use taskId if available, otherwise fall back to id
    const taskIdToUse = selectedTask.taskId ;
    
    await axios.patch(`${backendUrl}/api/tasks/${taskIdToUse}`, updateData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    setShowEditModal(false);
    setSelectedTask(null);
    fetchTasks();
  } catch (error: unknown) {
    console.error('Failed to update task:', error);
    setError('Failed to update task. Please try again.');
  }
};


  // Delete task
 const handleDeleteTask = async () => {
  if (!selectedTask) return;

  try {
    // Use taskId if available, otherwise fall back to id
    const taskIdToUse = selectedTask.taskId ;
    
    await axios.delete(`${backendUrl}/api/tasks/${taskIdToUse}`, {
      withCredentials: true
    });
    
    setShowDeleteConfirm(false);
    setSelectedTask(null);
    fetchTasks();
  } catch (error: unknown) {
    console.error('Failed to delete task:', error);
    setError('Failed to delete task. Please try again.');
  }
};

  // Assign members to task - Fixed taskId issue
  const handleAssignMembers = async () => {
  if (!selectedTask || selectedMembers.length === 0) return;

  try {
    setAssignLoading(true);
    
    // Use taskId if available, otherwise fall back to id
    const taskIdToUse = selectedTask.taskId ;
    
    const assignmentData = {
      userIds: selectedMembers,
      taskId: taskIdToUse
    };
    
    console.log('Assigning members with data:', assignmentData);
    
    await axios.post(`${backendUrl}/api/assignments`, assignmentData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    setShowAssignModal(false);
    setSelectedTask(null);
    setSelectedMembers([]);
    fetchTasks(); // Refresh to get updated assignments
  } catch (error: unknown) {
    console.error('Failed to assign members:', error);
    setError('Failed to assign members. Please try again.');
  } finally {
    setAssignLoading(false);
  }
};

  // Toggle member selection
  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Get task details
  const handleTaskClick = async (task: Task) => {
  try {
    // Use taskId if available, otherwise fall back to id
    const taskIdToUse = task.taskId ;
    
    const response = await axios.get(`${backendUrl}/api/tasks/${taskIdToUse}`, {
      withCredentials: true
    });
    setSelectedTask(response.data.data || task);
    setShowTaskDetail(true);
  } catch (error: unknown) {
    console.error('Failed to fetch task details:', error);
    setSelectedTask(task);
    setShowTaskDetail(true);
  }
};

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      parameterLabel: task.parameterLabel,
      parameterUnit: task.parameterUnit || '',
      dropdownOptions: Array.isArray(task.dropdownOptions) ? task.dropdownOptions.join(', ') : '',
      dueDate: task.dueDate || ''
    });
    setShowEditModal(true);
  };

  const handleAssignClick = (task: Task) => {
    setSelectedTask(task);
    setSelectedMembers([]);
    setShowAssignModal(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Filter tasks with safety check
  const filteredTasks = Array.isArray(tasks) ? tasks.filter((task) => {
    const matchesFilter = taskFilter === 'all' || task.taskType === taskFilter;
    
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      task.parameterLabel.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) : [];

  const adhocTasks = Array.isArray(tasks) ? tasks.filter(task => task.taskType === 'ADHOC') : [];
  const totalTasks = adhocTasks.length;

const getAssignedMembers = (task: Task) => {
  if (!task.assignments || task.assignments.length === 0) {
    return 'No members assigned';
  }
  return task.assignments
    .filter(assignment => assignment.assignedTo) // Filter out assignments without assignedTo data
    .map(assignment => assignment.assignedTo.fullName)
    .join(', ') || 'No members assigned';
};



  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-500 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Ad-hoc Tasks</h1>
              <p className="text-sm text-gray-600 mt-1">Manage urgent and ad-hoc tasks</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors duration-150"
            >
              <CalendarDaysIcon className="w-4 h-4 mr-2" />
              Filter Dates
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-150 hover:shadow-md"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Task
            </button>
          </div>
        </div>
        
        {/* Date Filter Panel */}
        {showDateFilter && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleDateFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Apply Filter
                </button>
                <button
                  onClick={clearDateFilter}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Ad-hoc Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{totalTasks}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Completed Ad-hoc Tasks</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <EyeIcon className="w-5 h-5 text-blue-600" />
                </div>
                Ad-hoc Tasks Overview
              </h3>
              <p className="text-sm text-gray-600 mt-1">Manage and track urgent tasks</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-white px-3 py-1 rounded-full shadow-sm">
                <span className="text-sm font-medium text-gray-700">{filteredTasks.length} tasks</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks, descriptions, or parameters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              <FunnelIcon className="w-4 h-4 text-gray-500 ml-2" />
              <select 
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className="bg-transparent border-0 px-3 py-2 text-sm focus:outline-none focus:ring-0 text-gray-700 font-medium"
              >
                <option value="all">All Tasks</option>
                <option value="ADHOC">Ad-hoc Only</option>
                <option value="RECURRING">Recurring Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-600">
                    {searchTerm || taskFilter !== 'all' 
                      ? 'Try adjusting your search terms or filters.' 
                      : 'Create your first ad-hoc task to get started.'
                    }
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Task Details</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Due Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Parameter</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Added Members</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredTasks.map((task, index) => (
                      <tr key={task.taskId} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-150">
                        <td className="py-4 px-6">
                          <button 
                            onClick={() => handleTaskClick(task)}
                            className="text-left"
                          >
                            <div className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors">
                              {index + 1}. {task.title}
                            </div>
                            {task.description && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                {task.description}
                              </div>
                            )}
                           
                          </button>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 font-medium">
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-600 text-sm">
                            <div className="font-medium">{task.parameterLabel}</div>
                            <div className="text-xs text-gray-500">
                              {task.parameterType || 'TEXT'}
                              {task.parameterUnit && ` (${task.parameterUnit})`}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-600 text-sm">
                            {getAssignedMembers(task)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleTaskClick(task)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(task)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Edit Task"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAssignClick(task)}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                              title="Add Members"
                            >
                              <UserPlusIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete Task"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal - Updated with Required Fields */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <PlusIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Create Ad-hoc Task
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                  className="w-full border border-gray-300 text-black rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter task title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                  rows={3}
                  className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Enter task description..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date *</label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({...createForm, dueDate: e.target.value})}
                  className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Parameter Label *</label>
                <input
                  type="text"
                  value={createForm.parameterLabel}
                  onChange={(e) => setCreateForm({...createForm, parameterLabel: e.target.value})}
                  className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Temperature Reading, Count, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Parameter Type *</label>
                <select
                  value={createForm.parameterType}
                  onChange={(e) => setCreateForm({...createForm, parameterType: e.target.value as CreateTaskForm['parameterType']})}
                  className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="TEXT">Text</option>
                  <option value="NUMBER">Number</option>
                  <option value="DATETIME">Date/Time</option>
                  <option value="DROPDOWN">Dropdown</option>
                  <option value="BOOLEAN">Yes/No</option>
                  <option value="COMMENT">Comment</option>
                </select>
              </div>

              {(createForm.parameterType === 'NUMBER') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                  <input
                    type="text"
                    value={createForm.parameterUnit}
                    onChange={(e) => setCreateForm({...createForm, parameterUnit: e.target.value})}
                    className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., °C, kg, units, etc."
                  />
                </div>
              )}

              {createForm.parameterType === 'DROPDOWN' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dropdown Options *</label>
                  <input
                    type="text"
                    value={createForm.dropdownOptions}
                    onChange={(e) => setCreateForm({...createForm, dropdownOptions: e.target.value})}
                    className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Option 1, Option 2, Option 3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!createForm.title || !createForm.parameterLabel || !createForm.dueDate || (createForm.parameterType === 'DROPDOWN' && !createForm.dropdownOptions)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Members Modal */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <UserPlusIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Assign Members to Task
                </h3>
                <button 
                  onClick={() => setShowAssignModal(false)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Members</label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                  {members.length === 0 ? (
                    <div className="text-center py-4">
                      <UserIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No members available</p>
                    </div>
                  ) : (
                    members.map((member) => (
                      <label 
                        key={member.id} 
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg border transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => toggleMemberSelection(member.id)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                          {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {selectedMembers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      <strong>{selectedMembers.length}</strong> member{selectedMembers.length > 1 ? 's' : ''} selected
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedMembers.map(memberId => {
                      const member = members.find(m => m.id === memberId);
                      return member ? (
                        <span key={memberId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {member.firstName} {member.lastName}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedMembers([]);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignMembers}
                  disabled={selectedMembers.length === 0 || assignLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignLoading ? (
                    <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-transparent border-t-white"></div>
                  ) : (
                    <UserPlusIcon className="w-4 h-4 mr-1" />
                  )}
                  {assignLoading ? 'Assigning...' : `Assign ${selectedMembers.length > 0 ? `(${selectedMembers.length})` : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keep all your existing modals (Edit, Delete, Task Detail) with the same structure but use taskId instead of id */}
      {/* Task Detail Modal */}
{showTaskDetail && selectedTask && (
  <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <EyeIcon className="w-5 h-5 mr-2 text-blue-600" />
            Task Details
          </h3>
          <button 
            onClick={() => setShowTaskDetail(false)} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.title}</p>
        </div>
        {selectedTask.description && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedTask.description}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Task Type</label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.taskType}</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
            {formatDate(selectedTask.dueDate)}
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Parameter Details</label>
          <div className="bg-gray-50 text-black p-3 rounded-lg space-y-2">
            <p><strong>Label:</strong> {selectedTask.parameterLabel}</p>
            <p><strong>Type:</strong> {selectedTask.parameterType}</p>
            {selectedTask.parameterUnit && (
              <p><strong>Unit:</strong> {selectedTask.parameterUnit}</p>
            )}
            <p><strong>Required:</strong> {selectedTask.parameterIsRequired ? 'Yes' : 'No'}</p>
            {Array.isArray(selectedTask.dropdownOptions) && selectedTask.dropdownOptions.length > 0 && (
              <div>
                <p><strong>Options:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  {selectedTask.dropdownOptions.map((option, index) => (
                    <li key={index}>{String(option)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned Members</label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{getAssignedMembers(selectedTask)}</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Created Date</label>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
            {(typeof selectedTask.createdAt === 'string' || typeof selectedTask.createdAt === 'number' || selectedTask.createdAt instanceof Date)
              ? new Date(selectedTask.createdAt).toLocaleDateString() + ' at ' + new Date(selectedTask.createdAt).toLocaleTimeString()
              : 'Date not available'}
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={() => {
              setShowTaskDetail(false);
              handleEditClick(selectedTask);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-150 flex items-center"
          >
            <PencilIcon className="w-4 h-4 mr-1" />
            Edit
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Edit Task Modal - Fixed with taskId */}
{showEditModal && selectedTask && (
  <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <PencilIcon className="w-5 h-5 mr-2 text-blue-600" />
            Edit Task
          </h3>
          <button 
            onClick={() => setShowEditModal(false)} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
            className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Enter task title..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
            rows={3}
            className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
            placeholder="Enter task description..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
          <input
            type="date"
            value={editForm.dueDate}
            onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
            className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Parameter Label</label>
          <input
            type="text"
            value={editForm.parameterLabel}
            onChange={(e) => setEditForm({...editForm, parameterLabel: e.target.value})}
            className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="e.g., Temperature Reading, Count, etc."
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Parameter Unit</label>
          <input
            type="text"
            value={editForm.parameterUnit}
            onChange={(e) => setEditForm({...editForm, parameterUnit: e.target.value})}
            className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="e.g., °C, kg, units, etc."
          />
        </div>

        {selectedTask.parameterType === 'DROPDOWN' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Dropdown Options</label>
            <input
              type="text"
              value={editForm.dropdownOptions}
              onChange={(e) => setEditForm({...editForm, dropdownOptions: e.target.value})}
              className="w-full border text-black border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Option 1, Option 2, Option 3"
            />
            <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Parameter type cannot be changed after creation.
            Current type: <strong>{selectedTask.parameterType}</strong>
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={() => setShowEditModal(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleEditSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center"
          >
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Delete Confirmation Modal - Fixed with taskId */}
{showDeleteConfirm && selectedTask && (
  <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Delete Task</h3>
          </div>
          <button 
            onClick={() => setShowDeleteConfirm(false)} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>&quot;{selectedTask.title}&quot;</strong>? This action cannot be undone and will permanently remove this task and all its data.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> This will also delete any assignments or responses associated with this task.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteTask}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-150 flex items-center"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Delete Task
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      
    </div>
  );
}
