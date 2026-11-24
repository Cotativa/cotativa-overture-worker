import {createOfficeSimulation,SIM_STATE} from './dot-office-sim.js?v=4.17.0';
import {OFFICE_MAP,OFFICE_MAP_VERSION,officeMapEdges,officeMapWorkstationApproach} from './dot-office-map.js?v=4.17.0';
import {createCotativaNavMesh,NAVMESH_ENGINE_VERSION} from './dot-office-navmesh.js?v=4.17.0';

/**
 * DOT Office Living 3D v4.17.0
 *
 * Cotativa Office Engine 2: Three.js renderer + three-pathfinding navmesh +
 * duty-driven simulation. Queue Ownership / Dispatcher / Worker remain the
 * source of truth for real work.
 */

async function loadThreeStack(){
  try{
    const THREE=await import('three');
    const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
    const SkeletonUtils=await import('three/addons/utils/SkeletonUtils.js');
    const {EffectComposer}=await import('three/addons/postprocessing/EffectComposer.js');
    const {RenderPass}=await import('three/addons/postprocessing/RenderPass.js');
    const {UnrealBloomPass}=await import('three/addons/postprocessing/UnrealBloomPass.js');
    const {OutputPass}=await import('three/addons/postprocessing/OutputPass.js');
    return {THREE,GLTFLoader,SkeletonUtils,EffectComposer,RenderPass,UnrealBloomPass,OutputPass};
  }catch(error){
    console.error('[DOT Office Living3D] Three.js stack failed',error);
    throw error;
  }
}

const root=document.querySelector('[data-dot-office]');
const stage=root?.querySelector('[data-dot-office-stage]');
const payloadEl=root?.querySelector('[data-dot-office-stations-json]');
if(!root||!stage||!payloadEl)throw new Error('DOT Office Living 3D mount not found');

const loading=document.createElement('div');
loading.className='dot-living3d-loading';
loading.innerHTML='<strong>COTATIVA</strong><span>Preparando o escritório vivo 3D…</span><i></i>';
Object.assign(loading.style,{
  position:'absolute',inset:'0',zIndex:'6',display:'grid',placeContent:'center',gap:'10px',
  textAlign:'center',background:'radial-gradient(circle at 50% 42%,#132832 0,#07131a 64%)',
  color:'#eef6f4',fontFamily:'system-ui,sans-serif',letterSpacing:'.02em'
});
stage.appendChild(loading);

let stack;
try{stack=await loadThreeStack();}
catch(error){
  loading.innerHTML='<strong>DOT Office 3D indisponível</strong><span>Atualize a página para tentar novamente.</span>';
  throw error;
}
const {THREE,GLTFLoader,SkeletonUtils,EffectComposer,RenderPass,UnrealBloomPass,OutputPass}=stack;

let snapshot={};
try{snapshot=JSON.parse(payloadEl.textContent||'{}')}catch(_){snapshot={}}

const BASE='/admin/assets/dot-office/models/';
const ASSET={
  male:BASE+'human_male.gltf',
  female:BASE+'human_female.gltf',
  desk:BASE+'furniture/desk.glb',
  chair:BASE+'furniture/chairdesk.glb',
  monitor:BASE+'furniture/computerscreen.glb',
  laptop:BASE+'furniture/laptop.glb',
  plant:BASE+'furniture/pottedplant.glb',
  plantSmall:BASE+'furniture/plantsmall1.glb',
  bookcase:BASE+'furniture/bookcaseopen.glb',
  sofa:BASE+'furniture/loungesofa.glb',
  loungeChair:BASE+'furniture/loungechair.glb',
  floorLamp:BASE+'furniture/lamproundfloor.glb',
  table:BASE+'furniture/table.glb',
  coffeeTable:BASE+'furniture/tablecoffee.glb',
  television:BASE+'furniture/televisionmodern.glb',
  rug:BASE+'furniture/rugrectangle.glb',
  doorway:BASE+'furniture/doorwayfront.glb',
  drawers:BASE+'furniture/sidetabledrawers.glb',
  trash:BASE+'furniture/trashcan.glb',
  coffee:BASE+'furniture/kitchencoffeemachine.glb'
};

const COLOR={
  bg:0x071018,slab:0x222a30,slabSide:0x0f161b,wall:0x222d34,wallWarm:0x4d3d31,
  glass:0xaadbe5,frame:0x667880,wood:0x8e5f3e,wood2:0xb07a50,metal:0x718087,
  teal:0x43d2af,green:0x6bd293,blue:0x6aaddb,amber:0xe5b15a,white:0xeff5f3,
  red:0xd86f70,screen:0x061820,dark:0x10171b
};

const stationTone={
  manager:{label:'GERÊNCIA',role:'Gerência',color:0xdcae69},
  social:{label:'SOCIAL',role:'Social',color:0x53c9b0},
  content:{label:'CONTEÚDO',role:'Conteúdo',color:0x7aa8e0},
  seo:{label:'SEO & GOOGLE',role:'SEO & Google',color:0x67cc8f},
  operations:{label:'OPERAÇÕES',role:'Operações',color:0x66bbda},
  engineering:{label:'ENGENHARIA',role:'Engenharia',color:0x96ade8}
};
const STATIONS=Object.fromEntries(
  OFFICE_MAP.zones
    .filter(zone=>stationTone[zone.id])
    .map(zone=>[zone.id,{
      ...stationTone[zone.id],
      x:zone.x,z:zone.z,zone:[zone.x,zone.z,zone.w,zone.d]
    }])
);
const ROLE_STATION={
  gerencia:'manager',manager:'manager',social:'social',conteudo:'content',
  'seo & google':'seo',seo:'seo',google:'seo',
  operacoes:'operations',operations:'operations',engenharia:'engineering',engineering:'engineering'
};

const scene=new THREE.Scene();
scene.background=new THREE.Color(COLOR.bg);
scene.fog=new THREE.FogExp2(COLOR.bg,.0058);

