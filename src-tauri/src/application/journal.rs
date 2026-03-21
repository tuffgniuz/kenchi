use crate::persistence::models::{
    JournalCommitment, JournalCommitmentStatus, JournalEntry, JournalEntrySummary,
};
use crate::transport::journal::{
    JournalCommitmentDto, JournalEntryDto, JournalEntrySummaryDto, JournalReflectionDto,
};

pub fn journal_entry_dto_from_models(
    entry: JournalEntry,
    commitments: Vec<JournalCommitment>,
) -> JournalEntryDto {
    let sections = parse_journal_markdown(entry.content_markdown.as_deref().unwrap_or_default());

    JournalEntryDto {
        id: entry.id,
        date: entry.entry_date,
        morning_intention: entry.morning_intention.unwrap_or_default(),
        diary_entry: sections.diary_entry,
        reflection_entry: sections.reflection_entry,
        focuses: sections.focuses,
        commitments: commitments
            .into_iter()
            .map(|commitment| JournalCommitmentDto {
                id: commitment.id,
                text: commitment.text,
                status: match commitment.status {
                    JournalCommitmentStatus::Open => "unmarked".into(),
                    JournalCommitmentStatus::Missed => "missed".into(),
                    JournalCommitmentStatus::Partial => "partial".into(),
                    JournalCommitmentStatus::Done => "done".into(),
                },
                order: commitment.sort_order,
            })
            .collect(),
        reflection: JournalReflectionDto {
            went_well: sections.went_well,
            didnt_go_well: sections.didnt_go_well,
            learned: sections.learned,
            gratitude: sections.gratitude,
        },
        created_at: entry.created_at,
        updated_at: entry.updated_at,
    }
}

pub fn journal_models_from_dto(
    entry: JournalEntryDto,
) -> Result<(JournalEntry, Vec<JournalCommitment>), String> {
    let content_markdown = render_journal_markdown(&entry);
    let commitments = entry
        .commitments
        .into_iter()
        .map(|commitment| {
            Ok(JournalCommitment {
                id: commitment.id,
                journal_entry_id: entry.id.clone(),
                text: commitment.text,
                status: match commitment.status.as_str() {
                    "missed" => JournalCommitmentStatus::Missed,
                    "partial" => JournalCommitmentStatus::Partial,
                    "done" => JournalCommitmentStatus::Done,
                    _ => JournalCommitmentStatus::Open,
                },
                sort_order: commitment.order,
            })
        })
        .collect::<Result<Vec<_>, String>>()?;

    Ok((
        JournalEntry {
            id: entry.id,
            entry_date: entry.date,
            title: None,
            content_markdown: Some(content_markdown),
            morning_intention: empty_string_to_none(entry.morning_intention),
            reflection_prompt: empty_string_to_none(entry.reflection_entry),
            created_at: entry.created_at,
            updated_at: entry.updated_at,
        },
        commitments,
    ))
}

pub fn journal_entry_summary_dto_from_model(summary: JournalEntrySummary) -> JournalEntrySummaryDto {
    JournalEntrySummaryDto {
        date: summary.entry_date,
        preview: summary.preview,
    }
}

struct ParsedJournalSections {
    diary_entry: String,
    reflection_entry: String,
    focuses: Vec<String>,
    went_well: String,
    didnt_go_well: String,
    learned: String,
    gratitude: String,
}

fn parse_journal_markdown(markdown: &str) -> ParsedJournalSections {
    let mut current = "";
    let mut diary_entry = String::new();
    let mut reflection_entry = String::new();
    let mut focuses = Vec::new();
    let mut went_well = String::new();
    let mut didnt_go_well = String::new();
    let mut learned = String::new();
    let mut gratitude = String::new();

    for line in markdown.lines() {
        match line {
            "## Diary" => current = "diary",
            "## Reflection Entry" => current = "reflection_entry",
            "## Focuses" => current = "focuses",
            "## Went Well" => current = "went_well",
            "## Didn't Go Well" => current = "didnt_go_well",
            "## Learned" => current = "learned",
            "## Gratitude" => current = "gratitude",
            _ => match current {
                "diary" => push_markdown_line(&mut diary_entry, line),
                "reflection_entry" => push_markdown_line(&mut reflection_entry, line),
                "focuses" => {
                    if let Some(item) = line.strip_prefix("- ") {
                        focuses.push(item.to_string());
                    }
                }
                "went_well" => push_markdown_line(&mut went_well, line),
                "didnt_go_well" => push_markdown_line(&mut didnt_go_well, line),
                "learned" => push_markdown_line(&mut learned, line),
                "gratitude" => push_markdown_line(&mut gratitude, line),
                _ => {}
            },
        }
    }

    ParsedJournalSections {
        diary_entry,
        reflection_entry,
        focuses,
        went_well,
        didnt_go_well,
        learned,
        gratitude,
    }
}

fn render_journal_markdown(entry: &JournalEntryDto) -> String {
    let mut sections = Vec::new();
    sections.push(render_journal_section("Diary", &entry.diary_entry));
    sections.push(render_journal_section("Reflection Entry", &entry.reflection_entry));
    sections.push(render_journal_focuses(&entry.focuses));
    sections.push(render_journal_section("Went Well", &entry.reflection.went_well));
    sections.push(render_journal_section("Didn't Go Well", &entry.reflection.didnt_go_well));
    sections.push(render_journal_section("Learned", &entry.reflection.learned));
    sections.push(render_journal_section("Gratitude", &entry.reflection.gratitude));
    sections.join("\n\n")
}

fn render_journal_section(title: &str, body: &str) -> String {
    format!("## {}\n{}", title, body)
}

fn render_journal_focuses(focuses: &[String]) -> String {
    let lines = if focuses.is_empty() {
        String::new()
    } else {
        focuses
            .iter()
            .map(|focus| format!("- {}", focus))
            .collect::<Vec<_>>()
            .join("\n")
    };

    format!("## Focuses\n{}", lines)
}

fn push_markdown_line(target: &mut String, line: &str) {
    if !target.is_empty() {
        target.push('\n');
    }
    target.push_str(line);
}

fn empty_string_to_none(value: String) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}
