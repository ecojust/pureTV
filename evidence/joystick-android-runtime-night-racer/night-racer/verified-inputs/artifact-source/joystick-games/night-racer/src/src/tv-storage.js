// Keep settings/profile together and each map/group replay in its own native key.
export const STORAGE_KEY = 'night-racer.v1';
export const MAP_IDS = ['city','mountain','bridge','changan','sky','canyon','metro','reef','ice','colossus','dream','deep'];
export const STORAGE_KEYS = [STORAGE_KEY, ...MAP_IDS.flatMap(map => ['std','mod'].map(group => `night-racer.ghost.${map}.${group}`))];
function ghostKey(key) { const match=/^nr-ghost(-mod)?(?:-([a-z]+))?$/.exec(key); return match && MAP_IDS.includes(match[2] || 'city') ? `night-racer.ghost.${match[2] || 'city'}.${match[1] ? 'mod' : 'std'}` : null; }
export function createStore(storage) {
  const read = () => { try { const value = JSON.parse(storage.getItem(STORAGE_KEY)); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; } };
  return {
    get(key) { const ghost=ghostKey(key); if(ghost){try{return JSON.parse(storage.getItem(ghost));}catch{return null;}} const all = read(); return Object.prototype.hasOwnProperty.call(all, key) ? all[key] : null; },
    set(key, value) {
      if (!key.startsWith('nr-')) throw Error('Unsupported game save key');
      const ghost=ghostKey(key), all=ghost ? value : read(); if(!ghost) all[key]=value;
      const text=JSON.stringify(all);
      if(new TextEncoder().encode(text).length>1048576){globalThis.dispatchEvent?.(new CustomEvent('tv-save-warning',{detail:'本圈回放过长，保留上一份幽灵；成绩与进度继续保存。'}));return false;}
      try { storage.setItem(ghost || STORAGE_KEY, text);return true; } catch { globalThis.dispatchEvent?.(new CustomEvent('tv-save-warning',{detail:'存储空间不足，本次存档未能保存。'}));return false; }
    }
  };
}
export const tvStore = createStore(globalThis.localStorage);
