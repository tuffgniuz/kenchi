import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../theme/theme-provider";
import { vaultPathStorageKey } from "../../app/navigation";
import { KenchiShell } from "./kenchi-shell";
import type { WorkspaceItem } from "../../models/workspace-item";
import type { Project } from "../../models/project";

const mocks = vi.hoisted(() => ({
  dialogOpen: vi.fn(),
  initializeVault: vi.fn(),
  loadWorkspaceItems: vi.fn(),
  replaceWorkspaceItems: vi.fn(),
  loadProjects: vi.fn(),
  saveProjects: vi.fn(),
  listJournalEntries: vi.fn(),
  loadJournalEntry: vi.fn(),
  saveJournalEntry: vi.fn(),
  loadProfile: vi.fn(),
  saveProfile: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: mocks.dialogOpen,
}));

vi.mock("../../services/vault", () => ({
  initializeVault: mocks.initializeVault,
}));

vi.mock("../../services/workspace", () => ({
  loadWorkspaceItems: mocks.loadWorkspaceItems,
  replaceWorkspaceItems: mocks.replaceWorkspaceItems,
}));

vi.mock("../../services/projects", () => ({
  loadProjects: mocks.loadProjects,
  saveProjects: mocks.saveProjects,
}));

vi.mock("../../services/journal", () => ({
  listJournalEntries: mocks.listJournalEntries,
  loadJournalEntry: mocks.loadJournalEntry,
  saveJournalEntry: mocks.saveJournalEntry,
}));

vi.mock("../../services/profile", () => ({
  loadProfile: mocks.loadProfile,
  saveProfile: mocks.saveProfile,
}));

function createWorkspaceItem(overrides: Partial<WorkspaceItem> = {}): WorkspaceItem {
  return {
    id: "item-1",
    kind: "task",
    state: "active",
    sourceType: "manual",
    title: "Review task palette",
    content: "",
    createdAt: "today",
    updatedAt: "today",
    tags: [],
    project: "",
    isCompleted: false,
    priority: "",
    dueDate: "",
    completedAt: "",
    estimate: "",
    goalMetric: "tasks_completed",
    goalTarget: 1,
    goalProgress: 0,
    goalProgressByDate: {},
    goalPeriod: "weekly",
    ...overrides,
  };
}

function renderShell() {
  return render(
    <ThemeProvider>
      <KenchiShell />
    </ThemeProvider>,
  );
}

function installLocalStorage(initialValues: Record<string, string> = {}) {
  const store = new Map(Object.entries(initialValues));

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  });
}

function pressSequence(sequence: string[]) {
  for (const key of sequence) {
    fireEvent.keyDown(window, { key });
  }
}

