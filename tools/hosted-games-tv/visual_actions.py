"""Identify author controls and gameplay from the Android TV framebuffer."""


def play_visual(screen, game_id):
    if game_id == 'daejeon-campus':
        menu = screen.tap_text(['미니게임'], lang='kor+eng')
        picker = screen.see_text(['어떤 게임을 해볼까', '케이크 타이쿤', '파티시에과'], lang='kor+eng')
        screen.capture('game-picker')
        cake = screen.tap_text(['케이크 타이쿤', '파티시에과'], lang='kor+eng')
        start = screen.tap_text(['시작'], lang='kor+eng')
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
