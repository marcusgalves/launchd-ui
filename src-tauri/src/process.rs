use crate::error::AppError;
use crate::types::ResourceUsage;
use std::collections::HashMap;
use std::process::Command;

pub fn get_resource_usage(pids: &[u32]) -> Result<HashMap<u32, ResourceUsage>, AppError> {
    if pids.is_empty() {
        return Ok(HashMap::new());
    }

    let pid_list = pids
        .iter()
        .map(u32::to_string)
        .collect::<Vec<String>>()
        .join(",");
    let output = Command::new("ps")
        .args(["-p", &pid_list, "-o", "pid=,%cpu=,rss="])
        .output()
        .map_err(|e| AppError::Launchctl(format!("failed to sample process usage: {e}")))?;

    if !output.status.success() {
        return Err(AppError::Launchctl(format!(
            "ps failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )));
    }

    Ok(parse_resource_usage(&String::from_utf8_lossy(&output.stdout)))
}

fn parse_resource_usage(output: &str) -> HashMap<u32, ResourceUsage> {
    let mut usage = HashMap::new();

    for line in output.lines() {
        let parts = line.split_whitespace().collect::<Vec<&str>>();
        if parts.len() < 3 {
            continue;
        }

        let Ok(pid) = parts[0].parse::<u32>() else {
            continue;
        };
        let Ok(cpu_percent) = parts[1].parse::<f64>() else {
            continue;
        };
        let Ok(rss_kb) = parts[2].parse::<u64>() else {
            continue;
        };

        usage.insert(
            pid,
            ResourceUsage {
                pid,
                cpu_percent,
                memory_bytes: rss_kb * 1024,
            },
        );
    }

    usage
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_resource_usage() {
        let usage = parse_resource_usage("123  1.5  2048\n456  0.0  1024\n");

        assert_eq!(usage.len(), 2);
        assert_eq!(usage[&123].cpu_percent, 1.5);
        assert_eq!(usage[&123].memory_bytes, 2_097_152);
        assert_eq!(usage[&456].memory_bytes, 1_048_576);
    }

    #[test]
    fn test_parse_resource_usage_skips_invalid_lines() {
        let usage = parse_resource_usage("bad line\n123 nope 2048\n456 0.2 512\n");

        assert_eq!(usage.len(), 1);
        assert_eq!(usage[&456].cpu_percent, 0.2);
    }
}
