import {OFFICE3_PLAN,OFFICE3_PLAN_VERSION} from './dot-office-engine3-plan.js?v=4.29.48-diorama';
import {createOffice3Behavior,OFFICE3_BEHAVIOR_VERSION} from './dot-office-engine3-behavior.js?v=4.29.48-diorama';

/**
 * Cotativa Office Engine 3 — Cinematic Office
 * Release: v4.29.48 — Premium Diorama
 *
 * Fresh renderer. It does not reuse the previous DOT office scene, GLB
 * furniture or humanoids. The approved Cotativa project is rendered from one
 * metric plan, following the plan-driven/orthographic/material principles of
 * House Planner.
 */

async function loadStack(){
  const THREE=await import('three');
  const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
  const {RoundedBoxGeometry}=await import('three/addons/geometries/RoundedBoxGeometry.js');
  const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
  const SkeletonUtils=await import('three/addons/utils/SkeletonUtils.js');
  const {EffectComposer}=await import('three/addons/postprocessing/EffectComposer.js');
  const {RenderPass}=await import('three/addons/postprocessing/RenderPass.js');
  const {SSAOPass}=await import('three/addons/postprocessing/SSAOPass.js');
  const {UnrealBloomPass}=await import('three/addons/postprocessing/UnrealBloomPass.js');
  const {OutputPass}=await import('three/addons/postprocessing/OutputPass.js');
  const {RoomEnvironment}=await import('three/addons/environments/RoomEnvironment.js');
  return {THREE,OrbitControls,RoundedBoxGeometry,GLTFLoader,SkeletonUtils,EffectComposer,RenderPass,SSAOPass,UnrealBloomPass,OutputPass,RoomEnvironment};
}

const root=document.querySelector('[data-dot-office]');
const stage=root?.querySelector('[data-dot-office-stage]');
const payloadEl=root?.querySelector('[data-dot-office-stations-json]');
if(!root||!stage||!payloadEl)throw new Error('Office Engine 3 mount not found');

const loading=document.createElement('div');
loading.className='dot-engine3-loading';
loading.innerHTML='<strong>COTATIVA OFFICE ENGINE 3</strong><span>Construindo o projeto oficial do escritório…</span><i></i>';
Object.assign(loading.style,{
  position:'absolute',inset:'0',zIndex:'7',display:'grid',placeContent:'center',gap:'10px',
  textAlign:'center',background:'radial-gradient(circle at 50% 38%,#17303d 0,#07131c 67%)',
  color:'#eff9f7',fontFamily:'system-ui,sans-serif',letterSpacing:'.03em'
});
stage.appendChild(loading);

let stack;
try{stack=await loadStack();}
catch(error){
  loading.remove();
  throw error;
}
const {THREE,OrbitControls,RoundedBoxGeometry,GLTFLoader,SkeletonUtils,EffectComposer,RenderPass,SSAOPass,UnrealBloomPass,OutputPass,RoomEnvironment}=stack;

let snapshot={};
try{snapshot=JSON.parse(payloadEl.textContent||'{}')}catch(_){snapshot={}}

const PLAN=OFFICE3_PLAN;
const M=.001;
const SITE_W=PLAN.site.width*M;
const SITE_D=PLAN.site.depth*M;
const HX=SITE_W/2;
const HZ=SITE_D/2;

const wp=(x,y,height=0)=>new THREE.Vector3(Number(x)*M-HX,height,Number(y)*M-HZ);
const wx=x=>Number(x)*M-HX;
const wz=y=>Number(y)*M-HZ;
const behavior=createOffice3Behavior({plan:PLAN,toWorld:(x,y)=>({x:wx(x),z:wz(y)})});

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xf0ebe2);
scene.fog=new THREE.FogExp2(0xf0ebe2,.0017);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reducedGraphics=window.matchMedia('(max-width: 850px)').matches||reducedMotion;
let qualityMode=reducedGraphics?'economy':'premium';
let smoothedFps=60;
let slowFpsSeconds=0;
renderer.setPixelRatio(Math.min(reducedGraphics?1.15:1.65,window.devicePixelRatio||1));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.02;
renderer.domElement.className='dot-office-engine3-canvas';
renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:none;outline:none;';
stage.appendChild(renderer.domElement);

// Miniature diorama: an orthographic isometric camera keeps proportions stable.
const camera=new THREE.OrthographicCamera(-12,12,9,-9,.08,120);
camera.position.set(-15.8,17.5,20.2);
camera.lookAt(0,.45,0);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.enablePan=true;
controls.screenSpacePanning=true;
controls.minPolarAngle=.68;
controls.maxPolarAngle=1.46;
controls.minAzimuthAngle=-1.55;
controls.maxAzimuthAngle=.55;
controls.minZoom=.70;
controls.maxZoom=2.70;
controls.target.set(0,.45,0);

const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.02).texture;
scene.environmentIntensity=.48;
pmrem.dispose();

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const ssao=new SSAOPass(scene,camera,1,1);
ssao.kernelRadius=12;
ssao.minDistance=.0015;
ssao.maxDistance=.11;
ssao.enabled=!reducedGraphics;
composer.addPass(ssao);
const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.07,.42,.94);
bloom.enabled=!reducedGraphics;
composer.addPass(bloom);
composer.addPass(new OutputPass());

const world=new THREE.Group();
world.name='cotativa-office-engine3';
scene.add(world);

const navigation=new THREE.Group();
navigation.name='office3-navigation';
world.add(navigation);
let navigationVisible=false;
let renderPaused=false;
navigation.visible=false;

const stationHitMeshes=[];
const stationObjects=new Map();
const staffSprites=[];
const zoneObjects=new Map();
let operationsTexture=null;
let currentSnapshot=snapshot;
const realisticStaff=[];
const agentVisuals=new Map();
const stationVisuals=new Map();
const stationFallbacks=new Map();
const fallbackAgentVisuals=new Map();
const avatarTemplates=[];
const avatarLoader=new GLTFLoader();
const QUATERNIUS_SOURCE_REF='2d827a479ef7a44938372ca07d24c0faffb43b1d';
const QUATERNIUS_RAW='https://raw.githubusercontent.com/MrArun005/3D-Games-AmusementPark/'+QUATERNIUS_SOURCE_REF+'/public/models/characters/';
const AVATAR_SOURCES=[
  {url:QUATERNIUS_RAW+'civilian_casual.glb',label:'Casual',sex:'m'},
  {url:QUATERNIUS_RAW+'civilian_man.glb',label:'Everyday',sex:'m'},
  {url:QUATERNIUS_RAW+'civilian_longsleeve.glb',label:'Long-sleeve',sex:'m'},
  {url:QUATERNIUS_RAW+'civilian_suit.glb',label:'Suit',sex:'m'},
  {url:QUATERNIUS_RAW+'civilian_woman.glb',label:'Woman',sex:'f'},
  {url:QUATERNIUS_RAW+'civilian_woman2.glb',label:'Woman II',sex:'f'}
];
const CHARACTER_BASE_SCALE=1.7/4.8;
const AVATAR_ACCENTS=[0x204a5f,0x285f57,0x664b73,0x7a533e,0x3f5c75,0x5e6841,0x6b4651,0x385b64];


function mat(color,opts={}){
  return new THREE.MeshStandardMaterial({
    color,
    roughness:opts.roughness??.58,
    metalness:opts.metalness??.06,
    transparent:Boolean(opts.transparent),
    opacity:opts.opacity??1,
    emissive:opts.emissive??0x000000,
    emissiveIntensity:opts.emissiveIntensity??0
  });
}
const MATERIAL={
  wall:mat(0xf5eee4,{roughness:.87,metalness:0}),
  wallWarm:mat(0xece0d2,{roughness:.86,metalness:0}),
  frame:mat(PLAN.palette.frame,{roughness:.3,metalness:.66}),
  metal:mat(PLAN.palette.metal,{roughness:.34,metalness:.62}),
  wood:mat(PLAN.palette.wood,{roughness:.5}),
  woodDark:mat(PLAN.palette.woodDark,{roughness:.6}),
  white:mat(PLAN.palette.white,{roughness:.66}),
  screen:mat(PLAN.palette.screen,{roughness:.2,metalness:.2,emissive:PLAN.palette.cyan,emissiveIntensity:.08}),
  rug:mat(0x19313d,{roughness:.88,transparent:true,opacity:.78})
};

function rounded(w,h,d,r=.08,material=MATERIAL.white){
  const geo=new RoundedBoxGeometry(w,h,d,4,Math.min(r,w/4,h/4,d/4));
  const mesh=new THREE.Mesh(geo,material);
  mesh.castShadow=true;mesh.receiveShadow=true;
  return mesh;
}

function box(w,h,d,material=MATERIAL.wall){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.castShadow=true;mesh.receiveShadow=true;
  return mesh;
}

