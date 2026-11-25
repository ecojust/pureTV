import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Package both scripts with the game so the first frame works offline in each host.
export async function localizeHtml(html, gameRoot) {
  const [runtime, dictionary] = await Promise.all([
    readFile(new URL('./zh-cn.js', import.meta.url), 'utf8'),
    readFile(join(gameRoot, 'src', 'zh-cn.js'), 'utf8'),
  ]);
  // Leave the charset and CSP declarations ahead of the translation scripts.
  const headEnd = html.search(/<\/head\s*>/i);
  if (headEnd < 0) throw new Error('Missing game HTML head: ' + gameRoot);
  const firstScript = html.slice(0, headEnd).search(/<script\b/i);
  const position = firstScript < 0 ? headEnd : firstScript;
  const script = (runtime + '\n' + dictionary).replace(/<\/script/gi, '<\\/script');
  return html.slice(0, position) + '<script>\n' + script + '\n</script>\n' + html.slice(position);
}
