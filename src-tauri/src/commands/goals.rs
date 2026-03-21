use crate::application::vault::open_database_from_input;
use crate::persistence::goal_repository::GoalRepository;
use crate::persistence::models::{Goal, GoalProgressEntry};

#[tauri::command]
pub fn list_goals(path: &str) -> Result<Vec<Goal>, String> {
    let db = open_database_from_input(path)?;
    GoalRepository::new(&db).list()
}

#[tauri::command]
pub fn create_goal(path: &str, goal: Goal) -> Result<Goal, String> {
    let db = open_database_from_input(path)?;
    GoalRepository::new(&db).create(goal.clone())?;
    Ok(goal)
}

#[tauri::command]
pub fn update_goal(path: &str, goal: Goal) -> Result<Goal, String> {
    let db = open_database_from_input(path)?;
    GoalRepository::new(&db).update(goal.clone())?;
    Ok(goal)
}

#[tauri::command]
pub fn log_goal_progress(path: &str, entry: GoalProgressEntry) -> Result<GoalProgressEntry, String> {
    let db = open_database_from_input(path)?;
    GoalRepository::new(&db).log_progress(entry.clone())?;
    Ok(entry)
}
