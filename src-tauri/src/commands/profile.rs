use crate::application::vault::open_database_from_input;
use crate::persistence::user_profile_repository::UserProfileRepository;
use crate::transport::profile::{user_profile_dto_from_model, user_profile_from_dto, UserProfileDto};

#[tauri::command]
pub fn load_profile(path: &str) -> Result<Option<UserProfileDto>, String> {
    let db = open_database_from_input(path)?;
    Ok(UserProfileRepository::new(&db)
        .get()?
        .map(user_profile_dto_from_model))
}

#[tauri::command]
pub fn save_profile(path: &str, profile: UserProfileDto) -> Result<(), String> {
    let db = open_database_from_input(path)?;
    UserProfileRepository::new(&db).upsert(user_profile_from_dto(profile))
}
