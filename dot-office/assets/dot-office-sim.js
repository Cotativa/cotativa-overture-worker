import {OFFICE_MAP,OFFICE_MAP_VERSION} from './dot-office-map.js?v=4.17.0';
import {DOT_DUTY,resolveDotDuty} from './dot-office-duty.js?v=4.17.0';

/**
 * Cotativa DOT Office Simulation Engine v3.0
 * Release: v4.17.0
 *
 * Pure state/navigation layer. No rendering dependencies.
 * Goals:
 * - Real jobs interrupt idle activity and send the responsible DOT to its desk.
 * - Runtime movement uses an injected navmesh route provider; graph routing remains fallback-only.
 * - Seats/meeting/lounge/coffee resources are reservable.
 * - Idle agents can naturally meet, take a short break or return to their desk.
 * - Meetings are interrupted immediately when a participant receives work.
 */

export const SIM_STATE=Object.freeze({
  BOOT:'boot',
  IDLE:'idle',
  WALKING:'walking',
  GOING_TO_WORK:'going_to_work',
  WORKING:'working',
  GOING_TO_MEETING:'going_to_meeting',
  MEETING:'meeting',
  GOING_TO_BREAK:'going_to_break',
  BREAK:'break',
  SUPERVISING:'supervising',
  WAITING:'waiting',
  RESERVED:'reserved'
});

const DEFAULT_GRAPH={
  nodes:OFFICE_MAP.nodes,
  edges:OFFICE_MAP.edges
};

const STATION_APPROACH=OFFICE_MAP.stationApproach;