function canvasTexture(width,height,draw){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');
  draw(ctx,canvas);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  return {canvas,ctx,texture};
}

function addTextPanel(text,{width=3,height=.55,bg='rgba(5,18,27,.94)',fg='#edf7f5',stroke='#35d6ef',font=62}={}){
  const tx=canvasTexture(900,180,(g,c)=>{
    g.clearRect(0,0,c.width,c.height);
    g.fillStyle=bg;g.fillRect(7,7,c.width-14,c.height-14);
    g.strokeStyle=stroke;g.lineWidth=6;g.strokeRect(10,10,c.width-20,c.height-20);
    g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';
    g.font='900 '+font+'px Arial';g.fillText(text,c.width/2,c.height/2);
  });
  const mesh=new THREE.Mesh(
    new THREE.PlaneGeometry(width,height),
    new THREE.MeshBasicMaterial({map:tx.texture,transparent:true,depthWrite:false})
  );
  mesh.userData.texture=tx.texture;
  return mesh;
}

function addFloor(){
  const floorTx=canvasTexture(1400,980,(g,c)=>{
    g.fillStyle='#ece4d7';g.fillRect(0,0,c.width,c.height);
    const tile=70;
    for(let y=0;y<c.height;y+=tile){
      for(let x=0;x<c.width;x+=tile){
        const alt=((x/tile+y/tile)%2)===0;
        g.fillStyle=alt?'#f0e9dc':'#e7ddcd';g.fillRect(x,y,tile,tile);
        g.strokeStyle='rgba(99,74,54,.10)';g.lineWidth=2;g.strokeRect(x,y,tile,tile);
        g.fillStyle='rgba(255,255,255,.025)';g.fillRect(x+3,y+3,tile-6,tile-6);
      }
    }
  });
  floorTx.texture.wrapS=floorTx.texture.wrapT=THREE.RepeatWrapping;
  floorTx.texture.repeat.set(1,1);

  const pedestal=rounded(SITE_W+1.10,.30,SITE_D+1.10,.30,mat(0xd0bca8,{roughness:.88}));
  pedestal.position.y=-.48;world.add(pedestal);
  const slab=rounded(SITE_W+.6,.38,SITE_D+.6,.20,mat(0xf5eadb,{roughness:.86}));
  slab.position.y=-.27;world.add(slab);

  const floor=new THREE.Mesh(
    new THREE.PlaneGeometry(SITE_W,SITE_D),
    new THREE.MeshStandardMaterial({map:floorTx.texture,roughness:.88,metalness:.015})
  );
  floor.rotation.x=-Math.PI/2;floor.position.y=-.045;floor.receiveShadow=true;world.add(floor);

  const trim=box(SITE_W+.25,.08,.06,mat(PLAN.palette.amber,{emissive:PLAN.palette.amber,emissiveIntensity:3,roughness:.2}));
  trim.position.set(0,.04,-HZ+.10);world.add(trim);
}

function addWallSegment(wall){
  const a=wp(wall.a.x,wall.a.y),b=wp(wall.b.x,wall.b.y);
  const dx=b.x-a.x,dz=b.z-a.z;
  const length=Math.hypot(dx,dz);
  const angle=Math.atan2(dz,dx);
  // Keep camera-side walls low, revealing the rooms of the miniature.
  const h=wall.id.startsWith('outer-left-') ? .44 : wall.height*M;
  const d=Math.max(.045,wall.thickness*M);

  if(wall.kind==='glass'){
    const glass=new THREE.Mesh(
      new THREE.BoxGeometry(length,h,d),
      new THREE.MeshPhysicalMaterial({
        color:PLAN.palette.glass,transparent:true,opacity:.16,roughness:.14,
        metalness:.08,transmission:.12,thickness:.06,ior:1.43,depthWrite:false,
        envMapIntensity:.45
      })
    );
    glass.position.set((a.x+b.x)/2,h/2,(a.z+b.z)/2);glass.rotation.y=-angle;
    glass.receiveShadow=true;world.add(glass);

    const frameMat=MATERIAL.frame;
    const horizontal=box(length+.08,.045,.065,frameMat);
    horizontal.position.set((a.x+b.x)/2,h-.02,(a.z+b.z)/2);horizontal.rotation.y=-angle;world.add(horizontal);
    [a,b].forEach(p=>{
      const post=box(.055,h,.07,frameMat);
      post.position.set(p.x,h/2,p.z);post.rotation.y=-angle;world.add(post);
    });
    return;
  }

  const mesh=box(length,h,d,MATERIAL.wall);
  mesh.position.set((a.x+b.x)/2,h/2,(a.z+b.z)/2);
  mesh.rotation.y=-angle;world.add(mesh);

  const led=box(length-.12,.035,d+.025,mat(PLAN.palette.amber,{emissive:PLAN.palette.amber,emissiveIntensity:3.5,roughness:.16}));
  led.position.set((a.x+b.x)/2,h-.10,(a.z+b.z)/2);
  led.rotation.y=-angle;world.add(led);
}

function toneColor(tone){
  if(tone==='supervision')return PLAN.palette.cyan;
  if(tone==='shared')return PLAN.palette.green;
  return PLAN.palette.amber;
}

function addTextSprite(text,{width=2.2,height=.42,stroke=PLAN.palette.cyan,font=58}={}){
  const tx=canvasTexture(960,190,(g,c)=>{
    g.clearRect(0,0,c.width,c.height);
    g.fillStyle='rgba(255,252,244,.96)';
    g.beginPath();g.roundRect(12,18,c.width-24,c.height-36,26);g.fill();
    g.strokeStyle=stroke;g.lineWidth=5;g.stroke();
    g.fillStyle='#314955';g.textAlign='center';g.textBaseline='middle';
    g.font='900 '+font+'px Arial';g.fillText(text,c.width/2,c.height/2+2);
  });
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tx.texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
  sprite.scale.set(width,height,1);sprite.renderOrder=12;
  return sprite;
}

function addZone(zone){
  const p=wp(zone.x,zone.y,.018);
  const color=new THREE.Color(toneColor(zone.tone));
  const rugColor=({manager:0xd7e6f0,control:0xe0edf1,operations:0xdde6ed,social:0xf4dfe2,content:0xf7e5cb,seo:0xdcebd8,engineering:0xdde2f3,entrance:0xede4d5,lounge:0xd8ecdf,meeting:0xf1dfcc})[zone.id]||0xe5e3dc;
  const base=new THREE.Mesh(
    new THREE.PlaneGeometry(zone.w*M*.91,zone.d*M*.86),
    new THREE.MeshStandardMaterial({
      color:rugColor,transparent:true,opacity:zone.id==='control'?.42:.92,roughness:.98,metalness:0
    })
  );
  base.rotation.x=-Math.PI/2;base.position.copy(p);base.userData.zone=zone.id;world.add(base);

  const edges=new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(zone.w*M*.91,.024,zone.d*M*.86)),
    new THREE.LineBasicMaterial({color,transparent:true,opacity:.20})
  );
  edges.position.set(p.x,.032,p.z);world.add(edges);

  const label=addTextSprite(zone.label,{
    width:Math.min(2.05,Math.max(1.35,zone.w*M*.42)),
    height:.30,stroke:color.getStyle(),font:45
  });
  label.position.set(p.x,.21,p.z-zone.d*M*.28);
  label.userData.zone=zone.id;
  world.add(label);

  const hit=new THREE.Mesh(
    new THREE.PlaneGeometry(zone.w*M,zone.d*M),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
  );
  hit.rotation.x=-Math.PI/2;hit.position.set(p.x,.09,p.z);hit.userData.station=zone.id;world.add(hit);
  stationHitMeshes.push(hit);
  zoneObjects.set(zone.id,{base,edges,label,hit,color});
}

function addChair(x,z,rotation=0,scale=1){
  const g=new THREE.Group();
  const seat=rounded(.48*scale,.11*scale,.48*scale,.08,mat(0x587d8e,{roughness:.82,metalness:0}));
  seat.position.y=.48*scale;g.add(seat);
  const back=rounded(.48*scale,.62*scale,.10*scale,.08,mat(0x477080,{roughness:.84,metalness:0}));
  back.position.set(0,.78*scale,.19*scale);g.add(back);
  const post=box(.08*scale,.44*scale,.08*scale,MATERIAL.metal);post.position.y=.25*scale;g.add(post);
  const base=box(.44*scale,.045*scale,.08*scale,MATERIAL.metal);base.position.y=.05*scale;g.add(base);
  g.position.set(x,0,z);g.rotation.y=rotation;world.add(g);return g;
}

