package com.ecojust.putrtvstore;

/** One published APK. Version codes and signatures, never filenames, identify updates. */
public final class StoreEntry {
    public final String id, name, nameEn, description, descriptionEn, category, packageName,
            versionName, apkPath, coverPath, logoSvg, sha256, certificateSha256, gitBlobSha, etag, lastModified, provider, marketVersion;
    public final long versionCode, bytes;
    public final int minSdk;

    public StoreEntry(String id, String name, String nameEn, String description,
            String descriptionEn, String category, String packageName, String versionName,
            String apkPath, String coverPath, String logoSvg, String sha256,
            String certificateSha256, String gitBlobSha, long versionCode, long bytes, int minSdk) {
        this(id, name, nameEn, description, descriptionEn, category, packageName, versionName,
                apkPath, coverPath, logoSvg, sha256, certificateSha256, gitBlobSha, versionCode,
                bytes, minSdk, "", "", "", versionName);
    }

    public StoreEntry(String id, String name, String nameEn, String description,
            String descriptionEn, String category, String packageName, String versionName,
            String apkPath, String coverPath, String logoSvg, String sha256,
            String certificateSha256, String gitBlobSha, long versionCode, long bytes, int minSdk,
            String etag, String lastModified, String provider, String marketVersion) {
        this.id = id; this.name = name; this.nameEn = nameEn; this.description = description;
        this.descriptionEn = descriptionEn; this.category = category; this.packageName = packageName;
        this.versionName = versionName; this.apkPath = apkPath; this.coverPath = coverPath;
        this.etag = etag; this.lastModified = lastModified; this.provider = provider; this.marketVersion = marketVersion;
        this.logoSvg = logoSvg; this.sha256 = sha256; this.certificateSha256 = certificateSha256;
        this.gitBlobSha = gitBlobSha; this.versionCode = versionCode; this.bytes = bytes; this.minSdk = minSdk;
    }

    public boolean hasPackageIdentity() { return !packageName.isEmpty() && versionCode > 0 && !certificateSha256.isEmpty(); }

    public StoreEntry withIdentity(String packageName, String versionName, long versionCode, int minSdk,
            String sha256, String certificateSha256, String gitBlobSha) {
        return new StoreEntry(id, name, nameEn, description, descriptionEn, category, packageName,
                versionName, apkPath, coverPath, logoSvg, sha256, certificateSha256, gitBlobSha,
                versionCode, bytes, minSdk, etag, lastModified, provider, marketVersion);
    }

    public String displayName(boolean english) { return english && !nameEn.isEmpty() ? nameEn : name; }
    public String displayDescription(boolean english) {
        return english && !descriptionEn.isEmpty() ? descriptionEn : description;
    }
}
