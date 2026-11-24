(() => {
  'use strict';

  /**
   * DOT Office — TeamDay Visual Kit
   * v4.10.69
   *
   * Adapted from TeamDay-AI/business-tycoon (MIT):
   * - isometric box primitive
   * - workstation / monitor / chair drawing concepts
   * - agent body proportions / accessories
   * - A* pathfinding strategy
   *
   * Original project: https://github.com/TeamDay-AI/business-tycoon
   * License notice: /admin/assets/THIRD_PARTY_NOTICES.txt
   */

  function shadeColor(hex, amount){
    const clean=String(hex||'#777777').replace('#','');
    let r=parseInt(clean.slice(0,2),16)+amount;
    let g=parseInt(clean.slice(2,4),16)+amount;
    let b=parseInt(clean.slice(4,6),16)+amount;
    r=Math.max(0,Math.min(255,r));
    g=Math.max(0,Math.min(255,g));
    b=Math.max(0,Math.min(255,b));
    return 'rgb('+r+','+g+','+b+')';
  }

  function drawBox(ctx,x,y,bw,bh,depth,top,left,right){
    ctx.fillStyle=top;
    ctx.beginPath();
    ctx.moveTo(x,y-depth);
    ctx.lineTo(x+bw/2,y+bh/2-depth);
    ctx.lineTo(x,y+bh-depth);
    ctx.lineTo(x-bw/2,y+bh/2-depth);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle=left;
    ctx.beginPath();
    ctx.moveTo(x-bw/2,y+bh/2-depth);
    ctx.lineTo(x,y+bh-depth);
    ctx.lineTo(x,y+bh);
    ctx.lineTo(x-bw/2,y+bh/2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle=right;
    ctx.beginPath();
    ctx.moveTo(x+bw/2,y+bh/2-depth);
    ctx.lineTo(x,y+bh-depth);
    ctx.lineTo(x,y+bh);
    ctx.lineTo(x+bw/2,y+bh/2);
    ctx.closePath();
    ctx.fill();
  }

  function drawChair(ctx,cx,cy,z,opts={}){
    const manager=!!opts.manager;
    const seat=manager?'#47555e':'#37454c';
    const side=manager?'#27333a':'#1f2a30';
    drawBox(ctx,cx,cy,17*z,9*z,8*z,seat,side,shadeColor(seat,-10));
    ctx.fillStyle=side;
    ctx.fillRect(cx-5*z,cy-17*z,10*z,7*z);
    ctx.fillStyle=shadeColor(seat,10);
    ctx.fillRect(cx-4*z,cy-16*z,8*z,4*z);
    ctx.fillStyle='#172127';
    ctx.fillRect(cx-1.5*z,cy,3*z,10*z);
    ctx.fillRect(cx-8*z,cy+8*z,16*z,2*z);
  }

  function drawMonitor(ctx,cx,cy,z,opts={}){
    const screens=Math.max(1,Math.min(3,Number(opts.screens||1)));
    const tick=Number(opts.tick||0);
    const active=opts.active!==false;
    const baseHue=Number(opts.hue||165);
    const spacing=15*z;

    for(let i=0;i<screens;i++){
      const mx=cx+(i-(screens-1)/2)*spacing;
      const my=cy;
      ctx.fillStyle='#0d1115';
      ctx.fillRect(mx-10*z,my-26*z,20*z,15*z);
      ctx.fillStyle='rgba(255,255,255,.08)';
      ctx.fillRect(mx-9.5*z,my-25.5*z,19*z,1.2*z);

      const pulse=active?(.8+Math.sin(tick*.05+i*.8)*.12):.45;
      ctx.fillStyle='hsl('+((baseHue+i*34)%360)+',40%,'+(12+pulse*8)+'%)';
      ctx.fillRect(mx-8*z,my-24*z,16*z,11*z);

      ctx.fillStyle='hsla('+((baseHue+i*34)%360)+',65%,'+(38+pulse*10)+'%,.86)';
      ctx.fillRect(mx-7*z,my-22.4*z,5*z,2*z);
      ctx.fillRect(mx-1*z,my-22.4*z,6*z,2*z);
      ctx.fillStyle='rgba(220,240,255,.34)';
      ctx.fillRect(mx-7*z,my-18.7*z,12*z,1.4*z);
      ctx.fillRect(mx-7*z,my-15.7*z,9*z,1.4*z);

      ctx.fillStyle='rgba(255,255,255,.06)';
      ctx.beginPath();
      ctx.moveTo(mx-8*z,my-24*z);
      ctx.lineTo(mx-1*z,my-24*z);
      ctx.lineTo(mx-4*z,my-19*z);
      ctx.lineTo(mx-8*z,my-19*z);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle='#2a2f35';
      ctx.fillRect(mx-1.7*z,my-11*z,3.4*z,5.8*z);
      ctx.fillStyle='#3a4148';
      ctx.fillRect(mx-6*z,my-5.2*z,12*z,2.2*z);
    }
  }

  function drawWorkstation(ctx,cx,cy,z,opts={}){
    const manager=!!opts.manager;
    const compact=!!opts.compact;
    const screens=opts.screens||1;
    const active=opts.active!==false;
    const tick=opts.tick||0;
    const hue=Number(opts.hue|| (manager?42:165));

    const deskW=(compact?42:manager?64:56)*z;
    const deskH=(compact?19:manager?28:25)*z;
    const deskD=(compact?11:manager?16:14)*z;
    const top=manager?'#9b7b5d':compact?'#8b6b4f':'#927052';
    const left=manager?'#76563d':'#694834';
    const right=manager?'#856045':'#7b543b';

    drawBox(ctx,cx,cy,deskW,deskH,deskD,top,left,right);

    // Pedestal drawers, from the richer TeamDay furniture language.
    const pdx=cx-deskW*.31;
    const pdy=cy+deskH*.18;
    drawBox(ctx,pdx,pdy,13*z,8*z,16*z,'#6a5544','#4b3a31','#594337');
    ctx.fillStyle='#baa48d';
    ctx.fillRect(pdx-2*z,pdy-11*z,4*z,1*z);
    ctx.fillRect(pdx-2*z,pdy-5*z,4*z,1*z);

    // CPU tower
    const pcx=cx+deskW*.28;
    const pcy=cy+deskH*.18;
    drawBox(ctx,pcx,pcy,11*z,7*z,17*z,'#333b40','#20282d','#2a3237');
    ctx.fillStyle=active?'#54c493':'#42505a';
    ctx.fillRect(pcx+1*z,pcy-13*z,2*z,2*z);

    // Keyboard / desk mat
    ctx.fillStyle='#252c31';
    ctx.fillRect(cx-12*z,cy-deskD*.45,24*z,4.5*z);
    ctx.fillStyle='#55636a';
    for(let k=-8;k<=8;k+=4)ctx.fillRect(cx+k*z,cy-deskD*.15,2.3*z,.8*z);

    drawMonitor(ctx,cx,cy-deskD*.08,z,{screens,active,tick,hue});

    // Mug / small prop
    ctx.fillStyle=manager?'#d0b278':'#d8e2e3';
    ctx.fillRect(cx+deskW*.22,cy-deskD*.6,4*z,4*z);
    ctx.strokeStyle=manager?'#8e754c':'#80949b';
    ctx.lineWidth=.8*z;
    ctx.beginPath();
    ctx.arc(cx+deskW*.22+4*z,cy-deskD*.6+2*z,2*z,-Math.PI/2,Math.PI/2);
    ctx.stroke();

    // Desk legs
    ctx.fillStyle='#49342a';
    ctx.fillRect(cx-deskW*.36,cy+deskH*.12,3*z,12*z);
    ctx.fillRect(cx+deskW*.31,cy+deskH*.12,3*z,12*z);
  }

  function drawBookshelf(ctx,cx,cy,z){
    drawBox(ctx,cx,cy,28*z,12*z,31*z,'#715d4c','#4a3a2e','#5a4738');
    const colors=['#aa6b48','#6670a7','#4e936d','#9e5f76','#c39c56'];
    for(let i=0;i<5;i++){
      ctx.fillStyle=colors[i];
      ctx.fillRect(cx-10*z+i*4.5*z,cy-29*z,3.5*z,(7+(i%2)*2)*z);
    }
    ctx.fillStyle='#3f332a';
    ctx.fillRect(cx-11*z,cy-19*z,22*z,2*z);
  }

  function drawFilingCabinet(ctx,cx,cy,z){
    drawBox(ctx,cx,cy,23*z,11*z,28*z,'#59636a','#39444a','#465158');
    ctx.fillStyle='#2f383d';
    ctx.fillRect(cx-8*z,cy-23*z,16*z,2*z);
    ctx.fillRect(cx-8*z,cy-12*z,16*z,2*z);
    ctx.fillStyle='#8c989d';
    ctx.fillRect(cx-2.5*z,cy-20*z,5*z,1*z);
    ctx.fillRect(cx-2.5*z,cy-9*z,5*z,1*z);
  }

  function drawWhiteboard(ctx,cx,cy,z){
    ctx.fillStyle='#d7dad7';
    ctx.fillRect(cx-16*z,cy-40*z,32*z,25*z);
    ctx.fillStyle='#f8f8f1';
    ctx.fillRect(cx-14*z,cy-38*z,28*z,21*z);
    ctx.strokeStyle='#4e6cb7';
    ctx.lineWidth=1*z;
    ctx.beginPath();
    ctx.moveTo(cx-10*z,cy-32*z);ctx.lineTo(cx+7*z,cy-32*z);
    ctx.moveTo(cx-10*z,cy-27*z);ctx.lineTo(cx+2*z,cy-27*z);
    ctx.stroke();
    ctx.fillStyle='#cc6846';
    ctx.fillRect(cx+5*z,cy-36*z,7*z,6*z);
    ctx.fillStyle='#4e9a74';
    ctx.fillRect(cx-10*z,cy-22*z,8*z,3*z);
  }

  function drawPlant(ctx,cx,cy,z,tick=0){
    ctx.fillStyle='#8B6B4B';
    ctx.beginPath();
    ctx.moveTo(cx-5*z,cy);ctx.lineTo(cx-7*z,cy-7*z);
    ctx.lineTo(cx+7*z,cy-7*z);ctx.lineTo(cx+5*z,cy);
    ctx.closePath();ctx.fill();
    const lb=Math.sin(tick*.02)*z;
    ctx.fillStyle='#4a8050';
    ctx.beginPath();ctx.ellipse(cx-3*z,cy-14*z+lb,5*z,3.5*z,-.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5a9060';
    ctx.beginPath();ctx.ellipse(cx+3*z,cy-16*z-lb,4.5*z,3*z,.4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3a7040';
    ctx.beginPath();ctx.ellipse(cx,cy-18*z,3.5*z,2.5*z,0,0,Math.PI*2);ctx.fill();
  }

  function drawCoffeeMachine(ctx,cx,cy,z,tick=0){
    drawBox(ctx,cx,cy,20*z,11*z,21*z,'#45484d','#32353a','#3a3e43');
    ctx.fillStyle='#2a1710';
    ctx.fillRect(cx-3*z,cy-17*z,6*z,5*z);
    ctx.fillStyle='#5f2f18';
    ctx.fillRect(cx-2*z,cy-11*z,4*z,3*z);
    if(Math.sin(tick*.08)>0){
      ctx.fillStyle='rgba(255,255,255,.12)';
      for(let s=0;s<3;s++){
        ctx.beginPath();
        ctx.arc(cx+Math.sin(tick*.03+s)*3*z,cy-24*z-s*3.5*z,1.8*z,0,Math.PI*2);
        ctx.fill();
      }
    }
  }

  function drawServer(ctx,cx,cy,z,tick=0){
    drawBox(ctx,cx,cy,21*z,11*z,34*z,'#2b2e34','#1b1e23','#24272c');
    for(let i=0;i<5;i++){
      const on=Math.sin(tick*.1+i*1.5)>0;
      ctx.fillStyle=on?'#50c878':'#163d24';
      ctx.fillRect(cx-4*z,cy-29*z+i*4*z,2*z,2*z);
      ctx.fillStyle=on?'#e7a845':'#4a2f18';
      ctx.fillRect(cx+2*z,cy-29*z+i*4*z,2*z,2*z);
    }
  }

  function drawMeetingTable(ctx,cx,cy,z){
    drawBox(ctx,cx,cy,72*z,30*z,11*z,'#765b45','#523e31','#634b39');
    ctx.fillStyle='#c9d8db';
    ctx.fillRect(cx-10*z,cy-18*z,20*z,11*z);
    ctx.fillStyle='#4fb892';
    ctx.fillRect(cx-8*z,cy-15*z,9*z,2*z);
    ctx.fillStyle='#6a8290';
    ctx.fillRect(cx-8*z,cy-11*z,14*z,1.5*z);
  }

  function drawAgent(ctx,cx,cy,z,opts={}){
    const pose=opts.pose||'idle';
    const color=opts.color||'#31515a';
    const accent=opts.accent||'#48c198';
    const skin=opts.skin||'#b97e5f';
    const hair=opts.hair||'#17262d';
    const tick=Number(opts.tick||0);
    const manager=!!opts.manager;
    const walking=pose==='walking';
    const working=pose==='working';
    const waiting=pose==='waiting';
    const monitoring=pose==='monitoring'||pose==='supervising';
    const bob=walking?Math.abs(Math.sin(tick*.18))*1.4*z:Math.sin(tick*.035)*.45*z;
    const leg=walking?Math.sin(tick*.24)*2.8*z:0;

    ctx.save();
    ctx.translate(0,-bob);

    ctx.fillStyle='rgba(0,0,0,.24)';
    ctx.beginPath();
    ctx.ellipse(cx,cy+4*z,working?9*z:7*z,working?3.5*z:3*z,0,0,Math.PI*2);
    ctx.fill();

    if(working){
      // seated legs
      ctx.fillStyle='#232d33';
      ctx.fillRect(cx-5*z,cy-5*z,3*z,7*z);
      ctx.fillRect(cx+1*z,cy-5*z,3*z,7*z);
    }else{
      ctx.fillStyle='#2a3037';
      ctx.fillRect(cx-4*z,cy-6*z,3*z,7*z+leg);
      ctx.fillRect(cx+1*z,cy-6*z,3*z,7*z-leg);
    }

    const bodyColor=manager?'#414b52':color;
    ctx.fillStyle=bodyColor;
    ctx.fillRect(cx-6*z,cy-18*z,12*z,13*z);
    ctx.fillStyle=accent;
    ctx.fillRect(cx-6*z,cy-18*z,2.5*z,13*z);

    const arm=walking?Math.sin(tick*.24+Math.PI)*2*z:0;
    ctx.fillStyle=bodyColor;
    if(working){
      const typing=Math.sin(tick*.22)*1.2*z;
      ctx.fillRect(cx-9*z,cy-16*z,4*z,9*z);
      ctx.fillRect(cx+5*z,cy-16*z,4*z,9*z);
      ctx.fillStyle=skin;
      ctx.fillRect(cx-11*z,cy-7*z+typing,3*z,3*z);
      ctx.fillRect(cx+8*z,cy-7*z-typing,3*z,3*z);
    }else if(waiting){
      ctx.fillRect(cx-9*z,cy-16*z,4*z,9*z);
      ctx.fillRect(cx+5*z,cy-16*z,4*z,9*z);
      ctx.fillStyle=skin;
      ctx.fillRect(cx-3*z,cy-8*z,6*z,3*z);
    }else{
      ctx.fillRect(cx-9*z,cy-16*z+arm,4*z,9*z);
      ctx.fillRect(cx+5*z,cy-16*z-arm,4*z,9*z);
      ctx.fillStyle=skin;
      ctx.fillRect(cx-9*z,cy-7*z+arm,3*z,3*z);
      ctx.fillRect(cx+6*z,cy-7*z-arm,3*z,3*z);
    }

    ctx.fillStyle=skin;
    ctx.beginPath();
    ctx.arc(cx,cy-23*z,6*z,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle=hair;
    ctx.beginPath();
    ctx.arc(cx,cy-25*z,6.2*z,-Math.PI,0);
    ctx.fill();
    ctx.fillRect(cx-5.8*z,cy-25*z,2*z,5*z);

    if(!working){
      ctx.fillStyle='#f4f4ef';
      ctx.fillRect(cx-3*z,cy-24*z,2*z,2*z);
      ctx.fillRect(cx+1*z,cy-24*z,2*z,2*z);
      ctx.fillStyle='#222';
      ctx.fillRect(cx-2*z,cy-24*z,1*z,2*z);
      ctx.fillRect(cx+2*z,cy-24*z,1*z,2*z);
    }

    if(manager){
      ctx.fillStyle='#caa652';
      ctx.fillRect(cx+5*z,cy-18*z,2*z,5*z);
    }

    if(monitoring){
      ctx.fillStyle='#58b8d8';
      ctx.beginPath();ctx.arc(cx+9*z,cy-22*z,2*z,0,Math.PI*2);ctx.fill();
    }else if(waiting){
      ctx.fillStyle='#e0aa45';
      ctx.beginPath();ctx.arc(cx+9*z,cy-22*z,2*z,0,Math.PI*2);ctx.fill();
    }

    ctx.restore();
  }

  // Adapted from TeamDay's grid A* pathfinder.
  function findPath(walkable,sx,sy,ex,ey){
    sx=Math.round(sx);sy=Math.round(sy);ex=Math.round(ex);ey=Math.round(ey);
    const H=walkable.length,W=H?walkable[0].length:0;
    if(!W||!H)return null;
    if(sx===ex&&sy===ey)return[{x:ex,y:ey}];
    if(!walkable[ey]?.[ex])return null;

    const open=[],closed=new Set(),g={},f={},parent={};
    const key=(x,y)=>(x<<8)|y;
    const h=(x,y)=>Math.abs(x-ex)+Math.abs(y-ey);
    const sk=key(sx,sy);
    g[sk]=0;f[sk]=h(sx,sy);
    open.push({x:sx,y:sy,f:f[sk]});

    const dirs=[
      {dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0},
      {dx:1,dy:-1},{dx:1,dy:1},{dx:-1,dy:1},{dx:-1,dy:-1}
    ];

    let iter=0;
    while(open.length&&iter++<3000){
      let best=0;
      for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;
      const cur=open.splice(best,1)[0],ck=key(cur.x,cur.y);
      if(cur.x===ex&&cur.y===ey){
        const path=[];
        let k=ck;
        while(k!==undefined){
          path.unshift({x:k>>8,y:k&0xFF});
          k=parent[k];
        }
        return path;
      }
      closed.add(ck);

      for(const {dx,dy} of dirs){
        const nx=cur.x+dx,ny=cur.y+dy;
        if(nx<0||nx>=W||ny<0||ny>=H)continue;
        if(!walkable[ny]?.[nx])continue;
        const nk=key(nx,ny);
        if(closed.has(nk))continue;
        if(dx!==0&&dy!==0){
          if(!walkable[cur.y+dy]?.[cur.x]||!walkable[cur.y]?.[cur.x+dx])continue;
        }
        const cost=dx!==0&&dy!==0?1.41:1;
        const ng=g[ck]+cost;
        if(g[nk]===undefined||ng<g[nk]){
          parent[nk]=ck;
          g[nk]=ng;
          f[nk]=ng+h(nx,ny);
          if(!open.find(o=>o.x===nx&&o.y===ny))open.push({x:nx,y:ny,f:f[nk]});
        }
      }
    }
    return null;
  }


  // Premium environment primitives adapted from TeamDay's furniture language.
  function drawCouch(ctx,cx,cy,z,opts={}){
    const top=opts.top||'#40545e',left=opts.left||'#263840',right=opts.right||'#31464f';
    drawBox(ctx,cx,cy,42*z,18*z,11*z,top,left,right);
    ctx.fillStyle=shadeColor(top,-10);
    ctx.fillRect(cx-17*z,cy-24*z,34*z,8*z);
    ctx.fillStyle=shadeColor(top,10);
    ctx.fillRect(cx-15*z,cy-22*z,14*z,5*z);
    ctx.fillRect(cx+2*z,cy-22*z,13*z,5*z);
    ctx.fillStyle='#16252c';
    ctx.fillRect(cx-20*z,cy-14*z,4*z,13*z);
    ctx.fillRect(cx+16*z,cy-14*z,4*z,13*z);
  }

  function drawCredenza(ctx,cx,cy,z,opts={}){
    const top=opts.top||'#765b45',left=opts.left||'#4f3b30',right=opts.right||'#604737';
    drawBox(ctx,cx,cy,46*z,16*z,22*z,top,left,right);
    ctx.fillStyle='rgba(255,255,255,.12)';
    ctx.fillRect(cx-17*z,cy-18*z,13*z,1.4*z);
    ctx.fillRect(cx+4*z,cy-18*z,13*z,1.4*z);
    ctx.fillStyle='#b7a186';
    ctx.fillRect(cx-8*z,cy-13*z,4*z,1.2*z);
    ctx.fillRect(cx+8*z,cy-13*z,4*z,1.2*z);
  }

  function drawPrinter(ctx,cx,cy,z,tick=0){
    drawBox(ctx,cx,cy,24*z,13*z,14*z,'#dde3e5','#8b9aa0','#a7b5ba');
    ctx.fillStyle='#2a353b';ctx.fillRect(cx-8*z,cy-18*z,16*z,5*z);
    ctx.fillStyle='#7f9198';ctx.fillRect(cx-7*z,cy-7*z,14*z,3*z);
    const paper=(Math.sin(tick*.025)+1)*.5;
    ctx.fillStyle='#f4f4ef';ctx.fillRect(cx-6*z,cy-24*z-paper*3*z,12*z,7*z);
  }

  function drawWaterCooler(ctx,cx,cy,z,tick=0){
    drawBox(ctx,cx,cy,18*z,10*z,25*z,'#d7e0e3','#8698a0','#a6b5ba');
    ctx.fillStyle='#80d7e8';
    ctx.beginPath();ctx.ellipse(cx,cy-32*z,7*z,10*z,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.22)';
    ctx.beginPath();ctx.ellipse(cx-2*z,cy-35*z,2*z,6*z,-.2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=Math.sin(tick*.05)>0?'#58c5df':'#2d7485';ctx.fillRect(cx-5*z,cy-18*z,3*z,2*z);
    ctx.fillStyle='#e67f67';ctx.fillRect(cx+2*z,cy-18*z,3*z,2*z);
  }

  function drawFloorLamp(ctx,cx,cy,z,opts={}){
    const warm=opts.warm!==false;
    ctx.strokeStyle='#55646a';ctx.lineWidth=2*z;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy-38*z);ctx.stroke();
    ctx.fillStyle='#26353c';ctx.beginPath();ctx.ellipse(cx,cy+1*z,8*z,4*z,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=warm?'#f1d694':'#b8d9e8';
    ctx.beginPath();ctx.moveTo(cx-9*z,cy-42*z);ctx.lineTo(cx+9*z,cy-42*z);ctx.lineTo(cx+6*z,cy-32*z);ctx.lineTo(cx-6*z,cy-32*z);ctx.closePath();ctx.fill();
    const g=ctx.createRadialGradient(cx,cy-34*z,1*z,cx,cy-28*z,30*z);
    g.addColorStop(0,warm?'rgba(245,205,120,.16)':'rgba(150,210,235,.12)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(cx-34*z,cy-62*z,68*z,62*z);
  }

  function drawSideTable(ctx,cx,cy,z){
    drawBox(ctx,cx,cy,24*z,12*z,8*z,'#88684d','#5b4334','#6d4e3b');
    ctx.fillStyle='#463327';ctx.fillRect(cx-7*z,cy+1*z,3*z,13*z);ctx.fillRect(cx+4*z,cy+1*z,3*z,13*z);
  }

  function drawWallArt(ctx,cx,cy,z,opts={}){
    const accent=opts.accent||'#48c198',w=(opts.w||34)*z,h=(opts.h||24)*z;
    ctx.fillStyle='#24343b';ctx.fillRect(cx-w/2-3*z,cy-h-3*z,w+6*z,h+6*z);
    ctx.fillStyle='#e6eceb';ctx.fillRect(cx-w/2,cy-h,w,h);
    ctx.fillStyle=accent;ctx.fillRect(cx-w/2+5*z,cy-h+5*z,w*.28,4*z);
    ctx.fillStyle='#647983';ctx.fillRect(cx-w/2+5*z,cy-h+13*z,w*.58,2*z);
    ctx.fillRect(cx-w/2+5*z,cy-h+18*z,w*.42,2*z);
  }

  window.DotTeamDayKit={
    version:'1.2.0',
    source:'TeamDay-AI/business-tycoon',
    drawBox,
    shadeColor,
    drawChair,
    drawMonitor,
    drawWorkstation,
    drawBookshelf,
    drawFilingCabinet,
    drawWhiteboard,
    drawPlant,
    drawCoffeeMachine,
    drawServer,
    drawMeetingTable,
    drawCouch,
    drawCredenza,
    drawPrinter,
    drawWaterCooler,
    drawFloorLamp,
    drawSideTable,
    drawWallArt,
    drawAgent,
    findPath
  };
})();