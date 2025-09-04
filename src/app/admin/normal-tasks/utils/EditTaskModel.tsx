'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { Task, RepetitionConfig } from './types';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

type ParameterType = 'NUMBER' | 'TEXT' | 'DATETIME' | 'DROPDOWN' | 'BOOLEAN' | 'COMMENT';


export const convertUTCToIST = (utcTime: string): string => {
  if (!utcTime) return '09:00';
  
  try {
    const [hours, minutes] = utcTime.split(':').map(Number);
    
    let totalMinutes = (hours * 60) + minutes;
   
    totalMinutes += 330;
    
   
    if (totalMinutes >= 1440) {
      totalMinutes -= 1440;
    }
    
    const istHours = Math.floor(totalMinutes / 60);
    const istMinutes = totalMinutes % 60;
    
    return `${String(istHours).padStart(2, '0')}:${String(istMinutes).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error converting UTC to IST:', error);
    return '09:00';
  }
};

export const convertISTToUTC = (istTime: string): string => {
  if (!istTime) return '03:30';
  
  try {
    const [hours, minutes] = istTime.split(':').map(Number);
    
    // Convert to total minutes
    let totalMinutes = (hours * 60) + minutes;
    
    // Subtract IST offset: -5 hours 30 minutes = -330 minutes
    totalMinutes -= 330;
    
    // Handle negative overflow (previous day)
    if (totalMinutes < 0) {
      totalMinutes += 1440; // Add 24 hours
    }
    
    // Convert back to hours and minutes
    const utcHours = Math.floor(totalMinutes / 60);
    const utcMinutes = totalMinutes % 60;
    
    return `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error converting IST to UTC:', error);
    return '03:30';
  }
};



const isValidTime = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

interface TaskFormData {
  title: string;
  description: string;
  taskType: 'RECURRING'; 
  parameterType: ParameterType;
  parameterLabel: string;
  parameterUnit: string;
  dropdownOptions: string;
  repetitionConfig: RepetitionConfig;
}

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (taskData: Task) => void;
  isSubcategoryTask?: boolean;
  categoryId?: number;
  subcategoryId?: string | null;
}

interface WeekDay {
  key: string;
  label: string;
}

interface UpdateTaskPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  subcategoryId?: string;
  taskType?: 'RECURRING';
  parameterType?: ParameterType;
  parameterLabel?: string;
  parameterUnit?: string;
  dropdownOptions?: string[];
  repetitionConfig?: RepetitionConfig;
}

export default function EditTaskModal({ 
  task,
  onClose, 
  onUpdateTask, 
  isSubcategoryTask = false,
  categoryId,
  subcategoryId = null
}: EditTaskModalProps) {
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
      atTime: '09:00' // Default IST time for display
    }
  });

  const [weeklyDays, setWeeklyDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  // ✅ Initialize form with existing task data, converting UTC to IST for display
  useEffect(() => {
    if (task) {
      // Convert UTC time from backend to IST for display
      const displayTime = task.repetitionConfig?.atTime 
        ? convertUTCToIST(task.repetitionConfig.atTime)
        : '09:00';

      setFormData({
        title: task.title || '',
        description: task.description || '',
        taskType: 'RECURRING',
        parameterType: task.parameterType || 'NUMBER',
        parameterLabel: task.parameterLabel || '',
        parameterUnit: task.parameterUnit || '',
        dropdownOptions: Array.isArray(task.dropdownOptions) 
          ? task.dropdownOptions.join(', ') 
          : (task.dropdownOptions || ''),
        repetitionConfig: (task.repetitionConfig && ['interval', 'weekly', 'monthly'].includes(task.repetitionConfig.type as string))
          ? {
              ...task.repetitionConfig,
              type: task.repetitionConfig.type as 'interval' | 'weekly' | 'monthly',
              // ✅ Convert UTC time to IST for display
              atTime: displayTime
            }
          : {
              type: 'interval',
              days: 3,
              atTime: '09:00'
            }
      });

      // Handle weekly days initialization
      if (task.repetitionConfig?.onDays) {
        if (Array.isArray(task.repetitionConfig.onDays)) {
          if (typeof task.repetitionConfig.onDays[0] === 'string') {
            setWeeklyDays(task.repetitionConfig.onDays as string[]);
          } else if (typeof task.repetitionConfig.onDays[0] === 'number') {
            const dayMap: { [key: number]: string } = {
              1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU',
              5: 'FRI', 6: 'SAT', 7: 'SUN'
            };
            setWeeklyDays(task.repetitionConfig.onDays.map(day => dayMap[parseInt(day, 10)]).filter(Boolean));
          }
        }
      }
    }
  }, [task]);

  const updateTask = async (taskId: string, updateData: UpdateTaskPayload): Promise<Task> => {
    try {
      const response = await axios.patch(`${backendUrl}/api/tasks/${taskId}`, updateData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const handleWeeklyDayToggle = (day: string): void => {
    setWeeklyDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
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
      let repetitionConfig: RepetitionConfig | null = null;
      
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
          onDays: weeklyDays, // Keep as string array: ["MON", "WED", "FRI"]
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

      const updatePayload: UpdateTaskPayload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        categoryId: categoryId?.toString(),
        subcategoryId: isSubcategoryTask ? subcategoryId || undefined : undefined,
        taskType: 'RECURRING',
        parameterType: formData.parameterType,
        parameterLabel: formData.parameterLabel.trim(),
        parameterUnit: formData.parameterUnit.trim() || undefined,
        dropdownOptions: formData.parameterType === 'DROPDOWN' 
          ? formData.dropdownOptions.split(',').map(opt => opt.trim()).filter(Boolean)
          : undefined,
        repetitionConfig: repetitionConfig || undefined
      };

      // Remove undefined values
      const cleanPayload: UpdateTaskPayload = Object.fromEntries(
        Object.entries(updatePayload).filter(([_, value]) => value !== undefined)
      ) as UpdateTaskPayload;

      console.log('Update payload (UTC time):', cleanPayload);
      console.log('Original IST time:', istTime, '-> UTC time:', convertISTToUTC(istTime));

      const updatedTask = await updateTask(task.id, cleanPayload);
      onUpdateTask(updatedTask);
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update task. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const weekDays: WeekDay[] = [
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
              Edit Recurring Task
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
                  <h4 className="font-medium">Error updating task</h4>
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
                onChange={(e) => setFormData({...formData, parameterType: e.target.value as ParameterType})}
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
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Update Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
