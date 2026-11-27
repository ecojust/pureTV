import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,readdirSync,cpSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {localize} from './src/localize.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const source=JSON.parse(readFileSync(join(root,'upstream.json'),'utf8'));
const temp=mkdtempSync(join(tmpdir(),'puretv-starfall-'));
const dist=join(temp,'dist');
function files(dir) {
  return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]).sort();
}
function replace(code,before,after) {
  if (!code.includes(before)) throw new Error('Upstream source mismatch: '+before);
  return code.replace(before,after);
}
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
try {
  const upstream=process.env.STARFALL_UPSTREAM ? resolve(process.env.STARFALL_UPSTREAM) : join(temp,'upstream');
  if (!process.env.STARFALL_UPSTREAM) {
    mkdirSync(upstream);
    git('-C',upstream,'init','-q');git('-C',upstream,'remote','add','origin',source.upstream);
    git('-C',upstream,'fetch','-q','--depth=1','origin',source.commit);
    git('-C',upstream,'checkout','--quiet','--detach',source.commit);
  }
  if (git('-C',upstream,'rev-parse','HEAD')!==source.commit || git('-C',upstream,'diff','--name-only','HEAD','--','src','public/audio','LICENSE')) throw Error('Expected unmodified upstream sources at '+source.commit);
  mkdirSync(dist);
  await build({
    entryPoints:[join(upstream,'src/main.ts')],outfile:join(dist,'starfall.js'),bundle:true,minify:true,
    logOverride:{'commonjs-variable-in-esm':'silent'},target:'es2020',format:'iife',legalComments:'eof',nodePaths:[join(root,'node_modules')],
    alias:{'puretv-input-bridge':join(root,'../shared/web/input.js'),'puretv-starfall-controller':join(root,'src/controller.js'),'puretv-starfall-device':join(root,'src/device.js')},
    define:{'import.meta.env.BASE_URL':'"./"','import.meta.env.DEV':'false','import.meta.env':'{"BASE_URL":"./","DEV":false}'},
    plugins:[{name:'starfall-offline',setup(b){
      b.onLoad({filter:/\.ts$/},({path})=>{
        if(!path.startsWith(join(upstream,'src')+'/'))return;
        const file=relative(upstream,path);
        let code=readFileSync(path,'utf8');
        if(file==='src/main.ts'){
          code="import {createTV} from 'puretv-starfall-controller';\n"+code;
          code=replace(code,'const game = new Game();','const game = new Game();\nconst tv = createTV(game);');
          code=replace(code,'this.accumulator += dtRaw;','if (tv.playing) this.accumulator += dtRaw;');
          code=replace(code,'this.controls.update(dtRaw);','if (tv.playing) this.controls.update(dtRaw);');
          code=replace(code,'createTextures(this.stage.renderer);','createTextures(this.stage.renderer, this.quality);');
          code=replace(code,'await this.library.preload(', 'if (this.quality.preset > 0) await this.library.preload(');
        } else if(file==='src/render/textures.ts'){
          code=replace(code,'createTextures(renderer: THREE.WebGLRenderer)', 'createTextures(renderer: THREE.WebGLRenderer, quality?: QualitySettings)');
          code=replace(code,'new ProceduralTextures(renderer);','new ProceduralTextures(renderer, quality);');
          code=replace(code,'[1024, 2048, 2048, 2048]','[256, 2048, 2048, 2048]');
          code=replace(code,'[512, 1024, 1024, 1024]','[128, 1024, 1024, 1024]');
        } else if(file==='src/world/backdrop.ts'){
          code=replace(code,'cube: 512, detailOct: 0','cube: 96, detailOct: 0');
        } else if(file==='src/render/renderer.ts'){
          code="import {chooseDeviceQuality} from 'puretv-starfall-device';\n"+code;
          code=replace(code,'this.renderer.setPixelRatio(quality.pixelRatio);','chooseDeviceQuality(this.renderer.getContext(), quality);\n    this.renderer.setPixelRatio(quality.pixelRatio);');
        }
        return {contents:localize(file,code),loader:'ts',resolveDir:dirname(path)};
      });
    }}],
  });
  cpSync(join(upstream,'public/audio'),join(dist,'audio'),{recursive:true});
  for(const name of ['tv.css','tv.html']) cpSync(join(root,'src',name),join(dist,name));
  cpSync(join(root,'NOTICE.md'),join(dist,'NOTICE.txt'));
  cpSync(join(root,'LICENSE'),join(dist,'LICENSE.txt'));
  cpSync(join(root,'node_modules/three/LICENSE'),join(dist,'three-LICENSE.txt'));
  const target=join(root,'dist');
  const tree=dir=>files(dir).map(path=>[relative(dir,path),createHash('sha256').update(readFileSync(path)).digest('hex')]);
  if(process.argv.includes('--check')){
    if(JSON.stringify(tree(dist))!==JSON.stringify(tree(target)))throw Error('dist differs from reproducible build');
  }else{
    rmSync(target,{recursive:true,force:true});
    cpSync(dist,target,{recursive:true});
  }
}finally{rmSync(temp,{recursive:true,force:true});}
