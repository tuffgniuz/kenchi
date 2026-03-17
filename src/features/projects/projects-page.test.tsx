import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectsPage } from "./projects-page";
import type { Item } from "../../models/workspace-item";
import type { JournalEntrySummary } from "../../models/journal";
import type { Project } from "../../models/project";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });

  fireEvent(window, new Event("resize"));
}

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    name: "Kenchi",
    description: "Build the workflow shell.",
    createdAt: "2026-03-17T00:00:00.000Z",
    updatedAt: "2026-03-17T00:00:00.000Z",
    ...overrides,
  };
}

describe("ProjectsPage layout", () => {
  it("renders the selected project without a browse-projects trigger", () => {
    const projects = [
      createProject(),
      createProject({
        id: "project-2",
        name: "Atlas",
        description: "Document the launch plan.",
      }),
    ];

    render(
      <ProjectsPage
        projects={projects}
        items={[] as Item[]}
        journalSummaries={[] as JournalEntrySummary[]}
        todayDate="2026-03-17"
        selectedProjectId="project-2"
        onSelectProject={vi.fn()}
        onUpdateProject={vi.fn()}
        onDeleteProject={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Show project detail in three-column layout" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Atlas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Browse projects" })).not.toBeInTheDocument();
  });

  it("keeps the project switcher accessible as an inline rail on medium widths", () => {
    setViewportWidth(1100);
    const projects = [createProject(), createProject({ id: "project-2", name: "Atlas" })];

    render(
      <ProjectsPage
        projects={projects}
        items={[] as Item[]}
        journalSummaries={[] as JournalEntrySummary[]}
        todayDate="2026-03-17"
        selectedProjectId="project-2"
        onSelectProject={vi.fn()}
        onUpdateProject={vi.fn()}
        onDeleteProject={vi.fn()}
      />,
    );

    expect(screen.getByTestId("projects-inline-rail")).toBeInTheDocument();
    expect(screen.queryByTestId("projects-stacked-context")).not.toBeInTheDocument();
  });

  it("moves the project context below the detail pane on narrow widths", () => {
    setViewportWidth(800);
    const projects = [createProject(), createProject({ id: "project-2", name: "Atlas" })];

    render(
      <ProjectsPage
        projects={projects}
        items={[] as Item[]}
        journalSummaries={[] as JournalEntrySummary[]}
        todayDate="2026-03-17"
        selectedProjectId="project-2"
        onSelectProject={vi.fn()}
        onUpdateProject={vi.fn()}
        onDeleteProject={vi.fn()}
      />,
    );

    expect(screen.getByTestId("projects-inline-rail")).toBeInTheDocument();
    expect(screen.getByTestId("projects-stacked-context")).toBeInTheDocument();
  });
});
