import { Difficulty, Realm, REALMS, Season } from '../game/config';

const KEY = 'lumen.best';

// night/day keep their old keys (plus legacy season-modifier runs); the seasonal campaigns get their own
const keyFor = (realm: Realm, season: Season | null) =>
  REALMS[realm].season ? `${KEY}.campaign.${realm}` : (realm === 'night' ? KEY : KEY + '.' + realm) + (season ? '.' + season : '');

export function loadBest(realm: Realm = 'night', season: Season | null = null): Partial<Record<Difficulty, number>> {
  try {
    return JSON.parse(localStorage.getItem(keyFor(realm, season)) || '{}');
  } catch {
    return {};
  }
}

/** Record a result; returns true if it's a new best. */
export function saveBest(d: Difficulty, night: number, realm: Realm = 'night', season: Season | null = null): boolean {
  const b = loadBest(realm, season);
  if ((b[d] ?? 0) >= night) return false;
  b[d] = night;
  try {
    localStorage.setItem(keyFor(realm, season), JSON.stringify(b));
  } catch {
    /* storage unavailable */
  }
  return true;
}
