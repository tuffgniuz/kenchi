use crate::persistence::models::UserProfile;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfileDto {
    pub name: String,
    pub profile_picture: String,
}

pub fn user_profile_dto_from_model(profile: UserProfile) -> UserProfileDto {
    UserProfileDto {
        name: profile.name,
        profile_picture: profile.profile_picture.unwrap_or_default(),
    }
}

pub fn user_profile_from_dto(profile: UserProfileDto) -> UserProfile {
    UserProfile {
        id: "user-profile".into(),
        name: profile.name,
        profile_picture: empty_string_to_none(profile.profile_picture),
        created_at: "1970-01-01T00:00:00Z".into(),
        updated_at: "1970-01-01T00:00:00Z".into(),
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
