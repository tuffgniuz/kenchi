use crate::application::vault::open_database_from_input;
use crate::application::workspace::{load_workspace_items_from_db, replace_workspace_items_in_db};
use crate::transport::workspace::WorkspaceItemDto;

#[tauri::command]
pub fn load_workspace_items(path: &str) -> Result<Vec<WorkspaceItemDto>, String> {
    let db = open_database_from_input(path)?;
    load_workspace_items_from_db(&db)
}

#[tauri::command]
pub fn replace_workspace_items(path: &str, items: Vec<WorkspaceItemDto>) -> Result<(), String> {
    let db = open_database_from_input(path)?;
    replace_workspace_items_in_db(&db, items)
}
