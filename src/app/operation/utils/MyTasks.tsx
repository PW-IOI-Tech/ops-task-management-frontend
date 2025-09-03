// components/MyTasks.tsx
'use client';
import React, { useState } from 'react';
import { ChevronDown, Calendar, FileText, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Assignment } from './types';

// Interface to match the API response structure
// interface Assignment {
//   id: string;
//   taskId: string;
//   scheduleId: string | null;
//   assignedTo: string;
//   assignedBy: string;
//   status: 'PENDING' | 'COMPLETED';
//   parameterValue: string | null;
//   comment: string | null;
//   completedAt: string | null;
//   createdAt: string;
//   updatedAt: string;
//   task: {
//     id: string;
//     title: string;
//     description: string | null;
//     categoryId: string | null;
//     subcategoryId: string | null;
//     createdBy: string;
//     taskType: 'ADHOC' | 'RECURRING';
//     parameterType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'DROPDOWN';
//     parameterLabel: string;
//     parameterUnit: string | null;
//     parameterIsRequired: boolean;
//     dropdownOptions: string[];
//     dueDate: string | null; // For ADHOC tasks
//     nextDueDate: string | null;
//     category: {
//       id: string;
//       name: string;
//       description: string | null;
//     } | null;
//     subcategory: {
//       id: string;
//       name: string;
//       description: string | null;
//     } | null;
//   };
//   schedule: {
//     scheduledDate: string; // For RECURRING tasks
//   } | null;
// }

interface MyTasksProps {
  assignments: Assignment[];
  loading: boolean;
  onRefresh?: () => void;
}

const MyTasks: React.FC<MyTasksProps> = ({ assignments, loading, onRefresh }) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-GB').replace(/\//g, '-');
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Calculate task statistics
  const totalPendingTasks = assignments.filter(assignment => assignment.status === 'PENDING').length;
  const completedTasks = assignments.filter(assignment => assignment.status === 'COMPLETED').length;
  const adHocTasks = assignments.filter(assignment => 
    assignment.task.taskType === 'ADHOC' && assignment.status === 'PENDING'
  ).length;

  const handleCompletedTasksClick = () => {
    router.push('/operation/completed-tasks');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    const formattedDate = date.toLocaleDateString('en-GB').replace(/\//g, '-');
    setSelectedDate(formattedDate);
    setShowDatePicker(false);
    // You can add date filtering logic here
    console.log('Date selected:', formattedDate);
  };

  const formatDateForInput = (dateString: string) => {
    // Convert DD-MM-YYYY to YYYY-MM-DD for input type="date"
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };

  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const formattedDate = date.toLocaleDateString('en-GB').replace(/\//g, '-');
    setSelectedDate(formattedDate);
    setShowDatePicker(false);
  };

  // Filter assignments for selected date (optional implementation)
  const getAssignmentsForDate = (dateString: string) => {
    const selectedDateObj = new Date(dateString.split('-').reverse().join('-'));
    
    return assignments.filter(assignment => {
      let assignmentDate: Date | null = null;
      
      if (assignment.task.taskType === 'ADHOC' && assignment.task.dueDate) {
        assignmentDate = new Date(assignment.task.dueDate);
      } else if (assignment.task.taskType === 'RECURRING' && assignment.schedule?.scheduledDate) {
        assignmentDate = new Date(assignment.schedule.scheduledDate);
      }
      
      if (assignmentDate) {
        return assignmentDate.toDateString() === selectedDateObj.toDateString();
      }
      
      return false;
    });
  };

  const tasksForSelectedDate = getAssignmentsForDate(selectedDate);
  const pendingTasksForDate = tasksForSelectedDate.filter(assignment => assignment.status === 'PENDING').length;

  if (loading && assignments.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center text-gray-800">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          My Tasks
        </h2>
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-600">Date:</span>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:shadow-md"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {selectedDate}
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showDatePicker ? 'rotate-180' : ''}`} />
            </button>
            
            {showDatePicker && (
              <>
                {/* Overlay to close date picker when clicking outside */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDatePicker(false)}
                ></div>
                
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl z-20 p-4 min-w-64">
                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(selectedDate)}
                      onChange={handleDateChange}
                      className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 text-gray-800 bg-white"
                      style={{
                        colorScheme: 'light'
                      }}
                    />
                  </div>
                  
                  {/* Quick date options */}
                  <div className="border-t border-gray-300 pt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Quick Select:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setQuickDate(0)}
                        className="px-3 py-2 text-xs font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-150"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setQuickDate(1)}
                        className="px-3 py-2 text-xs font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-150"
                      >
                        Tomorrow
                      </button>
                      <button
                        onClick={() => setQuickDate(-1)}
                        className="px-3 py-2 text-xs font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-150"
                      >
                        Yesterday
                      </button>
                      <button
                        onClick={() => setQuickDate(7)}
                        className="px-3 py-2 text-xs font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-150"
                      >
                        Next Week
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Manage assignments effectively and stay organized
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
            disabled={loading}
          >
            <Loader2 className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Pending Tasks */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-orange-700 mb-1">{totalPendingTasks}</div>
              <div className="text-sm font-medium text-orange-600">Total pending tasks</div>
            </div>
            <div className="bg-orange-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
                style={{ 
                  width: assignments.length > 0 
                    ? `${(totalPendingTasks / assignments.length) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
          </div>
          <div className="mt-2 text-xs text-orange-600 font-medium">
            {pendingTasksForDate} tasks for {selectedDate}
          </div>
        </div>

        {/* Completed Tasks - Clickable */}
        <div 
          onClick={handleCompletedTasksClick}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300 group cursor-pointer hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-700 mb-1">{completedTasks}</div>
              <div className="text-sm font-medium text-green-600">Completed Tasks</div>
            </div>
            <div className="bg-green-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="w-full bg-green-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full w-full"></div>
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
            <span>Click to view all</span>
            <ChevronDown className="w-3 h-3 ml-1 -rotate-90" />
          </div>
        </div>

        {/* Ad-hoc Tasks */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          {adHocTasks > 0 && (
            <div className="absolute -top-1 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
              New
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-700 mb-1">{adHocTasks}</div>
              <div className="text-sm font-medium text-purple-600">Latest Ad-hoc tasks</div>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <AlertCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {adHocTasks > 0 ? (
              <>
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
                  ))}
                </div>
                <span className="text-xs text-purple-600 font-medium ml-2">Urgent attention needed</span>
              </>
            ) : (
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div className="bg-purple-300 h-2 rounded-full w-0"></div>
              </div>
            )}
          </div>
          {adHocTasks === 0 && (
            <div className="mt-2 text-xs text-purple-600 font-medium">
              No ad-hoc tasks pending
            </div>
          )}
        </div>
      </div>

      
      {/* {tasksForSelectedDate.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Tasks for {selectedDate} ({tasksForSelectedDate.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {tasksForSelectedDate.slice(0, 3).map((assignment, index) => (
              <div key={assignment.id} className="flex items-center text-xs">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  assignment.task.taskType === 'ADHOC' ? 'bg-red-400' : 'bg-green-400'
                }`}></div>
                <span className="text-gray-700 truncate">{assignment.task.title}</span>
                <span className={`ml-auto px-2 py-1 rounded text-xs font-medium ${
                  assignment.status === 'PENDING' 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {assignment.status}
                </span>
              </div>
            ))}
            {tasksForSelectedDate.length > 3 && (
              <div className="text-xs text-gray-500 italic">
                +{tasksForSelectedDate.length - 3} more tasks
              </div>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
};

export default MyTasks;
