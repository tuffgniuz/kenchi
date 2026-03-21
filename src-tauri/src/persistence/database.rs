use crate::persistence::migrations;
use rusqlite::Connection;
use std::path::Path;

pub struct Database {
    connection: Connection,
}

impl Database {
    #[cfg(test)]
    pub fn in_memory() -> Result<Self, String> {
        let connection = Connection::open_in_memory().map_err(|error| error.to_string())?;
        let database = Self { connection };
        migrations::run_migrations(database.connection())?;
        Ok(database)
    }

    pub fn open(path: &Path) -> Result<Self, String> {
        let connection = Connection::open(path).map_err(|error| error.to_string())?;
        let database = Self { connection };
        migrations::run_migrations(database.connection())?;
        Ok(database)
    }

    pub fn connection(&self) -> &Connection {
        &self.connection
    }
}
