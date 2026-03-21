use crate::application::journal::{
    journal_entry_dto_from_models, journal_entry_summary_dto_from_model, journal_models_from_dto,
};
use crate::application::vault::open_database_from_input;
use crate::persistence::journal_repository::JournalRepository;
use crate::transport::journal::{JournalEntryDto, JournalEntrySummaryDto};

#[tauri::command]
pub fn load_journal_entry(path: &str, date: &str) -> Result<Option<JournalEntryDto>, String> {
    let db = open_database_from_input(path)?;
    let repository = JournalRepository::new(&db);
    let entry = repository.get_entry(date)?;

    match entry {
        Some(entry) => {
            let commitments = repository.list_commitments(&entry.id)?;
            Ok(Some(journal_entry_dto_from_models(entry, commitments)))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn save_journal_entry(path: &str, entry: JournalEntryDto) -> Result<(), String> {
    let db = open_database_from_input(path)?;
    let repository = JournalRepository::new(&db);
    let (journal_entry, commitments) = journal_models_from_dto(entry)?;
    repository.upsert_entry(journal_entry.clone())?;
    repository.replace_commitments(&journal_entry.id, commitments)?;
    Ok(())
}

#[tauri::command]
pub fn list_journal_entries(path: &str) -> Result<Vec<JournalEntrySummaryDto>, String> {
    let db = open_database_from_input(path)?;
    JournalRepository::new(&db)
        .list_entries()
        .map(|entries| entries.into_iter().map(journal_entry_summary_dto_from_model).collect())
}
