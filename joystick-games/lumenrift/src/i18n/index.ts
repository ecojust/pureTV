import { de } from './de';
import { Dict, en, StringKey } from './en';
import { es } from './es';
import { fr } from './fr';
import { hy } from './hy';
import { it } from './it';
import { ru } from './ru';
import { uk } from './uk';

export type { StringKey };
export type Lang = 'en' | 'de' | 'es' | 'fr' | 'it' | 'ru' | 'uk' | 'hy';

export const LANGS: Record<Lang, Dict> = { en, de, es, fr, it, ru, uk, hy };
export const LANG_ORDER: Lang[] = ['en', 'de', 'es', 'fr', 'it', 'ru', 'uk', 'hy'];

const STORE_KEY = 'lumen.lang';
let current: Lang = detect();
const listeners = new Set<() => void>();

/** Stored choice first, then the browser/OS language list, then English. */
function detect(): Lang {
  try {
    const s = localStorage.getItem(STORE_KEY) as Lang | null;
    if (s && s in LANGS) return s;
  } catch {
    /* storage unavailable */
  }
  const prefs = typeof navigator !== 'undefined' ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : [];
  for (const p of prefs) {
    const base = (p || '').toLowerCase().split('-')[0] as Lang;
    if (base in LANGS) return base;
  }
  return 'en';
}

export function lang(): Lang {
  return current;
}

export function setLang(l: Lang) {
  if (!(l in LANGS) || l === current) return;
  current = l;
  try {
    localStorage.setItem(STORE_KEY, l);
  } catch {
    /* ignore */
  }
  applyDocument();
  listeners.forEach((f) => f());
}

export function onLangChange(f: () => void) {
  listeners.add(f);
}

type TextRealm = 'night' | 'day' | 'spring' | 'summer' | 'autumn' | 'winter';
let textRealm: TextRealm = 'night';
/** Outside the night campaign, keys with a `@<realm>` variant use it (e.g. "Night {n}" becomes "Day {n}"). */
export function setTextRealm(r: TextRealm) {
  textRealm = r;
}
export function currentTextRealm(): TextRealm {
  return realmForText;
}
/** The realm on screen; realmAware() borrows the text realm temporarily and restores this one. */
let realmForText: TextRealm = 'night';
export function setScreenRealm(r: TextRealm) {
  realmForText = r;
  textRealm = r;
}

/** Translate a key, substituting {placeholders}. Falls back to English, then to the key itself. */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const d = LANGS[current];
  let s: string | undefined;
  if (textRealm !== 'night') {
    const rk = (key + '@' + textRealm) as StringKey;
    s = d[rk] ?? en[rk];
  }
  s = s || d[key] || en[key] || key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

/** Keep <html lang> and the tab title in sync. */
export function applyDocument() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = current;
  document.title = t('meta.title');
}
