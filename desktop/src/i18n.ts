import english from './locales/en.json';
import traditional from './locales/zh-TW.json';

export type Locale = 'zh-CN' | 'zh-TW' | 'en';
export type Theme = 'emerald' | 'ocean' | 'graphite';
const hasOwn=(object:object,key:PropertyKey)=>Object.prototype.hasOwnProperty.call(object,key);
const preferenceKey='puretv.preferences';
const localeNames:Record<Locale,string>={'zh-CN':'简体中文','zh-TW':'繁體中文',en:'English'};
const themeNames:Record<Theme,string>={emerald:'晴空',ocean:'海盐',graphite:'石墨'};
const catalogs:Record<Exclude<Locale,'zh-CN'>,Record<string,string>>={en:english,'zh-TW':traditional};
const phrase=/[\u3400-\u9fff][\u3400-\u9fffA-Za-z0-9_ ·／/…（）「」“”、。！？：；，,.%()↗↑↓—–:;+-]*/g;
let saved:Record<string,unknown>={};
try{saved=JSON.parse(localStorage.getItem(preferenceKey) || '{}') || {};}catch{/* Preferences are optional. */}
const language=navigator.language.toLowerCase();
let currentLocale:Locale=saved.locale && hasOwn(localeNames,String(saved.locale))?saved.locale as Locale:language.startsWith('zh')?(language.includes('tw') || language.includes('hk') || language.includes('hant')?'zh-TW':'zh-CN'):'en';
let currentTheme:Theme=saved.theme && hasOwn(themeNames,String(saved.theme))?saved.theme as Theme:'emerald';
function apply(){document.documentElement.lang=currentLocale;document.documentElement.dataset.theme=currentTheme;document.documentElement.style.colorScheme=currentTheme==='graphite'?'dark':'light';}
function persist(){try{localStorage.setItem(preferenceKey,JSON.stringify({locale:currentLocale,theme:currentTheme}));}catch{/* Continue with in-memory preferences. */}}
export function locale(){return currentLocale;}
export function setLocale(value:string){if(hasOwn(localeNames,value)){currentLocale=value as Locale;apply();persist();}}
export function setTheme(value:string){if(hasOwn(themeNames,value)){currentTheme=value as Theme;apply();persist();}}
/** Translate only source text. User app names, paths and other interpolated values never pass here. */
export function t(source:string):string {
 if(currentLocale==='zh-CN')return source;
 const catalog=catalogs[currentLocale];
 if(hasOwn(catalog,source))return catalog[source];
 return source.replace(phrase,part=>{const key=part.trimEnd();return (catalog[key] ?? key)+part.slice(key.length);});
}
/** Static template fragments are translated before values are interpolated. */
export function ui(strings:TemplateStringsArray,...values:unknown[]):string {
 return strings.map((text,index)=>t(text)+(index<values.length?String(values[index] ?? ''):'')).join('');
}
const diagnosticTemplates=Object.keys(english).filter(key=>key.includes('{')).sort((a,b)=>b.replace(/\{[^{}]*\}/g,'').length-a.replace(/\{[^{}]*\}/g,'').length);
const escapePattern=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function reformat(pattern:string,target:string,value:string):string|null {
 const tokens=[...pattern.matchAll(/\{([^{}]*)\}/g)];if(!tokens.length)return null;
 let index=0,expression='^';
 for(const token of tokens){expression+=escapePattern(pattern.slice(index,token.index))+'(.*?)';index=token.index!+token[0].length;}
 expression+=escapePattern(pattern.slice(index))+'$';const match=new RegExp(expression,'s').exec(value);if(!match)return null;
 const named:Record<string,string>={},positional:string[]=[];
 tokens.forEach((token,index)=>{if(token[1])named[token[1]]=match[index+1];else positional.push(match[index+1]);});
 if(pattern.startsWith('{}完成') || pattern.startsWith('{}成功'))positional[0]=t(positional[0]);
 let position=0;return target.replace(/\{([^{}]*)\}/g,(_,name:string)=>name?(named[name] ?? ''):(positional[position++] ?? ''));
}
/** Translate diagnostic templates while retaining interpolated paths, package names and counts. */
export function message(source:string):string {
 const original=Object.entries(english).find(([,value])=>value===source)?.[0] || source;
 if(currentLocale==='zh-CN')return original;
 const catalog=catalogs[currentLocale];
 if(catalog[original]!==undefined)return catalog[original];
 for(const key of diagnosticTemplates) {
   if(key.includes('{')){const result=reformat(key,catalog[key],original);if(result!==null)return result;}
 }
 const translated=t(original);if(translated!==original)return translated;
 return Object.keys(catalog).sort((a,b)=>b.length-a.length).reduce((text,key)=>text.replaceAll(key,catalog[key]),original);
}
export function localeOptions(){return Object.entries(localeNames).map(([key,label])=>`<option value="${key}"${key===currentLocale?' selected':''}>${label}</option>`).join('');}
export function themeOptions(){return Object.entries(themeNames).map(([key,label])=>`<option value="${key}"${key===currentTheme?' selected':''}>${t(label)}</option>`).join('');}
apply();
