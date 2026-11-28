use openssl::{
    asn1::Asn1Time,
    hash::MessageDigest,
    pkey::{PKey, Private},
    rsa::Rsa,
    sign::Signer,
    x509::{X509NameBuilder, X509},
};
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::{self, Cursor, Read, Write},
    path::Path,
    sync::atomic::{AtomicBool, Ordering},
};
use zip::{write::SimpleFileOptions, CompressionMethod, ZipArchive, ZipWriter};

const HOST: &[u8] = include_bytes!("../../web-game-templates/android-host.zip");
const ORIGINAL: &str = "com.ecojust.neonrushtv";
const SIGNATURE_ALGORITHM: u32 = 0x0103; // RSA PKCS#1 v1.5 with SHA-256

type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

pub(crate) fn package_name(id: &str) -> String {
    format!("com.puretv.g{}", &format!("{:x}", Sha256::digest(id))[..10])
}

fn utf16(s: &str) -> Vec<u8> {
    s.encode_utf16().flat_map(u16::to_le_bytes).collect()
}

// The precompiled resource table starts with an unstyled UTF-8 string pool.
fn replace_labels(table: &mut Vec<u8>, zh: &str, en: &str) -> Result<()> {
    fn read(data: &[u8], at: usize) -> u32 {
        u32::from_le_bytes(data[at..at + 4].try_into().unwrap())
    }
    fn put(data: &mut [u8], at: usize, value: usize) {
        data[at..at + 4].copy_from_slice(&(value as u32).to_le_bytes());
    }
    const POOL: usize = 12;
    let pool_end = POOL + read(table, POOL + 4) as usize;
    let start = POOL + read(table, POOL + 20) as usize;
    let count = read(table, POOL + 8) as usize;
    if read(table, POOL + 12) != 0 || read(table, POOL + 16) != 256 {
        return Err("unexpected APK label pool".into());
    }
    let mut strings = Vec::new();
    for index in 0..count {
        let field = POOL + 28 + 4 * index;
        let offset = start + read(table, field) as usize;
        let byte_length = offset + if table[offset] & 0x80 == 0 { 1 } else { 2 };
        let content = byte_length + if table[byte_length] & 0x80 == 0 { 1 } else { 2 };
        let nul = table[content..pool_end]
            .iter()
            .position(|byte| *byte == 0)
            .ok_or("invalid APK label pool")?
            + content;
        put(table, field, strings.len());
        let label = match &table[content..nul] {
            bytes if bytes == "电视游戏".as_bytes() => zh,
            b"pureTV TV TV" => en,
            _ => {
                strings.extend_from_slice(&table[offset..=nul]);
                continue;
            }
        };
        if label.is_empty() || label.len() > 127 || label.contains('\0') {
            return Err("游戏名称无效".into());
        }
        strings.push(label.encode_utf16().count() as u8);
        strings.push(label.len() as u8);
        strings.extend_from_slice(label.as_bytes());
        strings.push(0);
    }
    strings.resize((strings.len() + 3) & !3, 0);
    let new_size = table.len() + strings.len() - (pool_end - start);
    put(table, 4, new_size);
    put(table, POOL + 4, start + strings.len() - POOL);
    table.splice(start..pool_end, strings);
    Ok(())
}

fn identity(directory: &Path) -> Result<(PKey<Private>, X509)> {
    let path = directory.join("game-apk-signing.pem");
    if path.exists() {
        let pem = fs::read(path)?;
        return Ok((PKey::private_key_from_pem(&pem)?, X509::from_pem(&pem)?));
    }
    let key = PKey::from_rsa(Rsa::generate(2048)?)?;
    let mut name = X509NameBuilder::new()?;
    name.append_entry_by_text("CN", "pureTV Manager Local Games")?;
    let name = name.build();
    let mut cert = X509::builder()?;
    cert.set_version(2)?;
    cert.set_subject_name(&name)?;
    cert.set_issuer_name(&name)?;
    cert.set_pubkey(&key)?;
    cert.set_not_before(Asn1Time::days_from_now(0)?.as_ref())?;
    cert.set_not_after(Asn1Time::days_from_now(10950)?.as_ref())?;
    cert.sign(&key, MessageDigest::sha256())?;
    let cert = cert.build();
    let mut pending = tempfile::NamedTempFile::new_in(directory)?;
    pending.write_all(&key.private_key_to_pem_pkcs8()?)?;
    pending.write_all(&cert.to_pem()?)?;
    match pending.persist_noclobber(&path) {
        Ok(_) => Ok((key, cert)),
        Err(error) if error.error.kind() == io::ErrorKind::AlreadyExists => identity(directory),
        Err(error) => Err(error.error.into()),
    }
}

fn length_prefixed(data: &[u8]) -> Vec<u8> {
    [(data.len() as u32).to_le_bytes().as_slice(), data].concat()
}

