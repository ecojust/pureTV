"""Compile the production HTTP/ZIP code without the OS-specific Tauri window glue."""
from pathlib import Path

root = Path.cwd()
host = root / "tools/desktop-offline-qa/shard-host"
rust = root / "desktop/src-tauri/src"
source = (rust / "local_game_player.rs").read_text()
source = source.replace("use tauri::Manager;", "").replace("use std::sync::{Arc, Mutex};", "use std::sync::Arc;")
source = source.replace("../../../tools/pc-games/catalog.json", str(root / "tools/pc-games/catalog.json"))
source = source[:source.index("#[derive(Default)]")] + source[source.index("#[derive(Deserialize)]"):]
store = (rust / "offline_game_library.rs").read_text()
opener = store[store.index("pub(crate) fn open("):store.index("\nfn resolve(")]
source += """
mod offline_game_library {
    use std::path::Path;
    use std::io::BufReader;
    use std::fs::File;
    fn library_size() -> Result<u64, String> {
        env!("PURETV_GAME_LIBRARY_BYTES").parse::<u64>().map_err(|err| err.to_string())
    }
""" + opener + """
}
fn main() {
    let library = std::env::args_os().nth(1).unwrap();
    let preference = std::env::temp_dir().join("puretv-game-qa-port");
    println!("{}", start(PathBuf::from(library), &preference).unwrap());
    std::thread::park();
}
"""
(host / "src").mkdir(exist_ok=True)
(host / "src/main.rs").write_text(source)
