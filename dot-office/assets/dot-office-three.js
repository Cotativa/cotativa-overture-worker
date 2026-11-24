let THREE;
try {
  THREE = await import('https://cdn.jsdelivr.net/npm/three@0.183.2/build/three.module.js');
} catch (primaryError) {
  try {
    THREE = await import('https://unpkg.com/three@0.183.2/build/three.module.js');
  } catch (fallbackError) {
    const stage=document.querySelector('[data-dot-office-stage]');
    if(stage)stage.innerHTML='<div style="display:grid;place-items:center;height:100%;padding:30px;color:#d8e5e7;background:#071018;font:600 14px system-ui;text-align:center">Não foi possível carregar o renderer 3D agora. Atualize a página para tentar novamente.</div>';
    throw fallbackError;
  }
}

/**
 * DOT Office Premium Illustrated 3D Renderer v4.11.1
 *
 * Goal: reproduce the approved Cotativa premium isometric office language
 * inside the live system (not as a static image). The office remains WebGL /
 * Three.js and stays bound to the real Cotativa snapshot, jobs and stations.
 *
 * Visual foundation adapted from Gaurav2693/ai-office (MIT), substantially
 * rebuilt here with adult rounded characters, richer materials, warm/cool
 * lighting, full-office framing and multi-agent activity.
 */

const root=document.querySelector('[data-dot-office]');
const stage=root?.querySelector('[data-dot-office-stage]');
const payloadEl=root?.querySelector('[data-dot-office-stations-json]');
if(!root||!stage||!payloadEl)throw new Error('DOT Office Premium 3D mount not found');

let snapshot={};
try{snapshot=JSON.parse(payloadEl.textContent||'{}')}catch(_){snapshot={}}

const C={
  bg:0x07121b,slab:0x252d32,slabEdge:0x0f1519,wall:0x1f2930,wall2:0x303b41,
  glass:0xb9e5ee,wood:0x9b6b43,woodLight:0xb77f4f,woodDark:0x5a3d2d,metal:0x708087,
  dark:0x11171b,screen:0x06161e,teal:0x47d4b0,green:0x68cf91,blue:0x69add8,
  amber:0xe6b35c,red:0xd87373,white:0xeff5f3,muted:0x88999d,carpet:0x31424a,
  carpet2:0x2c4b43,tile:0x5a5a54,tile2:0x64605a,plant:0x3f885d,plant2:0x68a36d
};

const STATIONS={
  manager:{label:'GERÊNCIA',x:-9.15,z:-5.15,color:0xd9ac69,role:'Gerência'},
  social:{label:'SOCIAL',x:4.25,z:-4.75,color:0x55ccb0,role:'Social'},
  content:{label:'CONTEÚDO',x:9.25,z:-.85,color:0x7da9df,role:'Conteúdo'},
  seo:{label:'SEO & GOOGLE',x:-7.55,z:2.75,color:0x68cf91,role:'SEO & Google'},
  operations:{label:'OPERAÇÕES',x:-.65,z:1.7,color:0x66bdd9,role:'Operações'},
  engineering:{label:'ENGENHARIA',x:4.55,z:4.65,color:0x9aaee8,role:'Engenharia'}
};

const ROLE_STATION={
  'gerencia':'manager','manager':'manager','social':'social','conteudo':'content',
  'seo & google':'seo','seo':'seo','google':'seo','operacoes':'operations','operations':'operations',
  'engenharia':'engineering','engineering':'engineering'
};

const scene=new THREE.Scene();
scene.background=new THREE.Color(C.bg);
scene.fog=new THREE.FogExp2(C.bg,.0065);

const camera=new THREE.OrthographicCamera(-18,18,12,-12,.1,160);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.38;
renderer.outputColorSpace=THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);

const world=new THREE.Group();
world.rotation.y=0;
scene.add(world);

const stationPads=new Map();
const stationLeadSeats=new Map();
const leadViews=new Map();
const ambientViews=[];
const previousJobs=new Map();
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
let operationsTexture=null;
let focusedStation=null;
let drag=false,dragMoved=false,dragStart={x:0,y:0},dragPrev={x:0,y:0};

const cameraState={
  theta:.72,
  thetaBase:.72,
  radius:36,
  height:25,
  zoom:1,
  target:new THREE.Vector3(0,.8,0)
};

const deg=v=>v*Math.PI/180;
const stdMat=(color,{roughness=.62,metalness=.08,emissive=0x000000,emissiveIntensity=0,transparent=false,opacity=1}={})=>
  new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity,transparent,opacity});
const physical=(color,opts={})=>new THREE.MeshPhysicalMaterial({
  color,roughness:.22,metalness:.05,transmission:.36,thickness:.16,ior:1.42,
  transparent:true,opacity:.30,depthWrite:false,...opts
});
const box=(w,h,d,color,opts={})=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),stdMat(color,opts));
  m.castShadow=opts.castShadow!==false;m.receiveShadow=opts.receiveShadow!==false;return m;
};
const sphere=(r,color,opts={})=>{
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,28,20),stdMat(color,opts));
  m.castShadow=true;m.receiveShadow=true;return m;
};
const cyl=(rt,rb,h,color,segments=24,opts={})=>{
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),stdMat(color,opts));
  m.castShadow=true;m.receiveShadow=true;return m;
};
const plane=(w,h,material)=>new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);

function canvasTexture(w,h,draw){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');draw(ctx,canvas);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
  return {canvas,ctx,texture};
}

function makeTextTexture({title,sub='',accent='#4fd2b0',bg='rgba(5,13,17,.94)',size=42,subSize=20}){
  return canvasTexture(768,180,(g,c)=>{
    g.clearRect(0,0,c.width,c.height);
    g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);
    g.strokeStyle=accent;g.lineWidth=5;g.strokeRect(5,5,c.width-10,c.height-10);
    g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='#eff5f3';g.font='900 '+size+'px Arial';g.fillText(title,c.width/2,67);
    if(sub){g.fillStyle=accent;g.font='800 '+subSize+'px monospace';g.fillText(sub,c.width/2,126);}
  });
}

