use std::io::{self, Write};

#[derive(Clone, Copy)]
pub(crate) struct EmbeddedGame {
    id: &'static str,
    pub file_name: &'static str,
    pub package_name: &'static str,
    pub sha256: &'static str,
    pub bytes: u64,
    // In file order, including the original Android signing block and ZIP directory.
    parts: &'static [(usize, usize)],
}

static DATA: &[u8] = include_bytes!("../../web-game-templates/parts.bin");
static GAMES: &[EmbeddedGame] = include!("../../web-game-templates/index.rs");

pub(crate) fn embedded_game(game_id: &str) -> Option<EmbeddedGame> {
    GAMES.iter().find(|game| game.id == game_id).copied()
}

impl EmbeddedGame {
    pub(crate) fn write_to(&self, out: &mut impl Write) -> io::Result<()> {
        for &(offset, length) in self.parts {
            let bytes = offset
                .checked_add(length)
                .and_then(|end| DATA.get(offset..end))
                .ok_or_else(|| {
                    io::Error::new(io::ErrorKind::InvalidData, "Invalid game APK template")
                })?;
            out.write_all(bytes)?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sha2::{Digest, Sha256};
    use std::collections::BTreeSet;

    #[test]
    fn all_author_games_assemble_to_the_exact_signed_apks() {
        let catalog: Vec<serde_json::Value> =
            serde_json::from_str(include_str!("../../../tools/pc-games/hosted-games.json"))
                .unwrap();
        let ids: BTreeSet<_> = catalog
            .iter()
            .map(|game| game["id"].as_str().unwrap())
            .collect();
        let packaged: BTreeSet<_> = GAMES.iter().map(|game| game.id).collect();
        assert_eq!(ids, packaged);
        assert_eq!(GAMES.len(), ids.len());
        for game in GAMES {
            let mut apk = Vec::new();
            game.write_to(&mut apk).unwrap();
            assert_eq!(apk.len() as u64, game.bytes, "{}", game.id);
            assert_eq!(
                format!("{:x}", Sha256::digest(&apk)),
                game.sha256,
                "{}",
                game.id
            );
        }
    }
}
