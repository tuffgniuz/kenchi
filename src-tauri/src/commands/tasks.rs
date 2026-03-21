use crate::application::vault::open_database_from_input;
use crate::persistence::models::{Task, TaskQuery};
use crate::persistence::task_repository::TaskRepository;

#[tauri::command]
pub fn list_tasks(path: &str) -> Result<Vec<Task>, String> {
    let db = open_database_from_input(path)?;
    TaskRepository::new(&db).list(TaskQuery::default())
}

#[tauri::command]
pub fn create_task(path: &str, task: Task) -> Result<Task, String> {
    let db = open_database_from_input(path)?;
    TaskRepository::new(&db).create(task.clone())?;
    Ok(task)
}

#[tauri::command]
pub fn update_task(path: &str, task: Task) -> Result<Task, String> {
    let db = open_database_from_input(path)?;
    TaskRepository::new(&db).update(task.clone())?;
    Ok(task)
}