function addLabel(parent,title,sub,color,position,scale=[2.2,.52]){
  const t=makeTextTexture({title,sub,accent:color});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t.texture,transparent:true,depthTest:false}));
  s.scale.set(scale[0],scale[1],1);s.position.set(...position);parent.add(s);return s;
}

function addGlowStrip(x,y,z,w,d,color=C.amber,intensity=.8){
  const mesh=box(w,.035,d,color,{emissive:color,emissiveIntensity:2.8,roughness:.25,castShadow:false});
  mesh.position.set(x,y,z);world.add(mesh);
  const light=new THREE.PointLight(color,intensity,4.6,2);light.position.set(x,y+.3,z);world.add(light);
}

function addTileFloor(){
  const base=box(27.4,.36,20.4,C.slab);base.position.y=-.25;world.add(base);
  const under=box(27.8,.42,20.8,C.slabEdge);under.position.y=-.53;world.add(under);

  const tex=canvasTexture(1024,768,(g,c)=>{
    const tile=64;
    g.fillStyle='#5e5d57';g.fillRect(0,0,c.width,c.height);
    for(let y=0;y<c.height;y+=tile){
      for(let x=0;x<c.width;x+=tile){
        g.fillStyle=((x/tile+y/tile)%2)?'#5c5b56':'#65625c';g.fillRect(x,y,tile,tile);
        g.strokeStyle='rgba(255,255,255,.075)';g.lineWidth=2;g.strokeRect(x,y,tile,tile);
      }
    }
  });
  tex.texture.wrapS=THREE.RepeatWrapping;tex.texture.wrapT=THREE.RepeatWrapping;tex.texture.repeat.set(5.5,4.1);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(26.9,19.9),new THREE.MeshStandardMaterial({map:tex.texture,roughness:.94,metalness:0}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.045;floor.receiveShadow=true;world.add(floor);
}

function addCarpet(x,z,w,d,color){
  const p=box(w,.035,d,color,{roughness:1,castShadow:false});p.position.set(x,.02,z);world.add(p);return p;
}

function addWall(x,z,w,d,h=3.7,color=C.wall){
  const m=box(w,h,d,color,{roughness:.72});m.position.set(x,h/2,z);world.add(m);return m;
}

function addGlassWall(x,z,w,d,h=2.8){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),physical(C.glass,{opacity:.23,transmission:.48}));
  m.position.set(x,h/2,z);world.add(m);
  const frameColor=0x52656d;
  if(w>d){
    [-w/2,w/2].forEach(dx=>{const f=box(.055,h+.06,.07,frameColor,{metalness:.35});f.position.set(x+dx,h/2,z);world.add(f);});
    const top=box(w+.06,.055,.07,frameColor,{metalness:.35});top.position.set(x,h,z);world.add(top);
  }else{
    [-d/2,d/2].forEach(dz=>{const f=box(.07,h+.06,.055,frameColor,{metalness:.35});f.position.set(x,h/2,z+dz);world.add(f);});
    const top=box(.07,.055,d+.06,frameColor,{metalness:.35});top.position.set(x,h,z);world.add(top);
  }
  return m;
}

function addPlant(x,z,scale=1){
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  const pot=cyl(.29,.24,.48,0x777168,28,{roughness:.9});pot.position.y=.24;g.add(pot);
  const soil=cyl(.23,.23,.025,0x3a2c22,24);soil.position.y=.49;g.add(soil);
  const leafMat1=stdMat(C.plant,{roughness:.88}),leafMat2=stdMat(C.plant2,{roughness:.88});
  const dirs=[[-.22,.08,.08,.6],[.20,.06,.02,-.55],[-.08,.04,-.22,.2],[.08,.02,.20,-.1],[-.30,.03,-.10,.9],[.28,.02,.14,-.8],[0,.04,0,0]];
  dirs.forEach((d,i)=>{
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(.16,18,12),i%2?leafMat1:leafMat2);
    leaf.scale.set(1.0*scale,1.65*scale,.55*scale);
    leaf.position.set(d[0]*scale,.64*scale+(i%3)*.13,d[2]*scale);leaf.rotation.z=d[3];leaf.rotation.x=.25*(i%2?1:-1);leaf.castShadow=true;g.add(leaf);
  });
  g.scale.setScalar(scale);
}

function addBookshelf(x,z,ry=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;world.add(g);
  const frame=box(1.25,2.4,.42,0x4f392b);frame.position.y=1.2;g.add(frame);
  [0.38,.9,1.42,1.94].forEach(y=>{
    const shelf=box(1.18,.06,.46,0x8d6648);shelf.position.y=y;g.add(shelf);
    const colors=[0x6da0d0,0xc87969,0xd4a85b,0x78b589,0x957dc1];
    for(let i=0;i<5;i++){
      const b=box(.12,.30+(i%2)*.08,.25,colors[i]);b.position.set(-.42+i*.21,y+.18,.05);g.add(b);
    }
  });
}

function addCabinet(x,z,w=1.55,ry=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;world.add(g);
  const body=box(w,.76,.56,C.woodDark,{roughness:.72});body.position.y=.38;g.add(body);
  const top=box(w+.05,.07,.60,C.woodLight,{roughness:.5});top.position.y=.79;g.add(top);
  [-.28,.28].forEach(px=>{
    const h=cyl(.025,.025,.14,0xc8b59e,12,{metalness:.55});h.rotation.z=Math.PI/2;h.position.set(px*w,.47,.30);g.add(h);
  });
}

