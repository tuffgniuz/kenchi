use crate::persistence::database::Database;
use crate::persistence::models::UserProfile;
use crate::persistence::support::option_string;
use rusqlite::{params, OptionalExtension};

pub struct UserProfileRepository<'a> {
    db: &'a Database,
}

impl<'a> UserProfileRepository<'a> {
    pub fn new(db: &'a Database) -> Self {
        Self { db }
    }

    pub fn upsert(&self, profile: UserProfile) -> Result<(), String> {
        self.db
            .connection()
            .execute(
                "
                INSERT INTO user_profile (id, name, profile_picture, created_at, updated_at)
                VALUES (?1, ?2, ?3, ?4, ?5)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    profile_picture = excluded.profile_picture,
                    created_at = excluded.created_at,
                    updated_at = excluded.updated_at
                ",
                params![
                    profile.id,
                    profile.name,
                    profile.profile_picture,
                    profile.created_at,
                    profile.updated_at
                ],
            )
            .map(|_| ())
            .map_err(|error| error.to_string())
    }

    pub fn get(&self) -> Result<Option<UserProfile>, String> {
        self.db
            .connection()
            .query_row(
                "
                SELECT id, name, profile_picture, created_at, updated_at
                FROM user_profile
                LIMIT 1
                ",
                [],
                |row| {
                    Ok(UserProfile {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        profile_picture: option_string(row, 2)?,
                        created_at: row.get(3)?,
                        updated_at: row.get(4)?,
                    })
                },
            )
            .optional()
            .map_err(|error| error.to_string())
    }
}