const camera=new THREE.OrthographicCamera(-18,18,11,-11,.1,180);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.43;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label','Escritório Living 3D da Cotativa');
stage.appendChild(renderer.domElement);

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.46,.58,.84);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const world=new THREE.Group();
scene.add(world);
const navigationOverlay=new THREE.Group();
navigationOverlay.name='cotativa-navigation-overlay';
navigationOverlay.visible=true;
world.add(navigationOverlay);
let navigationVisible=true;
const loader=new GLTFLoader();
const templates=new Map();
const staff=[];
const staffByAgent=new Map();
const deskRegistry=new Map();
const departmentDesks=new Map();
const navmesh=createCotativaNavMesh();
const simulation=createOfficeSimulation({
  routeProvider:({start,end})=>navmesh.findPath(start,end)
});
simulation.setRouteProvider(({start,end})=>navmesh.findPath(start,end),NAVMESH_ENGINE_VERSION);
const stationHits=new Map();
let focusedStation=null;
let operationsTexture=null;
let operationsScreen=null;
let drag=false,dragMoved=false,dragStart={x:0,y:0},dragPrev={x:0,y:0};

const cameraState={
  theta:.70,baseTheta:.70,distance:36,height:28,zoom:1,
  target:new THREE.Vector3(0,.85,.2)
};

const std=(color,opts={})=>new THREE.MeshStandardMaterial({
  color,roughness:opts.roughness??.66,metalness:opts.metalness??.06,
  emissive:opts.emissive??0x000000,emissiveIntensity:opts.emissiveIntensity??0,
  transparent:opts.transparent??false,opacity:opts.opacity??1,depthWrite:opts.depthWrite??true
});
const makeBox=(w,h,d,color,opts={})=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),std(color,opts));
  m.castShadow=opts.castShadow!==false;m.receiveShadow=opts.receiveShadow!==false;return m;
};
const makePlane=(w,h,material)=>new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);

function navigationLabel(text,x,z,color=COLOR.blue){
  const tex=canvasTexture(256,128,(g,canvas)=>{
    g.clearRect(0,0,canvas.width,canvas.height);
    g.fillStyle='rgba(4,18,25,.92)';g.fillRect(18,25,220,78);
    g.strokeStyle='#'+new THREE.Color(color).getHexString();g.lineWidth=7;g.strokeRect(18,25,220,78);
    g.fillStyle='#eef8f7';g.textAlign='center';g.textBaseline='middle';g.font='900 48px Arial';
    g.fillText(text,128,64);
  });
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex.texture,transparent:true,depthTest:false}));
  sprite.position.set(x,.22,z);sprite.scale.set(.78,.39,1);navigationOverlay.add(sprite);
}

function navigationSegment(from,to){
  const dx=to.x-from.x,dz=to.z-from.z,length=Math.hypot(dx,dz);
  if(length<=0)return;
  const lane=new THREE.Mesh(
    new THREE.BoxGeometry(length,.022,.26),
    new THREE.MeshBasicMaterial({color:COLOR.blue,transparent:true,opacity:.34,depthWrite:false})
  );
  lane.position.set((from.x+to.x)/2,.055,(from.z+to.z)/2);
  lane.rotation.y=-Math.atan2(dz,dx);
  navigationOverlay.add(lane);
}

function navigationObstacle(obstacle){
  const fill=new THREE.Mesh(
    new THREE.BoxGeometry(obstacle.w,.026,obstacle.d),
    new THREE.MeshBasicMaterial({color:COLOR.red,transparent:true,opacity:.10,depthWrite:false})
  );
  fill.position.set(obstacle.x,.065,obstacle.z);
  navigationOverlay.add(fill);
  const edges=new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(obstacle.w,.035,obstacle.d)),
    new THREE.LineBasicMaterial({color:COLOR.red,transparent:true,opacity:.62})
  );
  edges.position.set(obstacle.x,.08,obstacle.z);
  navigationOverlay.add(edges);
}

function buildNavigationOverlay(){
  navigationOverlay.clear();
  const navmeshDebug=navmesh.createDebugMesh();
  navmeshDebug.userData.kind='navmesh';
  navigationOverlay.add(navmeshDebug);
  officeMapEdges().forEach(edge=>navigationSegment(edge.from,edge.to));
  Object.entries(OFFICE_MAP.nodes).forEach(([id,node])=>{
    const marker=new THREE.Mesh(
      new THREE.CylinderGeometry(id==='e1'?.14:.10,id==='e1'?.14:.10,.035,18),
      new THREE.MeshBasicMaterial({color:id==='e1'?COLOR.green:COLOR.blue,transparent:true,opacity:.95})
    );
    marker.position.set(node.x,.085,node.z);navigationOverlay.add(marker);
    navigationLabel(id==='e1'?'E1':id.toUpperCase(),node.x,node.z,id==='e1'?COLOR.green:COLOR.blue);
  });
  OFFICE_MAP.obstacles.forEach(navigationObstacle);
  navigationOverlay.visible=navigationVisible;
}

function setNavigationVisible(value){
  navigationVisible=Boolean(value);
  navigationOverlay.visible=navigationVisible;
  root.dataset.dotNavmesh=navigationVisible?'on':'off';
  root.dispatchEvent(new CustomEvent('dot:navmesh-change',{detail:{visible:navigationVisible}}));
  return navigationVisible;
}

function markShadows(object){
  object.traverse(child=>{
    if(child.isMesh||child.isSkinnedMesh){
      child.castShadow=true;child.receiveShadow=true;
      if(child.material){
        child.material=Array.isArray(child.material)
          ?child.material.map(m=>m.clone())
          :child.material.clone();
      }
    }
  });
  return object;
}

function canvasTexture(w,h,draw){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');draw(ctx,canvas);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
  return {canvas,ctx,texture};
}

async function preloadAssets(){
  const entries=Object.entries(ASSET);
  let loaded=0;
  await Promise.all(entries.map(async([key,url])=>{
    const gltf=await loader.loadAsync(url);
    markShadows(gltf.scene);
    templates.set(key,gltf.scene);
    loaded++;
    const pct=Math.round(loaded/entries.length*100);
    const span=loading.querySelector('span');if(span)span.textContent='Carregando equipe e mobiliário… '+pct+'%';
  }));
}

function cloneAsset(key){
  const src=templates.get(key);
  if(!src)throw new Error('Asset not loaded: '+key);
  const isHuman=key==='male'||key==='female';
  const object=isHuman?SkeletonUtils.clone(src):src.clone(true);
  markShadows(object);
  return object;
}

