# Jellyfin logo SVG adaptation

`logo.svg` is a 64×64 adaptation of the Jellyfin logo provided by Jellyfin contributors in the bundled, unmodified v0.19.10 source archive.

- Upstream: https://github.com/jellyfin/jellyfin-androidtv/tree/v0.19.10
- Geometry: `app/src/main/res/drawable/app_icon_foreground_monochrome.xml`
- Colors: `app/src/main/res/values/logo.xml` (`#000B25`, `#AA5CC3`, `#00A4DC`)
- Original vector SHA-256: `13829b0556fc2ac2b7a801dbf480c98ab1bb22b56cae0626dc3aa33983c74399`
- License: upstream GPL-2.0, retained in [LICENSE](LICENSE). Original logo and name remain associated with Jellyfin.

Changes: the original vector paths were uniformly scaled and translated into a 64×64 viewBox; a rounded background was added. The original purple/blue endpoint colors are flat fills so the file works with the launcher layout SVG subset without gradients, scripts, embedded images or external references. This is a local SVG adaptation, not a claim that upstream distributes this exact file. The APK and upstream source archive are unchanged.
