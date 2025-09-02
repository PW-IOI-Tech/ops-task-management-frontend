export type ParameterType = 'NUMBER' | 'TEXT' | 'DATETIME' | 'DROPDOWN' | 'BOOLEAN' | 'COMMENT';

export interface Task {
  taskId: string;
  id: string; // Changed from number to string (taskId from API)
  title: string;
  description: string | null;
  taskType: 'ADHOC' | 'RECURRING';
  category?: string;
  subcategory?: string;
  parameterType: ParameterType;
  parameterLabel: string;
  parameterUnit?: string | null;
  dueDate?: string | null;
  isAssigned: boolean;
   assignedTo: TaskMember[];
  createdBy: string;
  status?: 'pending' | 'completed'; // Default status if not in API
}
export interface TaskMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
export interface Subcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  tasks: Task[];
  category?: {
    id: string;
    name: string;
  };
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}



export interface Category {
  id: number;
  name: string;
  description?: string;
  subcategories: Subcategory[];
  directTasks: Task[];
  taskId: string;
  parameterType: string;
  assignedTo: string[];
}

