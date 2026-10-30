import ts from 'typescript';
import {readFileSync} from 'node:fs';
const english=JSON.parse(readFileSync(new URL('../src/locales/en.json',import.meta.url),'utf8'));
const traditional=JSON.parse(readFileSync(new URL('../src/locales/zh-TW.json',import.meta.url),'utf8'));
const source=['main.ts','unified-editor.ts','package-info.ts','client-updater.ts'].map(name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8')).join('\n');
const tree=ts.createSourceFile('main.ts',source,ts.ScriptTarget.Latest,true);const phrases=new Set();
const pattern=/[\u3400-\u9fff][\u3400-\u9fffA-Za-z0-9_ ·／/…（）「」“”、。！？：；，,.%()↗↑↓—–:;+-]*/g;
function add(text){for(const part of text.matchAll(pattern))phrases.add(part[0].trim());}
function visit(node){
 if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node))add(node.text);
 ts.forEachChild(node,visit);
}
visit(tree);
const missing=[...phrases].filter(key=>!Object.hasOwn(english,key)||!Object.hasOwn(traditional,key));
if(missing.length)throw Error('Missing UI translations: '+JSON.stringify(missing));
if(Object.keys(english).some(key=>!Object.hasOwn(traditional,key)))throw Error('Locale catalogs have different keys');
console.log(`Verified ${phrases.size} interface phrases in English and Traditional Chinese`);