function addMonitor(x,z,rotation,color,index=0){
  const g=new THREE.Group();
  const frame=rounded(.64,.43,.055,.035,MATERIAL.metal);frame.position.y=1.12;g.add(frame);
  const ui=canvasTexture(640,400,(ctx,cv)=>{
    ctx.fillStyle='#06151d';ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle=index%2?'#0c2431':'#0b2028';ctx.fillRect(18,18,cv.width-36,cv.height-36);
    ctx.fillStyle=color;ctx.fillRect(40,46,150,12);
    for(let i=0;i<7;i++){
      ctx.fillStyle=i%3===0?'#45d6ba':'#3d6674';
      ctx.fillRect(42,92+i*38,220+(i%3)*64,10);
    }
    ctx.strokeStyle='#4dbbd0';ctx.lineWidth=7;ctx.beginPath();
    for(let i=0;i<9;i++){
      const px=330+i*28,py=280-(Math.sin((i+index)*.85)*52+i*7);
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.stroke();
    ctx.fillStyle='rgba(67,211,231,.14)';ctx.fillRect(332,70,250,150);
    ctx.fillStyle='#dce9e8';ctx.font='700 26px monospace';ctx.fillText(index%2?'SOCIAL / KPI':'COTATIVA / OPS',350,110);
  });
  const screen=new THREE.Mesh(
    new THREE.PlaneGeometry(.55,.35),
    new THREE.MeshBasicMaterial({map:ui.texture})
  );
  screen.position.set(0,1.12,-.031);g.add(screen);
  const stem=box(.06,.28,.06,MATERIAL.metal);stem.position.y=.86;g.add(stem);
  const foot=rounded(.28,.035,.16,.025,MATERIAL.metal);foot.position.y=.72;g.add(foot);
  g.position.set(x,0,z);g.rotation.y=rotation;world.add(g);return g;
}

function addKeyboard(x,z,rotation){
  const k=rounded(.42,.025,.16,.025,mat(0x222d33,{roughness:.55,metalness:.12}));
  k.position.set(x,.74,z);k.rotation.y=rotation;world.add(k);
}

function addDeskAccessories(center,rotation,index=0){
  const axis=new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),-rotation);
  const mug=rounded(.10,.11,.10,.035,mat(index%2?0x2f6f78:0xd8d2c6,{roughness:.55}));
  mug.position.set(center.x+axis.x*.48,.80,center.z+axis.z*.48);world.add(mug);
  const notebook=rounded(.28,.018,.20,.02,mat(0x26373e,{roughness:.72}));
  notebook.position.set(center.x-axis.x*.43,.755,center.z-axis.z*.43);notebook.rotation.y=-rotation;world.add(notebook);
}

// Built-in miniature figures are always available: no asset CDN, no video rendering,
// no image-generation calls, and no dependency on external GLB availability.
const DIORAMA_CHARACTERS=true;
const MINI_SKIN=[0xf3c7a5,0xc68d6f,0xe4ad87,0x9d674e,0xd59b74,0x724636];
const MINI_HAIR=[0x3b2c2b,0x554131,0x2c3037,0x8a5d37,0x262128,0x6b493c];
const MINI_SHIRTS={manager:0x315879,operations:0x4972a4,social:0xc16f84,content:0xcc9457,seo:0x65a16f,engineering:0x727cae};
function createMiniAgent(x,z,{index=0,scale=1,department='operations'}={}){
  const character=new THREE.Group();
  const skin=mat(MINI_SKIN[index%MINI_SKIN.length],{roughness:.92});
  const hair=mat(MINI_HAIR[index%MINI_HAIR.length],{roughness:.88});
  const shirt=mat(MINI_SHIRTS[department]||MINI_SHIRTS.operations,{roughness:.87});
  const trousers=mat(index%3===0?0x50616a:index%3===1?0x4b5663:0x665e60,{roughness:.92});
  const shoes=mat(0x34424a,{roughness:.91});
  const white=mat(0xfff8ef,{roughness:1});
  const ink=mat(0x24343b,{roughness:1});
  const pivot=new THREE.Group();character.add(pivot);
  const body=rounded(.46,.64,.29,.14,shirt);body.position.y=.98;pivot.add(body);
  const neck=rounded(.14,.16,.15,.065,skin);neck.position.y=1.35;pivot.add(neck);
  const head=new THREE.Group();head.position.y=1.53;pivot.add(head);
  const face=new THREE.Mesh(new THREE.SphereGeometry(.275,18,12),skin);head.add(face);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.277,18,10,0,Math.PI*2,0,Math.PI*.46),hair);cap.position.y=.026;head.add(cap);
  for(const side of [-1,1]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.027,8,6),ink);
    eye.position.set(side*.105,.012,.254);head.add(eye);
  }
  const smile=new THREE.Mesh(new THREE.TorusGeometry(.064,.009,5,12,Math.PI),mat(0x985e53,{roughness:1}));
  smile.rotation.z=Math.PI;smile.position.set(0,-.085,.259);head.add(smile);
  const arms=[];
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*.28,1.21,0);pivot.add(arm);
    const sleeve=rounded(.18,.37,.19,.07,shirt);sleeve.position.y=-.18;arm.add(sleeve);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.086,10,8),skin);hand.position.y=-.39;arm.add(hand);
    arms.push(arm);
  }
  const legs=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.125,.68,0);pivot.add(leg);
    const pant=rounded(.18,.49,.22,.065,trousers);pant.position.y=-.24;leg.add(pant);
    const shoe=rounded(.20,.13,.30,.055,shoes);shoe.position.set(0,-.49,.065);leg.add(shoe);
    legs.push(leg);
  }
  if(department==='manager'){
    const tablet=rounded(.26,.35,.035,.03,ink);tablet.position.set(.29,-.34,.18);arms[1].add(tablet);
    const glass=rounded(.20,.28,.01,.015,white);glass.position.set(.29,-.34,.206);arms[1].add(glass);
  }
  const ground=new THREE.Mesh(new THREE.CircleGeometry(.35,18),new THREE.MeshBasicMaterial({color:0x564839,transparent:true,opacity:.16,depthWrite:false}));
  ground.rotation.x=-Math.PI/2;ground.position.y=.025;character.add(ground);
  character.scale.setScalar(scale);
  character.position.set(x,0,z);
  character.userData.person=true;
  character.userData.mini={pivot,head,arms,legs,index};
  character.traverse(obj=>{if(obj.isMesh&&obj!==ground){obj.castShadow=true;obj.receiveShadow=true;}});
  world.add(character);
  staffSprites.push(character);
  return character;
}

function animateMiniAgent(person,state,time,dt){
  const mini=person.userData.mini;if(!mini)return;
  const walking=String(state.state||'').startsWith('walking-');
  const seated=state.state==='sitting-down'||state.state==='working';
  const working=state.state==='working' && state.operationalEnabled!==false;
  const phase=time*7.2+Number(state.phase||0);
  const blend=Math.min(1,Math.max(0,dt*9));
  const sway=walking&&!reducedMotion?Math.sin(phase):0;
  const isManager=state.department==='manager';
  const armPos=working?(isManager?[-.46,-.62]:[-.88,-.88]):walking?[sway*.46,-sway*.46]:[-.06,.06];
  mini.arms.forEach((a,i)=>{a.rotation.x=THREE.MathUtils.lerp(a.rotation.x,armPos[i]+(working?Math.sin(phase+i)*.08:0),blend);});
  mini.legs.forEach((leg,i)=>{leg.rotation.x=THREE.MathUtils.lerp(leg.rotation.x,seated?-.95:walking?(i===0?-sway:sway)*.55:0,blend);});
  mini.pivot.position.y=THREE.MathUtils.lerp(mini.pivot.position.y,seated?-.26:(walking?Math.abs(sway)*.028:0),blend);
  mini.pivot.rotation.z=THREE.MathUtils.lerp(mini.pivot.rotation.z,walking?sway*.025:0,blend);
  mini.head.rotation.y=reducedMotion?0:Math.sin(time*(working?1.2:.8)+mini.index)*.11;
  mini.head.rotation.z=reducedMotion?0:Math.sin(time*1.1+mini.index)*.025;
}

function boneLike(root,names){
  let found=null;
  root.traverse(node=>{
    if(found||!node.isBone)return;
    const key=String(node.name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    if(names.some(n=>key.includes(n)))found=node;
  });
  return found;
}

function findAvatarClip(animations,action){
  const re=new RegExp(action+'$','i');
  return (animations||[]).find(clip=>re.test(String(clip?.name||'')))||null;
}

function cloneAvatarMaterials(model,index=0){
  const accent=new THREE.Color(AVATAR_ACCENTS[index%AVATAR_ACCENTS.length]);
  model.traverse(obj=>{
    if(!obj.isMesh)return;
    obj.castShadow=true;
    obj.receiveShadow=true;
    obj.frustumCulled=false;
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    const cloned=mats.map(material=>{
      if(!material)return material;
      const next=material.clone();
      if(next.color)next.color.lerp(accent,.08+(index%4)*.035);
      if('envMapIntensity' in next)next.envMapIntensity=.48;
      if('roughness' in next)next.roughness=Math.max(.42,Number(next.roughness||.55));
      return next;
    });
    obj.material=Array.isArray(obj.material)?cloned:cloned[0];
  });
}

function createAvatarAction(mixer,clip,loop=true){
  if(!clip)return null;
  const action=mixer.clipAction(clip);
  action.enabled=true;
  action.clampWhenFinished=!loop;
  action.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);
  return action;
}

