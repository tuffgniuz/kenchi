use crate::persistence::database::Database;
use crate::persistence::models::{EntityTag, Tag};
use crate::persistence::support::option_string;
use rusqlite::params;

pub struct TagRepository<'a> {
    db: &'a Database,
}

impl<'a> TagRepository<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(&self, tag: Tag) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "INSERT INTO tags (id, name, color, created_at) VALUES (?1, ?2, ?3, ?4)",
                params![tag.id, tag.name, tag.color, tag.created_at],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    pub fn attach(&self, entity_tag: EntityTag) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "INSERT INTO entity_tags (entity_type, entity_id, tag_id) VALUES (?1, ?2, ?3)",
                params![entity_tag.entity_type, entity_tag.entity_id, entity_tag.tag_id],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    pub fn list_for_entity(&self, entity_type: &str, entity_id: &str) -> Result<Vec<Tag>, String> {
        let mut statement = self
            .db
            .connection()
            .prepare(
                "
                SELECT tags.id, tags.name, tags.color, tags.created_at
                FROM entity_tags
                INNER JOIN tags ON tags.id = entity_tags.tag_id
                WHERE entity_tags.entity_type = ?1 AND entity_tags.entity_id = ?2
                ORDER BY tags.name ASC
                ",
            )
            .map_err(|error| error.to_string())?;

        let rows = statement
            .query_map(params![entity_type, entity_id], |row| {
                Ok(Tag {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: option_string(row, 2)?,
                    created_at: row.get(3)?,
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }
}
