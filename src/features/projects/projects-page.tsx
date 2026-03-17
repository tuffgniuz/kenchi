import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, ColumnsIcon, FocusModeIcon, SettingsIcon } from "../../app/icons";
import { RightRailColumn } from "../../components/right-rail-column";
import { ThreeColumnLayout } from "../../components/three-column-layout";
import { ActionBar } from "../../components/ui/action-bar";
import { EmptyState } from "../../components/ui/empty-state";
import { FormField } from "../../components/ui/form-field";
import { Modal } from "../../components/ui/modal";
import { PageShell } from "../../components/ui/page-shell";
import { useWindowWidth } from "../../hooks/use-window-width";
import type { Item } from "../../models/workspace-item";
import type { JournalEntrySummary } from "../../models/journal";
import type { Project } from "../../models/project";

export function ProjectsPage({
  projects,
  items,
  journalSummaries,
  todayDate,
  selectedProjectId,
  onSelectProject,
  onUpdateProject,
  onDeleteProject,
}: {
  projects: Project[];
  items: Item[];
  journalSummaries: JournalEntrySummary[];
  todayDate: string;
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string) => void;
}) {
  const windowWidth = useWindowWidth();
  const [layoutMode, setLayoutMode] = useState<"columns" | "full">("full");
  const [detailMode, setDetailMode] = useState<"overview" | "settings">("overview");
  const [nameDraft, setNameDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationValue, setDeleteConfirmationValue] = useState("");

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;
  const isExpandedLayout = layoutMode === "full" || detailMode === "settings";
  const responsiveMode = resolveResponsiveMode(windowWidth);
  const showInlineRail = responsiveMode !== "wide";
  const showStackedContext = responsiveMode === "narrow";
  const showRightRailInColumns = !isExpandedLayout && responsiveMode !== "narrow";

  useEffect(() => {
    if (detailMode === "settings") {
      setLayoutMode("full");
    }
  }, [detailMode]);

  useEffect(() => {
    if (!selectedProject) {
      setDetailMode("overview");
      setDeleteConfirmOpen(false);
      setDeleteConfirmationValue("");
      return;
    }

    setNameDraft(selectedProject.name);
    setDescriptionDraft(selectedProject.description);
    setDeleteConfirmationValue("");
  }, [selectedProject]);

  const projectListMeta = useMemo(() => {
    return new Map(
      projects.map((project) => {
        const projectTasks = items.filter(
          (item) =>
            item.kind === "task" &&
            item.projectId === project.id &&
            item.state !== "deleted",
        );

        return [
          project.id,
          {
            taskCount: projectTasks.length,
            activityLabel: getProjectActivityLabel(project),
          },
        ];
      }),
    );
  }, [items, projects]);

  return (
    <PageShell ariaLabel="Projects" className="page--projects">
      {projects.length > 0 && selectedProject ? (
        <>
          <ThreeColumnLayout
            className={`projects-layout ${isExpandedLayout ? "is-full-width" : ""}`}
            leftClassName="projects-rail"
            centerClassName="projects-detail"
            rightClassName="projects-context"
            centerOnly={isExpandedLayout && !showInlineRail && !showStackedContext}
            leftCollapsed={isExpandedLayout || showInlineRail}
            rightCollapsed={isExpandedLayout || !showRightRailInColumns}
            leftLabel="Projects list"
            centerLabel="Project details"
            rightLabel="Project stats"
            left={
              <ProjectRailList
                projects={projects}
                selectedProjectId={selectedProject.id}
                projectListMeta={projectListMeta}
                onSelectProject={onSelectProject}
              />
            }
            center={
              <>
                {detailMode === "settings" ? (
                  <header className="projects-detail__header projects-detail__header--settings">
                    <h1 className="projects-detail__title">Settings</h1>
                  </header>
                ) : (
                  <>
                    <header className="projects-detail__header">
                      <div className="projects-detail__heading">
                        <p className="page__eyebrow">Project</p>
                        <h1 className="projects-detail__title">{selectedProject.name}</h1>
                      </div>
                      {showInlineRail ? (
                        <div className="projects-inline-rail" data-testid="projects-inline-rail">
                          <ProjectRailList
                            projects={projects}
                            selectedProjectId={selectedProject.id}
                            projectListMeta={projectListMeta}
                            onSelectProject={onSelectProject}
                            inline
                          />
                        </div>
                      ) : null}
                    </header>
                    <p className="projects-detail__description">
                      {selectedProject.description || "No description yet."}
                    </p>
                  </>
                )}
                {detailMode === "settings" ? (
                  <section
                    className="projects-settings projects-settings--centered"
                    aria-label="Project settings"
                  >
                    <button
                      type="button"
                      className="projects-detail__icon-button projects-detail__icon-button--back"
                      aria-label="Back to project overview"
                      onClick={() => setDetailMode("overview")}
                    >
                      <ArrowLeftIcon className="projects-detail__layout-toggle-icon" />
                    </button>
                    <FormField label="Name" className="projects-settings__field">
                      <input
                        className="projects-settings__input ui-input"
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.target.value)}
                      />
                    </FormField>
                    <FormField label="Description" className="projects-settings__field">
                      <textarea
                        className="projects-settings__textarea ui-input"
                        value={descriptionDraft}
                        onChange={(event) => setDescriptionDraft(event.target.value)}
                      />
                    </FormField>
                    <ActionBar className="projects-settings__actions">
                      <button
                        type="button"
                        className="projects-settings__button"
                        onClick={() =>
                          onUpdateProject(selectedProject.id, {
                            name: nameDraft,
                            description: descriptionDraft,
                          })
                        }
                      >
                        Save changes
                      </button>
                      <button
                        type="button"
                        className="projects-settings__button projects-settings__button--danger"
                        onClick={() => setDeleteConfirmOpen(true)}
                      >
                        Remove project
                      </button>
                    </ActionBar>
                  </section>
                ) : (
                  <div className="projects-detail__actions">
                    <button
                      type="button"
                      className="projects-detail__icon-button"
                      aria-label="Show project settings"
                      onClick={() => setDetailMode("settings")}
                    >
                      <SettingsIcon className="projects-detail__layout-toggle-icon" />
                    </button>
                    <button
                      type="button"
                      className="projects-detail__icon-button"
                      aria-label={
                        layoutMode === "columns"
                          ? "Show project detail in full width"
                          : "Show project detail in three-column layout"
                      }
                      onClick={() =>
                        setLayoutMode((current) => (current === "columns" ? "full" : "columns"))
                      }
                    >
                      {layoutMode === "columns" ? (
                        <FocusModeIcon className="projects-detail__layout-toggle-icon" />
                      ) : (
                        <ColumnsIcon className="projects-detail__layout-toggle-icon" />
                      )}
                    </button>
                  </div>
                )}
              </>
            }
            right={
              <RightRailColumn items={items} journalSummaries={journalSummaries} todayDate={todayDate} />
            }
          />
          {showStackedContext ? (
            <section
              className="projects-stacked-context"
              aria-label="Project stats"
              data-testid="projects-stacked-context"
            >
              <RightRailColumn items={items} journalSummaries={journalSummaries} todayDate={todayDate} />
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState
          className="projects-empty"
          badge="Projects"
          title="No projects yet"
          copy="Use `Space n p` to create your first project."
        />
      )}
      {selectedProject && deleteConfirmOpen ? (
        <Modal
          ariaLabelledBy="delete-project-title"
          className="confirm-panel"
          onClose={() => {
            setDeleteConfirmOpen(false);
            setDeleteConfirmationValue("");
          }}
        >
          <div className="confirm-panel__content">
            <p id="delete-project-title" className="confirm-panel__title">
              Remove project
            </p>
            <p className="confirm-panel__copy">
              Type <strong>{selectedProject.name}</strong> to confirm permanent deletion.
            </p>
            <input
              className="confirm-panel__input ui-input"
              value={deleteConfirmationValue}
              onChange={(event) => setDeleteConfirmationValue(event.target.value)}
              placeholder={selectedProject.name}
              autoFocus
            />
            <ActionBar className="confirm-panel__actions">
              <button
                type="button"
                className="confirm-panel__button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteConfirmationValue("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-panel__button confirm-panel__button--danger"
                disabled={deleteConfirmationValue !== selectedProject.name}
                onClick={() => {
                  onDeleteProject(selectedProject.id);
                  setDeleteConfirmOpen(false);
                  setDeleteConfirmationValue("");
                  setDetailMode("overview");
                }}
              >
                Delete
              </button>
            </ActionBar>
          </div>
        </Modal>
      ) : null}
    </PageShell>
  );
}

