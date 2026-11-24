/**
 * Cotativa Office Engine 3 — Delegation Agents Behavior
 * Release: v4.23.0
 *
 * Uses the official 14-person Cotativa staffing plan as the visual roster and
 * merges live runtime state on top. Navigation is deterministic over the
 * approved office graph. Visual presence never depends on whether a job happens
 * to be executing at the instant the snapshot is read.
 */
export const OFFICE3_BEHAVIOR_VERSION='delegation-agents-v3';

const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

export function stationDepartment(agent={}){
  const raw=norm(agent.station||agent.department||agent.role||'operations');
  if(raw.includes('manager')||raw.includes('gerenc'))return 'manager';
  if(raw.includes('social'))return 'social';
  if(raw.includes('conte'))return 'content';
  if(raw.includes('seo')||raw.includes('google'))return 'seo';
  if(raw.includes('engen')||raw.includes('engineer')||raw.includes('infra'))return 'engineering';
  return 'operations';
}

export function resolveOfficeRoster(snapshot={}){
  const planned=Array.isArray(snapshot?.office?.future_staffing)?snapshot.office.future_staffing:[];
  const live=Array.isArray(snapshot?.agents)?snapshot.agents:[];
  const liveById=new Map(
    live.map(row=>[String(row.id||row.agent_key||''),row]).filter(([id])=>id)
  );
  const merged=[];
  const seen=new Set();

  planned.forEach((base,index)=>{
    const id=String(base.id||base.agent_key||'');if(!id)return;
    const real=liveById.get(id);
    merged.push({
      ...base,
      ...(real||{}),
      meta:{...(base.meta||{}),...(real?.meta||{})},
      id,
      visual_enabled:true,
      operational_enabled:real?real.enabled!==false:base.enabled!==false,
      roster_only:!real,
      roster_index:index
    });
    seen.add(id);
  });

  live.forEach((row,index)=>{
    const id=String(row.id||row.agent_key||'');if(!id||seen.has(id))return;
    merged.push({
      ...row,
      id,
      visual_enabled:true,
      operational_enabled:row.enabled!==false,
      roster_only:false,
      roster_index:planned.length+index
    });
  });
  return merged;
}

export function buildOffice3POIs(plan,toWorld){
  const stations=plan.stations.map((s,index)=>{
    const seat=toWorld(s.x,s.y);
    const r=(Number(s.rotationDeg||0)*Math.PI)/180;
    const approach={x:seat.x+Math.sin(r)*.72,z:seat.z+Math.cos(r)*.72};
    return {
      id:s.id,
      type:'workstation',
      department:s.department,
      index,
      seat:{x:seat.x,z:seat.z,y:.535},
      approach,
      rotation:-r
    };
  });
  const shared=[
    ...plan.furniture.filter(f=>f.type==='meeting-chair').map((f,index)=>{
      const p=toWorld(f.x,f.y);
      return {
        id:'meeting-'+(index+1),
        type:'meeting',
        seat:{x:p.x,z:p.z,y:.535},
        approach:{x:p.x,z:p.z-.55},
        rotation:-(Number(f.rotationDeg||0)*Math.PI)/180
      };
    })
  ];
  return {stations,shared};
}

