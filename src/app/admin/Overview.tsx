'use client';

import { useState, useEffect, SetStateAction } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  InformationCircleIcon,
  Squares2X2Icon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

export default function Overview() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Tasks');
  type TaskUpdate = {
    id: string;
    name: string;
    description: string;
    category: string;
    subCategory: null;
    completionRate: number;
    completedTasks: number;
    totalTasks: number;
    assignee: string;
    taskType: string;
  };

  const [selectedTask, setSelectedTask] = useState<TaskUpdate | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  
  // State for API data
  const [dashboardSummary, setDashboardSummary] = useState({
    totalAssignedTasks: 0,
    pending: 0,
    completed: 0,
    adhoc: 0
  });
  type Assignee = {
    name: string;
    completionRate: number;
    completed: number;
    total: number;
  };

  type CategorySummaryItem = {
    category: string;
    assignees: Assignee[];
  };

  const [categorySummary, setCategorySummary] = useState<CategorySummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Function to fetch dashboard summary
  const fetchDashboardSummary = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/dashboard/summary`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setDashboardSummary(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard summary');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err instanceof Error ? err.message : String(err));
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error fetching dashboard summary:', err);
    }
  };

  // Function to fetch category summary
  const fetchCategorySummary = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/dashboard/category-summary`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setCategorySummary(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch category summary');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err instanceof Error ? err.message : String(err));
      } else {
        setError('An unknown error occurred');
      }
      console.error('Error fetching category summary:', err);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchDashboardSummary(),
          fetchCategorySummary()
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Transform API data to match your component's expected format
  const statsData = [
    {
      title: 'Total assigned tasks',
      value: dashboardSummary.totalAssignedTasks.toString(),
      icon: Squares2X2Icon,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total pending tasks',
      value: dashboardSummary.pending.toString(),
      icon: ClockIcon,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      title: 'Completed Tasks',
      value: dashboardSummary.completed.toString(),
      icon: CheckCircleIcon,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Ad-hoc task created',
      value: dashboardSummary.adhoc.toString(),
      icon: PlusIcon,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ];

  // Transform category summary data to task updates format
  const taskUpdates = categorySummary.flatMap((category, categoryIndex) => 
    category.assignees.map((assignee, assigneeIndex) => ({
      id: `${categoryIndex}-${assigneeIndex}`,
      name: category.category,
      description: `Category: ${category.category}`,
      category: category.category,
      subCategory: null,
      completionRate: assignee.completionRate,
      completedTasks: assignee.completed,
      totalTasks: assignee.total,
      assignee: assignee.name,
      taskType: 'normal'
    }))
  );

  // Filter tasks based on search and filter
  const filteredTasks = taskUpdates.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = false;
    if (selectedFilter === 'All Tasks') {
      matchesFilter = true;
    } else if (selectedFilter === 'Normal') {
      matchesFilter = task.taskType === 'normal';
    } else if (selectedFilter === 'Ad-hoc') {
      matchesFilter = task.taskType === 'ad-hoc';
    } else if (selectedFilter === 'Completed') {
      matchesFilter = task.completionRate === 100;
    }

    return matchesSearch && matchesFilter;
  });

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleCategoryClick = (task: TaskUpdate) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const getTaskTypeBadge = (taskType: string) => {
    return taskType === 'ad-hoc' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Ad-hoc
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Normal
      </span>
    );
  };

  const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="22"
            cy="22"
            r={radius}
            stroke="#10b981"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg animate-pulse">
              <Squares2X2Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Loading...</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <XMarkIcon className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rest of your existing JSX remains the same, but use filteredTasks instead of taskUpdates */}
      {/* Enhanced Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Squares2X2Icon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Overview of all tasks</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`flex items-center justify-center w-12 h-12 ${stat.bgColor} rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Latest Task Updates */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <EyeIcon className="w-5 h-5 text-blue-600" />
                </div>
                Latest task updates
              </h3>
              <p className="text-sm text-gray-600 mt-1">Latest & Pending tasks</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-white px-3 py-1 rounded-full shadow-sm">
                <span className="text-sm font-medium text-gray-700">{filteredTasks.length} tasks</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Enhanced Search and Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks, categories, or remarks..."
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
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-transparent border-0 px-3 py-2 text-sm focus:outline-none focus:ring-0 text-gray-700 font-medium"
              >
                <option value="All Tasks">All Tasks</option>
                <option value="Normal">Normal Tasks</option>
                <option value="Ad-hoc">Ad-hoc Tasks</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Enhanced Table */}
          <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Category</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Completion rate</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Completed tasks (completed/total)</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Assignee</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredTasks.map((task, index) => (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-150">
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-blue-600 font-medium">{index + 1}.</span>
                            <button 
                              onClick={() => handleCategoryClick(task)}
                              className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium hover:underline transition-colors text-left"
                            >
                              {task.taskType === 'ad-hoc' ? task.name : task.category}
                            </button>
                            <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="ml-6">
                            {getTaskTypeBadge(task.taskType)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <CircularProgress percentage={task.completionRate} />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="font-semibold text-gray-900">
                          {task.completedTasks}/{task.totalTasks}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium hover:underline transition-colors">
                          {task.assignee}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enhanced Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Showing <span className="font-medium">{filteredTasks.length}</span> of <span className="font-medium">{taskUpdates.length}</span> tasks
              </span>
              {searchTerm && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Filtered by: &quot;{searchTerm}&quot;
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Page 1 of 1</span>
              <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 text-gray-700">
                Previous
              </button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 hover:shadow-md">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Task Detail Modal */}
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.name}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-[60px]">{selectedTask.description || 'No description available'}</p>
              </div>
              {selectedTask.taskType !== 'ad-hoc' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.category || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-category</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.subCategory || '-'}</p>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Task Type</label>
                <div className="flex items-center space-x-2">
                  {getTaskTypeBadge(selectedTask.taskType)}
                </div>
              </div>
            </div>
          </div>
        </div> 
      )}
    </div>
  );
}
