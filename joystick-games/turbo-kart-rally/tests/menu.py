"""Check the difficulty and lap selectors at the smaller TV viewport."""
import argparse
from pathlib import Path
from browser import serve, SNAP
from playwright.sync_api import sync_playwright


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--chromium', default='/usr/bin/chromium')
    args = parser.parse_args()
    args.output.mkdir(exist_ok=True, parents=True)
    with sync_playwright() as play, serve() as url:
        browser = play.chromium.launch(executable_path=args.chromium, args=[
            '--no-sandbox', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=gl-egl'])
        page = browser.new_page(viewport={'width': 960, 'height': 540}, reduced_motion='reduce')
        page.goto(url, wait_until='commit')
        page.wait_for_function(f'window.JoystickGameQA && {SNAP}.gameplay.mode === "title"', timeout=120000)
        for key in ('Enter', 'ArrowRight', 'Enter', 'ArrowUp', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'):
            page.keyboard.press(key)
        values = page.locator('.opt-val')
        print(values.all_inner_texts(), page.evaluate(SNAP)['gameplay'], flush=True)
        assert values.all_text_contents() == ['150cc · HARD', '1 LAP']
        for option in page.locator('.opt').all():
            assert option.is_visible()
        # Wait for the original menu's opacity, focus and value transitions before capture.
        page.screenshot(path=args.output / 'options-960.png', animations='disabled')
        print(values.all_inner_texts(), flush=True)
        browser.close()