function addSofa(x,z,ry=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;world.add(g);
  const seat=box(2.2,.28,.82,0x4a5960,{roughness:.9});seat.position.y=.42;g.add(seat);
  const back=box(2.2,.76,.20,0x3a484f,{roughness:.95});back.position.set(0,.78,-.38);g.add(back);
  [-1.0,1.0].forEach(px=>{const arm=box(.22,.50,.82,0x3a484f,{roughness:.95});arm.position.set(px,.53,0);g.add(arm);});
  [-.48,.48].forEach((px,i)=>{const c=box(.82,.13,.62,i?0x69777c:0x5e6f74,{roughness:1});c.position.set(px,.61,.03);g.add(c);});
}

function addRoundTable(x,z,r=.82){
  const top=cyl(r,r,.09,C.wood,32,{roughness:.52});top.position.set(x,.76,z);world.add(top);
  const stem=cyl(.09,.09,.68,C.metal,20,{metalness:.35});stem.position.set(x,.36,z);world.add(stem);
  const foot=cyl(.40,.40,.06,C.dark,28,{metalness:.15});foot.position.set(x,.03,z);world.add(foot);
}

function addChair(x,z,ry=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;world.add(g);
  const seat=new THREE.Mesh(new THREE.CylinderGeometry(.34,.37,.13,28),stdMat(0x263238,{roughness:.82}));
  seat.rotation.z=Math.PI/2;seat.rotation.y=Math.PI/2;seat.position.y=.49;g.add(seat);
  const back=box(.58,.72,.10,0x263238,{roughness:.82});back.position.set(0,.83,.26);g.add(back);
  const stem=cyl(.055,.055,.40,C.metal,18,{metalness:.45});stem.position.y=.25;g.add(stem);
  const base=cyl(.29,.34,.05,C.dark,24,{metalness:.20});base.position.y=.035;g.add(base);
  return g;
}

function addDesk(x,z,{w=2.2,dual=true,accent=C.teal,ry=0,label=''}={}){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;world.add(g);
  const top=box(w,.11,.90,C.woodLight,{roughness:.48});top.position.y=.82;g.add(top);
  const modesty=box(w-.24,.52,.07,C.woodDark,{roughness:.68});modesty.position.set(0,.46,.41);g.add(modesty);
  [-w*.42,w*.42].forEach(px=>{const leg=cyl(.055,.055,.78,C.metal,18,{metalness:.45});leg.position.set(px,.39,-.31);g.add(leg);});
  const screens=dual?2:1;
  for(let i=0;i<screens;i++){
    const ox=screens===2?(i? .47:-.47):0;
    const body=box(.76,.47,.055,0x20282c,{roughness:.42});body.position.set(ox,1.26,-.27);g.add(body);
    const scr=box(.68,.39,.018,C.screen,{emissive:accent,emissiveIntensity:.28,roughness:.25,castShadow:false});scr.position.set(ox,1.26,-.303);g.add(scr);
    const stand=cyl(.035,.035,.22,C.metal,14,{metalness:.5});stand.position.set(ox,1.01,-.26);g.add(stand);
  }
  const keyboard=box(.58,.025,.18,0x2a3337,{roughness:.55});keyboard.position.set(0,.89,.05);g.add(keyboard);
  const mug=cyl(.07,.07,.15,0xe7e2da,18,{roughness:.55});mug.position.set(w*.35,.97,.14);g.add(mug);
  const glow=new THREE.PointLight(accent,.42,2.2,2);glow.position.set(0,1.20,-.72);g.add(glow);
  const chair=addChair(x,z+.85,ry);chair.removeFromParent();g.add(chair);chair.position.set(0,0,.85);
  if(label)addLabel(g,label,'','#'+new THREE.Color(accent).getHexString(),[0,.22,.88],[1.75,.38]);
  const seatWorld=()=>g.localToWorld(new THREE.Vector3(0,0,.86));
  const standWorld=()=>g.localToWorld(new THREE.Vector3(0,0,1.20));
  return {group:g,seatWorld,standWorld};
}

function addFloorLamp(x,z,warm=true){
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  const base=cyl(.26,.31,.05,C.dark,24,{metalness:.3});base.position.y=.025;g.add(base);
  const pole=cyl(.025,.025,2.15,C.metal,16,{metalness:.6});pole.position.y=1.10;g.add(pole);
  const shade=cyl(.27,.18,.30,warm?0xe6c67d:0xaed7e2,24,{roughness:.5});shade.position.y=2.14;g.add(shade);
  const light=new THREE.PointLight(warm?0xffd18c:0xa6dbff,warm?1.1:.75,5,2);light.position.y=1.95;g.add(light);
}

function addServerRack(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);world.add(g);
  const body=box(1.0,2.45,.92,0x12191d,{roughness:.50,metalness:.35});body.position.y=1.225;g.add(body);
  for(let i=0;i<8;i++){
    const slot=box(.78,.19,.025,0x28363d,{metalness:.30});slot.position.set(0,.35+i*.25,-.472);g.add(slot);
    const led=sphere(.028,i%3===0?C.green:C.blue,{emissive:i%3===0?C.green:C.blue,emissiveIntensity:2.5});led.position.set(-.29,.35+i*.25,-.49);g.add(led);
  }
  const glow=new THREE.PointLight(C.blue,.75,3.0,2);glow.position.set(0,1.2,-.7);g.add(glow);
}

function addWhiteboard(x,z,ry=0,title='PLANEJAMENTO'){
  const tex=canvasTexture(640,420,(g,c)=>{
    g.fillStyle='#f4f1e9';g.fillRect(0,0,c.width,c.height);
    g.fillStyle='#24333a';g.font='900 48px Arial';g.fillText(title,40,70);
    g.font='30px Arial';['✓ Campanhas','✓ Produção de conteúdo','✓ Otimizações SEO','✓ Resultados','✓ Novos Projetos'].forEach((t,i)=>g.fillText(t,50,135+i*52));
  });
  const p=plane(3.6,2.25,new THREE.MeshStandardMaterial({map:tex.texture,roughness:.78}));
  p.position.set(x,1.55,z);p.rotation.y=ry;world.add(p);
  const frame=box(3.78,2.42,.06,0x57646a,{metalness:.4});frame.position.copy(p.position);frame.position.z+=ry===0?.04:0;frame.rotation.y=ry;world.add(frame);p.position.z-=.035;
}

