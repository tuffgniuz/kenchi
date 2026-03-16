export type GoalPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type GoalStatus = "active" | "archived";

export type GoalTrackingMode = "automatic" | "manual";

export type GoalMetric =
  | "tasks_completed"
  | "inbox_items_processed"
  | "journal_entries_written"
  | "notes_created"
  | "manual_units";

export type GoalScope = {
  projectId?: string;
  tag?: string;
  taskIds?: string[];
};

export type GoalItem = {
  id: string;
  title: string;
  description?: string;
  metric: GoalMetric;
  target: number;
  period: GoalPeriod;
  trackingMode: GoalTrackingMode;
  scope?: GoalScope;
  status: GoalStatus;
  createdAt: string;
};
