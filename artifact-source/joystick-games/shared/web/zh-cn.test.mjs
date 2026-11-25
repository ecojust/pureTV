import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { localizeHtml } from './localize-html.mjs';

const { chromium } = createRequire(new URL('../../../desktop/package.json', import.meta.url))('playwright');

test('first frame, dynamic UI and canvas all use the packaged translations', async t => {
  const root = await mkdtemp(join(tmpdir(), 'puretv-zh-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'src', 'zh-cn.js'), `PureTVChinese.install({
    strings: {'New game': '新游戏', 'Easy': '简单', 'Quit': '退出', 'Long label': '长标签'},
    patterns: [[/^Level ([0-9]+)$/, '第 $1 关']]
  });`);
  const html = await localizeHtml(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
    <script>window.first = PureTVChinese.translate('New game')</script><title>New game</title></head>
    <body><button title="Quit">Long
       label</button><select><option>Easy</option></select><span translate="no">Easy</span></body></html>`, root);
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium'});
  t.after(() => browser.close());
  const page = await browser.newPage({locale: 'en-US'});
  await page.setContent(html);
  assert.deepEqual(await page.evaluate(() => [
    first, document.documentElement.lang, document.title, document.querySelector('button').textContent,
    document.querySelector('button').title, document.querySelector('select').value,
    document.querySelector('option').textContent, document.querySelector('span').textContent,
  ]), ['新游戏', 'zh-CN', '新游戏', '长标签', '退出', 'Easy', '简单', 'Easy']);
  await page.locator('button').evaluate(el => {el.textContent = 'Level 12'; el.title = 'New game';});
  assert.equal(await page.locator('button').textContent(), '第 12 关');
  assert.equal(await page.locator('button').getAttribute('title'), '新游戏');
  assert.equal(await page.evaluate(() => {
    function paint(label) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillText(label, 10, 20);
      ctx.strokeText(label, 20, 40);
      return [ctx.measureText(label).width, canvas.toDataURL()];
    }
    return JSON.stringify(paint('New game')) === JSON.stringify(paint('新游戏'));
  }), true);
});
