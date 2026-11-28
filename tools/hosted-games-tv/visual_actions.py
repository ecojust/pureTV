"""Identify author controls and gameplay from the Android TV framebuffer."""

import subprocess
import time

from PIL import ImageChops, ImageOps

from visual import locate_text


def tap_campus_menu(screen):
    # The author draws this title-toolbar button in #ffe48a over a busy photo.
    # Isolate those glyphs, then verify their Korean text before sending a tap.
    until = time.monotonic() + 90
    while time.monotonic() < until:
        image = screen.frame()
        left = image.width // 2
        toolbar = image.crop((left, 0, image.width, image.height // 7))
        masks = [band.point(lambda value, color=color: 255 if abs(value - color) < 10 else 0)
                 for band, color in zip(toolbar.split(), (255, 228, 138))]
        mask = ImageChops.multiply(ImageChops.multiply(masks[0], masks[1]), masks[2])
        bounds = mask.getbbox()
        if bounds:
            glyphs = mask.crop(bounds)
            glyphs = glyphs.resize((2 * glyphs.width, 2 * glyphs.height))
            isolated = ImageOps.expand(ImageOps.invert(glyphs), border=16, fill=255)
            hit = locate_text(isolated, ['미니게임'], 'kor')
            if hit:
                x0, y0, x1, y1 = hit['bounds']
                x = left + bounds[0] + ((x0 + x1) / 2 - 16) / 2
                y = bounds[1] + ((y0 + y1) / 2 - 16) / 2
                screen.tap(x, y)
                return {'text': hit['text'], 'tap': [round(x), round(y)]}
        # A different author theme or screen layout may still be readable as a whole.
        try:
            hit = locate_text(image, ['미니게임'], 'kor+eng')
        except subprocess.TimeoutExpired:
            continue
        if hit:
            x0, y0, x1, y1 = hit['bounds']
            screen.tap((x0 + x1) / 2, (y0 + y1) / 2)
            return hit
        time.sleep(1)
    raise RuntimeError('Could not read the mini-game button in the author toolbar')


def tap_cake_start(screen):
    # The illustration says “press Start” directly above the button. Read the
    # white label in the lower-right action row, and verify its purple backing.
    until = time.monotonic() + 90
    while time.monotonic() < until:
        image = screen.frame()
        left, top = image.width // 2, image.height * 68 // 100
        actions = image.crop((left, top, image.width, image.height))
        ink = actions.convert('L').point(lambda value: 0 if value > 202 else 255)
        hit = locate_text(ink, ['시작'], 'kor')
        if hit:
            x0, y0, x1, y1 = hit['bounds']
            x, y = left + (x0 + x1) / 2, top + (y0 + y1) / 2
            red, green, blue = image.getpixel((left + max(0, x0 - 5), round(y)))
            if red > green + 30 and blue > green + 40:
                screen.tap(x, y)
                return {'text': hit['text'], 'tap': [round(x), round(y)]}
        time.sleep(1)
    raise RuntimeError('Could not read the cake shop start button')


def play_visual(screen, game_id):
    if game_id == 'daejeon-campus':
        menu = tap_campus_menu(screen)
        picker = screen.see_text(['어떤 게임을 해볼까', '케이크 타이쿤', '파티시에과'], lang='kor+eng')
        screen.capture('game-picker')
        cake = screen.tap_text(['케이크 타이쿤', '파티시에과'], lang='kor+eng')
        start = tap_cake_start(screen)
        sales = screen.see_text(['매출'], lang='kor+eng')
        return {'observed': 'Opened the game picker, started the cake shop and saw its sales HUD',
                'menu': menu, 'picker': picker, 'cake': cake, 'start': start, 'salesHud': sales}

    if game_id == 'noir-extreme':
        start = screen.tap_text(['BEGIN'], timeout=110)
        screen.capture('after-begin')
        # The first chapter can introduce itself before displaying the opening objective.
        # Both strings belong to the author game and identify the diner sequence.
        first_chapter = screen.see_text(['Light up', 'Order a drink', 'The Diner'], timeout=100)
        return {'observed': 'Tapped BEGIN and read text from the diner chapter',
                'begin': start, 'chapterText': first_chapter,
                'scope': 'Entry into the first chapter; later objectives were not exercised.'}

    raise ValueError('No visual action for ' + game_id)
