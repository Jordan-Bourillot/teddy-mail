// Teddy Mail desktop shell, V0.1.0.
// Hosts the React UI in a Tauri webview. Mail backend (rust-core) is decoupled
// from this build and will be wired in V0.2 after API drift fixes.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    init_logging();
    tracing::info!("Teddy Mail shell starting (v{})", env!("CARGO_PKG_VERSION"));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::is_store_open,
            commands::list_accounts,
            commands::start_oauth,
            commands::complete_oauth,
            commands::open_store,
            commands::search,
            commands::mark_read,
            commands::snooze,
            commands::send_mail,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn init_logging() {
    use std::sync::Once;
    static ONCE: Once = Once::new();
    ONCE.call_once(|| {
        let _ = tracing_subscriber::fmt()
            .with_env_filter(
                tracing_subscriber::EnvFilter::try_from_default_env()
                    .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
            )
            .try_init();
    });
}
