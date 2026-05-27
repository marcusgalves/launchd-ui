use crate::error::AppError;
use crate::types::JobMetadata;
use std::collections::HashMap;
use std::path::PathBuf;

fn metadata_path() -> Result<PathBuf, AppError> {
    let base = dirs::data_dir()
        .or_else(dirs::home_dir)
        .ok_or_else(|| AppError::Launchctl("could not determine data directory".to_string()))?;
    Ok(base.join("launchd-ui").join("metadata.json"))
}

fn normalize_tags(tags: Vec<String>) -> Vec<String> {
    let mut normalized = Vec::new();
    for tag in tags {
        let tag = tag.trim();
        if tag.is_empty() || normalized.iter().any(|existing| existing == tag) {
            continue;
        }
        normalized.push(tag.to_string());
    }
    normalized
}

pub fn load_all() -> HashMap<String, JobMetadata> {
    let Ok(path) = metadata_path() else {
        return HashMap::new();
    };
    let Ok(content) = std::fs::read_to_string(path) else {
        return HashMap::new();
    };
    serde_json::from_str(&content).unwrap_or_default()
}

pub fn get_for_path(plist_path: &str) -> JobMetadata {
    load_all().remove(plist_path).unwrap_or_default()
}

pub fn save_for_path(plist_path: &str, metadata: JobMetadata) -> Result<JobMetadata, AppError> {
    let path = metadata_path()?;
    let mut all = load_all();
    let metadata = JobMetadata {
        description: metadata.description.trim().to_string(),
        tags: normalize_tags(metadata.tags),
    };

    if metadata.description.is_empty() && metadata.tags.is_empty() {
        all.remove(plist_path);
    } else {
        all.insert(plist_path.to_string(), metadata.clone());
    }

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let content = serde_json::to_string_pretty(&all)
        .map_err(|e| AppError::Plist(format!("failed to serialize metadata: {e}")))?;
    std::fs::write(path, content)?;

    Ok(metadata)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_tags_trims_and_deduplicates() {
        assert_eq!(
            normalize_tags(vec![
                " cron ".to_string(),
                "".to_string(),
                "backup".to_string(),
                "cron".to_string(),
            ]),
            vec!["cron".to_string(), "backup".to_string()]
        );
    }
}
