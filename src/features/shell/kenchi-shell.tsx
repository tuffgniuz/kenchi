import { useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { CommandPalette } from "../../components/command-palette";
import type { CommandPaletteItem } from "../../components/command-palette";
import {
  ArrowTurnIcon,
  BurgerIcon,
  CollapseSidebarIcon,
  SettingsIcon,
  SparkIcon,
} from "../../app/icons";
import {
  newInboxItemSequence,
  newTaskSequence,
  navigationItems,
  pageSequence,
  profileName,
  vaultPathStorageKey,
} from "../../app/navigation";
import type { ViewId } from "../../app/types";
import { saveInboxItems, loadInboxItems } from "../../lib/storage/inbox";
import type { CaptureItem } from "../../models/capture";
import type { TaskItem } from "../../models/task";
import { useTheme } from "../../theme/theme-provider";
import { QuickCaptureModal } from "../quick-capture/quick-capture-modal";
import { SettingsModal } from "../settings/settings-modal";
import { NewTaskModal } from "../tasks/new-task-modal";
import { PageContent } from "./page-content";

export function KenchiShell() {
  const { activeThemeId, themes, previewTheme, applyThemeSelection, resetPreview } =
    useTheme();
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<"theme" | "vault">("theme");
  const [pendingThemeId, setPendingThemeId] = useState(activeThemeId);
  const [vaultPath, setVaultPath] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(vaultPathStorageKey) ?? "";
  });
  const [pendingVaultPath, setPendingVaultPath] = useState(vaultPath);
  const [vaultError, setVaultError] = useState("");
  const [inboxEntries, setInboxEntries] = useState<CaptureItem[]>([]);
  const [loadedVaultPath, setLoadedVaultPath] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>(() => [
    {
      id: "task-example-1",
      title: "Design the first task workspace layout",
      status: "today",
      dueDate: "2026-03-18",
      priority: "high",
      project: "Kenchi",
      tags: ["ui", "planning"],
      notes:
        "Validate the split list/detail approach before adding persistence or keyboard-specific interactions.",
      estimate: "45m",
      source: "Product iteration",
      createdAt: "today",
    },
  ]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandLauncherOpen, setCommandLauncherOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const keySequenceRef = useRef<string[]>([]);

  const pageItems: CommandPaletteItem[] = navigationItems.map((item) => ({
    id: item.id,
    label: item.label,
    keywords: [item.id.replace("_", " "), item.label.toLowerCase()],
    icon: <item.icon className="nav-icon" />,
  }));

  const commandItems: CommandPaletteItem[] = [
    {
      id: "go-to-page",
      label: "Go to page",
      keywords: ["gtp", "navigate", "page"],
      icon: <ArrowTurnIcon className="nav-icon" />,
    },
    {
      id: "new-inbox-item",
      label: "New inbox item",
      keywords: ["ni", "new", "capture", "inbox"],
      icon: <SparkIcon className="nav-icon" />,
    },
    {
      id: "new-task",
      label: "New task",
      keywords: ["nt", "new", "task"],
      icon: <SparkIcon className="nav-icon" />,
    },
    {
      id: "settings",
      label: "Settings",
      keywords: ["preferences", "theme", "config"],
      icon: <SettingsIcon className="nav-icon" />,
    },
  ];

  function clearKeySequence() {
    keySequenceRef.current = [];
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isTypingTarget =
        event.target instanceof HTMLElement &&
        (event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA" ||
          event.target.isContentEditable);

      if (event.ctrlKey && event.code === "Backquote") {
        event.preventDefault();
        setSidebarExpanded((current) => !current);
        clearKeySequence();
        return;
      }

      if (event.key === "Escape" && settingsOpen) {
        event.preventDefault();
        closeSettings();
        return;
      }

      if (event.key === "Escape" && commandPaletteOpen) {
        event.preventDefault();
        setCommandPaletteOpen(false);
        clearKeySequence();
        return;
      }

      if (event.key === "Escape" && commandLauncherOpen) {
        event.preventDefault();
        setCommandLauncherOpen(false);
        clearKeySequence();
        return;
      }

      if (event.key === "Escape" && quickCaptureOpen) {
        event.preventDefault();
        setQuickCaptureOpen(false);
        clearKeySequence();
        return;
      }

      if (event.key === "Escape" && newTaskOpen) {
        event.preventDefault();
        setNewTaskOpen(false);
        clearKeySequence();
        return;
      }

      if (event.key === "Escape" && activeView === "tasks" && selectedTaskId) {
        event.preventDefault();
        setSelectedTaskId("");
        clearKeySequence();
        return;
      }

      if (
        event.key === " " &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !settingsOpen &&
        !commandPaletteOpen &&
        !commandLauncherOpen &&
        !quickCaptureOpen &&
        !newTaskOpen &&
        !isTypingTarget
      ) {
        event.preventDefault();
        setCommandLauncherOpen(true);
        clearKeySequence();
        return;
      }

      if (
        commandPaletteOpen ||
        commandLauncherOpen ||
        quickCaptureOpen ||
        newTaskOpen ||
        settingsOpen ||
        isTypingTarget
      ) {
        return;
      }

      if (event.key === ":") {
        event.preventDefault();
        setCommandLauncherOpen(true);
        clearKeySequence();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        clearKeySequence();
        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      const nextSequence = [...keySequenceRef.current, event.key.toLowerCase()].slice(-3);
      keySequenceRef.current = nextSequence;

      if (nextSequence.join("") === pageSequence.join("")) {
        event.preventDefault();
        setCommandPaletteOpen(true);
        clearKeySequence();
        return;
      }

      if (nextSequence.join("") === newInboxItemSequence.join("")) {
        event.preventDefault();
        setQuickCaptureOpen(true);
        clearKeySequence();
        return;
      }

      if (nextSequence.join("") === newTaskSequence.join("")) {
        event.preventDefault();
        setNewTaskOpen(true);
        clearKeySequence();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeView,
    commandLauncherOpen,
    commandPaletteOpen,
    newTaskOpen,
    quickCaptureOpen,
    selectedTaskId,
    settingsOpen,
  ]);

  useEffect(() => {
    if (!settingsOpen) {
      setPendingThemeId(activeThemeId);
      setPendingVaultPath(vaultPath);
    }
  }, [activeThemeId, settingsOpen, vaultPath]);

  useEffect(() => {
    let cancelled = false;

    if (!vaultPath) {
      setInboxEntries([]);
      setLoadedVaultPath("");
      return;
    }

    void loadInboxItems(vaultPath)
      .then((items) => {
        if (!cancelled) {
          setInboxEntries(items);
          setLoadedVaultPath(vaultPath);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInboxEntries([]);
          setLoadedVaultPath(vaultPath);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vaultPath]);

  useEffect(() => {
    if (!vaultPath || loadedVaultPath !== vaultPath) {
      return;
    }

    void saveInboxItems(vaultPath, inboxEntries);
  }, [inboxEntries, loadedVaultPath, vaultPath]);

  function navigateToPage(view: ViewId) {
    setActiveView(view);
  }

  function openSettings() {
    setPendingThemeId(activeThemeId);
    setPendingVaultPath(vaultPath);
    setVaultError("");
    setSettingsOpen(true);
  }

  function closeSettings() {
    resetPreview();
    setPendingThemeId(activeThemeId);
    setPendingVaultPath(vaultPath);
    setVaultError("");
    setSettingsOpen(false);
  }

  function handleThemePreview(themeId: string) {
    setPendingThemeId(themeId);
    previewTheme(themeId);
  }

  async function handleConfirmSettings() {
    applyThemeSelection(pendingThemeId);
    setVaultError("");

    const nextVaultPath = pendingVaultPath.trim();

    if (nextVaultPath) {
      try {
        const initializedVaultPath = await invoke<string>("initialize_vault", {
          path: nextVaultPath,
        });

        setVaultPath(initializedVaultPath);
        window.localStorage.setItem(vaultPathStorageKey, initializedVaultPath);
      } catch (error) {
        setVaultError(
          error instanceof Error ? error.message : "Failed to initialize vault path.",
        );
        return;
      }
    } else {
      setVaultPath("");
      window.localStorage.removeItem(vaultPathStorageKey);
    }

    setSettingsOpen(false);
  }

  async function handleBrowseVault() {
    setVaultError("");
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: pendingVaultPath || undefined,
      title: "Select vault directory",
    });

    if (typeof selected === "string") {
      setPendingVaultPath(selected);
    }
  }

  function handleSelectPage(item: CommandPaletteItem) {
    navigateToPage(item.id as ViewId);
    setCommandPaletteOpen(false);
  }

  function handleCaptureThought(value: string) {
    const text = value.trim();

    if (!text || !vaultPath) {
      return;
    }

    setInboxEntries((current) => [
      {
        id: `capture-${Date.now()}`,
        text,
        createdAt: "Just now",
        tags: [],
        project: null,
      },
      ...current,
    ]);
    setQuickCaptureOpen(false);
  }

  function handleCreateTask(task: { title: string; description: string }) {
    const nextTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: task.title,
      status: "inbox",
      dueDate: "",
      priority: "",
      project: "",
      tags: [],
      notes: task.description,
      estimate: "",
      source: "",
      createdAt: "just now",
    };

    setTasks((current) => [nextTask, ...current]);
    setSelectedTaskId(nextTask.id);
    setNewTaskOpen(false);
    setActiveView("tasks");
  }

  function handleSelectCommand(item: CommandPaletteItem) {
    setCommandLauncherOpen(false);

    if (item.id === "go-to-page") {
      setCommandPaletteOpen(true);
      return;
    }

    if (item.id === "new-inbox-item") {
      setQuickCaptureOpen(true);
      return;
    }

    if (item.id === "new-task") {
      setNewTaskOpen(true);
      return;
    }

    if (item.id === "settings") {
      openSettings();
    }
  }

  return (
    <>
      <div className="app-shell">
        <aside className={`sidebar ${sidebarExpanded ? "is-expanded" : "is-collapsed"}`}>
          {sidebarExpanded ? (
            <>
              <div className="sidebar__header">
                <button
                  type="button"
                  className="sidebar__brand"
                  onClick={() => navigateToPage("dashboard")}
                  aria-label="Open dashboard"
                >
                  <span className="sidebar__avatar" aria-hidden="true">
                    {profileName.slice(0, 1)}
                  </span>
                  <span className="sidebar__brand-copy">
                    <span className="sidebar__brand-name">{profileName}&apos;s Kenchi</span>
                  </span>
                </button>

                <button
                  type="button"
                  className="sidebar__toggle"
                  onClick={() => setSidebarExpanded((current) => !current)}
                  aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
                  aria-pressed={sidebarExpanded}
                >
                  <CollapseSidebarIcon className="nav-icon" />
                </button>
              </div>

              <div className="sidebar__section sidebar__section--primary">
                <nav className="nav-list" aria-label="Primary navigation">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`nav-button ${activeView === item.id ? "is-active" : ""}`}
                        onClick={() => navigateToPage(item.id)}
                        aria-label={item.label}
                        title={item.label}
                      >
                        <Icon className="nav-icon" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="sidebar__section sidebar__section--settings">
                <button
                  type="button"
                  className="nav-button"
                  onClick={openSettings}
                  aria-label="Settings"
                  title="Settings"
                >
                  <SettingsIcon className="nav-icon" />
                  <span>Settings</span>
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              className="sidebar__toggle sidebar__toggle--floating"
              onClick={() => setSidebarExpanded((current) => !current)}
              aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
              aria-pressed={sidebarExpanded}
            >
              <BurgerIcon className="nav-icon" />
            </button>
          )}
        </aside>

        <main className="main-panel">
          <div className="main-panel__content">
            <PageContent
              activeView={activeView}
              inboxItems={inboxEntries}
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          </div>
        </main>
      </div>

      {!vaultPath ? (
        <div className="app-warning" role="alert">
          No vault is configured. Set a vault in Settings before capturing or storing data.
        </div>
      ) : null}

      {settingsOpen ? (
        <SettingsModal
          activeSection={settingsSection}
          onSectionChange={setSettingsSection}
          themes={themes}
          pendingThemeId={pendingThemeId}
          pendingVaultPath={pendingVaultPath}
          vaultError={vaultError}
          onPreviewTheme={handleThemePreview}
          onVaultPathChange={setPendingVaultPath}
          onBrowseVault={handleBrowseVault}
          onClose={closeSettings}
          onConfirm={handleConfirmSettings}
        />
      ) : null}

      <CommandPalette
        title="Go To Page"
        placeholder="go to page"
        items={pageItems}
        isOpen={commandPaletteOpen}
        emptyMessage="No pages match that query."
        onClose={() => setCommandPaletteOpen(false)}
        onSelect={handleSelectPage}
      />

      <CommandPalette
        title="Commands"
        placeholder=":"
        items={commandItems}
        isOpen={commandLauncherOpen}
        emptyMessage="No commands match that query."
        onClose={() => setCommandLauncherOpen(false)}
        onSelect={handleSelectCommand}
      />

      <QuickCaptureModal
        isOpen={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        onSubmit={handleCaptureThought}
      />

      <NewTaskModal
        isOpen={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onSubmit={handleCreateTask}
      />
    </>
  );
}
