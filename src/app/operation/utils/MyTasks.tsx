'use client';
import React, { useState } from 'react';
import { ChevronDown, Calendar, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Task } from './task';

interface MyTasksProps {
  tasks: Task[];
}

const MyTasks: React.FC<MyTasksProps> = ({ tasks }) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('16-08-2025');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const totalPendingTasks = tasks.length;
  const completedTasks = 6; // This could be calculated based on task status
  const adHocTasks = tasks.filter(task => task.taskType === 'ad-hoc').length;

  const handleCompletedTasksClick = () => {
    router.push('/operation/completed-tasks');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    const formattedDate = date.toLocaleDateString('en-GB').replace(/\//g, '-');
    setSelectedDate(formattedDate);
    setShowDatePicker(false);
    // Add your date filtering logic here
  };

  const formatDateForInput = (dateString: string) => {
    // Convert DD-MM-YYYY to YYYY-MM-DD for input type="date"
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };

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
                        onClick={() => {
                          const today = new Date();
                          const formattedDate = today.toLocaleDateString('en-GB').replace(/\//g, '-');
                          setSelectedDate(formattedDate);
                          setShowDatePicker(false);
                        }}
                        className="px-3 py-2 text-xs font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-150"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const formattedDate = tomorrow.toLocaleDateString('en-GB').replace(/\//g, '-');
                          setSelectedDate(formattedDate);
                          setShowDatePicker(false);
                        }}
                        className="px-3 py-2 text-xs font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-150"
                      >
                        Tomorrow
                      </button>
                      <button
                        onClick={() => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          const formattedDate = yesterday.toLocaleDateString('en-GB').replace(/\//g, '-');
                          setSelectedDate(formattedDate);
                          setShowDatePicker(false);
                        }}
                        className="px-3 py-2 text-xs font-medium text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-150"
                      >
                        Yesterday
                      </button>
                      <button
                        onClick={() => {
                          const nextWeek = new Date();
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          const formattedDate = nextWeek.toLocaleDateString('en-GB').replace(/\//g, '-');
                          setSelectedDate(formattedDate);
                          setShowDatePicker(false);
                        }}
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

      <div className="text-sm text-gray-500 mb-8 flex items-center">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
        Manage tasks effectively and stay organized
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
          <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
            <span>Click to view all</span>
            <ChevronDown className="w-3 h-3 ml-1 -rotate-90" />
          </div>
        </div>

        {/* Ad-hoc Tasks */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <div className="absolute -top-1 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
            New
          </div>
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
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>
              ))}
            </div>
            <span className="text-xs text-purple-600 font-medium ml-2">Urgent attention needed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTasks;
