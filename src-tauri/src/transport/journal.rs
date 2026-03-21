use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntryDto {
    pub id: String,
    pub date: String,
    pub morning_intention: String,
    pub diary_entry: String,
    pub reflection_entry: String,
    pub focuses: Vec<String>,
    pub commitments: Vec<JournalCommitmentDto>,
    pub reflection: JournalReflectionDto,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalCommitmentDto {
    pub id: String,
    pub text: String,
    pub status: String,
    pub order: i64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct JournalReflectionDto {
    pub went_well: String,
    pub didnt_go_well: String,
    pub learned: String,
    pub gratitude: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JournalEntrySummaryDto {
    pub date: String,
    pub preview: String,
}