function fitObject(object,{width,height,depth}={}){
  object.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(object);
  const size=new THREE.Vector3();b.getSize(size);
  const scales=[];
  if(width&&size.x>0)scales.push(width/size.x);
  if(height&&size.y>0)scales.push(height/size.y);
  if(depth&&size.z>0)scales.push(depth/size.z);
  const s=scales.length?Math.min(...scales):1;
  object.scale.multiplyScalar(s);
  object.updateMatrixWorld(true);
  const b2=new THREE.Box3().setFromObject(object);
  object.position.y-=b2.min.y;
  return object;
}

function placeAsset(key,x,z,opts={}){
  const object=cloneAsset(key);
  fitObject(object,opts.fit||{});
  object.rotation.y=opts.ry||0;
  object.position.x=x;object.position.z=z;
  world.add(object);
  if(opts.materialHook)opts.materialHook(object);
  return object;
}

function addGlowLine(x,y,z,w,d,color=COLOR.amber,intensity=.55){
  const strip=makeBox(w,.035,d,color,{emissive:color,emissiveIntensity:3,roughness:.22,castShadow:false});
  strip.position.set(x,y,z);world.add(strip);
  const light=new THREE.PointLight(color,intensity,4.8,2);light.position.set(x,y+.3,z);world.add(light);
}

function addGlassWall(x,z,w,d,h=2.9){
  const glassMat=new THREE.MeshPhysicalMaterial({
    color:COLOR.glass,transparent:true,opacity:.19,roughness:.12,metalness:.04,
    transmission:.32,thickness:.12,ior:1.42,depthWrite:false
  });
  const pane=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),glassMat);
  pane.position.set(x,h/2,z);world.add(pane);
  const frame=std(COLOR.frame,{roughness:.35,metalness:.45});
  const addFrame=(fw,fh,fd,px,py,pz)=>{
    const f=new THREE.Mesh(new THREE.BoxGeometry(fw,fh,fd),frame);f.position.set(px,py,pz);f.castShadow=true;world.add(f);
  };
  if(w>d){
    addFrame(.055,h+.05,.075,x-w/2,h/2,z);addFrame(.055,h+.05,.075,x+w/2,h/2,z);
    addFrame(w+.05,.055,.075,x,h,z);
  }else{
    addFrame(.075,h+.05,.055,x,h/2,z-d/2);addFrame(.075,h+.05,.055,x,h/2,z+d/2);
    addFrame(.075,.055,d+.05,x,h,z);
  }
}

function addLabel(title,x,z,color,scale=1){
  const tex=canvasTexture(768,150,(g,c)=>{
    g.fillStyle='rgba(5,13,17,.93)';g.fillRect(0,0,c.width,c.height);
    g.strokeStyle=color;g.lineWidth=5;g.strokeRect(5,5,c.width-10,c.height-10);
    g.fillStyle='#eff6f4';g.textAlign='center';g.textBaseline='middle';g.font='900 46px Arial';
    g.fillText(title,c.width/2,c.height/2);
  });
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex.texture,transparent:true,depthTest:false}));
  sprite.scale.set(2.45*scale,.48*scale,1);sprite.position.set(x,.26,z);world.add(sprite);return sprite;
}

function addZone(key){
  const st=STATIONS[key],[x,z,w,d]=st.zone;
  const rug=placeAsset('rug',x,z,{fit:{width:w,depth:d},ry:0});
  rug.position.y=.018;rug.userData.station=key;
  rug.traverse(o=>{if(o.isMesh&&o.material){o.material.color?.setHex(st.color);o.material.transparent=true;o.material.opacity=.42;}});
  const hit=new THREE.Mesh(
    new THREE.PlaneGeometry(w,d),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
  );
  hit.rotation.x=-Math.PI/2;hit.position.set(x,.075,z);hit.userData.station=key;world.add(hit);stationHits.set(key,hit);
  addLabel(st.label,x,z+d/2-.34,'#'+new THREE.Color(st.color).getHexString(),.92);
}

function addDeskSet(station,x,z,{ry=0,dual=true}={}){
  const st=STATIONS[station];
  const desk=placeAsset('desk',x,z,{fit:{width:2.25,height:.84,depth:.92},ry});
  const chairOffset=new THREE.Vector3(0,0,.86).applyAxisAngle(new THREE.Vector3(0,1,0),ry);
  const chair=placeAsset('chair',x+chairOffset.x,z+chairOffset.z,{fit:{height:1.05},ry});
  const monitorOffsets=dual?[-.43,.43]:[0];
  monitorOffsets.forEach(dx=>{
    const local=new THREE.Vector3(dx,0,-.25).applyAxisAngle(new THREE.Vector3(0,1,0),ry);
    const screen=placeAsset('monitor',x+local.x,z+local.z,{fit:{width:.72,height:.55},ry:ry+Math.PI});
    screen.position.y=.86;
    screen.traverse(o=>{if(o.isMesh&&o.material){o.material.emissive?.setHex(st.color);o.material.emissiveIntensity=.22;}});
  });
  const laptopOffset=new THREE.Vector3(.72,0,.10).applyAxisAngle(new THREE.Vector3(0,1,0),ry);
  const laptop=placeAsset('laptop',x+laptopOffset.x,z+laptopOffset.z,{fit:{width:.34},ry:ry+Math.PI});
  laptop.position.y=.86;
  const seat=new THREE.Vector3(x+chairOffset.x,0,z+chairOffset.z);
  const work=new THREE.Vector3(x,0,z+.56).applyAxisAngle(new THREE.Vector3(0,1,0),ry);
  work.x+=x;work.z+=z;
  return {desk,chair,seat,work,ry};
}

function addPlant(x,z,h=1.15){
  return placeAsset('plant',x,z,{fit:{height:h},ry:Math.random()*.5-.25});
}
function addSmallPlant(x,z,h=.55){
  return placeAsset('plantSmall',x,z,{fit:{height:h},ry:Math.random()*.5-.25});
}

