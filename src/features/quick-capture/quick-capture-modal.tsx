import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FloatingPanel } from "../../components/floating-panel";

export function QuickCaptureModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setValue("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <FloatingPanel
      ariaLabelledBy="quick-capture-title"
      className="quick-capture"
      onClose={onClose}
    >
      <form className="quick-capture__form" onSubmit={handleSubmit}>
        <p id="quick-capture-title" className="quick-capture__title">
          Quick Capture
        </p>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="quick-capture__input"
          placeholder="Capture a thought"
          aria-label="Capture a thought"
          autoFocus
        />
      </form>
    </FloatingPanel>
  );
}