function addBrandPanel(x,z,w=5.5,h=1.6){
  const tex=canvasTexture(1024,300,(g,c)=>{
    g.clearRect(0,0,c.width,c.height);g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='#f5f8f7';g.font='900 126px Arial';g.fillText('COTATIVA',c.width/2,112);
    g.fillStyle='#48d3b0';g.font='800 34px monospace';g.fillText('TECNOLOGIA PARA NEGÓCIOS',c.width/2,205);
  });
  const p=plane(w,h,new THREE.MeshBasicMaterial({map:tex.texture,transparent:true}));
  p.position.set(x,2.25,z);world.add(p);
}

function addEntrance(){
  // Front-left entrance / exit: visible in the approved wide angle.
  const gx=-12.55,gz=6.25;
  addGlassWall(gx,5.8,.08,3.1,2.9);
  addGlassWall(gx,8.55,.08,2.1,2.9);
  const doorMat=physical(C.glass,{opacity:.18,transmission:.55});
  [-.52,.52].forEach(dx=>{
    const d=new THREE.Mesh(new THREE.BoxGeometry(1.0,2.65,.06),doorMat);
    d.position.set(gx+dx,1.35,7.24);d.rotation.y=Math.PI/2;world.add(d);
    const handle=cyl(.022,.022,.48,0xaec0c5,14,{metalness:.7});handle.rotation.z=Math.PI/2;handle.position.set(gx+dx+(dx<0?.33:-.33),1.35,7.18);world.add(handle);
  });
  const matTex=canvasTexture(640,220,(g,c)=>{
    g.fillStyle='#111719';g.fillRect(0,0,c.width,c.height);g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='#f4f7f6';g.font='900 78px Arial';g.fillText('COTATIVA',c.width/2,92);
    g.fillStyle='#49d1b0';g.font='800 22px monospace';g.fillText('TECNOLOGIA PARA NEGÓCIOS',c.width/2,152);
  });
  const welcome=plane(3.6,1.25,new THREE.MeshStandardMaterial({map:matTex.texture,roughness:1}));
  welcome.rotation.x=-Math.PI/2;welcome.rotation.z=-Math.PI/2;welcome.position.set(-11.1,.025,7.25);world.add(welcome);
  addGlowStrip(-12.35,2.95,7.2,.05,2.6,C.amber,.55);
}

function addStationArea(key,x,z,w,d,color){
  const p=addCarpet(x,z,w,d,color);
  p.material.transparent=true;p.material.opacity=.80;p.userData.station=key;stationPads.set(key,p);
  addLabel(world,STATIONS[key].label,'','#'+new THREE.Color(STATIONS[key].color).getHexString(),[x,.20,z+d/2-.35],[2.0,.44]);
}

function addOperationsScreen(){
  operationsTexture=canvasTexture(1200,660,()=>{});
  const frame=box(8.35,4.55,.24,0x121b20,{metalness:.25});frame.position.set(0,2.35,-9.34);world.add(frame);
  const screen=plane(7.95,4.15,new THREE.MeshBasicMaterial({map:operationsTexture.texture}));
  screen.position.set(0,2.35,-9.20);world.add(screen);
  addGlowStrip(0,.22,-8.93,8.25,.06,C.amber,.85);
  const glow=new THREE.PointLight(C.teal,1.10,7.5,2);glow.position.set(0,2.3,-7.7);world.add(glow);
  redrawOperations(snapshot);
}

function redrawOperations(snap){
  if(!operationsTexture)return;
  const g=operationsTexture.ctx,c=operationsTexture.canvas,m=snap?.metrics||{};
  g.fillStyle='#06131a';g.fillRect(0,0,c.width,c.height);
  g.strokeStyle='#2f7c88';g.lineWidth=10;g.strokeRect(16,16,c.width-32,c.height-32);
  g.fillStyle='#f0f5f4';g.font='900 62px Arial';g.fillText('OPERAÇÕES | FILA DE TAREFAS',56,82);
  g.fillStyle='#68dac3';g.font='800 24px monospace';g.fillText('COTATIVA · TEMPO REAL',60,120);
  g.fillStyle='#dbe7e5';g.font='800 28px monospace';g.textAlign='right';g.fillText(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),1140,82);g.textAlign='left';

  const cards=[
    ['FILA',Number(m.pending||0),'#6aaee0'],['EXEC',Number(m.processing_agents||0),'#4ed6b3'],
    ['RETRY',Number(m.retry||0),'#e7b35c'],['24H',Number(m.done_24h||0),'#68cf91'],
    ['SUCESSO',Number(m.success_24h||0).toFixed(0)+'%','#68cf91']
  ];
  cards.forEach((v,i)=>{
    const x=52+i*218,y=150;g.fillStyle='#102a34';g.fillRect(x,y,192,98);
    g.fillStyle='#789096';g.font='800 20px monospace';g.fillText(v[0],x+16,y+30);
    g.fillStyle=v[2];g.font='900 42px Arial';g.fillText(String(v[1]),x+16,y+76);
  });

  g.fillStyle='#88a0a5';g.font='900 23px monospace';g.fillText('TAREFAS ATIVAS',58,303);
  const tasks=(snap?.task_board||[]).slice(0,5);
  if(!tasks.length){g.fillStyle='#6c8187';g.font='26px Arial';g.fillText('Sem tarefas ativas agora.',58,352);}
  tasks.forEach((t,i)=>{
    const y=351+i*50,st=String(t.status||''),co=/failed|error|waiting|retry/i.test(st)?'#e6b35c':'#49d4b0';
    g.fillStyle=co;g.fillRect(60,y-16,13,13);
    let label=(t.agent_name||t.role||'DOT')+' · '+(t.label||t.type||'Tarefa');if(label.length>56)label=label.slice(0,54)+'…';
    g.fillStyle='#dce9e7';g.font='700 25px Arial';g.fillText(label,88,y);
    const pr=Math.max(0,Math.min(100,Number(t.progress||0)));
    g.fillStyle='#17323b';g.fillRect(855,y-18,250,14);g.fillStyle=co;g.fillRect(855,y-18,250*(pr/100),14);
    g.fillStyle='#81979c';g.font='700 18px monospace';g.fillText(pr+'%',1110,y-6);
  });
  g.fillStyle='#7a9197';g.font='700 18px monospace';
  g.fillText('BLOQUEIOS '+Number(m.needs_user||0)+'  ·  EQUIPE '+Number(snap?.team?.enabled||0)+'/'+Number(snap?.team?.total||0),58,625);
  operationsTexture.texture.needsUpdate=true;
}