function ProjectRailList({
  projects,
  selectedProjectId,
  projectListMeta,
  onSelectProject,
  inline = false,
}: {
  projects: Project[];
  selectedProjectId: string;
  projectListMeta: Map<string, { taskCount: number; activityLabel: string }>;
  onSelectProject: (projectId: string) => void;
  inline?: boolean;
}) {
  return (
    <>
      <div className="projects-rail__header">
        <p className="page__eyebrow">Projects</p>
      </div>
      <div className={`projects-rail__list ${inline ? "projects-rail__list--inline" : ""}`.trim()}>
        {projects.map((project) => {
          const meta = projectListMeta.get(project.id) ?? {
            taskCount: 0,
            activityLabel: "created just now",
          };

          return (
            <button
              key={project.id}
              type="button"
              className={`projects-rail__item ${selectedProjectId === project.id ? "is-active" : ""} ${
                inline ? "projects-rail__item--inline" : ""
              }`.trim()}
              onClick={() => onSelectProject(project.id)}
            >
              <span className="projects-rail__name">{project.name}</span>
              <span className="projects-rail__description">
                {formatTaskCount(meta.taskCount)} - {meta.activityLabel}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function resolveResponsiveMode(windowWidth: number): "wide" | "medium" | "narrow" {
  if (windowWidth < 900) {
    return "narrow";
  }

  if (windowWidth < 1280) {
    return "medium";
  }

  return "wide";
}

function formatTaskCount(count: number) {
  return `${count} ${count === 1 ? "task" : "tasks"}`;
}

function getProjectActivityLabel(project: Project) {
  const hasUpdate = project.updatedAt && project.updatedAt !== project.createdAt;

  if (hasUpdate) {
    return `updated ${formatRelativeTimestamp(project.updatedAt)}`;
  }

  return `created ${formatRelativeTimestamp(project.createdAt)}`;
}

function formatRelativeTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, secondsPerUnit] of units) {
    if (Math.abs(diffInSeconds) >= secondsPerUnit || unit === "second") {
      const delta = Math.round(diffInSeconds / secondsPerUnit);
      return rtf.format(delta, unit);
    }
  }

  return value;
}
