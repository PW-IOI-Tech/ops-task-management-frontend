export interface Assignment {
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
    parameterType: 'NUMBER' | 'TEXT' | 'BOOLEAN' | 'DROPDOWN' | 'COMMENT' | 'DATETIME';
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
