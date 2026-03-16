import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { FloatingPanel } from "../../components/floating-panel";

export function NewTaskModal({
  isOpen,
  onClose,
  projects,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  projects: Array<{ id: string; name: string }>;
  onSubmit: (task: { title: string; description: string; projectId: string }) => void;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setProjectId("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      projectId,
    });
  }

  return (
    <FloatingPanel
      ariaLabelledBy="new-task-title"
      className="new-task"
      onClose={onClose}
    >
      <form
        ref={formRef}
        className="new-task__form"
        onSubmit={handleSubmit}
        onKeyDownCapture={(event) => {
          if (event.key !== "Enter") {
            return;
          }

          if (event.target instanceof HTMLTextAreaElement) {
            if (event.metaKey || event.ctrlKey) {
              event.preventDefault();
              formRef.current?.requestSubmit();
            }

            return;
          }

          event.preventDefault();
          formRef.current?.requestSubmit();
        }}
      >
        <p id="new-task-title" className="new-task__title">
          New task
        </p>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="new-task__input"
          placeholder="Title"
          aria-label="Task title"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="new-task__textarea"
          placeholder="Description"
          aria-label="Task description"
        />
        <select
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
          className="new-task__select"
          aria-label="Task project"
        >
          <option value="">Link project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </FloatingPanel>
  );
}
