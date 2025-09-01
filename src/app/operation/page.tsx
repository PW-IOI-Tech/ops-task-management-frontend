'use client';
import React, { useState } from 'react';
import { Task } from './utils/task';
import MyTasks from './utils/MyTasks';
import TaskOverview from './utils/TaskOverview';


const Page: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      name: 'Fire equipment check...',
      description: 'Check all fire safety equipment including extinguishers, alarms, and emergency exits',
      category: 'Fire Safety Checklist',
      subCategory: 'Fire Prevention',
      parameter: 'Click to input',
      parameterType: 'text',
      remark: '',
      due: '07-03-2024',
      taskType: 'normal'
    },
    {
      id: 2,
      name: 'First Aid kits are acc...',
      description: 'Verify that first aid kits are accessible and fully stocked with required supplies',
      category: 'Fire Safety Checklist',
      subCategory: 'First Aid communication',
      parameter: 'Click to input',
      parameterType: 'number',
      remark: '',
      due: '25-07-2025',
      taskType: 'normal'
    },
    {
      id: 3,
      name: 'Electricity meter cou...',
      description: 'Record electricity meter readings for power consumption monitoring',
      category: 'Electricity Checklist',
      subCategory: 'Electricity power consumption',
      parameter: 'Click to input',
      parameterType: 'readings',
      remark: '',
      due: '15-08-2024',
      taskType: 'ad-hoc'
    }
  ]);

  const handleUpdateTask = (taskId: number, updatedFields: Partial<Task>): void => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updatedFields }
          : task
      )
    );
  };

  const handleSaveTask = (taskId: number): void => {
    console.log('Saving task with ID:', taskId);
    // Here you would typically make an API call to save the task
    // For now, we'll just log it
  };

  return (
    
    <div className="p-8">
      <MyTasks tasks={tasks} />
      <TaskOverview 
        tasks={tasks}
        onUpdateTask={handleUpdateTask}
        onSaveTask={handleSaveTask}
      />
    </div>
   
  );
};

export default Page;