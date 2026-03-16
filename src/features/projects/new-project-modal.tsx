import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FloatingPanel } from "../../components/floating-panel";

export function NewProjectModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    submitProject();
  }

  function submitProject() {
    if (!name.trim()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
    });
  }

  return (
    <FloatingPanel ariaLabelledBy="new-project-title" className="new-task" onClose={onClose}>
      <form className="new-task__form" onSubmit={handleSubmit}>
        <p id="new-project-title" className="new-task__title">
          New project
        </p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitProject();
            }
          }}
          className="new-task__input"
          placeholder="Name"
          aria-label="Project name"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submitProject();
            }
          }}
          className="new-task__textarea"
          placeholder="Description"
          aria-label="Project description"
        />
      </form>
    </FloatingPanel>
  );
}
