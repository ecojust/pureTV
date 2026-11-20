import * as T from 'three';
import { floors, tile, enemies, keyNames, directions } from './tower.js';

const box = new T.BoxGeometry(), diamond = new T.OctahedronGeometry(1);
const drum = new T.CylinderGeometry(1, 1, 1, 8);
const cone = new T.ConeGeometry(1, 1, 8);
const robe = new T.CylinderGeometry(0.56, 1, 1, 7);
const ring = new T.TorusGeometry(1, 0.12, 8, 24);
const blockMaterial = new T.MeshStandardMaterial({ roughness: 0.8, flatShading: true });
const mat = new Map();
function material(color, lit) {
  const key = color + lit;
  if (!mat.has(key)) mat.set(key, lit ? new T.MeshBasicMaterial({ color }) :
    new T.MeshStandardMaterial({ color, roughness: 0.66, metalness: 0.14, flatShading: true }));
  return mat.get(key);
}
function mesh(parent, shape, color, x, y, z, sx, sy, sz, lit = false) {
  const part = new T.Mesh(shape, material(color, lit));
  part.position.set(x, y, z); part.scale.set(sx, sy, sz); parent.add(part);
  return part;
}
const colors = { y:'#ffd260', b:'#72d6ff', r:'#ff647c', a:'#ffb755', d:'#50cfff', h:'#ff5773' };
const themes = [
  ['#313d53','#4e606b','#83e7d1'], ['#523d48','#70605c','#ffae73'],
  ['#45405b','#68627b','#cab2ff'], ['#2c4b50','#557573','#75e2ff']
];

function fighter(kind, finalBoss) {
  const root = new T.Group(), hero = kind === 'player', beast = kind === 'g', mage = kind === 'w';
  const boss = kind === 'K';
  const coat = hero ? '#226e83' : mage ? '#704c93' : beast ? '#426649' : '#733f55';
  const armor = hero ? '#9ec7c9' : beast ? '#859d62' : '#b39487';
  const glow = hero ? '#7dfbea' : mage ? '#f6aaff' : '#ff835f';
  mesh(root, drum, '#24303b', 0, .055, 0, .31,.07,.25);
  mesh(root, robe, coat, 0,.35,0,.31,.52,.25);
  mesh(root, drum, armor, 0,.43,0,.27,.08,.23);
  for (const side of [-1,1]) {
    mesh(root, diamond, armor, side*.25,.51,.015,.15,.14,.15);
    mesh(root, box, coat, side*.28,.36,.03,.13,.24,.13);
  }
  mesh(root, diamond, armor, 0,.70,0,.25,.24,.24);
  mesh(root, box, '#182336', 0,.70,.182,.32,.11,.07);
  for (const side of [-1,1]) mesh(root, box, glow, side*.085,.71,.223,.06,.027,.012,true);
  if (mage) mesh(root, cone, '#9c75b1', 0,.95,0,.31,.48,.28);
  if (beast || boss) {
    for (const side of [-1,1]) {
      const horn = mesh(root, cone, '#ffd092', side*.16,.92,0,.07,.33,.07);
      horn.rotation.z = -side*.35;
    }
  }
  const arm = new T.Group(); arm.position.set(.30,.34,.12); root.add(arm);
  mesh(arm, drum,'#3a4452',0,.08,0,.044,.19,.044);
  mesh(arm, drum, armor,0,.175,0,.083,.045,.083);
  mesh(arm, mage ? diamond : drum, glow,0,.40,0,.038,.46,.038,true);
  arm.rotation.z = -.48;
  if (boss) root.scale.setScalar(finalBoss ? 1.48 : 1.26);
  root.userData.arm = arm;
  return root;
}

function prop(symbol, floorIndex) {
  if (enemies[symbol]) return fighter(symbol, floorIndex === 20);
  const root = new T.Group(), color = colors[symbol.toLowerCase()];
  if (symbol in keyNames) {
    const grip = mesh(root, ring, color, -.125,.34,.02,.12,.12,.12,true);
    grip.rotation.y = -.2;
    mesh(root, box, color, .07,.34,0,.23,.06,.05,true);
    mesh(root, box, color, .16,.29,0,.055,.1,.055,true);
  } else if ('YBR'.includes(symbol)) {
    for (const side of [-1,1]) mesh(root, box, '#a2937e', side*.33,.33,0,.11,.66,.17);
    mesh(root, box, '#393445', 0,.32,0,.59,.62,.15);
    mesh(root, box, color, 0,.54,.09,.58,.06,.06,true);
    mesh(root, diamond, color, 0,.31,.105,.10,.15,.045,true);
  } else if ('ad'.includes(symbol)) {
    mesh(root, drum, '#424457',0,.07,0,.19,.11,.19);
    mesh(root, diamond, color,0,.34,0,.172,.29,.172,true);
  } else if (symbol === 'h') {
    mesh(root, drum,'#ff6e80',0,.19,0,.15,.25,.15);
    mesh(root, drum,'#eee1c3',0,.35,0,.085,.10,.085);
    mesh(root, drum,'#ad7956',0,.42,0,.08,.06,.08);
  } else if (symbol === '$') {
    mesh(root, box,'#624736',0,.16,0,.75,.29,.48);
    for (const x of [-.30,.30]) mesh(root, box,'#cba477',x,.4,0,.055,.6,.06);
    mesh(root, robe,'#c17940',0,.71,0,.54,.18,.40);
    mesh(root, diamond,'#f8d76a',0,.32,0,.14,.21,.14,true);
  } else if (symbol === '*') {
    mesh(root, drum,'#c1924c',0,.20,0,.31,.26,.31);
    for (let i=0;i<6;i++) mesh(root, cone,'#ffe78f',Math.cos(i*Math.PI/3)*.21,.46,Math.sin(i*Math.PI/3)*.21,.09,.4,.09,true);
  } else if (symbol === '<' || symbol === '>') {
    for (let i=0;i<4;i++) {
      const y=(i+1)*.055;
      mesh(root,box,'#bcc9ba',0,y,.30-i*.19,.68,y*2,.19);
    }
    const arch = mesh(root, ring, symbol==='>'?'#93fff1':'#c8b2fa',0,.50,-.17,.40,.48,.11,true);
    arch.rotation.y = .05;
  }
  return root;
}

