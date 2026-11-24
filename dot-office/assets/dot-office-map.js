/**
 * Cotativa DOT Office — Approved Navigation Map v1
 * Release: v4.17.0
 *
 * Single source of truth for the approved office layout/circulation.
 * Coordinates use the same X/Z world space as dot-office-living3d.js.
 * The measurements in meters are planning metadata for the approved map;
 * world coordinates remain renderer units.
 */

export const OFFICE_MAP_VERSION='approved-navigation-v2';

export const OFFICE_MAP={
  version:OFFICE_MAP_VERSION,
  scale:{
    mainCorridorMeters:1.2,
    sideCorridorMeters:1.2,
    accessCorridorMeters:[1.0,1.4],
    illustrative:true
  },
  navmesh:{
    engine:'three-pathfinding',
    cellSize:.45,
    agentRadius:.24,
    floorInset:.36,
    settling:true
  },
  floor:{width:27.1,depth:20.0,x:0,z:.2},
  spawn:'e1',
  nodes:{
    e1:{x:-11.85,z:7.10,zone:'entrance',label:'Entrada / spawn'},
    n1:{x:.10,z:-6.30,zone:'control',label:'Frente do painel · supervisão'},
    n2:{x:-5.20,z:-2.15,zone:'manager',label:'Acesso gerência'},
    n3:{x:1.45,z:-1.35,zone:'corridor',label:'Eixo central superior'},
    n4:{x:5.75,z:-2.05,zone:'social',label:'Acesso social'},
    n5:{x:-9.15,z:5.85,zone:'lounge',label:'Lounge / entrada'},
    n6:{x:-5.25,z:4.25,zone:'seo',label:'Acesso SEO'},
    n7:{x:2.00,z:3.00,zone:'corridor',label:'Centro principal'},
    n8:{x:-3.55,z:4.45,zone:'operations',label:'Acesso operações'},
    n9:{x:7.15,z:1.25,zone:'content',label:'Acesso conteúdo'},
    n10:{x:5.15,z:3.10,zone:'corridor',label:'Conexão central'},
    n11:{x:-1.15,z:5.75,zone:'corridor',label:'Eixo central inferior'},
    n12:{x:2.15,z:5.85,zone:'engineering',label:'Acesso engenharia'},
    n13:{x:6.25,z:-1.80,zone:'corridor',label:'Conexão Social / Conteúdo'},
    n14:{x:7.25,z:3.15,zone:'content',label:'Corredor conteúdo'},
    n15:{x:7.75,z:6.45,zone:'meeting',label:'Acesso reunião'},
    n16:{x:9.65,z:6.45,zone:'meeting',label:'Mesa de reunião'},
    n17:{x:5.25,z:6.50,zone:'corridor',label:'Corredor inferior'},
    n18:{x:-6.85,z:5.80,zone:'corridor',label:'Conexão lounge'},
    n19:{x:-10.45,z:6.55,zone:'entrance',label:'Acesso entrada'},
    n20:{x:-1.10,z:-3.10,zone:'control',label:'Conexão supervisão'}
  },
  edges:[
    ['e1','n19'],['n19','n5'],['n5','n18'],['n18','n6'],['n6','n8'],
    ['n8','n11'],['n11','n12'],['n12','n17'],['n17','n15'],['n15','n16'],
    ['n12','n7'],['n7','n10'],['n10','n14'],['n14','n15'],['n14','n9'],
    ['n9','n13'],['n13','n4'],['n4','n3'],['n3','n20'],['n20','n2'],
    ['n20','n1'],['n2','n18'],['n3','n7'],['n8','n7'],['n10','n17'],
    ['n9','n10']
  ],
  stationApproach:{
    manager:'n2',
    operations:'n8',
    social:'n4',
    content:'n9',
    seo:'n6',
    engineering:'n12'
  },
  workstationApproach:{
    manager:['n2'],
    operations:['n8','n7','n7'],
    social:['n4','n4'],
    content:['n9','n13','n14'],
    seo:['n6','n6','n18'],
    engineering:['n12','n17']
  },
  sharedApproach:{
    meeting:'n15',
    lounge:'n5',
    coffee:'n16',
    control:'n1'
  },
  zones:[
    {id:'manager',label:'Gerência',x:-9.15,z:-5.20,w:5.80,d:4.80,tone:'supervision'},
    {id:'control',label:'Supervisão / TV',x:.10,z:-6.30,w:5.10,d:2.20,tone:'supervision'},
    {id:'social',label:'Social',x:4.45,z:-4.70,w:5.00,d:4.20,tone:'work'},
    {id:'content',label:'Conteúdo',x:9.55,z:-.65,w:4.50,d:4.10,tone:'work'},
    {id:'seo',label:'SEO & Google',x:-7.35,z:3.15,w:5.50,d:4.20,tone:'work'},
    {id:'operations',label:'Operações',x:-.55,z:2.00,w:6.30,d:5.10,tone:'work'},
    {id:'engineering',label:'Engenharia',x:5.10,z:4.55,w:6.00,d:4.60,tone:'work'},
    {id:'entrance',label:'Entrada / Recepção',x:-11.15,z:6.95,w:3.40,d:2.40,tone:'shared'},
    {id:'lounge',label:'Lounge',x:-9.95,z:5.75,w:4.20,d:3.20,tone:'shared'},
    {id:'meeting',label:'Mesa de reunião',x:9.50,z:6.15,w:4.10,d:3.00,tone:'shared'}
  ],
  obstacles:[
    {id:'manager-fixed',x:-9.25,z:-5.55,w:3.10,d:1.75,label:'Mesa gerência'},
    {id:'operations-island',x:-.10,z:1.45,w:7.25,d:2.45,label:'Ilha Operações'},
    {id:'social-island',x:4.95,z:-5.05,w:5.10,d:2.10,label:'Ilha Social'},
    {id:'content-island',x:9.25,z:-.15,w:4.90,d:2.70,label:'Ilha Conteúdo'},
    {id:'seo-island',x:-7.45,z:2.95,w:5.80,d:2.70,label:'Ilha SEO'},
    {id:'engineering-island',x:4.85,z:4.55,w:5.20,d:2.30,label:'Ilha Engenharia'},
    {id:'server-rack',x:7.55,z:4.95,w:2.10,d:2.20,label:'Rack / infraestrutura'},
    {id:'tv-console',x:.10,z:-8.05,w:8.70,d:1.05,label:'TV / console'},
    {id:'lounge-sofa',x:-10.20,z:5.55,w:2.90,d:1.45,label:'Sofá lounge'},
    {id:'meeting-table',x:9.60,z:6.10,w:3.80,d:1.10,label:'Mesa de reunião'},
    {id:'planning-board',x:10.25,z:-5.65,w:4.10,d:.24,label:'Planejamento'}
  ],
  barriers:[
    // Gerência: glass enclosure with a real door gap on the east side.
    {id:'manager-glass-south',x:-6.20,z:-6.22,w:.16,d:3.62,h:3.0,label:'Vidro Gerência sul'},
    {id:'manager-glass-north',x:-6.20,z:-2.56,w:.16,d:.46,h:3.0,label:'Vidro Gerência norte'},
    {id:'manager-glass-top',x:-9.18,z:-2.55,w:5.95,d:.16,h:3.0,label:'Vidro Gerência superior'},

    // Social and Conteúdo keep their open-end access, matching the approved map.
    {id:'social-glass',x:6.95,z:-4.75,w:.16,d:5.0,h:2.5,label:'Vidro Social'},
    {id:'content-glass',x:7.05,z:-.38,w:4.10,d:.16,h:2.45,label:'Vidro Conteúdo',collision:false},

    // Engineering and SEO now have explicit door gaps in the collision geometry.
    {id:'engineering-glass-low',x:2.12,z:3.20,w:.16,d:3.40,h:2.45,label:'Vidro Engenharia inferior'},
    {id:'engineering-glass-high',x:2.12,z:6.30,w:.16,d:.40,h:2.45,label:'Vidro Engenharia superior'},
    {id:'seo-glass-low',x:-4.48,z:2.35,w:.16,d:2.60,h:2.45,label:'Vidro SEO inferior'},
    {id:'seo-glass-high',x:-4.48,z:5.55,w:.16,d:1.40,h:2.45,label:'Vidro SEO superior'}
  ],
  navmeshBlockers:[
    {id:'desk-manager',x:-9.20,z:-5.55,w:2.30,d:1.00},
    {id:'desk-operations-1',x:-2.45,z:1.35,w:2.30,d:1.00},
    {id:'desk-operations-2',x:-.05,z:1.35,w:2.30,d:1.00},
    {id:'desk-operations-3',x:2.35,z:1.35,w:2.30,d:1.00},
    {id:'desk-social-1',x:3.65,z:-5.05,w:2.30,d:1.00},
    {id:'desk-social-2',x:5.85,z:-5.05,w:2.30,d:1.00},
    {id:'desk-content-1',x:8.05,z:-1.00,w:2.30,d:1.00},
    {id:'desk-content-2',x:10.15,z:-1.00,w:2.30,d:1.00},
    {id:'desk-content-3',x:9.10,z:1.05,w:2.30,d:1.00},
    {id:'desk-seo-1',x:-9.10,z:2.70,w:2.30,d:1.00},
    {id:'desk-seo-2',x:-7.10,z:2.70,w:2.30,d:1.00},
    {id:'desk-seo-3',x:-5.10,z:2.70,w:2.30,d:1.00},
    {id:'desk-engineering-1',x:3.75,z:4.35,w:2.30,d:1.00},
    {id:'desk-engineering-2',x:6.05,z:4.35,w:2.30,d:1.00},
    {id:'server-rack-a',x:7.50,z:5.45,w:.95,d:.88},
    {id:'server-rack-b',x:8.55,z:5.45,w:.95,d:.88},
    {id:'lounge-sofa',x:-10.20,z:5.55,w:2.35,d:1.00},
    {id:'lounge-table',x:-8.55,z:5.65,w:1.15,d:.85},
    {id:'meeting-table',x:9.60,z:6.10,w:3.60,d:1.10},
    {id:'planning-board',x:10.25,z:-5.65,w:4.10,d:.20},
    {id:'manager-bookcase',x:-11.70,z:-6.05,w:.75,d:1.65},
    {id:'content-bookcase',x:11.60,z:-3.00,w:.75,d:1.65}
  ]
};

export function officeMapNode(id){
  return OFFICE_MAP.nodes[String(id||'')]||null;
}

export function officeMapWorkstationApproach(station,index=0){
  const list=OFFICE_MAP.workstationApproach[String(station||'')]||[];
  return list[Math.max(0,Math.min(list.length-1,Number(index)||0))]
    || OFFICE_MAP.stationApproach[String(station||'')]
    || 'n7';
}

export function officeMapEdges(){
  return OFFICE_MAP.edges.map(([a,b])=>({
    a,b,from:OFFICE_MAP.nodes[a],to:OFFICE_MAP.nodes[b]
  })).filter(edge=>edge.from&&edge.to);
}
