"""Write the browser game library at the root of the static site."""
from html import escape
import json
from pathlib import Path
import sys
from hosted_games import hosted_games


def write_index(output):
    catalog = json.loads(Path(__file__).with_name("catalog.json").read_text(encoding="utf-8"))
    links = []
    online = hosted_games()
    for game in [*catalog, *online]:
        slug, title, english = (escape(game[key]) for key in ("id", "zh", "en"))
        cover = 'thumb.webp' if 'controls' in game else 'thumb.png'
        links.append(
            f'<a lang="zh-CN" href="games/{slug}/tv.html"><img loading="lazy" '
            f'src="games/{slug}/{cover}" alt=""><strong>{title}</strong>'
            f'<span lang="en">{english}</span></a>'
        )
    output.mkdir(parents=True, exist_ok=True)
    (output / "index.html").write_text("""<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>pureTV 游戏 · Games</title>
<style>
*{box-sizing:border-box}body{margin:0 auto;max-width:78rem;padding:2rem clamp(1rem,4vw,4rem);
background:#101820;color:#edf4f5;font:1rem/1.5 system-ui,sans-serif}h1{margin:0 0 1.25rem}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,13rem),1fr));gap:1rem}
a{display:flex;flex-direction:column;text-decoration:none;color:inherit;border:1px solid #384752;
border-radius:.6rem;overflow:hidden;background:#202e38;padding-bottom:.65rem}
a:hover,a:focus-visible{outline:3px solid #7ddcc5}img{width:100%;aspect-ratio:16/9;object-fit:cover}
strong,span{padding:0 .8rem}strong{margin-top:.5rem}span{color:#c3d0d5;font-size:.85rem}
</style><h1>pureTV 游戏 <small lang="en">Games</small></h1>
<main>""" + "\n".join(links) + "</main></html>\n", encoding="utf-8")
    (output / ".nojekyll").touch()


if __name__ == "__main__":
    write_index(Path(sys.argv[1]))