describe("KenchiShell list shortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installLocalStorage({
      [vaultPathStorageKey]: "/tmp/kenchi-test-vault",
    });

    const projects: Project[] = [
      {
        id: "project-1",
        name: "Kenchi",
        description: "Main app",
        createdAt: "2026-03-17T00:00:00.000Z",
        updatedAt: "2026-03-17T00:00:00.000Z",
      },
    ];

    mocks.initializeVault.mockResolvedValue("/tmp/kenchi-test-vault");
    mocks.loadWorkspaceItems.mockResolvedValue([
      createWorkspaceItem({
        id: "capture-1",
        kind: "capture",
        sourceType: "capture",
        state: "inbox",
        title: "Sort inbox shortcuts",
        content: "Sort inbox shortcuts",
      }),
      createWorkspaceItem({
        id: "task-1",
        kind: "task",
        title: "Add list task shortcut",
      }),
      createWorkspaceItem({
        id: "goal-1",
        kind: "goal",
        title: "Ship goal command flow",
        goalMetric: undefined,
      }),
    ]);
    mocks.replaceWorkspaceItems.mockResolvedValue(undefined);
    mocks.loadProjects.mockResolvedValue(projects);
    mocks.saveProjects.mockResolvedValue(undefined);
    mocks.listJournalEntries.mockResolvedValue([]);
    mocks.loadJournalEntry.mockResolvedValue(null);
    mocks.saveJournalEntry.mockResolvedValue(undefined);
    mocks.loadProfile.mockResolvedValue({
      name: "User",
      profilePicture: "",
    });
    mocks.saveProfile.mockResolvedValue(undefined);
  });

  it("opens list palettes for projects, tasks, goals, and inbox items from leader sequences", async () => {
    renderShell();

    await waitFor(() => {
      expect(mocks.loadWorkspaceItems).toHaveBeenCalled();
      expect(mocks.loadProjects).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(await screen.findByRole("heading", { name: "Kenchi" })).toBeInTheDocument();

    pressSequence([" ", "l", "p"]);
    expect(await screen.findByRole("textbox", { name: "Projects" })).toHaveAttribute(
      "placeholder",
      "list projects",
    );
    fireEvent.keyDown(window, { key: "Escape" });

    pressSequence([" ", "l", "t"]);
    expect(await screen.findByRole("textbox", { name: "Tasks" })).toHaveAttribute(
      "placeholder",
      "list tasks",
    );
    fireEvent.keyDown(window, { key: "Escape" });

    pressSequence([" ", "l", "g"]);
    expect(await screen.findByRole("textbox", { name: "Goals" })).toHaveAttribute(
      "placeholder",
      "list goals",
    );
    fireEvent.keyDown(window, { key: "Escape" });

    pressSequence([" ", "l", "i"]);
    expect(await screen.findByRole("textbox", { name: "Inbox" })).toHaveAttribute(
      "placeholder",
      "list inbox items",
    );
  });

  it("links a new task to a goal and prevents linking once the goal is full", async () => {
    mocks.loadWorkspaceItems.mockResolvedValue([
      createWorkspaceItem({
        id: "goal-1",
        kind: "goal",
        title: "Complete 2 review tasks",
        goalTarget: 2,
        goalMetric: "tasks_completed",
        goalScope: { projectId: "project-1", taskIds: ["task-1"] },
      }),
      createWorkspaceItem({
        id: "task-1",
        kind: "task",
        title: "Review task 1",
        projectId: "project-1",
        isCompleted: true,
        completedAt: "2026-03-17",
      }),
    ]);

    renderShell();

    await waitFor(() => {
      expect(mocks.loadWorkspaceItems).toHaveBeenCalled();
    });

    pressSequence([" ", "n", "t"]);
    fireEvent.change(await screen.findByRole("textbox", { name: "Task title" }), {
      target: { value: "Review task 2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kenchi" }));
    fireEvent.click(screen.getByRole("button", { name: "Complete 2 review tasks" }));
    fireEvent.submit(screen.getByRole("textbox", { name: "Task title" }).closest("form")!);

    await waitFor(() => {
      expect(mocks.replaceWorkspaceItems).toHaveBeenCalled();
      const latestCall = mocks.replaceWorkspaceItems.mock.calls[
        mocks.replaceWorkspaceItems.mock.calls.length - 1
      ];
      expect(latestCall?.[0]).toBe("/tmp/kenchi-test-vault");
      expect(latestCall?.[1]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "goal",
            id: "goal-1",
            goalScope: { projectId: "project-1", taskIds: expect.arrayContaining(["task-1"]) },
          }),
        ]),
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
    });

    const latestSavedItems = mocks.replaceWorkspaceItems.mock.calls[
      mocks.replaceWorkspaceItems.mock.calls.length - 1
    ]?.[1] as WorkspaceItem[];
    const savedGoal = latestSavedItems.find((item) => item.id === "goal-1");
    const savedTask = latestSavedItems.find(
      (item) => item.kind === "task" && item.title === "Review task 2",
    );

    expect(savedGoal?.goalScope?.taskIds).toEqual(["task-1", savedTask?.id]);

    pressSequence([" ", "n", "t"]);
    fireEvent.change(await screen.findByRole("textbox", { name: "Task title" }), {
      target: { value: "Review task 3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kenchi" }));
    expect(screen.getByRole("button", { name: "Complete 2 review tasks" })).toBeDisabled();
  });

  it("opens quick-add task creation from a goal card with that goal preselected", async () => {
    mocks.loadWorkspaceItems.mockResolvedValue([
      createWorkspaceItem({
        id: "goal-1",
        kind: "goal",
        title: "Complete 3 tasks each day",
        goalTarget: 3,
        goalMetric: "tasks_completed",
        goalPeriod: "daily",
        goalScope: { projectId: "project-1" },
      }),
    ]);

    renderShell();

    await waitFor(() => {
      expect(mocks.loadWorkspaceItems).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Goals" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add task to Complete 3 tasks each day" }));

    expect(await screen.findByRole("dialog", { name: "New task" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Complete 3 tasks each day" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Kenchi" })).toHaveAttribute("aria-pressed", "true");
  });

  it("saves a task from the goal quick-add modal with Enter from the description field", async () => {
    mocks.loadWorkspaceItems.mockResolvedValue([
      createWorkspaceItem({
        id: "goal-1",
        kind: "goal",
        title: "Complete 3 tasks each day",
        goalTarget: 3,
        goalMetric: "tasks_completed",
        goalPeriod: "daily",
        goalScope: { projectId: "project-1" },
      }),
      createWorkspaceItem({
        id: "task-0",
        kind: "task",
        title: "Existing task",
        projectId: "project-1",
      }),
    ]);

    renderShell();

    await waitFor(() => {
      expect(mocks.loadWorkspaceItems).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Goals" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add task to Complete 3 tasks each day" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Task title" }), {
      target: { value: "Review task #1" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Task description" }), {
      target: { value: "sndjkas" },
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Task description" }), {
      key: "Enter",
    });

    await waitFor(() => {
      expect(mocks.replaceWorkspaceItems).toHaveBeenCalled();
    });

    const latestSavedItems = mocks.replaceWorkspaceItems.mock.calls[
      mocks.replaceWorkspaceItems.mock.calls.length - 1
    ]?.[1] as WorkspaceItem[];
    const savedTask = latestSavedItems.find(
      (item) => item.kind === "task" && item.title === "Review task #1",
    );
    const savedGoal = latestSavedItems.find((item) => item.kind === "goal" && item.id === "goal-1");

    expect(savedTask).toEqual(
      expect.objectContaining({
        projectId: "project-1",
        title: "Review task #1",
        content: "sndjkas",
      }),
    );
    expect(savedGoal?.goalScope?.taskIds).toContain(savedTask?.id);
    expect(
      latestSavedItems.findIndex((item) => item.id === "task-0"),
    ).toBeLessThan(latestSavedItems.findIndex((item) => item.id === savedTask?.id));
    expect(screen.getByRole("heading", { name: "Daily goals" })).toBeInTheDocument();
  });

  it("opens a goal in edit mode and updates the existing goal", async () => {
    mocks.loadWorkspaceItems.mockResolvedValue([
      createWorkspaceItem({
        id: "goal-1",
        kind: "goal",
        title: "Complete 3 tasks each day",
        goalTarget: 3,
        goalMetric: "tasks_completed",
        goalPeriod: "daily",
        goalScope: { projectId: "project-1" },
      }),
    ]);

    renderShell();

    await waitFor(() => {
      expect(mocks.loadWorkspaceItems).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Goals" }));
    fireEvent.click(await screen.findByRole("button", { name: "Edit Complete 3 tasks each day" }));

    expect(await screen.findByRole("heading", { name: "Edit Goal" })).toBeInTheDocument();
    expect(screen.getByLabelText("Goal sentence")).toHaveValue("Complete 3 tasks each day");

    fireEvent.change(screen.getByLabelText("Goal sentence"), {
      target: { value: "Complete 5 tasks each day" },
    });
    fireEvent.change(screen.getByLabelText("Goal target"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mocks.replaceWorkspaceItems).toHaveBeenCalled();
    });

    const latestSavedItems = mocks.replaceWorkspaceItems.mock.calls[
      mocks.replaceWorkspaceItems.mock.calls.length - 1
    ]?.[1] as WorkspaceItem[];
    expect(latestSavedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "goal-1",
          title: "Complete 5 tasks each day",
          goalTarget: 5,
          goalMetric: "tasks_completed",
          goalPeriod: "daily",
        }),
      ]),
    );
  });

  it("shows a persistence error toast when saving workspace items fails", async () => {
    mocks.replaceWorkspaceItems.mockImplementation(async (_vaultPath, items: WorkspaceItem[]) => {
      if (items.some((item) => item.kind === "goal" && item.title === "Complete 5 tasks today")) {
        throw new Error("sqlite busy");
      }
    });

    renderShell();

    await waitFor(() => {
      expect(mocks.loadWorkspaceItems).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Goals" }));
    pressSequence([" ", "n", "g"]);
    const dialog = await screen.findByRole("dialog", { name: "New Goal" });
    fireEvent.change(within(dialog).getByLabelText("Goal sentence"), {
      target: { value: "Complete 5 tasks today" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Daily" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Tasks" }));
    fireEvent.change(within(dialog).getByLabelText("Goal target"), {
      target: { value: "5" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Failed to save workspace changes: sqlite busy",
    );
    expect(screen.queryByText("Complete 5 tasks today")).not.toBeInTheDocument();
  });
});