function playAvatarAction(person,name,fade=.22){
  const actions=person.userData.actions||{};
  let next=actions[name]||null;
  if(!next&&name==='stand')next=actions.idle||null;
  if(!next&&name==='sit')next=actions.idle||null;
  if(!next)return;
  if(person.userData.currentAction===name)return;

  const prevName=person.userData.currentAction;
  const prev=prevName?actions[prevName]||null:null;
  next.reset();
  next.enabled=true;
  next.setEffectiveTimeScale(1);
  next.setEffectiveWeight(1);
  next.play();
  if(prev&&prev!==next)prev.crossFadeTo(next,fade,false);
  person.userData.currentAction=name;
}

function applyDeskWorkOverlay(person,time){
  const model=person.userData.model;
  if(!model)return;
  const sit=person.userData.actions?.sit;
  const clip=sit?.getClip?.();
  if(sit&&clip&&clip.duration>0&&sit.time<clip.duration*.82)return;

  const phase=Number(person.userData.phase||0);
  const leftFore=boneLike(model,['leftforearm','leftlowerarm','forearml']);
  const rightFore=boneLike(model,['rightforearm','rightlowerarm','forearmr']);
  const leftHand=boneLike(model,['lefthand','handl']);
  const rightHand=boneLike(model,['righthand','handr']);
  const tap=Math.sin(time*7.2+phase)*.055;
  if(leftFore)leftFore.rotation.x+=tap;
  if(rightFore)rightFore.rotation.x-=tap;
  if(leftHand)leftHand.rotation.z+=Math.sin(time*9.1+phase)*.025;
  if(rightHand)rightHand.rotation.z-=Math.sin(time*8.6+phase)*.025;
}

function addRealAvatar(template,x,z,{rotation=0,index=0,scale=1}={}){
  const wrapper=new THREE.Group();
  const model=SkeletonUtils.clone(template.scene);
  const heightVariant=[.96,.985,1.01,1.025,.975,1.0][index%6];
  cloneAvatarMaterials(model,index);
  model.scale.setScalar(CHARACTER_BASE_SCALE*scale*heightVariant);
  model.position.set(0,0,0);
  wrapper.add(model);
  const contactShadow=new THREE.Mesh(new THREE.CircleGeometry(.36,24),new THREE.MeshBasicMaterial({color:0x604e40,transparent:true,opacity:.15,depthWrite:false}));
  contactShadow.rotation.x=-Math.PI/2;contactShadow.position.y=.02;wrapper.add(contactShadow);
  wrapper.position.set(x,0,z);
  wrapper.rotation.y=rotation;

  const mixer=new THREE.AnimationMixer(model);
  const actions={
    idle:createAvatarAction(mixer,findAvatarClip(template.animations,'Idle'),true),
    walk:createAvatarAction(mixer,findAvatarClip(template.animations,'Walk'),true),
    sit:createAvatarAction(mixer,findAvatarClip(template.animations,'Sitting'),false),
    stand:createAvatarAction(mixer,findAvatarClip(template.animations,'Standing'),false)
  };

  wrapper.userData.person=true;
  wrapper.userData.model=model;
  wrapper.userData.mixer=mixer;
  wrapper.userData.actions=actions;
  wrapper.userData.currentAction='';
  wrapper.userData.phase=index*.71;
  wrapper.userData.avatarLabel=template.label;
  wrapper.userData.avatarSex=template.sex;
  playAvatarAction(wrapper,'idle',0);

  world.add(wrapper);
  realisticStaff.push(wrapper);
  return wrapper;
}

async function loadRealisticStaff(){
  const settled=await Promise.allSettled(
    AVATAR_SOURCES.map(async source=>{
      const gltf=await avatarLoader.loadAsync(source.url);
      return {scene:gltf.scene,animations:gltf.animations||[],label:source.label,sex:source.sex,url:source.url};
    })
  );
  const loaded=settled.filter(r=>r.status==='fulfilled').map(r=>r.value).filter(Boolean);
  if(!loaded.length)return false;
  avatarTemplates.push(...loaded);

  PLAN.stations.forEach((station,index)=>{
    const p=wp(station.x,station.y);
    const r=-THREE.MathUtils.degToRad(station.rotationDeg||0);
    const template=avatarTemplates[index%avatarTemplates.length];
    const model=addRealAvatar(template,p.x,p.z,{rotation:r,index,scale:.98});
    model.userData.stationId=station.id;
    model.visible=false;
    stationVisuals.set(station.id,model);
  });

  staffSprites.forEach(sprite=>{sprite.visible=false;});
  root.dataset.dotHumanRenderer='quaternius-cc0';
  return true;
}

function bindAgentVisuals(){
  const states=behavior.getAgents().filter(state=>state&&state.enabled!==false);
  const ids=new Set(states.map(state=>String(state.id||'')).filter(Boolean));

  for(const [id,visual] of [...agentVisuals]){
    if(ids.has(id))continue;
    visual.visible=false;
    visual.userData.agentId='';
    agentVisuals.delete(id);
  }

  const used=new Set(agentVisuals.values());
  states.forEach(state=>{
    const id=String(state.id||'');if(!id)return;
    let visual=agentVisuals.get(id);
    if(!visual){
      const desired=stationVisuals.get(state.poi?.id);
      visual=(desired&&!used.has(desired))?desired:[...stationVisuals.values()].find(v=>!used.has(v));
      if(visual){
        agentVisuals.set(id,visual);
        used.add(visual);
        visual.userData.agentId=id;
      }
    }
    if(visual)visual.visible=true;
  });

  stationVisuals.forEach(visual=>{if(!used.has(visual))visual.visible=false;});
}

function bindFallbackVisuals(){
  const states=behavior.getAgents().filter(state=>state&&state.enabled!==false);
  const ids=new Set(states.map(state=>String(state.id||'')).filter(Boolean));

  for(const [id,visual] of [...fallbackAgentVisuals]){
    if(ids.has(id))continue;
    visual.visible=false;
    fallbackAgentVisuals.delete(id);
  }

  const used=new Set(fallbackAgentVisuals.values());
  states.forEach(state=>{
    const id=String(state.id||'');if(!id)return;
    let visual=fallbackAgentVisuals.get(id);
    if(!visual){
      const desired=stationFallbacks.get(state.poi?.id);
      visual=(desired&&!used.has(desired))?desired:[...stationFallbacks.values()].find(v=>!used.has(v));
      if(visual){fallbackAgentVisuals.set(id,visual);used.add(visual);}
    }
    if(visual)visual.visible=true;
  });
  stationFallbacks.forEach(visual=>{if(!used.has(visual))visual.visible=false;});
}

function animateFallbackStaff(time,dt){
  bindFallbackVisuals();
  for(const [id,person] of fallbackAgentVisuals){
    const state=behavior.getAgent(id);
    if(!state||state.enabled===false){person.visible=false;continue;}
    person.visible=true;
    person.position.set(state.position.x,0,state.position.z);
    const atDesk=['working','sitting-down','standing-up'].includes(state.state);
    person.rotation.y=(Number(atDesk?state.poi?.rotation:state.rotation)||0)+(atDesk?Math.PI:0);
    animateMiniAgent(person,state,time,dt);
  }
}

function animateRealisticStaff(time,dt){
  if(DIORAMA_CHARACTERS||!avatarTemplates.length){animateFallbackStaff(time,dt);return;}
  bindAgentVisuals();

  for(const [id,person] of agentVisuals){
    const state=behavior.getAgent(id);
    if(!state||state.enabled===false){person.visible=false;continue;}
    person.visible=true;
    person.position.set(state.position.x,0,state.position.z);
    person.rotation.y=Number(
      ['working','sitting-down','standing-up'].includes(state.state)
        ?state.poi?.rotation
        :state.rotation
    )||0;

    let action='idle';
    if(String(state.state||'').startsWith('walking-'))action='walk';
    else if(state.state==='sitting-down'||state.state==='working')action='sit';
    else if(state.state==='standing-up')action='stand';

    playAvatarAction(person,action,action==='walk'?.18:.24);
    person.userData.mixer?.update(Math.max(0,Math.min(.08,Number(dt)||0)));

    if(state.state==='working')applyDeskWorkOverlay(person,time);
  }
}

