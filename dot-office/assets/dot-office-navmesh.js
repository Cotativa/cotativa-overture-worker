import * as THREE from 'three';
import {Pathfinding} from 'three-pathfinding';
import {OFFICE_MAP,OFFICE_MAP_VERSION} from './dot-office-map.js?v=4.17.0';

/**
 * Cotativa Office Engine 2 — NavMesh Adapter
 * Release: v4.17.0
 *
 * Runtime navigation uses three-pathfinding (MIT, Don McCurdy) over a navmesh
 * generated from the approved Cotativa office map. The old waypoint graph is
 * kept only as a simulation fallback.
 */

export const NAVMESH_ENGINE_VERSION='three-pathfinding-1.3.0';

function expandedRect(rect,padding=0){
  return {
    minX:Number(rect.x)-Number(rect.w)/2-padding,
    maxX:Number(rect.x)+Number(rect.w)/2+padding,
    minZ:Number(rect.z)-Number(rect.d)/2-padding,
    maxZ:Number(rect.z)+Number(rect.d)/2+padding
  };
}

function cellIntersectsRect(cx,cz,half,rect){
  return !(cx+half<=rect.minX||cx-half>=rect.maxX||cz+half<=rect.minZ||cz-half>=rect.maxZ);
}

function buildGridGeometry(){
  const cfg=OFFICE_MAP.navmesh||{};
  const cell=Math.max(.25,Number(cfg.cellSize||.45));
  const radius=Math.max(.12,Number(cfg.agentRadius||.26));
  const inset=Math.max(.15,Number(cfg.floorInset||.36));
  const floor=OFFICE_MAP.floor;
  const minX=Number(floor.x)-Number(floor.width)/2+inset;
  const maxX=Number(floor.x)+Number(floor.width)/2-inset;
  const minZ=Number(floor.z)-Number(floor.depth)/2+inset;
  const maxZ=Number(floor.z)+Number(floor.depth)/2-inset;
  const furniture=(OFFICE_MAP.navmeshBlockers?.length
    ?OFFICE_MAP.navmeshBlockers
    :(OFFICE_MAP.obstacles||[]));
  const barriers=(OFFICE_MAP.barriers||[]).filter(item=>item?.collision!==false);
  const blockers=[
    ...furniture,
    ...barriers
  ].map(item=>expandedRect(item,radius));

  const positions=[];
  const indices=[];
  let vertex=0;
  const half=cell/2;

  for(let z=minZ+half;z<=maxZ-half+1e-6;z+=cell){
    for(let x=minX+half;x<=maxX-half+1e-6;x+=cell){
      if(blockers.some(rect=>cellIntersectsRect(x,z,half,rect)))continue;

      positions.push(
        x-half,.02,z-half,
        x+half,.02,z-half,
        x+half,.02,z+half,
        x-half,.02,z+half
      );
      // Counter-clockwise when seen from above.
      indices.push(vertex,vertex+2,vertex+1,vertex,vertex+3,vertex+2);
      vertex+=4;
    }
  }

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

function closestPointOnGroup(pathfinding,zoneID,groupID,point){
  const zone=pathfinding.zones?.[zoneID];
  const group=zone?.groups?.[groupID];
  if(!zone||!group?.length)return point.clone();

  const triangle=new THREE.Triangle();
  const candidate=new THREE.Vector3();
  const best=new THREE.Vector3();
  const bestCentroid=new THREE.Vector3();
  let bestDistance=Infinity;

  for(const node of group){
    triangle.set(
      zone.vertices[node.vertexIds[0]],
      zone.vertices[node.vertexIds[1]],
      zone.vertices[node.vertexIds[2]]
    );
    triangle.closestPointToPoint(point,candidate);
    const distance=candidate.distanceToSquared(point);
    if(distance<bestDistance){
      bestDistance=distance;
      best.copy(candidate);
      bestCentroid.copy(node.centroid);
    }
  }
  // A tiny inward nudge avoids the point-in-polygon edge ambiguity used by
  // three-pathfinding when a projection lands exactly on a triangle border.
  return best.lerp(bestCentroid,1e-4);
}

export class CotativaNavMesh{
  constructor(){
    this.zoneID='cotativa-office';
    this.geometry=buildGridGeometry();
    this.pathfinding=new Pathfinding();
    const zone=Pathfinding.createZone(this.geometry,1e-3);
    this.pathfinding.setZoneData(this.zoneID,zone);
    this.zone=zone;
    this.primaryGroup=zone.groups
      .map((group,index)=>({index,size:group.length}))
      .sort((a,b)=>b.size-a.size)[0]?.index??0;
    this.stats={
      engine:NAVMESH_ENGINE_VERSION,
      map:OFFICE_MAP_VERSION,
      groups:zone.groups.length,
      polygons:zone.groups.reduce((n,g)=>n+g.length,0),
      cellSize:Number(OFFICE_MAP.navmesh?.cellSize||.45),
      agentRadius:Number(OFFICE_MAP.navmesh?.agentRadius||.26)
    };
  }

  project(point,groupID=this.primaryGroup){
    const p=new THREE.Vector3(Number(point?.x||0),.02,Number(point?.z||0));
    const detected=this.pathfinding.getGroup(this.zoneID,p,false);
    const group=Number.isInteger(detected)?detected:groupID;
    return {
      point:closestPointOnGroup(this.pathfinding,this.zoneID,group,p),
      group
    };
  }

  findPath(start,end){
    const startProjection=this.project(start);
    const endProjection=this.project(end,startProjection.group);
    const group=startProjection.group===endProjection.group
      ?startProjection.group
      :this.primaryGroup;

    const safeStart=group===startProjection.group
      ?startProjection.point
      :this.project(start,group).point;
    const safeEnd=group===endProjection.group
      ?endProjection.point
      :this.project(end,group).point;

    const path=this.pathfinding.findPath(safeStart,safeEnd,this.zoneID,group);
    if(!Array.isArray(path))return null;

    const points=[];
    if(Math.hypot(safeStart.x-Number(start?.x||0),safeStart.z-Number(start?.z||0))>.08){
      points.push({x:safeStart.x,z:safeStart.z,kind:'navmesh-rejoin'});
    }
    path.forEach(p=>points.push({x:p.x,z:p.z,kind:'navmesh'}));
    return points;
  }

  clampStep(start,end){
    const startProjection=this.project(start);
    const node=this.pathfinding.getClosestNode(
      startProjection.point,this.zoneID,startProjection.group,true
    );
    if(!node)return {x:startProjection.point.x,z:startProjection.point.z};

    const out=new THREE.Vector3();
    this.pathfinding.clampStep(
      startProjection.point,
      new THREE.Vector3(Number(end?.x||0),.02,Number(end?.z||0)),
      node,
      this.zoneID,
      startProjection.group,
      out
    );
    return {x:out.x,z:out.z};
  }

  createDebugMesh(){
    const material=new THREE.MeshBasicMaterial({
      color:0x37c9e8,
      transparent:true,
      opacity:.11,
      wireframe:false,
      depthWrite:false,
      side:THREE.DoubleSide
    });
    const mesh=new THREE.Mesh(this.geometry.clone(),material);
    mesh.position.y=.025;
    mesh.renderOrder=1;
    return mesh;
  }

  debug(){return {...this.stats};}
}

export function createCotativaNavMesh(){
  return new CotativaNavMesh();
}
