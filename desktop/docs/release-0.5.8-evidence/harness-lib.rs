#[path = "/dev/shm/puretv-market-sync/desktop/src-tauri/src/app_store.rs"]
mod app_store;
#[path = "/dev/shm/puretv-market-sync/desktop/src-tauri/src/app_logos.rs"]
mod app_logos;
#[path = "/dev/shm/puretv-market-sync/desktop/src-tauri/src/market.rs"]
mod market;
#[path = "/dev/shm/puretv-market-sync/desktop/src-tauri/src/client_updates.rs"]
mod client_updates;

#[test]
fn native_mcp_seed_uses_new_cache_without_network() {
    use std::{path::Path, sync::atomic::AtomicBool};
    let root = std::env::var("PURETV_HTTP_MCP_SEED").unwrap();
    let cancel = AtomicBool::new(false);
    let catalog = market::catalog(Path::new(&root), false, &cancel, |_| panic!("fresh MCP fixture must not fetch catalog")).unwrap();
    assert_eq!(catalog.items.len(), 2);
    for item in &catalog.items {
        let result = market::download(Path::new(&root), &item.id, Some(&catalog.revision), &cancel, |progress| {
            assert_ne!(progress.stage, "catalog"); assert_ne!(progress.stage, "downloading"); Ok(())
        }).unwrap();
        assert_eq!(&result.item, item);
    }
}

#[path = "/dev/shm/puretv-market-sync/desktop/src-tauri/src/mcp.rs"]
mod mcp;
