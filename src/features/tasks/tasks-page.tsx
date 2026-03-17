import { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { Vim, vim } from "@replit/codemirror-vim";
import { ActionBar } from "../../components/ui/action-bar";
import { EmptyState } from "../../components/ui/empty-state";
import { Modal } from "../../components/ui/modal";
import { PageShell } from "../../components/ui/page-shell";
import type { Item } from "../../models/workspace-item";
import type { Project } from "../../models/project";
import { getProjectName } from "../../lib/domain/project-relations";

type TasksPageProps = {
  items: Item[];
  projects: Project[];
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Item>) => void;
  onDeleteTask: (taskId: string) => void;
};

const filterItems: Array<{ id: "open" | "completed" | "all"; label: string }> = [
  { id: "open", label: "Open" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

let taskPanelVimBindingsRegistered = false;

function ensureTaskPanelVimBindings() {
  if (taskPanelVimBindingsRegistered) {
    return;
  }

  Vim.defineEx("closepanel", "closepanel", () => {
    window.dispatchEvent(new CustomEvent("kenchi:close-task-panel"));
  });
  Vim.map(":", "<Nop>", "normal");
  Vim.map("<C-z>z", ":closepanel<CR>", "normal");
  taskPanelVimBindingsRegistered = true;
}

export function TasksPage({
  items,
  projects,
  selectedTaskId,
  onSelectTask,
  onUpdateTask,
  onDeleteTask,
}: TasksPageProps) {
  const [activeFilter, setActiveFilter] = useState<"open" | "completed" | "all">("all");
  const [pendingDeleteTask, setPendingDeleteTask] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const selectedTask =
    items.find((item) => item.id === selectedTaskId && item.kind === "task") ?? null;

  const rows = useMemo(() => {
    return items
      .filter(
        (item) =>
          item.kind === "task" &&
          item.state !== "deleted" &&
          (activeFilter === "all" ||
            (activeFilter === "completed" ? item.isCompleted : !item.isCompleted)),
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        isCompleted: item.isCompleted,
        priority: item.priority || "None",
        due: item.dueDate || "None",
        project: getProjectName(projects, item.projectId, item.project) || "None",
        isSelected: selectedTaskId === item.id,
        onSelect: () => onSelectTask(item.id),
      }));
  }, [activeFilter, items, onSelectTask, projects, selectedTaskId]);

  const selectedRow = rows.find((row) => row.id === selectedTaskId) ?? null;

  return (
    <PageShell ariaLabel="Tasks" eyebrow="Tasks" className="page--tasks">
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
                  <th scope="col">Completed</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Due</th>
                  <th scope="col">Project</th>
                  <th scope="col">Actions</th>
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
                        <span
                          className={`tasks-table__marker tasks-table__marker--${
                            row.isCompleted ? "done" : "inbox"
                          }`}
                        />
                        <span>{row.title}</span>
                      </button>
                    </td>
                    <td>{labelForCompletion(row.isCompleted)}</td>
                    <td>{row.priority}</td>
                    <td>{row.due}</td>
                    <td>{row.project}</td>
                    <td
                      className="tasks-table__actions-cell"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="tasks-item__actions" aria-label="Task actions">
                        <button
                          type="button"
                          className="inbox-action"
                          onClick={() => setPendingDeleteTask({ id: row.id, title: row.title })}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
                  {labelForCompletion(selectedRow.isCompleted)} • {selectedRow.project}
                </p>
                {selectedTask ? (
                  <TaskDescriptionEditor
                    value={selectedTask.content}
                    onChange={(content) => onUpdateTask(selectedTask.id, { content })}
                  />
                ) : (
                  <p className="task-detail-pane__meta">
                    Markdown editing is available for saved tasks.
                  </p>
                )}
              </div>
            ) : null}
          </aside>
        </div>
      ) : (
        <EmptyState
          className="tasks-empty"
          badge="Tasks"
          title="No tasks match this view"
          copy="Change the filter to bring tasks back into focus."
        />
      )}

      {pendingDeleteTask ? (
        <TaskDeleteConfirmModal
          taskTitle={pendingDeleteTask.title}
          onClose={() => setPendingDeleteTask(null)}
          onConfirm={() => {
            onDeleteTask(pendingDeleteTask.id);
            setPendingDeleteTask(null);
          }}
        />
      ) : null}
    </PageShell>
  );
}

function labelForCompletion(isCompleted: boolean) {
  return isCompleted ? "Completed" : "Open";
}

const taskDescriptionExtensions = [
  vim(),
  markdown(),
  EditorView.lineWrapping,
  EditorView.theme({
    "&": {
      backgroundColor: "transparent",
      color: "var(--color-text-primary)",
      fontFamily: "inherit",
      fontSize: "0.95rem",
      lineHeight: "1.6",
    },
    ".cm-editor": {
      backgroundColor: "transparent",
    },
    ".cm-scroller": {
      fontFamily: "inherit",
    },
    ".cm-content": {
      minHeight: "18rem",
      padding: "0",
      caretColor: "var(--color-text-primary)",
    },
    ".cm-line": {
      padding: "0",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-focused": {
      outline: "none",
    },
    ".cm-cursor, .cm-dropCursor": {
      backgroundColor: "var(--color-text-primary)",
      width: "2px",
    },
    ".cm-fat-cursor, .cm-fat-cursor-mark": {
      backgroundColor: "var(--color-text-primary)",
      color: "var(--color-main-bg)",
    },
  }),
];

ensureTaskPanelVimBindings();

function TaskDescriptionEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="task-description-editor">
      <p className="task-description-editor__label">Description</p>
      <CodeMirror
        value={value}
        aria-label="Task description"
        className="task-description-editor__surface"
        placeholder="Write in markdown"
        extensions={taskDescriptionExtensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
        }}
        onChange={onChange}
      />
    </div>
  );
}

function TaskDeleteConfirmModal({
  taskTitle,
  onClose,
  onConfirm,
}: {
  taskTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal ariaLabelledBy="task-delete-confirm-title" className="inbox-confirm" onClose={onClose}>
      <div className="inbox-confirm__content">
        <p id="task-delete-confirm-title" className="new-task__title">
          Delete task
        </p>
        <p className="inbox-confirm__item">{taskTitle}</p>
        <p className="inbox-confirm__copy">This will permanently remove the task.</p>
        <ActionBar className="inbox-confirm__actions">
          <button type="button" className="inbox-confirm__button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="inbox-confirm__button inbox-confirm__button--confirm"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </ActionBar>
      </div>
    </Modal>
  );
}
