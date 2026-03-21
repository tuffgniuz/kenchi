use crate::persistence::database::Database;
use crate::persistence::models::{
    JournalCommitment, JournalCommitmentStatus, JournalEntry, JournalEntrySummary,
};
use crate::persistence::support::{decode_enum, encode_enum, option_string, preview, to_sql_error};
use rusqlite::{params, OptionalExtension};

pub struct JournalRepository<'a> {
    db: &'a Database,
}

impl<'a> JournalRepository<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn upsert_entry(&self, entry: JournalEntry) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "
                INSERT INTO journal_entries (
                    id, entry_date, title, content_markdown, morning_intention, reflection_prompt, created_at, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                ON CONFLICT(id) DO UPDATE SET
                    entry_date = excluded.entry_date,
                    title = excluded.title,
                    content_markdown = excluded.content_markdown,
                    morning_intention = excluded.morning_intention,
                    reflection_prompt = excluded.reflection_prompt,
                    created_at = excluded.created_at,
                    updated_at = excluded.updated_at
                ",
                params![
                    entry.id,
                    entry.entry_date,
                    entry.title,
                    entry.content_markdown,
                    entry.morning_intention,
                    entry.reflection_prompt,
                    entry.created_at,
                    entry.updated_at
                ],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    pub fn get_entry(&self, entry_date: &str) -> Result<Option<JournalEntry>, String> {
        self.db
            .connection()
            .query_row(
                "
                SELECT id, entry_date, title, content_markdown, morning_intention, reflection_prompt, created_at, updated_at
                FROM journal_entries
                WHERE entry_date = ?1
                ",
                params![entry_date],
                |row| {
                    Ok(JournalEntry {
                        id: row.get(0)?,
                        entry_date: row.get(1)?,
                        title: option_string(row, 2)?,
                        content_markdown: option_string(row, 3)?,
                        morning_intention: option_string(row, 4)?,
                        reflection_prompt: option_string(row, 5)?,
                        created_at: row.get(6)?,
                        updated_at: row.get(7)?,
                    })
                },
            )
            .optional()
            .map_err(|error| error.to_string())
    }

    pub fn list_entries(&self) -> Result<Vec<JournalEntrySummary>, String> {
        let mut statement = self
            .db
            .connection()
            .prepare(
                "
                SELECT entry_date, title, content_markdown, reflection_prompt, morning_intention
                FROM journal_entries
                ORDER BY entry_date DESC
                ",
            )
            .map_err(|error| error.to_string())?;

        let rows = statement
            .query_map([], |row| {
                let content_markdown: Option<String> = option_string(row, 2)?;
                let reflection_prompt: Option<String> = option_string(row, 3)?;
                let morning_intention: Option<String> = option_string(row, 4)?;
                Ok(JournalEntrySummary {
                    entry_date: row.get(0)?,
                    title: option_string(row, 1)?,
                    preview: preview(content_markdown.or(reflection_prompt).or(morning_intention)),
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn replace_commitments(
        &self,
        journal_entry_id: &str,
        commitments: Vec<JournalCommitment>,
    ) -> Result<(), String> {
        let transaction = self
            .db
            .connection()
            .unchecked_transaction()
            .map_err(|error| error.to_string())?;

        transaction
            .execute(
                "DELETE FROM journal_commitments WHERE journal_entry_id = ?1",
                params![journal_entry_id],
            )
            .map_err(|error| error.to_string())?;

        for commitment in commitments {
            transaction
                .execute(
                    "
                    INSERT INTO journal_commitments (id, journal_entry_id, text, status, sort_order)
                    VALUES (?1, ?2, ?3, ?4, ?5)
                    ",
                    params![
                        commitment.id,
                        commitment.journal_entry_id,
                        commitment.text,
                        encode_enum(&commitment.status)?,
                        commitment.sort_order
                    ],
                )
                .map_err(|error| error.to_string())?;
        }

        transaction.commit().map_err(|error| error.to_string())
    }

    pub fn list_commitments(&self, journal_entry_id: &str) -> Result<Vec<JournalCommitment>, String> {
        let mut statement = self
            .db
            .connection()
            .prepare(
                "
                SELECT id, journal_entry_id, text, status, sort_order
                FROM journal_commitments
                WHERE journal_entry_id = ?1
                ORDER BY sort_order ASC
                ",
            )
            .map_err(|error| error.to_string())?;

        let rows = statement
            .query_map(params![journal_entry_id], |row| {
                Ok(JournalCommitment {
                    id: row.get(0)?,
                    journal_entry_id: row.get(1)?,
                    text: row.get(2)?,
                    status: decode_enum::<JournalCommitmentStatus>(row.get(3)?)
                        .map_err(to_sql_error)?,
                    sort_order: row.get(4)?,
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }
}
