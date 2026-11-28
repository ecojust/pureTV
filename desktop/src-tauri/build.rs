use std::{path::Path, process::Command};

fn catalog_revision(root: &Path) -> Option<String> {
    if !root.join(".git").exists() {
        return None;
    }
    let output = Command::new("git")
        .current_dir(root)
        .args([
            "log",
            "-1",
            "--format=%H",
            "--",
            "tools/pc-games/catalog.json",
        ])
        .output()
        .ok()?;
    let revision = std::str::from_utf8(&output.stdout).ok()?.trim();
    (output.status.success()
        && revision.len() == 40
        && revision.bytes().all(|b| b.is_ascii_hexdigit()))
    .then(|| revision.to_owned())
}

fn main() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    println!("cargo:rerun-if-changed=../../tools/pc-games/catalog.json");
    // Shallow release checkouts resolve to their frozen checkout. Source archives
    // use the catalog's original branch links and the same mandatory content hash.
    let revision = catalog_revision(&root).unwrap_or_else(|| "refs/heads/master".into());
    println!("cargo:rustc-env=PURETV_GAME_APK_REVISION={revision}");
    tauri_build::build()
}
