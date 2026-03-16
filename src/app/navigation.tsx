import type { NavItem, ViewId } from "./types";
import {
  BookOpenIcon,
  CheckSquareIcon,
  InboxIcon,
  LayersIcon,
  TargetIcon,
} from "./icons";

export const vaultPathStorageKey = "kenchi.vault-path";

export const navigationItems: NavItem[] = [
  { id: "inbox", label: "Capture Inbox", icon: InboxIcon },
  { id: "goals", label: "Goals", icon: TargetIcon },
  { id: "tasks", label: "Tasks", icon: CheckSquareIcon },
  { id: "projects", label: "Projects", icon: LayersIcon },
  { id: "journaling", label: "Journaling", icon: BookOpenIcon },
];

export const viewTitles: Record<ViewId, string> = {
  dashboard: "Dashboard",
  inbox: "Capture Inbox",
  goals: "Goals",
  tasks: "Tasks",
  projects: "Projects",
  journaling: "Journaling",
};
