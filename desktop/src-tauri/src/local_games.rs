//! The manager keeps references to user-selected web game folders. Edits to their
//! web assets take effect the next time the page requests them.
use crate::local_game_player::Player;
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    sync::Mutex,
};
use tauri::{Emitter, Manager};
use tauri_plugin_dialog::DialogExt;

#[derive(Clone, Deserialize, Serialize)]
pub struct LocalGame {
    pub id: String,
    pub title: String,
    pub directory: PathBuf,
}

#[derive(Default)]
pub struct Library {
    registry: Mutex<()>,
    player: Player,
}

fn registry_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("local-games.json"))
}

fn read_registry(path: &Path) -> Result<Vec<LocalGame>, String> {
    match fs::File::open(path) {
        Ok(file) => serde_json::from_reader(file).map_err(|e| e.to_string()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(Vec::new()),
        Err(err) => Err(err.to_string()),
    }
}

fn project_root(directory: &Path) -> Result<PathBuf, String> {
    if !directory.is_absolute() {
        return Err("请选择包含 index.html 的游戏文件夹。".into());
    }
    let root = directory.canonicalize().map_err(|e| e.to_string())?;
    let entry = root.join("index.html");
    if !entry
        .canonicalize()
        .is_ok_and(|file| file.starts_with(&root) && file.is_file())
    {
        return Err("游戏文件夹中找不到可读取的 index.html。".into());
    }
    Ok(root)
}

fn register_folder(
    registry: &Path,
    directory: &Path,
    title: Option<&str>,
) -> Result<LocalGame, String> {
    let root = project_root(directory)?;
    let mut games = read_registry(registry)?;
    let previous = games.iter().position(|game| game.directory == root);
    let title = title
        .map(str::trim)
        .or_else(|| previous.map(|i| games[i].title.as_str()))
        .or_else(|| root.file_name().and_then(|name| name.to_str()))
        .ok_or("请提供游戏名称。")?;
    if title.is_empty() || title.chars().count() > 120 {
        return Err("游戏名称应包含 1 至 120 个字符。".into());
    }
    let game = LocalGame {
        id: match previous {
            Some(i) => games[i].id.clone(),
            None => crate::local_game_player::random_token()?,
        },
        title: title.to_owned(),
        directory: root,
    };
    if let Some(i) = previous {
        games[i] = game.clone();
    } else {
        games.push(game.clone());
    }
    let parent = registry.parent().ok_or("本地游戏目录不可用。")?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let mut temp = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    serde_json::to_writer(temp.as_file_mut(), &games).map_err(|e| e.to_string())?;
    temp.flush().map_err(|e| e.to_string())?;
    temp.persist(registry).map_err(|e| e.to_string())?;
    Ok(game)
}

pub fn register(
    app: &tauri::AppHandle,
    directory: &str,
    title: Option<&str>,
) -> Result<LocalGame, String> {
    let library = app.state::<Library>();
    let _lock = library
        .registry
        .lock()
        .map_err(|_| "本地游戏目录不可用。")?;
    let game = register_folder(&registry_path(app)?, Path::new(directory), title)?;
    let _ = app.emit_to("main", "local-games-changed", ());
    Ok(game)
}

pub fn list(app: &tauri::AppHandle) -> Result<Vec<LocalGame>, String> {
    let library = app.state::<Library>();
    let _lock = library
        .registry
        .lock()
        .map_err(|_| "本地游戏目录不可用。")?;
    read_registry(&registry_path(app)?)
}

#[tauri::command]
pub fn list_local_games(app: tauri::AppHandle) -> Result<Vec<LocalGame>, String> {
    list(&app)
}

#[tauri::command]
pub async fn choose_local_game(app: tauri::AppHandle) -> Result<Option<LocalGame>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let folder = app
            .dialog()
            .file()
            .set_title(crate::dialog_text(
                &app,
                "选择包含 index.html 的游戏文件夹",
                "選擇包含 index.html 的遊戲資料夾",
                "Choose a game folder containing index.html",
            ))
            .blocking_pick_folder();
        folder
            .map(|file| {
                let path = file.into_path().map_err(|_| "请选择本地文件夹。")?;
                register(&app, path.to_str().ok_or("游戏目录路径不是 UTF-8。")?, None)
            })
            .transpose()
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn play_local_game(id: String, app: tauri::AppHandle) -> Result<String, String> {
    let game = list(&app)?
        .into_iter()
        .find(|game| game.id == id)
        .ok_or("本地游戏未登记。")?;
    let root = project_root(&game.directory)?;
    if root != game.directory {
        return Err("游戏目录已移动，请重新添加。".into());
    }
    let preference = registry_path(&app)?.with_file_name("local-project-player-port");
    let base = app
        .state::<Library>()
        .player
        .mount_project(game.id, root, &preference)?;
    Ok(format!("{base}index.html"))
}

#[tauri::command]
pub fn release_local_game(url: String, library: tauri::State<'_, Library>) {
    library.player.release_project(Some(&url));
}

impl Library {
    pub(super) fn close_player(&self) {
        self.player.release_project(None);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn register_and_reopen_live_project_without_duplicates() {
        let temp = tempfile::tempdir().unwrap();
        let path = temp.path().join("My game");
        let registry = temp.path().join("settings/local-games.json");
        fs::create_dir(&path).unwrap();
        assert!(read_registry(&registry).unwrap().is_empty());
        assert!(register_folder(&registry, &path, None).is_err());
        fs::write(path.join("index.html"), "play").unwrap();
        let game = register_folder(&registry, &path, None).unwrap();
        assert_eq!(game.title, "My game");
        assert_eq!(
            register_folder(&registry, &path, Some("New title"))
                .unwrap()
                .id,
            game.id
        );
        assert!(register_folder(&registry, &path, Some("  ")).is_err());
        let games = read_registry(&registry).unwrap();
        assert_eq!(games.len(), 1);
        assert_eq!(games[0].title, "New title");
        assert_eq!(
            register_folder(&registry, &path, None).unwrap().title,
            "New title"
        );
        fs::write(&registry, "{").unwrap();
        assert!(register_folder(&registry, &path, None).is_err());
    }
}
