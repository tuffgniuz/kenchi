import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TasksPage } from "./tasks-page";
import type { Item } from "../../models/workspace-item";
import type { Project } from "../../models/project";

function createItem(overrides: Partial<Item> = {}): Item {
  return {
    id: "task-1",
    kind: "task",
    state: "active",
    sourceType: "manual",
    title: "Task",
    content: "",
    createdAt: "",
    updatedAt: "",
    tags: [],
    project: "",
    isCompleted: false,
    priority: "",
    dueDate: "",
    completedAt: "",
    estimate: "",
    goalMetric: "tasks_completed",
    goalTarget: 1,
    goalProgress: 0,
    goalProgressByDate: {},
    goalPeriod: "weekly",
    ...overrides,
  };
}

describe("TasksPage", () => {
  it("filters tasks by open and completed instead of task status", () => {
    render(
      <TasksPage
        items={[
          createItem({ id: "task-1", title: "Open task" }),
          createItem({ id: "task-2", title: "Completed task", isCompleted: true }),
        ]}
        projects={[] as Project[]}
        selectedTaskId=""
        onSelectTask={vi.fn()}
        onUpdateTask={vi.fn()}
        onDeleteTask={vi.fn()}
      />,
    );

    expect(screen.getByText("Open task")).toBeInTheDocument();
    expect(screen.getByText("Completed task")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Open task")).toBeInTheDocument();
    expect(screen.queryByText("Completed task")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Completed" }));
    expect(screen.getByText("Completed task")).toBeInTheDocument();
    expect(screen.queryByText("Open task")).not.toBeInTheDocument();
  });
});
