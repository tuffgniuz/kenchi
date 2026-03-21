use crate::persistence::database::Database;
use crate::persistence::models::{Task, TaskLifecycleStatus, TaskQuery, TaskScheduleBucket};
use crate::persistence::support::{decode_enum, encode_enum, option_string, to_sql_error};
use rusqlite::params;

#[cfg(test)]
use rusqlite::OptionalExtension;

pub struct TaskRepository<'a> {
    db: &'a Database,
}

impl<'a> TaskRepository<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(&self, task: Task) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "
                INSERT INTO tasks (
                    id, title, description, lifecycle_status, is_completed, schedule_bucket,
                    priority, due_at, completed_at, estimate_minutes, project_id, project_lane_id,
                    source_capture_id, created_at, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
                ",
                params![
                    task.id,
                    task.title,
                    task.description,
                    encode_enum(&task.lifecycle_status)?,
                    task.is_completed,
                    encode_enum(&task.schedule_bucket)?,
                    task.priority,
                    task.due_at,
                    task.completed_at,
                    task.estimate_minutes,
                    task.project_id,
                    task.project_lane_id,
                    task.source_capture_id,
                    task.created_at,
                    task.updated_at
                ],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    pub fn update(&self, task: Task) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "
                UPDATE tasks
                SET title = ?2,
                    description = ?3,
                    lifecycle_status = ?4,
                    is_completed = ?5,
                    schedule_bucket = ?6,
                    priority = ?7,
                    due_at = ?8,
                    completed_at = ?9,
                    estimate_minutes = ?10,
                    project_id = ?11,
                    project_lane_id = ?12,
                    source_capture_id = ?13,
                    created_at = ?14,
                    updated_at = ?15
                WHERE id = ?1
                ",
                params![
                    task.id,
                    task.title,
                    task.description,
                    encode_enum(&task.lifecycle_status)?,
                    task.is_completed,
                    encode_enum(&task.schedule_bucket)?,
                    task.priority,
                    task.due_at,
                    task.completed_at,
                    task.estimate_minutes,
                    task.project_id,
                    task.project_lane_id,
                    task.source_capture_id,
                    task.created_at,
                    task.updated_at
                ],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    #[cfg(test)]
    pub fn get(&self, id: &str) -> Result<Option<Task>, String> {
        self.db
            .connection()
            .query_row(
                "
                SELECT id, title, description, lifecycle_status, is_completed, schedule_bucket, priority,
                       due_at, completed_at, estimate_minutes, project_id, project_lane_id, source_capture_id, created_at, updated_at
                FROM tasks
                WHERE id = ?1
                ",
                params![id],
                map_task,
            )
            .optional()
            .map_err(|error| error.to_string())
    }

    pub fn list(&self, query: TaskQuery) -> Result<Vec<Task>, String> {
        let mut statement = self
            .db
            .connection()
            .prepare(
                "
                SELECT id, title, description, lifecycle_status, is_completed, schedule_bucket, priority,
                       due_at, completed_at, estimate_minutes, project_id, project_lane_id, source_capture_id, created_at, updated_at
                FROM tasks
                WHERE (?1 IS NULL OR lifecycle_status = ?1)
                  AND (?2 IS NULL OR is_completed = ?2)
                  AND (?3 IS NULL OR schedule_bucket = ?3)
                  AND (?4 IS NULL OR project_id = ?4)
                ORDER BY created_at DESC
                ",
            )
            .map_err(|error| error.to_string())?;

        let lifecycle_status = query
            .lifecycle_status
            .as_ref()
            .map(encode_enum)
            .transpose()?;
        let schedule_bucket = query
            .schedule_bucket
            .as_ref()
            .map(encode_enum)
            .transpose()?;

        let rows = statement
            .query_map(
                params![
                    lifecycle_status,
                    query.is_completed,
                    schedule_bucket,
                    query.project_id
                ],
                map_task,
            )
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn replace_all(&self, tasks: Vec<Task>) -> Result<(), String> {
        self.db
            .connection()
            .execute("DELETE FROM tasks", [])
            .map_err(|error| error.to_string())?;

        for task in tasks {
            self.create(task)?;
        }

        Ok(())
    }
}

fn map_task(row: &rusqlite::Row<'_>) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get(0)?,
        title: row.get(1)?,
        description: option_string(row, 2)?,
        lifecycle_status: decode_enum::<TaskLifecycleStatus>(row.get(3)?).map_err(to_sql_error)?,
        is_completed: row.get(4)?,
        schedule_bucket: decode_enum::<TaskScheduleBucket>(row.get(5)?).map_err(to_sql_error)?,
        priority: row.get(6)?,
        due_at: option_string(row, 7)?,
        completed_at: option_string(row, 8)?,
        estimate_minutes: row.get(9)?,
        project_id: option_string(row, 10)?,
        project_lane_id: option_string(row, 11)?,
        source_capture_id: option_string(row, 12)?,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
    })
}
