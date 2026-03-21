use crate::application::vault::open_database_from_input;
use crate::persistence::capture_repository::CaptureRepository;
use crate::persistence::models::{Capture, CaptureTriageStatus};

#[tauri::command]
pub fn list_captures(path: &str) -> Result<Vec<Capture>, String> {
    let db = open_database_from_input(path)?;
    CaptureRepository::new(&db).list()
}

#[tauri::command]
pub fn create_capture(path: &str, capture: Capture) -> Result<Capture, String> {
    let db = open_database_from_input(path)?;
    CaptureRepository::new(&db).create(capture.clone())?;
    Ok(capture)
}

#[tauri::command]
pub fn update_capture(path: &str, capture: Capture) -> Result<Capture, String> {
    let db = open_database_from_input(path)?;
    CaptureRepository::new(&db).update(capture.clone())?;
    Ok(capture)
}

#[tauri::command]
pub fn process_capture(path: &str, capture_id: &str, processed_at: &str) -> Result<Capture, String> {
    let db = open_database_from_input(path)?;
    let repository = CaptureRepository::new(&db);
    let capture = repository
        .get(capture_id)?
        .ok_or_else(|| format!("Capture {} was not found.", capture_id))?;
    let updated = Capture {
        triage_status: CaptureTriageStatus::Processed,
        processed_at: Some(processed_at.to_string()),
        ..capture
    };
    repository.update(updated.clone())?;
    Ok(updated)
}
