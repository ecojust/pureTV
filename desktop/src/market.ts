import type {MarketItem, MarketKind, MarketSeenEntry} from './types';

export interface MarketGroup {
  id: string;
  kind: MarketKind;
  versions: MarketItem[];
}

function groupId(item: MarketItem): string {
  const folder = item.id.slice(0, item.id.lastIndexOf('/'));
  const stem = item.fileName.replace(/\.apk$/i, '');
  const suffix = item.version ? `-${item.version}` : '';
  const name = suffix && stem.endsWith(suffix) ? stem.slice(0, -suffix.length) : stem;
  // Paths and file stems identify the resource; display names and commit URLs do not.
  return JSON.stringify([item.kind, folder, name]);
}

function numericVersion(version: MarketItem['version']): number[] | null {
  return version && /^\d+(?:\.\d+){1,3}$/.test(version) ? version.split('.').map(Number) : null;
}

function newestFirst(a: MarketItem, b: MarketItem): number {
  const av = numericVersion(a.version), bv = numericVersion(b.version);
  if (av && bv) {
    for (let i = 0; i < Math.max(av.length, bv.length); i++) {
      const difference = (bv[i] || 0) - (av[i] || 0);
      if (difference) return difference;
    }
  } else if (av || bv) return av ? -1 : 1;
  return a.id.localeCompare(b.id, 'en', {numeric: true});
}

export function groupMarketItems(items: MarketItem[]): MarketGroup[] {
  const groups = new Map<string, MarketGroup>();
  for (const item of items) {
    const id = groupId(item);
    const group = groups.get(id) || {id, kind: item.kind, versions: []};
    group.versions.push(item);
    groups.set(id, group);
  }
  for (const group of groups.values()) group.versions = group.versions.sort(newestFirst).slice(0, 5);
  return [...groups.values()].sort((a, b) => a.id.localeCompare(b.id, 'en', {numeric: true}));
}

/** One latest version per stable application identity, independent of UI selection. */
export function marketSeenEntries(groups: MarketGroup[]): MarketSeenEntry[] {
  return groups.map(group => ({id: group.id, name: group.versions[0].name, version: group.versions[0].version || null}));
}

export function newMarketGroups(groups: MarketGroup[], baseline: MarketSeenEntry[]): Set<string> {
  const previous = new Map(baseline.map(entry => [entry.id, entry]));
  return new Set(groups.filter(group => {
    const old = previous.get(group.id), current = group.versions[0].version || null;
    if (!old) return true;
    if (!current || current === old.version) return false;
    const nowParts = numericVersion(current), oldParts = numericVersion(old.version);
    if (!nowParts || !oldParts) return true;
    for (let i = 0; i < Math.max(nowParts.length, oldParts.length); i++) {
      const difference = (nowParts[i] || 0) - (oldParts[i] || 0);
      if (difference) return difference > 0;
    }
    return false;
  }).map(group => group.id));
}
