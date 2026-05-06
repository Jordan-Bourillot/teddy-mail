// Pite Lafe Mail desktop shell.
// Bridges the React UI to the Rust core (sync, parser, store, smtp, oauth).

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::Manager;

#[derive(Default)]
pub struct AppState {
    /// Holds an open `Store` once the user has unlocked the vault.
    /// `None` until `open_store` is called from the UI.
    pub store: Mutex<Option<Arc<Mutex<pite_lafe_core::store::Store>>>>,
}

fn main() {
    pite_lafe_core::init_logging();
    tracing::info!("Pite Lafe Mail shell starting");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .manage(AppState::default())
        .setup(|app| {
            // On first launch, ensure the data directory exists.
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("no app data dir");
            std::fs::create_dir_all(&data_dir).ok();
            tracing::info!(?data_dir, "data dir ready");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::open_store,
            commands::is_store_open,
            commands::search,
            commands::mark_read,
            commands::snooze,
            commands::send_mail,
            commands::start_oauth,
            commands::complete_oauth,
            commands::list_accounts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
