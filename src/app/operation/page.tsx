'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyTasks from './utils/MyTasks';
import TaskOverview from './utils/TaskOverview';

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

const Page: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to check if a date is today
  const isToday = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);

  return (
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate()
  );
};


  // Helper function to filter today's tasks
  const filterTodayTasks = (allAssignments: Assignment[]): Assignment[] => {
    return allAssignments.filter(assignment => {
      let taskDate: string | null = null;

      if (assignment.task.taskType === 'ADHOC') {
        taskDate = assignment.task.dueDate;
      } else if (assignment.task.taskType === 'RECURRING') {
        taskDate = assignment.schedule?.scheduledDate || null;
      }

      // Return true only if the task is due today
      return taskDate ? isToday(taskDate) : false;
    });
  };

  const fetchAssignments = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${backendURL}/api/assignments`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.data.success) {
        const allAssignments = response.data.data;
        // Store all assignments (not filtered by date)
        setAssignments(allAssignments);
        
        // Log the counts for debugging
        const todayAssignments = filterTodayTasks(allAssignments);
        console.log(`Fetched ${allAssignments.length} total assignments, ${todayAssignments.length} due today`);
      } else {
        setError('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setError('Failed to fetch assignments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Update assignment in state after API operations
  const handleUpdateTask = (assignmentId: string, updatedFields: Partial<Assignment>): void => {
    setAssignments(prevAssignments => 
      prevAssignments.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, ...updatedFields }
          : assignment
      )
    );
  };

  // Remove completed assignment from state
  const handleCompleteTask = (assignmentId: string): void => {
    setAssignments(prevAssignments => 
      prevAssignments.filter(assignment => assignment.id !== assignmentId)
    );
  };

  const handleSaveTask = (assignmentId: string): void => {
    console.log('Task completed with assignment ID:', assignmentId);
    // Refresh assignments after completion
    fetchAssignments();
  };

  // Filter today's assignments for TaskOverview
  const todayAssignments = filterTodayTasks(assignments);

  // Show loading state
  if (loading && assignments.length === 0) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading assignments...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchAssignments}
                  className="bg-red-100 px-4 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* MyTasks receives ALL assignments */}
      <MyTasks 
        assignments={assignments}
        loading={loading}
        onRefresh={fetchAssignments}
      />
      
      {/* TaskOverview receives only TODAY'S assignments */}
      <TaskOverview 
        assignments={todayAssignments}
        loading={loading}
        onUpdateTask={handleUpdateTask}
        onCompleteTask={handleCompleteTask}
        onSaveTask={handleSaveTask}
        onRefresh={fetchAssignments}
      />
    </div>
  );
};

export default Page;