function addStation(station){
  const p=wp(station.x,station.y);
  const r=THREE.MathUtils.degToRad(station.rotationDeg||0);
  const forward=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),-r);
  const deskCenter=p.clone().addScaledVector(forward,.48);
  const dept=PLAN.zones.find(z=>z.id===station.department);
  const accent=toneColor(dept?.tone||'work');

  let desk=null;
  if(station.department!=='manager'){
    desk=rounded(1.36,.72,.68,.055,MATERIAL.wood);
    desk.position.set(deskCenter.x,.36,deskCenter.z);desk.rotation.y=-r;world.add(desk);
    const modesty=rounded(1.18,.46,.045,.025,MATERIAL.woodDark);
    modesty.position.set(deskCenter.x,.38,deskCenter.z);
    modesty.position.addScaledVector(forward,.30);modesty.rotation.y=-r;world.add(modesty);

    const left=new THREE.Vector3(-.52,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),-r);
    const legA=box(.06,.69,.06,MATERIAL.metal);legA.position.set(deskCenter.x+left.x,.34,deskCenter.z+left.z);world.add(legA);
    const legB=box(.06,.69,.06,MATERIAL.metal);legB.position.set(deskCenter.x-left.x,.34,deskCenter.z-left.z);world.add(legB);
  }

  addChair(p.x,p.z,-r);
  const monitorPos=deskCenter.clone().addScaledVector(forward,.03);
  const stationIndex=Math.max(0,Number(String(station.id||'P1').replace(/\D+/g,''))-1);
  addMonitor(monitorPos.x,monitorPos.z,-r,accent,stationIndex);
  const keyboardPos=deskCenter.clone().addScaledVector(forward,-.18);
  addKeyboard(keyboardPos.x,keyboardPos.z,-r);
  addDeskAccessories(deskCenter,r,stationIndex);

  const badge=addTextPanel(station.id,{width:.46,height:.25,stroke:accent,font:64});
  badge.position.set(p.x,.055,p.z+.35);badge.rotation.x=-Math.PI/2;navigation.add(badge);

  const hit=new THREE.Mesh(
    new THREE.PlaneGeometry(1.5,1.35),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
  );
  hit.rotation.x=-Math.PI/2;hit.position.set(p.x,.11,p.z);hit.userData.station=station.department;world.add(hit);
  stationHitMeshes.push(hit);

  stationObjects.set(station.id,{station,desk,badge,monitor:monitorPos,accent});
  // Dedicated local animated miniature figure is bound to this workstation.
  const fallback=createMiniAgent(p.x,p.z+.04,{index:stationIndex,scale:.94,department:station.department});
  fallback.visible=false;
  fallback.userData.stationId=station.id;
  stationFallbacks.set(station.id,fallback);
}

function addDeskIsland(item){
  // Workstations themselves are rendered from P1–P14. This object is only a
  // subtle shared underlay to visually join neighboring desks into one island.
  const p=wp(item.x,item.y,.055);
  const under=rounded(item.w*M,.06,item.d*M,.06,mat(0x242c2f,{roughness:.78,transparent:true,opacity:.35}));
  under.position.set(p.x,.045,p.z);under.rotation.y=-THREE.MathUtils.degToRad(item.rotationDeg||0);world.add(under);
}

function addExecutiveDesk(item){
  const p=wp(item.x,item.y);
  const desk=rounded(item.w*M,.78,item.d*M,.07,MATERIAL.wood);
  desk.position.set(p.x,.39,p.z);world.add(desk);
  const front=rounded(item.w*M*.86,.52,.06,.025,MATERIAL.woodDark);
  front.position.set(p.x,.38,p.z-item.d*M*.45);world.add(front);
}

function addCabinet(item){
  const p=wp(item.x,item.y);
  const w=(item.w||800)*M,d=(item.d||420)*M,h=(item.h||850)*M;
  const body=rounded(w,h,d,.04,MATERIAL.woodDark);body.position.set(p.x,h/2,p.z);world.add(body);
  for(let i=0;i<3;i++){
    const line=box(w*.88,.015,.012,mat(0xc28a5e,{metalness:.25,roughness:.4}));
    line.position.set(p.x,.22+i*h*.25,p.z-d/2-.008);world.add(line);
  }
}

function addBookcase(item){
  const p=wp(item.x,item.y);
  const w=(item.w||800)*M,d=(item.d||380)*M,h=(item.h||2200)*M;
  const frame=rounded(w,h,d,.035,MATERIAL.woodDark);frame.position.set(p.x,h/2,p.z);world.add(frame);
  const inner=rounded(w*.78,h*.9,d*.82,.02,mat(0x10171b,{roughness:.85}));inner.position.set(p.x,h*.5,p.z-d*.05);world.add(inner);
  const colors=[0x9e5f53,0x4d7892,0xc29455,0x587263,0x725d8d];
  for(let row=0;row<4;row++){
    const shelf=box(w*.78,.035,d*.78,MATERIAL.wood);shelf.position.set(p.x,.32+row*h*.21,p.z);world.add(shelf);
    for(let b=0;b<5;b++){
      const book=box(.07,.22+.04*((b+row)%2),.16,mat(colors[(b+row)%colors.length],{roughness:.72}));
      book.position.set(p.x-w*.27+b*.13,.45+row*h*.21,p.z-d*.14);world.add(book);
    }
  }
}

function addServerRack(item){
  const p=wp(item.x,item.y);
  const w=(item.w||850)*M,d=(item.d||900)*M,h=(item.h||2300)*M;
  const rack=rounded(w,h,d,.04,mat(0x0e171d,{metalness:.72,roughness:.26}));rack.position.set(p.x,h/2,p.z);world.add(rack);
  for(let i=0;i<9;i++){
    const slot=rounded(w*.76,.12,.035,.012,mat(0x1b2d38,{metalness:.4,roughness:.34,emissive:i%3===0?PLAN.palette.cyan:PLAN.palette.blue,emissiveIntensity:.18}));
    slot.position.set(p.x,.25+i*.22,p.z-d/2-.02);world.add(slot);
    if(!reducedGraphics){
      const led=new THREE.PointLight(i%3===0?PLAN.palette.teal:PLAN.palette.blue,.18,.7,2);
      led.position.set(p.x-w*.26,.25+i*.22,p.z-d/2-.09);world.add(led);
    }
  }
}

function addSofa(item){
  const p=wp(item.x,item.y);
  const w=(item.w||2100)*M,d=(item.d||850)*M;
  const seat=rounded(w,.38,d,.12,mat(0x8fb5a8,{roughness:.85}));seat.position.set(p.x,.30,p.z);world.add(seat);
  const back=rounded(w,.72,.25,.12,mat(0x81a899,{roughness:.87}));back.position.set(p.x,.62,p.z+d*.38);world.add(back);
  [-.43,.43].forEach(v=>{
    const cushion=rounded(w*.42,.16,d*.52,.09,mat(v<0?0xf4e6cc:0xdacbb5,{roughness:.88}));
    cushion.position.set(p.x+w*v,.53,p.z-d*.08);world.add(cushion);
  });
}

function addCoffeeTable(item){
  const p=wp(item.x,item.y);
  const w=(item.w||850)*M,d=(item.d||650)*M;
  const top=rounded(w,.08,d,.08,MATERIAL.wood);top.position.set(p.x,.42,p.z);world.add(top);
  const stem=box(.08,.38,.08,MATERIAL.metal);stem.position.set(p.x,.22,p.z);world.add(stem);
}

function addMeetingTable(item){
  const p=wp(item.x,item.y);
  const w=(item.w||2300)*M,d=(item.d||1050)*M;
  const top=rounded(w,.10,d,.10,MATERIAL.wood);top.position.set(p.x,.76,p.z);world.add(top);
  [-.38,.38].forEach(v=>{
    const leg=rounded(.12,.70,d*.62,.04,MATERIAL.metal);leg.position.set(p.x+w*v,.38,p.z);world.add(leg);
  });
}

function addFurniture(item){
  if(item.type==='desk-island')return addDeskIsland(item);
  if(item.type==='executive-desk')return addExecutiveDesk(item);
  if(item.type==='cabinet')return addCabinet(item);
  if(item.type==='bookcase')return addBookcase(item);
  if(item.type==='server-rack')return addServerRack(item);
  if(item.type==='sofa')return addSofa(item);
  if(item.type==='coffee-table')return addCoffeeTable(item);
  if(item.type==='meeting-table')return; // cinematic pedestal table is rendered separately
  if(item.type==='meeting-chair'){
    const p=wp(item.x,item.y);return addChair(p.x,p.z,-THREE.MathUtils.degToRad(item.rotationDeg||0),.95);
  }
}

