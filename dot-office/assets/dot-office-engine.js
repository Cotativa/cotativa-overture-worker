(() => {
  'use strict';

  /**
   * DOT Office Visual Reset Renderer v4.10.73
   *
   * Cotativa renderer with a denser pixel/isometric office, live task board
   * and telemetry-driven agent behavior.
   *
   * Rendering primitives and character/furniture ideas were adapted from
   * TeamDay-AI/business-tycoon (MIT). See admin/assets/THIRD_PARTY_NOTICES.txt.
   */

  const root = document.querySelector('[data-dot-office]');
  const canvas = root?.querySelector('[data-dot-office-canvas]');
  const payloadEl = root?.querySelector('[data-dot-office-stations-json]');
  if (!root || !canvas || !payloadEl) return;

  const ctx = canvas.getContext('2d', { alpha:false });
  const kit = window.DotTeamDayKit || null;
  let initial = {};
  try { initial = JSON.parse(payloadEl.textContent || '{}'); } catch (_) {}

  const C = {
    bg:'#0b0d10',
    bg2:'#15191d',
    floor:'#4a4a46',
    floorAlt:'#50504b',
    corridor:'#3a3d3f',
    corridorAlt:'#414447',
    wood:'#8d6f50',
    woodAlt:'#957759',
    carpetBlue:'#263842',
    carpetBlue2:'#2b414b',
    carpetTeal:'#29433d',
    carpetTeal2:'#305048',
    wallDark:'#252a2d',
    wall:'#333b3f',
    wallLight:'#505b60',
    wallTrim:'#819096',
    glass:'rgba(160,205,214,.17)',
    woodTop:'#a47a56',
    woodLeft:'#735037',
    woodRight:'#855e42',
    woodLight:'#c09870',
    deskTop:'#a26f4b',
    deskSide:'#6f4b36',
    monitor:'#101519',
    screen:'#15313a',
    screen2:'#1d4550',
    metal:'#2e373b',
    metal2:'#536068',
    chair:'#39464b',
    chairDark:'#20292d',
    teal:'#59c8a8',
    green:'#6fca8e',
    blue:'#7cb3d5',
    amber:'#e2b967',
    red:'#d87979',
    white:'#edf2f1',
    text:'#d7e0de',
    muted:'#8e9b9d',
    skin:'#b98566',
    hair:'#20292d',
    shadow:'rgba(0,0,0,.30)'
  };

  const TILE_W = 64;
  const TILE_H = 32;

  const geometry = {
    manager:     {label:'GERÊNCIA',      desk:{x:2.35,y:2.2}, seat:{x:2.95,y:3.62},  seat2:{x:4.45,y:3.62},  stand:{x:3.75,y:4.48}},
    social:      {label:'SOCIAL',        desk:{x:7.05,y:2.2}, seat:{x:7.65,y:3.62},  seat2:{x:9.15,y:3.62},  stand:{x:8.35,y:4.48}},
    content:     {label:'CONTEÚDO',      desk:{x:11.95,y:2.2},seat:{x:12.55,y:3.62}, seat2:{x:14.15,y:3.62}, stand:{x:13.35,y:4.48}},
    seo:         {label:'SEO & GOOGLE',  desk:{x:2.85,y:8.4}, seat:{x:3.45,y:9.86},  seat2:{x:5.10,y:9.86},  stand:{x:4.30,y:10.72}},
    operations:  {label:'OPERAÇÕES',    desk:{x:8.05,y:8.55},seat:{x:8.65,y:10.03}, seat2:{x:10.45,y:10.03},stand:{x:9.55,y:10.72}},
    engineering: {label:'ENGENHARIA',    desk:{x:12.35,y:8.4},seat:{x:12.95,y:9.86}, seat2:{x:14.65,y:9.86}, stand:{x:13.80,y:10.72}},
    control_tv:  {label:'CENTRAL',       desk:{x:9.25,y:5.55},seat:{x:9.25,y:6.55},  seat2:{x:10.1,y:6.72},   stand:{x:9.45,y:7.12}}
  };

  const behaviorPoints = {
    control_tv_watch:{x:9.65,y:7.2},
    assignment_left:{x:8.72,y:6.42},
    assignment_right:{x:10.08,y:6.42},
    completion_report:{x:9.48,y:7.06},
    director_wait:{x:3.0,y:6.15},
    central_cross:{x:9.5,y:6.35},
    upper_left_gate:{x:8.15,y:5.25},
    upper_right_gate:{x:10.75,y:5.25},
    lower_left_gate:{x:8.15,y:7.35},
    lower_right_gate:{x:10.75,y:7.35}
  };

  const state = {
    stations:new Map(),
    employee:initial.employee || {},
    agents:Array.isArray(initial.agents)?initial.agents:[],
    taskBoard:Array.isArray(initial.task_board)?initial.task_board:[],
    metrics:initial.metrics || {},
    team:initial.team || {},
    runtimes:new Map(),
    frame:0,
    lastTs:performance.now(),
    hitAreas:[],
    dpr:Math.min(2,window.devicePixelRatio||1),
    hoverKey:null,
    selectedKey:null
  };

  (initial.stations||[]).forEach(s=>state.stations.set(String(s.key),s));

  let view={w:0,h:0,z:1,tw:TILE_W,th:TILE_H,ox:0,oy:0};

  function resize(){
    const rect=canvas.getBoundingClientRect();
    const w=Math.max(640,Math.floor(rect.width||canvas.parentElement?.clientWidth||1100));
    const h=Math.max(470,Math.floor(rect.height||585));
    state.dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.floor(w*state.dpr);
    canvas.height=Math.floor(h*state.dpr);
    ctx.setTransform(state.dpr,0,0,state.dpr,0,0);
    ctx.imageSmoothingEnabled=false;

    // v4.10.73 intentionally pushes the office closer to the camera. The
    // previous renderer left too much dead canvas and made people/furniture tiny.
    const z=Math.max(.98,Math.min(1.42,Math.min(w/900,h/540)));
    const ox=w*.5;
    const oy=Math.max(38,h*.07);
    view={w,h,z,tw:TILE_W*z,th:TILE_H*z,ox,oy};
  }

  function iso(x,y,z=0){
    return {
      x:view.ox + (x-y)*(view.tw/2),
      y:view.oy + (x+y)*(view.th/2) - z*view.th
    };
  }

  function fillDiamond(x,y,color){
    const s=iso(x,y),tw=view.tw,th=view.th;
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(s.x,s.y-th/2);
    ctx.lineTo(s.x+tw/2,s.y);
    ctx.lineTo(s.x,s.y+th/2);
    ctx.lineTo(s.x-tw/2,s.y);
    ctx.closePath();ctx.fill();
  }

  function drawIsoBox(cx,cy,bw,bh,depth,top,left,right){
    // Adapted from TeamDay AI Business Tycoon (MIT), with Cotativa palette.
    ctx.fillStyle=top;
    ctx.beginPath();
    ctx.moveTo(cx,cy-depth);ctx.lineTo(cx+bw/2,cy+bh/2-depth);
    ctx.lineTo(cx,cy+bh-depth);ctx.lineTo(cx-bw/2,cy+bh/2-depth);
    ctx.closePath();ctx.fill();

    ctx.fillStyle=left;
    ctx.beginPath();
    ctx.moveTo(cx-bw/2,cy+bh/2-depth);ctx.lineTo(cx,cy+bh-depth);
    ctx.lineTo(cx,cy+bh);ctx.lineTo(cx-bw/2,cy+bh/2);
    ctx.closePath();ctx.fill();

    ctx.fillStyle=right;
    ctx.beginPath();
    ctx.moveTo(cx+bw/2,cy+bh/2-depth);ctx.lineTo(cx,cy+bh-depth);
    ctx.lineTo(cx,cy+bh);ctx.lineTo(cx+bw/2,cy+bh/2);
    ctx.closePath();ctx.fill();
  }

  function wall(x1,y1,x2,y2,height=1.8,glass=false){
    const a=iso(x1,y1),b=iso(x2,y2),at=iso(x1,y1,height),bt=iso(x2,y2,height);
    const horizontal=Math.abs(x2-x1)>Math.abs(y2-y1);
    ctx.fillStyle=glass?C.glass:(horizontal?C.wall:C.wallDark);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(bt.x,bt.y);ctx.lineTo(at.x,at.y);ctx.closePath();ctx.fill();
    ctx.strokeStyle=glass?'rgba(137,192,205,.42)':C.wallTrim;
    ctx.lineWidth=.7*view.z;ctx.beginPath();ctx.moveTo(at.x,at.y);ctx.lineTo(bt.x,bt.y);ctx.stroke();
    if(glass){
      const m1={x:(a.x+at.x)/2,y:(a.y+at.y)/2},m2={x:(b.x+bt.x)/2,y:(b.y+bt.y)/2};
      ctx.strokeStyle='rgba(185,225,232,.14)';ctx.beginPath();ctx.moveTo(m1.x,m1.y);ctx.lineTo(m2.x,m2.y);ctx.stroke();
    }
  }

  function roomStyle(x,y){
    // Reference layout: executive glass office top-left, creative departments
    // across the top, SEO lower-left, Operations central, Engineering right.
    if(x>=1&&x<=5&&y>=1&&y<=4) return (x+y)%2?C.wood:C.woodAlt;
    if(x>=6&&x<=10&&y>=1&&y<=4) return (x+y)%2?C.carpetTeal:C.carpetTeal2;
    if(x>=11&&x<=16&&y>=1&&y<=4) return (x+y)%2?C.carpetBlue:C.carpetBlue2;
    if(x>=1&&x<=6&&y>=8&&y<=11) return (x+y)%2?C.carpetTeal:C.carpetTeal2;
    if(x>=7&&x<=11&&y>=8&&y<=11) return (x+y)%2?C.carpetBlue:C.carpetBlue2;
    if(x>=12&&x<=16&&y>=8&&y<=11) return (x+y)%2?C.carpetBlue:C.carpetBlue2;
    if(y>=5&&y<=7) return (x+y)%2?C.corridor:C.corridorAlt;
    return (x+y)%2?C.floor:C.floorAlt;
  }

  function drawFoundation(){
    const z=view.z,drop=18*z;
    const a=iso(0,0),b=iso(18,0),c0=iso(18,13),d=iso(0,13);

    // Deep architectural slab with a warmer, premium edge.
    const g=ctx.createLinearGradient(d.x,d.y,c0.x,c0.y+drop);
    g.addColorStop(0,'#273036');g.addColorStop(1,'#14191d');
    ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(c0.x,c0.y);ctx.lineTo(c0.x,c0.y+drop);ctx.lineTo(d.x,d.y+drop);ctx.closePath();ctx.fill();

    ctx.fillStyle='#11161a';
    ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(c0.x,c0.y);ctx.lineTo(c0.x,c0.y+drop);ctx.lineTo(b.x,b.y+drop);ctx.closePath();ctx.fill();

    ctx.strokeStyle='rgba(177,198,204,.38)';ctx.lineWidth=.8*z;
    ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(c0.x,c0.y);ctx.lineTo(b.x,b.y);ctx.stroke();

    ctx.fillStyle='rgba(0,0,0,.30)';
    ctx.beginPath();
    ctx.moveTo(d.x+16*z,d.y+drop+2*z);ctx.lineTo(c0.x-6*z,c0.y+drop+2*z);
    ctx.lineTo(b.x-15*z,b.y+drop+3*z);ctx.lineTo(b.x-32*z,b.y+drop+14*z);
    ctx.lineTo(c0.x-10*z,c0.y+drop+14*z);ctx.lineTo(d.x+28*z,d.y+drop+14*z);
    ctx.closePath();ctx.fill();
  }

  function drawCorridorMarkings(){
    const z=view.z;
    const lines=[
      [iso(3.0,6.0,.02),iso(15.3,6.0,.02)],
      [iso(4.2,7.05,.02),iso(14.4,7.05,.02)]
    ];
    ctx.strokeStyle='rgba(121,176,192,.34)';
    ctx.lineWidth=2*z;
    ctx.setLineDash([10*z,7*z]);
    lines.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();});
    ctx.setLineDash([]);

    // Central cross / control zone.
    const p=iso(9.55,6.35,.025),tw=1.55*view.tw,th=1.55*view.th;
    ctx.strokeStyle='rgba(72,193,152,.25)';ctx.lineWidth=1*z;
    ctx.beginPath();
    ctx.moveTo(p.x,p.y-th/2);ctx.lineTo(p.x+tw/2,p.y);ctx.lineTo(p.x,p.y+th/2);ctx.lineTo(p.x-tw/2,p.y);ctx.closePath();ctx.stroke();
  }

  function drawDepartmentZones(){
    const pulse=.5+.5*Math.sin(state.frame*.035);
    const zones=[
      ['manager',.75,.75,5.35,4.72],
      ['social',5.55,.75,10.45,4.72],
      ['content',10.7,.75,16.75,4.72],
      ['seo',.75,7.62,6.65,11.92],
      ['operations',6.9,7.62,11.62,11.92],
      ['engineering',11.82,7.62,16.78,11.92]
    ];
    zones.forEach(([key,x1,y1,x2,y2])=>{
      const st=state.stations.get(key)||{},co=statusColor(st.status||'standby');
      const active=['working','running','processing','monitoring','supervising','ok'].includes(String(st.status||'').toLowerCase());
      const focused=state.hoverKey===key||state.selectedKey===key;
      const pts=[iso(x1,y1,.018),iso(x2,y1,.018),iso(x2,y2,.018),iso(x1,y2,.018)];
      ctx.save();
      ctx.globalAlpha=focused?.15:(active?.07+pulse*.035:.018);
      ctx.fillStyle=co;
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fill();
      ctx.globalAlpha=focused?.72:(active?.28:.09);ctx.strokeStyle=co;ctx.lineWidth=(focused?2.1:(active?1.25:.7))*view.z;
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawPremiumFloorAccents(){
    const z=view.z;
    const rug=(x1,y1,x2,y2,fill,stroke)=>{
      const pts=[iso(x1,y1,.022),iso(x2,y1,.022),iso(x2,y2,.022),iso(x1,y2,.022)];
      ctx.save();
      ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=.8*z;
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fill();ctx.stroke();
      ctx.globalAlpha=.16;ctx.strokeStyle='#d7c3a1';ctx.setLineDash([4*z,4*z]);
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.stroke();
      ctx.setLineDash([]);ctx.restore();
    };
    rug(1.05,1.05,5.08,4.38,'rgba(122,87,54,.22)','rgba(221,176,76,.13)');
    rug(5.82,1.05,10.20,4.38,'rgba(29,76,66,.22)','rgba(72,193,152,.11)');
    rug(10.98,1.05,16.28,4.38,'rgba(39,64,76,.24)','rgba(101,169,220,.11)');
    rug(1.02,8.05,6.32,11.55,'rgba(29,76,66,.20)','rgba(72,193,152,.10)');
    rug(7.22,8.05,11.20,11.46,'rgba(39,64,76,.24)','rgba(101,169,220,.12)');
    rug(12.02,8.05,16.28,11.55,'rgba(39,64,76,.22)','rgba(145,169,223,.10)');
  }

  function drawAmbientLighting(){
    const lights=[
      {x:3.1,y:2.7,r:112,c:'rgba(226,177,87,.13)'},
      {x:8.0,y:2.7,r:110,c:'rgba(72,193,152,.11)'},
      {x:13.3,y:2.7,r:110,c:'rgba(101,169,220,.10)'},
      {x:4.0,y:9.5,r:115,c:'rgba(72,193,152,.09)'},
      {x:9.2,y:9.5,r:125,c:'rgba(91,180,221,.11)'},
      {x:14.0,y:9.5,r:115,c:'rgba(116,146,218,.10)'},
      {x:9.25,y:5.65,r:150,c:'rgba(74,193,180,.08)'}
    ];
    ctx.save();ctx.globalCompositeOperation='screen';
    lights.forEach(l=>{
      const p=iso(l.x,l.y,.04),r=l.r*view.z;
      const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
      g.addColorStop(0,l.c);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);
    });
    ctx.restore();
  }

  function drawCeilingSpots(){
    const z=view.z;
    [1.6,4.7,7.8,10.9,14.0,16.6].forEach((x,i)=>{
      const p=iso(x,.04,1.92);
      ctx.fillStyle='#263840';ctx.fillRect(p.x-5*z,p.y-3*z,10*z,4*z);
      ctx.fillStyle=i%2?'#e9d39b':'#c7e7ef';ctx.fillRect(p.x-2*z,p.y,4*z,2*z);
      const g=ctx.createRadialGradient(p.x,p.y+4*z,0,p.x,p.y+18*z,27*z);
      g.addColorStop(0,i%2?'rgba(246,211,139,.12)':'rgba(158,220,235,.10)');g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(p.x-30*z,p.y,p.x?60*z:60*z,48*z);
    });
  }

  function drawFloor(){
    const bg=ctx.createRadialGradient(view.w*.52,view.h*.38,60,view.w*.52,view.h*.42,Math.max(view.w,view.h)*.78);
    bg.addColorStop(0,'#1b2024');bg.addColorStop(.55,'#101419');bg.addColorStop(1,'#090c0f');
    ctx.fillStyle=bg;ctx.fillRect(0,0,view.w,view.h);

    // architectural halo behind the building instead of the old solid teal band
    const halo=ctx.createLinearGradient(0,0,0,view.h*.42);
    halo.addColorStop(0,'rgba(77,117,126,.13)');halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=halo;ctx.fillRect(0,0,view.w,view.h*.42);

    drawFoundation();

    for(let y=0;y<13;y++){
      for(let x=0;x<18;x++){
        fillDiamond(x,y,roomStyle(x,y));
        const s=iso(x,y);
        ctx.strokeStyle='rgba(255,255,255,.025)';
        ctx.lineWidth=.55*view.z;
        ctx.beginPath();
        ctx.moveTo(s.x,s.y-view.th/2);ctx.lineTo(s.x+view.tw/2,s.y);ctx.lineTo(s.x,s.y+view.th/2);ctx.lineTo(s.x-view.tw/2,s.y);ctx.closePath();ctx.stroke();
      }
    }

    drawCorridorMarkings();
    drawDepartmentZones();
    drawPremiumFloorAccents();

    // taller rear architecture, lower transparent front partitions
    wall(0,0,18,0,2.55,false);
    wall(0,0,0,13,2.55,false);

    // Gerência: enclosed premium glass office in the upper-left.
    wall(5.45,.85,5.45,4.72,1.62,true);
    wall(.85,4.72,2.88,4.72,1.12,true);
    wall(3.62,4.72,5.25,4.72,1.12,true);
    wall(.85,.85,5.30,.85,.74,true);

    // Social / Conteúdo: open studio partitions.
    wall(10.6,.85,10.6,4.72,1.30,false);
    wall(16.65,.85,16.65,4.72,1.30,false);
    wall(5.82,1.82,10.18,1.82,.78,true);
    wall(10.98,1.82,16.22,1.82,.78,true);

    // lower production floor
    wall(6.72,7.62,6.72,11.92,1.22,false);
    wall(11.72,7.62,11.72,11.92,1.22,false);
    wall(16.68,7.62,16.68,11.92,1.22,false);
    wall(1.0,8.02,6.35,8.02,.74,true);
    wall(7.05,8.02,11.38,8.02,.70,true);
    wall(12.02,8.02,16.30,8.02,.74,true);

    drawWallBrand();
    drawWindow();
    drawClock();
    drawCeilingSpots();
    drawAmbientLighting();
    drawWelcomeMat();
  }

  function drawWelcomeMat(){
    const p=iso(1.18,7.02,.035),z=view.z,tw=1.55*view.tw,th=1.3*view.th;
    ctx.fillStyle='#111d22';ctx.strokeStyle='#4d6d76';ctx.lineWidth=.8*z;
    ctx.beginPath();ctx.moveTo(p.x,p.y-th/2);ctx.lineTo(p.x+tw/2,p.y);ctx.lineTo(p.x,p.y+th/2);ctx.lineTo(p.x-tw/2,p.y);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(view.th,view.tw));
    ctx.fillStyle='#e8eeee';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='900 '+Math.max(6,8*z)+'px system-ui,sans-serif';ctx.fillText('COTATIVA',0,-1*z);
    ctx.fillStyle=C.teal;ctx.font='800 '+Math.max(3.5,4.3*z)+'px ui-monospace,monospace';ctx.fillText('TECNOLOGIA PARA NEGÓCIOS',0,7*z);
    ctx.restore();
  }

  function drawWallBrand(){
    const p=iso(9.2,.035,1.78),z=view.z;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='900 '+Math.max(12,16*z)+'px system-ui,sans-serif';
    ctx.fillStyle=C.white;ctx.fillText('COTATIVA',p.x,p.y);
    ctx.font='800 '+Math.max(4.6,5.5*z)+'px ui-monospace,monospace';
    ctx.fillStyle=C.teal;ctx.fillText('TECNOLOGIA PARA NEGÓCIOS',p.x,p.y+12*z);
  }

  function drawWindow(){
    const z=view.z;
    const panel=(x,wTiles=1.8)=>{
      const p=iso(x,.035,1.28),w=82*z*wTiles,h=52*z;
      ctx.fillStyle='#172b34';ctx.fillRect(p.x-w/2-4*z,p.y-h-4*z,w+8*z,h+8*z);
      ctx.fillStyle='#123747';ctx.fillRect(p.x-w/2,p.y-h,w,h);
      const sky=ctx.createLinearGradient(0,p.y-h,0,p.y);
      sky.addColorStop(0,'#173b55');sky.addColorStop(.58,'#1f6072');sky.addColorStop(1,'#102631');
      ctx.fillStyle=sky;ctx.fillRect(p.x-w/2+3*z,p.y-h+3*z,w-6*z,h-6*z);
      // city lights
      for(let i=0;i<10;i++){
        const bx=p.x-w/2+(7+i*(w-14*z)/10),bh=(7+((i*13)%16))*z;
        ctx.fillStyle=i%3===0?'#162b38':'#1a3543';ctx.fillRect(bx,p.y-5*z-bh,5*z,bh);
        ctx.fillStyle=i%2?'rgba(238,205,126,.5)':'rgba(99,184,215,.42)';
        ctx.fillRect(bx+1*z,p.y-9*z-bh/2,1.5*z,1.5*z);
      }
      ctx.strokeStyle='#71848c';ctx.lineWidth=1.5*z;ctx.strokeRect(p.x-w/2,p.y-h,w,h);
      ctx.beginPath();ctx.moveTo(p.x,p.y-h);ctx.lineTo(p.x,p.y);ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(p.x-w/2+7*z,p.y-h+7*z,10*z,h-14*z);
    };
    panel(2.0,1.05);
    panel(15.05,.95);
  }

  function drawClock(){
    const p=iso(16.0,.05,1.28),z=view.z;
    ctx.fillStyle='#e8efef';ctx.beginPath();ctx.arc(p.x,p.y,14*z,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#344d57';ctx.lineWidth=3*z;ctx.stroke();
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+6*z,p.y-4*z);ctx.stroke();
    ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y-8*z);ctx.stroke();
  }

  function statusColor(status){
    const s=String(status||'').toLowerCase();
    if(['working','processing','running','monitoring','supervising'].includes(s))return C.blue;
    if(['attention','failed','error','waiting_user','waiting','blocked'].includes(s))return C.amber;
    if(['ok','done','healthy','connected'].includes(s))return C.green;
    return '#73868f';
  }

  function drawMonitor(x,y,status='standby',screens=1,scale=1){
    const p=iso(x,y,.86),z=view.z*scale;
    const tick=state.frame;
    const total=screens===2?50:31;
    const startX=p.x-total*z/2;
    for(let i=0;i<screens;i++){
      const mx=startX+(screens===2?i*28*z:0)+15*z;
      ctx.fillStyle=C.monitor;ctx.fillRect(mx-14*z,p.y-28*z,28*z,20*z);
      ctx.fillStyle=C.screen;ctx.fillRect(mx-12*z,p.y-26*z,24*z,16*z);
      ctx.fillStyle=i===0?statusColor(status):C.teal;
      ctx.fillRect(mx-10*z,p.y-23*z,(7+Math.sin(tick*.05+i)*2)*z,2*z);
      ctx.fillStyle='#567583';ctx.fillRect(mx-10*z,p.y-18*z,18*z,1.5*z);
      ctx.fillRect(mx-10*z,p.y-14*z,13*z,1.5*z);
      ctx.fillStyle='rgba(255,255,255,.06)';ctx.fillRect(mx-11*z,p.y-25*z,4*z,13*z);
      ctx.fillStyle=C.metal;ctx.fillRect(mx-1.4*z,p.y-8*z,2.8*z,5*z);
      ctx.fillStyle=C.metal2;ctx.fillRect(mx-6*z,p.y-3*z,12*z,2*z);
    }
  }

  function drawKeyboard(x,y,scale=1){
    const p=iso(x,y,.76),z=view.z*scale;
    ctx.fillStyle='#2a3439';ctx.fillRect(p.x-13*z,p.y-2*z,26*z,5*z);
    ctx.fillStyle='#59656a';
    for(let i=-9;i<=9;i+=6)ctx.fillRect(p.x+i*z,p.y-1*z,3*z,1*z);
  }

  function drawChair(x,y,manager=false,scale=1){
    const p=iso(x,y,.17),z=view.z*scale;
    ctx.fillStyle=manager?'#35444b':C.chairDark;ctx.fillRect(p.x-10*z,p.y-22*z,20*z,26*z);
    ctx.fillStyle=manager?'#465b64':C.chair;ctx.fillRect(p.x-7*z,p.y-19*z,14*z,18*z);
    ctx.fillStyle='#1c292e';ctx.fillRect(p.x-2*z,p.y+4*z,4*z,12*z);
    ctx.fillRect(p.x-10*z,p.y+15*z,20*z,3*z);
  }

  function drawDesk(station,x,y,{manager=false,secondary=false,dual=false}={}){
    const s=iso(x,y),z=view.z;
    const stationData=state.stations.get(station)||{};
    const active=['working','running','processing','monitoring','ok'].includes(String(stationData.status||'').toLowerCase());

    if(kit?.drawWorkstation){
      const hue={manager:42,operations:197,social:163,content:210,seo:151,engineering:228}[station]||165;
      kit.drawWorkstation(ctx,s.x,s.y,z,{
        manager,
        compact:secondary,
        screens:dual?2:1,
        active,
        tick:state.frame,
        hue
      });
    }else{
      const w=(secondary?39:manager?62:54)*z,h=(secondary?20:26)*z,d=(secondary?10:14)*z;
      drawIsoBox(s.x,s.y,w,h,d,
        manager?'#a27b58':secondary?'#916244':C.deskTop,
        manager?'#725339':C.deskSide,
        manager?'#825d3f':'#80543b'
      );
      drawMonitor(x-.05,y-.18,stationData.status||'standby',dual?2:1,secondary?.86:1);
      drawKeyboard(x+.18,y+.12,secondary?.82:1);
    }

    const g=geometry[station];
    if(g){
      const seat=secondary&&g.seat2?g.seat2:g.seat;
      const sp=iso(seat.x,seat.y,.17);
      if(kit?.drawChair)kit.drawChair(ctx,sp.x,sp.y,z*(secondary?.88:1),{manager});
      else drawChair(seat.x,seat.y,manager,secondary?.88:1);
    }
  }

  function drawCabinet(x,y,books=false){
    const p=iso(x,y),z=view.z;
    if(books && kit?.drawBookshelf)return kit.drawBookshelf(ctx,p.x,p.y,z);
    if(!books && kit?.drawFilingCabinet)return kit.drawFilingCabinet(ctx,p.x,p.y,z);
    drawIsoBox(p.x,p.y,31*z,16*z,38*z,'#59636a','#3a444a','#465158');
  }

  function drawPlant(x,y,scale=1){
    const p=iso(x,y,.08),z=view.z*scale;
    if(kit?.drawPlant)return kit.drawPlant(ctx,p.x,p.y,z,state.frame);
    drawIsoBox(p.x,p.y,16*z,9*z,10*z,'#9a5e3f','#71402d','#82503a');
  }

  function drawCoffeeStation(x,y){
    const p=iso(x,y),z=view.z;
    if(kit?.drawCoffeeMachine)return kit.drawCoffeeMachine(ctx,p.x,p.y,z,state.frame);
    drawIsoBox(p.x,p.y,34*z,18*z,22*z,'#4b5358','#30383d','#3a4247');
  }

  function drawMeetingTable(){
    const p=iso(5.15,6.25),z=view.z;
    if(kit?.drawMeetingTable)kit.drawMeetingTable(ctx,p.x,p.y,z);
    else drawIsoBox(p.x,p.y,82*z,34*z,10*z,'#775a43','#553e31','#654b39');
    [[4.2,5.8],[5.9,5.55],[4.35,6.9],[6.0,6.75]].forEach(([x,y])=>{
      const cp=iso(x,y,.12);
      if(kit?.drawChair)kit.drawChair(ctx,cp.x,cp.y,z*.74,{});
      else drawChair(x,y,false,.74);
    });
  }

  function drawWhiteboard(x,y){
    const p=iso(x,y,1.1),z=view.z;
    if(kit?.drawWhiteboard)return kit.drawWhiteboard(ctx,p.x,p.y,z*1.25);
    ctx.fillStyle='#d7d9d4';ctx.fillRect(p.x-25*z,p.y-35*z,50*z,30*z);
  }

  function drawDepartmentSign(station,x,y){
    const p=iso(x,y,.32),z=view.z,label=geometry[station]?.label||station.toUpperCase(),st=state.stations.get(station)||{};
    const status=String(st.status||'standby'),focused=state.hoverKey===station||state.selectedKey===station;
    const co=statusColor(status);

    // v4.10.73: labels are architectural plaques, not giant floating cards.
    ctx.font='900 '+Math.max(5.5,6.4*z)+'px ui-monospace,monospace';
    const w=ctx.measureText(label).width+18*z,h=17*z;
    ctx.fillStyle=focused?'rgba(14,23,27,.94)':'rgba(15,22,25,.76)';
    ctx.strokeStyle=focused?co:'rgba(175,197,202,.18)';
    ctx.lineWidth=(focused?1.2:.55)*z;
    ctx.beginPath();ctx.roundRect(p.x-w/2,p.y-h,w,h,4*z);ctx.fill();ctx.stroke();

    ctx.fillStyle=co;ctx.beginPath();ctx.arc(p.x-w/2+7*z,p.y-h/2,2*z,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d9e2e1';ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(label,p.x-w/2+13*z,p.y-h/2);

    if(focused){
      const q=Math.max(0,Number(st.queue||st.pending||st.queue_depth||0));
      const sub=q>0?'FILA '+q:String(status).toUpperCase();
      ctx.fillStyle='rgba(8,13,16,.90)';
      ctx.beginPath();ctx.roundRect(p.x-w/2,p.y+3*z,w,14*z,3*z);ctx.fill();
      ctx.fillStyle=co;ctx.font='800 '+Math.max(4.6,5.2*z)+'px ui-monospace,monospace';
      ctx.textAlign='center';ctx.fillText(sub,p.x,p.y+10*z);
    }
    state.hitAreas.push({key:station,x:p.x-w/2-8,y:p.y-h-18*z,w:w+16,h:44*z});
  }

  function drawTaskTV(){
    // The control center is now a wall-mounted architectural screen instead of
    // a giant floating card blocking the office.
    const p=iso(9.25,.62,1.92),z=view.z,w=164*z,h=78*z;
    const left=p.x-w/2,top=p.y-h;
    const metrics=state.metrics||{};
    const rows=(state.taskBoard||[]).filter(Boolean).slice(0,2);

    ctx.fillStyle='#1d2529';ctx.fillRect(left-7*z,top-7*z,w+14*z,h+14*z);
    ctx.fillStyle='#050b0e';ctx.fillRect(left,top,w,h);
    ctx.strokeStyle='rgba(113,190,176,.65)';ctx.lineWidth=.8*z;ctx.strokeRect(left+3*z,top+3*z,w-6*z,h-6*z);

    ctx.fillStyle=C.teal;ctx.fillRect(left+9*z,top+9*z,3*z,13*z);
    ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillStyle='#e3eeec';ctx.font='900 '+Math.max(5.5,6.6*z)+'px ui-monospace,monospace';
    ctx.fillText('CENTRAL COTATIVA',left+17*z,top+14*z);
    ctx.fillStyle='#71878b';ctx.font='700 '+Math.max(4.2,4.8*z)+'px ui-monospace,monospace';
    ctx.fillText('FILA '+Number(metrics.pending||0)+'  ·  EXEC '+Number(metrics.processing_agents||0)+'  ·  RETRY '+Number(metrics.retry||0),left+17*z,top+25*z);

    rows.forEach((task,i)=>{
      const y=top+(42+i*14)*z,co=statusColor(task.status);
      const pr=Math.max(0,Math.min(100,Number(task.progress||0)));
      let label=String(task.agent_name||task.role||'DOT').replace(/^Dot\s+/,'')+' · '+String(task.label||task.type||'Tarefa');
      if(label.length>27)label=label.slice(0,25)+'…';
      ctx.fillStyle=co;ctx.beginPath();ctx.arc(left+14*z,y,2*z,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ccd9d8';ctx.font='800 '+Math.max(4.3,5*z)+'px system-ui,sans-serif';ctx.fillText(label,left+21*z,y);
      ctx.fillStyle='#16272d';ctx.fillRect(left+w-48*z,y-3*z,35*z,3*z);
      if(pr>0){ctx.fillStyle=co;ctx.fillRect(left+w-48*z,y-3*z,35*z*(pr/100),3*z);}
    });

    const footer=top+h-10*z;
    ctx.fillStyle='#61777c';ctx.font='800 '+Math.max(4,4.6*z)+'px ui-monospace,monospace';
    ctx.fillText('24H '+Number(metrics.done_24h||0)+'  ·  SUCESSO '+Number(metrics.success_24h||0).toFixed(0)+'%  ·  BLOQ '+Number(metrics.needs_user||0),left+12*z,footer);

    state.hitAreas.push({key:'control_tv',x:left-8*z,y:top-8*z,w:w+16*z,h:h+16*z});
  }

  function officeObjects(){
    const items=[];
    const add=(x,y,fn)=>items.push({depth:x+y,y,fn});
    const at=(x,y,z,fn)=>{const p=iso(x,y,z);fn(p);};

    // GERÊNCIA — premium glass office, matching the approved reference.
    add(2.35,2.2,()=>drawDesk('manager',2.35,2.2,{manager:true,dual:true}));
    add(1.18,3.28,()=>drawCabinet(1.18,3.28,true));
    if(kit?.drawCouch)add(4.18,3.28,()=>at(4.18,3.28,.08,p=>kit.drawCouch(ctx,p.x,p.y,view.z*.68,{top:'#5b5148',left:'#38312c',right:'#473b34'})));
    if(kit?.drawFloorLamp)add(1.22,1.42,()=>at(1.22,1.42,.04,p=>kit.drawFloorLamp(ctx,p.x,p.y,view.z*.72,{warm:true})));
    add(4.72,1.44,()=>drawPlant(4.72,1.44,.72));

    // SOCIAL — creative bay.
    add(7.05,2.2,()=>drawDesk('social',7.05,2.2,{dual:false}));
    add(8.75,2.2,()=>drawDesk('social',8.75,2.2,{secondary:true}));
    add(6.05,3.28,()=>drawPlant(6.05,3.28,.72));
    if(kit?.drawCredenza)add(9.70,3.18,()=>at(9.70,3.18,.10,p=>kit.drawCredenza(ctx,p.x,p.y,view.z*.78,{})));
    if(kit?.drawWallArt)add(6.38,1.05,()=>at(6.38,1.05,1.17,p=>kit.drawWallArt(ctx,p.x,p.y,view.z*.92,{accent:C.teal,w:32,h:23})));

    // CONTENT — writing studio.
    add(11.95,2.2,()=>drawDesk('content',11.95,2.2,{dual:true}));
    add(13.75,2.2,()=>drawDesk('content',13.75,2.2,{secondary:true}));
    add(15.68,2.92,()=>drawCabinet(15.68,2.92,true));
    add(15.55,3.70,()=>drawPlant(15.55,3.70,.68));
    if(kit?.drawFloorLamp)add(11.12,3.55,()=>at(11.12,3.55,.05,p=>kit.drawFloorLamp(ctx,p.x,p.y,view.z*.72,{warm:false})));

    // Shared central spine.
    add(3.85,6.24,()=>drawMeetingTable());
    if(kit?.drawCouch)add(1.72,5.78,()=>at(1.72,5.78,.08,p=>kit.drawCouch(ctx,p.x,p.y,view.z*.78,{top:'#405a63'})));
    if(kit?.drawSideTable)add(2.65,6.22,()=>at(2.65,6.22,.08,p=>kit.drawSideTable(ctx,p.x,p.y,view.z*.68)));
    add(9.25,5.55,()=>drawTaskTV());
    add(12.15,6.22,()=>drawWhiteboard(12.15,6.22));
    add(15.75,6.62,()=>drawCoffeeStation(15.75,6.62));
    if(kit?.drawWaterCooler)add(14.90,6.28,()=>at(14.90,6.28,.05,p=>kit.drawWaterCooler(ctx,p.x,p.y,view.z*.72,state.frame)));
    add(16.55,6.82,()=>drawPlant(16.55,6.82,.72));

    // SEO & GOOGLE.
    add(2.85,8.4,()=>drawDesk('seo',2.85,8.4,{dual:true}));
    add(4.75,8.4,()=>drawDesk('seo',4.75,8.4,{secondary:true}));
    add(1.35,10.45,()=>drawCabinet(1.35,10.45,true));
    add(5.95,10.55,()=>drawPlant(5.95,10.55,.72));
    if(kit?.drawWallArt)add(1.62,8.18,()=>at(1.62,8.18,1.05,p=>kit.drawWallArt(ctx,p.x,p.y,view.z*.82,{accent:C.green,w:36,h:24})));

    // OPERAÇÕES — core team directly below the Control Center.
    add(8.05,8.55,()=>drawDesk('operations',8.05,8.55,{dual:true}));
    add(9.95,8.55,()=>drawDesk('operations',9.95,8.55,{secondary:true}));
    if(kit?.drawPrinter)add(7.35,10.45,()=>at(7.35,10.45,.12,p=>kit.drawPrinter(ctx,p.x,p.y,view.z*.72,state.frame)));
    if(kit?.drawCredenza)add(10.95,10.38,()=>at(10.95,10.38,.08,p=>kit.drawCredenza(ctx,p.x,p.y,view.z*.66,{top:'#4d5f65'})));
    add(11.10,8.18,()=>drawPlant(11.10,8.18,.66));

    // ENGINEERING — dense workstation + infrastructure.
    add(12.35,8.4,()=>drawDesk('engineering',12.35,8.4,{dual:true}));
    add(14.25,8.4,()=>drawDesk('engineering',14.25,8.4,{secondary:true}));
    add(16.05,10.42,()=>drawCabinet(16.05,10.42,false));
    add(12.08,10.55,()=>drawPlant(12.08,10.55,.66));
    if(kit?.drawPrinter)add(15.20,10.30,()=>at(15.20,10.30,.12,p=>kit.drawPrinter(ctx,p.x,p.y,view.z*.72,state.frame)));
    if(kit?.drawServer){
      add(15.95,8.05,()=>{const p=iso(15.95,8.05);kit.drawServer(ctx,p.x,p.y,view.z*.98,state.frame);});
      add(16.28,8.55,()=>{const p=iso(16.28,8.55);kit.drawServer(ctx,p.x,p.y,view.z*.82,state.frame+19);});
    }
    return items;
  }

  function drawOfficeSigns(){
    drawDepartmentSign('manager',3.35,4.30);
    drawDepartmentSign('social',8.15,4.30);
    drawDepartmentSign('content',13.25,4.30);
    drawDepartmentSign('seo',3.90,11.05);
    drawDepartmentSign('operations',9.20,11.10);
    drawDepartmentSign('engineering',13.75,11.05);
  }

  function stationSeat(station,slot=0){
    const g=geometry[station]||geometry.operations;
    return slot>0 && g.seat2 ? g.seat2 : g.seat;
  }

  function desiredBehavior(agent){
    const b=agent?.behavior||{};
    const mode=String(b.mode||agent?.status||'idle').toLowerCase();
    const station=String(agent?.station||'operations');
    const destination=String(b.destination||station);
    let point;
    if(destination==='control_tv_watch')point=behaviorPoints.control_tv_watch;
    else if(destination==='manager_control')point={x:9.22,y:6.92};
    else if(destination==='director_wait')point=behaviorPoints.director_wait;
    else point=stationSeat(destination,Number(agent?.slot||0));
    return {mode,destination,point:{x:point.x,y:point.y},label:String(b.label||mode)};
  }

  function makeRuntime(agent,index){
    const station=String(agent.station||'operations'),start=stationSeat(station,index%2),behavior=desiredBehavior(agent);
    return {
      id:String(agent.id||('agent-'+index)),
      agent:{...agent},
      enabled:Boolean(agent.enabled),
      station,
      slot:index%2,
      x:start.x,y:start.y,
      path:[],pathIndex:0,
      phase:'spawning',phaseTimer:.25,
      finalPhase:behavior.mode,
      destination:behavior.destination,
      target:{...behavior.point},
      behavior,
      pulse:index*.53,
      currentJobId:Number(agent.current_job_id||0),
      jobStatus:String(agent.job_status||agent.status||'idle'),
      choreography:[],
      choreographyActive:false,
      eventLabel:''
    };
  }

  function officeWalkable(){
    const H=13,W=18,grid=Array.from({length:H},()=>Array(W).fill(true));
    const block=(x,y)=>{if(grid[y]?.[x]!==undefined)grid[y][x]=false;};

    // Real furniture collision map. Decorative objects and workstation cores
    // are blocked so DOTs never walk through desks, sofas, cabinets or servers.
    [[2,2],[4,3],[1,3],[7,2],[9,2],[12,2],[14,2],[16,3],
     [3,8],[5,8],[1,10],[8,9],[10,9],[7,10],[11,10],
     [12,8],[14,8],[15,10],[16,10],[16,8]].forEach(([x,y])=>block(x,y));

    // Keep the central circulation spine open.
    for(let x=3;x<=15;x++){grid[6][x]=true;grid[7][x]=true;}
    [8,9,10,11].forEach(x=>{grid[5][x]=true;grid[6][x]=true;grid[7][x]=true;});
    return grid;
  }

  function routeBetween(a,b){
    if(kit?.findPath){
      const grid=officeWalkable();
      const raw=kit.findPath(grid,a.x,a.y,b.x,b.y);
      if(raw&&raw.length>1){
        const pts=[{x:a.x,y:a.y}];
        raw.slice(1).forEach(p=>pts.push({x:p.x,y:p.y}));
        pts.push({x:b.x,y:b.y});
        return pts;
      }
    }

    const pts=[{x:a.x,y:a.y}],center=behaviorPoints.central_cross;
    const topA=a.y<5.15,topB=b.y<5.15;
    if(topA!==topB){
      pts.push({...(a.x<9.5?behaviorPoints.upper_left_gate:behaviorPoints.upper_right_gate)});
      pts.push({...center});
      pts.push({...(b.x<9.5?behaviorPoints.lower_left_gate:behaviorPoints.lower_right_gate)});
    }else if(Math.abs(a.x-b.x)>3.2||Math.abs(a.y-b.y)>2.4){
      pts.push({...center});
    }
    pts.push({x:b.x,y:b.y});
    return pts;
  }

  function sendRuntime(r,behavior,force=false){
    if(!r.enabled)return;
    const changed=force||r.destination!==behavior.destination||r.finalPhase!==behavior.mode||
      Math.hypot(r.target.x-behavior.point.x,r.target.y-behavior.point.y)>.05;
    r.behavior=behavior;r.finalPhase=behavior.mode;r.destination=behavior.destination;r.target={...behavior.point};
    r.eventLabel=String(behavior.eventLabel||behavior.label||'');
    if(!changed)return;
    const dist=Math.hypot(r.x-behavior.point.x,r.y-behavior.point.y);
    if(dist<.1){
      if(behavior.transient){r.phase='arriving';r.phaseTimer=.22;}
      else{r.phase=behavior.mode;r.phaseTimer=0;}
      return;
    }
    r.path=routeBetween({x:r.x,y:r.y},behavior.point);
    r.pathIndex=1;r.phase='walking';r.phaseTimer=0;
  }

  function assignmentPoint(station){
    return ['operations','seo'].includes(String(station))?behaviorPoints.assignment_left:behaviorPoints.assignment_right;
  }

  function runNextChoreography(r){
    if(!r.choreography.length){r.choreographyActive=false;return false;}
    const next=r.choreography.shift();
    r.choreographyActive=true;
    sendRuntime(r,next,true);
    return true;
  }

  function startChoreography(r,steps){
    r.choreography=(steps||[]).filter(Boolean);
    return runNextChoreography(r);
  }

  function syncAgents(agents,force=false){
    const ids=new Set(),enabled=(agents||[]).filter(a=>a&&a.enabled),stationCount=new Map();
    enabled.forEach((agent,index)=>{
      const id=String(agent.id||('agent-'+index)),station=String(agent.station||'operations');
      ids.add(id);
      const slot=stationCount.get(station)||0;stationCount.set(station,slot+1);
      agent={...agent,slot};
      let r=state.runtimes.get(id);
      if(!r){r=makeRuntime(agent,index);state.runtimes.set(id,r);}
      const previousJob=Number(r.currentJobId||0);
      const previousJobStatus=String(r.jobStatus||'idle');
      const nextJob=Number(agent.current_job_id||0);
      const nextJobStatus=String(agent.job_status||agent.status||'idle');
      const desired=desiredBehavior(agent);

      r.agent={...agent};r.enabled=true;r.station=station;r.slot=slot;

      if(force){
        r.choreography=[];r.choreographyActive=false;
        sendRuntime(r,desired,true);
      }else if(id!=='dot-manager' && nextJob>0 && nextJob!==previousJob){
        const hp=assignmentPoint(station);
        startChoreography(r,[
          {mode:'monitoring',destination:'manager_handoff',point:{...hp},label:'Recebendo tarefa #'+nextJob,eventLabel:'GERENTE → '+String(agent.name||'DOT'),transient:true},
          {...desired,label:String(agent.task||'Executando tarefa'),eventLabel:'TRABALHANDO · JOB #'+nextJob}
        ]);
      }else if(id!=='dot-manager' && previousJob>0 && nextJob===0){
        startChoreography(r,[
          {mode:'monitoring',destination:'completion_report',point:{...behaviorPoints.completion_report},label:'Reportando conclusão',eventLabel:'JOB #'+previousJob+' CONCLUÍDO',transient:true},
          {...desired,label:'Disponível na estação',eventLabel:'DISPONÍVEL'}
        ]);
      }else if(id!=='dot-manager' && nextJob>0 && nextJob===previousJob && nextJobStatus==='retry' && previousJobStatus!=='retry'){
        startChoreography(r,[
          {mode:'waiting',destination:'control_tv_watch',point:{...behaviorPoints.control_tv_watch},label:'Retry em análise',eventLabel:'RETRY · JOB #'+nextJob,transient:true},
          {...desired,label:String(agent.task||'Nova tentativa agendada'),eventLabel:'RETRY AGENDADO'}
        ]);
      }else if(!r.choreographyActive){
        sendRuntime(r,desired,false);
      }

      r.currentJobId=nextJob;
      r.jobStatus=nextJobStatus;
    });
    [...state.runtimes.keys()].forEach(id=>{if(!ids.has(id))state.runtimes.delete(id);});
  }

  function updateRuntime(r,dt){
    r.pulse+=dt;
    if(r.phase==='spawning'){
      r.phaseTimer-=dt;if(r.phaseTimer<=0)sendRuntime(r,r.behavior,true);return;
    }
    if(r.phase==='arriving'){
      r.phaseTimer-=dt;
      if(r.phaseTimer<=0){
        if(!runNextChoreography(r)){r.phase=r.finalPhase;}
      }
      return;
    }
    if(r.phase!=='walking')return;
    if(!r.path.length||r.pathIndex>=r.path.length){
      r.x=r.target.x;r.y=r.target.y;r.phase='arriving';r.phaseTimer=.28;return;
    }
    const t=r.path[r.pathIndex],dx=t.x-r.x,dy=t.y-r.y,dist=Math.hypot(dx,dy),step=2.05*dt;
    if(dist<=step){r.x=t.x;r.y=t.y;r.pathIndex++;if(r.pathIndex>=r.path.length){r.phase='arriving';r.phaseTimer=.28;}}
    else{r.x+=dx/dist*step;r.y+=dy/dist*step;}
  }

  function roleColors(role){
    if(role==='Gerência')return {shirt:'#3d4d55',accent:'#d7ad58'};
    if(role==='Social')return {shirt:'#2e5961',accent:'#55c9aa'};
    if(role==='Conteúdo')return {shirt:'#3a5262',accent:'#6fb7e4'};
    if(role==='SEO & Google')return {shirt:'#33564f',accent:'#72caae'};
    if(role==='Engenharia')return {shirt:'#414d61',accent:'#91a9df'};
    return {shirt:'#31515a',accent:C.teal};
  }

  function drawPixelShadow(x,y,scale=1){
    const p=iso(x,y,.02),z=view.z*scale;
    ctx.fillStyle=C.shadow;ctx.beginPath();ctx.ellipse(p.x,p.y+4*z,8*z,3*z,0,0,Math.PI*2);ctx.fill();
  }

  function drawNameTag(r,x,y,compact=false){
    const z=view.z,name=String(r.agent?.name||'Dot').replace('Dot ','');
    const progress=Math.max(0,Math.min(100,Number(r.agent?.progress||0)));
    const jobId=Number(r.agent?.current_job_id||0);
    const focused=state.hoverKey===String(r.station)||state.selectedKey===String(r.station);

    // Hide idle name cards. Show only real work or explicit focus.
    if(jobId<=0 && !focused && !r.choreographyActive)return;

    const label=jobId>0?name+' · '+progress+'%':name;
    ctx.font='900 '+Math.max(5,5.8*z)+'px ui-monospace,monospace';
    const w=ctx.measureText(label).width+12*z,h=14*z;
    ctx.fillStyle='rgba(10,16,19,.88)';ctx.strokeStyle=statusColor(r.agent?.status);ctx.lineWidth=.6*z;
    ctx.beginPath();ctx.roundRect(x-w/2,y-h,w,h,4*z);ctx.fill();ctx.stroke();
    ctx.fillStyle='#e2e9e8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x,y-h/2);
  }

  function drawPixelPerson(r,pose){
    const p=iso(r.x,r.y,pose==='working'?.42:.2),z=view.z*1.14;
    const colors=roleColors(String(r.agent?.role||''));

    if(kit?.drawAgent){
      kit.drawAgent(ctx,p.x,p.y,z,{
        pose,
        color:colors.shirt,
        accent:colors.accent,
        skin:C.skin,
        hair:C.hair,
        tick:state.frame+r.pulse*35,
        manager:String(r.agent?.role||'')==='Gerência'
      });
      if(String(r.id)==='dot-primary')drawAgentBubble(r,p.x,p.y-37*z);
      else drawNameTag(r,p.x,p.y-33*z,true);
      return;
    }
    const walk=pose==='walking';
    const seated=pose==='working';
    const waiting=pose==='waiting';
    const t=state.frame+r.pulse*35;
    const bob=walk?Math.abs(Math.sin(t*.18))*1.2*z:Math.sin(t*.035)*.45*z;
    const leg=walk?Math.sin(t*.24)*2.5*z:0;

    drawPixelShadow(r.x,r.y,seated?1.15:1);

    ctx.save();ctx.translate(0,-bob);

    if(seated){
      // legs under desk
      ctx.fillStyle='#202c33';ctx.fillRect(p.x-6*z,p.y+3*z,4*z,12*z);ctx.fillRect(p.x+1*z,p.y+4*z,4*z,11*z);
    }else{
      ctx.fillStyle='#26343b';
      ctx.fillRect(p.x-5*z,p.y-4*z,4*z,11*z+leg);
      ctx.fillRect(p.x+1*z,p.y-4*z,4*z,11*z-leg);
      ctx.fillStyle='#111b20';ctx.fillRect(p.x-6*z,p.y+7*z+leg,5*z,3*z);ctx.fillRect(p.x+1*z,p.y+7*z-leg,5*z,3*z);
    }

    // torso
    ctx.fillStyle=colors.shirt;
    ctx.fillRect(p.x-7*z,p.y-18*z,14*z,seated?18*z:16*z);
    ctx.fillStyle=colors.accent;ctx.fillRect(p.x-7*z,p.y-18*z,3*z,seated?18*z:16*z);

    // arms
    ctx.fillStyle=colors.shirt;
    if(seated){
      const typing=Math.sin(t*.22)*1.2*z;
      ctx.fillRect(p.x-10*z,p.y-14*z,4*z,9*z);
      ctx.fillRect(p.x+6*z,p.y-14*z,4*z,9*z);
      ctx.fillStyle=C.skin;
      ctx.fillRect(p.x-14*z,p.y-6*z+typing,5*z,4*z);
      ctx.fillRect(p.x+7*z,p.y-6*z-typing,5*z,4*z);
    }else if(waiting){
      ctx.fillRect(p.x-10*z,p.y-15*z,4*z,10*z);ctx.fillRect(p.x+6*z,p.y-15*z,4*z,10*z);
      ctx.fillStyle=C.skin;ctx.fillRect(p.x-4*z,p.y-8*z,8*z,4*z);
    }else{
      const arm=Math.sin(t*.24+Math.PI)*2*z;
      ctx.fillRect(p.x-10*z,p.y-16*z+arm,4*z,10*z);
      ctx.fillRect(p.x+6*z,p.y-16*z-arm,4*z,10*z);
      ctx.fillStyle=C.skin;ctx.fillRect(p.x-10*z,p.y-7*z+arm,4*z,4*z);ctx.fillRect(p.x+6*z,p.y-7*z-arm,4*z,4*z);
    }

    // head
    ctx.fillStyle=C.skin;ctx.fillRect(p.x-6*z,p.y-29*z,12*z,10*z);
    ctx.fillStyle=C.hair;ctx.fillRect(p.x-6*z,p.y-31*z,12*z,5*z);
    ctx.fillRect(p.x-7*z,p.y-29*z,3*z,7*z);

    // face only while walking/standing; seated faces workstation / away
    if(!seated){
      ctx.fillStyle='#f2f4ef';ctx.fillRect(p.x-2*z,p.y-26*z,2*z,2*z);ctx.fillRect(p.x+3*z,p.y-26*z,2*z,2*z);
      ctx.fillStyle='#1d262b';ctx.fillRect(p.x-1*z,p.y-26*z,1*z,2*z);ctx.fillRect(p.x+4*z,p.y-26*z,1*z,2*z);
    }

    if(pose==='monitoring'){
      ctx.fillStyle=C.green;ctx.fillRect(p.x+9*z,p.y-22*z,3*z,3*z);
    }
    if(waiting){
      ctx.fillStyle=C.amber;ctx.fillRect(p.x+9*z,p.y-22*z,3*z,3*z);
    }

    if(String(r.id)==='dot-primary')drawAgentBubble(r,p.x,p.y-39*z);
    else drawNameTag(r,p.x,p.y-35*z,true);

    ctx.restore();
  }

  function drawAgentBubble(r,x,y){
    const z=view.z;
    const jobId=Number(r.agent?.current_job_id||0);
    const focused=state.hoverKey===String(r.station)||state.selectedKey===String(r.station);
    if(jobId<=0 && !r.choreographyActive && !focused){
      return drawNameTag(r,x,y,true);
    }

    const stateLabel=String(r.eventLabel||r.behavior?.label||r.phase||'Ativo').toUpperCase();
    const agentName=String(r.agent?.name||'Dot').replace('Dot ','').toUpperCase();
    const task=String(r.agent?.task||'').slice(0,28);
    ctx.font='800 '+Math.max(5.2,5.8*z)+'px system-ui,sans-serif';
    const w=Math.min(144*z,Math.max(90*z,ctx.measureText(task||stateLabel).width+18*z)),h=29*z;
    ctx.fillStyle='rgba(10,16,19,.90)';ctx.strokeStyle=statusColor(r.agent?.status||r.phase);ctx.lineWidth=.7*z;
    ctx.beginPath();ctx.roundRect(x-w/2,y-h,w,h,5*z);ctx.fill();ctx.stroke();
    ctx.fillStyle=C.teal;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='900 '+Math.max(4.8,5.4*z)+'px ui-monospace,monospace';ctx.fillText((agentName+' · '+stateLabel).slice(0,28),x,y-h+8*z);
    ctx.fillStyle='#dbe5e3';ctx.font='700 '+Math.max(4.8,5.4*z)+'px system-ui,sans-serif';
    ctx.fillText(task||'Acompanhando Cotativa',x,y-h+20*z);
  }

  function drawRuntime(r){
    if(!r.enabled)return;
    if(r.phase==='walking')return drawPixelPerson(r,'walking');
    if(r.phase==='arriving')return drawPixelPerson(r,'idle');

    // Employees remain visually attached to their actual workstation. Monitoring
    // and idle-at-desk states are seated; only supervision / explicit waits stand.
    const atOwnDesk=r.destination===r.station;
    if(atOwnDesk && ['working','monitoring','idle'].includes(r.phase))return drawPixelPerson(r,'working');
    if(r.phase==='working')return drawPixelPerson(r,'working');
    if(r.phase==='waiting')return drawPixelPerson(r,'waiting');
    if(r.phase==='monitoring'||r.phase==='supervising')return drawPixelPerson(r,'monitoring');
    return drawPixelPerson(r,'idle');
  }

  function drawReservedManager(){
    const manager=state.agents.find(a=>String(a.id)==='dot-manager');
    if(manager?.enabled)return;
    const p=iso(2.7,1.05,.28),z=view.z;
    ctx.fillStyle='rgba(6,20,27,.86)';ctx.strokeStyle='#52636b';ctx.lineWidth=.7*z;
    ctx.beginPath();ctx.roundRect(p.x-43*z,p.y-12*z,86*z,17*z,3*z);ctx.fill();ctx.stroke();
    ctx.fillStyle='#a2b2b8';ctx.font='900 '+Math.max(5,6*z)+'px ui-monospace,monospace';ctx.textAlign='center';
    ctx.fillText('VAGA · GERENTE DOT',p.x,p.y-3.5*z);
  }

  function drawHUD(){
    const z=view.z,w=205*z,h=34*z,x=12*z,y=12*z;
    ctx.fillStyle='rgba(12,17,20,.72)';ctx.strokeStyle='rgba(108,149,157,.26)';ctx.lineWidth=.6*z;
    ctx.beginPath();ctx.roundRect(x,y,w,h,7*z);ctx.fill();ctx.stroke();
    ctx.fillStyle='#9aabad';ctx.font='900 '+Math.max(4.8,5.4*z)+'px ui-monospace,monospace';ctx.textAlign='left';
    ctx.fillText('DOT OFFICE · VISUAL RESET',x+9*z,y+10*z);
    ctx.fillStyle='#edf2f1';ctx.font='800 '+Math.max(5.3,6*z)+'px ui-monospace,monospace';
    ctx.fillText(String(state.employee.status_label||'').toUpperCase(),x+9*z,y+22*z);
    ctx.fillStyle=C.green;ctx.font='800 '+Math.max(4.2,4.8*z)+'px ui-monospace,monospace';
    ctx.fillText('EQUIPE '+(state.team.enabled||1)+'/'+(state.team.total||1)+' · EXEC '+(state.metrics.processing_agents||0),x+9*z,y+31*z);
  }

  function render(){
    state.hitAreas=[];
    drawFloor();

    // TeamDay-style depth queue: furniture and agents share the same render
    // order so people visually sit inside their workstations.
    const renderables=officeObjects().map(o=>({type:'f',depth:o.depth,y:o.y,fn:o.fn}));
    [...state.runtimes.values()]
      .filter(r=>r.enabled)
      .forEach(r=>renderables.push({type:'a',depth:r.x+r.y,y:r.y,r}));

    renderables
      .sort((a,b)=>a.depth-b.depth||a.y-b.y)
      .forEach(item=>item.type==='f'?item.fn():drawRuntime(item.r));

    drawOfficeSigns();
    drawReservedManager();
    drawHUD();
  }

  function tick(ts){
    if(document.hidden){state.lastTs=ts;requestAnimationFrame(tick);return;}
    const dt=Math.min(.05,(ts-state.lastTs)/1000||.016);
    state.lastTs=ts;state.frame+=dt*60;
    state.runtimes.forEach(r=>updateRuntime(r,dt));
    render();requestAnimationFrame(tick);
  }

  function pointer(event){
    const r=canvas.getBoundingClientRect();
    return{x:event.clientX-r.left,y:event.clientY-r.top};
  }

  function hitAt(p){
    return [...state.hitAreas].reverse().find(a=>p.x>=a.x&&p.x<=a.x+a.w&&p.y>=a.y&&p.y<=a.y+a.h)||null;
  }

  canvas.addEventListener('pointermove',event=>{
    const hit=hitAt(pointer(event));
    state.hoverKey=hit?String(hit.key):null;
    canvas.style.cursor=hit?'pointer':'default';
  });
  canvas.addEventListener('pointerleave',()=>{state.hoverKey=null;canvas.style.cursor='default';});
  canvas.addEventListener('click',event=>{
    const hit=hitAt(pointer(event));
    if(hit){
      state.selectedKey=String(hit.key);
      root.dispatchEvent(new CustomEvent('dot:station-click',{detail:{key:hit.key}}));
    }
  });

  const observer=new ResizeObserver(resize);
  observer.observe(canvas.parentElement||canvas);
  resize();
  syncAgents(state.agents,true);

  window.DotOfficeEngine={
    updateSnapshot(snapshot){
      if(!snapshot)return;
      (snapshot.stations||snapshot.desks||[]).forEach(s=>state.stations.set(String(s.key),s));
      state.metrics=snapshot.metrics||state.metrics;
      state.employee=snapshot.employee||state.employee;
      state.team=snapshot.team||state.team;
      state.agents=Array.isArray(snapshot.agents)?snapshot.agents:state.agents;
      state.taskBoard=Array.isArray(snapshot.task_board)?snapshot.task_board:state.taskBoard;
      syncAgents(state.agents,false);
    },
    focusStation(key){
      const r=state.runtimes.get('dot-primary'),g=geometry[String(key||'')];
      if(!r||!g)return;
      sendRuntime(r,{mode:'monitoring',destination:String(key),point:{...g.seat},label:'Visitando estação'},true);
    },
    getState(){
      return {agents:[...state.runtimes.values()].map(r=>({id:r.id,phase:r.phase,station:r.station,destination:r.destination,x:r.x,y:r.y}))};
    }
  };

  requestAnimationFrame(tick);
})();