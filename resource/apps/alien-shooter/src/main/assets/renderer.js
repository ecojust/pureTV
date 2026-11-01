/* Alien Shooter TV — original low-poly models, local procedural materials.
 * World X/Y maps to Three X/Z. The orthographic camera never rotates sideways,
 * so screen-right and screen-down are the same directions as the controller.
 * Static objects are merged by material; animated creatures use bounded instance
 * pools. Rendering does not advance or mutate the game simulation. */
(function (root) {
  'use strict';
  var T = root.THREE, TAU = Math.PI * 2;
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function finite(n, fallback) { return Number.isFinite(n) ? n : fallback; }
  function random(seed) { return function () { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
  function canvas(width, height) { var c = document.createElement('canvas'); c.width = width; c.height = height || width; return c; }
  function compose(x, y, z, sx, sy, sz, rx, ry, rz) {
    return new T.Matrix4().compose(new T.Vector3(x || 0, y || 0, z || 0), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0)), new T.Vector3(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz));
  }
  function part(list, geometry, color, x, y, z, sx, sy, sz, rx, ry, rz) {
    list.push({ geometry: geometry, color: color, matrix: compose(x, y, z, sx, sy, sz, rx, ry, rz) });
  }
  function merge(parts, projectedUV, atlas) {
    var positions = [], normals = [], colors = [], uvs = [], atlasRects = [];
    parts.forEach(function (p) {
      var g = p.geometry.index ? p.geometry.toNonIndexed() : p.geometry.clone();
      g.applyMatrix4(p.matrix);
      var a = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, col = new T.Color(p.color === undefined ? 0xffffff : p.color).convertSRGBToLinear();
      for (var i = 0; i < a.count; i++) {
        positions.push(a.getX(i), a.getY(i), a.getZ(i));
        normals.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
        var shade = 1;
        if (atlas && !p.unlit) {
          // Static directional irradiance and contact shading are baked once into
          // vertex colors. Atlas paint/edge AO provides the small surface detail.
          var light = Math.max(0, (-.444 * n.getX(i) + .778 * n.getY(i) - .444 * n.getZ(i)));
          var fill = Math.max(0, (.72 * n.getX(i) + .43 * n.getY(i) + .54 * n.getZ(i)));
          shade = (.58 + light * .42 + fill * .12) * (.83 + .17 * clamp(a.getY(i) / .6, 0, 1));
        }
        colors.push(col.r * shade, col.g * shade, col.b * shade);
        if (atlas) {
          var tile = p.topTile && n.getY(i) > .5 ? p.topTile : (p.tile || 'white');
          var rect = atlas[tile] || atlas.white;
          atlasRects.push(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
        }
        var projection = p.projectedUV === undefined ? projectedUV : p.projectedUV;
        if (projection) {
          var nx = n ? Math.abs(n.getX(i)) : 0, ny = n ? Math.abs(n.getY(i)) : 1, nz = n ? Math.abs(n.getZ(i)) : 0;
          if (ny >= nx && ny >= nz) uvs.push(a.getX(i) / projection, a.getZ(i) / projection);
          else if (nx >= nz) uvs.push(a.getZ(i) / projection, a.getY(i) / projection);
          else uvs.push(a.getX(i) / projection, a.getY(i) / projection);
        } else uvs.push(clamp(uv ? uv.getX(i) : 0, 0, .9999) + (p.rig || 0) * 2, uv ? uv.getY(i) : 0);
      }
      g.dispose();
    });
    var result = new T.BufferGeometry();
    result.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    result.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
    result.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    result.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    if (atlas) result.setAttribute('atlasRect', new T.Float32BufferAttribute(atlasRects, 4));
    result.computeBoundingSphere();
    return result;
  }
  function angleDelta(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }
  function angleToward(a, b, rate) { return a + angleDelta(b, a) * rate; }
  function bone(list, geometry, color, from, to, width, depth, group) {
    var mid = new T.Vector3().fromArray(from).add(new T.Vector3().fromArray(to)).multiplyScalar(.5);
    var direction = new T.Vector3().fromArray(to).sub(new T.Vector3().fromArray(from));
    var matrix = new T.Matrix4().compose(mid, new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), direction.clone().normalize()), new T.Vector3(width, direction.length(), depth || width));
    list.push({ geometry: geometry, color: color, matrix: matrix, rig: group });
  }
  function rigPart(list, geometry, color, group, x, y, z, sx, sy, sz, rx, ry, rz) {
    part(list, geometry, color, x, y, z, sx, sy, sz, rx, ry, rz); list[list.length - 1].rig = group;
  }
  function legSpec(hip, knee, foot, offset, bend) { return { hip: hip, knee: knee, foot: foot, offset: offset, bend: bend || [1, 0, 0] }; }
  function armSpec(shoulder, elbow, hand, bend) { return { shoulder: shoulder, elbow: elbow, hand: hand, bend: bend || [0, -1, 0] }; }
  var ACTOR_RIGS = {
    human: { kind: 0, nominalSpeed: 4.6, sweep: .92, walkDuty: .66, runDuty: .42, lift: .23, drop: .085, bob: .025, lean: .075, turn: 10, head: [0, 1.5, 0], tail: [], legs: [
      legSpec([0, 1.02, -.16], [.21, .56, -.17], [.04, .10, -.18], 0), legSpec([0, 1.02, .16], [.21, .56, .17], [.04, .10, .18], .5)
    ], arms: [armSpec([0, 1.43, -.25], [.14, 1.12, -.32], [.60, 1.28, -.04], [0, -.6, -1]), armSpec([0, 1.43, .25], [.10, 1.13, .32], [.42, 1.27, .05], [0, -.6, 1])] },
    crawler: { kind: 1, nominalSpeed: 1.65, sweep: .64, walkDuty: .72, runDuty: .64, lift: .15, drop: .025, bob: .025, lean: .035, turn: 7, head: [.45, .49, 0], tail: [[-.45,.42,0],[-.88,.28,0],[-1.18,.19,0],[-1.42,.13,0]], legs: [
      legSpec([.36,.43,-.24],[.22,.22,-.77],[.63,.055,-.72],0,[-1,-.3,-1]),legSpec([.36,.43,.24],[.22,.22,.77],[.63,.055,.72],.5,[-1,-.3,1]),
      legSpec([-.38,.45,-.25],[-.19,.23,-.79],[-.62,.055,-.72],.5,[.9,-.3,-1]),legSpec([-.38,.45,.25],[-.19,.23,.79],[-.62,.055,.72],0,[.9,-.3,1])
    ], arms: [] },
    runner: { kind: 2, nominalSpeed: 2.8, sweep: .82, walkDuty: .58, runDuty: .40, lift: .25, drop: .07, bob: .055, lean: .11, turn: 12, head: [.40, 1.0, 0], tail: [[-.37,.68,0],[-.85,.56,0],[-1.24,.38,0],[-1.61,.24,0]], legs: [
      legSpec([-.16,.83,-.17],[-.46,.43,-.22],[.12,.07,-.25],0,[-1,0,-.1]),legSpec([-.16,.83,.17],[-.46,.43,.22],[.12,.07,.25],.5,[-1,0,.1])
    ], arms: [armSpec([.35,.91,-.21],[.45,.66,-.55],[.85,.39,-.39],[0,-.4,-1]),armSpec([.35,.91,.21],[.45,.66,.55],[.85,.39,.39],[0,-.4,1])] },
    spitter: { kind: 3, nominalSpeed: 1.25, sweep: .58, walkDuty: .79, runDuty: .72, lift: .12, drop: .02, bob: .035, lean: .025, turn: 5, head: [.42,.60,0], tail: [[-.52,.51,0],[-.92,.33,0],[-1.19,.19,0],[-1.38,.12,0]], legs: [
      legSpec([.38,.47,-.27],[.52,.32,-.92],[.65,.06,-.76],0,[0,.1,-1]),legSpec([.38,.47,.27],[.52,.32,.92],[.65,.06,.76],.52,[0,.1,1]),
      legSpec([-.45,.52,-.32],[-.70,.34,-1.05],[-.62,.06,-.88],.30,[-.2,.1,-1]),legSpec([-.45,.52,.32],[-.70,.34,1.05],[-.62,.06,.88],.80,[-.2,.1,1])
    ], arms: [] },
    brute: { kind: 4, nominalSpeed: .94, sweep: .72, walkDuty: .73, runDuty: .67, lift: .17, drop: .045, bob: .04, lean: .035, turn: 4, head: [.38,1.35,0], tail: [[-.43,.69,0],[-.78,.46,0],[-1.08,.31,0],[-1.30,.21,0]], legs: [
      legSpec([-.08,.79,-.30],[.36,.43,-.36],[.14,.09,-.39],0,[1,0,-.15]),legSpec([-.08,.79,.30],[.36,.43,.36],[.14,.09,.39],.5,[1,0,.15])
    ], arms: [armSpec([.04,1.33,-.49],[.30,.87,-.85],[.59,.35,-.61],[0,-.2,-1]),armSpec([.04,1.33,.49],[.30,.87,.85],[.59,.35,.61],[0,-.2,1])] },
    boss: { kind: 5, nominalSpeed: .82, sweep: .84, walkDuty: .78, runDuty: .71, lift: .20, drop: .045, bob: .045, lean: .04, turn: 2.8, head: [.43,1.53,0], tail: [[-.48,.81,0],[-.96,.55,0],[-1.37,.31,0],[-1.76,.19,0]], legs: [
      legSpec([-.12,.86,-.36],[.40,.46,-.44],[.17,.10,-.47],0,[1,0,-.18]),legSpec([-.12,.86,.36],[.40,.46,.44],[.17,.10,.47],.5,[1,0,.18])
    ], arms: [armSpec([.03,1.53,-.62],[.36,1.02,-1.00],[.88,.42,-.78],[0,-.2,-1]),armSpec([.03,1.53,.62],[.36,1.02,1.00],[.88,.42,.78],[0,-.2,1])] }
  };
  var RIG_SHADER = [
    'uniform float rigTime; uniform float rigMuzzle; uniform vec4 rigGait; uniform vec4 rigBody; uniform vec3 rigHead;',
    'uniform vec3 rigHip[4]; uniform vec3 rigKnee[4]; uniform vec3 rigFoot[4]; uniform vec3 rigBend[4]; uniform vec4 rigLeg[4];',
    'uniform vec3 rigShoulder[2]; uniform vec3 rigElbow[2]; uniform vec3 rigHand[2]; uniform vec3 rigArmBend[2]; uniform vec2 rigArmLength[2];',
    'uniform vec3 rigTail[4]; uniform vec3 rigSupportHand; uniform vec3 rigTriggerHand;',
    'vec3 alienRotateY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);}',
    'vec3 alienRotateZ(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);}',
    'vec3 alienRotateX(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}',
    'vec3 alienBetween(vec3 p,vec3 from,vec3 to){vec3 a=normalize(from),b=normalize(to);float c=clamp(dot(a,b),-1.0,1.0);vec3 v=cross(a,b);float s=length(v);if(s<.00001){if(c>0.)return p;vec3 axis=normalize(cross(a,abs(a.y)<.9?vec3(0.,1.,0.):vec3(1.,0.,0.)));return 2.*axis*dot(axis,p)-p;}vec3 axis=v/s;return p*c+cross(axis,p)*s+axis*dot(axis,p)*(1.-c);}',
    'vec3 alienKnee(vec3 h,vec3 f,vec3 bend,vec2 lengths){vec3 d=f-h;float dist=clamp(length(d),.015,lengths.x+lengths.y-.001);vec3 axis=normalize(d);float a=(lengths.x*lengths.x-lengths.y*lengths.y+dist*dist)/(2.*dist);vec3 side=bend-axis*dot(bend,axis);if(dot(side,side)<.001)side=vec3(0.,0.,1.)-axis*axis.z;return h+axis*a+normalize(side)*sqrt(max(.000001,lengths.x*lengths.x-a*a));}',
    'float alienAmount(vec4 pose){return clamp(pose.y,0.,1.25);} float alienWeight(vec4 pose){return clamp(pose.y*3.,0.,1.);}',
    'float alienBob(vec4 pose){float a=alienAmount(pose);return pose.x>=4.?0.:-rigBody.x*a+rigBody.y*sin(fract(pose.x)*12.5663706)*a+sin(rigTime*2.2)*.007*(1.-clamp(a*2.,0.,1.));}',
    'void alienBody(inout vec3 p,inout vec3 n,vec4 pose,float yaw){float a=alienAmount(pose);p=alienRotateY(p,yaw);n=alienRotateY(n,yaw);float lean=-rigBody.z*a*cos(pose.z);p-=vec3(0.,.8,0.);p=alienRotateZ(p,lean);n=alienRotateZ(n,lean);float side=rigBody.z*.45*a*sin(pose.z);p=alienRotateX(p,side);n=alienRotateX(n,side);p+=vec3(0.,.8+alienBob(pose),0.);}',
    'void alienRigTransform(inout vec3 p,inout vec3 n,float group,vec4 pose){',
    'p.x+=rigMuzzle;float kind=rigBody.w, amount=alienAmount(pose), weight=alienWeight(pose), phase=fract(pose.x), yaw=pose.w;',
    'if(group>=10.&&group<22.){',
    'int leg=int(floor((group-10.)/3.+.01));float segment=mod(group-10.,3.);vec3 h0=rigHip[leg],k0=rigKnee[leg],f0=rigFoot[leg];',
    'float duty=mix(rigGait.y,rigGait.z,clamp(amount,0.,1.));float t=fract(phase+rigLeg[leg].x);float sweep=rigGait.x*mix(.65,1.,clamp(amount,0.,1.))*weight;float forward;float lift=0.;float roll=0.;',
    'if(t<duty)forward=sweep*(.5-t/duty);else{float u=(t-duty)/(1.-duty);forward=sweep*(u*u*(3.-2.*u)-.5);lift=sin(u*3.14159265)*rigGait.w*weight;roll=-sin(u*3.14159265)*.26*weight;}',
    'vec3 h=h0;vec3 hn=vec3(0.,1.,0.);alienBody(h,hn,pose,yaw);vec3 f=alienRotateY(f0,yaw)+vec3(cos(pose.z)*forward,lift,sin(pose.z)*forward);vec3 bend=alienRotateY(rigBend[leg],yaw);vec3 k=alienKnee(h,f,bend,rigLeg[leg].yz);',
    'if(segment<.5){p=alienBetween(p-h0,k0-h0,k-h)+h;n=alienBetween(n,k0-h0,k-h);}else if(segment<1.5){p=alienBetween(p-k0,f0-k0,f-k)+k;n=alienBetween(n,f0-k0,f-k);}else{p=alienRotateY(alienRotateZ(p-f0,roll),yaw)+f;n=alienRotateY(alienRotateZ(n,roll),yaw);}',
    '}else if(group>=40.&&group<46.){',
    'int arm=int(floor((group-40.)/3.+.01));float segment=mod(group-40.,3.);vec3 h0=rigShoulder[arm],k0=rigElbow[arm],f0=rigHand[arm],f=f0;',
    'if(kind<.5)f=arm==0?rigSupportHand:rigTriggerHand;else{float counter=sin(phase*6.2831853+float(arm)*3.14159265)*weight;f+=vec3(counter*.10,abs(counter)*.04,0.);}',
    'vec3 k=alienKnee(h0,f,rigArmBend[arm],rigArmLength[arm]);if(segment<.5){p=alienBetween(p-h0,k0-h0,k-h0)+h0;n=alienBetween(n,k0-h0,k-h0);}else if(segment<1.5){p=alienBetween(p-k0,f0-k0,f-k)+k;n=alienBetween(n,f0-k0,f-k);}else p+=f-f0;',
    'alienBody(p,n,pose,kind<.5?0.:yaw);',
    '}else if(group>=30.&&group<33.){',
    'int segment=int(group-30.);vec3 start=rigTail[0];vec3 oldStart=rigTail[0];float turn=0.;for(int j=0;j<3;j++){vec3 delta=rigTail[j+1]-rigTail[j];float bend=sin(phase*6.2831853-float(j)*.65)*weight*.07-sin(yaw)*.20;turn+=bend;if(j==segment){p=alienRotateY(p-rigTail[j],turn)+start;n=alienRotateY(n,turn);break;}start+=alienRotateY(delta,turn);}',
    'alienBody(p,n,pose,yaw);',
    '}else if(group>1.5&&group<2.5&&kind>.5){vec3 h=alienRotateY(rigHead,yaw);p=p-rigHead+h;alienBody(p,n,pose,0.);}',
    'else alienBody(p,n,pose,kind<.5?(group>.5?yaw:0.):yaw);',
    'if(pose.x>=4.){p=vec3(p.x,.15-p.z*.13,p.y-.6);n=normalize(vec3(n.x,-n.z/.13,n.y));}',
    '}',
    'vec3 alienRigPosition(vec3 p,float group,vec4 pose){vec3 n=vec3(0.,1.,0.);alienRigTransform(p,n,group,pose);return p;}'
  ].join('\n');

  var PALETTES = [
    { floor: '#65716e', plate: '#5b6663', metal: 0x72827e, trim: 0xe2b75b, light: 0xffc877, shadow: 0x101c1a, label: 'CARGO / SECTOR 01' },
    { floor: '#73868a', plate: '#697b7f', metal: 0x8aafb5, trim: 0x79ded5, light: 0x8bffe5, shadow: 0x111d24, label: 'BIOLAB / SECTOR 02' },
    { floor: '#5c6369', plate: '#525b62', metal: 0x7e8794, trim: 0xef8548, light: 0xff854d, shadow: 0x1c1419, label: 'REACTOR / SECTOR 03' }
  ];
  function floorTexture(stage) {
    var p = PALETTES[stage], c = canvas(1024), g = c.getContext('2d'), r = random(7182 + stage * 137);
    g.fillStyle = p.floor; g.fillRect(0, 0, 1024, 1024);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      var x = i * 256, y = j * 256;
      g.fillStyle = p.plate; g.fillRect(x + 4, y + 4, 248, 248);
      var grad = g.createLinearGradient(x, y, x + 256, y + 256); grad.addColorStop(0, 'rgba(255,255,255,.06)'); grad.addColorStop(1, 'rgba(0,0,0,.09)');
      g.fillStyle = grad; g.fillRect(x + 5, y + 5, 246, 246);
      g.strokeStyle = 'rgba(7,17,20,.6)'; g.lineWidth = 4; g.strokeRect(x + 3, y + 3, 250, 250);
      g.strokeStyle = 'rgba(215,228,216,.18)'; g.lineWidth = 1; g.strokeRect(x + 6, y + 6, 244, 244);
      [[14, 14], [242, 14], [14, 242], [242, 242]].forEach(function (v) {
        g.fillStyle = '#273432'; g.beginPath(); g.arc(x + v[0], y + v[1], 4, 0, TAU); g.fill();
        g.fillStyle = '#9ba49b'; g.fillRect(x + v[0] - 2, y + v[1] - 2, 3, 1);
      });
      if ((i + j) % 4 === 1) {
        for (var k = 0; k < 12; k++) { g.fillStyle = 'rgba(7,18,19,.4)'; g.fillRect(x + 36, y + 40 + k * 14, 184, 5); g.fillStyle = 'rgba(170,187,176,.2)'; g.fillRect(x + 36, y + 45 + k * 14, 184, 1); }
      } else if (stage === 2) {
        g.strokeStyle = 'rgba(160,172,174,.13)'; g.lineWidth = 3;
        for (k = 20; k < 244; k += 28) { g.beginPath(); g.moveTo(x + 20, y + k); g.lineTo(x + 244, y + k - 12); g.stroke(); }
      }
    }
    var img = g.getImageData(0, 0, 1024, 1024);
    for (i = 0; i < img.data.length; i += 4) { var d = (r() - .5) * 24; img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d; }
    g.putImageData(img, 0, 0);
    for (i = 0; i < 120; i++) {
      var cx = r() * 1024, cy = r() * 1024, rad = 12 + r() * 80, stain = g.createRadialGradient(cx, cy, 1, cx, cy, rad);
      stain.addColorStop(0, 'rgba(27,25,14,' + (.09 + r() * .23) + ')'); stain.addColorStop(1, 'rgba(27,25,14,0)'); g.fillStyle = stain; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    for (i = 0; i < 420; i++) { x = r() * 1024; y = r() * 1024; g.strokeStyle = r() < .7 ? 'rgba(18,28,27,.3)' : 'rgba(184,198,182,.25)'; g.lineWidth = .5 + r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3 + r() * 30, y - r() * 8); g.stroke(); }
    return c;
  }
  function metalTexture() {
    var c = canvas(512), g = c.getContext('2d'), r = random(191);
    g.fillStyle = '#98a5a5'; g.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 512; i++) { g.fillStyle = 'rgba(30,48,49,' + r() * .08 + ')'; g.fillRect(0, i, 512, 1); }
    for (i = 0; i < 4; i++) { g.fillStyle = '#3b4a4c'; g.fillRect(i * 128, 0, 3, 512); g.fillStyle = '#bfcbca'; g.fillRect(i * 128 + 4, 0, 1, 512); }
    for (i = 0; i < 60; i++) { g.fillStyle = 'rgba(59,43,29,.13)'; g.fillRect(r() * 512, r() * 512, 2, 4 + r() * 36); }
    return c;
  }
  function skinTexture() {
    var c = canvas(512), g = c.getContext('2d'), r = random(5718);
    g.fillStyle = '#c3c1a1'; g.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 2100; i++) {
      var x = r() * 512, y = r() * 512, a = r() * TAU, size = 2 + r() * 11;
      g.fillStyle = r() < .6 ? 'rgba(45,51,32,.22)' : 'rgba(229,219,167,.22)';
      g.beginPath(); g.ellipse(x, y, size, size * .45, a, 0, TAU); g.fill();
    }
    for (i = 0; i < 100; i++) {
      x = r() * 512; y = r() * 512; g.strokeStyle = 'rgba(40,50,34,.21)'; g.lineWidth = .8 + r(); g.beginPath(); g.moveTo(x, y);
      for (var n = 0; n < 6; n++) { x += (r() - .4) * 16; y += 5 + r() * 10; g.lineTo(x, y); } g.stroke();
    }
    return c;
  }
  function blobTexture(kind) {
    var c = canvas(128), g = c.getContext('2d'), r = random(487);
    if (kind === 'blood') {
      g.fillStyle = 'white';
      for (var i = 0; i < 32; i++) { var a = r() * TAU, d = r() * 42, size = 2 + r() * 14; g.beginPath(); g.ellipse(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, size, size * .55, a, 0, TAU); g.fill(); }
    } else {
      var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, kind === 'glow' ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,.65)'); grad.addColorStop(.3, kind === 'glow' ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.4)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    }
    return c;
  }
  function stencilTexture() {
    var c = canvas(1024, 512), g = c.getContext('2d');
    g.clearRect(0, 0, 1024, 512); g.fillStyle = '#d8d1ae'; g.font = '900 70px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['CARGO 01', 'BIOLAB 02', 'CORE 03'].forEach(function (s, i) { g.fillText(s, 512, 70 + i * 150); });
    return c;
  }
  function Renderer(target, options) {
    this.canvas = target; this.options = options || {}; this.width = 1280; this.height = 720;
    this.geometries = []; this.materials = []; this.textures = []; this.worldGeometries = [];
    this.stats = { mode: 'webgl', calls: 0, triangles: 0, frames: 0, renderedEnemies: 0, culledEnemies: 0, renderedCorpses: 0, culledCorpses: 0, uploadedInstances: 0 };
    this.pendingTextures = 0; this.textureRevision = 0; this.baked = root.AlienShooterBaked || null; this.active = false; this.failed = false; this.disposed = false; this.error = '';
    this.actorStates = new Map(); this.actorFrame = 0;
    this.cameraCenter = { x: 8, y: 17 }; this.viewHeight = 18; this.time = 0; this.map = null; this.stage = -1;
    if (!T) { this.failed = true; this.error = 'Local Three.js library is unavailable'; return; }
    try {
      var gl = target.getContext('webgl', { alpha: false, antialias: true, depth: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
      if (!gl) throw new Error('WebGL is unavailable');
      this.renderer = new T.WebGLRenderer({ canvas: target, context: gl, antialias: true, alpha: false, preserveDrawingBuffer: false });
      this.renderer.setPixelRatio(1); this.renderer.outputEncoding = T.sRGBEncoding; this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = .94;
      this.scene = new T.Scene(); this.scene.background = new T.Color(0x0b1419);
      this.camera = new T.OrthographicCamera(-18, 18, 11, -11, .1, 180);
      this.scene.add(new T.HemisphereLight(0xc3dce0, 0x1d292e, .53));
      this.keyLight = new T.DirectionalLight(0xffd9ad, .9); this.keyLight.position.set(-20, 35, -20); this.scene.add(this.keyLight);
      this.fillLight = new T.DirectionalLight(0x689fb7, .34); this.fillLight.position.set(20, 12, 10); this.scene.add(this.fillLight);
      this.world = new T.Group(); this.dynamic = new T.Group(); this.scene.add(this.world, this.dynamic);
      this.dummy = new T.Object3D(); this.color = new T.Color(); this.raycaster = new T.Raycaster(); this.groundPlane = new T.Plane(new T.Vector3(0, 1, 0), 0); this.hitPoint = new T.Vector3();
      this.frustum = new T.Frustum(); this.viewProjection = new T.Matrix4(); this.cullSphere = new T.Sphere(new T.Vector3(), 1);
      this.buildMaterials(); this.buildModels(); this.buildEffects(); this.resize(target.width || 1280, target.height || 720);
      var self = this;
      this._lost = function (event) { event.preventDefault(); self.contextLost = true; self.active = false; self.releaseGpuResources(); self.error = 'Graphics context lost'; self.canvas.setAttribute('data-renderer', 'unavailable'); };
      this._restored = function () { if (!self.disposed) { self.contextLost = false; self.error = ''; self.canvas.setAttribute('data-renderer', 'webgl'); } };
      target.addEventListener('webglcontextlost', this._lost); target.addEventListener('webglcontextrestored', this._restored); target.setAttribute('data-renderer', 'webgl');
    } catch (error) { this.failed = true; this.error = String(error.message || error); target.setAttribute('data-renderer', 'unavailable'); }
  }
  Renderer.prototype.releaseGpuResources = function () {
    // Three r124 rebuilds its GL caches after restoration. Dispose listeners
    // from the lost context must be released while that context is still lost;
    // otherwise a later map change tries to delete its stale WebGLBuffer handles.
    // dispose() preserves CPU arrays/images, rig uniforms and locomotion state,
    // which Three uploads normally when the real context is restored.
    this.worldGeometries.forEach(function (g) { g.dispose(); });
    this.geometries.forEach(function (g) { g.dispose(); });
    this.materials.forEach(function (m) { m.dispose(); });
    this.textures.forEach(function (t) { t.dispose(); });
    this.dynamic.children.forEach(function (mesh) { if (mesh.isInstancedMesh && mesh.dispose) mesh.dispose(); });
  };
  Renderer.prototype.geometry = function (g) { this.geometries.push(g); return g; };
  Renderer.prototype.texture = function (image, repeat) {
    var t = new T.CanvasTexture(image); t.encoding = T.sRGBEncoding; t.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
    this.textures.push(t); return t;
  };
  Renderer.prototype.bakedTexture = function (url, repeat, linear) {
    var self = this, key = url + ':' + !!repeat + ':' + !!linear;
    this.bakedTextures = this.bakedTextures || {};
    if (this.bakedTextures[key]) return this.bakedTextures[key];
    var image = this.baked.images && this.baked.images[url], texture;
    if (image) { texture = new T.Texture(image); texture.needsUpdate = true; }
    else {
      this.pendingTextures++;
      texture = new T.TextureLoader().load(url, function () { self.pendingTextures--; self.textureRevision++; }, undefined, function () {
        self.pendingTextures--; self.failed = true; self.active = false; self.error = 'Baked texture could not be loaded: ' + url;
      });
    }
    texture.flipY = false; texture.encoding = linear ? T.LinearEncoding : T.sRGBEncoding;
    texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
    if (repeat) texture.wrapS = texture.wrapT = T.RepeatWrapping;
    this.textures.push(texture); this.bakedTextures[key] = texture; return texture;
  };
  Renderer.prototype.atlasMaterial = function (material, mode, tile) {
    var rect = tile && this.baked.atlas.tiles[tile];
    material.onBeforeCompile = function (shader) {
      var declaration;
      if (mode === 'uniform') {
        shader.uniforms.atlasRect = { value: new T.Vector4(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]) };
        declaration = 'uniform vec4 atlasRect;\n';
      } else {
        var attribute = mode === 'instance' ? 'instanceAtlasRect' : 'atlasRect';
        shader.vertexShader = 'attribute vec4 ' + attribute + ';\nvarying vec4 vAtlasRect;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvAtlasRect = ' + attribute + ';');
        declaration = 'varying vec4 vAtlasRect;\n';
      }
      var selected = mode === 'uniform' ? 'atlasRect' : 'vAtlasRect';
      shader.fragmentShader = declaration + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#ifdef USE_MAP\nvec2 atlasUv = ' + selected + '.xy + fract(vUv) * ' + selected + '.zw;\nvec4 texelColor = texture2D(map, atlasUv);\ntexelColor = mapTexelToLinear(texelColor);\ndiffuseColor *= texelColor;\n#endif');
    };
    material.customProgramCacheKey = function () { return 'alien-atlas-v2-' + mode + '-' + (tile || ''); };
    return material;
  };
  Renderer.prototype.material = function (params, basic) {
    var m = basic ? new T.MeshBasicMaterial(params) : new T.MeshPhongMaterial(params);
    if (m.color) m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); this.materials.push(m); return m;
  };
  Renderer.prototype.buildMaterials = function () {
    var self = this;
    this.box = this.geometry(new T.BoxBufferGeometry(1, 1, 1)); this.sphere = this.geometry(new T.SphereBufferGeometry(1, 8, 5));
    this.cylinder = this.geometry(new T.CylinderBufferGeometry(1, 1, 1, 8)); this.limbCylinder = this.geometry(new T.CylinderBufferGeometry(1, 1, 1, 6)); this.cone = this.geometry(new T.ConeBufferGeometry(1, 1, 6));
    this.tailSegment = this.geometry(new T.CylinderBufferGeometry(.72, 1, 1, 6, 1, true));
    this.shirt = this.geometry(new T.CylinderBufferGeometry(1, .76, 1, 8));
    this.boot = this.geometry(new T.CylinderBufferGeometry(1, 1, 1, 8));
    var bootPosition = this.boot.attributes.position;
    for (var bv = 0; bv < bootPosition.count; bv++) if (bootPosition.getX(bv) > .3 && bootPosition.getY(bv) > 0) bootPosition.setY(bv, .25);
    this.boot.computeVertexNormals();
    this.detailSphere = this.geometry(new T.SphereBufferGeometry(1, 6, 3));
    this.torus = this.geometry(new T.TorusBufferGeometry(1, .065, 4, 16));
    this.plane = this.geometry(new T.PlaneBufferGeometry(1, 1)); this.ring = this.geometry(new T.RingBufferGeometry(.82, 1, 28));
    [this.box, this.sphere, this.cylinder, this.cone, this.plane, this.ring, this.torus].forEach(function (g) { var c = new Float32Array(g.attributes.position.count * 3); c.fill(1); g.setAttribute('color', new T.BufferAttribute(c, 3)); });
    if (this.baked) {
      this.atlas = this.bakedTexture(this.baked.atlas.url, false, false);
      this.floors = this.baked.stages.map(function (stage) {
        return self.material({ map: self.bakedTexture(stage.floor, true, false), lightMap: self.bakedTexture(stage.light, false, true), lightMapIntensity: stage.lightMapIntensity || 1, color: stage.floorTint || 0xffffff, vertexColors: true }, true);
      });
      this.worldAtlasMaterial = this.atlasMaterial(this.material({ map: this.atlas, color: 0xffffff, vertexColors: true }, true), 'vertex');
      this.metal = this.atlasMaterial(this.material({ map: this.atlas, color: 0xffffff, shininess: 24, specular: 0x202925, vertexColors: true }), 'uniform', 'metal');
      this.skin = this.atlasMaterial(this.material({ map: this.atlas, color: 0xffffff, shininess: 15, specular: 0x171f16, vertexColors: true }), 'uniform', 'skin');
    } else {
      this.floors = PALETTES.map(function (_, stage) { var t = self.texture(floorTexture(stage), true); return self.material({ map: t, color: 0x82958e, shininess: 14, specular: 0x17201d, vertexColors: true }); });
      this.metal = this.material({ map: this.texture(metalTexture(), true), color: 0xffffff, shininess: 24, specular: 0x202925, vertexColors: true });
      this.skin = this.material({ color: 0xffffff, map: this.texture(skinTexture(), true), shininess: 15, specular: 0x171f16, vertexColors: true });
    }
    this.matte = this.material({ color: 0xffffff, shininess: 10, specular: 0x182027, vertexColors: true });
    this.glowing = this.material({ color: 0xffffff, vertexColors: true }, true);
    this.glass = this.material({ color: 0x69a9a1, transparent: true, opacity: .28, shininess: 90, specular: 0xaddfdf, depthWrite: false, side: T.DoubleSide });
    this.shadowTexture = this.texture(blobTexture('shadow')); this.glowTexture = this.texture(blobTexture('glow')); this.bloodTexture = this.texture(blobTexture('blood'));
    this.shadowMaterial = this.material({ map: this.shadowTexture, color: 0x000000, transparent: true, opacity: .7, depthWrite: false }, true);
    this.glowMaterial = this.material({ map: this.glowTexture, transparent: true, color: 0xffffff, opacity: .72, vertexColors: true, blending: T.AdditiveBlending, depthWrite: false }, true);
    this.decalMaterial = this.material({ map: this.bloodTexture, color: 0xffffff, transparent: true, opacity: .75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }, true);
    if (!this.baked) this.stencilMaterial = this.material({ map: this.texture(stencilTexture()), color: 0xffffff, transparent: true, opacity: .3, depthWrite: false }, true);
  };
  Renderer.prototype.pool = function (g, material, max) {
    // Three r124 caches instancing shader defines on the material. Keep pool
    // materials separate from static meshes and from pools with other attributes.
    var poolMaterial = material.clone(); poolMaterial.onBeforeCompile = material.onBeforeCompile; poolMaterial.customProgramCacheKey = material.customProgramCacheKey; this.materials.push(poolMaterial);
    var mesh = new T.InstancedMesh(g, poolMaterial, max);
    // r124 setColorAt allocates from mesh.count; allocate before reducing the
    // visible count to zero, otherwise the initial colour buffer has no entries.
    var instanceColors = new Float32Array(max * 3); instanceColors.fill(1);
    mesh.instanceColor = new T.InstancedBufferAttribute(instanceColors, 3).setUsage(T.DynamicDrawUsage);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.count = 0; mesh.frustumCulled = false; this.dynamic.add(mesh); return mesh;
  };
  Renderer.prototype.setInstance = function (mesh, index, x, y, z, sx, sy, sz, angle, color, rx) {
    var d = this.dummy; d.position.set(x, y, z); d.rotation.set(rx || 0, rx ? 0 : (-angle || 0), rx ? (-angle || 0) : 0); d.scale.set(sx, sy, sz); d.updateMatrix(); mesh.setMatrixAt(index, d.matrix);
    if (color !== undefined) { this.color.set(color).convertSRGBToLinear(); mesh.setColorAt(index, this.color); }
  };
  Renderer.prototype.finishPool = function (mesh, count) {
    mesh.count = count; mesh.visible = count > 0;
    if (!count) return;
    mesh.instanceMatrix.updateRange.offset = 0; mesh.instanceMatrix.updateRange.count = count * 16; mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) { mesh.instanceColor.updateRange.offset = 0; mesh.instanceColor.updateRange.count = count * 3; mesh.instanceColor.needsUpdate = true; }
    var pose = mesh.geometry.getAttribute('instancePose');
    if (pose) { pose.updateRange.offset = 0; pose.updateRange.count = count * 4; pose.needsUpdate = true; }
    var tile = mesh.geometry.getAttribute('instanceAtlasRect');
    if (tile) { tile.updateRange.offset = 0; tile.updateRange.count = count * 4; tile.needsUpdate = true; }
    this.stats.uploadedInstances += count;
  };
  Renderer.prototype.visibleAt = function (x, z, radius) {
    this.cullSphere.center.set(x, .8, z); this.cullSphere.radius = radius;
    return this.frustum.intersectsSphere(this.cullSphere);
  };
  Renderer.prototype.rigPool = function (mesh, capacity, type) {
    var spec = ACTOR_RIGS[type], vec = function (a) { return new T.Vector3().fromArray(a || [0, 0, 0]); };
    var u = { rigTime: { value: 0 }, rigMuzzle: { value: 0 }, rigGait: { value: new T.Vector4(spec.sweep, spec.walkDuty, spec.runDuty, spec.lift) }, rigBody: { value: new T.Vector4(spec.drop, spec.bob, spec.lean, spec.kind) }, rigHead: { value: vec(spec.head) },
      rigHip: { value: [] }, rigKnee: { value: [] }, rigFoot: { value: [] }, rigBend: { value: [] }, rigLeg: { value: [] }, rigShoulder: { value: [] }, rigElbow: { value: [] }, rigHand: { value: [] }, rigArmBend: { value: [] }, rigArmLength: { value: [] }, rigTail: { value: [] },
      rigSupportHand: { value: vec([.60, 1.28, -.04]) }, rigTriggerHand: { value: vec([.42, 1.27, .05]) } };
    for (var i = 0; i < 4; i++) {
      var l = spec.legs[i] || spec.legs[0];
      u.rigHip.value.push(vec(l.hip)); u.rigKnee.value.push(vec(l.knee)); u.rigFoot.value.push(vec(l.foot)); u.rigBend.value.push(vec(l.bend));
      u.rigLeg.value.push(new T.Vector4(l.offset, vec(l.hip).distanceTo(vec(l.knee)), vec(l.knee).distanceTo(vec(l.foot)), 0)); u.rigTail.value.push(vec(spec.tail[i]));
    }
    for (i = 0; i < 2; i++) {
      var a = spec.arms[i] || ACTOR_RIGS.human.arms[i];
      u.rigShoulder.value.push(vec(a.shoulder)); u.rigElbow.value.push(vec(a.elbow)); u.rigHand.value.push(vec(a.hand)); u.rigArmBend.value.push(vec(a.bend));
      u.rigArmLength.value.push(new T.Vector2(vec(a.shoulder).distanceTo(vec(a.elbow)), vec(a.elbow).distanceTo(vec(a.hand))));
    }
    // UV integer bands hold rigid-bone membership; one vec4 replaces the old
    // instance colour. Mat4 + position/normal/colour/UV/pose still use 9 slots.
    mesh.instanceColor = null;
    mesh.geometry.setAttribute('instancePose', new T.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(T.DynamicDrawUsage));
    var original = mesh.material.onBeforeCompile, originalKey = mesh.material.customProgramCacheKey.call(mesh.material);
    mesh.material.userData.rigShader = RIG_SHADER; mesh.material.userData.rigUniforms = u;
    mesh.geometry.userData.rig = { type: type, legs: spec.legs.map(function (l, i) { return { hip: l.hip.slice(), knee: l.knee.slice(), foot: l.foot.slice(), groups: [10 + i * 3, 11 + i * 3, 12 + i * 3] }; }), arms: spec.arms.map(function (a, i) { return { shoulder: a.shoulder.slice(), elbow: a.elbow.slice(), hand: a.hand.slice(), groups: [40 + i * 3, 41 + i * 3, 42 + i * 3] }; }), tail: spec.tail, bodyGroup: 0, pelvisGroup: 1, headGroup: 2 };
    mesh.material.onBeforeCompile = function (shader) {
      if (original) original.call(this, shader);
      Object.keys(u).forEach(function (key) { shader.uniforms[key] = u[key]; });
      shader.vertexShader = 'attribute vec4 instancePose;\n' + RIG_SHADER + '\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\nvColor *= instancePose.x >= 4.0 ? vec3(.34,.40,.28) : (mod(floor(instancePose.x / 2.0),2.0) > .5 ? vec3(1.0,.72,.53) : vec3(1.0));');
      shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvec3 rigPosition=position;\nalienRigTransform(rigPosition,objectNormal,floor(uv.x*.5+.00001),instancePose);');
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed=rigPosition;');
    };
    mesh.material.customProgramCacheKey = function () { return originalKey + '-joint-rig-v1'; };
    return mesh;
  };
  Renderer.prototype.buildModels = function () {
    var p = [], self = this, human = ACTOR_RIGS.human;
    // Original anatomy: short hair, black shirt, exposed forearms and long
    // trousered legs. Each limb is two rigid bones, not a sliding foot mesh.
    rigPart(p, this.shirt, 0x222a2b, 0, 0, 1.28, 0, .17, .43, .24);
    rigPart(p, this.sphere, 0x252d2e, 0, -.015, 1.43, 0, .17, .13, .25);
    rigPart(p, this.box, 0x596875, 1, -.015, 1.015, 0, .31, .20, .39);
    rigPart(p, this.box, 0x252a28, 1, .005, 1.10, 0, .33, .075, .40);
    rigPart(p, this.box, 0xa2a68e, 1, .176, 1.10, 0, .025, .055, .06);
    rigPart(p, this.limbCylinder, 0xc39b79, 0, .01, 1.53, 0, .064, .15, .064);
    rigPart(p, this.sphere, 0xd2ae8b, 0, .02, 1.685, 0, .098, .128, .098);
    rigPart(p, this.sphere, 0x393a30, 0, -.012, 1.758, 0, .099, .061, .100);
    rigPart(p, this.box, 0xc79f7a, 0, .119, 1.68, 0, .039, .053, .052);
    human.legs.forEach(function (l, i) {
      var g = 10 + i * 3;
      bone(p, self.limbCylinder, 0x60707e, l.hip, l.knee, .096, .092, g);
      rigPart(p, self.sphere, 0x566673, g, l.knee[0], l.knee[1], l.knee[2], .10, .095, .095);
      bone(p, self.limbCylinder, 0x536371, l.knee, l.foot, .075, .082, g + 1);
      rigPart(p, self.boot, 0x272e2b, g + 2, l.foot[0] + .045, .09, l.foot[2], .16, .14, .095);
      rigPart(p, self.cylinder, 0x41483e, g + 2, l.foot[0] + .045, .027, l.foot[2], .16, .026, .095);
    });
    human.arms.forEach(function (a, i) {
      var g = 40 + i * 3, sleeve = a.shoulder.map(function (v, j) { return v + (a.elbow[j] - v) * .48; });
      bone(p, self.limbCylinder, 0xc19b79, a.shoulder, a.elbow, .067, .064, g);
      bone(p, self.limbCylinder, 0x232c2c, a.shoulder, sleeve, .09, .078, g);
      bone(p, self.limbCylinder, 0xd2ac86, a.elbow, a.hand, .057, .06, g + 1);
      rigPart(p, self.sphere, 0xc69f78, g + 2, a.hand[0], a.hand[1], a.hand[2], .074, .057, .063);
    });
    this.soldiers = this.rigPool(this.pool(this.geometry(merge(p)), this.matte, 1), 1, 'human');
    this.weapons = {}; this.weaponParts = {}; this.weaponSpecs = {
      pistol: { muzzle: .80, support: [.41, 1.27, -.04] }, smg: { muzzle: 1.13, support: [.66, 1.28, -.04] },
      shotgun: { muzzle: 1.22, support: [.70, 1.28, -.04] }, minigun: { muzzle: 1.28, support: [.65, 1.28, -.08] }, plasma: { muzzle: 1.13, support: [.65, 1.28, -.08] }
    };
    Object.keys(this.weaponSpecs).forEach(function (type) {
      var spec = self.weaponSpecs[type], pieces = [], pistol = type === 'pistol';
      part(pieces, self.box, 0x303c3e, pistol ? .56 : .61, 1.34, 0, pistol ? .33 : .56, .12, pistol ? .09 : .14);
      part(pieces, self.box, 0x292e2b, .42, 1.245, .015, .105, .16, .075, 0, 0, -.15);
      if (!pistol) { part(pieces, self.box, 0x5b6255, .285, 1.32, 0, .18, .13, .12); part(pieces, self.box, 0x384744, .59, 1.235, .015, .11, .17, .09, 0, 0, -.12); }
      if (type === 'minigun') {
        for (var b = 0; b < 6; b++) { var phi = b * TAU / 6; part(pieces, self.limbCylinder, 0x9da9a7, 1.0, 1.34 + Math.cos(phi) * .065, Math.sin(phi) * .065, .026, .56, .026, 0, 0, Math.PI / 2); }
        part(pieces, self.cylinder, 0x58685e, .62, 1.24, .13, .145, .16, .145, Math.PI / 2);
      } else {
        part(pieces, self.limbCylinder, 0x9aa8a1, (spec.muzzle + .70) * .5, 1.34, 0, type === 'plasma' ? .075 : .037, spec.muzzle - .70, type === 'plasma' ? .075 : .037, 0, 0, Math.PI / 2);
        if (type === 'shotgun') { part(pieces, self.limbCylinder, 0x778981, .98, 1.34, .065, .033, .48, .033, 0, 0, Math.PI / 2); part(pieces, self.box, 0x9b7f55, .70, 1.28, 0, .26, .09, .18); }
        if (type === 'plasma') for (var c = 0; c < 4; c++) part(pieces, self.box, 0x7eddd7, .71 + c * .085, 1.40, 0, .035, .08, .19);
      }
      var mesh = self.rigPool(self.pool(self.geometry(merge(pieces)), self.metal, 1), 1, 'human');
      mesh.geometry.userData.rig.weapon = { base: [.42, 1.34, 0], muzzle: [spec.muzzle, 1.34, 0], group: 0, support: spec.support.slice(), trigger: [.42,1.27,.05] };
      self.weapons[type] = mesh;
    });
    this.guns = this.weapons.smg;
    this.monsters = {}; this.corpses = []; this.lastDeathEvent = 0;
    ['crawler', 'runner', 'spitter', 'brute', 'boss'].forEach(function (type) {
      var spec = ACTOR_RIGS[type], pieces = [], heavy = type === 'brute' || type === 'boss', boss = type === 'boss', runner = type === 'runner', spit = type === 'spitter';
      var skin = boss ? 0x9b8860 : heavy ? 0x9c9a61 : runner ? 0x9b9d60 : spit ? 0x7b9563 : 0x72936b, ridge = heavy ? 0x676b45 : 0x425f49, tooth = 0xd7ce99;
      if (heavy) {
        rigPart(pieces, self.sphere, skin, 0, -.13, boss ? 1.14 : 1.0, 0, boss ? .62 : .51, boss ? .57 : .46, boss ? .62 : .51);
        rigPart(pieces, self.sphere, ridge, 0, -.27, boss ? 1.42 : 1.25, 0, boss ? .49 : .43, .30, boss ? .61 : .49);
        rigPart(pieces, self.sphere, skin, 1, -.16, .76, 0, .36, .24, boss ? .40 : .34);
      } else if (runner) {
        rigPart(pieces, self.sphere, skin, 0, -.13, .85, 0, .42, .30, .24, 0, 0, -.36);
        rigPart(pieces, self.sphere, ridge, 0, -.25, 1.03, 0, .33, .14, .23, 0, 0, -.25);
      } else {
        rigPart(pieces, self.sphere, skin, 0, -.15, spit ? .56 : .43, 0, spit ? .63 : .53, spit ? .36 : .25, spit ? .48 : .30);
        rigPart(pieces, self.sphere, ridge, 0, -.18, spit ? .73 : .57, 0, .48, .14, spit ? .42 : .25);
        if (spit) [-1, 1].forEach(function (side) { rigPart(pieces, self.detailSphere, 0xa6b96a, 0, -.38, .61, side * .36, .32, .23, .23); });
      }
      bone(pieces, self.limbCylinder, skin, [heavy ? .12 : .25, heavy ? (boss ? 1.39 : 1.20) : runner ? .97 : spit ? .56 : .43, 0], spec.head, heavy ? .18 : .15, heavy ? .19 : .14, 0);
      var h = spec.head, hx = h[0] + .18, hy = h[1];
      rigPart(pieces, self.sphere, skin, 2, hx, hy, 0, heavy ? .31 : .34, heavy ? .23 : .17, heavy ? .31 : .22);
      rigPart(pieces, self.cone, ridge, 2, hx + .22, hy + .025, 0, heavy ? .25 : .19, .46, heavy ? .25 : .19, 0, 0, -Math.PI / 2);
      rigPart(pieces, self.box, 0x354633, 2, hx + .23, hy - .12, 0, .29, .085, heavy ? .39 : .27);
      [-1, 1].forEach(function (side) {
        rigPart(pieces, self.box, spit ? 0xdeeb80 : 0xe4b35c, 2, hx + .17, hy + .06, side * (heavy ? .25 : .19), .045, .035, .035);
        rigPart(pieces, self.cone, tooth, 2, hx + .34, hy - .13, side * (heavy ? .16 : .11), .041, .17, .041, 0, 0, Math.PI);
      });
      spec.legs.forEach(function (l, i) {
        var g = 10 + i * 3, width = heavy ? .14 : runner ? .09 : .085;
        bone(pieces, self.limbCylinder, skin, l.hip, l.knee, width, width * .90, g);
        bone(pieces, self.limbCylinder, ridge, l.knee, l.foot, width * .65, width * .72, g + 1);
        rigPart(pieces, self.box, skin, g + 2, l.foot[0] + .045, l.foot[1], l.foot[2], heavy ? .28 : .20, heavy ? .13 : .075, heavy ? .22 : .12);
        [-1, 1].forEach(function (side) { rigPart(pieces, self.cone, tooth, g + 2, l.foot[0] + (heavy ? .20 : .14), l.foot[1] - .015, l.foot[2] + side * (heavy ? .07 : .035), heavy ? .034 : .022, heavy ? .19 : .14, heavy ? .034 : .022, 0, 0, -Math.PI / 2); });
      });
      spec.arms.forEach(function (a, i) {
        var g = 40 + i * 3, width = heavy ? (boss ? .20 : .165) : .065;
        bone(pieces, self.limbCylinder, skin, a.shoulder, a.elbow, width, width * .9, g);
        bone(pieces, self.limbCylinder, ridge, a.elbow, a.hand, width * .70, width * .8, g + 1);
        rigPart(pieces, self.detailSphere, skin, g + 2, a.hand[0], a.hand[1], a.hand[2], width, width * .7, width);
        [-1, 1].forEach(function (side) { rigPart(pieces, self.cone, tooth, g + 2, a.hand[0] + .12, a.hand[1] - .05, a.hand[2] + side * width * .6, width * .23, heavy ? .30 : .18, width * .23, 0, 0, -1.9); });
      });
      for (var t = 0; t < 3; t++) bone(pieces, t < 2 ? self.tailSegment : self.cone, t ? skin : ridge, spec.tail[t], spec.tail[t + 1], (heavy ? .19 : .14) * (1 - t * .26), (heavy ? .19 : .14) * (1 - t * .26), 30 + t);
      for (var s = 0; s < (boss ? 5 : 3); s++) rigPart(pieces, self.cone, ridge, 0, -.42 + s * .19, heavy ? (boss ? 1.73 : 1.51) : runner ? 1.17 : spit ? .91 : .78, 0, boss ? .10 : .065, boss ? .37 : .20, boss ? .10 : .065, 0, 0, .25);
      if (boss) [-1,1].forEach(function (side) { rigPart(pieces, self.cone, tooth, 0, -.01, 1.62, side * .57, .12, .53, .12, side * .45, 0, -.25); });
      self.monsters[type] = { body: self.rigPool(self.pool(self.geometry(merge(pieces)), self.skin, 158), 158, type) };
    });
    this.shadows = this.pool(this.plane, this.shadowMaterial, 128);
    this.playerRings = this.pool(this.ring, this.material({ color: 0xffffff, transparent: true, opacity: .8, depthWrite: false }, true), 1);
    if (this.baked && this.baked.atlas.tiles.pickupHealth) {
      var pickupGeometry = this.geometry(this.box.clone());
      pickupGeometry.setAttribute('instanceAtlasRect', new T.InstancedBufferAttribute(new Float32Array(60 * 4), 4).setUsage(T.DynamicDrawUsage));
      this.pickupBodies = this.pool(pickupGeometry, this.atlasMaterial(this.material({ map: this.atlas, color: 0xffffff }, true), 'instance'), 60);
    } else this.pickupBodies = this.pool(this.box, this.material({ color: 0xffffff, shininess: 50 }), 60);
    this.pickupMarks = this.pool(this.box, this.material({ color: 0xffffff }, true), 120);
    this.pickupGlows = this.pool(this.plane, this.glowMaterial, 60);
    p = []; part(p, this.cylinder, this.baked ? 0xe0ddd1 : 0x947247, 0, .53, 0, .43, 1.06, .43);
    if (this.baked) {
      p[0].tile = 'barrelSide'; p[0].topTile = 'barrelTop';
      this.barrelBodies = this.pool(this.geometry(merge(p, 0, this.baked.atlas.tiles)), this.worldAtlasMaterial, 32);
    } else {
      [-1, 1].forEach(function (side) { part(p, self.cylinder, 0x262f2c, 0, .53 + side * .31, 0, .445, .06, .445); });
      this.barrelBodies = this.pool(this.geometry(merge(p)), this.matte, 32);
    }
    this.doors = this.pool(this.box, this.metal, 20);
    this.doorBars = this.pool(this.box, this.material({ color: 0xe6a052 }, true), 20);
    this.objectiveRings = this.pool(this.ring, this.material({ color: 0xffffff, transparent: true, opacity: .8, depthWrite: false }, true), 8);
    this.objectiveGlows = this.pool(this.plane, this.glowMaterial, 8);
    p = []; part(p, this.sphere, 0xffe7a8, .10, 1.34, 0, .20, .09, .09);
    this.muzzleFlashes = this.rigPool(this.pool(this.geometry(merge(p)), this.material({ color: 0xffe39a, emissive: 0xffc76b, vertexColors: true }), 1), 1, 'human');
    this.grenadeBodies = this.pool(this.sphere, this.material({ color: 0x617545, shininess: 30 }), 20);
  };
  Renderer.prototype.buildEffects = function () {
    this.decals = this.pool(this.plane, this.decalMaterial, 180);
    // Blast soot has a soft radial falloff; blood keeps its irregular splatter
    // silhouette. Sharing the blood mask made large burns look like petals.
    this.scorches = this.pool(this.plane, this.material({ map: this.shadowTexture, color: 0xffffff, transparent: true, opacity: .85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }, true), 180);
    this.tracerPositions = new Float32Array(512 * 6); this.tracerColors = new Float32Array(512 * 6);
    this.tracerGeometry = this.geometry(new T.BufferGeometry()); this.tracerGeometry.setAttribute('position', new T.BufferAttribute(this.tracerPositions, 3).setUsage(T.DynamicDrawUsage)); this.tracerGeometry.setAttribute('color', new T.BufferAttribute(this.tracerColors, 3).setUsage(T.DynamicDrawUsage));
    var material = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .95 }); this.materials.push(material); this.tracers = new T.LineSegments(this.tracerGeometry, material); this.tracers.frustumCulled = false; this.dynamic.add(this.tracers);
    this.effectPositions = new Float32Array(360 * 3); this.effectColors = new Float32Array(360 * 3);
    this.effectGeometry = this.geometry(new T.BufferGeometry()); this.effectGeometry.setAttribute('position', new T.BufferAttribute(this.effectPositions, 3).setUsage(T.DynamicDrawUsage)); this.effectGeometry.setAttribute('color', new T.BufferAttribute(this.effectColors, 3).setUsage(T.DynamicDrawUsage));
    material = new T.PointsMaterial({ map: this.glowTexture, size: .4, transparent: true, blending: T.AdditiveBlending, depthWrite: false, vertexColors: true }); this.materials.push(material); this.effects = new T.Points(this.effectGeometry, material); this.effects.frustumCulled = false; this.dynamic.add(this.effects);
    this.explosions = this.pool(this.sphere, this.material({ color: 0xff9b43, transparent: true, opacity: .55, depthWrite: false }, true), 24);
  };
  Renderer.prototype.clearWorld = function () { while (this.world.children.length) this.world.remove(this.world.children[0]); this.worldGeometries.forEach(function (g) { g.dispose(); }); this.worldGeometries = []; };
  Renderer.prototype.batch = function (parts, material, projection) {
    if (!parts.length) return;
    var g = merge(parts, projection); this.worldGeometries.push(g); var mesh = new T.Mesh(g, material); this.world.add(mesh); return mesh;
  };
  Renderer.prototype.setMap = function (map, stage) {
    if (this.map === map && this.stage === stage) return;
    this.clearWorld(); this.actorStates.clear(); this.corpses = []; this.mapChanged = true; this.map = map; this.stage = clamp(stage || 0, 0, 2);
    var p = PALETTES[this.stage], self = this, floor = [], metal = [], matte = [], glow = [], shadows = [], glass = [], crates = [], w = map.width || 48, h = map.height || 34;
    this.scene.background.setHex(p.shadow); this.keyLight.color.setHex(this.stage === 1 ? 0xc9e7e3 : 0xffe5c3);
    part(floor, this.box, 0xffffff, w / 2, -.13, h / 2, w, .2, h);
    var floorMesh = this.batch(floor, this.floors[this.stage], 6);
    if (this.baked) {
      var floorPosition = floorMesh.geometry.attributes.position, floorLightUV = new Float32Array(floorPosition.count * 2);
      for (var floorIndex = 0; floorIndex < floorPosition.count; floorIndex++) { floorLightUV[floorIndex * 2] = floorPosition.getX(floorIndex) / w; floorLightUV[floorIndex * 2 + 1] = floorPosition.getZ(floorIndex) / h; }
      floorMesh.geometry.setAttribute('uv2', new T.BufferAttribute(floorLightUV, 2));
    }
    // Wall sections include coping, recessed panels, vertical supports and pipes.
    (map.solids || []).forEach(function (s, index) {
      var sx = s.w || 1, sz = s.h || 1, x = s.x + sx / 2, z = s.y + sz / 2, type = s.type;
      if (type === 'crate') {
        var cols = Math.max(1, Math.round(sx / 1.5)), rows = Math.max(1, Math.round(sz / 1.5)), cw = sx / cols, ch = sz / rows;
        for (var ci = 0; ci < cols; ci++) for (var cj = 0; cj < rows; cj++) {
          var bx = s.x + (ci + .5) * cw, bz = s.y + (cj + .5) * ch, ht = .85 + ((ci + cj * 3 + index) % 3) * .19, crateColor = self.stage === 1 ? 0x617c78 : (ci + cj) % 2 ? 0x746b54 : 0x67715c;
          if (self.baked) {
            var bakedTint = self.stage === 1 ? ((ci + cj) % 2 ? 0xd5e2dc : 0xbccfc9) : self.stage === 2 ? ((ci + cj) % 2 ? 0xd6d0bd : 0xc5ccd3) : ((ci + cj) % 2 ? 0xd8cfaf : 0xc8d0b9);
            part(crates, self.box, bakedTint, bx, ht / 2, bz, cw - .045, ht, ch - .045);
            var crate = crates[crates.length - 1]; crate.tile = 'crateSide'; crate.topTile = 'crateTop'; crate.projectedUV = 0;
            continue;
          }
          part(metal, self.box, crateColor, bx, ht / 2, bz, cw - .045, ht, ch - .045);
          part(matte, self.box, 0x24352d, bx, ht + .02, bz, cw - .16, .04, ch - .16);
          part(metal, self.box, crateColor, bx, ht + .045, bz, cw - .26, .035, ch - .26);
          for (var side = -1; side <= 1; side += 2) {
            part(metal, self.box, 0x89917a, bx + side * cw * .36, ht / 2 + .04, bz, .06, ht + .08, ch - .04);
            part(metal, self.box, 0x8c937e, bx, ht / 2 + .04, bz + side * ch * .37, cw - .04, ht + .08, .05);
          }
          part(matte, self.box, 0xc3be91, bx, ht + .07, bz, cw * .27, .015, ch * .18);
          part(matte, self.box, 0x3f493b, bx, ht + .08, bz, cw * .18, .012, ch * .045);
          for (var bolt = 0; bolt < 4; bolt++) part(metal, self.box, 0x172c25, bx + (bolt % 2 ? 1 : -1) * cw * .36, ht + .087, bz + (bolt < 2 ? 1 : -1) * ch * .37, .045, .015, .045);
          for (var stripe = 0; stripe < 4; stripe++) part(matte, self.box, stripe % 2 ? 0x17221a : 0xba9a4d, bx - cw * .3 + stripe * .095, ht + .09, bz - ch * .3, .07, .012, .14, 0, -.3);
        }
      } else if (type === 'tank') {
        part(metal, self.cylinder, 0x71847e, x, .78, z, sx * .47, 1.56, sz * .47);
        part(matte, self.cylinder, 0x2e403b, x, .18, z, sx * .5, .18, sz * .5);
        part(metal, self.cylinder, 0xb0c0b3, x, 1.51, z, sx * .5, .12, sz * .5);
        part(glow, self.box, p.light, x + sx * .43, .86, z, .035, .58, .09);
        if (self.stage === 2) {
          part(matte, self.cylinder, 0x253637, x, 1.63, z, sx * .32, .18, sz * .32);
          part(glow, self.cylinder, 0xdd985a, x, 1.74, z, sx * .19, .035, sz * .19);
          for (var ring = 0; ring < 3; ring++) part(metal, self.torus, 0xa69b73, x, .53 + ring * .4, z, sx * .48, sz * .48, 1, Math.PI / 2);
        } else if (self.stage === 1) {
          part(glass, self.cylinder, 0xffffff, x, 1.93, z, sx * .27, .75, sz * .27);
          part(glow, self.sphere, 0x83c5a1, x, 1.9, z, sx * .13, .36, sz * .13);
          part(metal, self.cylinder, 0x587b73, x, 2.33, z, sx * .3, .08, sz * .3);
        }
      } else {
        var tall = Math.min(1.45, .95 + ((index % 3) * .12));
        part(metal, self.box, self.stage === 1 ? 0x667e7d : 0x4b5d58, x, tall / 2, z, sx, tall, sz);
        part(matte, self.box, 0x293734, x, .12, z, sx + .08, .24, sz + .08);
        part(metal, self.box, 0x4c5953, x, tall + .035, z, sx + .12, .07, sz + .12);
        var length = Math.max(sx, sz), horizontal = sx > sz;
        part(matte, self.box, 0x1c2c26, x, tall + .076, z, horizontal ? sx : .1, .015, horizontal ? .1 : sz);
        for (var n = .35; n < length; n += 2.6) {
          var px = horizontal ? s.x + n : x, pz = horizontal ? z : s.y + n;
          part(metal, self.box, 0x364b48, px, tall * .55, pz, horizontal ? .12 : sx + .06, tall, horizontal ? sz + .06 : .12);
        }
        if (index % 3 === 0 && length > 3) part(glow, self.box, p.light, x, tall + .08, z, horizontal ? Math.min(1.5, sx) : .08, .025, horizontal ? .08 : Math.min(1.5, sz));
      }
      if (!self.baked) part(shadows, self.plane, 0xffffff, x + .18, .006, z + .25, sx + 1, sz + 1, 1, -Math.PI / 2);
    });
    (map.props || []).forEach(function (o, index) {
      var x = o.x, z = o.y, a = o.angle || 0;
      if (o.type === 'console') self.consoleParts(metal, matte, glow, x, z, a, p.light);
      else if (o.type === 'pipe') {
        part(metal, self.cylinder, 0x697b75, x, .34, z, .18, 2.4, .18, Math.PI / 2, -a, 0);
        [-.8, .8].forEach(function (off) { part(matte, self.cylinder, 0x263733, x, .34, z + off, .23, .1, .23, Math.PI / 2); });
      } else if (o.type === 'rack') {
        part(matte, self.box, 0x1f302d, x, .8, z, 1.2, 1.6, .65, 0, -a);
        for (var i = 0; i < 5; i++) { part(metal, self.box, 0x75877d, x, .25 + i * .27, z + .34, 1.08, .18, .05); part(glow, self.box, i % 2 ? 0xddbd60 : p.light, x - .4, .25 + i * .27, z + .38, .07, .045, .025); }
      } else if (o.type === 'tank') {
        part(metal, self.cylinder, 0x819e96, x, .12, z, .6, .24, .6); part(metal, self.cylinder, 0x819e96, x, 1.7, z, .6, .18, .6);
        part(glass, self.cylinder, 0xffffff, x, .95, z, .53, 1.45, .53);
        part(glow, self.sphere, self.stage === 1 ? 0x87bc61 : 0xd4c37a, x, .9, z, .28, .54, .28);
        [-1, 1].forEach(function (side) { part(metal, self.box, 0x47645b, x + side * .5, .95, z, .06, 1.5, .06); });
      } else if (o.type === 'vent') {
        part(metal, self.box, 0x243532, x, .03, z, 1.25, .06, .85);
        for (i = 0; i < 8; i++) part(metal, self.box, 0x9eaaa0, x - .49 + i * .14, .07, z, .045, .03, .72);
      } else if (o.type === 'warning') {
        for (i = 0; i < 8; i++) part(matte, self.box, i % 2 ? 0x202b27 : p.trim, x - .9 + i * .25, .024, z, .24, .025, .42, 0, -.2);
      } else if (o.type === 'cable') {
        for (i = 0; i < 5; i++) part(matte, self.cylinder, 0x182825, x + Math.sin(i * .6) * .15, .04, z + i * .34, .035, .5, .035, Math.PI / 2, i * .08);
      }
    });
    (map.objectives || []).forEach(function (o) { self.consoleParts(metal, matte, glow, o.x, o.y, 0, p.light); });
    // Floor lanes and tiny inset warning rectangles guide movement through rooms.
    for (var q = 0; !this.baked && q < 3; q++) {
      var cx = w * (q + .5) / 3;
      for (var k = 0; k < 8; k++) part(matte, this.box, p.trim, cx - 2.4 + k * .68, .018, 3.5, .42, .012, .14);
      part(matte, this.box, 0x9da99c, cx, .016, h - 3, 3.8, .01, .055);
    }
    if (map.exit && !this.baked) {
      for (q = -1; q <= 1; q++) { part(glow, this.box, 0x77b99a, map.exit.x + q * .5, .025, map.exit.y, .08, .025, 1.35); }
    }
    if (!this.baked) { this.batch(shadows, this.shadowMaterial); this.batch(metal, this.metal, 2.4); this.batch(matte, this.matte); this.batch(glow, this.glowing); }
    this.batch(glass, this.glass);
    var labels = [], labelPlane = new T.PlaneBufferGeometry(8, 2.2), uv = labelPlane.attributes.uv;
    for (q = 0; q < uv.count; q++) uv.setY(q, (1 - this.stage / 3) - (1 - uv.getY(q)) / 3);
    part(labels, labelPlane, 0xffffff, w / 2, .021, h / 2, 1, 1, 1, -Math.PI / 2); if (!this.baked) this.batch(labels, this.stencilMaterial); labelPlane.dispose();
    var glows = [], fixtures = [];
    for (var lampY = 4; lampY < h - 2; lampY += 7) {
      [1.1, w - 1.1].forEach(function (lampX) {
        part(fixtures, self.box, self.stage === 1 ? 0x8ddbd7 : 0xf1be77, lampX, .88, lampY, .12, .12, .65);
        if (!self.baked) part(glows, self.plane, self.stage === 1 ? 0x71b9cf : 0xd8a365, lampX, .018, lampY, 5.6, 5.6, 1, -Math.PI / 2);
      });
    }
    if (!this.baked) this.batch(fixtures, this.glowing);
    (!this.baked ? map.lights || [] : []).forEach(function (light) { part(glows, self.plane, light.color ? new T.Color(light.color).getHex() : p.light, light.x, .012, light.y, 4.2, 4.2, 1, -Math.PI / 2); });
    if (this.baked) {
      metal.forEach(function (piece) { piece.tile = 'metal'; piece.projectedUV = 2.4; });
      matte.forEach(function (piece) { piece.tile = 'white'; piece.projectedUV = 0; });
      glow.concat(fixtures).forEach(function (piece) { piece.tile = 'white'; piece.projectedUV = 0; piece.unlit = true; });
      var opaque = merge(metal.concat(matte, crates, glow, fixtures), 0, this.baked.atlas.tiles);
      this.worldGeometries.push(opaque); this.world.add(new T.Mesh(opaque, this.worldAtlasMaterial));
      this.stats.staticTriangles = opaque.attributes.position.count / 3 + floorMesh.geometry.attributes.position.count / 3;
    } else this.batch(glows, this.glowMaterial);
    this.cameraCenter.x = map.spawn ? map.spawn.x : w / 2; this.cameraCenter.y = map.spawn ? map.spawn.y : h / 2;
  };
  Renderer.prototype.consoleParts = function (metal, matte, glow, x, z, angle, color) {
    part(metal, this.box, 0x60766f, x, .45, z, .95, .9, .65, 0, -angle);
    part(matte, this.box, 0x142925, x, 1, z, .91, .08, .62, .32, -angle);
    part(glow, this.box, color, x, 1.055, z - .04, .6, .015, .26, .32, -angle);
    for (var n = 0; n < 3; n++) part(glow, this.box, n ? 0xecc370 : 0x83ca9e, x - .25 + n * .22, 1.01, z + .2, .08, .025, .055, .32, -angle);
  };
  Renderer.prototype.updateCamera = function (game, dt) {
    var player = (game.players || []).find(function (p) { return p.id === 1 && p.active; }), map = game.map || {};
    var x = player ? player.x : this.cameraCenter.x, y = player ? player.y : this.cameraCenter.y;
    // A fixed combat scale follows the sole player, including the death screen.
    var wanted = 18, lerp = game.phase === 'title' ? 1 : 1 - Math.exp(-Math.max(dt, .001) * 7);
    this.viewHeight += (wanted - this.viewHeight) * lerp; this.cameraCenter.x += (x - this.cameraCenter.x) * lerp; this.cameraCenter.y += (y - this.cameraCenter.y) * lerp;
    var halfY = this.viewHeight / 2, halfX = halfY * this.width / this.height;
    var centerX = clamp(this.cameraCenter.x, Math.min(halfX - 1, (map.width || 48) / 2), Math.max((map.width || 48) - halfX + 1, (map.width || 48) / 2));
    var centerY = clamp(this.cameraCenter.y, Math.min(halfY * 1.15 - 1, (map.height || 34) / 2), Math.max((map.height || 34) - halfY * 1.15 + 1, (map.height || 34) / 2));
    this.camera.left = -halfX; this.camera.right = halfX; this.camera.top = halfY; this.camera.bottom = -halfY; this.camera.updateProjectionMatrix();
    this.camera.position.set(centerX, 40, centerY + 30); this.camera.lookAt(centerX, 0, centerY); this.camera.updateMatrixWorld();
    this.viewProjection.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse); this.frustum.setFromProjectionMatrix(this.viewProjection);
  };
  Renderer.prototype.sampleActor = function (game, entity, domain, type, scale, dt) {
    var key = domain + ':' + entity.id, state = this.actorStates.get(key), aim = finite(entity.angle, 0), tick = finite(game.elapsed, 0), spec = ACTOR_RIGS[type];
    if (!state || state.entityRef !== entity || state.type !== type) {
      state = { key: key, entityRef: entity, type: type, phase: 0, speed: 0, normalizedSpeed: 0, distance: 0, travelAngle: aim, facingAngle: aim, aimAngle: aim, lastX: entity.x, lastY: entity.y, sampleTick: tick, teleportReset: 0, instanceIndex: -1, mesh: null };
      this.actorStates.set(key, state);
    } else if (game.phase === 'playing' && dt > 0 && tick > state.sampleTick) {
      var elapsed = Math.min(.2, tick - state.sampleTick), dx = entity.x - state.lastX, dy = entity.y - state.lastY, distance = Math.hypot(dx, dy);
      if (distance > Math.max(.8, spec.nominalSpeed * elapsed * 3.5)) {
        state.phase = 0; state.speed = 0; state.normalizedSpeed = 0; state.teleportReset++; state.travelAngle = aim; state.facingAngle = aim;
      } else {
        var speed = distance / Math.max(elapsed, .00001), moving = distance > .00005;
        state.speed += (speed - state.speed) * (1 - Math.exp(-elapsed / (moving ? .08 : .12)));
        if (state.speed < .002) state.speed = 0;
        state.normalizedSpeed = clamp(state.speed / spec.nominalSpeed, 0, 1.25);
        if (moving) state.travelAngle = Math.atan2(dy, dx);
        var turnTarget = aim;
        if (type === 'human' && moving) {
          var relative = angleDelta(state.travelAngle, aim);
          if (Math.abs(relative) > Math.PI / 2) relative = angleDelta(relative + Math.PI, 0);
          turnTarget = aim + clamp(relative, -1.05, 1.05);
        }
        state.facingAngle = angleToward(state.facingAngle, turnTarget, 1 - Math.exp(-elapsed * spec.turn));
        if (moving) {
          var amount = clamp(state.normalizedSpeed, 0, 1), weight = clamp(state.normalizedSpeed * 3, 0, 1), duty = spec.walkDuty + (spec.runDuty - spec.walkDuty) * amount;
          var cycle = spec.sweep * (.65 + .35 * amount) * Math.max(.3, weight) / duty * scale;
          state.phase += distance / Math.max(.15, cycle); state.distance += distance;
        }
      }
      state.lastX = entity.x; state.lastY = entity.y; state.sampleTick = tick;
    }
    state.aimAngle = aim; state.instanceIndex = -1; state.mesh = null;
    state.seen = this.actorFrame;
    return state;
  };
  Renderer.prototype.writeActor = function (mesh, index, entity, state, scale, dead) {
    this.setInstance(mesh, index, entity.x, 0, entity.y, scale, scale, scale, state.aimAngle);
    var pose = mesh.geometry.attributes.instancePose;
    pose.setXYZW(index, state.phase % 1 + (dead ? 4 : entity.hitFlash > 0 ? 2 : 0), dead ? 0 : state.normalizedSpeed, angleDelta(state.travelAngle, state.aimAngle), angleDelta(state.facingAngle, state.aimAngle));
    state.instanceIndex = index; state.mesh = mesh;
  };
  // Read-only diagnostics expose the exact data sent to the shared rig shader,
  // not a second CPU implementation of its joint transforms.
  Renderer.prototype.inspectActor = function (domain, id) {
    var state = this.actorStates.get(domain + ':' + id); if (!state) return null;
    var result = { type: state.type, phase: state.phase, speed: state.speed, normalizedSpeed: state.normalizedSpeed, distance: state.distance, travelAngle: state.travelAngle, facingAngle: state.facingAngle, aimAngle: state.aimAngle, sampleTick: state.sampleTick, teleportReset: state.teleportReset, instanceIndex: state.instanceIndex };
    if (state.mesh && state.instanceIndex >= 0) { var i = state.instanceIndex; result.packedPose = Array.prototype.slice.call(state.mesh.geometry.attributes.instancePose.array, i * 4, i * 4 + 4); result.instanceMatrix = Array.prototype.slice.call(state.mesh.instanceMatrix.array, i * 16, i * 16 + 16); }
    return result;
  };
  Renderer.prototype.updateActors = function (game, dt) {
    var self = this, shadowCount = 0, soldierCount = 0, muzzleCount = 0, activeWeapon = '', counts = { crawler: 0, runner: 0, spitter: 0, brute: 0, boss: 0 };
    this.actorFrame++;
    this.soldiers.material.userData.rigUniforms.rigTime.value = finite(game.elapsed, 0);
    this.muzzleFlashes.material.userData.rigUniforms.rigTime.value = finite(game.elapsed, 0);
    Object.keys(this.weapons).forEach(function (type) { self.weapons[type].material.userData.rigUniforms.rigTime.value = finite(game.elapsed, 0); });
    Object.keys(this.monsters).forEach(function (type) { self.monsters[type].body.material.userData.rigUniforms.rigTime.value = finite(game.elapsed, 0); });
    this.stats.renderedEnemies = 0; this.stats.culledEnemies = 0; this.stats.renderedCorpses = 0; this.stats.culledCorpses = 0;
    (game.players || []).filter(function (p) { return p.id === 1 && p.active; }).slice(0, 1).forEach(function (p) {
      var state = self.sampleActor(game, p, 'player', 'human', 1, dt), index = soldierCount++, a = state.aimAngle;
      activeWeapon = self.weapons[p.weapon] ? p.weapon : 'smg'; var weapon = self.weapons[activeWeapon], spec = self.weaponSpecs[activeWeapon]; self.guns = weapon;
      self.soldiers.material.userData.rigUniforms.rigSupportHand.value.fromArray(spec.support);
      self.writeActor(self.soldiers, index, p, state, 1, !p.alive);
      self.setInstance(weapon, index, p.x, 0, p.y, 1, 1, 1, a);
      weapon.geometry.attributes.instancePose.array.set(self.soldiers.geometry.attributes.instancePose.array.subarray(0, 4));
      self.setInstance(self.shadows, shadowCount++, p.x, .008, p.y + .07, 1.5, 1.15, 1, 0, undefined, -Math.PI / 2);
      self.setInstance(self.playerRings, index, p.x, .022, p.y, .68, .68, .68, 0, !p.alive ? 0xf07a5c : 0xc4d99a, -Math.PI / 2);
      if (p.fireFlash > 0 && p.alive) {
        // Flash uses the same upper-body transform as the barrel, including lean.
        self.muzzleFlashes.material.userData.rigUniforms.rigMuzzle.value = spec.muzzle;
        self.setInstance(self.muzzleFlashes, muzzleCount++, p.x, 0, p.y, 1, 1, 1, a);
        self.muzzleFlashes.geometry.attributes.instancePose.array.set(self.soldiers.geometry.attributes.instancePose.array.subarray(0, 4));
      }
    });
    Object.keys(this.weapons).forEach(function (type) { self.finishPool(self.weapons[type], type === activeWeapon ? soldierCount : 0); });
    this.finishPool(this.soldiers, soldierCount); this.finishPool(this.playerRings, soldierCount); this.finishPool(this.muzzleFlashes, muzzleCount);
    var enemies = game.enemies || [];
    for (var enemyIndex = 0; enemyIndex < Math.min(enemies.length, 110); enemyIndex++) {
      var e = enemies[enemyIndex], type = this.monsters[e.type] ? e.type : 'crawler', mesh = this.monsters[type].body, size = Math.max(.4, finite(e.radius, .5) / .5);
      var state = this.sampleActor(game, e, 'enemy', type, size, dt);
      // Track real travel even when hidden; the cull margin covers tails and feet.
      if (!this.visibleAt(e.x, e.y, size * 2.4)) { this.stats.culledEnemies++; continue; }
      var i = counts[type]++;
      this.writeActor(mesh, i, e, state, size, false); this.stats.renderedEnemies++;
      if (shadowCount < 128) this.setInstance(this.shadows, shadowCount++, e.x, .009, e.y + .08, size * 1.8, size * 1.25, 1, state.aimAngle, undefined, -Math.PI / 2);
    }
    this.finishPool(this.shadows, shadowCount);
    if (this.mapChanged) { this.lastDeathEvent = finite(game.eventSerial, 0); this.mapChanged = false; }
    (game.events || []).forEach(function (event) {
      if (event.id <= self.lastDeathEvent) return;
      if (event.kind === 'enemy-death') {
        var angle = (event.id * 1.78) % TAU;
        self.actorStates.forEach(function (s) { if (s.type === event.enemyType && s.entityRef.hp <= 0 && Math.hypot(s.lastX - event.x, s.lastY - event.y) < .6) angle = s.aimAngle; });
        self.corpses.push({ id: event.id, type: event.enemyType || 'crawler', x: event.x, y: event.y, angle: angle, created: self.time });
      }
      self.lastDeathEvent = Math.max(self.lastDeathEvent, event.id);
    });
    this.actorStates.forEach(function (s, key) { if (s.seen !== self.actorFrame) self.actorStates.delete(key); });
    var surviving = 0;
    for (i = 0; i < this.corpses.length; i++) if (this.time - this.corpses[i].created < 120) this.corpses[surviving++] = this.corpses[i];
    this.corpses.length = surviving;
    if (surviving > 48) this.corpses.splice(0, surviving - 48);
    this.corpses.forEach(function (c) {
      var type = self.monsters[c.type] ? c.type : 'crawler', spec = root.AlienShooterWorld && root.AlienShooterWorld.enemyTypes[type], size = (spec ? spec.radius : .46) / .5;
      if (!self.visibleAt(c.x, c.y, size * 2.4)) { self.stats.culledCorpses++; return; }
      var i = counts[type]++, mesh = self.monsters[type].body;
      self.setInstance(mesh, i, c.x, .015, c.y, size, size, size, c.angle);
      mesh.geometry.attributes.instancePose.setXYZW(i, 4, 0, 0, 0); self.stats.renderedCorpses++;
    });
    Object.keys(counts).forEach(function (type) { self.finishPool(self.monsters[type].body, counts[type]); });
  };
  Renderer.prototype.updateObjects = function (game) {
    var self = this, bodies = 0, marks = 0, colors = { health: 0xf28e78, armor: 0x73b7cf, ammo: 0xd6bd70, credits: 0xf1d68a, grenade: 0x9dbc6c };
    (game.pickups || []).slice(0, 60).forEach(function (p) {
      if (!self.visibleAt(p.x, p.y, 1.6)) return;
      var i = bodies++, color = colors[p.type] || 0xffffff, hover = .28 + Math.sin(self.time * 3 + p.id) * .055;
      var tileAttribute = self.pickupBodies.geometry.attributes.instanceAtlasRect;
      self.setInstance(self.pickupBodies, i, p.x, hover, p.y, .4, .25, .32, .15, tileAttribute ? 0xffffff : color);
      if (tileAttribute) {
        var names = { health: 'pickupHealth', armor: 'pickupArmor', ammo: 'pickupAmmo', credits: 'pickupCredits', grenade: 'pickupGrenade' };
        var rect = self.baked.atlas.tiles[names[p.type] || 'pickupAmmo'];
        tileAttribute.setXYZW(i, rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
      }
      self.setInstance(self.pickupGlows, i, p.x, .025, p.y, 1.3, 1.3, 1, 0, color, -Math.PI / 2);
      if (tileAttribute) return;
      if (p.type === 'health') { self.setInstance(self.pickupMarks, marks++, p.x, hover + .135, p.y, .08, .018, .24, 0, 0xffffff); self.setInstance(self.pickupMarks, marks++, p.x, hover + .14, p.y, .24, .018, .08, 0, 0xffffff); }
      else self.setInstance(self.pickupMarks, marks++, p.x, hover + .135, p.y, .26, .018, .06, 0, 0xf1eee0);
    });
    this.finishPool(this.pickupBodies, bodies); this.finishPool(this.pickupGlows, bodies); this.finishPool(this.pickupMarks, marks);
    var count = 0;
    ((game.map || {}).barrels || []).slice(0, 32).forEach(function (b) { if (b.exploded || b.hp <= 0 || !self.visibleAt(b.x, b.y, 1.5)) return; self.setInstance(self.barrelBodies, count++, b.x, 0, b.y, 1, 1, 1, 0); });
    this.finishPool(this.barrelBodies, count);
    count = 0;
    ((game.map || {}).doors || []).slice(0, 20).forEach(function (d) {
      if (d.open || !self.visibleAt(d.x + d.w / 2, d.y + d.h / 2, Math.max(d.w, d.h) / 2 + 1.5)) return;
      var i = count++, x = d.x + d.w / 2, z = d.y + d.h / 2;
      self.setInstance(self.doors, i, x, .65, z, d.w, 1.3, d.h, 0, 0x71857b);
      self.setInstance(self.doorBars, i, x, 1.32, z, d.w > d.h ? d.w * .78 : .08, .035, d.h > d.w ? d.h * .78 : .08, 0);
    });
    this.finishPool(this.doors, count); this.finishPool(this.doorBars, count);
    count = 0;
    ((game.map || {}).objectives || []).slice(0, 8).forEach(function (o) {
      if (!self.visibleAt(o.x, o.y, 3)) return;
      var i = count++, color = o.status === 'done' ? 0x8cd39a : o.status === 'locked' ? 0x6d7e75 : o.status === 'defending' ? 0xf1a864 : 0x88d6d4;
      self.setInstance(self.objectiveRings, i, o.x, .03, o.y, 1.1, 1.1, 1.1, 0, color, -Math.PI / 2);
      self.setInstance(self.objectiveGlows, i, o.x, .02, o.y, 2.6 + Math.sin(self.time * 2) * .12, 2.6 + Math.sin(self.time * 2) * .12, 1, 0, color, -Math.PI / 2);
    });
    this.finishPool(this.objectiveRings, count); this.finishPool(this.objectiveGlows, count);
    count = 0;
    (game.grenades || []).slice(0, 20).forEach(function (g) { if (!self.visibleAt(g.x, g.y, 1.5)) return; var t = clamp((g.age || 0) / (g.fuse || 1.2), 0, 1); self.setInstance(self.grenadeBodies, count++, g.x, .15 + Math.sin(t * Math.PI) * .8, g.y, .13, .16, .13, self.time * 8); }); this.finishPool(this.grenadeBodies, count);
  };
  Renderer.prototype.updateEffects = function (game) {
    var self = this, count = 0, scorchCount = 0;
    (game.decals || []).slice(-180).forEach(function (d, index) {
      var size = finite(d.size, 1), scorch = d.type === 'scorch';
      if (!self.visibleAt(d.x, d.y, size * .8 + 1)) return;
      self.setInstance(scorch ? self.scorches : self.decals, scorch ? scorchCount++ : count++, d.x, .013 + index * .00001, d.y, size, size, 1, finite(d.angle, 0), scorch ? 0xffffff : 0x4f662d, -Math.PI / 2);
    });
    this.finishPool(this.decals, count); this.finishPool(this.scorches, scorchCount);
    count = 0;
    (game.bullets || []).slice(0, 512).forEach(function (b) {
      if (!self.visibleAt(b.x, b.y, 1.5)) return;
      var i = count++ * 6, vx = finite(b.vx, 0), vy = finite(b.vy, 0), speed = Math.hypot(vx, vy) || 1, length = b.enemy ? .3 : b.type === 'plasma' ? .75 : .65, color = b.enemy ? 0xb8e463 : b.type === 'plasma' ? 0x78dbe6 : 0xffda86;
      self.tracerPositions[i] = b.x - vx / speed * length; self.tracerPositions[i + 1] = b.enemy ? .4 : 1.34; self.tracerPositions[i + 2] = b.y - vy / speed * length;
      self.tracerPositions[i + 3] = b.x; self.tracerPositions[i + 4] = b.enemy ? .4 : 1.34; self.tracerPositions[i + 5] = b.y;
      self.color.setHex(color).convertSRGBToLinear(); for (var j = 0; j < 2; j++) { self.tracerColors[i + j * 3] = self.color.r; self.tracerColors[i + j * 3 + 1] = self.color.g; self.tracerColors[i + j * 3 + 2] = self.color.b; }
    });
    this.tracerGeometry.setDrawRange(0, count * 2); this.tracerGeometry.attributes.position.needsUpdate = true; this.tracerGeometry.attributes.color.needsUpdate = true; this.tracers.visible = count > 0;
    count = 0; var explosions = 0;
    (game.particles || []).slice(0, 360).forEach(function (p) {
      if (!self.visibleAt(p.x, p.y, Math.max(2, finite(p.size, 1) * 1.2))) return;
      var ratio = clamp(finite(p.life, 0) / Math.max(.01, finite(p.maxLife, 1)), 0, 1);
      if (p.type === 'explosion' && explosions < 24) { var size = finite(p.size, 1) * (.25 + (1 - ratio) * .8); self.setInstance(self.explosions, explosions++, p.x, .32 + size * .3, p.y, size, size * .55, size, 0, ratio > .55 ? 0xffde87 : 0xca632d); }
      var i = count++ * 3, color = p.color || (p.type === 'blood' ? 0x87a756 : p.type === 'acid' ? 0xb4e668 : 0xffb467);
      self.effectPositions[i] = p.x; self.effectPositions[i + 1] = p.type === 'blood' ? .16 : .2 + (1 - ratio) * .7; self.effectPositions[i + 2] = p.y;
      self.color.set(color).convertSRGBToLinear().multiplyScalar(ratio); self.effectColors[i] = self.color.r; self.effectColors[i + 1] = self.color.g; self.effectColors[i + 2] = self.color.b;
    });
    this.effectGeometry.setDrawRange(0, count); this.effectGeometry.attributes.position.needsUpdate = true; this.effectGeometry.attributes.color.needsUpdate = true; this.effects.visible = count > 0; this.finishPool(this.explosions, explosions);
  };
  Renderer.prototype.resize = function (width, height) {
    if (this.disposed) return; width = Math.max(1, finite(width, 1280)); height = Math.max(1, finite(height, 720));
    var scale = Math.min(1, 1600 / width, 1000 / height); this.width = Math.round(width * scale); this.height = Math.round(height * scale);
    if (this.renderer) this.renderer.setSize(this.width, this.height, false);
  };
  Renderer.prototype.screenToWorld = function (nx, ny) {
    if (!this.camera || this.disposed) return null;
    this.raycaster.setFromCamera(new T.Vector2(clamp(nx, 0, 1) * 2 - 1, 1 - clamp(ny, 0, 1) * 2), this.camera);
    return this.raycaster.ray.intersectPlane(this.groundPlane, this.hitPoint) ? { x: this.hitPoint.x, y: this.hitPoint.z } : null;
  };
  Renderer.prototype.render = function (game, dt) {
    if (this.failed || this.disposed || this.contextLost || this.pendingTextures || !game || !game.map) return;
    dt = clamp(finite(dt, 1 / 60), 0, .1); if (game.phase === 'playing' || game.phase === 'title') this.time += dt;
    this.stats.uploadedInstances = 0;
    this.setMap(game.map, game.stage); this.updateCamera(game, dt); this.updateActors(game, dt); this.updateObjects(game); this.updateEffects(game);
    this.renderer.render(this.scene, this.camera); this.active = true;
    this.stats.calls = this.renderer.info.render.calls; this.stats.triangles = this.renderer.info.render.triangles; this.stats.frames++;
    this.stats.geometries = this.renderer.info.memory.geometries; this.stats.textures = this.renderer.info.memory.textures;
  };
  Renderer.prototype.dispose = function () {
    if (this.disposed) return; this.disposed = true; this.active = false; if (this.actorStates) this.actorStates.clear();
    this.canvas.removeEventListener('webglcontextlost', this._lost); this.canvas.removeEventListener('webglcontextrestored', this._restored);
    if (this.world) this.clearWorld(); this.geometries.forEach(function (g) { g.dispose(); }); this.materials.forEach(function (m) { m.dispose(); }); this.textures.forEach(function (t) { t.dispose(); });
    if (this.renderer) { this.renderer.dispose(); if (this.renderer.forceContextLoss) this.renderer.forceContextLoss(); }
  };
  root.AlienShooterRenderer = Renderer;
})(typeof window !== 'undefined' ? window : this);
