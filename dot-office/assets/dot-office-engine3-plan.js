/**
 * Cotativa Office Engine 3 — Delegation Spatial World
 * Release: v4.29.48 — Premium Diorama
 * One metric world: architecture, work POIs and navigation share coordinates.
 */
export const OFFICE3_PLAN_VERSION='cotativa-diorama-world-v3.0';

export const OFFICE3_PLAN={
  version:3,name:'Cotativa — Premium Miniature Office',units:'mm',source:'approved-cotativa-office-project+delegation-spatial-architecture',
  site:{width:18000,depth:12500,boundary:[{x:0,y:0},{x:18000,y:0},{x:18000,y:12500},{x:0,y:12500}]},
  palette:{background:'#f0ebe2',wall:'#f5eee4',wallWarm:'#ece0d2',glass:'#c6e3e5',frame:'#78949e',floor:'#e9dfcf',floorAlt:'#f0e9dc',wood:'#c89067',woodDark:'#855d43',metal:'#566b77',cyan:'#49a8c3',teal:'#48b49c',amber:'#dfaa72',blue:'#7099d6',green:'#70b890',white:'#fff9ef',screen:'#213d4e'},
  camera:{kind:'orthographic',target:{x:9000,y:6250}},
  zones:[
    {id:'manager',label:'GERÊNCIA',x:2800,y:2200,w:4200,d:3000,tone:'supervision'},
    {id:'control',label:'CENTRAL DE OPERAÇÕES',x:9000,y:1800,w:6000,d:2600,tone:'supervision'},
    {id:'social',label:'SOCIAL',x:14600,y:3300,w:4000,d:2800,tone:'work'},
    {id:'seo',label:'SEO & GOOGLE',x:3300,y:6600,w:4700,d:3100,tone:'work'},
    {id:'operations',label:'OPERAÇÕES',x:9000,y:5900,w:5200,d:3600,tone:'work'},
    {id:'content',label:'CONTEÚDO',x:14700,y:6600,w:3800,d:3000,tone:'work'},
    {id:'entrance',label:'ENTRADA / RECEPÇÃO',x:1300,y:10300,w:2100,d:2700,tone:'shared'},
    {id:'lounge',label:'LOUNGE',x:4100,y:10300,w:3300,d:2600,tone:'shared'},
    {id:'engineering',label:'ENGENHARIA',x:9000,y:10300,w:5200,d:3000,tone:'work'},
    {id:'meeting',label:'REUNIÃO',x:14800,y:10300,w:4000,d:2800,tone:'shared'}
  ],
  walls:[
    {id:'outer-back',a:{x:0,y:0},b:{x:18000,y:0},thickness:180,height:3250,kind:'solid'},
    {id:'outer-left-back',a:{x:0,y:0},b:{x:0,y:3900},thickness:180,height:2850,kind:'solid'},
    {id:'outer-left-entry',a:{x:0,y:9000},b:{x:0,y:11500},thickness:180,height:1850,kind:'solid'},
    {id:'outer-right',a:{x:18000,y:0},b:{x:18000,y:12500},thickness:180,height:3150,kind:'solid'},
    {id:'manager-glass-bottom',a:{x:650,y:3800},b:{x:5000,y:3800},thickness:70,height:2500,kind:'glass'},
    {id:'manager-glass-right',a:{x:5000,y:650},b:{x:5000,y:2550},thickness:70,height:2500,kind:'glass'},
    {id:'social-glass-left',a:{x:12600,y:2200},b:{x:12600,y:4300},thickness:70,height:2350,kind:'glass'},
    {id:'content-glass-left',a:{x:12750,y:5350},b:{x:12750,y:7800},thickness:70,height:2350,kind:'glass'},
    {id:'seo-glass-top',a:{x:900,y:5000},b:{x:5600,y:5000},thickness:70,height:2350,kind:'glass'},
    {id:'engineering-glass-top',a:{x:6300,y:8800},b:{x:11700,y:8800},thickness:70,height:2350,kind:'glass'}
  ],
  features:[
    {id:'operations-wall',type:'screen-wall',x:9000,y:300,w:5600,h:3150},
    {id:'planning-board',type:'planning-board',x:15100,y:2150,w:2500,h:1900,rotationDeg:0},
    {id:'brand-right',type:'brand-wall',x:15400,y:650,w:2200,h:1000},
    {id:'brand-left',type:'brand-wall-side',x:450,y:4300,w:2100,h:950}
  ],
  // One distinct workstation for each real or reserved Dot agent.
  stations:[
    {id:'P1',department:'manager',label:'Gerência',x:2700,y:2450,rotationDeg:0},
    {id:'P2',department:'operations',label:'Operações 1',x:7200,y:5450,rotationDeg:0},
    {id:'P3',department:'operations',label:'Operações 2',x:9400,y:5450,rotationDeg:0},
    {id:'P4',department:'operations',label:'Operações 3',x:8200,y:7300,rotationDeg:180},
    {id:'P5',department:'social',label:'Social 1',x:14000,y:3300,rotationDeg:0},
    {id:'P6',department:'social',label:'Social 2',x:16000,y:3300,rotationDeg:0},
    {id:'P7',department:'content',label:'Conteúdo 1',x:14000,y:6300,rotationDeg:0},
    {id:'P8',department:'content',label:'Conteúdo 2',x:16000,y:6300,rotationDeg:0},
    {id:'P9',department:'content',label:'Conteúdo 3',x:15600,y:7700,rotationDeg:180},
    {id:'P10',department:'seo',label:'SEO & Google 1',x:1800,y:6500,rotationDeg:0},
    {id:'P11',department:'seo',label:'SEO & Google 2',x:3700,y:6500,rotationDeg:0},
    {id:'P12',department:'seo',label:'SEO & Google 3',x:3700,y:7900,rotationDeg:180},
    {id:'P13',department:'engineering',label:'Engenharia 1',x:7200,y:10300,rotationDeg:0},
    {id:'P14',department:'engineering',label:'Engenharia 2',x:10100,y:10300,rotationDeg:0}
  ],
  auxiliarySeats:[{id:'content-secondary',department:'content',x:16300,y:6600,rotationDeg:0}],
  furniture:[
    {id:'manager-desk',type:'executive-desk',x:2700,y:1900,w:2200,d:900,rotationDeg:0},
    {id:'manager-bookcase',type:'bookcase',x:1100,y:1150,w:850,d:380,h:2300},
    {id:'social-cabinet',type:'cabinet',x:17100,y:2700,w:750,d:420,h:850},
    {id:'content-cabinet',type:'cabinet',x:16900,y:7600,w:700,d:430,h:820},
    {id:'server-a',type:'server-rack',x:11600,y:11200,w:720,d:760,h:2100},
    {id:'lounge-sofa',type:'sofa',x:3600,y:10400,w:2100,d:850,rotationDeg:0},
    {id:'lounge-table',type:'coffee-table',x:4850,y:10400,w:850,d:650,rotationDeg:0},
    {id:'meeting-table',type:'meeting-table',x:14800,y:10300,w:2500,d:1100,rotationDeg:0},
    {id:'meeting-chair-1',type:'meeting-chair',x:13750,y:9500,rotationDeg:0},
    {id:'meeting-chair-2',type:'meeting-chair',x:15000,y:9500,rotationDeg:0},
    {id:'meeting-chair-3',type:'meeting-chair',x:13750,y:11100,rotationDeg:180},
    {id:'meeting-chair-4',type:'meeting-chair',x:15000,y:11100,rotationDeg:180}
  ],
  plants:[
    {x:700,y:1500,s:1.1},{x:4700,y:900,s:1.0},{x:12400,y:1200,s:1.0},{x:17300,y:1500,s:1.0},
    {x:1200,y:4600,s:.9},{x:5900,y:4700,s:.9},{x:12000,y:4700,s:.9},{x:17100,y:4800,s:.9},
    {x:6000,y:8500,s:.9},{x:12200,y:8500,s:.9},{x:17200,y:8500,s:.9},{x:5600,y:11700,s:1.0}
  ],
  navigation:{
    spawn:{id:'E1',x:1100,y:10800,label:'Entrada'},
    nodes:[
      {id:'N1',x:5700,y:3000},{id:'N2',x:9000,y:3000},{id:'N3',x:11900,y:3000},
      {id:'N4',x:5700,y:4700},{id:'N5',x:9000,y:4700},{id:'N6',x:11900,y:4700},
      {id:'N7',x:5700,y:8500},{id:'N8',x:9000,y:8500},{id:'N9',x:11900,y:8500},
      {id:'N10',x:2500,y:9000},{id:'N11',x:5700,y:9000},{id:'N12',x:12500,y:9000},
      {id:'N13',x:14500,y:4700},{id:'N14',x:14500,y:8500},{id:'N15',x:2700,y:4300}
    ],
    routes:[
      ['E1','N10'],['N10','N11'],['N11','N7'],['N7','N8'],['N8','N9'],['N9','N12'],['N12','N14'],
      ['N7','N4'],['N4','N1'],['N1','N2'],['N2','N3'],['N4','N5'],['N5','N6'],['N6','N13'],['N13','N14'],
      ['N10','N15'],['N15','N4'],['N5','N8'],['N6','N9']
    ]
  }
};
export function office3Zone(id){return OFFICE3_PLAN.zones.find(zone=>zone.id===id)||null;}
export function office3Station(id){return OFFICE3_PLAN.stations.find(station=>station.id===id)||null;}