function createAdultPerson({shirt=0x1f3e49,pants=0x20272c,skin=0xbf8b69,hair=0x24282a,female=false}={}){
  const g=new THREE.Group();
  g.userData.anim={};
  const pelvis=cyl(.23,.27,.24,pants,24);pelvis.position.y=.92;g.add(pelvis);

  const torso=cyl(female?.28:.31,female?.24:.27,.66,shirt,28,{roughness:.82});torso.position.y=1.36;g.add(torso);
  const collar=cyl(.115,.12,.10,skin,20);collar.position.y=1.73;g.add(collar);
  const head=sphere(.215,skin,{roughness:.88});head.position.y=1.93;head.scale.set(.94,1.08,.92);g.add(head);

  const hairCap=sphere(.225,hair,{roughness:.95});hairCap.scale.set(.98,.58,.96);hairCap.position.y=2.07;g.add(hairCap);
  if(female){
    const backHair=sphere(.22,hair,{roughness:.95});backHair.scale.set(.82,1.22,.55);backHair.position.set(0,1.88,.16);g.add(backHair);
  }

  const makeArm=(side)=>{
    const shoulder=new THREE.Group();shoulder.position.set(side*(female?.30:.34),1.58,0);g.add(shoulder);
    const upper=cyl(.075,.085,.34,shirt,18);upper.position.y=-.16;shoulder.add(upper);
    const elbow=new THREE.Group();elbow.position.y=-.33;shoulder.add(elbow);
    const fore=cyl(.063,.070,.34,skin,18);fore.position.y=-.16;elbow.add(fore);
    const hand=sphere(.074,skin);hand.position.y=-.35;elbow.add(hand);
    return {shoulder,elbow,upper,fore,hand};
  };
  const makeLeg=(side)=>{
    const hip=new THREE.Group();hip.position.set(side*.14,.82,0);g.add(hip);
    const thigh=cyl(.095,.11,.44,pants,20);thigh.position.y=-.20;hip.add(thigh);
    const knee=new THREE.Group();knee.position.y=-.43;hip.add(knee);
    const shin=cyl(.075,.09,.42,pants,20);shin.position.y=-.19;knee.add(shin);
    const shoe=box(.16,.09,.28,0x111518,{roughness:.78});shoe.position.set(0,-.43,-.05);knee.add(shoe);
    return {hip,knee,thigh,shin,shoe};
  };
  const leftArm=makeArm(-1),rightArm=makeArm(1),leftLeg=makeLeg(-1),rightLeg=makeLeg(1);
  g.userData.rig={leftArm,rightArm,leftLeg,rightLeg,torso,head};
  g.userData.baseY=0;
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return g;
}

function poseSeated(person){
  const r=person.userData.rig;
  [r.leftLeg,r.rightLeg].forEach(leg=>{leg.hip.rotation.x=-1.12;leg.knee.rotation.x=1.55;});
  r.leftArm.shoulder.rotation.x=-.45;r.leftArm.elbow.rotation.x=-1.38;
  r.rightArm.shoulder.rotation.x=-.48;r.rightArm.elbow.rotation.x=-1.34;
  person.position.y=.02;
}

function poseStanding(person){
  const r=person.userData.rig;
  [r.leftLeg,r.rightLeg].forEach(leg=>{leg.hip.rotation.set(0,0,0);leg.knee.rotation.set(0,0,0);});
  r.leftArm.shoulder.rotation.set(.08,0,.04);r.rightArm.shoulder.rotation.set(.08,0,-.04);
  r.leftArm.elbow.rotation.set(0,0,0);r.rightArm.elbow.rotation.set(0,0,0);
}

function posePresenter(person){
  poseStanding(person);
  const r=person.userData.rig;
  r.rightArm.shoulder.rotation.z=-.55;r.rightArm.shoulder.rotation.x=-.35;r.rightArm.elbow.rotation.z=-.65;
}

function animateTyping(person,t){
  const r=person.userData.rig;if(!r)return;
  const a=Math.sin(t*4.5)*.08,b=Math.sin(t*5.1+1.4)*.07;
  r.leftArm.elbow.rotation.x=-1.38+a;r.rightArm.elbow.rotation.x=-1.34+b;
  r.torso.rotation.y=Math.sin(t*.9)*.015;
}

function animateWalk(person,t){
  const r=person.userData.rig;if(!r)return;
  const s=Math.sin(t*5.6)*.60;
  r.leftLeg.hip.rotation.x=s;r.rightLeg.hip.rotation.x=-s;
  r.leftArm.shoulder.rotation.x=-s*.55;r.rightArm.shoulder.rotation.x=s*.55;
  r.leftLeg.knee.rotation.x=Math.max(0,-s)*.45;r.rightLeg.knee.rotation.x=Math.max(0,s)*.45;
  person.position.y=.035+Math.abs(Math.sin(t*5.6))*.025;
}

