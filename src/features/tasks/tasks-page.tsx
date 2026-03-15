import { useMemo, useState } from "react";
import type { CaptureItem } from "../../models/capture";
import type { TaskItem, TaskStatus } from "../../models/task";

type TasksPageProps = {
  tasks: TaskItem[];
  inboxItems: CaptureItem[];
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
};

const filterItems: Array<{ id: TaskStatus | "all"; label: string }> = [
  { id: "inbox", label: "Inbox" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
  { id: "done", label: "Done" },
];

export function TasksPage({
  tasks,
  inboxItems,
  selectedTaskId,
  onSelectTask,
}: TasksPageProps) {
  const [activeFilter, setActiveFilter] = useState<TaskStatus | "all">("all");

  const rows = useMemo(() => {
    const taskRows = tasks
      .filter((task) => activeFilter === "all" || task.status === activeFilter)
      .map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority || "None",
        due: task.dueDate || "None",
        project: task.project || "None",
        isSelected: selectedTaskId === task.id,
        onSelect: () => onSelectTask(task.id),
      }));

    const shouldIncludeInboxCaptures = activeFilter === "all" || activeFilter === "inbox";
    const captureRows = shouldIncludeInboxCaptures
      ? inboxItems.map((item) => ({
          id: item.id,
          title: item.text,
          status: "inbox" as const,
          priority: "Capture",
          due: "None",
          project: item.project || "Capture Inbox",
          isSelected: selectedTaskId === item.id,
          onSelect: () => onSelectTask(item.id),
        }))
      : [];

    return [...captureRows, ...taskRows];
  }, [activeFilter, inboxItems, onSelectTask, selectedTaskId, tasks]);

  const selectedRow = rows.find((row) => row.id === selectedTaskId) ?? null;

  return (
    <section className="page page--tasks" aria-label="Tasks">
      <div className="page__header page__header--tasks">
        <div>
          <p className="page__eyebrow">Tasks</p>
        </div>
      </div>

      <div className="tasks-toolbar" aria-label="Task filters">
        {filterItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tasks-filter ${activeFilter === item.id ? "is-active" : ""}`}
            onClick={() => setActiveFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {rows.length > 0 ? (
        <div className="tasks-stage">
          <div className="tasks-table-wrap">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col">Status</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Due</th>
                  <th scope="col">Project</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={row.isSelected ? "is-active" : ""}
                    onClick={row.onSelect}
                  >
                    <td className="tasks-table__title-cell">
                      <button type="button" className="tasks-table__row-button">
                        <span className={`tasks-table__marker tasks-table__marker--${row.status}`} />
                        <span>{row.title}</span>
                      </button>
                    </td>
                    <td>{labelForStatus(row.status)}</td>
                    <td>{row.priority}</td>
                    <td>{row.due}</td>
                    <td>{row.project}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside
            className={`task-detail-panel ${selectedRow ? "is-open" : ""}`}
            aria-label="Task detail"
            aria-hidden={selectedRow ? undefined : true}
          >
            {selectedRow ? (
              <div className="task-detail-pane__content">
                <h2 className="task-detail-pane__title">{selectedRow.title}</h2>
                <p className="task-detail-pane__meta">
                  {labelForStatus(selectedRow.status)} • {selectedRow.project}
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      ) : (
        <div className="tasks-empty">
          <p className="tasks-empty__title">No tasks match this view</p>
          <p className="tasks-empty__copy">Change the filter to see more tasks.</p>
        </div>
      )}
    </section>
  );
}

function labelForStatus(status: TaskStatus) {
  switch (status) {
    case "today":
      return "Today";
    case "upcoming":
      return "Upcoming";
    case "done":
      return "Done";
    default:
      return "Inbox";
  }
}
