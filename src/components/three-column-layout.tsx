import type { ReactNode } from "react";

type ThreeColumnLayoutProps = {
  className?: string;
  leftClassName?: string;
  centerClassName?: string;
  rightClassName?: string;
  centerOnly?: boolean;
  leftLabel?: string;
  centerLabel?: string;
  rightLabel?: string;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

export function ThreeColumnLayout({
  className = "",
  leftClassName = "",
  centerClassName = "",
  rightClassName = "",
  centerOnly = false,
  leftLabel,
  centerLabel,
  rightLabel,
  left,
  center,
  right,
}: ThreeColumnLayoutProps) {
  return (
    <div
      className={`three-column-layout ${centerOnly ? "is-center-only" : ""} ${className}`.trim()}
    >
      <aside
        className={`three-column-layout__side three-column-layout__side--left ${
          centerOnly ? "is-collapsed" : ""
        } ${leftClassName}`.trim()}
        aria-hidden={centerOnly}
        aria-label={leftLabel}
      >
        {left}
      </aside>
      <main className={`three-column-layout__center ${centerClassName}`.trim()} aria-label={centerLabel}>
        {center}
      </main>
      <aside
        className={`three-column-layout__side three-column-layout__side--right ${
          centerOnly ? "is-collapsed" : ""
        } ${rightClassName}`.trim()}
        aria-hidden={centerOnly}
        aria-label={rightLabel}
      >
        {right}
      </aside>
    </div>
  );
}