function addPlant(item){
  const p=wp(item.x,item.y);
  const s=Number(item.s||1);
  const pot=rounded(.34*s,.48*s,.34*s,.06,mat(0x857765,{roughness:.9}));pot.position.set(p.x,.24*s,p.z);world.add(pot);
  const stem=box(.05*s,.75*s,.05*s,mat(0x3c6e4f,{roughness:.9}));stem.position.set(p.x,.82*s,p.z);world.add(stem);
  const green=[0x3f8b5e,0x4b9a68,0x2f7750,0x62a977];
  for(let i=0;i<8;i++){
    const leaf=new THREE.Mesh(
      new THREE.SphereGeometry(.22*s,10,7),
      mat(green[i%green.length],{roughness:.92})
    );
    const a=i/8*Math.PI*2;
    leaf.scale.set(.52,1.5,.34);
    leaf.rotation.z=(i%2?.35:-.35);
    leaf.position.set(p.x+Math.cos(a)*.20*s,1.10*s+(i%3)*.13*s,p.z+Math.sin(a)*.20*s);
    leaf.castShadow=true;world.add(leaf);
  }
}

function addBrandPanel(side=false){
  const tx=canvasTexture(1200,420,(g,c)=>{
    g.clearRect(0,0,c.width,c.height);
    g.fillStyle='#f4f8f7';g.textAlign='center';g.font='900 150px Arial';g.fillText('COTATIVA',c.width/2,190);
    g.fillStyle='#35d6ef';g.font='800 43px monospace';g.fillText('TECNOLOGIA PARA NEGÓCIOS',c.width/2,280);
    g.fillRect(1030,80,24,170);g.fillRect(1070,120,24,130);g.fillRect(1110,45,24,205);
  });
  const mesh=new THREE.Mesh(
    new THREE.PlaneGeometry(side?3.0:3.4,side?1.05:1.18),
    new THREE.MeshBasicMaterial({map:tx.texture,transparent:true,toneMapped:false})
  );
  return mesh;
}

function buildOperationsScreen(){
  operationsTexture=canvasTexture(1280,720,()=>{});
  const feature=PLAN.features.find(f=>f.id==='operations-wall');
  const p=wp(feature.x,feature.y);
  const frame=rounded(feature.w*M+.22,feature.h*M+.20,.12,.06,mat(0x0c171d,{metalness:.48,roughness:.28}));
  frame.position.set(p.x,feature.h*M/2+.30,-HZ+.16);world.add(frame);

  const screen=new THREE.Mesh(
    new THREE.PlaneGeometry(feature.w*M,feature.h*M),
    new THREE.MeshBasicMaterial({map:operationsTexture.texture,toneMapped:false})
  );
  // Keep the panel in front of both its frame and the back wall.
  screen.position.set(p.x,feature.h*M/2+.30,-HZ+.225);world.add(screen);

  const led=box(feature.w*M+.10,.045,.055,mat(PLAN.palette.amber,{emissive:PLAN.palette.amber,emissiveIntensity:4,roughness:.14}));
  led.position.set(p.x,feature.h*M+.49,-HZ+.17);world.add(led);

  // Low console + lounge below the TV, matching the approved office image.
  for(let i=-2;i<=2;i++){
    const cabinet=rounded(.78,.58,.44,.045,mat(i===0?0x5a3928:0x3b2a22,{roughness:.62}));
    cabinet.position.set(p.x+i*.80,.29,-HZ+.58);world.add(cabinet);
    const handle=box(.18,.02,.025,mat(0xc99b65,{metalness:.45,roughness:.3}));
    handle.position.set(p.x+i*.80,.43,-HZ+.35);world.add(handle);
  }
  const tvSofa=rounded(1.72,.34,.72,.12,mat(0x9aa09f,{roughness:.85}));
  tvSofa.position.set(p.x-2.60,.30,-HZ+1.18);world.add(tvSofa);
  const tvBack=rounded(1.72,.70,.22,.12,mat(0x8e9696,{roughness:.86}));
  tvBack.position.set(p.x-2.60,.65,-HZ+.93);world.add(tvBack);

  redrawOperations(currentSnapshot);
}

function redrawOperations(snap){
  if(!operationsTexture)return;
  const g=operationsTexture.ctx,c=operationsTexture.canvas,m=snap?.metrics||{};
  g.fillStyle='#04141d';g.fillRect(0,0,c.width,c.height);
  const grad=g.createLinearGradient(0,0,c.width,c.height);grad.addColorStop(0,'#0c2d3a');grad.addColorStop(1,'#06151d');
  g.fillStyle=grad;g.fillRect(14,14,c.width-28,c.height-28);
  g.strokeStyle='#2dcfe7';g.lineWidth=8;g.strokeRect(18,18,c.width-36,c.height-36);
  g.fillStyle='#edf8f6';g.font='900 62px Arial';g.fillText('OPERAÇÕES  |  FILA DE TAREFAS',56,86);
  g.textAlign='right';g.font='800 31px monospace';g.fillText(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),1215,84);g.textAlign='left';

  const cards=[
    ['TAREFAS HOJE',Number(m.done_24h||0),'#5fe0c0'],
    ['EM ANDAMENTO',Number(m.processing_agents||0),'#52c9ef'],
    ['CONCLUÍDAS',Number(m.done_24h||0),'#5fe0c0'],
    ['TAXA DE SUCESSO',Number(m.success_24h||0).toFixed(0)+'%','#5fe0c0']
  ];
  cards.forEach((card,i)=>{
    const x=52+i*288,y=125;
    g.fillStyle='rgba(3,20,29,.78)';g.fillRect(x,y,250,118);
    g.strokeStyle='rgba(71,211,232,.38)';g.lineWidth=2;g.strokeRect(x,y,250,118);
    g.fillStyle=card[2];g.font='900 43px Arial';g.fillText(String(card[1]),x+18,y+54);
    g.fillStyle='#a8c0c4';g.font='800 18px monospace';g.fillText(card[0],x+18,y+90);
  });

  const tasks=(snap?.task_board||[]).slice(0,6);
  g.font='800 22px monospace';g.fillStyle='#88a8ad';g.fillText('ATIVIDADE DA EQUIPE',56,296);
  tasks.forEach((t,i)=>{
    const y=345+i*48,status=String(t.status||'').toLowerCase();
    const co=/failed|retry|waiting|blocked/.test(status)?'#ffb35c':'#4edab7';
    g.fillStyle=co;g.fillRect(58,y-17,12,12);
    g.fillStyle='#e5f0ef';g.font='700 23px Arial';
    let text=(t.agent_name||t.role||'DOT')+' · '+(t.label||t.type||'Tarefa');
    if(text.length>58)text=text.slice(0,56)+'…';
    g.fillText(text,86,y);
    const pr=Math.max(0,Math.min(100,Number(t.progress||0)));
    g.fillStyle='#173943';g.fillRect(900,y-20,250,13);g.fillStyle=co;g.fillRect(900,y-20,250*pr/100,13);
    g.fillStyle='#8ca5aa';g.font='700 17px monospace';g.fillText(pr+'%',1165,y-8);
  });
  if(!tasks.length){
    g.fillStyle='#91a8ac';g.font='27px Arial';g.fillText('Equipe sem tarefas ativas neste momento.',58,355);
  }
  operationsTexture.texture.needsUpdate=true;
}

function addPlanningBoard(){
  const tx=canvasTexture(900,650,(g,c)=>{
    g.fillStyle='#f3f1e8';g.fillRect(0,0,c.width,c.height);
    g.fillStyle='#1f3037';g.font='900 62px Arial';g.fillText('PLANEJAMENTO',48,78);
    g.font='34px Arial';
    ['Campanhas','Produção de conteúdo','Otimizações SEO','Resultados','Novos projetos'].forEach((t,i)=>{
      g.strokeStyle='#4a7f8b';g.strokeRect(60,135+i*88,34,34);
      g.fillStyle='#2f434b';g.fillText(t,116,163+i*88);
    });
  });
  const p=wp(15100,2400);
  const frame=rounded(2.65,2.05,.10,.04,MATERIAL.frame);frame.position.set(p.x,1.55,p.z);frame.rotation.y=-.18;world.add(frame);
  const board=new THREE.Mesh(new THREE.PlaneGeometry(2.48,1.88),new THREE.MeshStandardMaterial({map:tx.texture,roughness:.76}));
  board.position.set(p.x,1.55,p.z-.057);board.rotation.y=-.18;world.add(board);
}

