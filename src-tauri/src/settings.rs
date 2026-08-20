use crate::paths::settings_path;
use serde_json::{Map, Value};

// Unparseable settings are backed up rather than silently ignored: dropping
// keyVerifier/kdfSalt makes the app forget a passphrase was ever set and offer
// to create a new one, which rotates the salt and orphans every gs:-encrypted
// cookie. Writes stay allowed here (unlike accounts) -- blocking them would
// leave enc_set_key re-encrypting accounts under a key whose verifier never
// reached disk, which is a worse outcome than a reset config.
pub fn load_settings() -> Map<String, Value> {
    crate::jsonfile::read_object(&settings_path())
}

pub fn save_settings(s: &Map<String, Value>) {
    if let Ok(json) = serde_json::to_string_pretty(s) {
        let _ = crate::jsonfile::write_atomic(&settings_path(), &json);
    }
}

pub fn get_str(s: &Map<String, Value>, key: &str) -> Option<String> {
    s.get(key).and_then(|v| v.as_str()).map(|v| v.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn get_str_reads_string_value() {
        let mut map = Map::new();
        map.insert("lang".to_string(), Value::String("pt".to_string()));
        assert_eq!(get_str(&map, "lang"), Some("pt".to_string()));
    }

    #[test]
    fn get_str_returns_none_for_missing_key() {
        let map = Map::new();
        assert_eq!(get_str(&map, "lang"), None);
    }

    #[test]
    fn get_str_returns_none_for_non_string() {
        let mut map = Map::new();
        map.insert("count".to_string(), Value::Number(42.into()));
        assert_eq!(get_str(&map, "count"), None);
    }

    #[test]
    fn round_trip_settings_preserves_data() {
        let tmp = std::env::temp_dir().join("mr_settings_test.json");
        let mut map = Map::new();
        map.insert("antiAfk".to_string(), Value::Bool(true));
        map.insert("lang".to_string(), Value::String("pt".to_string()));
        map.insert("count".to_string(), Value::Number(7.into()));

        let _ = crate::jsonfile::write_atomic(&tmp, &serde_json::to_string_pretty(&map).unwrap());
        let loaded = crate::jsonfile::read_object(&tmp);
        assert_eq!(loaded.get("antiAfk"), Some(&Value::Bool(true)));
        assert_eq!(loaded.get("lang"), Some(&Value::String("pt".to_string())));
        assert_eq!(loaded.get("count"), Some(&Value::Number(7.into())));
        let _ = fs::remove_file(&tmp);
    }
}