function makeStaff({station,type='seated',slot,shirt,female=false,route=[]}){
  const p=createAdultPerson({shirt:shirt||STATIONS[station]?.color||0x31515a,female});
  world.add(p);
  const v={station,type,person:p,slot,route,routeIndex:0,speed:.72+Math.random()*.10,phase:type==='walker'?'walking':type,jobId:0,lead:false};
  if(type==='seated'){
    poseSeated(p);p.position.copy(slot);p.rotation.y=Math.PI;
  }else if(type==='presenter'){
    posePresenter(p);p.position.copy(slot);p.rotation.y=Math.PI;
  }else{
    poseStanding(p);p.position.copy(route[0]||slot);v.routeIndex=1;
  }
  ambientViews.push(v);return v;
}

function addLead(station,slot,female=false){
  const p=createAdultPerson({shirt:STATIONS[station].color,female});
  world.add(p);poseSeated(p);p.position.copy(slot);p.rotation.y=Math.PI;
  const v={station,person:p,home:slot.clone(),route:[],routeIndex:0,phase:'seated',jobId:0,lead:true,name:'DOT'};
  leadViews.set(station,v);stationLeadSeats.set(station,slot.clone());return v;
}

function createLayout(){
  addTileFloor();

  // warm architectural shell
  addWall(0,-9.62,27,.15,3.95,C.wall);
  addWall(-13.43,0,.15,19.3,3.95,C.wall);
  addGlowStrip(0,3.86,-9.43,26.5,.055,C.amber,.72);
  addGlowStrip(-13.22,3.60,-1.1,.055,16.6,C.amber,.52);

  // zones: richer carpets with visible separation, close to approved image.
  addStationArea('manager',-9.1,-5.35,6.1,5.4,0x6e5b48);
  addStationArea('social',4.25,-5.05,5.3,4.5,0x315b52);
  addStationArea('content',9.25,-.95,4.7,4.4,0x344d5b);
  addStationArea('seo',-7.55,2.95,5.7,4.4,0x335c50);
  addStationArea('operations',-.75,1.65,6.3,5.2,0x384d56);
  addStationArea('engineering',4.65,4.65,6.0,4.8,0x334753);

  // management glass office
  addGlassWall(-6.15,-5.28,.08,5.8,3.0);
  addGlassWall(-9.16,-2.62,5.95,.08,3.0);
  addBookshelf(-11.8,-6.2,0);addCabinet(-11.5,-3.7,1.5);addPlant(-6.8,-7.45,.95);addFloorLamp(-7.0,-6.9,true);

  // creative areas
  addGlassWall(6.85,-5.0,.08,5.0,2.55);
  addGlassWall(6.95,-.5,4.0,.08,2.45);
  addGlassWall(2.05,3.7,.08,5.0,2.45);
  addGlassWall(-4.55,3.4,.08,5.2,2.45);

  addEntrance();
  addOperationsScreen();
  addBrandPanel(9.4,-9.50,5.3,1.55);

  // manager
  const mgrDesk=addDesk(-9.25,-5.55,{w:2.35,dual:true,accent:STATIONS.manager.color});
  const mgrSeat=mgrDesk.seatWorld();addLead('manager',mgrSeat,false);

  // operations — long central production row
  const op1=addDesk(-2.15,1.35,{w:2.3,dual:true,accent:STATIONS.operations.color});
  const op2=addDesk(.25,1.35,{w:2.3,dual:true,accent:STATIONS.operations.color});
  const op3=addDesk(-.95,3.05,{w:2.3,dual:true,accent:STATIONS.operations.color,ry:Math.PI});
  addLead('operations',op1.seatWorld(),false);
  makeStaff({station:'operations',type:'seated',slot:op2.seatWorld(),female:true});
  makeStaff({station:'operations',type:'seated',slot:op3.seatWorld(),female:false});
  makeStaff({station:'operations',type:'presenter',slot:new THREE.Vector3(.15,0,-6.45),female:false});

  // social
  const so1=addDesk(3.55,-5.2,{w:2.2,dual:true,accent:STATIONS.social.color});
  const so2=addDesk(5.55,-5.2,{w:2.1,dual:true,accent:STATIONS.social.color});
  addLead('social',so1.seatWorld(),true);
  makeStaff({station:'social',type:'seated',slot:so2.seatWorld(),female:false});

  // content
  const co1=addDesk(8.55,-1.2,{w:2.1,dual:true,accent:STATIONS.content.color});
  const co2=addDesk(10.35,-1.2,{w:2.0,dual:true,accent:STATIONS.content.color});
  addLead('content',co1.seatWorld(),true);
  makeStaff({station:'content',type:'seated',slot:co2.seatWorld(),female:true});

  // SEO
  const se1=addDesk(-8.2,2.6,{w:2.2,dual:true,accent:STATIONS.seo.color});
  const se2=addDesk(-6.25,2.6,{w:2.1,dual:true,accent:STATIONS.seo.color});
  addLead('seo',se1.seatWorld(),false);
  makeStaff({station:'seo',type:'seated',slot:se2.seatWorld(),female:true});

  // Engineering
  const en1=addDesk(3.65,4.25,{w:2.3,dual:true,accent:STATIONS.engineering.color});
  const en2=addDesk(5.95,4.25,{w:2.3,dual:true,accent:STATIONS.engineering.color});
  addLead('engineering',en1.seatWorld(),false);
  makeStaff({station:'engineering',type:'seated',slot:en2.seatWorld(),female:false});

  // ambient walking employees — visible but excluded from real queue metrics.
  makeStaff({station:'operations',type:'walker',slot:new THREE.Vector3(-10.8,0,6.9),female:false,route:[
    new THREE.Vector3(-10.8,0,6.9),new THREE.Vector3(-7.8,0,5.8),new THREE.Vector3(-4.5,0,5.4),new THREE.Vector3(-2.8,0,3.8),
    new THREE.Vector3(-4.8,0,4.9),new THREE.Vector3(-8.8,0,6.2)
  ]});
  makeStaff({station:'engineering',type:'walker',slot:new THREE.Vector3(9.5,0,5.9),female:true,route:[
    new THREE.Vector3(9.5,0,5.9),new THREE.Vector3(7.2,0,5.7),new THREE.Vector3(4.0,0,6.3),new THREE.Vector3(1.8,0,5.2),
    new THREE.Vector3(4.8,0,6.1),new THREE.Vector3(8.5,0,6.2)
  ]});

  // central meeting/support
  const table=box(3.6,.11,1.65,C.wood,{roughness:.48});table.position.set(9.4,.79,5.9);world.add(table);
  [[-1.35,-1.08],[-.45,-1.08],[.45,-1.08],[1.35,-1.08],[-1.35,1.08],[-.45,1.08],[.45,1.08],[1.35,1.08]].forEach(([dx,dz])=>addChair(9.4+dx,5.9+dz,dz>0?Math.PI:0));

  // lounge / reception
  addSofa(-10.4,5.5,0);addRoundTable(-8.75,5.9,.58);addPlant(-11.8,4.6,1.0);addPlant(-7.8,6.3,.75);
  addBookshelf(-12.0,-.2,0);addCabinet(-10.5,-.25,1.5);addPlant(-9.4,-.15,.8);

  // planning, server, decor
  addWhiteboard(10.4,-5.3,0,'PLANEJAMENTO');
  addServerRack(7.35,5.1);addServerRack(8.45,5.1);
  addPlant(6.55,5.55,.8);addPlant(11.65,-6.45,1.0);addPlant(11.7,2.6,.9);addPlant(2.1,-6.6,.85);
  addCabinet(11.15,-3.0,1.7);addCabinet(11.5,2.8,1.55);
  addFloorLamp(11.7,-4.1,true);addFloorLamp(-5.5,5.8,false);

  // illuminated wall accents / ceiling spots
  [-10.5,-6.5,-2.5,1.5,5.5,9.5].forEach((x,i)=>{
    const l=new THREE.PointLight(i%2?0xffd18c:0xaadfff,i%2?.85:.60,6.2,2);l.position.set(x,3.25,-7.3);world.add(l);
  });
  [[-10,1.0],[-5,2.0],[0,3.0],[5,2.0],[10,1.0]].forEach(([x,z])=>addGlowStrip(x,.045,z,2.7,.035,C.amber,.35));
}

