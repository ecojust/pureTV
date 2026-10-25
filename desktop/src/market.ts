import type {MarketItem, MarketKind} from './types';

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

function newestFirst(a: MarketItem, b: MarketItem): number {
  const numeric = (version: MarketItem['version']) => version && /^\d+(?:\.\d+){1,3}$/.test(version) ? version.split('.').map(Number) : null;
  const av = numeric(a.version), bv = numeric(b.version);
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
