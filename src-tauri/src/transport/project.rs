use crate::persistence::models::{Project, ProjectBoardLane, ProjectStatus};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectDto {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(default)]
    pub board_lanes: Vec<ProjectBoardLaneDto>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectBoardLaneDto {
    pub id: String,
    pub name: String,
    pub order: i64,
}

pub fn project_dto_from_model(project: Project) -> ProjectDto {
    ProjectDto {
        id: project.id,
        name: project.name,
        description: project.description.unwrap_or_default(),
        board_lanes: project
            .board_lanes
            .into_iter()
            .map(|lane| ProjectBoardLaneDto {
                id: lane.id,
                name: lane.name,
                order: lane.order,
            })
            .collect(),
        created_at: project.created_at,
        updated_at: project.updated_at,
    }
}

pub fn project_from_dto(project: ProjectDto) -> Project {
    Project {
        id: project.id,
        name: project.name,
        description: empty_string_to_none(project.description),
        status: ProjectStatus::Active,
        board_lanes: project
            .board_lanes
            .into_iter()
            .map(|lane| ProjectBoardLane {
                id: lane.id,
                name: lane.name,
                order: lane.order,
            })
            .collect(),
        created_at: project.created_at,
        updated_at: project.updated_at,
    }
}

fn empty_string_to_none(value: String) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}
