use crate::persistence::database::Database;
use crate::persistence::models::Relationship;
use rusqlite::params;

pub struct RelationshipRepository<'a> {
    db: &'a Database,
}

impl<'a> RelationshipRepository<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn create(&self, relationship: Relationship) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "
                INSERT INTO relationships (
                    id, from_entity_type, from_entity_id, to_entity_type, to_entity_id, relation_type, created_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                ",
                params![
                    relationship.id,
                    relationship.from_entity_type,
                    relationship.from_entity_id,
                    relationship.to_entity_type,
                    relationship.to_entity_id,
                    relationship.relation_type,
                    relationship.created_at
                ],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    pub fn list_for_entity(&self, entity_type: &str, entity_id: &str) -> Result<Vec<Relationship>, String> {
        let mut statement = self
            .db
            .connection()
            .prepare(
                "
                SELECT id, from_entity_type, from_entity_id, to_entity_type, to_entity_id, relation_type, created_at
                FROM relationships
                WHERE (from_entity_type = ?1 AND from_entity_id = ?2)
                   OR (to_entity_type = ?1 AND to_entity_id = ?2)
                ORDER BY created_at ASC
                ",
            )
            .map_err(|error| error.to_string())?;

        let rows = statement
            .query_map(params![entity_type, entity_id], |row| {
                Ok(Relationship {
                    id: row.get(0)?,
                    from_entity_type: row.get(1)?,
                    from_entity_id: row.get(2)?,
                    to_entity_type: row.get(3)?,
                    to_entity_id: row.get(4)?,
                    relation_type: row.get(5)?,
                    created_at: row.get(6)?,
                })
            })
            .map_err(|error| error.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }
}