function normalizeRole(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function stationFromAgent(agent){
  const raw=normalizeRole(agent?.station||agent?.role||'operations');
  if(STATIONS[raw])return raw;
  return ROLE_STATION[raw]||'operations';
}

function setLeadStatus(view,agent,initial=false){
  if(!view)return;
  const jobId=Number(agent?.current_job_id||0),prev=previousJobs.get(view.station)||0;
  view.name=String(agent?.name||('Dot '+STATIONS[view.station].label));
  view.jobId=jobId;

  if(initial){seatLead(view);}
  else if(jobId>0&&jobId!==prev)startLeadHandoff(view,true);
  else if(prev>0&&jobId===0)startLeadHandoff(view,false);
  else if(view.phase==='seated')poseSeated(view.person);

  previousJobs.set(view.station,jobId);
}

function seatLead(view){
  view.route=[];view.routeIndex=0;view.phase='seated';
  poseSeated(view.person);view.person.position.copy(view.home);view.person.rotation.y=Math.PI;
}

function startLeadHandoff(view,receiving){
  const control=new THREE.Vector3(-.10,0,-5.65);
  poseStanding(view.person);view.phase='walking';view.routeIndex=0;
  if(receiving){
    view.person.position.copy(control);view.route=[view.home.clone()];
  }else{
    view.route=[control,view.home.clone()];
  }
}

function applySnapshot(snap,initial=false){
  redrawOperations(snap);
  const agents=Array.isArray(snap?.agents)?snap.agents:[];
  const chosen=new Map();
  agents.forEach(a=>{
    if(a?.enabled===false)return;
    const key=stationFromAgent(a);
    if(!chosen.has(key)||Number(a.current_job_id||0)>0)chosen.set(key,a);
  });
  Object.keys(STATIONS).forEach(key=>setLeadStatus(leadViews.get(key),chosen.get(key)||{},initial));
  updateStationPads(snap);
}

function updateStationPads(snap){
  const items=[...(snap?.stations||[]),...(snap?.desks||[])];
  const map=new Map(items.map(s=>[String(s.key||s.station||''),s]));
  stationPads.forEach((pad,key)=>{
    const s=map.get(key)||{},status=String(s.status||'standby').toLowerCase();
    const attention=/failed|error|blocked|waiting|retry/.test(status);
    const active=/working|running|processing|monitoring|supervising|ok/.test(status);
    const focused=focusedStation===key;
    pad.material.color.setHex(attention?C.amber:STATIONS[key].color);
    pad.material.emissive=new THREE.Color(attention?C.amber:STATIONS[key].color);
    pad.material.emissiveIntensity=focused?.12:(attention?.06:(active?.035:.0));
    pad.material.opacity=focused?.96:.80;
  });
}

function updateLead(view,dt,t){
  if(!view)return;
  if(view.phase==='seated'){animateTyping(view.person,t+Object.keys(STATIONS).indexOf(view.station));return;}
  if(view.phase!=='walking')return;
  const target=view.route[view.routeIndex];
  if(!target){seatLead(view);return;}
  const pos=view.person.position,dx=target.x-pos.x,dz=target.z-pos.z,dist=Math.hypot(dx,dz);
  if(dist<.10){view.routeIndex++;if(view.routeIndex>=view.route.length)seatLead(view);return;}
  const speed=1.35*dt,nx=dx/dist,nz=dz/dist;pos.x+=nx*speed;pos.z+=nz*speed;view.person.rotation.y=Math.atan2(nx,nz);
  animateWalk(view.person,t);
}

function updateAmbient(v,dt,t,index){
  if(v.type==='seated'){animateTyping(v.person,t+index*.61);return;}
  if(v.type==='presenter'){
    const r=v.person.userData.rig;
    r.rightArm.shoulder.rotation.z=-.55+Math.sin(t*1.3)*.10;
    r.rightArm.elbow.rotation.z=-.65+Math.sin(t*1.7)*.08;
    return;
  }
  if(v.type!=='walker'||!v.route.length)return;
  const target=v.route[v.routeIndex%v.route.length],p=v.person.position,dx=target.x-p.x,dz=target.z-p.z,dist=Math.hypot(dx,dz);
  if(dist<.16){v.routeIndex=(v.routeIndex+1)%v.route.length;return;}
  const step=v.speed*dt,nx=dx/dist,nz=dz/dist;p.x+=nx*step;p.z+=nz*step;v.person.rotation.y=Math.atan2(nx,nz);animateWalk(v.person,t+index*.4);
}

function updateCameraFrustum(){
  const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight),aspect=w/h;
  // Full-office fit. Narrower stage (drawer open) automatically gets more room.
  const baseHeight=aspect<1.45?24.2:aspect<1.65?22.8:21.8;
  const vh=baseHeight*cameraState.zoom,vw=vh*aspect;
  camera.left=-vw/2;camera.right=vw/2;camera.top=vh/2;camera.bottom=-vh/2;
  camera.near=.1;camera.far=180;camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
}
function updateCameraPosition(){
  const t=cameraState.theta,r=cameraState.radius;
  camera.position.set(Math.sin(t)*r,cameraState.height,Math.cos(t)*r);
  camera.lookAt(cameraState.target);
}
new ResizeObserver(()=>{updateCameraFrustum();updateCameraPosition();}).observe(stage);