fn signed_apk(mut zip: Vec<u8>, key: &PKey<Private>, cert: &X509) -> Result<Vec<u8>> {
    // ZipWriter emits an uncommented ZIP32 EOCD. In the APK v2 digest its
    // central directory offset is the position where the signing block starts.
    let end = zip.len().checked_sub(22).ok_or("invalid APK ZIP")?;
    if &zip[end..end + 4] != b"PK\x05\x06" {
        return Err("invalid APK ZIP".into());
    }
    let central = u32::from_le_bytes(zip[end + 16..end + 20].try_into()?) as usize;
    let mut chunks = Vec::new();
    for region in [&zip[..central], &zip[central..end], &zip[end..]] {
        for chunk in region.chunks(1024 * 1024) {
            let mut hash = Sha256::new();
            hash.update([0xa5]);
            hash.update((chunk.len() as u32).to_le_bytes());
            hash.update(chunk);
            chunks.extend_from_slice(&hash.finalize());
        }
    }
    let mut hash = Sha256::new();
    hash.update([0x5a]);
    hash.update(((chunks.len() / 32) as u32).to_le_bytes());
    hash.update(chunks);
    let algorithm = SIGNATURE_ALGORITHM.to_le_bytes();
    let digest =
        length_prefixed(&[algorithm.as_slice(), &length_prefixed(&hash.finalize())].concat());
    let certificates = length_prefixed(&cert.to_der()?);
    let data = [
        length_prefixed(&digest),
        length_prefixed(&certificates),
        length_prefixed(&[]),
    ]
    .concat();
    let mut signer = Signer::new(MessageDigest::sha256(), key)?;
    signer.update(&data)?;
    let signature = length_prefixed(
        &[
            algorithm.as_slice(),
            &length_prefixed(&signer.sign_to_vec()?),
        ]
        .concat(),
    );
    let signer = [
        length_prefixed(&data),
        length_prefixed(&signature),
        length_prefixed(&key.public_key_to_der()?),
    ]
    .concat();
    let value = length_prefixed(&length_prefixed(&signer));
    let entry_size = (value.len() as u64 + 4).to_le_bytes();
    let size = (value.len() as u64 + 4 + 8 + 24).to_le_bytes();
    let block = [
        size.as_slice(),
        &entry_size,
        &0x7109871au32.to_le_bytes(),
        &value,
        &size,
        b"APK Sig Block 42",
    ]
    .concat();
    zip[end + 16..end + 20].copy_from_slice(&u32::try_from(central + block.len())?.to_le_bytes());
    zip.splice(central..central, block);
    Ok(zip)
}

pub(crate) fn build(
    directory: &Path,
    root: &Path,
    id: &str,
    files: &[String],
    labels: (&str, &str),
    mut output: impl Write,
    cancel: &AtomicBool,
) -> Result<()> {
    let mut skeleton = ZipArchive::new(Cursor::new(HOST))?;
    let mut archive = ZipWriter::new(Cursor::new(Vec::new()));
    let stored = SimpleFileOptions::default()
        .compression_method(CompressionMethod::Stored)
        .with_alignment(4);
    let compressed = SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);
    let original = utf16(ORIGINAL);
    let package = utf16(&package_name(id));
    for i in 0..skeleton.len() {
        let mut member = skeleton.by_index(i)?;
        let name = member.name()?.into_owned();
        let mut bytes = Vec::new();
        member.read_to_end(&mut bytes)?;
        if matches!(name.as_str(), "AndroidManifest.xml" | "resources.arsc") {
            let position = bytes
                .windows(original.len())
                .position(|data| data == original)
                .ok_or("missing APK package placeholder")?;
            bytes[position..position + original.len()].copy_from_slice(&package);
        }
        if name == "resources.arsc" {
            replace_labels(&mut bytes, labels.0, labels.1)?;
        } else if name.ends_with(".png") {
            bytes = fs::read(root.join("web").join(id).join("thumb.png"))?;
        }
        archive.start_file(name, stored)?;
        archive.write_all(&bytes)?;
    }
    let prefix = format!("web/{id}/");
    let mut index = Vec::new();
    for path in files {
        if cancel.load(Ordering::Acquire) {
            return Err("游戏 APK 操作已取消".into());
        }
        let Some(name) = path.strip_prefix(&prefix) else {
            continue;
        };
        if matches!(name, "tv.html" | "assets-index.json") {
            continue;
        }
        let name = if name == "android-entry.html" {
            "tv.html"
        } else {
            name
        };
        archive.start_file(format!("assets/{name}"), compressed)?;
        io::copy(&mut fs::File::open(root.join(path))?, &mut archive)?;
        index.push(name);
    }
    if !index.contains(&"tv.html") {
        return Err("游戏缺少 Android 入口".into());
    }
    archive.start_file("assets/assets-index.json", compressed)?;
    serde_json::to_writer(&mut archive, &index)?;
    let (key, cert) = identity(directory)?;
    output.write_all(&signed_apk(archive.finish()?.into_inner(), &key, &cert)?)?;
    Ok(())
}
