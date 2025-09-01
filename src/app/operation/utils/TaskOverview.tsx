// components/TaskOverview.tsx
'use client';
import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Task, TaskFilter } from './task';
import ParameterInputModal from './ParameterInputModel';

interface TaskOverviewProps {
  tasks: Task[];
  onUpdateTask: (taskId: number, updatedFields: Partial<Task>) => void;
  onSaveTask: (taskId: number) => void;
}

const TaskOverview: React.FC<TaskOverviewProps> = ({
  tasks,
  onUpdateTask,
  onSaveTask
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState<boolean>(false);
  const [showParameterModal, setShowParameterModal] = useState<boolean>(false);
  const [showRemarkModal, setShowRemarkModal] = useState<boolean>(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [remark, setRemark] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleTaskNameClick = (task: Task): void => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleParameterClick = (task: Task): void => {
    setSelectedTask(task);
    setShowParameterModal(true);
  };

  const handleRemarkClick = (task: Task): void => {
    setSelectedTask(task);
    setRemark(task.remark || '');
    setShowRemarkModal(true);
  };

  const handleParameterSave = (value: string): void => {
    if (selectedTask) {
      onUpdateTask(selectedTask.id, { parameter: value });
    }
    setShowParameterModal(false);
  };

  const handleRemarkSave = (): void => {
    if (selectedTask) {
      onUpdateTask(selectedTask.id, { remark: remark });
    }
    setShowRemarkModal(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const filteredTasks = tasks.filter((task: Task) => {
    const matchesFilter = 
      taskFilter === 'all' || 
      (taskFilter === 'normal' && task.taskType === 'normal') ||
      (taskFilter === 'ad-hoc' && task.taskType === 'ad-hoc');
    
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.category && task.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.subCategory && task.subCategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.remark && task.remark.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const getTaskTypeIcon = (taskType: string) => {
    return taskType === 'ad-hoc' ? (
      <AlertCircle className="w-4 h-4 text-red-500" />
    ) : (
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    );
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
              <option value="normal">Normal Tasks</option>
              <option value="ad-hoc">Ad-hoc Tasks</option>
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
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Parameter</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Remark</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Due Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700 border-b border-gray-200">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredTasks.map((task: Task, index: number) => (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-start space-x-3">
                        {getTaskTypeIcon(task.taskType)}
                        <div>
                          <button 
                            onClick={() => handleTaskNameClick(task)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-left hover:underline transition-colors"
                          >
                            {index + 1}. {task.name}
                          </button>
                          <div className="mt-1">
                            {getTaskTypeBadge(task.taskType)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 font-medium">
                        {task.taskType === 'ad-hoc' ? '-' : (task.category || '-')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 font-medium">
                        {task.taskType === 'ad-hoc' ? '-' : (task.subCategory || '-')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleParameterClick(task)}
                        className="inline-flex items-center px-3 py-2 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-lg text-sm font-medium text-gray-800 transition-colors duration-150 hover:shadow-sm"
                      >
                        <Edit className="w-3 h-3 mr-1 text-gray-600" />
                        <span className="text-gray-800">{task.parameter || 'Add Parameter'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleRemarkClick(task)}
                        className="flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-150 hover:shadow-sm"
                        title="Add/Edit Remark"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 font-medium">{task.due}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => onSaveTask(task.id)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors duration-150 hover:shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Save
                      </button>
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
              Showing <span className="font-medium">{filteredTasks.length}</span> of <span className="font-medium">{tasks.length}</span> tasks
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
      {showTaskDetail && selectedTask && (
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
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.name}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg min-h-[60px]">{selectedTask.description || 'No description available'}</p>
              </div>
              {selectedTask.taskType !== 'ad-hoc' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.category || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sub-category</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedTask.subCategory || '-'}</p>
                  </div>
                </div>
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

      {/* Parameter Input Modal */}
      <ParameterInputModal
        selectedTask={selectedTask}
        showModal={showParameterModal}
        onClose={() => setShowParameterModal(false)}
        onSave={handleParameterSave}
      />

      {/* Enhanced Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="border-b border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-blue-600" />
                  Add Remark
                </h3>
                <button 
                  onClick={() => setShowRemarkModal(false)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Remark</label>
                <textarea
                  value={remark}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemark(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-gray-800"
                  placeholder="Enter your remark here..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRemarkModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemarkSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Save Remark
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