function buildOperationsScreen(){
  operationsTexture=canvasTexture(1200,680,()=>{});
  const frame=makeBox(8.5,4.65,.24,0x121b20,{metalness:.28,roughness:.35});
  frame.position.set(0,2.42,-9.34);world.add(frame);
  operationsScreen=makePlane(8.05,4.2,new THREE.MeshBasicMaterial({map:operationsTexture.texture}));
  operationsScreen.position.set(0,2.42,-9.205);world.add(operationsScreen);
  const tvHit=makePlane(8.25,4.4,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  tvHit.position.set(0,2.42,-9.12);tvHit.userData.station='control_tv';world.add(tvHit);stationHits.set('control_tv',tvHit);
  addGlowLine(0,.22,-8.92,8.25,.06,COLOR.amber,.85);
  const glow=new THREE.PointLight(COLOR.teal,1.05,8.0,2);glow.position.set(0,2.2,-7.4);world.add(glow);
  redrawOperations(snapshot);
}

function redrawOperations(snap){
  if(!operationsTexture)return;
  const g=operationsTexture.ctx,c=operationsTexture.canvas,m=snap?.metrics||{};
  g.fillStyle='#051219';g.fillRect(0,0,c.width,c.height);
  g.strokeStyle='#2c7f89';g.lineWidth=10;g.strokeRect(15,15,c.width-30,c.height-30);
  g.fillStyle='#eff6f4';g.font='900 61px Arial';g.fillText('CENTRAL DO SUPERVISOR',55,82);
  g.fillStyle='#53dac0';g.font='800 24px monospace';g.fillText('GERENTE DOT · '+String(snap?.supervisor?.action||'MONITORANDO').toUpperCase(),60,122);
  g.textAlign='right';g.fillStyle='#dbe7e6';g.font='800 28px monospace';
  g.fillText(new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),1140,82);g.textAlign='left';
  const cards=[
    ['FILA',Number(m.pending||0),'#6aaee0'],['EXEC',Number(m.processing_agents||0),'#4ed6b3'],
    ['RETRY',Number(m.retry||0),'#e5b15a'],['24H',Number(m.done_24h||0),'#68cf91'],
    ['SUCESSO',Number(m.success_24h||0).toFixed(0)+'%','#68cf91']
  ];
  cards.forEach((v,i)=>{
    const x=53+i*218,y=151;g.fillStyle='#102832';g.fillRect(x,y,192,98);
    g.fillStyle='#789096';g.font='800 20px monospace';g.fillText(v[0],x+16,y+30);
    g.fillStyle=v[2];g.font='900 42px Arial';g.fillText(String(v[1]),x+16,y+76);
  });
  g.fillStyle='#8aa1a6';g.font='900 23px monospace';g.fillText('TAREFAS ATIVAS',58,304);
  const tasks=(snap?.task_board||[]).slice(0,5);
  if(!tasks.length){g.fillStyle='#6d8388';g.font='26px Arial';g.fillText('Sem tarefas ativas agora.',58,354);}
  tasks.forEach((t,i)=>{
    const y=350+i*50,st=String(t.status||''),co=/failed|error|waiting|retry/i.test(st)?'#e5b15a':'#49d4b0';
    g.fillStyle=co;g.fillRect(60,y-16,13,13);
    let label=(t.agent_name||t.role||'DOT')+' · '+(t.label||t.type||'Tarefa');if(label.length>56)label=label.slice(0,54)+'…';
    g.fillStyle='#dce9e7';g.font='700 25px Arial';g.fillText(label,88,y);
    const pr=Math.max(0,Math.min(100,Number(t.progress||0)));
    g.fillStyle='#17313a';g.fillRect(850,y-18,255,14);g.fillStyle=co;g.fillRect(850,y-18,255*(pr/100),14);
    g.fillStyle='#81979c';g.font='700 18px monospace';g.fillText(pr+'%',1110,y-6);
  });
  g.fillStyle='#7a9197';g.font='700 18px monospace';
  g.fillText('BLOQUEIOS '+Number(m.needs_user||0)+'  ·  EQUIPE '+Number(snap?.team?.enabled||0)+'/'+Number(snap?.team?.total||0),58,642);
  operationsTexture.texture.needsUpdate=true;
}

function addBrand(){
  const tex=canvasTexture(1024,300,(g,c)=>{
    g.clearRect(0,0,c.width,c.height);g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='#f5f8f7';g.font='900 126px Arial';g.fillText('COTATIVA',c.width/2,112);
    g.fillStyle='#4ad7b2';g.font='800 34px monospace';g.fillText('TECNOLOGIA PARA NEGÓCIOS',c.width/2,205);
  });
  const p=makePlane(5.3,1.55,new THREE.MeshBasicMaterial({map:tex.texture,transparent:true}));
  p.position.set(9.4,2.30,-9.50);world.add(p);
}

