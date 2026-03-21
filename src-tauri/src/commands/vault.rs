use crate::application::vault;

#[tauri::command]
pub fn initialize_vault(path: &str) -> Result<String, String> {
    vault::initialize_vault(path)
}

#[cfg(test)]
pub fn resolve_vault_path(path: &str) -> Result<std::path::PathBuf, String> {
    vault::resolve_vault_path(path)
}