export function createOffice3Behavior({plan,toWorld}){
  const pois=buildOffice3POIs(plan,toWorld);
  const nodes=new Map();
  const edges=new Map();
  const spawn=toWorld(plan.navigation.spawn.x,plan.navigation.spawn.y);
  nodes.set(plan.navigation.spawn.id,{id:plan.navigation.spawn.id,x:spawn.x,z:spawn.z});
  plan.navigation.nodes.forEach(n=>{
    const p=toWorld(n.x,n.y);
    nodes.set(n.id,{id:n.id,x:p.x,z:p.z});
  });
  plan.navigation.routes.forEach(([a,b])=>{
    if(!edges.has(a))edges.set(a,new Set());
    if(!edges.has(b))edges.set(b,new Set());
    edges.get(a).add(b);
    edges.get(b).add(a);
  });
  const agents=new Map();

  function nearest(p){
    let id=null,best=Infinity;
    for(const n of nodes.values()){
      const d=dist(p,n);
      if(d<best){best=d;id=n.id;}
    }
    return id;
  }

  function route(a,b){
    const start=nearest(a),end=nearest(b);
    if(!start||!end)return [{x:b.x,z:b.z,kind:'direct'}];
    const open=[start],prev=new Map(),seen=new Set([start]);
    while(open.length){
      const cur=open.shift();
      if(cur===end)break;
      for(const n of edges.get(cur)||[]){
        if(!seen.has(n)){
          seen.add(n);
          prev.set(n,cur);
          open.push(n);
        }
      }
    }
    if(start!==end&&!prev.has(end))return [{x:b.x,z:b.z,kind:'direct'}];
    const ids=[end];
    let cur=end;
    while(cur!==start){
      cur=prev.get(cur);
      if(!cur)break;
      ids.unshift(cur);
    }
    return ids.map(id=>nodes.get(id)).concat([{x:b.x,z:b.z,kind:'poi-approach'}]);
  }

  function workstation(agent,index){
    const dept=stationDepartment(agent);
    const list=pois.stations.filter(p=>p.department===dept);
    if(!list.length)return pois.stations[index%pois.stations.length];
    const explicit=Number(agent?.meta?.seat_index);
    const slot=Number.isFinite(explicit)?explicit:index;
    return list[((slot%list.length)+list.length)%list.length];
  }

  function wantsDesk(agent){
    // Reserved agents stay visible in the diorama but must not simulate a real job.
    if(agent?.operational_enabled===false||agent?.roster_only)return false;
    const behavior=agent?.behavior||{};
    const animation=norm(behavior.animation);
    const mode=norm(behavior.mode);
    if(agent?.roster_only)return true;
    if(behavior.seat_lock===true)return true;
    if(Number(agent?.current_job_id||0)>0)return true;
    return mode==='working'||animation==='typing'||animation==='desk-review';
  }

  function setPath(a,points,state,targetState){
    a.path=points.filter(Boolean).map(p=>({...p}));
    a.pathIndex=0;
    a.state=state;
    a.targetState=targetState;
    a.seated=false;
  }

  function sync(snapshot={}){
    const rows=resolveOfficeRoster(snapshot);
    const ids=new Set();
    const deptIndex={};

    rows.forEach((row,index)=>{
      const id=String(row.id||row.agent_key||'');
      if(!id)return;
      ids.add(id);

      const dept=stationDepartment(row);
      const autoSlot=deptIndex[dept]||0;
      deptIndex[dept]=autoSlot+1;
      const poi=workstation(row,autoSlot);
      const shouldWork=wantsDesk(row);
      let a=agents.get(id);

      if(!a){
        a={
          id,
          position:{...poi.approach},
          path:[],
          pathIndex:0,
          state:'idle',
          targetState:'idle',
          seated:false,
          poi,
          rotation:poi.rotation,
          phase:index*.73
        };
        agents.set(id,a);
      }

      const poiChanged=a.poi?.id!==poi.id;
      a.poi=poi;
      a.jobId=Number(row.current_job_id||0);
      a.enabled=row.visual_enabled!==false;
      a.operationalEnabled=row.operational_enabled!==false;
      a.rosterOnly=Boolean(row.roster_only);
      a.status=String(row.status||'idle');
      a.animation=String(row?.behavior?.animation||'idle');
      a.name=String(row.name||id);
      a.role=String(row.role||'');
      a.department=dept;

      if(!a.enabled){
        a.state='hidden';
        a.path=[];
        a.seated=false;
        return;
      }

      if(shouldWork){
        if(
          poiChanged||
          !['working','walking-to-work','sitting-down'].includes(a.state)
        ){
          const points=route(a.position,poi.approach);
          points.push({...poi.seat,kind:'settle-seat'});
          setPath(a,points,'walking-to-work','working');
        }
      }else if(['working','sitting-down'].includes(a.state)||a.seated){
        a.path=[];
        a.pendingPath=[{...poi.approach,kind:'leave-seat'}];
        a.pathIndex=0;
        a.state='standing-up';
        a.targetState='idle';
        a.transition=.68;
        a.seated=true;
      }else if(a.state==='hidden'||a.state==='disabled'){
        a.position={...poi.approach};
        a.state='idle';
        a.seated=false;
      }
    });

    for(const [id,a] of agents){
      if(ids.has(id))continue;
      a.enabled=false;
      a.state='hidden';
      a.path=[];
      a.seated=false;
    }
  }

  function update(dt){
    const delta=Math.max(0,Math.min(.08,Number(dt)||0));
    for(const a of agents.values()){
      if(!a.enabled)continue;

      if(a.state==='sitting-down'){
        a.transition=Math.max(0,Number(a.transition||0)-delta);
        a.rotation=a.poi.rotation;
        if(a.transition<=0){
          a.state='working';
          a.seated=true;
        }
        continue;
      }

      if(a.state==='standing-up'){
        a.transition=Math.max(0,Number(a.transition||0)-delta);
        a.rotation=a.poi.rotation;
        if(a.transition<=0){
          a.seated=false;
          a.path=(a.pendingPath||[]).map(p=>({...p}));
          a.pendingPath=[];
          a.pathIndex=0;
          a.state='walking-to-idle';
        }
        continue;
      }

      if(!a.path.length)continue;
      const target=a.path[a.pathIndex];
      let dx=target.x-a.position.x;
      let dz=target.z-a.position.z;
      const d=Math.hypot(dx,dz);

      if(d<.045){
        a.position={x:target.x,z:target.z};
        a.pathIndex++;
        if(a.pathIndex>=a.path.length){
          a.path=[];
          if(a.targetState==='working'){
            a.state='sitting-down';
            a.transition=.92;
            a.seated=false;
            a.rotation=a.poi.rotation;
          }else{
            a.state=a.targetState||'idle';
            a.seated=false;
          }
        }
        continue;
      }

      dx/=d;
      dz/=d;
      const speed=a.state==='walking-to-work'?1.05:.92;
      const step=Math.min(d,speed*delta);
      a.position.x+=dx*step;
      a.position.z+=dz*step;
      a.rotation=Math.atan2(dx,dz);
      a.seated=false;
    }
  }

  return {
    version:OFFICE3_BEHAVIOR_VERSION,
    pois,
    sync,
    update,
    getAgent:id=>agents.get(String(id))||null,
    getAgents:()=>[...agents.values()],
    getRoster:snapshot=>resolveOfficeRoster(snapshot)
  };
}
