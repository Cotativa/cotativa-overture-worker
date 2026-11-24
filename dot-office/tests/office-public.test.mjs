import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {OFFICE3_PLAN,OFFICE3_PLAN_VERSION} from '../assets/dot-office-engine3-plan.js';
import {createOffice3Behavior,resolveOfficeRoster,stationDepartment} from '../assets/dot-office-engine3-behavior.js';

const here=dirname(fileURLToPath(import.meta.url));
const file=p=>readFileSync(resolve(here,p),'utf8');
const expected={manager:1,operations:3,social:2,content:3,seo:3,engineering:2};
const workers=OFFICE3_PLAN.stations.map((station,i)=>{
 const index=OFFICE3_PLAN.stations.slice(0,i).filter(s=>s.department===station.department).length;
 return {id:'demo-'+station.id,station:station.department,enabled:true,meta:{seat_index:index}};
});
const newBehavior=()=>createOffice3Behavior({plan:OFFICE3_PLAN,toWorld:(x,y)=>({x:x/1000-9,z:y/1000-6.25})});

test('versioned isometric office is complete and has exactly 14 distinct desks',()=>{
 assert.equal(OFFICE3_PLAN_VERSION,'cotativa-diorama-world-v3.0');
 assert.equal(OFFICE3_PLAN.camera.kind,'orthographic');
 assert.equal(OFFICE3_PLAN.stations.length,14);
 assert.equal(new Set(OFFICE3_PLAN.stations.map(s=>s.id)).size,14);
 for(const [department,expectedCount] of Object.entries(expected)){
   assert.equal(OFFICE3_PLAN.stations.filter(s=>s.department===department).length,expectedCount,department);
 }
 for(let i=0;i<OFFICE3_PLAN.stations.length;i++){
  for(let j=i+1;j<OFFICE3_PLAN.stations.length;j++){
   const a=OFFICE3_PLAN.stations[i],b=OFFICE3_PLAN.stations[j];
   assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=1200,'overlapping desks '+a.id+'/'+b.id);
  }
 }
});

test('all 14 planned visual workers have unique real desk coordinates',()=>{
 const behavior=newBehavior();
 const snapshot={office:{future_staffing:workers},agents:workers};
 behavior.sync(snapshot);
 assert.equal(resolveOfficeRoster(snapshot).length,14);
 assert.equal(behavior.getAgents().length,14);
 assert.equal(new Set(behavior.getAgents().map(a=>a.poi.id)).size,14);
 assert.equal(stationDepartment({station:'engineering'}),'engineering');
 assert.equal(stationDepartment({station:'Infra'}),'engineering');
});

test('work is driven by real snapshot state only, never a visual-only idle animation',()=>{
 const b=newBehavior();
 const live=workers.map(a=>({...a,current_job_id:0}));
 live[7].current_job_id=843;
 live[8].enabled=false;
 b.sync({office:{future_staffing:workers},agents:live});
 assert.equal(b.getAgent(live[7].id).state,'walking-to-work');
 assert.ok(!['working','walking-to-work'].includes(b.getAgent(live[8].id).state));
 for(let i=0;i<3000;i++)b.update(1/60);
 assert.equal(b.getAgent(live[7].id).state,'working');
 live[7].current_job_id=0;
 b.sync({office:{future_staffing:workers},agents:live});
 for(let i=0;i<3000;i++)b.update(1/60);
 assert.equal(b.getAgent(live[7].id).state,'idle');
});

test('miniatures and controls use a standalone public engine',()=>{
 const engine=file('../assets/dot-office-engine3.js');
 const bootstrap=file('../assets/dot-office-bootstrap.js');
 assert.ok(engine.includes('new THREE.OrthographicCamera'));
 assert.ok(engine.includes('function createMiniAgent('));
 assert.ok(engine.includes('function animateMiniAgent('));
 assert.ok(engine.includes("root.dataset.dotHumanRenderer='diorama-mesh'"));
 assert.ok(engine.includes('qualityMode=\'adaptive\''));
 assert.ok(engine.includes('prefers-reduced-motion'));
 assert.ok(engine.includes('function focusStation('));
 assert.ok(engine.includes('function resetView('));
 assert.ok(bootstrap.includes('dot-office-engine3.js?v=4.29.48-diorama'));
});

test('public demo does not connect to private backend or include secrets',()=>{
 const html=file('../demo/index.html');
 const demo=file('../demo/demo.js');
 assert.match(html,/DEMONSTRAÇÃO FICTÍCIA/);
 assert.match(html,/data-dot-office-stations-json/);
 assert.match(demo,/synthetic/i);
 assert.doesNotMatch(demo, /fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|\/admin\/api\//);
 const files=readdirSync(resolve(here,'../assets')).filter(x=>x.endsWith('.js'));
 for(const name of files){
   const source=file('../assets/'+name);
   assert.doesNotMatch(source, /github_pat_[a-zA-Z0-9_]{30,}|ghp_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{28,}|AIza[A-Za-z0-9_-]{25,}/);
 }
});
