'use client';

import { useEffect, useState } from 'react';
import { 
  ArrowLeftIcon,
  PlusIcon,
  FolderIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import CreateTaskModal from './CreateTaskModel';
import CreateSubcategoryModal from './CreateSubCategoryModel';
import EditTaskModal from './EditTaskModel';
import EditSubcategoryModal from './EditSubcategoryModel';
import DeleteConfirmModal from './DeleteConfirmModel';
import axios from 'axios';
import AssignMemberModal from './AssignMemberModel';
import TaskViewModal from './TaskViewModel';
import { ParameterType, Task,Subcategory, Category } from './types';
import {toast} from 'react-toastify';
import { convertUTCToIST } from './EditTaskModel';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

// ✅ Updated Task interface to match API response




interface CategoryDetailViewProps {
  category: Category ;
  onBack: () => void;
  onUpdateCategory: (category: Category) => void;
}

export default function CategoryDetailView({ category, onBack, onUpdateCategory }: CategoryDetailViewProps) {
  const [showCreateTaskModal, setShowCreateTaskModal] = useState<boolean>(false);
  const [showCreateSubcategoryModal, setShowCreateSubcategoryModal] = useState<boolean>(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState<boolean>(false);
  const [showEditSubcategoryModal, setShowEditSubcategoryModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [taskContext, setTaskContext] = useState<string | number>('');
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [subcategoryToEdit, setSubcategoryToEdit] = useState<Subcategory | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Task | Subcategory | null>(null);
  const [deleteType, setDeleteType] = useState<'task' | 'subcategory'>('task');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
const [taskToAssign, setTaskToAssign] = useState<Task | null>(null);
const [showTaskViewModal, setShowTaskViewModal] = useState<boolean>(false);
const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);


  // ✅ Helper function to organize tasks from API response
  const organizeTasks = (tasks: Task[], category: Category): Category => {
    const categoryName = category.name;
    const organizedCategory: Category = {
      ...category,
      subcategories: category.subcategories.map(subcat => ({
        ...subcat,
        tasks: [] // Clear existing tasks
      })),
      directTasks: [] // Clear existing tasks
    };

    tasks.forEach(apiTask => {
      if (apiTask.category === categoryName) {
        // ✅ Map API task to our Task interface
        const task: Task = {
          id: apiTask.taskId,
          title: apiTask.title,
          description: apiTask.description || '',
          taskType: apiTask.taskType,
          category: apiTask.category,
          subcategory: apiTask.subcategory,
          parameterLabel: apiTask.parameterLabel,
          parameterUnit: apiTask.parameterUnit,
          dropdownOptions: apiTask.dropdownOptions || [],
          dueDate: apiTask.dueDate,
          isAssigned: apiTask.isAssigned,
          assignedTo: apiTask.assignedTo || [],
          createdBy: apiTask.createdBy,
          status: 'pending' 
          ,

          taskId: apiTask.taskId,
          parameterType: apiTask.parameterType as ParameterType,
          repetitionConfig:  apiTask.repetitionConfig || {
            type: 'none',
            days: undefined,
            onDays: undefined,
            onDate: undefined,
            atTime: undefined
          }
        };

        if (apiTask.subcategory) {
          // ✅ Find matching subcategory by name
          const matchedSubcategory = organizedCategory.subcategories.find(
            subcat => subcat.name === apiTask.subcategory
          );
          
          if (matchedSubcategory) {
            matchedSubcategory.tasks.push(task);
          } else {
            // ✅ Subcategory not found, add to direct tasks
            organizedCategory.directTasks.push(task);
          }
        } else {
          // ✅ No subcategory, add to direct tasks
          organizedCategory.directTasks.push(task);
        }
      }
      // else: task belongs to other category, ignore
    });

    return organizedCategory;
  };

  const handleAssignMember = (task: Task, e: React.MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
  setTaskToAssign(task);
  setShowAssignModal(true);
};



const handleAssignMembers = async(memberIds: string[]) => {
  // Handle successful assignment - you can show a success message
  toast.success('Members assigned successfully');
  await refetchData();
  
};

const handleTaskClick = (taskId: string) => {
  setSelectedTaskId(taskId);
  setShowTaskViewModal(true);
};

// const getAssignedMemberText = (task: Task): string => {
//   if (task.assignedTo && task.assignedTo.length > 0) {
//     if (task.assignedTo.length === 1) {
//       const member = task.assignedTo[0];
//       return `${member.firstName} ${member.lastName}`;
//     } else {
//       return `${task.assignedTo.length} members assigned`;
//     }
//   }
//   return task.createdBy || 'Unassigned';
// };


  const deleteTask = async (taskId: string) => {
  try {
    await axios.delete(`${backendUrl}/api/tasks/${taskId}`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    toast.success('Task deleted successfully');
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

  const createSubcategory = async (subcategoryData: { name: string; description?: string }) => {
    try {
      const response = await axios.post(`${backendUrl}/api/subcategories`, {
        name: subcategoryData.name,
        description: subcategoryData.description || '',
        categoryId: category.id
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Subcategory created successfully');
      
      return response.data;
    } catch (error) {
      console.error('Error creating subcategory:', error);
      throw error;
    }
  };

  const deleteSubcategory = async (subcategoryId: string) => {
    try {
      await axios.delete(`${backendUrl}/api/subcategories/${subcategoryId}`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      toast.success('Subcategory deleted successfully');
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  };

  // ✅ Updated useEffect to fetch and organize tasks
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ✅ Fetch both subcategories and tasks
        const [subcategoriesResponse, tasksResponse] = await Promise.all([
          axios.get(`${backendUrl}/api/subcategories?categoryId=${category.id}`, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
          }),
          axios.get(`${backendUrl}/api/tasks?taskType=RECURRING`, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
          })
        ]);

        console.log('Fetched subcategories:', subcategoriesResponse.data);
        console.log('Fetched tasks:', tasksResponse.data);

        // ✅ Process subcategories
        const subcategoriesApiData = subcategoriesResponse.data;
        let subcategoriesData = [];
        
        if (subcategoriesApiData.success && subcategoriesApiData.data && subcategoriesApiData.data.subcategories) {
          subcategoriesData = subcategoriesApiData.data.subcategories;
        } else if (Array.isArray(subcategoriesApiData)) {
          subcategoriesData = subcategoriesApiData;
        }

        const subcategoriesWithEmptyTasks = subcategoriesData.map((subcategory: Subcategory) => ({
          ...subcategory,
          tasks: [] // Initialize empty, will be populated by organizeTasks
        }));

        // ✅ Create category with subcategories
        const categoryWithSubcategories: Category = {
          ...category,
          subcategories: subcategoriesWithEmptyTasks,
          directTasks: [] // Initialize empty, will be populated by organizeTasks
        };

        // ✅ Process tasks and organize them
        const tasksApiData = tasksResponse.data;
        let tasksData = [];
        
        if (tasksApiData.success && Array.isArray(tasksApiData.data)) {
          tasksData = tasksApiData.data;
        } else if (Array.isArray(tasksApiData)) {
          tasksData = tasksApiData;
        }

        // ✅ Organize tasks into correct subcategories and direct tasks
        const organizedCategory = organizeTasks(tasksData, categoryWithSubcategories);
        
        onUpdateCategory(organizedCategory);
      } catch (error) {
        console.error('Error fetching data:', error);
        const updatedCategory = {
          ...category,
          subcategories: [],
          directTasks: []
        };
        onUpdateCategory(updatedCategory);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [category.id]);


  // Add this function to your CategoryDetailView component
const refetchData = async () => {
  setLoading(true);
  try {
    // ✅ Same logic as in useEffect but as a reusable function
    const [subcategoriesResponse, tasksResponse] = await Promise.all([
      axios.get(`${backendUrl}/api/subcategories?categoryId=${category.id}`, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      }),
      axios.get(`${backendUrl}/api/tasks?taskType=RECURRING`, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      })
    ]);

    // Process subcategories
    const subcategoriesApiData = subcategoriesResponse.data;
    let subcategoriesData = [];
    
    if (subcategoriesApiData.success && subcategoriesApiData.data && subcategoriesApiData.data.subcategories) {
      subcategoriesData = subcategoriesApiData.data.subcategories;
    } else if (Array.isArray(subcategoriesApiData)) {
      subcategoriesData = subcategoriesApiData;
    }

    const subcategoriesWithEmptyTasks = subcategoriesData.map((subcategory: Subcategory) => ({
      ...subcategory,
      tasks: []
    }));

    // Create category with subcategories
    const categoryWithSubcategories: Category = {
      ...category,
      subcategories: subcategoriesWithEmptyTasks,
      directTasks: []
    };

    // Process tasks and organize them
    const tasksApiData = tasksResponse.data;
    let tasksData = [];
    
    if (tasksApiData.success && Array.isArray(tasksApiData.data)) {
      tasksData = tasksApiData.data;
    } else if (Array.isArray(tasksApiData)) {
      tasksData = tasksApiData;
    }

    // Organize tasks into correct subcategories and direct tasks
    const organizedCategory = organizeTasks(tasksData, categoryWithSubcategories);
    
    onUpdateCategory(organizedCategory);
  } catch (error) {
    console.error('Error refetching data:', error);
    toast.error('Failed to refresh data');
  } finally {
    setLoading(false);
  }
};


  const handleEditTask = (task: Task, context: string | number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setTaskToEdit(task);
    setTaskContext(context);
    setShowEditTaskModal(true);
  };

  const handleDeleteItem = (item: Task | Subcategory, type: 'task' | 'subcategory', context: string | number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setItemToDelete(item);
    setDeleteType(type);
    setTaskContext(context);
    setShowDeleteModal(true);
  };

 const confirmDelete = async () => {
  if (!itemToDelete) return;

  const updatedCategory = { ...category };

  if (deleteType === 'task') {
    try {
      // ✅ Call DELETE API first
      await deleteTask((itemToDelete as Task).id);
      
      // ✅ Only update local state if API call succeeds
      if (taskContext === 'direct') {
        updatedCategory.directTasks = updatedCategory.directTasks.filter(task => task.id !== itemToDelete.id);
      } else {
        const subcategoryIndex = updatedCategory.subcategories.findIndex(sub => sub.id === taskContext);
        if (subcategoryIndex !== -1) {
          updatedCategory.subcategories[subcategoryIndex].tasks = 
            updatedCategory.subcategories[subcategoryIndex].tasks.filter(task => task.id !== itemToDelete.id);
        }
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
     
      return; // Exit early on API failure
    }
  } else if (deleteType === 'subcategory') {
    try {
      await deleteSubcategory((itemToDelete as Subcategory).id);
      updatedCategory.subcategories = updatedCategory.subcategories.filter(sub => sub.id !== itemToDelete.id);
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
     
      return;
    }
  }

  onUpdateCategory(updatedCategory);
  setShowDeleteModal(false);
  setItemToDelete(null);
  setDeleteType('task');
  setTaskContext('');
};

  const handleEditSubcategory = (subcategory: Subcategory, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSubcategoryToEdit(subcategory);
    setShowEditSubcategoryModal(true);
  };

  const handleUpdateSubcategory = async(updatedSubcategory: Subcategory) => {
    const updatedCategory: Category = {
      ...category,
      subcategories: category.subcategories.map(sub => 
        sub.id === updatedSubcategory.id ? updatedSubcategory : sub
      )
    };

    onUpdateCategory(updatedCategory);
    setShowEditSubcategoryModal(false);
    setSubcategoryToEdit(null);
    await refetchData();
  };

  // ✅ Updated getScheduleText for new task structure
  const getScheduleText = (task: Task): string => {
    console.log("Task Printing",task)
    if(task.repetitionConfig.type ==='interval'){
      return `Every ${task.repetitionConfig.days} days at ${convertUTCToIST(task.repetitionConfig.atTime || '')}`;
    }
    else if(task.repetitionConfig.type ==='weekly'){
      return `Every ${task.repetitionConfig.onDays?.join(', ')} of the week at ${convertUTCToIST(task.repetitionConfig.atTime || '')}`;
    }
      else if(task.repetitionConfig.type ==='monthly'){
        return `On day ${task.repetitionConfig.onDate}th of every month at ${convertUTCToIST(task.repetitionConfig.atTime || '')}`;
      }
   
    
    
    
    return 'No schedule';
  };

  const getStatusBadge = (status: 'pending' | 'completed' = 'pending') => {
    return status === 'completed' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircleIcon className="w-3 h-3 mr-1" />
        Completed
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <ClockIcon className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  const filterTasks = (tasks: Task[] | undefined): Task[] => {
    if (!tasks || !Array.isArray(tasks)) return [];
    if (!searchTerm) return tasks;
    return tasks.filter(task => 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.createdBy?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredSubcategories = (category.subcategories || []).filter(subcategory => {
    if (!subcategory) return false;
    if (!searchTerm) return true;
    
    const subcategoryMatch = subcategory.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const hasMatchingTasks = (subcategory.tasks || []).some(task => 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.createdBy?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return subcategoryMatch || hasMatchingTasks;
  });

  const filteredDirectTasks = filterTasks(category.directTasks);

  const getDeleteMessage = (): string => {
    if (deleteType === 'task') {
      return `Are you sure you want to delete the task "${(itemToDelete as Task)?.title}"? This action cannot be undone.`;
    } else if (deleteType === 'subcategory') {
      const taskCount = (itemToDelete as Subcategory)?.tasks?.length || 0;
      return `Are you sure you want to delete the subcategory "${(itemToDelete as Subcategory)?.name}"? This will also delete ${taskCount} task(s) within this subcategory. This action cannot be undone.`;
    }
    return '';
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-blue-600" />
            </button>
            <div className="bg-blue-100 p-2 rounded-lg">
              <FolderIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{category.name}</h1>
              <p className="text-sm text-gray-600 mt-1">{category.description || 'Category Management'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setTaskContext('direct');
                setShowCreateTaskModal(true);
              }}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Task
            </button>
            <button
              onClick={() => setShowCreateSubcategoryModal(true)}
              className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Subcategory
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading tasks...</p>
        </div>
      )}

      {/* Search */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks, subcategories, or members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <>
          {/* Direct Tasks */}
          {filteredDirectTasks.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Direct Tasks ({filteredDirectTasks.length})
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDirectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 relative"
                    onClick={() => handleTaskClick(task.id)}
                  >
                    <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white rounded-lg shadow-sm border border-gray-200">
                      <button
                        onClick={(e) => handleEditTask(task, 'direct', e)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-l-lg transition-colors border-r border-gray-200"
                        title="Edit Task"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
    onClick={(e) => handleAssignMember(task, e)}
    className="p-1.5 text-green-600 hover:bg-green-50 transition-colors border-r border-gray-200"
    title="Assign Members"
  >
    <UserPlusIcon className="w-3.5 h-3.5" />
  </button>
                      <button
                        onClick={(e) => handleDeleteItem(task, 'task', 'direct', e)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-r-lg transition-colors"
                        title="Delete Task"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pr-24">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{task.title}</h4>
                        <div className="ml-2 flex-shrink-0">
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description || 'No description'}</p>
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <CalendarDaysIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{getScheduleText(task)}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <UserIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                          {task.assignedTo && task.assignedTo.length > 0 ? (
                            <span className="truncate">
                              {task.assignedTo.length === 1 
                                ? `${task.assignedTo[0].firstName} ${task.assignedTo[0].lastName}`
                                : `${task.assignedTo.length} members assigned`}
                            </span>
                          ) : (
                            <span className="truncate">Unassigned</span>
                          )}
                        
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subcategories */}
          {filteredSubcategories.map((subcategory) => {
            const subcategoryTasks = filterTasks(subcategory.tasks || []);
            
            return (
              <div key={subcategory.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center min-w-0">
                      <FolderIcon className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0" />
                      <span className="truncate">{subcategory.name} ({subcategoryTasks?.length || 0})</span>
                    </h3>
                    <div className="flex items-center space-x-1 bg-white rounded-lg shadow-sm border border-gray-200">
                      <button
                        onClick={(e) => handleEditSubcategory(subcategory, e)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-l-lg transition-colors border-r border-gray-200"
                        title="Edit Subcategory"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteItem(subcategory, 'subcategory', subcategory.id, e)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-r-lg transition-colors"
                        title="Delete Subcategory"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setTaskContext(subcategory.id);
                      setShowCreateTaskModal(true);
                    }}
                    className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200 transition-colors flex-shrink-0 ml-3"
                  >
                    <PlusIcon className="w-3 h-3 mr-1" />
                    Add Task
                  </button>
                </div>
                
                {subcategoryTasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subcategoryTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition-all duration-200 relative"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white rounded-lg shadow-sm border border-gray-200">
                          <button
                            onClick={(e) => handleEditTask(task, subcategory.id, e)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-l-lg transition-colors border-r border-gray-200"
                            title="Edit Task"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
    onClick={(e) => handleAssignMember(task, e)}
    className="p-1.5 text-green-600 hover:bg-green-50 transition-colors border-r border-gray-200"
    title="Assign Members"
  >
    <UserPlusIcon className="w-3.5 h-3.5" />
  </button>
                          <button
                            onClick={(e) => handleDeleteItem(task, 'task', subcategory.id, e)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-r-lg transition-colors"
                            title="Delete Task"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="pr-24">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{task.title}</h4>
                            <div className="ml-2 flex-shrink-0">
                              {getStatusBadge(task.status)}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description || 'No description'}</p>
                          <div className="space-y-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <CalendarDaysIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{getScheduleText(task)}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <UserIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                               {task.assignedTo && task.assignedTo.length > 0 ? (
                            <span className="truncate">
                              {task.assignedTo.length === 1 
                                ? `${task.assignedTo[0].firstName} ${task.assignedTo[0].lastName}`
                                : `${task.assignedTo.length} members assigned`}
                            </span>
                          ) : (
                            <span className="truncate">Unassigned</span>
                          )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">
                      {searchTerm ? 'No tasks match your search' : 'No tasks in this subcategory'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {filteredDirectTasks.length === 0 && filteredSubcategories.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No results found' : 'No tasks or subcategories'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms or clear the search to see all items.'
                  : 'Start by creating a task or subcategory for this category.'
                }
              </p>
              {!searchTerm && (
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => {
                      setTaskContext('direct');
                      setShowCreateTaskModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Task
                  </button>
                  <button
                    onClick={() => setShowCreateSubcategoryModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Subcategory
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals - Keep existing modal code */}
      {showCreateTaskModal && (
        <CreateTaskModal
          onClose={() => {
            setShowCreateTaskModal(false);
            setTaskContext('');
          }}
          onCreateTask={async(taskData) => {
            toast.success('Task created successfully');
            setShowCreateTaskModal(false);
            setTaskContext('');
            await refetchData();

          }}
          isSubcategoryTask={taskContext !== 'direct'}
          categoryId={category.id}
          subcategoryId={taskContext === 'direct' ? null : taskContext as string}
        />
      )}

      {showCreateSubcategoryModal && (
        <CreateSubcategoryModal
          onClose={() => setShowCreateSubcategoryModal(false)}
          onCreateSubcategory={async (subcategoryData) => {
            try {
              await createSubcategory(subcategoryData);
              
              setShowCreateSubcategoryModal(false);
              await refetchData();
            } catch (error) {
              console.error('Failed to create subcategory:', error);
            }
          }}
        />
      )}

      {showEditTaskModal && taskToEdit && (
  <EditTaskModal
    task={taskToEdit}
    onClose={() => {
      setShowEditTaskModal(false);
      setTaskToEdit(null);
      setTaskContext('');
    }}
    onUpdateTask={async (updatedTaskData) => {
      // ✅ Handle the updated task data
      toast.success('Task updated successfully');
      
      setShowEditTaskModal(false);
      setTaskToEdit(null);
      setTaskContext('');
      await refetchData();
    }}
    isSubcategoryTask={taskContext !== 'direct'}
    categoryId={category.id}
    subcategoryId={taskContext === 'direct' ? null : taskContext as string}
  />
)}


      {showEditSubcategoryModal && subcategoryToEdit && (
        <EditSubcategoryModal
          subcategory={subcategoryToEdit}
          onClose={() => {
            setShowEditSubcategoryModal(false);
            setSubcategoryToEdit(null);
          }}
          onUpdateSubcategory={handleUpdateSubcategory}
        />
      )}

      {showDeleteModal && itemToDelete && (
        <DeleteConfirmModal
          title={`Delete ${deleteType === 'task' ? 'Task' : 'Subcategory'}`}
          message={getDeleteMessage()}
          confirmText={`Delete ${deleteType === 'task' ? 'Task' : 'Subcategory'}`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
            setDeleteType('task');
            setTaskContext('');
          }}
        />
      )}


      {showAssignModal && taskToAssign && (
  <AssignMemberModal
    taskId={taskToAssign.id}
    taskTitle={taskToAssign.title}
    onClose={() => {
      setShowAssignModal(false);
      setTaskToAssign(null);
    }}
    onAssignMembers={handleAssignMembers}
  />
)}

{showTaskViewModal && selectedTaskId && (
  <TaskViewModal
    taskId={selectedTaskId}
    
    onClose={() => {
      setShowTaskViewModal(false);
      setSelectedTaskId(null);
    }}
  />
)}

    </div>
  );
}