function dist(a,b){return Math.hypot((a.x||0)-(b.x||0),(a.z||0)-(b.z||0));}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function stableHash(value){
  const s=String(value||'');
  let h=2166136261;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function seededUnit(value){return (stableHash(value)%10000)/10000;}
function clonePoint(p){return {x:Number(p?.x||0),z:Number(p?.z||0)};}

class ResourcePool{
  constructor(){this.resources=new Map();}
  define(id,{pointId,type='generic',capacity=1,station=null,meta={}}={}){
    this.resources.set(id,{id,pointId,type,capacity,station,meta,owners:new Set()});
    return this.resources.get(id);
  }
  get(id){return this.resources.get(id)||null;}
  reserve(id,agentId){
    const r=this.resources.get(id);if(!r)return false;
    if(r.owners.has(agentId))return true;
    if(r.owners.size>=r.capacity)return false;
    r.owners.add(agentId);return true;
  }
  release(id,agentId){const r=this.resources.get(id);if(r)r.owners.delete(agentId);}
  releaseAll(agentId){for(const r of this.resources.values())r.owners.delete(agentId);}
  available(type){
    return [...this.resources.values()].filter(r=>r.type===type&&r.owners.size<r.capacity);
  }
  snapshot(){
    return [...this.resources.values()].map(r=>({
      id:r.id,type:r.type,station:r.station,capacity:r.capacity,occupied:r.owners.size,owners:[...r.owners]
    }));
  }
}

export class OfficeSimulation{
  constructor({graph=DEFAULT_GRAPH,routeProvider=null,now=()=>performance.now()}={}){
    this.now=now;
    this.routeProvider=typeof routeProvider==='function'?routeProvider:null;
    this.navigationEngine=this.routeProvider?'navmesh':'graph-fallback';
    this.nodes=new Map();
    this.adj=new Map();
    this.resources=new ResourcePool();
    this.agents=new Map();
    this.backend=new Map();
    this.lastSnapshot=null;
    this.meeting=null;
    this.meetingSerial=0;
    this.lastMeetingAt=-Infinity;
    this.meetingCooldownMs=60000;
    this.meetingMinIdleMs=12000;
    this.defaultMeetingMs=24000;
    this.breakMs=18000;
    this.idleDecisionMs=22000;
    this.registerGraph(graph);
  }

  registerGraph(graph){
    for(const [id,p] of Object.entries(graph?.nodes||{}))this.registerPoint(id,p);
    for(const pair of graph?.edges||[])this.connect(pair[0],pair[1]);
  }

  registerPoint(id,point){
    const p={id,x:Number(point?.x||0),z:Number(point?.z||0),zone:String(point?.zone||'')};
    this.nodes.set(id,p);if(!this.adj.has(id))this.adj.set(id,new Set());return p;
  }

  connect(a,b){
    if(!this.nodes.has(a)||!this.nodes.has(b))return false;
    if(!this.adj.has(a))this.adj.set(a,new Set());
    if(!this.adj.has(b))this.adj.set(b,new Set());
    this.adj.get(a).add(b);this.adj.get(b).add(a);return true;
  }

  setRouteProvider(provider,name='navmesh'){
    this.routeProvider=typeof provider==='function'?provider:null;
    this.navigationEngine=this.routeProvider?String(name||'navmesh'):'graph-fallback';
    return this;
  }

  defineWorkstation(station,seat,{approach=STATION_APPROACH[station]||'n7',facing=Math.PI}={}){
    const pointId='seat_'+station;
    this.registerPoint(pointId,{...seat,zone:station});
    this.connect(approach,pointId);
    this.resources.define('work:'+station,{pointId,type:'workstation',capacity:1,station,meta:{facing,approach}});
    return pointId;
  }

  defineAgentWorkstation(agentId,station,seat,{approach=STATION_APPROACH[station]||'n7',facing=Math.PI}={}){
    agentId=String(agentId||'').trim();
    if(!agentId)return null;
    const safe=agentId.replace(/[^a-z0-9_-]+/gi,'_');
    const pointId='seat_agent_'+safe;
    this.registerPoint(pointId,{...seat,zone:station});
    this.connect(approach,pointId);
    this.resources.define('work:'+agentId,{
      pointId,type:'workstation',capacity:1,station,
      meta:{facing,agentId,approach}
    });
    return pointId;
  }

  defineMeetingSeat(id,point,{approach=OFFICE_MAP.sharedApproach.meeting,facing=Math.PI}={}){
    const pointId='meeting_'+id;
    this.registerPoint(pointId,{...point,zone:'meeting'});
    this.connect(approach,pointId);
    this.resources.define('meeting:'+id,{pointId,type:'meeting',capacity:1,meta:{facing,approach}});
  }

  defineLounge(id,point,{approach=OFFICE_MAP.sharedApproach.lounge,facing=0}={}){
    const pointId='lounge_'+id;
    this.registerPoint(pointId,{...point,zone:'lounge'});
    this.connect(approach,pointId);
    this.resources.define('lounge:'+id,{pointId,type:'lounge',capacity:1,meta:{facing,approach}});
  }

  defineCoffee(point,{approach=OFFICE_MAP.sharedApproach.coffee}={}){
    const pointId='coffee_point';
    this.registerPoint(pointId,{...point,zone:'coffee'});
    this.connect(approach,pointId);
    this.resources.define('coffee',{pointId,type:'coffee',capacity:1,meta:{facing:-Math.PI/2,approach}});
  }

  defineManagerControl(point,{approach=OFFICE_MAP.sharedApproach.control}={}){
    const pointId='manager_control';
    this.registerPoint(pointId,{...point,zone:'control'});
    this.connect(approach,pointId);
    this.resources.define('manager:control',{pointId,type:'control',capacity:1,station:'manager',meta:{facing:Math.PI,approach}});
  }

  registerAgent({id,name='',station='operations',position=null,enabled=true,speed=1.10}={}){
    if(!id)return null;
    const start=position?clonePoint(position):clonePoint(this.nodes.get(OFFICE_MAP.spawn));
    const lane=(seededUnit(id)-.5)*.16;
    const agent={
      id:String(id),name:String(name||id),station:String(station||'operations'),
      enabled:enabled!==false,state:enabled===false?SIM_STATE.RESERVED:SIM_STATE.BOOT,
      animation:enabled===false?'none':'idle',position:start,rotation:0,speed:Number(speed||1.10),
      path:[],pathIndex:0,targetPoint:null,targetResource:null,activity:null,
      idleSince:this.now(),stateSince:this.now(),activityUntil:0,jobId:0,jobStatus:'idle',
      queueDepth:0,laneOffset:lane,visible:enabled!==false,seated:false,meetingId:null,duty:enabled===false?DOT_DUTY.DISABLED:DOT_DUTY.IDLE
    };
    this.agents.set(agent.id,agent);return agent;
  }

  unregisterAgent(id){
    const a=this.agents.get(id);if(!a)return;
    this.resources.releaseAll(id);this.agents.delete(id);this.backend.delete(id);
  }

  _setState(a,state,animation=state){
    if(a.state!==state){a.state=state;a.stateSince=this.now();}
    a.animation=animation;
  }

  _nearestNode(position){
    let best=null,bestD=Infinity;
    for(const n of this.nodes.values()){
      const d=dist(position,n);if(d<bestD){best=n;bestD=d;}
    }
    return best?.id||OFFICE_MAP.spawn;
  }

  findPath(fromId,toId){
    if(fromId===toId)return [fromId];
    if(!this.nodes.has(fromId)||!this.nodes.has(toId))return [];
    const q=new Set(this.nodes.keys()),score=new Map(),prev=new Map();
    for(const id of q)score.set(id,Infinity);
    score.set(fromId,0);
    while(q.size){
      let current=null,best=Infinity;
      for(const id of q){const s=score.get(id);if(s<best){best=s;current=id;}}
      if(current===null||best===Infinity)break;
      q.delete(current);if(current===toId)break;
      for(const next of this.adj.get(current)||[]){
        if(!q.has(next))continue;
        const alt=best+dist(this.nodes.get(current),this.nodes.get(next));
        if(alt<score.get(next)){score.set(next,alt);prev.set(next,current);}
      }
    }
    if(!prev.has(toId))return [];
    const out=[toId];let cur=toId;
    while(cur!==fromId){cur=prev.get(cur);if(!cur)return [];out.unshift(cur);}
    return out;
  }

  routeAgent(id,targetPoint,{state=SIM_STATE.WALKING,animation='walk',resourceId=null,activity=null}={}){
    const a=this.agents.get(id);if(!a||!a.enabled||!this.nodes.has(targetPoint))return false;
    if(resourceId&&!this.resources.reserve(resourceId,id))return false;

    const previousResource=a.targetResource?this.resources.get(a.targetResource):null;
    if(a.targetResource&&a.targetResource!==resourceId)this.resources.release(a.targetResource,id);

    const resource=resourceId?this.resources.get(resourceId):null;
    const target=this.nodes.get(targetPoint);
    const approachId=String(resource?.meta?.approach||targetPoint);
    const approach=this.nodes.get(approachId)||target;
    const exitSteps=[];

    // Leaving a chair starts by backing out to its registered approach point.
    // This mirrors the "settling" idea used by mature virtual-office engines:
    // furniture is ignored only for the tiny seat<->approach transition.
    if(a.seated&&previousResource?.meta?.approach){
      const exitPoint=this.nodes.get(String(previousResource.meta.approach));
      if(exitPoint&&dist(a.position,exitPoint)>.08){
        exitSteps.push({x:exitPoint.x,z:exitPoint.z,kind:'settle-exit'});
      }
    }

    let path=[...exitSteps];
    let navigationResolved=false;
    const navigationStart=exitSteps.length?exitSteps[exitSteps.length-1]:a.position;

    if(this.routeProvider&&approach){
      try{
        const routed=this.routeProvider({
          agentId:a.id,
          station:a.station,
          start:{x:navigationStart.x,z:navigationStart.z},
          end:{x:approach.x,z:approach.z},
          activity,
          resourceId
        });
        if(Array.isArray(routed)&&routed.length){
          path.push(...routed.map(p=>({x:Number(p.x),z:Number(p.z),kind:String(p.kind||'navmesh')})));
          navigationResolved=true;
        }else if(dist(navigationStart,approach)<=.10){
          navigationResolved=true;
        }
      }catch(_){
        navigationResolved=false;
      }
    }

    // Safe fallback for CI/older browsers: the approved graph, never a direct
    // diagonal shortcut through furniture.
    if(!navigationResolved&&dist(navigationStart,approach)>.10){
      const from=this._nearestNode(navigationStart);
      let fallback=this.findPath(from,approachId);
      if(!fallback.length&&from!==approachId){
        if(resourceId)this.resources.release(resourceId,id);
        return false;
      }
      const rejoin=this.nodes.get(from);
      if(fallback[0]===from&&rejoin&&dist(navigationStart,rejoin)<=.12)fallback=fallback.slice(1);
      path=[...exitSteps,...fallback];
      this.navigationEngine=this.routeProvider?this.navigationEngine:'graph-fallback';
      navigationResolved=true;
    }

    if(approachId!==targetPoint){
      path.push({x:target.x,z:target.z,kind:'settle-enter'});
    }

    a.path=path;a.pathIndex=0;a.targetPoint=targetPoint;a.targetResource=resourceId||null;a.activity=activity;
    a.seated=false;this._setState(a,state,animation);return true;
  }

  _arrive(a){
    const node=this.nodes.get(a.targetPoint);
    if(node){a.position.x=node.x;a.position.z=node.z;}
    const resource=a.targetResource?this.resources.get(a.targetResource):null;
    const type=resource?.type||'';
    if(Number.isFinite(resource?.meta?.facing))a.rotation=Number(resource.meta.facing);
    if(type==='workstation'){
      a.seated=true;
      this._setState(a,SIM_STATE.WORKING,a.jobId>0?'typing':'desk-idle');
      a.idleSince=this.now();
    }else if(type==='meeting'){
      a.seated=true;a.meetingId=this.meeting?.id||null;
      this._setState(a,SIM_STATE.MEETING,'meeting');
    }else if(type==='lounge'||type==='coffee'){
      a.seated=type==='lounge';
      a.activityUntil=this.now()+this.breakMs;
      this._setState(a,SIM_STATE.BREAK,type==='coffee'?'coffee':'lounge');
    }else if(type==='control'){
      this._setState(a,SIM_STATE.SUPERVISING,'review');
    }else{
      a.seated=false;this._setState(a,SIM_STATE.IDLE,'idle');a.idleSince=this.now();
    }
    a.path=[];a.pathIndex=0;
  }

  _moveAgent(a,dt){
    if(!a.path.length){this._arrive(a);return;}
    const nextStep=a.path[a.pathIndex];
    const target=typeof nextStep==='string'?this.nodes.get(nextStep):nextStep;
    if(!target){a.pathIndex++;return;}

    let dx=target.x-a.position.x,dz=target.z-a.position.z;
    const d=Math.hypot(dx,dz);
    if(d<.10){
      a.position.x=target.x;a.position.z=target.z;a.pathIndex++;
      if(a.pathIndex>=a.path.length)this._arrive(a);
      return;
    }
    dx/=d;dz/=d;

    // Small personal-lane offset plus proximity braking keeps agents from
    // visually stacking while preserving the safe graph corridor.
    const px=-dz*a.laneOffset,pz=dx*a.laneOffset;
    let braking=1;
    for(const other of this.agents.values()){
      if(other.id===a.id||!other.visible)continue;
      const od=dist(a.position,other.position);
      if(od<.52){
        // Deterministic right-of-way prevents two agents from freezing each
        // other when they meet in a narrow corridor.
        braking=stableHash(a.id)>stableHash(other.id)?.08:.72;
        if(braking<.1)break;
      }else if(od<.82)braking=Math.min(braking,.48);
    }
    const step=Math.min(d,a.speed*braking*dt);
    a.position.x+=dx*step+px*Math.min(.25,dt);
    a.position.z+=dz*step+pz*Math.min(.25,dt);
    a.rotation=Math.atan2(dx,dz);
  }

  _jobTarget(a){
    const personal='work:'+a.id;
    if(this.resources.get(personal))return personal;
    return 'work:'+a.station;
  }

  _goToWork(a){
    const resId=this._jobTarget(a),res=this.resources.get(resId);
    if(!res)return false;
    return this.routeAgent(a.id,res.pointId,{
      state:SIM_STATE.GOING_TO_WORK,animation:'walk',resourceId:resId,activity:'work'
    });
  }

  _goHomeIdle(a){
    const resId=this._jobTarget(a),res=this.resources.get(resId);
    if(res&&this.routeAgent(a.id,res.pointId,{
      state:SIM_STATE.WALKING,animation:'walk',resourceId:resId,activity:'desk-idle'
    }))return true;
    return this.routeAgent(a.id,STATION_APPROACH[a.station]||'n7',{state:SIM_STATE.WALKING,activity:'idle'});
  }

  _cancelActivity(a){
    if(a.targetResource)this.resources.release(a.targetResource,a.id);
    if(a.meetingId&&this.meeting?.id===a.meetingId){
      this.meeting.participants=this.meeting.participants.filter(id=>id!==a.id);
      if(this.meeting.participants.length<2)this.meeting.until=Math.min(this.meeting.until,this.now()+750);
    }
    a.targetResource=null;a.targetPoint=null;a.activity=null;a.activityUntil=0;a.meetingId=null;
    a.path=[];a.pathIndex=0;a.seated=false;
  }

  _pickIdleBreak(a){
    const turn=Math.floor((this.now()-a.idleSince)/this.idleDecisionMs)+stableHash(a.id);
    const preferCoffee=turn%3===0;
    const list=preferCoffee?['coffee','lounge']:['lounge','coffee'];
    for(const type of list){
      const options=this.resources.available(type);
      if(!options.length)continue;
      const idx=stableHash(a.id+':'+turn)%options.length;
      const res=options[idx];
      if(this.routeAgent(a.id,res.pointId,{
        state:SIM_STATE.GOING_TO_BREAK,animation:'walk',resourceId:res.id,activity:type
      }))return true;
    }
    return this._goHomeIdle(a);
  }

  _endBreak(a){
    if(a.targetResource)this.resources.release(a.targetResource,a.id);
    a.targetResource=null;a.activity=null;a.activityUntil=0;a.seated=false;a.idleSince=this.now();
    this._goHomeIdle(a);
  }

  _eligibleForMeeting(){
    const now=this.now();
    return [...this.agents.values()].filter(a=>
      a.enabled&&a.id!=='dot-manager'&&a.jobId===0&&
      [SIM_STATE.IDLE,SIM_STATE.BREAK,SIM_STATE.WORKING].includes(a.state)&&
      (a.state!==SIM_STATE.WORKING||a.animation==='desk-idle')&&
      now-a.idleSince>=this.meetingMinIdleMs
    );
  }

  _maybeStartMeeting(){
    const now=this.now();
    if(this.meeting||now-this.lastMeetingAt<this.meetingCooldownMs)return;
    const candidates=this._eligibleForMeeting();
    const seats=this.resources.available('meeting');
    if(candidates.length<2||seats.length<2)return;
    candidates.sort((a,b)=>stableHash(a.id+this.meetingSerial)-stableHash(b.id+this.meetingSerial));
    const count=Math.min(3,candidates.length,seats.length);
    const chosen=candidates.slice(0,count);
    const id='meeting-'+(++this.meetingSerial);
    const until=now+this.defaultMeetingMs;
    this.meeting={id,participants:chosen.map(a=>a.id),until};
    this.lastMeetingAt=now;
    chosen.forEach((a,i)=>{
      this._cancelActivity(a);
      const seat=seats[i];
      a.meetingId=id;
      this.routeAgent(a.id,seat.pointId,{
        state:SIM_STATE.GOING_TO_MEETING,animation:'walk',resourceId:seat.id,activity:'meeting'
      });
    });
  }

  _endMeeting(){
    if(!this.meeting)return;
    for(const id of this.meeting.participants){
      const a=this.agents.get(id);if(!a)continue;
      if(a.targetResource)this.resources.release(a.targetResource,id);
      a.targetResource=null;a.meetingId=null;a.seated=false;a.idleSince=this.now();
      if(a.jobId>0)this._goToWork(a);else this._goHomeIdle(a);
    }
    this.meeting=null;
  }

  syncSnapshot(snapshot){
    this.lastSnapshot=snapshot||{};
    const rows=Array.isArray(snapshot?.agents)?snapshot.agents:[];
    const seen=new Set();

    for(const row of rows){
      const id=String(row?.id||row?.agent_key||'');if(!id)continue;
      seen.add(id);
      let a=this.agents.get(id);
      if(!a){
        a=this.registerAgent({
          id,name:row?.name||id,station:row?.station||'operations',
          enabled:row?.enabled!==false,position:this.nodes.get(OFFICE_MAP.spawn)
        });
      }
      a.name=String(row?.name||a.name);a.station=String(row?.station||a.station);
      a.enabled=row?.enabled!==false;a.visible=a.enabled;
      a.queueDepth=Number(row?.queue_depth||0);
      const nextJob=Number(row?.current_job_id||0);
      const nextStatus=String(row?.job_status||row?.status||'idle');
      this.backend.set(id,row);

      if(!a.enabled){
        this._cancelActivity(a);a.jobId=0;a.jobStatus='reserved';a.visible=false;
        this._setState(a,SIM_STATE.RESERVED,'none');continue;
      }

      const jobChanged=nextJob!==a.jobId;
      a.jobId=nextJob;a.jobStatus=nextStatus;
      const supervisorBusy=Number(snapshot?.metrics?.owned_jobs||0)>0||
        Number(snapshot?.metrics?.needs_user||0)>0||
        Number(snapshot?.metrics?.pending||0)>0||
        Number(snapshot?.metrics?.retry||0)>0;
      a.duty=resolveDotDuty({
        enabled:a.enabled,
        isManager:id==='dot-manager',
        supervisorBusy,
        jobId:nextJob,
        jobStatus:nextStatus,
        queueDepth:a.queueDepth,
        meeting:a.meetingId&&this.meeting?.id===a.meetingId
      });

      if(id==='dot-manager'){
        const busy=a.duty===DOT_DUTY.SUPERVISE;
        if(busy){
          if(a.state!==SIM_STATE.SUPERVISING&&a.activity!=='supervise'){
            this._cancelActivity(a);
            const res=this.resources.get('manager:control');
            if(res)this.routeAgent(id,res.pointId,{state:SIM_STATE.WALKING,animation:'walk',resourceId:res.id,activity:'supervise'});
          }
        }else if(jobChanged||[SIM_STATE.BOOT,SIM_STATE.SUPERVISING].includes(a.state)){
          this._cancelActivity(a);a.idleSince=this.now();this._goHomeIdle(a);
        }
        continue;
      }

      if(nextJob>0){
        if(jobChanged||![SIM_STATE.GOING_TO_WORK,SIM_STATE.WORKING].includes(a.state)){
          this._cancelActivity(a);this._goToWork(a);
        }else if(a.state===SIM_STATE.WORKING){
          a.animation=nextStatus==='processing'?'typing':'desk-review';
        }
      }else if(jobChanged||a.state===SIM_STATE.BOOT){
        this._cancelActivity(a);a.idleSince=this.now();this._goHomeIdle(a);
      }
    }

    for(const [id,a] of this.agents){
      if(!seen.has(id)&&id!=='dot-manager'){
        a.visible=false;this.resources.releaseAll(id);
      }
    }
  }

  update(dt){
    dt=clamp(Number(dt||0),0,.10);
    const now=this.now();

    if(this.meeting&&now>=this.meeting.until)this._endMeeting();

    // Group activity has priority over individual coffee/lounge wandering.
    // This creates natural "we are idle, let's meet" behavior instead of
    // sending everyone to a break before a meeting can form.
    this._maybeStartMeeting();

    for(const a of this.agents.values()){
      if(!a.enabled||!a.visible)continue;

      if([SIM_STATE.WALKING,SIM_STATE.GOING_TO_WORK,SIM_STATE.GOING_TO_MEETING,SIM_STATE.GOING_TO_BREAK].includes(a.state)){
        this._moveAgent(a,dt);continue;
      }

      if(a.state===SIM_STATE.BREAK&&now>=a.activityUntil){this._endBreak(a);continue;}

      if(a.id==='dot-manager'){
        if(a.state===SIM_STATE.WORKING&&a.animation==='desk-idle'&&now-a.idleSince>this.idleDecisionMs*2){
          this._pickIdleBreak(a);
        }
        continue;
      }

      if(a.jobId>0){
        if(a.state!==SIM_STATE.WORKING)this._goToWork(a);
        continue;
      }

      if(a.state===SIM_STATE.MEETING)continue;

      if(a.state===SIM_STATE.WORKING&&a.animation==='desk-idle'&&now-a.idleSince>this.idleDecisionMs){
        this._pickIdleBreak(a);continue;
      }

      if(a.state===SIM_STATE.IDLE&&now-a.idleSince>this.idleDecisionMs)this._pickIdleBreak(a);
    }

  }

  getAgent(id){const a=this.agents.get(id);return a?{...a,position:{...a.position},path:[...a.path]}:null;}
  getAgents(){return [...this.agents.values()].map(a=>this.getAgent(a.id));}
  debug(){
    return {
      version:'3.0',
      mapVersion:OFFICE_MAP_VERSION,
      navigationEngine:this.navigationEngine,
      circulationNodes:Object.keys(OFFICE_MAP.nodes).length,
      circulationEdges:OFFICE_MAP.edges.length,
      meeting:this.meeting?{...this.meeting}:null,
      agents:this.getAgents().map(a=>({
        id:a.id,station:a.station,state:a.state,duty:a.duty,animation:a.animation,jobId:a.jobId,
        target:a.targetPoint,resource:a.targetResource,position:a.position
      })),
      resources:this.resources.snapshot()
    };
  }
}

export function createOfficeSimulation(options={}){return new OfficeSimulation(options);}
