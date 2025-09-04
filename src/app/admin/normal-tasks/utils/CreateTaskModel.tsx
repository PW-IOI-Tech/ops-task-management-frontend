'use client';

import { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { Task } from '@/app/operation/utils/task';
import { convertISTToUTC, convertUTCToIST } from '@/app/components/time';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface TaskFormData {
  title: string;
  description: string;
  taskType: 'RECURRING';
  parameterType: 'NUMBER' | 'TEXT' | 'DATETIME' | 'DROPDOWN' | 'BOOLEAN' | 'COMMENT';
  parameterLabel: string;
  parameterUnit: string;
  dropdownOptions: string;
  repetitionConfig: {
    type: 'interval' | 'weekly' | 'monthly';
    days?: number;
    onDays?: string[];
    onDate?: number;
    atTime: string; // This will store IST time for UI display
  };
}

interface CreateTaskModalProps {
  onClose: () => void;
  onCreateTask: (taskData: Task) => void;
  isSubcategoryTask?: boolean;
  categoryId?: string;
  subcategoryId?: string | null;
}

// Get current IST time as default
const getCurrentISTTime = (): string => {
  const now = new Date();
  // Convert current time to IST
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toTimeString().slice(0, 5);
};

export default function CreateTaskModal({ 
  onClose, 
  onCreateTask, 
  isSubcategoryTask = false,
  categoryId,
  subcategoryId = null
}: CreateTaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    taskType: 'RECURRING',
    parameterType: 'NUMBER',
    parameterLabel: '',
    parameterUnit: '',
    dropdownOptions: '',
    repetitionConfig: {
      type: 'interval',
      days: 3,
      atTime: '09:00' // Default IST time
    }
  });

  const [weeklyDays, setWeeklyDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  const createTask = async (taskData: Record<string, unknown>) => {
    try {
      const response = await axios.post(`${backendUrl}/api/tasks`, taskData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const handleWeeklyDayToggle = (day: string) => {
    setWeeklyDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const isValidTime = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleTimeChange = (timeValue: string): void => {
    setTimeError(null);
    
    if (timeValue && !isValidTime(timeValue)) {
      setTimeError('Please enter a valid time in HH:MM format');
      return;
    }

    setFormData({
      ...formData,
      repetitionConfig: {
        ...formData.repetitionConfig,
        atTime: timeValue
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setTimeError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Task title is required');
        setIsLoading(false);
        return;
      }

      if (!formData.parameterLabel.trim()) {
        setError('Parameter label is required');
        setIsLoading(false);
        return;
      }

      // Validate time format
      const istTime = formData.repetitionConfig?.atTime || '09:00';
      if (!isValidTime(istTime)) {
        setTimeError('Please enter a valid time in HH:MM format');
        setIsLoading(false);
        return;
      }

      // Prepare repetition config based on type with UTC conversion
      let repetitionConfig = null;
      
      if (formData.repetitionConfig?.type === 'interval') {
        repetitionConfig = {
          type: 'interval',
          days: formData.repetitionConfig.days || 1,
          // ✅ Convert IST time to UTC before sending to backend
          atTime: convertISTToUTC(istTime)
        };
      } else if (formData.repetitionConfig?.type === 'weekly') {
        if (weeklyDays.length === 0) {
          setError('Please select at least one day for weekly repetition');
          setIsLoading(false);
          return;
        }
        
        repetitionConfig = {
          type: 'weekly',
          onDays: weeklyDays, // Keep as string array
          // ✅ Convert IST time to UTC before sending to backend
          atTime: convertISTToUTC(istTime)
        };
      } else if (formData.repetitionConfig?.type === 'monthly') {
        repetitionConfig = {
          type: 'monthly',
          onDate: formData.repetitionConfig.onDate || 1,
          // ✅ Convert IST time to UTC before sending to backend
          atTime: convertISTToUTC(istTime)
        };
      }

      const taskPayload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        categoryId: categoryId?.toString(),
        subcategoryId: isSubcategoryTask ? subcategoryId : undefined,
        taskType: 'RECURRING',
        parameterType: formData.parameterType,
        parameterLabel: formData.parameterLabel.trim(),
        parameterUnit: formData.parameterUnit.trim() || undefined,
        dropdownOptions: formData.parameterType === 'DROPDOWN' 
          ? formData.dropdownOptions.split(',').map(opt => opt.trim()).filter(Boolean)
          : undefined,
        repetitionConfig: repetitionConfig
      };

      // Remove undefined values
      const cleanPayload = Object.fromEntries(
        Object.entries(taskPayload).filter(([_, value]) => value !== undefined)
      );

      console.log('Task payload (UTC time):', cleanPayload);
      console.log('Original IST time:', istTime, '-> UTC time:', convertISTToUTC(istTime));

      const createdTask = await createTask(cleanPayload);
      onCreateTask(createdTask);
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error instanceof Error && error.message) {
        setError(error.message);
      } else {
        setError('Failed to create task. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const weekDays = [
    { key: 'MON', label: 'Monday' },
    { key: 'TUE', label: 'Tuesday' },
    { key: 'WED', label: 'Wednesday' },
    { key: 'THU', label: 'Thursday' },
    { key: 'FRI', label: 'Friday' },
    { key: 'SAT', label: 'Saturday' },
    { key: 'SUN', label: 'Sunday' }
  ];

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              Create New Recurring Task {isSubcategoryTask ? '(in Subcategory)' : '(Direct Task)'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              disabled={isLoading}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-red-800">
                  <h4 className="font-medium">Error creating task</h4>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h4>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter task title..."
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Enter task description..."
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Task Type */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Task Configuration</h4>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">Recurring Task</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">This task will repeat based on the schedule you set below.</p>
            </div>
          </div>

          {/* Parameter Configuration */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Parameter Configuration</h4>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Parameter Type *</label>
              <select
                value={formData.parameterType}
                onChange={(e) => setFormData({...formData, parameterType: e.target.value as TaskFormData['parameterType']})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="NUMBER">Number</option>
                <option value="TEXT">Text</option>
                <option value="DATETIME">Date & Time</option>
                <option value="DROPDOWN">Dropdown</option>
                <option value="BOOLEAN">Boolean (Yes/No)</option>
                <option value="COMMENT">Comment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Parameter Label *</label>
              <input
                type="text"
                required
                value={formData.parameterLabel}
                onChange={(e) => setFormData({...formData, parameterLabel: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Temperature, Count, Status..."
                disabled={isLoading}
              />
            </div>

            {(formData.parameterType === 'NUMBER') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Parameter Unit (Optional)</label>
                <input
                  type="text"
                  value={formData.parameterUnit}
                  onChange={(e) => setFormData({...formData, parameterUnit: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., °C, kg, meters..."
                  disabled={isLoading}
                />
              </div>
            )}

            {formData.parameterType === 'DROPDOWN' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Dropdown Options *</label>
                <input
                  type="text"
                  required
                  value={formData.dropdownOptions}
                  onChange={(e) => setFormData({...formData, dropdownOptions: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Option 1, Option 2, Option 3..."
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">Separate options with commas</p>
              </div>
            )}
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">Schedule Configuration</h4>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Repetition Type *</label>
              <select
                value={formData.repetitionConfig?.type || 'interval'}
                onChange={(e) => setFormData({
                  ...formData,
                  repetitionConfig: {
                    ...formData.repetitionConfig,
                    type: e.target.value as 'interval' | 'weekly' | 'monthly'
                  }
                })}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="interval">Every X Days</option>
                <option value="weekly">Weekly (Specific Days)</option>
                <option value="monthly">Monthly (Specific Date)</option>
              </select>
            </div>

            {formData.repetitionConfig?.type === 'interval' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Repeat Every (Days) *</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.repetitionConfig.days || 1}
                  onChange={(e) => setFormData({
                    ...formData,
                    repetitionConfig: {
                      ...formData.repetitionConfig,
                      days: parseInt(e.target.value) || 1
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            )}

            {formData.repetitionConfig?.type === 'weekly' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Days *</label>
                <div className="grid grid-cols-2 gap-2">
                  {weekDays.map(day => (
                    <label key={day.key} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={weeklyDays.includes(day.key)}
                        onChange={() => handleWeeklyDayToggle(day.key)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                    </label>
                  ))}
                </div>
                {formData.repetitionConfig?.type === 'weekly' && weeklyDays.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Please select at least one day</p>
                )}
              </div>
            )}

            {formData.repetitionConfig?.type === 'monthly' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Day of Month *</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.repetitionConfig.onDate || 1}
                  onChange={(e) => setFormData({
                    ...formData,
                    repetitionConfig: {
                      ...formData.repetitionConfig,
                      onDate: parseInt(e.target.value) || 1
                    }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter day of month (1-31)"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* ✅ Enhanced Time Input with IST indication and UTC preview */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  Time (IST) *
                </div>
              </label>
              <input
                type="time"
                value={formData.repetitionConfig?.atTime || '09:00'}
                onChange={(e) => handleTimeChange(e.target.value)}
                className={`w-full border rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  timeError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={isLoading}
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Time will be converted to UTC for storage
                </p>
                {formData.repetitionConfig?.atTime && (
                  <p className="text-xs text-blue-600">
                    UTC: {convertISTToUTC(formData.repetitionConfig.atTime)}
                  </p>
                )}
              </div>
              {timeError && (
                <p className="text-xs text-red-500 mt-1">{timeError}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !!timeError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
