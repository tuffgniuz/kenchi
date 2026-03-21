use crate::application::vault::open_database_from_input;
use crate::persistence::project_repository::ProjectRepository;
use crate::transport::project::{project_dto_from_model, project_from_dto, ProjectDto};

#[tauri::command]
pub fn load_projects(path: &str) -> Result<Vec<ProjectDto>, String> {
    let db = open_database_from_input(path)?;
    ProjectRepository::new(&db)
        .list()
        .map(|projects| projects.into_iter().map(project_dto_from_model).collect())
}

#[tauri::command]
pub fn save_projects(path: &str, projects: Vec<ProjectDto>) -> Result<(), String> {
    let db = open_database_from_input(path)?;
    let repository = ProjectRepository::new(&db);
    repository.replace_all(projects.into_iter().map(project_from_dto).collect())
}
