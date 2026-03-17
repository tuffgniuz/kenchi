export type TaskPriority = "low" | "medium" | "high" | "urgent" | "";

export type TaskItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate: string;
  priority: TaskPriority;
  project: string;
  tags: string[];
  notes: string;
  estimate: string;
  source: string;
  createdAt: string;
};
