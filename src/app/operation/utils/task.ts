// types/task.ts
export interface Task {
  id: number;
  name: string;
  description: string;
  category?: string;
  subCategory?: string;
  parameter: string;
  parameterType: 'text' | 'number' | 'date' | 'time' | 'readings';
  remark: string;
  due: string;
  taskType: 'normal' | 'ad-hoc';
  completedDate?: string;
}

export type TaskFilter = 'all' | 'normal' | 'ad-hoc';

export interface TaskModalProps {
  selectedTask: Task | null;
  showModal: boolean;
  onClose: () => void;
}

export interface ParameterInputProps extends TaskModalProps {
  onSave: (value: string) => void;
}

export interface RemarkModalProps extends TaskModalProps {
  remark: string;
  setRemark: (remark: string) => void;
  onSave: () => void;
}