export class TowerScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new T.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
    this.scene = new T.Scene();
    this.camera = new T.OrthographicCamera(-7,7,5,-5,.1,100);
    this.camera.position.set(8.1,16,19.2); this.camera.lookAt(5,.05,5);
    this.scene.add(new T.HemisphereLight('#f6f5e4','#645775',1.7));
    const key = new T.DirectionalLight('#ffead3',2.8); key.position.set(-5,12,7); this.scene.add(key);
    const cool = new T.DirectionalLight('#9fdcff',1.1); cool.position.set(7,6,-4); this.scene.add(cool);
    this.field = new T.Group(); this.scene.add(this.field);
    this.hero = fighter('player'); this.scene.add(this.hero);
    this.aura = mesh(this.hero,ring,'#7dfbea',0,.04,0,.4,.4,.32,true);
    this.aura.rotation.x = -Math.PI/2;
    this.props = new Map();
  }

  build(run) {
    this.field.traverse(child => { if (child.isInstancedMesh) child.dispose(); });
    this.field.clear(); this.props.clear();
    const floorIndex=run.floor, palette=themes[Math.min(3, Math.floor(floorIndex/6))];
    const blocks=[], matrix=new T.Object3D();
    function brick(x,y,z,sx,sy,sz,color) {
      matrix.position.set(x,y,z); matrix.scale.set(sx,sy,sz); matrix.updateMatrix();
      blocks.push([matrix.matrix.clone(),new T.Color(color)]);
    }
    brick(5,-.62,5,11.22,.79,11.22,palette[0]);
    brick(5,-.87,5,11.34,.055,11.34,'#a48e6a');
    brick(5,-1,5,10.9,.18,10.9,'#343548');
    for (let z=0; z<11; z++) for (let x=0; x<11; x++) {
      const symbol = tile(run,x,z), hash=(x*23+z*7+floorIndex*13)%11;
      const tone=new T.Color(palette[1]).multiplyScalar(.57+hash*.034);
      brick(x,-.11,z,.985,.24,.985,tone);
      if (symbol==='#') {
        const outer=x===0||z===0||x===10||z===10;
        const height=outer?.42:.31;
        brick(x,height/2,z,.97,height,.97,palette[0]);
        brick(x,height+.035,z,.99,.07,.99,tone);
        if (outer && x%3===0 && z%3===0) {
          brick(x,.48,z,.55,.51,.55,palette[0]);
          brick(x,.76,z,.64,.07,.64,'#af9b7b');
          const flame = mesh(this.field,diamond,'#ffb36c',x,.96,z,.12,.24,.12,true);
          flame.rotation.z=.15;
        }
      } else {
        if (hash < 3) brick(x-.15,.017,z+.22,.27,.01,.022,'#87958c');
        if (symbol!=='.') {
          const object=prop(symbol,floorIndex);
          object.position.set(x,.02,z);
          this.field.add(object); this.props.set(z*11+x,{object,symbol});
        }
      }
    }
    const stone=new T.InstancedMesh(box,blockMaterial,blocks.length);
    blocks.forEach(([transform,color],i)=>{stone.setMatrixAt(i,transform);stone.setColorAt(i,color);});
    this.field.add(stone);
    this.floor=floorIndex; this.clearCount=run.clears[run.floor].length;
    this.hero.position.set(run.x,.04,run.z);
  }

  draw(run,time,dt) {
    if (this.floor!==run.floor || this.clearCount!==run.clears[run.floor].length) this.build(run);
    const w=this.canvas.clientWidth,h=this.canvas.clientHeight;
    if (!w || !h) return;
    if (w!==this.width || h!==this.height) {
      this.width=w; this.height=h; this.renderer.setSize(w,h,false);
      const v=Math.max(4.95,7.0*h/w);
      this.camera.top=v; this.camera.bottom=-v; this.camera.left=-v*w/h; this.camera.right=v*w/h;
      this.camera.updateProjectionMatrix();
    }
    const [dx,dz]=directions[run.facing] || directions.RIGHT;
    const follow=1-Math.exp(-dt*22);
    this.hero.position.x+=(run.x-this.hero.position.x)*follow;
    this.hero.position.z+=(run.z-this.hero.position.z)*follow;
    this.hero.rotation.y=Math.atan2(dx,dz);
    const duel=run.duel;
    this.hero.userData.arm.rotation.z=duel?.guard>0?1.05:-.48;
    this.hero.userData.arm.rotation.x=duel?.swing>0?Math.sin(duel.swing*14)*1.9:0;
    for (const {object,symbol} of this.props.values()) {
      if ('ybrad*'.includes(symbol)) {
        object.rotation.y=Math.sin(time*1.6)*.55;
        object.position.y=.08+.04*Math.sin(time*2.4+object.position.x);
      } else if (enemies[symbol]) {
        object.position.y=.04+Math.sin(time*2+object.position.x)*.022;
        if (duel && object.position.x===duel.x && object.position.z===duel.z) {
          object.rotation.y=Math.atan2(-dx,-dz);
          object.userData.arm.rotation.x=duel.timer<.4?-1.5:0;
        }
      }
    }
    this.renderer.render(this.scene,this.camera);
  }
}
