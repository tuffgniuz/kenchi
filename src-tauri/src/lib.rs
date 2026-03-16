use std::env;
use std::fs;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CaptureItem {
    id: String,
    text: String,
    created_at: String,
    tags: Vec<String>,
    project: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TaskItem {
    id: String,
    title: String,
    status: String,
    due_date: String,
    priority: String,
    project: String,
    tags: Vec<String>,
    notes: String,
    estimate: String,
    source: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UserProfile {
    name: String,
    profile_picture: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Project {
    id: String,
    name: String,
    description: String,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GoalItem {
    id: String,
    title: String,
    #[serde(default)]
    description: Option<String>,
    #[serde(alias = "metricType", alias = "metric_type")]
    metric: GoalMetric,
    #[serde(alias = "targetValue", alias = "target_value")]
    target: i64,
    period: GoalPeriod,
    #[serde(default, alias = "trackingMode", alias = "tracking_mode")]
    tracking_mode: GoalTrackingMode,
    #[serde(default)]
    scope: Option<GoalScope>,
    status: GoalStatus,
    created_at: String,
    #[serde(default, rename = "project", skip_serializing)]
    legacy_project: String,
    #[serde(default, rename = "tagFilter", alias = "tag_filter", skip_serializing)]
    legacy_tag_filter: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Item {
    id: String,
    kind: String,
    state: String,
    source_type: String,
    title: String,
    content: String,
    created_at: String,
    updated_at: String,
    tags: Vec<String>,
    project: String,
    task_status: String,
    priority: String,
    due_date: String,
    #[serde(default)]
    completed_at: String,
    estimate: String,
    #[serde(default, alias = "goal_metric_type")]
    goal_metric: GoalMetric,
    #[serde(default = "default_goal_target", alias = "goal_target_value")]
    goal_target: i64,
    #[serde(default, alias = "goal_progress_value")]
    goal_progress: i64,
    #[serde(default)]
    goal_progress_by_date: HashMap<String, i64>,
    #[serde(default)]
    goal_period: GoalPeriod,
    #[serde(default)]
    goal_tracking_mode: GoalTrackingMode,
    #[serde(default)]
    goal_scope: Option<GoalScope>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
enum GoalTrackingMode {
    Automatic,
    Manual,
}

impl Default for GoalTrackingMode {
    fn default() -> Self {
        Self::Automatic
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
enum GoalMetric {
    TasksCompleted,
    InboxItemsProcessed,
    JournalEntriesWritten,
    NotesCreated,
    ManualUnits,
}

impl Default for GoalMetric {
    fn default() -> Self {
        Self::TasksCompleted
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
enum GoalPeriod {
    Daily,
    Weekly,
    Monthly,
    Yearly,
}

impl Default for GoalPeriod {
    fn default() -> Self {
        Self::Weekly
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
enum GoalStatus {
    Active,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct GoalScope {
    #[serde(default)]
    project_id: Option<String>,
    #[serde(default)]
    tag: Option<String>,
    #[serde(default)]
    task_ids: Option<Vec<String>>,
}

fn default_goal_target() -> i64 {
    1
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct JournalIntention {
    id: String,
    text: String,
    status: String,
    order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct JournalEntry {
    id: String,
    date: String,
    #[serde(default)]
    morning_intention: String,
    #[serde(default)]
    diary_entry: String,
    #[serde(default)]
    reflection_entry: String,
    #[serde(default)]
    focuses: Vec<String>,
    #[serde(default)]
    commitments: Vec<JournalIntention>,
    #[serde(default)]
    reflection: JournalReflection,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct JournalReflection {
    went_well: String,
    didnt_go_well: String,
    learned: String,
    gratitude: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct JournalEntrySummary {
    date: String,
    preview: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct LegacyJournalEntry {
    id: String,
    date: String,
    #[serde(default)]
    morning_note: String,
    #[serde(default)]
    evening_note: String,
    #[serde(default)]
    intentions: Vec<JournalIntention>,
    #[serde(default)]
    created_at: String,
    #[serde(default)]
    updated_at: String,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn initialize_vault(path: &str) -> Result<String, String> {
    let trimmed = path.trim();

    if trimmed.is_empty() {
        return Err("Vault path cannot be empty.".into());
    }

    let resolved = expand_home(trimmed)?;

    fs::create_dir_all(&resolved).map_err(|error| {
        format!(
            "Failed to create vault directory at {}: {}",
            resolved.display(),
            error
        )
    })?;

    let kenchi_dir = resolved.join(".inbox");

    fs::create_dir_all(&kenchi_dir).map_err(|error| {
        format!(
            "Failed to initialize .inbox directory at {}: {}",
            resolved.display(),
            error
        )
    })?;

    fs::create_dir_all(resolved.join("journal")).map_err(|error| {
        format!(
            "Failed to initialize journal directory at {}: {}",
            resolved.display(),
            error
        )
    })?;

    let inbox_file = kenchi_dir.join("inbox.json");
    let items_file = resolved.join(".items").join("items.json");
    let projects_file = resolved.join(".projects").join("projects.json");
    let profile_file = resolved.join(".profile").join("profile.json");

    fs::create_dir_all(resolved.join(".profile")).map_err(|error| {
        format!(
            "Failed to initialize .profile directory at {}: {}",
            resolved.display(),
            error
        )
    })?;

    fs::create_dir_all(resolved.join(".projects")).map_err(|error| {
        format!(
            "Failed to initialize .projects directory at {}: {}",
            resolved.display(),
            error
        )
    })?;

    fs::create_dir_all(resolved.join(".items")).map_err(|error| {
        format!(
            "Failed to initialize .items directory at {}: {}",
            resolved.display(),
            error
        )
    })?;

    if !inbox_file.exists() {
        fs::write(&inbox_file, "[]").map_err(|error| {
            format!(
                "Failed to initialize inbox storage at {}: {}",
                inbox_file.display(),
                error
            )
        })?;
    }

    if !items_file.exists() {
        fs::write(&items_file, "[]").map_err(|error| {
            format!(
                "Failed to initialize item storage at {}: {}",
                items_file.display(),
                error
            )
        })?;
    }

    if !projects_file.exists() {
        fs::write(&projects_file, "[]").map_err(|error| {
            format!(
                "Failed to initialize project storage at {}: {}",
                projects_file.display(),
                error
            )
        })?;
    }

    if !profile_file.exists() {
        let profile = serde_json::to_string_pretty(&UserProfile {
            name: "User".into(),
            profile_picture: String::new(),
        })
        .map_err(|error| format!("Failed to serialize initial profile: {}", error))?;

        fs::write(&profile_file, profile).map_err(|error| {
            format!(
                "Failed to initialize profile storage at {}: {}",
                profile_file.display(),
                error
            )
        })?;
    }

    resolved
        .canonicalize()
        .or(Ok::<PathBuf, std::io::Error>(resolved))
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|error| format!("Failed to resolve vault path: {}", error))
}

#[tauri::command]
fn load_inbox_items(path: &str) -> Result<Vec<CaptureItem>, String> {
    let resolved = expand_home(path.trim())?;
    let inbox_file = resolved.join(".inbox").join("inbox.json");

    if !inbox_file.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&inbox_file).map_err(|error| {
        format!(
            "Failed to read inbox storage at {}: {}",
            inbox_file.display(),
            error
        )
    })?;

    serde_json::from_str::<Vec<CaptureItem>>(&content).map_err(|error| {
        format!(
            "Failed to parse inbox storage at {}: {}",
            inbox_file.display(),
            error
        )
    })
}

#[tauri::command]
fn save_inbox_items(path: &str, items: Vec<CaptureItem>) -> Result<(), String> {
    let resolved = expand_home(path.trim())?;
    let inbox_file = resolved.join(".inbox").join("inbox.json");
    let serialized = serde_json::to_string_pretty(&items)
        .map_err(|error| format!("Failed to serialize inbox items: {}", error))?;

    fs::write(&inbox_file, serialized).map_err(|error| {
        format!(
            "Failed to write inbox storage at {}: {}",
            inbox_file.display(),
            error
        )
    })
}

#[tauri::command]
fn load_items(path: &str) -> Result<Vec<Item>, String> {
    let resolved = expand_home(path.trim())?;
    let items_file = resolved.join(".items").join("items.json");

    if items_file.exists() {
        let content = fs::read_to_string(&items_file).map_err(|error| {
            format!(
                "Failed to read item storage at {}: {}",
                items_file.display(),
                error
            )
        })?;

        let items = serde_json::from_str::<Vec<Item>>(&content).map_err(|error| {
            format!(
                "Failed to parse item storage at {}: {}",
                items_file.display(),
                error
            )
        })?;

        if !items.is_empty() {
            return Ok(items.into_iter().map(normalize_item).collect());
        }
    }

    migrate_legacy_items(&resolved)
}

#[tauri::command]
fn save_items(path: &str, items: Vec<Item>) -> Result<(), String> {
    let resolved = expand_home(path.trim())?;
    let items_file = resolved.join(".items").join("items.json");
    let normalized_items: Vec<Item> = items.into_iter().map(normalize_item).collect();
    let serialized = serde_json::to_string_pretty(&normalized_items)
        .map_err(|error| format!("Failed to serialize items: {}", error))?;

    fs::write(&items_file, serialized).map_err(|error| {
        format!(
            "Failed to write item storage at {}: {}",
            items_file.display(),
            error
        )
    })
}

fn normalize_goal_item(mut goal: GoalItem) -> GoalItem {
    let mut scope = goal.scope.unwrap_or_default();

    if scope.project_id.is_none() && !goal.legacy_project.trim().is_empty() {
        scope.project_id = Some(goal.legacy_project.trim().to_string());
    }

    if scope.tag.is_none() && !goal.legacy_tag_filter.trim().is_empty() {
        scope.tag = Some(goal.legacy_tag_filter.trim().trim_start_matches('#').to_string());
    }

    goal.scope = if scope.project_id.is_some() || scope.tag.is_some() || scope.task_ids.is_some() {
        Some(scope)
    } else {
        None
    };

    goal
}

fn normalize_item(mut item: Item) -> Item {
    if item.kind == "goal" {
        let mut scope = item.goal_scope.unwrap_or_default();

        if scope.project_id.is_none() && !item.project.trim().is_empty() {
            scope.project_id = Some(item.project.trim().to_string());
        }

        if scope.tag.is_none() {
            if let Some(first_tag) = item.tags.first() {
                if !first_tag.trim().is_empty() {
                    scope.tag = Some(first_tag.trim().trim_start_matches('#').to_string());
                }
            }
        }

        item.goal_scope = if scope.project_id.is_some() || scope.tag.is_some() || scope.task_ids.is_some() {
            Some(scope)
        } else {
            None
        };

        if item.goal_progress < 0 {
            item.goal_progress = 0;
        }

        item.goal_progress_by_date = item
            .goal_progress_by_date
            .into_iter()
            .map(|(date, value)| (date, value.max(0)))
            .collect();

        item.project = String::new();
        item.tags = Vec::new();
    }

    item
}

#[tauri::command]
fn load_journal_entry(path: &str, date: &str) -> Result<Option<JournalEntry>, String> {
    let resolved = expand_home(path.trim())?;
    let entry_file = resolved.join("journal").join(format!("{}.json", date.trim()));

    if !entry_file.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&entry_file).map_err(|error| {
        format!(
            "Failed to read journal entry at {}: {}",
            entry_file.display(),
            error
        )
    })?;

    parse_journal_entry(&content, &entry_file).map(Some)
}

#[tauri::command]
fn save_journal_entry(path: &str, entry: JournalEntry) -> Result<(), String> {
    let resolved = expand_home(path.trim())?;
    let entry_file = resolved.join("journal").join(format!("{}.json", entry.date));
    let serialized = serde_json::to_string_pretty(&entry)
        .map_err(|error| format!("Failed to serialize journal entry: {}", error))?;

    fs::write(&entry_file, serialized).map_err(|error| {
        format!(
            "Failed to write journal entry at {}: {}",
            entry_file.display(),
            error
        )
    })
}

#[tauri::command]
fn list_journal_entries(path: &str) -> Result<Vec<JournalEntrySummary>, String> {
    let resolved = expand_home(path.trim())?;
    let journal_dir = resolved.join("journal");

    if !journal_dir.exists() {
        return Ok(Vec::new());
    }

    let mut summaries: Vec<JournalEntrySummary> = fs::read_dir(&journal_dir)
        .map_err(|error| {
            format!(
                "Failed to read journal directory at {}: {}",
                journal_dir.display(),
                error
            )
        })?
        .filter_map(|entry| entry.ok())
        .filter_map(|entry| {
            let path = entry.path();

            if path.extension().and_then(|value| value.to_str()) != Some("json") {
                return None;
            }

            let content = fs::read_to_string(&path).ok()?;
            let parsed = parse_journal_entry(&content, &path).ok()?;
            let preview = journal_preview(&parsed);

            Some(JournalEntrySummary {
                date: parsed.date,
                preview,
            })
        })
        .collect();

    summaries.sort_by(|left, right| right.date.cmp(&left.date));

    Ok(summaries)
}

fn parse_journal_entry(content: &str, path: &Path) -> Result<JournalEntry, String> {
    match serde_json::from_str::<JournalEntry>(content) {
        Ok(entry) => Ok(entry),
        Err(_) => serde_json::from_str::<LegacyJournalEntry>(content)
            .map(legacy_to_journal_entry)
            .map_err(|error| {
                format!(
                    "Failed to parse journal entry at {}: {}",
                    path.display(),
                    error
                )
            }),
    }
}

fn legacy_to_journal_entry(entry: LegacyJournalEntry) -> JournalEntry {
    JournalEntry {
        id: if entry.id.is_empty() {
            format!("journal-{}", entry.date)
        } else {
            entry.id
        },
        date: entry.date,
        morning_intention: entry.morning_note,
        diary_entry: String::new(),
        reflection_entry: entry.evening_note,
        focuses: Vec::new(),
        commitments: entry.intentions,
        reflection: JournalReflection {
            went_well: String::new(),
            didnt_go_well: String::new(),
            learned: String::new(),
            gratitude: String::new(),
        },
        created_at: if entry.created_at.is_empty() {
            String::from("today")
        } else {
            entry.created_at
        },
        updated_at: if entry.updated_at.is_empty() {
            String::from("today")
        } else {
            entry.updated_at
        },
    }
}

fn journal_preview(entry: &JournalEntry) -> String {
    let candidates = [
        entry.reflection_entry.as_str(),
        entry.diary_entry.as_str(),
        entry.reflection.went_well.as_str(),
        entry.reflection.learned.as_str(),
        entry.morning_intention.as_str(),
    ];

    candidates
        .into_iter()
        .find(|value| !value.trim().is_empty())
        .map(|value| value.trim().chars().take(84).collect())
        .unwrap_or_default()
}

fn migrate_legacy_items(resolved: &Path) -> Result<Vec<Item>, String> {
    let inbox_file = resolved.join(".inbox").join("inbox.json");
    let tasks_file = resolved.join(".tasks").join("tasks.json");
    let goals_file = resolved.join(".goals").join("goals.json");
    let mut items: Vec<Item> = Vec::new();

    if inbox_file.exists() {
        let content = fs::read_to_string(&inbox_file).map_err(|error| {
            format!(
                "Failed to read inbox storage at {}: {}",
                inbox_file.display(),
                error
            )
        })?;
        let captures = serde_json::from_str::<Vec<CaptureItem>>(&content).map_err(|error| {
            format!(
                "Failed to parse inbox storage at {}: {}",
                inbox_file.display(),
                error
            )
        })?;

        items.extend(captures.into_iter().map(|capture| Item {
            id: capture.id,
            kind: "capture".into(),
            state: "inbox".into(),
            source_type: "capture".into(),
            title: capture.text.clone(),
            content: capture.text,
            created_at: capture.created_at,
            updated_at: String::from(""),
            tags: capture.tags,
            project: capture.project.unwrap_or_default(),
            task_status: "inbox".into(),
            priority: String::new(),
            due_date: String::new(),
            completed_at: String::new(),
            estimate: String::new(),
            goal_metric: GoalMetric::TasksCompleted,
            goal_target: 1,
            goal_progress: 0,
            goal_progress_by_date: HashMap::new(),
            goal_period: GoalPeriod::Weekly,
            goal_tracking_mode: GoalTrackingMode::Automatic,
            goal_scope: None,
        }));
    }

    if tasks_file.exists() {
        let content = fs::read_to_string(&tasks_file).map_err(|error| {
            format!(
                "Failed to read task storage at {}: {}",
                tasks_file.display(),
                error
            )
        })?;
        let tasks = serde_json::from_str::<Vec<TaskItem>>(&content).map_err(|error| {
            format!(
                "Failed to parse task storage at {}: {}",
                tasks_file.display(),
                error
            )
        })?;

        items.extend(tasks.into_iter().map(|task| Item {
            id: task.id,
            kind: "task".into(),
            state: "active".into(),
            source_type: "manual".into(),
            title: task.title,
            content: task.notes,
            created_at: task.created_at,
            updated_at: String::new(),
            tags: task.tags,
            project: task.project,
            task_status: task.status,
            priority: task.priority,
            due_date: task.due_date,
            completed_at: String::new(),
            estimate: task.estimate,
            goal_metric: GoalMetric::TasksCompleted,
            goal_target: 1,
            goal_progress: 0,
            goal_progress_by_date: HashMap::new(),
            goal_period: GoalPeriod::Weekly,
            goal_tracking_mode: GoalTrackingMode::Automatic,
            goal_scope: None,
        }));
    }

    if goals_file.exists() {
        let content = fs::read_to_string(&goals_file).map_err(|error| {
            format!(
                "Failed to read goal storage at {}: {}",
                goals_file.display(),
                error
            )
        })?;
        let goals = serde_json::from_str::<Vec<GoalItem>>(&content).map_err(|error| {
            format!(
                "Failed to parse goal storage at {}: {}",
                goals_file.display(),
                error
            )
        })?;

        items.extend(goals.into_iter().map(normalize_goal_item).map(|goal| Item {
            id: goal.id,
            kind: "goal".into(),
            state: if matches!(goal.status, GoalStatus::Archived) {
                "archived".into()
            } else {
                "active".into()
            },
            source_type: "manual".into(),
            title: goal.title,
            content: goal.description.unwrap_or_default(),
            created_at: goal.created_at,
            updated_at: String::new(),
            tags: Vec::new(),
            project: String::new(),
            task_status: "inbox".into(),
            priority: String::new(),
            due_date: String::new(),
            completed_at: String::new(),
            estimate: String::new(),
            goal_metric: goal.metric,
            goal_target: goal.target,
            goal_progress: 0,
            goal_progress_by_date: HashMap::new(),
            goal_period: goal.period,
            goal_tracking_mode: goal.tracking_mode,
            goal_scope: goal.scope,
        }));
    }

    Ok(items)
}

#[tauri::command]
fn load_profile(path: &str) -> Result<Option<UserProfile>, String> {
    let resolved = expand_home(path.trim())?;
    let profile_file = resolved.join(".profile").join("profile.json");

    if !profile_file.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&profile_file).map_err(|error| {
        format!(
            "Failed to read profile storage at {}: {}",
            profile_file.display(),
            error
        )
    })?;

    serde_json::from_str::<UserProfile>(&content)
        .map(Some)
        .map_err(|error| {
            format!(
                "Failed to parse profile storage at {}: {}",
                profile_file.display(),
                error
            )
        })
}

#[tauri::command]
fn save_profile(path: &str, profile: UserProfile) -> Result<(), String> {
    let resolved = expand_home(path.trim())?;
    let profile_file = resolved.join(".profile").join("profile.json");
    let serialized = serde_json::to_string_pretty(&profile)
        .map_err(|error| format!("Failed to serialize profile: {}", error))?;

    fs::write(&profile_file, serialized).map_err(|error| {
        format!(
            "Failed to write profile storage at {}: {}",
            profile_file.display(),
            error
        )
    })
}

#[tauri::command]
fn load_projects(path: &str) -> Result<Vec<Project>, String> {
    let resolved = expand_home(path.trim())?;
    let projects_dir = resolved.join(".projects");
    let projects_file = resolved.join(".projects").join("projects.json");

    if !projects_dir.exists() {
        fs::create_dir_all(&projects_dir).map_err(|error| {
            format!(
                "Failed to initialize .projects directory at {}: {}",
                projects_dir.display(),
                error
            )
        })?;
    }

    if !projects_file.exists() {
        fs::write(&projects_file, "[]").map_err(|error| {
            format!(
                "Failed to initialize project storage at {}: {}",
                projects_file.display(),
                error
            )
        })?;
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&projects_file).map_err(|error| {
        format!(
            "Failed to read project storage at {}: {}",
            projects_file.display(),
            error
        )
    })?;

    serde_json::from_str::<Vec<Project>>(&content).map_err(|error| {
        format!(
            "Failed to parse project storage at {}: {}",
            projects_file.display(),
            error
        )
    })
}

#[tauri::command]
fn save_projects(path: &str, projects: Vec<Project>) -> Result<(), String> {
    let resolved = expand_home(path.trim())?;
    let projects_dir = resolved.join(".projects");
    let projects_file = resolved.join(".projects").join("projects.json");

    if !projects_dir.exists() {
        fs::create_dir_all(&projects_dir).map_err(|error| {
            format!(
                "Failed to initialize .projects directory at {}: {}",
                projects_dir.display(),
                error
            )
        })?;
    }

    let serialized = serde_json::to_string_pretty(&projects)
        .map_err(|error| format!("Failed to serialize projects: {}", error))?;

    fs::write(&projects_file, serialized).map_err(|error| {
        format!(
            "Failed to write project storage at {}: {}",
            projects_file.display(),
            error
        )
    })
}

fn expand_home(input: &str) -> Result<PathBuf, String> {
    if input == "~" {
        return home_dir();
    }

    if let Some(stripped) = input.strip_prefix("~/") {
        return home_dir().map(|home| home.join(stripped));
    }

    Ok(Path::new(input).to_path_buf())
}

fn home_dir() -> Result<PathBuf, String> {
    env::var_os("HOME")
        .map(PathBuf::from)
        .ok_or_else(|| "Could not resolve the home directory for '~' expansion.".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            initialize_vault,
            load_inbox_items,
            save_inbox_items,
            load_items,
            save_items,
            load_journal_entry,
            save_journal_entry,
            list_journal_entries,
            load_profile,
            save_profile,
            load_projects,
            save_projects
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
