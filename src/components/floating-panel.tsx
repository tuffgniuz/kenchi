import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type FloatingPanelProps = {
  ariaLabelledBy?: string;
  children: ReactNode;
  className?: string;
  onClose: () => void;
};

export function FloatingPanel({
  ariaLabelledBy,
  children,
  className,
  onClose,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    const getFocusableElements = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
        (element) => !element.hasAttribute("disabled") && element.tabIndex !== -1,
      );

    const focusableElements = getFocusableElements();
    focusableElements[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") {
        return;
      }

      const orderedFocusableElements = getFocusableElements();

      if (orderedFocusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = orderedFocusableElements[0];
      const lastElement = orderedFocusableElements[orderedFocusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || !panel.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }

        return;
      }

      if (activeElement === lastElement || !panel.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    panel.addEventListener("keydown", handleKeyDown);

    return () => {
      panel.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="floating-panel__backdrop" role="presentation" onClick={onClose}>
      <section
        ref={panelRef}
        className={`floating-panel ${className ?? ""}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}
