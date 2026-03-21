use crate::persistence::database::Database;
use crate::persistence::models::{Goal, GoalProgressEntry, GoalStatus, GoalTrackingMode, GoalType};
use crate::persistence::support::{decode_enum, encode_enum, option_string, to_sql_error};
use rusqlite::params;

#[cfg(test)]
use rusqlite::OptionalExtension;

pub struct GoalRepository<'a> {
    db: &'a Database,
}

impl<'a> GoalRepository<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(&self, goal: Goal) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "
                INSERT INTO goals (
                    id, title, description, goal_type, status, tracking_mode, metric, target_value, current_value,
                    period_unit, period_start, period_end, starts_at, ends_at, scope_project_id, scope_tag, source_query,
                    created_at, updated_at, archived_at, completed_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)
                ",
                params![
                    goal.id,
                    goal.title,
                    goal.description,
                    encode_enum(&goal.goal_type)?,
                    encode_enum(&goal.status)?,
                    encode_enum(&goal.tracking_mode)?,
                    goal.metric,
                    goal.target_value,
                    goal.current_value,
                    goal.period_unit,
                    goal.period_start,
                    goal.period_end,
                    goal.starts_at,
                    goal.ends_at,
                    goal.scope_project_id,
                    goal.scope_tag,
                    goal.source_query,
                    goal.created_at,
                    goal.updated_at,
                    goal.archived_at,
                    goal.completed_at
                ],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    pub fn update(&self, goal: Goal) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "
                UPDATE goals
                SET title = ?2, description = ?3, goal_type = ?4, status = ?5, tracking_mode = ?6,
                    metric = ?7, target_value = ?8, current_value = ?9, period_unit = ?10, period_start = ?11,
                    period_end = ?12, starts_at = ?13, ends_at = ?14, scope_project_id = ?15, scope_tag = ?16, source_query = ?17,
                    created_at = ?18, updated_at = ?19, archived_at = ?20, completed_at = ?21
                WHERE id = ?1
                ",
                params![
                    goal.id,
                    goal.title,
                    goal.description,
                    encode_enum(&goal.goal_type)?,
                    encode_enum(&goal.status)?,
                    encode_enum(&goal.tracking_mode)?,
                    goal.metric,
                    goal.target_value,
                    goal.current_value,
                    goal.period_unit,
                    goal.period_start,
                    goal.period_end,
                    goal.starts_at,
                    goal.ends_at,
                    goal.scope_project_id,
                    goal.scope_tag,
                    goal.source_query,
                    goal.created_at,
                    goal.updated_at,
                    goal.archived_at,
                    goal.completed_at
                ],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    #[cfg(test)]
    pub fn get(&self, id: &str) -> Result<Option<Goal>, String> {
        self.db
            .connection()
            .query_row(
                "
                SELECT id, title, description, goal_type, status, tracking_mode, metric, target_value, current_value,
                       period_unit, period_start, period_end, starts_at, ends_at, scope_project_id, scope_tag, source_query,
                       created_at, updated_at, archived_at, completed_at
                FROM goals
                WHERE id = ?1
                ",
                params![id],
                map_goal,
            )
            .optional()
            .map_err(|error| error.to_string())
    }

    pub fn list(&self) -> Result<Vec<Goal>, String> {
        let mut statement = self
            .db
            .connection()
            .prepare(
                "
                SELECT id, title, description, goal_type, status, tracking_mode, metric, target_value, current_value,
                       period_unit, period_start, period_end, starts_at, ends_at, scope_project_id, scope_tag, source_query,
                       created_at, updated_at, archived_at, completed_at
                FROM goals
                ORDER BY created_at DESC
                ",
            )
            .map_err(|error| error.to_string())?;

        let rows = statement
            .query_map([], map_goal)
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn log_progress(&self, entry: GoalProgressEntry) -> Result<(), String> {
        let transaction = self
            .db
            .connection()
            .unchecked_transaction()
            .map_err(|error| error.to_string())?;

        transaction
            .execute(
                "
                INSERT INTO goal_progress_entries (
                    id, goal_id, date, value, source_type, source_entity_type, source_entity_id, created_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                ",
                params![
                    entry.id,
                    entry.goal_id,
                    entry.date,
                    entry.value,
                    entry.source_type,
                    entry.source_entity_type,
                    entry.source_entity_id,
                    entry.created_at
                ],
            )
            .map_err(|error| error.to_string())?;

        transaction
            .execute(
                "UPDATE goals SET current_value = ?2 WHERE id = ?1",
                params![entry.goal_id, entry.value],
            )
            .map_err(|error| error.to_string())?;

        transaction.commit().map_err(|error| error.to_string())
    }

    pub fn list_progress_entries(&self, goal_id: &str) -> Result<Vec<GoalProgressEntry>, String> {
        let mut statement = self
            .db
            .connection()
            .prepare(
                "
                SELECT id, goal_id, date, value, source_type, source_entity_type, source_entity_id, created_at
                FROM goal_progress_entries
                WHERE goal_id = ?1
                ORDER BY date ASC, created_at ASC
                ",
            )
            .map_err(|error| error.to_string())?;

        let rows = statement
            .query_map(params![goal_id], |row| {
                Ok(GoalProgressEntry {
                    id: row.get(0)?,
                    goal_id: row.get(1)?,
                    date: row.get(2)?,
                    value: row.get(3)?,
                    source_type: option_string(row, 4)?,
                    source_entity_type: option_string(row, 5)?,
                    source_entity_id: option_string(row, 6)?,
                    created_at: row.get(7)?,
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn replace_all(&self, goals: Vec<Goal>) -> Result<(), String> {
        self.db
            .connection()
            .execute("DELETE FROM goal_progress_entries", [])
            .map_err(|error| error.to_string())?;
        self.db
            .connection()
            .execute("DELETE FROM goals", [])
            .map_err(|error| error.to_string())?;

        for goal in goals {
            self.create(goal)?;
        }

        Ok(())
    }
}

fn map_goal(row: &rusqlite::Row<'_>) -> rusqlite::Result<Goal> {
    Ok(Goal {
        id: row.get(0)?,
        title: row.get(1)?,
        description: option_string(row, 2)?,
        goal_type: decode_enum::<GoalType>(row.get(3)?).map_err(to_sql_error)?,
        status: decode_enum::<GoalStatus>(row.get(4)?).map_err(to_sql_error)?,
        tracking_mode: decode_enum::<GoalTrackingMode>(row.get(5)?).map_err(to_sql_error)?,
        metric: option_string(row, 6)?,
        target_value: row.get(7)?,
        current_value: row.get(8)?,
        period_unit: option_string(row, 9)?,
        period_start: option_string(row, 10)?,
        period_end: option_string(row, 11)?,
        starts_at: option_string(row, 12)?,
        ends_at: option_string(row, 13)?,
        scope_project_id: option_string(row, 14)?,
        scope_tag: option_string(row, 15)?,
        source_query: option_string(row, 16)?,
        created_at: row.get(17)?,
        updated_at: row.get(18)?,
        archived_at: option_string(row, 19)?,
        completed_at: option_string(row, 20)?,
    })
}
