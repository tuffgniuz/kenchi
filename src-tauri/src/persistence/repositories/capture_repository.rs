use crate::persistence::database::Database;
use crate::persistence::models::{Capture, CaptureLifecycleStatus, CaptureTriageStatus};
use crate::persistence::support::{decode_enum, encode_enum, option_string, to_sql_error};
use rusqlite::{params, OptionalExtension};

pub struct CaptureRepository<'a> {
    db: &'a Database,
}

impl<'a> CaptureRepository<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(&self, capture: Capture) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "
                INSERT INTO captures (
                    id, text, lifecycle_status, triage_status, project_id, created_at, updated_at, processed_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                ",
                params![
                    capture.id,
                    capture.text,
                    encode_enum(&capture.lifecycle_status)?,
                    encode_enum(&capture.triage_status)?,
                    capture.project_id,
                    capture.created_at,
                    capture.updated_at,
                    capture.processed_at
                ],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    pub fn update(&self, capture: Capture) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "
                UPDATE captures
                SET text = ?2,
                    lifecycle_status = ?3,
                    triage_status = ?4,
                    project_id = ?5,
                    created_at = ?6,
                    updated_at = ?7,
                    processed_at = ?8
                WHERE id = ?1
                ",
                params![
                    capture.id,
                    capture.text,
                    encode_enum(&capture.lifecycle_status)?,
                    encode_enum(&capture.triage_status)?,
                    capture.project_id,
                    capture.created_at,
                    capture.updated_at,
                    capture.processed_at
                ],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    pub fn get(&self, id: &str) -> Result<Option<Capture>, String> {
        self.db
            .connection()
            .query_row(
                "
                SELECT id, text, lifecycle_status, triage_status, project_id, created_at, updated_at, processed_at
                FROM captures
                WHERE id = ?1
                ",
                params![id],
                |row| {
                    Ok(Capture {
                        id: row.get(0)?,
                        text: row.get(1)?,
                        lifecycle_status: decode_enum::<CaptureLifecycleStatus>(row.get(2)?)
                            .map_err(to_sql_error)?,
                        triage_status: decode_enum::<CaptureTriageStatus>(row.get(3)?)
                            .map_err(to_sql_error)?,
                        project_id: option_string(row, 4)?,
                        created_at: row.get(5)?,
                        updated_at: row.get(6)?,
                        processed_at: option_string(row, 7)?,
                    })
                },
            )
            .optional()
            .map_err(|error| error.to_string())
    }

    pub fn list(&self) -> Result<Vec<Capture>, String> {
        let mut statement = self
            .db
            .connection()
            .prepare(
                "
                SELECT id, text, lifecycle_status, triage_status, project_id, created_at, updated_at, processed_at
                FROM captures
                ORDER BY created_at DESC
                ",
            )
            .map_err(|error| error.to_string())?;

        let rows = statement
            .query_map([], |row| {
                Ok(Capture {
                    id: row.get(0)?,
                    text: row.get(1)?,
                    lifecycle_status: decode_enum::<CaptureLifecycleStatus>(row.get(2)?)
                        .map_err(to_sql_error)?,
                    triage_status: decode_enum::<CaptureTriageStatus>(row.get(3)?)
                        .map_err(to_sql_error)?,
                    project_id: option_string(row, 4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                    processed_at: option_string(row, 7)?,
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn replace_all(&self, captures: Vec<Capture>) -> Result<(), String> {
        self.db
            .connection()
            .execute("DELETE FROM captures", [])
            .map_err(|error| error.to_string())?;

        for capture in captures {
            self.create(capture)?;
        }

        Ok(())
    }
}
