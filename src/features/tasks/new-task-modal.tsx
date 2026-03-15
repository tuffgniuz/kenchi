import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FloatingPanel } from "../../components/floating-panel";

export function NewTaskModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: { title: string; description: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
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
    });
  }

  return (
    <FloatingPanel
      ariaLabelledBy="new-task-title"
      className="new-task"
      onClose={onClose}
    >
      <form className="new-task__form" onSubmit={handleSubmit}>
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
      </form>
    </FloatingPanel>
  );
}
