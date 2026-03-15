import { viewTitles } from "../../app/navigation";
import type { ViewId } from "../../app/types";
import { CaptureInboxPage } from "../inbox/capture-inbox-page";
import type { CaptureItem } from "../../models/capture";
import type { TaskItem } from "../../models/task";
import { TasksPage } from "../tasks/tasks-page";

type PageContentProps = {
  activeView: ViewId;
  inboxItems: CaptureItem[];
  tasks: TaskItem[];
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
};

export function PageContent({
  activeView,
  inboxItems,
  tasks,
  selectedTaskId,
  onSelectTask,
}: PageContentProps) {
  if (activeView === "dashboard") {
    return <section className="page page--empty" aria-label="Dashboard" />;
  }

  if (activeView === "inbox") {
    return <CaptureInboxPage inboxItems={inboxItems} />;
  }

  if (activeView === "tasks") {
    return (
      <TasksPage
        tasks={tasks}
        inboxItems={inboxItems}
        selectedTaskId={selectedTaskId}
        onSelectTask={onSelectTask}
      />
    );
  }

  return (
    <section className="page page--placeholder" aria-label={viewTitles[activeView]}>
      <div className="page__header">
        <p className="page__eyebrow">Workspace</p>
        <h1 className="page__title">{viewTitles[activeView]}</h1>
      </div>
      <p className="page__placeholder-copy">{viewTitles[activeView]} will live here next.</p>
    </section>
  );
}
