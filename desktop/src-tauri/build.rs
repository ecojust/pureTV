use std::{env, fs, path::Path, process::Command};

fn main() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let output = root.join("desktop/src-tauri/offline-assets/game-library.zip");
    for input in [
        "../../desktop/scripts/pack-offline-games.py",
        "../../tools/pc-games/catalog.json",
        "../../tools/pc-games/hosted-games.json",
        "../../tools/pc-games/offline_web_assets.py",
        "../../tools/pc-games/stage_web_games.py",
        "../../tools/game_icons.py",
        "../../tools/pc-games/launcher.py",
        "../../tools/pc-games/host.py",
        "../../tools/pc-games/prepare_standalone.py",
        "../../tools/pc-games/web-layouts",
        "../../tools/pc-games/web-host.js",
        "../../tools/pc-games/web-host.css",
        "../../tools/pc-games/pc-bridge.js",
    ] {
        println!("cargo:rerun-if-changed={input}");
    }
    println!("cargo:rerun-if-env-changed=PURETV_GAME_APK_CACHE");
    let python = if cfg!(windows) { "python" } else { "python3" };
    println!("cargo:rerun-if-env-changed=PURETV_PREBUILT_GAME_LIBRARY");
    let mut command = Command::new(python);
    command
        .arg(root.join("desktop/scripts/pack-offline-games.py"))
        .arg("--output")
        .arg(&output);
    if env::var_os("PURETV_PREBUILT_GAME_LIBRARY").is_some() {
        command.arg("--verify");
        println!("cargo:rerun-if-changed=offline-assets/game-library.zip");
    }
    let status = command
        .status()
        .expect("Python 3.11+ is required to package the desktop game resources");
    assert!(status.success(), "Failed to stage the offline game library");
    let digest = fs::read_to_string(output.with_extension("sha256")).unwrap();
    println!(
        "cargo:rustc-env=PURETV_GAME_LIBRARY_SHA256={}",
        digest.trim()
    );
    println!(
        "cargo:rustc-env=PURETV_GAME_LIBRARY_BYTES={}",
        fs::metadata(output).unwrap().len()
    );
    tauri_build::build()
}