function buildShell(){
  const slab=makeBox(27.7,.38,20.6,COLOR.slab);slab.position.y=-.26;world.add(slab);
  const under=makeBox(28.0,.48,20.9,COLOR.slabSide);under.position.y=-.56;world.add(under);

  const floorTex=canvasTexture(1024,768,(g,c)=>{
    const tile=64;g.fillStyle='#5d5c57';g.fillRect(0,0,c.width,c.height);
    for(let y=0;y<c.height;y+=tile)for(let x=0;x<c.width;x+=tile){
      g.fillStyle=((x/tile+y/tile)%2)?'#615f59':'#69665e';g.fillRect(x,y,tile,tile);
      g.strokeStyle='rgba(255,255,255,.075)';g.lineWidth=2;g.strokeRect(x,y,tile,tile);
    }
  });
  floorTex.texture.wrapS=THREE.RepeatWrapping;floorTex.texture.wrapT=THREE.RepeatWrapping;floorTex.texture.repeat.set(5.5,4.2);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(27.1,20.0),new THREE.MeshStandardMaterial({map:floorTex.texture,roughness:.92}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.045;floor.receiveShadow=true;world.add(floor);

  const back=makeBox(27.1,3.95,.16,COLOR.wall);back.position.set(0,1.98,-9.62);world.add(back);
  const left=makeBox(.16,3.95,19.4,COLOR.wall);left.position.set(-13.42,1.98,0);world.add(left);
  addGlowLine(0,3.86,-9.43,26.5,.055,COLOR.amber,.72);
  addGlowLine(-13.21,3.62,-.2,.055,17.2,COLOR.amber,.50);

  // Internal partitions come from the same approved map used by the navmesh.
  // Door gaps are therefore real in both rendering and collision geometry.
  (OFFICE_MAP.barriers||[]).forEach(barrier=>{
    addGlassWall(
      Number(barrier.x),Number(barrier.z),
      Number(barrier.w),Number(barrier.d),
      Number(barrier.h||2.5)
    );
  });

  Object.keys(STATIONS).forEach(addZone);
}

function addDecor(){
  // Entrance / exit
  const door=placeAsset('doorway',-12.95,7.0,{fit:{height:2.9},ry:Math.PI/2});
  door.position.y=.02;
  const matTex=canvasTexture(700,240,(g,c)=>{
    g.fillStyle='#111719';g.fillRect(0,0,c.width,c.height);g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='#f4f8f7';g.font='900 82px Arial';g.fillText('COTATIVA',c.width/2,96);
    g.fillStyle='#4bd5b1';g.font='800 24px monospace';g.fillText('TECNOLOGIA PARA NEGÓCIOS',c.width/2,166);
  });
  const mat=makePlane(3.8,1.25,new THREE.MeshStandardMaterial({map:matTex.texture,roughness:.95}));
  mat.rotation.x=-Math.PI/2;mat.rotation.z=-Math.PI/2;mat.position.set(-11.25,.02,7.05);world.add(mat);

  // Gerência
  placeAsset('bookcase',-11.7,-6.05,{fit:{height:2.25}});
  placeAsset('drawers',-11.3,-3.55,{fit:{width:1.6}});
  addPlant(-6.85,-7.35,1.15);
  placeAsset('floorLamp',-7.0,-6.65,{fit:{height:2.15}});
  placeAsset('loungeChair',-7.15,-3.4,{fit:{height:1.0},ry:-.4});

  // Lounge
  placeAsset('sofa',-10.2,5.55,{fit:{width:2.35}});
  placeAsset('coffeeTable',-8.55,5.65,{fit:{width:1.15}});
  addPlant(-11.7,4.55,1.35);addSmallPlant(-8.55,5.45,.50);

  // Social / Content
  placeAsset('bookcase',11.6,-3.0,{fit:{height:2.2},ry:Math.PI});
  placeAsset('drawers',11.2,2.6,{fit:{width:1.55},ry:Math.PI/2});
  addPlant(6.0,-6.3,1.20);addPlant(11.5,-5.8,1.30);addPlant(11.6,.7,1.15);
  placeAsset('floorLamp',11.55,-4.35,{fit:{height:2.1}});

  // Engineering / infrastructure
  [7.5,8.55].forEach((x,i)=>{
    const rack=makeBox(.95,2.45,.88,0x12191d,{roughness:.48,metalness:.32});rack.position.set(x,1.225,5.45);world.add(rack);
    for(let j=0;j<8;j++){
      const slot=makeBox(.72,.18,.025,0x29363c,{metalness:.28});slot.position.set(x,.34+j*.25,4.997);world.add(slot);
      const led=new THREE.PointLight(j%3===0?COLOR.green:COLOR.blue,.07,.5,2);led.position.set(x-.25,.34+j*.25,4.94);world.add(led);
    }
  });

  // Meeting / support
  placeAsset('table',9.6,6.1,{fit:{width:3.6}});
  [[8.2,5.35],[9.15,5.35],[10.1,5.35],[11.0,5.35],[8.2,6.85],[9.15,6.85],[10.1,6.85],[11.0,6.85]]
    .forEach(([x,z],i)=>placeAsset('chair',x,z,{fit:{height:1.0},ry:i<4?0:Math.PI}));
  placeAsset('coffee',11.6,7.7,{fit:{height:.62},ry:Math.PI});
  placeAsset('trash',10.85,7.65,{fit:{height:.55}});

  // Whiteboard / planning
  const tex=canvasTexture(700,460,(g,c)=>{
    g.fillStyle='#f5f1e9';g.fillRect(0,0,c.width,c.height);
    g.fillStyle='#24333a';g.font='900 52px Arial';g.fillText('PLANEJAMENTO',44,75);
    g.font='31px Arial';['✓ Campanhas','✓ Conteúdos','✓ Otimizações SEO','✓ Resultados','✓ Novos projetos'].forEach((t,i)=>g.fillText(t,55,145+i*56));
  });
  const boardFrame=makeBox(3.9,2.5,.08,0x647278,{metalness:.35});boardFrame.position.set(10.25,1.65,-5.65);world.add(boardFrame);
  const board=makePlane(3.65,2.25,new THREE.MeshStandardMaterial({map:tex.texture,roughness:.8}));board.position.set(10.25,1.65,-5.60);world.add(board);

  addBrand();
}

function findBone(root,name){
  let found=null;root.traverse(o=>{if(!found&&o.name===name)found=o;});return found;
}

function createRig(root){
  const names=['root','pelvis','spine_01','spine_02','spine_03','neck_01','Head',
    'clavicle_l','upperarm_l','lowerarm_l','hand_l','clavicle_r','upperarm_r','lowerarm_r','hand_r',
    'thigh_l','calf_l','foot_l','thigh_r','calf_r','foot_r'];
  const bones={};const base={};
  names.forEach(name=>{
    const b=findBone(root,name);if(b){bones[name]=b;base[name]={q:b.quaternion.clone(),p:b.position.clone()};}
  });
  return {bones,base};
}
const deltaQ=new THREE.Quaternion();
const deltaE=new THREE.Euler();
function boneDelta(rig,name,x=0,y=0,z=0){
  const b=rig.bones[name],base=rig.base[name];if(!b||!base)return;
  deltaE.set(x,y,z,'XYZ');deltaQ.setFromEuler(deltaE);
  b.quaternion.copy(base.q).multiply(deltaQ);
  b.position.copy(base.p);
}
function resetRig(rig){
  Object.keys(rig.bones).forEach(name=>{
    rig.bones[name].quaternion.copy(rig.base[name].q);
    rig.bones[name].position.copy(rig.base[name].p);
  });
}

function recolorHuman(root,color){
  root.traverse(o=>{
    if(!(o.isMesh||o.isSkinnedMesh)||!o.material)return;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    mats.forEach(m=>{
      if(/Superhero/i.test(m.name||'')){m.color?.setHex(color);m.roughness=.72;}
      else if(/Hair/i.test(m.name||'')){m.color?.setHex(0x241b18);}
      else if(/Eye/i.test(m.name||'')){m.color?.setHex(0x4b2b18);}
    });
  });
}

function createHuman(gender,station){
  const root=cloneAsset(gender==='female'?'female':'male');
  fitObject(root,{height:1.82});
  recolorHuman(root,STATIONS[station]?.color||0x31515a);
  root.position.y=0;root.rotation.y=Math.PI;
  const rig=createRig(root);
  return {root,rig,gender,station,phase:'idle',route:[],routeIndex:0,speed:1.05,home:new THREE.Vector3(),jobId:0,lead:false};
}

function poseIdle(v,t){
  resetRig(v.rig);
  boneDelta(v.rig,'spine_02',.02+Math.sin(t*.9)*.012,0,0);
  boneDelta(v.rig,'upperarm_l',.04,0,.12+Math.sin(t*.7)*.03);
  boneDelta(v.rig,'upperarm_r',.04,0,-.12-Math.sin(t*.7)*.03);
  boneDelta(v.rig,'Head',0,Math.sin(t*.35)*.045,0);
}

function poseTyping(v,t){
  resetRig(v.rig);
  boneDelta(v.rig,'pelvis',-.08,0,0);
  boneDelta(v.rig,'spine_01',.12,0,0);boneDelta(v.rig,'spine_02',.10,0,0);boneDelta(v.rig,'neck_01',.10,0,0);
  boneDelta(v.rig,'thigh_l',-1.28,0,.03);boneDelta(v.rig,'thigh_r',-1.28,0,-.03);
  boneDelta(v.rig,'calf_l',1.42,0,0);boneDelta(v.rig,'calf_r',1.42,0,0);
  boneDelta(v.rig,'upperarm_l',-.55,0,.35);boneDelta(v.rig,'upperarm_r',-.55,0,-.35);
  boneDelta(v.rig,'lowerarm_l',-1.05+Math.sin(t*5.1)*.055,0,.10);
  boneDelta(v.rig,'lowerarm_r',-1.05+Math.sin(t*5.5+1.3)*.055,0,-.10);
  boneDelta(v.rig,'hand_l',0,0,Math.sin(t*7)*.06);boneDelta(v.rig,'hand_r',0,0,-Math.sin(t*7.3)*.06);
}

function poseWalk(v,t){
  resetRig(v.rig);
  const s=Math.sin(t*5.7),a=s*.62;
  boneDelta(v.rig,'thigh_l',a,0,0);boneDelta(v.rig,'thigh_r',-a,0,0);
  boneDelta(v.rig,'calf_l',Math.max(0,-s)*.65,0,0);boneDelta(v.rig,'calf_r',Math.max(0,s)*.65,0,0);
  boneDelta(v.rig,'upperarm_l',-a*.55,0,.08);boneDelta(v.rig,'upperarm_r',a*.55,0,-.08);
  boneDelta(v.rig,'lowerarm_l',-.18,0,0);boneDelta(v.rig,'lowerarm_r',-.18,0,0);
  boneDelta(v.rig,'spine_02',.02,Math.sin(t*5.7)*.035,0);
  v.root.position.y=.02+Math.abs(Math.sin(t*5.7))*.025;
}

function posePresenter(v,t){
  poseIdle(v,t);
  boneDelta(v.rig,'upperarm_r',-.55,0,-.62);
  boneDelta(v.rig,'lowerarm_r',-.85,0,-.15+Math.sin(t*1.6)*.06);
  boneDelta(v.rig,'Head',0,-.12+Math.sin(t*.5)*.04,0);
}

function addManagerTablet(v){
  const hand=v.rig?.bones?.hand_l;if(!hand)return null;
  const group=new THREE.Group();
  const shell=new THREE.Mesh(
    new THREE.BoxGeometry(.24,.025,.36),
    std(0x182126,{metalness:.42,roughness:.28})
  );
  const screen=new THREE.Mesh(
    new THREE.PlaneGeometry(.205,.315),
    new THREE.MeshBasicMaterial({color:COLOR.teal})
  );
  screen.rotation.x=-Math.PI/2;screen.position.y=.014;
  group.add(shell);group.add(screen);
  group.position.set(.02,.06,.02);
  group.rotation.set(-.18,.12,.12);
  hand.add(group);
  v.tablet=group;v.tabletScreen=screen;
  return group;
}

function poseSupervisor(v,t){
  resetRig(v.rig);
  boneDelta(v.rig,'spine_01',.03,0,0);
  boneDelta(v.rig,'spine_02',.05,0,0);
  boneDelta(v.rig,'neck_01',.06,0,0);
  boneDelta(v.rig,'Head',.02,-.10+Math.sin(t*.45)*.035,0);
  boneDelta(v.rig,'upperarm_l',-.58,0,.42);
  boneDelta(v.rig,'lowerarm_l',-1.08,0,.10);
  boneDelta(v.rig,'hand_l',.05,0,.08);
  boneDelta(v.rig,'upperarm_r',-.48,0,-.34);
  boneDelta(v.rig,'lowerarm_r',-1.05+Math.sin(t*2.4)*.06,0,-.06);
  boneDelta(v.rig,'hand_r',0,0,-.12+Math.sin(t*4.6)*.08);
  if(v.tabletScreen?.material){
    const attention=/intervention|recovery|dispatch/i.test(String(v.supervisorMode||''));
    v.tabletScreen.material.color.setHex(attention?COLOR.amber:COLOR.teal);
  }
}

function addHumanToScene(v,pos,ry=Math.PI){
  v.root.position.copy(pos);v.root.rotation.y=ry;v.home.copy(pos);world.add(v.root);staff.push(v);return v;
}

function registerAgentDesk(agent,desk,facing=Math.PI,seatIndex=0){
  const id=String(agent?.id||agent?.agent_key||'');if(!id)return;
  const station=stationFromAgent(agent);
  const canonicalApproach=officeMapWorkstationApproach(station,seatIndex);
  const away=desk.seat.clone().sub(desk.desk.position);away.y=0;
  if(away.lengthSq()<.001)away.set(0,0,1);else away.normalize();
  const personalApproach='approach_'+id.replace(/[^a-z0-9_-]+/gi,'_');
  const approachPoint=desk.seat.clone().addScaledVector(away,.58);
  simulation.registerPoint(personalApproach,{x:approachPoint.x,z:approachPoint.z,zone:station});
  simulation.connect(canonicalApproach,personalApproach);
  const record={seat:desk.seat.clone(),facing,station,approach:personalApproach,canonicalApproach};
  deskRegistry.set(id,record);
  if(!departmentDesks.has(station))departmentDesks.set(station,[]);
  departmentDesks.get(station).push(record);
  simulation.defineAgentWorkstation(id,station,{x:desk.seat.x,z:desk.seat.z},{facing,approach:personalApproach});
}

function ensureSimulationAvatar(agent,index=0){
  const id=String(agent?.id||agent?.agent_key||'');if(!id)return null;
  if(staffByAgent.has(id))return staffByAgent.get(id);

  const station=stationFromAgent(agent);
  const gender=(index%3===1||index%5===3)?'female':'male';
  const personal=deskRegistry.get(id);
  const departmentFallback=departmentDesks.get(station)?.[0]||null;
  const home=personal?.seat||departmentFallback?.seat||new THREE.Vector3(-11.55,0,7.05);

  const v=createHuman(gender,station);
  v.agentId=id;v.name=String(agent?.name||id);v.lead=true;
  addHumanToScene(v,new THREE.Vector3(home.x,-.42,home.z),personal?.facing??Math.PI);
  if(id==='dot-manager')addManagerTablet(v);
  v.root.visible=agent?.enabled!==false;
  staffByAgent.set(id,v);

  simulation.registerAgent({
    id,
    name:v.name,
    station,
    enabled:agent?.enabled!==false,
    position:{x:home.x,z:home.z},
    speed:id==='dot-manager'?1.02:1.08+(index%4)*.025
  });
  return v;
}

function buildDesksAndStaff(snap){
  const agents=Array.isArray(snap?.agents)?snap.agents:[];
  const byStation=new Map();
  agents.forEach(agent=>{
    const station=stationFromAgent(agent);
    if(!byStation.has(station))byStation.set(station,[]);
    byStation.get(station).push(agent);
  });
  byStation.forEach(list=>list.sort((a,b)=>{
    const ai=Number(a?.meta?.seat_index??999),bi=Number(b?.meta?.seat_index??999);
    return ai-bi||String(a?.id||'').localeCompare(String(b?.id||''));
  }));

  // Every visible employee receives a real desk resource.
  const deskSlots={
    manager:[
      addDeskSet('manager',-9.2,-5.55,{dual:true})
    ],
    operations:[
      addDeskSet('operations',-2.45,1.35,{dual:true}),
      addDeskSet('operations',-.05,1.35,{dual:true}),
      addDeskSet('operations',2.35,1.35,{dual:true})
    ],
    social:[
      addDeskSet('social',3.65,-5.05,{dual:true}),
      addDeskSet('social',5.85,-5.05,{dual:true})
    ],
    content:[
      addDeskSet('content',8.05,-1.00,{dual:true}),
      addDeskSet('content',10.15,-1.00,{dual:true}),
      addDeskSet('content',9.10,1.05,{dual:true})
    ],
    seo:[
      addDeskSet('seo',-9.10,2.70,{dual:true}),
      addDeskSet('seo',-7.10,2.70,{dual:true}),
      addDeskSet('seo',-5.10,2.70,{dual:true})
    ],
    engineering:[
      addDeskSet('engineering',3.75,4.35,{dual:true}),
      addDeskSet('engineering',6.05,4.35,{dual:true})
    ]
  };

  for(const [station,desks] of Object.entries(deskSlots)){
    if(!departmentDesks.has(station))departmentDesks.set(station,[]);
    desks.forEach(d=>departmentDesks.get(station).push({seat:d.seat.clone(),facing:Math.PI,station}));
    const departmentAgents=byStation.get(station)||[];
    departmentAgents.forEach((agent,index)=>{
      const seatIndex=Math.max(0,Math.min(desks.length-1,Number(agent?.meta?.seat_index??index)));
      const desk=desks[seatIndex]||desks[index%desks.length];
      const facing=(Number(desk.ry||0)+Math.PI)%(Math.PI*2);
      registerAgentDesk(agent,desk,facing,seatIndex);
    });
  }

  // Shared resources use a navmesh approach plus a short final settling step.
  [
    ['a',8.35,5.35,8.35,4.55],
    ['b',9.25,5.35,9.25,4.55],
    ['c',10.15,5.35,10.15,4.55]
  ].forEach(([id,x,z,ax,az])=>{
    const approach='meeting_approach_'+id;
    simulation.registerPoint(approach,{x:ax,z:az,zone:'meeting'});
    simulation.connect(OFFICE_MAP.sharedApproach.meeting,approach);
    simulation.defineMeetingSeat(id,{x,z},{facing:0,approach});
  });

  simulation.registerPoint('lounge_approach_a',{x:-10.65,z:4.65,zone:'lounge'});
  simulation.registerPoint('lounge_approach_b',{x:-9.75,z:4.65,zone:'lounge'});
  simulation.connect(OFFICE_MAP.sharedApproach.lounge,'lounge_approach_a');
  simulation.connect(OFFICE_MAP.sharedApproach.lounge,'lounge_approach_b');
  simulation.defineLounge('a',{x:-10.65,z:5.55},{facing:0,approach:'lounge_approach_a'});
  simulation.defineLounge('b',{x:-9.75,z:5.55},{facing:0,approach:'lounge_approach_b'});

  simulation.defineCoffee({x:10.75,z:7.18},{approach:OFFICE_MAP.sharedApproach.coffee});
  simulation.defineManagerControl({x:.10,z:-6.55},{approach:OFFICE_MAP.sharedApproach.control});

  agents.forEach((agent,index)=>ensureSimulationAvatar(agent,index));
}

function applySnapshot(snap,initial=false){
  redrawOperations(snap);
  const agents=Array.isArray(snap?.agents)?snap.agents:[];
  agents.forEach((agent,index)=>ensureSimulationAvatar(agent,index));
  const manager=staffByAgent.get('dot-manager');
  if(manager){
    manager.supervisorMode=String(snap?.supervisor?.mode||'monitoring');
    manager.supervisorAction=String(snap?.supervisor?.action||'Monitorando operação');
    manager.selectedJobId=Number(snap?.supervisor?.selected_job_id||0);
  }
  simulation.syncSnapshot(snap);
  updateStationHighlight(snap);
}

function updateStaff(v,dt,t,index){
  const sim=v.agentId?simulation.getAgent(v.agentId):null;
  if(!sim){v.root.visible=false;return;}
  v.root.visible=sim.visible!==false;
  if(!v.root.visible)return;
  if(v.tablet)v.tablet.visible=sim.state===SIM_STATE.SUPERVISING;

  v.root.position.x=sim.position.x;
  v.root.position.z=sim.position.z;
  v.root.position.y=sim.seated?-.42:0;
  if(Number.isFinite(sim.rotation))v.root.rotation.y=sim.rotation;

  // The simulation controls intent and locomotion. The current Quaternius
  // placeholder rig is intentionally kept conservative until Avatar Edition;
  // no random arm/pose choreography is allowed anymore.
  const walking=[
    SIM_STATE.WALKING,SIM_STATE.GOING_TO_WORK,SIM_STATE.GOING_TO_MEETING,SIM_STATE.GOING_TO_BREAK
  ].includes(sim.state);

  if(walking)poseWalk(v,t+index*.17);
  else if(sim.state===SIM_STATE.SUPERVISING)poseSupervisor(v,t+index*.11);
  else if(sim.state===SIM_STATE.WORKING&&sim.animation==='typing')poseTyping(v,t+index*.13);
  else poseIdle(v,t+index*.19);
}
function normalizeRole(value){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function stationFromAgent(agent){
  const raw=normalizeRole(agent?.station||agent?.role||'operations');
  return STATIONS[raw]?raw:(ROLE_STATION[raw]||'operations');
}

function updateStationHighlight(snap){
  const entries=[...(snap?.stations||[]),...(snap?.desks||[])];
  const map=new Map(entries.map(x=>[String(x.key||x.station||''),x]));
  stationHits.forEach((hit,key)=>{
    const st=map.get(key)||{},status=String(st.status||'standby').toLowerCase();
    const stationColor=STATIONS[key]?.color||COLOR.teal;
    hit.material.opacity=focusedStation===key?.07:/error|failed|waiting|retry|blocked/.test(status)?.035:0;
    hit.material.color.setHex(/error|failed|waiting|retry|blocked/.test(status)?COLOR.amber:stationColor);
  });
}

function resize(){
  const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight),aspect=w/h;
  // Approved wide isometric framing: entire office stays visible even with drawer.
  const viewHeight=(aspect<1.42?23.9:aspect<1.62?22.8:21.7)*cameraState.zoom;
  const viewWidth=viewHeight*aspect;
  camera.left=-viewWidth/2;camera.right=viewWidth/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(w,h,false);
  composer.setSize(w,h);
  bloom.resolution.set(w,h);
}
function updateCamera(){
  const t=cameraState.theta,d=cameraState.distance;
  camera.position.set(Math.sin(t)*d,cameraState.height,Math.cos(t)*d);
  camera.lookAt(cameraState.target);
}
new ResizeObserver(()=>{resize();updateCamera();}).observe(stage);

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function stationAtEvent(event){
  const r=renderer.domElement.getBoundingClientRect();
  pointer.x=((event.clientX-r.left)/r.width)*2-1;pointer.y=-((event.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  return raycaster.intersectObjects([...stationHits.values()],false)[0]?.object?.userData?.station||null;
}
renderer.domElement.addEventListener('pointerdown',event=>{
  drag=true;dragMoved=false;dragStart={x:event.clientX,y:event.clientY};dragPrev={...dragStart};
  renderer.domElement.setPointerCapture?.(event.pointerId);
});
renderer.domElement.addEventListener('pointermove',event=>{
  if(!drag){renderer.domElement.style.cursor=stationAtEvent(event)?'pointer':'grab';return;}
  if(Math.hypot(event.clientX-dragStart.x,event.clientY-dragStart.y)>4)dragMoved=true;
  const dx=event.clientX-dragPrev.x;dragPrev={x:event.clientX,y:event.clientY};
  cameraState.theta=Math.max(cameraState.baseTheta-.24,Math.min(cameraState.baseTheta+.24,cameraState.theta-dx*.0022));
  updateCamera();
});
renderer.domElement.addEventListener('pointerup',event=>{drag=false;renderer.domElement.releasePointerCapture?.(event.pointerId);});
renderer.domElement.addEventListener('wheel',event=>{
  cameraState.zoom=Math.max(.86,Math.min(1.22,cameraState.zoom+event.deltaY*.0006));resize();
},{passive:true});
renderer.domElement.addEventListener('click',event=>{
  if(dragMoved)return;
  const key=stationAtEvent(event);
  if(key)root.dispatchEvent(new CustomEvent('dot:station-click',{detail:{key}}));
});

// Premium lighting
scene.add(new THREE.HemisphereLight(0xdcebed,0x253138,1.12));
scene.add(new THREE.AmbientLight(0xffffff,.22));
const sun=new THREE.DirectionalLight(0xffdfac,2.45);
sun.position.set(-10,18,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-21;sun.shadow.camera.right=21;sun.shadow.camera.top=21;sun.shadow.camera.bottom=-21;sun.shadow.bias=-.00035;scene.add(sun);
const cool=new THREE.DirectionalLight(0x9bdcff,1.08);cool.position.set(14,11,-8);scene.add(cool);
const front=new THREE.PointLight(0xffd38c,.70,16,2);front.position.set(-2,8,8);scene.add(front);

await preloadAssets();
buildShell();
buildOperationsScreen();
addDecor();
buildDesksAndStaff(snapshot);
buildNavigationOverlay();
applySnapshot(snapshot,true);
updateCamera();resize();

loading.style.transition='opacity .35s ease';
loading.style.opacity='0';
setTimeout(()=>loading.remove(),380);

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  if(document.hidden){clock.getDelta();return;}
  const dt=Math.min(.05,clock.getDelta()),t=performance.now()/1000;
  simulation.update(dt);
  staff.forEach((v,i)=>updateStaff(v,dt,t,i));
  composer.render();
}
animate();

window.DotOfficeEngine={
  updateSnapshot(next){if(!next)return;snapshot=next;applySnapshot(next,false);},
  focusStation(key){
    const k=String(key||'');if(!STATIONS[k]&&k!=='control_tv')return;
    focusedStation=k;updateStationHighlight(snapshot);
  },
  resetView(){
    focusedStation=null;cameraState.theta=cameraState.baseTheta;cameraState.zoom=1;cameraState.target.set(0,.85,.2);
    resize();updateCamera();updateStationHighlight(snapshot);
  },
  toggleNavigation(force){
    return setNavigationVisible(typeof force==='boolean'?force:!navigationVisible);
  },
  getState(){
    return {
      renderer:'office-engine-2',
      version:'4.17.0',
      simulation:'duty-state-machine-v3',
      navmeshEngine:NAVMESH_ENGINE_VERSION,
      navmesh:navmesh.debug(),
      mapVersion:OFFICE_MAP_VERSION,
      navigationVisible,
      realHumanoids:true,
      furnitureGLB:true,
      staff:staffByAgent.size,
      office:simulation.debug()
    };
  }
};