function addStrategyPanels(){
  const values=canvasTexture(620,720,(g,cv)=>{
    g.fillStyle='#efe9db';g.fillRect(0,0,cv.width,cv.height);
    g.fillStyle='#26343a';g.textAlign='center';g.font='800 66px Arial';
    ['Resultados','Estratégia','Pessoas','Crescimento'].forEach((t,i)=>g.fillText(t,cv.width/2,150+i*128));
    g.strokeStyle='#b58b5b';g.lineWidth=8;g.strokeRect(18,18,cv.width-36,cv.height-36);
  });
  const vp=wp(4500,800);
  const vframe=rounded(1.25,1.85,.08,.035,MATERIAL.frame);vframe.position.set(vp.x,1.55,vp.z);world.add(vframe);
  const vmesh=new THREE.Mesh(new THREE.PlaneGeometry(1.12,1.72),new THREE.MeshStandardMaterial({map:values.texture,roughness:.78}));
  vmesh.position.set(vp.x,1.55,vp.z+.047);world.add(vmesh);

  const seo=canvasTexture(760,600,(g,cv)=>{
    g.fillStyle='#f5f1e6';g.fillRect(0,0,cv.width,cv.height);
    g.fillStyle='#253842';g.font='900 70px Arial';g.fillText('SEO',58,100);
    g.strokeStyle='#476d7b';g.lineWidth=8;g.beginPath();
    g.moveTo(70,440);g.lineTo(170,360);g.lineTo(260,390);g.lineTo(360,250);g.lineTo(470,300);g.lineTo(650,160);g.stroke();
    ['#d5a353','#61b59a','#5a8bb5'].forEach((co,i)=>{g.fillStyle=co;g.fillRect(80+i*150,480-(i*65),85,80+i*65);});
  });
  const sp=wp(5900,8400);
  const sframe=rounded(1.75,1.48,.08,.035,MATERIAL.frame);sframe.position.set(sp.x,1.38,sp.z);sframe.rotation.y=.12;world.add(sframe);
  const smesh=new THREE.Mesh(new THREE.PlaneGeometry(1.62,1.35),new THREE.MeshStandardMaterial({map:seo.texture,roughness:.8}));
  smesh.position.set(sp.x,1.38,sp.z-.047);smesh.rotation.y=.12;world.add(smesh);
}

function addBrands(){
  const right=addBrandPanel(false);right.position.set(wx(15400),2.55,-HZ+.205);world.add(right);
  const left=addBrandPanel(true);left.position.set(-HX+.205,2.15,wz(4300));left.rotation.y=-Math.PI/2;world.add(left);
}

function buildNavigation(){
  navigation.clear();
  const cyan=new THREE.Color(PLAN.palette.cyan);
  const nodeById=new Map([[PLAN.navigation.spawn.id,PLAN.navigation.spawn],...PLAN.navigation.nodes.map(n=>[n.id,n])]);
  PLAN.navigation.routes.forEach(([a,b])=>{
    const A=nodeById.get(a),B=nodeById.get(b);if(!A||!B)return;
    const p1=wp(A.x,A.y,.065),p2=wp(B.x,B.y,.065);
    const dx=p2.x-p1.x,dz=p2.z-p1.z,len=Math.hypot(dx,dz);
    const line=rounded(len,.025,.12,.025,new THREE.MeshBasicMaterial({color:cyan,transparent:true,opacity:.44,depthWrite:false}));
    line.position.set((p1.x+p2.x)/2,.065,(p1.z+p2.z)/2);line.rotation.y=-Math.atan2(dz,dx);navigation.add(line);
  });
  for(const [id,n] of nodeById){
    const p=wp(n.x,n.y,.08);
    const marker=new THREE.Mesh(
      new THREE.CylinderGeometry(id==='E1'?0.12:0.085,id==='E1'?0.12:0.085,.035,20),
      new THREE.MeshBasicMaterial({color:id==='E1'?PLAN.palette.green:PLAN.palette.cyan})
    );
    marker.position.copy(p);navigation.add(marker);
    const label=addTextPanel(id,{width:.40,height:.22,stroke:id==='E1'?PLAN.palette.green:PLAN.palette.cyan,font:62});
    label.position.set(p.x,.10,p.z+.18);label.rotation.x=-Math.PI/2;navigation.add(label);
  }
}

function addAccentLights(){
  if(reducedGraphics)return;
  const warm=new THREE.Color(PLAN.palette.amber);
  [
    [-5.2,2.7,-4.5],[-1.5,2.7,-4.7],[3.5,2.7,-4.4],[6.0,2.7,-2.5],
    [-4.4,2.6,1.3],[0,2.8,1.3],[4.3,2.8,1.4],[-1.2,2.6,4.2],[5.2,2.6,4.1]
  ].forEach(([x,y,z],i)=>{
    const l=new THREE.PointLight(i%3===0?0x9fe9ff:warm,i%3===0?.13:.22,5.6,2);
    l.position.set(x,y,z);world.add(l);
  });
}

function addWindowStrip(x1,x2,z=-HZ+.12){
  const width=Math.abs(x2-x1);
  const x=(x1+x2)/2;
  const sky=canvasTexture(1200,700,(g,cv)=>{
    const gr=g.createLinearGradient(0,0,0,cv.height);
    gr.addColorStop(0,'#9bd7ed');gr.addColorStop(.62,'#dff3f7');gr.addColorStop(1,'#f7fbfa');
    g.fillStyle=gr;g.fillRect(0,0,cv.width,cv.height);
    g.globalAlpha=.56;g.fillStyle='#ffffff';
    [[160,170,180,48],[520,125,220,62],[900,220,190,54]].forEach(([x,y,w,h])=>{
      g.beginPath();g.ellipse(x,y,w,h,0,0,Math.PI*2);g.fill();
    });
    g.globalAlpha=1;
  });
  const panel=new THREE.Mesh(
    new THREE.PlaneGeometry(width,2.55),
    new THREE.MeshBasicMaterial({map:sky.texture,toneMapped:false})
  );
  panel.position.set(x,1.70,z+.025);world.add(panel);
  const glass=new THREE.Mesh(
    new THREE.PlaneGeometry(width,2.55),
    new THREE.MeshPhysicalMaterial({
      color:0xbfe9f3,transparent:true,opacity:.18,roughness:.08,
      transmission:.22,thickness:.04,ior:1.42,metalness:0,depthWrite:false
    })
  );
  glass.position.set(x,1.70,z-.015);world.add(glass);
  const frameMat=mat(0x617783,{roughness:.36,metalness:.58});
  for(let px=x1;px<=x2+.001;px+=Math.max(.92,width/4)){
    const mullion=box(.045,2.62,.055,frameMat);
    mullion.position.set(px,1.70,z-.035);world.add(mullion);
  }
  const sill=box(width+.06,.05,.08,frameMat);sill.position.set(x,.42,z-.03);world.add(sill);
  const top=box(width+.06,.05,.08,frameMat);top.position.set(x,2.98,z-.03);world.add(top);
}

function addCinematicWindows(){
  addWindowStrip(-HX+.35,-3.15);
  addWindowStrip(3.55,HX-.35);
  // Bright side windows near the meeting room, echoing the new visual reference.
  const sky=canvasTexture(700,900,(g,cv)=>{
    const gr=g.createLinearGradient(0,0,cv.width,0);
    gr.addColorStop(0,'#b7e5f1');gr.addColorStop(1,'#f3fbfb');
    g.fillStyle=gr;g.fillRect(0,0,cv.width,cv.height);
  });
  const p=new THREE.Mesh(new THREE.PlaneGeometry(3.0,2.55),new THREE.MeshBasicMaterial({map:sky.texture,toneMapped:false}));
  p.position.set(HX-.035,1.70,2.50);p.rotation.y=-Math.PI/2;world.add(p);
}

function addCeilingLight(x,z,w=1.15,d=.30){
  const frame=rounded(w,.055,d,.025,mat(0xc5cdd0,{roughness:.5,metalness:.18}));
  frame.position.set(x,3.28,z);world.add(frame);
  const panel=rounded(w*.90,.022,d*.72,.018,mat(0xeafcff,{emissive:0xeafcff,emissiveIntensity:1.2,roughness:.24}));
  panel.position.set(x,3.245,z);world.add(panel);
  const light=new THREE.PointLight(0xe8fbff,.18,4.2,2);
  light.position.set(x,3.08,z);world.add(light);
}

function addCeilingSystem(){
  [
    [-5.0,-3.3],[-2.0,-3.3],[1.0,-3.3],[4.0,-3.3],
    [-5.0,-.3],[-2.0,-.3],[1.0,-.3],[4.0,-.3],
    [-3.7,2.9],[-.7,2.9],[2.3,2.9],[5.3,2.9]
  ].forEach(([x,z])=>addCeilingLight(x,z));
  const beamMat=mat(0xaeb9bd,{roughness:.58,metalness:.16});
  [-3.55,3.55].forEach(z=>{
    const beam=box(SITE_W-.9,.07,.08,beamMat);beam.position.set(0,3.32,z);world.add(beam);
  });
}

