// Hardcoded to match the old Electron build's userData path -- Tauri's
// default app_data_dir() would pick a different folder and orphan existing
// users' saved data on upgrade.
use std::path::PathBuf;

pub fn app_data_dir() -> PathBuf {
    let base = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let dir = PathBuf::from(base).join("multiroblox");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

pub fn settings_path() -> PathBuf {
    app_data_dir().join("settings.json")
}
pub fn accounts_path() -> PathBuf {
    app_data_dir().join("accounts.json")
}
pub fn packages_path() -> PathBuf {
    app_data_dir().join("packages.json")
}
pub fn genhistory_path() -> PathBuf {
    app_data_dir().join("genhistory.json")
}
pub fn local_state_path() -> PathBuf {
    app_data_dir().join("Local State")
}
/// The account -> Roblox PID map, mirrored to disk so a restart can tell
/// which of the still-running clients belong to which account.
pub fn instances_path() -> PathBuf {
    app_data_dir().join("instances.json")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn app_data_dir_uses_appdata() {
        env::set_var("APPDATA", r"C:\Users\Test\AppData\Roaming");
        let dir = app_data_dir();
        assert!(dir.ends_with("multiroblox"));
        assert!(dir.is_absolute());
    }

    #[test]
    fn app_data_dir_falls_back_to_dot() {
        env::remove_var("APPDATA");
        let dir = app_data_dir();
        assert!(dir.ends_with("multiroblox"));
    }

    #[test]
    fn paths_end_with_expected_names() {
        env::set_var("APPDATA", r"C:\Users\Test\AppData\Roaming");
        assert!(settings_path().ends_with("settings.json"));
        assert!(accounts_path().ends_with("accounts.json"));
        assert!(packages_path().ends_with("packages.json"));
        assert!(genhistory_path().ends_with("genhistory.json"));
        assert!(local_state_path().ends_with("Local State"));
        assert!(instances_path().ends_with("instances.json"));
    }
}