renderer.domElement.addEventListener('pointerdown',e=>{
  drag=true;dragMoved=false;dragStart={x:e.clientX,y:e.clientY};dragPrev={x:e.clientX,y:e.clientY};
  renderer.domElement.setPointerCapture?.(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(!drag){renderer.domElement.style.cursor=stationAtEvent(e)?'pointer':'grab';return;}
  if(Math.hypot(e.clientX-dragStart.x,e.clientY-dragStart.y)>4)dragMoved=true;
  const dx=e.clientX-dragPrev.x;dragPrev={x:e.clientX,y:e.clientY};
  cameraState.theta=Math.max(cameraState.thetaBase-.32,Math.min(cameraState.thetaBase+.32,cameraState.theta-dx*.0026));
  updateCameraPosition();
});
renderer.domElement.addEventListener('pointerup',e=>{drag=false;renderer.domElement.releasePointerCapture?.(e.pointerId);});
renderer.domElement.addEventListener('wheel',e=>{
  cameraState.zoom=Math.max(.82,Math.min(1.28,cameraState.zoom+e.deltaY*.00065));updateCameraFrustum();
},{passive:true});

function stationAtEvent(e){
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([...stationPads.values()],false);
  return hits[0]?.object?.userData?.station||null;
}
renderer.domElement.addEventListener('click',e=>{
  if(dragMoved)return;
  const key=stationAtEvent(e);if(key)root.dispatchEvent(new CustomEvent('dot:station-click',{detail:{key}}));
});

scene.add(new THREE.HemisphereLight(0xd4e9ec,0x243039,1.10));
const ambient=new THREE.AmbientLight(0xffffff,.28);scene.add(ambient);
const warmSun=new THREE.DirectionalLight(0xffe0ad,2.45);warmSun.position.set(-10,18,12);warmSun.castShadow=true;
warmSun.shadow.mapSize.set(2048,2048);warmSun.shadow.camera.left=-20;warmSun.shadow.camera.right=20;warmSun.shadow.camera.top=20;warmSun.shadow.camera.bottom=-20;warmSun.shadow.bias=-.00035;scene.add(warmSun);
const coolFill=new THREE.DirectionalLight(0x9ddcff,1.05);coolFill.position.set(14,11,-8);scene.add(coolFill);
const frontFill=new THREE.PointLight(0xffdba0,.75,15,2);frontFill.position.set(-2,8,8);scene.add(frontFill);

createLayout();
applySnapshot(snapshot,true);
updateCameraPosition();
updateCameraFrustum();

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  if(document.hidden){clock.getDelta();return;}
  const dt=Math.min(.05,clock.getDelta()),t=performance.now()/1000;
  leadViews.forEach(v=>updateLead(v,dt,t));
  ambientViews.forEach((v,i)=>updateAmbient(v,dt,t,i));
  renderer.render(scene,camera);
}
animate();

window.DotOfficeEngine={
  updateSnapshot(next){if(!next)return;snapshot=next;applySnapshot(next,false);},
  focusStation(key){
    const k=String(key||'');if(!STATIONS[k])return;
    focusedStation=k;
    // Drawer selection highlights the department but deliberately keeps the
    // approved full-office framing intact.
    updateStationPads(snapshot);
  },
  resetView(){
    focusedStation=null;
    cameraState.target.set(0,.8,0);cameraState.theta=cameraState.thetaBase;cameraState.zoom=1;updateCameraPosition();updateCameraFrustum();updateStationPads(snapshot);
  },
  getState(){
    return {
      renderer:'threejs-premium-illustrated',
      version:'4.11.1',
      leads:[...leadViews.values()].map(v=>({station:v.station,phase:v.phase,jobId:v.jobId})),
      ambientStaff:ambientViews.length
    };
  }
};