function addReferenceMeetingFeature(){
  const p=wp(14800,10300);
  // A more corporate central pedestal table like the supplied reference.
  const pedestal=new THREE.Mesh(
    new THREE.CylinderGeometry(.36,.56,.72,32),
    mat(0x5e6e74,{roughness:.48,metalness:.18})
  );
  pedestal.position.set(p.x,.36,p.z);world.add(pedestal);
  const top=rounded(2.38,.10,1.16,.28,mat(0xd9ddda,{roughness:.58}));
  top.position.set(p.x,.78,p.z);world.add(top);
}

function buildScene(){
  addFloor();
  PLAN.walls.forEach(addWallSegment);
  PLAN.zones.forEach(addZone);
  buildNavigation();
  PLAN.furniture.forEach(addFurniture);
  PLAN.stations.forEach(addStation);
  PLAN.auxiliarySeats.forEach(seat=>{
    const p=wp(seat.x,seat.y);addChair(p.x,p.z,-THREE.MathUtils.degToRad(seat.rotationDeg||0));
  });
  PLAN.plants.forEach(addPlant);
  addCinematicWindows();
  // Open-top dollhouse: overhead fixtures would occlude the 3D miniature.
  addReferenceMeetingFeature();
  buildOperationsScreen();
  addPlanningBoard();
  addStrategyPanels();
  addBrands();
  addAccentLights();

}

scene.add(new THREE.HemisphereLight(0xfff9ed,0x919e94,1.48));
scene.add(new THREE.AmbientLight(0xffffff,.33));
const key=new THREE.DirectionalLight(0xfff5de,2.05);
key.position.set(-8,15,11);key.castShadow=true;key.shadow.mapSize.set(reducedGraphics?1024:2048,reducedGraphics?1024:2048);
key.shadow.camera.left=-14;key.shadow.camera.right=14;key.shadow.camera.top=14;key.shadow.camera.bottom=-14;
key.shadow.camera.near=.5;key.shadow.camera.far=50;key.shadow.bias=-.00022;key.shadow.normalBias=.018;
scene.add(key);
const fill=new THREE.DirectionalLight(0xd7ecff,.45);fill.position.set(11,10,7);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffdfb4,.30);rim.position.set(2,7,-14);scene.add(rim);

buildScene();
if(!DIORAMA_CHARACTERS){
  loadRealisticStaff().catch(error=>{
    console.warn('[Cotativa Office] optional GLB staff unavailable, using local figures',error);
    root.dataset.dotHumanRenderer='diorama-mesh';
  });
}
root.dataset.dotHumanRenderer='diorama-mesh';

function fitCamera(){
  const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
  const aspect=w/h;
  const viewHeight=Math.max(15.4,24/aspect);
  const viewWidth=viewHeight*aspect;
  camera.left=-viewWidth/2;camera.right=viewWidth/2;
  camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
  composer.setSize(w,h);
  ssao.setSize(w,h);
  bloom.resolution.set(w,h);
}
fitCamera();
const resizeObserver=new ResizeObserver(fitCamera);resizeObserver.observe(stage);

const raycaster=new THREE.Raycaster();
const mouse=new THREE.Vector2();
let down=null,moved=false;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};moved=false;});
renderer.domElement.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)moved=true;});
renderer.domElement.addEventListener('pointerup',()=>{down=null;});
renderer.domElement.addEventListener('click',event=>{
  if(moved)return;
  const rect=renderer.domElement.getBoundingClientRect();
  mouse.x=((event.clientX-rect.left)/rect.width)*2-1;
  mouse.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(mouse,camera);
  const hit=raycaster.intersectObjects(stationHitMeshes,false)[0];
  const key=hit?.object?.userData?.station;
  if(key){focusStation(key);root.dispatchEvent(new CustomEvent('dot:station-click',{detail:{key}}));}
});

function setNavigationVisible(value){
  navigationVisible=Boolean(value);
  navigation.visible=navigationVisible;
  root.dataset.dotNavmesh=navigationVisible?'on':'off';
  root.dispatchEvent(new CustomEvent('dot:navmesh-change',{detail:{visible:navigationVisible}}));
  return navigationVisible;
}

const CINEMATIC_CAMERA={
  manager:{offset:[-3.8,2.35,4.6],height:1.10},
  control:{offset:[-4.5,2.60,5.4],height:1.20},
  operations:{offset:[-4.7,2.45,5.2],height:1.10},
  social:{offset:[-3.9,2.30,4.5],height:1.05},
  content:{offset:[-3.5,2.25,4.2],height:1.05},
  seo:{offset:[-3.9,2.30,4.6],height:1.05},
  engineering:{offset:[-4.3,2.30,4.8],height:1.05},
  entrance:{offset:[-3.2,2.05,3.7],height:1.05},
  lounge:{offset:[-3.3,2.10,3.9],height:1.00},
  meeting:{offset:[-4.1,2.00,5.0],height:1.05}
};

let cameraFlight=null;
controls.addEventListener('start',()=>{cameraFlight=null;});
function focusStation(key){
  const zone=PLAN.zones.find(z=>z.id===String(key||''));
  if(!zone)return;
  const target=wp(zone.x,zone.y,.65);
  cameraFlight={target,position:target.clone().add(new THREE.Vector3(-6.8,8.4,9.4)),zoom:1.65};
}
function resetView(){
  cameraFlight={target:new THREE.Vector3(0,.45,0),position:new THREE.Vector3(-15.8,17.5,20.2),zoom:1};
}

function updateSnapshot(next){
  behavior.sync(next);
  if(!next)return;
  currentSnapshot=next;
  redrawOperations(next);
  const byStation=new Map((next?.stations||[]).map(s=>[String(s.key||''),s]));
  zoneObjects.forEach((obj,id)=>{
    const row=byStation.get(id);
    const active=Number(row?.metrics?.find?.(m=>m.label==='Executando')?.value||0)>0;
    obj.base.material.emissiveIntensity=active?.28:.10;
    obj.edges.material.opacity=active?.95:.52;
  });
}

window.DotOfficeEngine={
  updateSnapshot,
  focusStation,
  resetView,
  toggleNavigation(force){return setNavigationVisible(typeof force==='boolean'?force:!navigationVisible);},
  setRenderPaused(value){renderPaused=Boolean(value);return renderPaused;},
  getState(){
    return {
      renderer:'office-engine-3',
      design:'premium-isometric-diorama',
      version:'4.29.48-diorama',
      behavior:OFFICE3_BEHAVIOR_VERSION,
      foundation:'delegation-agents-real-v1',
      planVersion:OFFICE3_PLAN_VERSION,
      stations:PLAN.stations.length,
      zones:PLAN.zones.length,
      humans:DIORAMA_CHARACTERS?[...fallbackAgentVisuals.values()].filter(v=>v.visible).length:avatarTemplates.length?[...agentVisuals.values()].filter(v=>v.visible).length:[...fallbackAgentVisuals.values()].filter(v=>v.visible).length,
      humanRenderer:DIORAMA_CHARACTERS?'diorama-mesh':avatarTemplates.length?'quaternius-cc0':'diorama-mesh',
      oldRenderer:false,
      navigationVisible,
      quality:qualityMode,
      fps:Math.round(smoothedFps)
    };
  }
};

updateSnapshot(snapshot);
setNavigationVisible(false);

loading.style.transition='opacity .45s ease';
loading.style.opacity='0';
setTimeout(()=>loading.remove(),480);

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  if(document.hidden||renderPaused){clock.getDelta();return;}
  const dt=clock.getDelta();
  const elapsed=clock.elapsedTime;
  if(dt>.001){
    const currentFps=1/Math.min(.10,dt);
    smoothedFps=smoothedFps*.96+Math.min(90,currentFps)*.04;
    slowFpsSeconds=smoothedFps<27?slowFpsSeconds+dt:Math.max(0,slowFpsSeconds-dt*.5);
    if(qualityMode==='premium'&&slowFpsSeconds>3){
      qualityMode='adaptive';
      ssao.enabled=false;bloom.enabled=false;
      renderer.setPixelRatio(Math.min(1.15,window.devicePixelRatio||1));
      fitCamera();
    }
  }
  behavior.update(dt);
  animateRealisticStaff(elapsed,dt);
  if(cameraFlight){
    const alpha=reducedMotion?1:1-Math.exp(-Math.min(dt,.08)*5);
    controls.target.lerp(cameraFlight.target,alpha);
    camera.position.lerp(cameraFlight.position,alpha);
    camera.zoom=THREE.MathUtils.lerp(camera.zoom,cameraFlight.zoom,alpha);
    camera.updateProjectionMatrix();
    if(camera.position.distanceTo(cameraFlight.position)<.025&&controls.target.distanceTo(cameraFlight.target)<.025&&Math.abs(camera.zoom-cameraFlight.zoom)<.005)cameraFlight=null;
  }
  controls.update(dt);
  composer.render();
}
animate();

export const officeEngine3Ready=true;
