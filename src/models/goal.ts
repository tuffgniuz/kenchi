export type GoalPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type GoalStatus = "active" | "archived";

export type GoalMetric = "tasks_completed";

export type GoalScope = {
  projectId?: string;
  tag?: string;
  taskIds?: string[];
};

export type GoalItem = {
  id: string;
  title: string;
  description?: string;
  metric?: GoalMetric;
  target: number;
  period: GoalPeriod;
  scope?: GoalScope;
  status: GoalStatus;
  createdAt: string;
};
