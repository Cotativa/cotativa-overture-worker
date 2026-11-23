(function () {
  "use strict";

  var VERSION = "premium-motion-2";
  var SHADERS = [
    "domain-warp","ridged-burn","whip-pan","sdf-iris","ripple-waves",
    "gravitational-lens","cinematic-zoom","chromatic-split","glitch",
    "swirl-vortex","thermal-distortion","flash-through-white",
    "cross-warp-morph","light-leak"
  ];

  var RECIPES = [
    "camera-rig-depth-stack","browser-device-stage","multi-device-splay",
    "chart-story","animated-bar-chart","chat-thread","zoom-through-transition",
    "light-sweep-pass","parallax-device-dive","particle-text-dissolve",
    "kinetic-type-swap","logo-brand-close","cta-lockup","grid-card-assemble",
    "grain-overlay","scanlines","chromatic-edge","flash-cut",
    "dolly-push","dolly-pull","micro-handheld","floating-cards","perspective-tilt",
    "masked-wipe","blur-reveal","split-word-rise","tracking-expand","headline-punch",
    "card-stagger","metric-pop","ui-focus-pulse","chat-cascade","chart-glow",
    "logo-orbit","cta-magnetic","noise-drift","film-gate","soft-vignette-pulse",
    "neon-edge-pulse","depth-parallax","speed-ramp-punch","editorial-slide",
    "hero-scale-breathe","background-drift","glass-refraction"
  ];

  var PACKS = {
    cinematic:[
      "camera-rig-depth-stack","dolly-push","depth-parallax","light-sweep-pass",
      "grain-overlay","film-gate","soft-vignette-pulse","hero-scale-breathe",
      "logo-brand-close"
    ],
    editorial:[
      "particle-text-dissolve","split-word-rise","tracking-expand","masked-wipe",
      "editorial-slide","blur-reveal","chromatic-edge","grain-overlay",
      "logo-brand-close"
    ],
    performance:[
      "kinetic-type-swap","headline-punch","flash-cut","speed-ramp-punch",
      "scanlines","chromatic-edge","cta-magnetic","card-stagger","metric-pop"
    ],
    product:[
      "browser-device-stage","multi-device-splay","perspective-tilt",
      "parallax-device-dive","ui-focus-pulse","chart-story","animated-bar-chart",
      "chat-cascade","glass-refraction","depth-parallax"
    ],
    ambient:[
      "floating-cards","background-drift","noise-drift","neon-edge-pulse",
      "soft-vignette-pulse","hero-scale-breathe"
    ]
  };

  function qsa(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function each(sel,fn){ qsa(sel).forEach(fn); }

  function ensureStyle() {
    if (document.getElementById("cotativa-motion-style")) return;
    var style = document.createElement("style");
    style.id = "cotativa-motion-style";
    style.textContent = [
      ".cotativa-motion-layer{position:absolute;inset:0;pointer-events:none;z-index:90;overflow:hidden}",
      ".cotativa-grain{position:absolute;inset:-12%;opacity:.055;background-image:url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.92' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.72'/%3E%3C/svg%3E\");mix-blend-mode:soft-light}",
      ".cotativa-scanlines{position:absolute;inset:-8%;opacity:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 7px);mix-blend-mode:overlay}",
      ".cotativa-chromatic{position:absolute;inset:-10%;opacity:0;background:linear-gradient(90deg,rgba(255,0,80,.16),transparent 35%,transparent 65%,rgba(0,210,255,.18));mix-blend-mode:screen}",
      ".cotativa-flash{position:absolute;inset:0;opacity:0;background:#fff;mix-blend-mode:screen}",
      ".cotativa-vignette{position:absolute;inset:0;background:radial-gradient(circle at center,transparent 42%,rgba(0,0,0,.34) 100%);opacity:.48}",
      ".cotativa-neon{position:absolute;inset:-4%;opacity:0;border:2px solid rgba(78,220,132,.3);box-shadow:inset 0 0 70px rgba(78,220,132,.16),0 0 70px rgba(72,178,210,.10)}",
      ".cotativa-glass{position:absolute;left:-22%;top:-10%;width:35%;height:125%;opacity:0;background:linear-gradient(100deg,transparent,rgba(255,255,255,.13),transparent);filter:blur(18px);transform:skewX(-14deg)}"
    ].join("");
    document.head.appendChild(style);
  }

  function ensureLayers() {
    ensureStyle();
    var root = document.getElementById("root");
    if (!root) return {};
    var layer = root.querySelector(".cotativa-motion-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "cotativa-motion-layer";
      layer.innerHTML =
        '<div class="cotativa-grain"></div><div class="cotativa-scanlines"></div>' +
        '<div class="cotativa-chromatic"></div><div class="cotativa-flash"></div>' +
        '<div class="cotativa-vignette"></div><div class="cotativa-neon"></div>' +
        '<div class="cotativa-glass"></div>';
      root.appendChild(layer);
    }
    return {
      layer:layer, grain:layer.querySelector(".cotativa-grain"),
      scanlines:layer.querySelector(".cotativa-scanlines"),
      chromatic:layer.querySelector(".cotativa-chromatic"),
      flash:layer.querySelector(".cotativa-flash"),
      vignette:layer.querySelector(".cotativa-vignette"),
      neon:layer.querySelector(".cotativa-neon"),
      glass:layer.querySelector(".cotativa-glass")
    };
  }

  function sceneTime(starts, i, offset){ return Number(starts[i] || 0) + Number(offset || 0); }

  function applyRecipe(tl, name, starts, layers) {
    if (!tl || !name) return;

    if (name === "camera-rig-depth-stack" || name === "depth-parallax") {
      each(".scene-inner",function(el,i){
        tl.fromTo(el,{x:i%2?12:-12,y:12,scale:1.018,transformPerspective:1200},
          {x:i%2?-8:8,y:-8,scale:1,duration:2.35,ease:"sine.inOut"},sceneTime(starts,i,.5));
      });
    } else if (name === "dolly-push") {
      each(".scene-inner",function(el,i){ tl.fromTo(el,{scale:1},{scale:1.045,duration:2.1,ease:"sine.inOut"},sceneTime(starts,i,.55)); });
    } else if (name === "dolly-pull") {
      each(".scene-inner",function(el,i){ tl.fromTo(el,{scale:1.045},{scale:1,duration:2.05,ease:"sine.inOut"},sceneTime(starts,i,.55)); });
    } else if (name === "micro-handheld") {
      each(".scene-inner",function(el,i){ tl.to(el,{x:3,y:-2,rotation:.12,duration:.11,yoyo:true,repeat:9,ease:"sine.inOut"},sceneTime(starts,i,1.0)); });
    } else if (name === "floating-cards") {
      each(".result,.kpi,.sat,.bubble",function(el,i){ tl.to(el,{y:i%2?-7:7,rotation:i%2?.22:-.22,duration:1.25,yoyo:true,repeat:1,ease:"sine.inOut"},4.2+i*.045); });
    } else if (name === "browser-device-stage") {
      each(".search-ui,.phone",function(el,i){ tl.to(el,{rotationY:i%2?2:-2,rotationX:1.2,scale:1.014,duration:1.15,yoyo:true,repeat:1,ease:"sine.inOut"},4.25+i*.12); });
    } else if (name === "perspective-tilt") {
      each(".search-ui,.dashboard,.phone",function(el,i){ tl.to(el,{rotationY:i%2?2.8:-2.8,rotationX:1.4,transformPerspective:1200,duration:.9,yoyo:true,repeat:1,ease:"power1.inOut"},5+i*3.25); });
    } else if (name === "multi-device-splay") {
      each(".sat",function(el,i){ tl.to(el,{rotation:(i-1.5)*1.6,x:i%2?10:-10,duration:.7,yoyo:true,repeat:1,ease:"sine.inOut"},11.45+i*.04); });
    } else if (name === "chart-story" || name === "chart-glow") {
      tl.to("#scene-2 .chart",{scale:1.028,y:-8,filter:"drop-shadow(0 0 20px rgba(78,220,132,.25))",duration:.8,yoyo:true,repeat:1,ease:"sine.inOut"},8.1);
    } else if (name === "animated-bar-chart") {
      tl.to("#scene-2 .rail",{filter:"drop-shadow(0 0 12px rgba(78,220,132,.4))",duration:.55,yoyo:true,repeat:1},8.0);
    } else if (name === "metric-pop") {
      each("#scene-2 .kpi",function(el,i){ tl.fromTo(el,{scale:.96,opacity:.86},{scale:1.035,opacity:1,duration:.34,yoyo:true,repeat:1,ease:"back.out(2)"},7.9+i*.11); });
    } else if (name === "chat-thread" || name === "chat-cascade") {
      each("#scene-4 .bubble",function(el,i){ tl.fromTo(el,{x:i%2?18:-18,opacity:.25},{x:0,opacity:1,duration:.46,ease:"power2.out"},14.75+i*.12); });
    } else if (name === "zoom-through-transition") {
      each(".scene-inner",function(el,i){ tl.to(el,{scale:1.028,duration:1.55,ease:"sine.inOut"},sceneTime(starts,i,1.0)); });
    } else if (name === "speed-ramp-punch") {
      each(".scene-inner",function(el,i){ tl.to(el,{scale:1.03,duration:.12,ease:"power4.out"},sceneTime(starts,i,2.85)).to(el,{scale:1,duration:.2,ease:"power2.in"},sceneTime(starts,i,2.98)); });
    } else if (name === "light-sweep-pass" && document.querySelector(".light-beam")) {
      [2.92,6.27,9.62,12.97].forEach(function(t){ tl.fromTo(".light-beam",{x:0,opacity:0},{x:1700,opacity:.52,duration:.42,ease:"power2.inOut"},t); tl.set(".light-beam",{x:0,opacity:0},t+.45); });
    } else if (name === "glass-refraction" && layers.glass) {
      [2.2,8.8,14.2].forEach(function(t){ tl.fromTo(layers.glass,{x:0,opacity:0},{x:1500,opacity:.72,duration:.62,ease:"power2.inOut"},t); tl.set(layers.glass,{x:0,opacity:0},t+.66); });
    } else if (name === "parallax-device-dive") {
      tl.to("#scene-4 .phone",{y:-18,rotationY:2.2,duration:.9,yoyo:true,repeat:1,ease:"sine.inOut"},14.45);
    } else if (name === "particle-text-dissolve") {
      tl.to("#scene-0 .hero-word",{letterSpacing:".025em",filter:"blur(1.4px)",opacity:.72,duration:.65,yoyo:true,repeat:1,ease:"sine.inOut"},1.65);
    } else if (name === "blur-reveal") {
      each(".headline,.body",function(el,i){ tl.fromTo(el,{filter:"blur(10px)",opacity:.15},{filter:"blur(0px)",opacity:1,duration:.58,ease:"power2.out"},.65+i*.12); });
    } else if (name === "masked-wipe") {
      each(".headline,.body",function(el,i){ tl.fromTo(el,{clipPath:"inset(0 100% 0 0)"},{clipPath:"inset(0 0% 0 0)",duration:.62,ease:"power3.out"},.55+i*.12); });
    } else if (name === "split-word-rise") {
      each(".headline .word",function(el,i){ tl.fromTo(el,{y:34,opacity:0,rotationX:-16},{y:0,opacity:1,rotationX:0,duration:.42,ease:"back.out(1.6)"},.68+(i%12)*.045); });
    } else if (name === "tracking-expand") {
      tl.fromTo(".headline",{letterSpacing:"-.075em"},{letterSpacing:"-.045em",duration:.8,ease:"sine.out"},.78);
    } else if (name === "kinetic-type-swap") {
      each(".headline .word",function(el,i){ tl.to(el,{y:i%2?-6:6,duration:.27,yoyo:true,repeat:1,ease:"power1.inOut"},.95+(i%8)*.035); });
    } else if (name === "headline-punch") {
      tl.fromTo(".headline",{scale:.94,opacity:.25},{scale:1,opacity:1,duration:.38,ease:"back.out(2.5)"},.55);
    } else if (name === "editorial-slide") {
      each(".headline,.body,.eyebrow",function(el,i){ tl.fromTo(el,{x:i%2?-42:42,opacity:0},{x:0,opacity:1,duration:.52,ease:"power3.out"},.48+i*.09); });
    } else if (name === "hero-scale-breathe") {
      tl.to("#scene-0 .headline",{scale:1.018,duration:1.25,yoyo:true,repeat:1,ease:"sine.inOut"},1.1);
    } else if (name === "logo-brand-close") {
      tl.to(".topbar strong,.footer strong",{letterSpacing:".095em",duration:.7,yoyo:true,repeat:1,ease:"sine.inOut"},15.0);
    } else if (name === "logo-orbit") {
      tl.to(".topbar strong",{x:5,y:-3,rotation:.35,duration:.5,yoyo:true,repeat:1,ease:"sine.inOut"},15.05);
    } else if (name === "cta-lockup" || name === "cta-magnetic") {
      tl.to("#scene-4 .cta-pill",{scale:1.035,y:-5,boxShadow:"0 18px 55px rgba(78,220,132,.22)",duration:.48,yoyo:true,repeat:1,ease:"back.out(1.8)"},15.45);
    } else if (name === "grid-card-assemble" || name === "card-stagger") {
      tl.fromTo("#scene-1 .result,#scene-2 .kpi,#scene-3 .sat",{clipPath:"inset(0 100% 0 0)",y:10,opacity:.4},
        {clipPath:"inset(0 0% 0 0)",y:0,opacity:1,duration:.46,stagger:.04,ease:"power3.out"},4.3);
    } else if (name === "ui-focus-pulse") {
      tl.to(".search-ui,.dashboard,.phone",{filter:"drop-shadow(0 0 26px rgba(72,178,210,.18))",duration:.6,yoyo:true,repeat:1,ease:"sine.inOut"},5.3);
    } else if (name === "background-drift") {
      tl.to(".grid",{x:18,y:-14,duration:4.2,yoyo:true,repeat:3,ease:"sine.inOut"},.2);
    } else if (name === "grain-overlay" && layers.grain) {
      tl.to(layers.grain,{opacity:.105,duration:.8,yoyo:true,repeat:3,ease:"sine.inOut"},.3);
    } else if (name === "noise-drift" && layers.grain) {
      tl.to(layers.grain,{x:7,y:-5,rotation:.18,duration:.18,yoyo:true,repeat:24,ease:"none"},.3);
    } else if (name === "scanlines" && layers.scanlines) {
      tl.to(layers.scanlines,{opacity:.12,y:7,duration:.45,yoyo:true,repeat:5,ease:"none"},3.35);
    } else if (name === "chromatic-edge" && layers.chromatic) {
      [3.25,9.95,13.30].forEach(function(t){ tl.fromTo(layers.chromatic,{opacity:0,x:-18},{opacity:.24,x:18,duration:.16,yoyo:true,repeat:1,ease:"power4.inOut"},t); });
    } else if (name === "flash-cut" && layers.flash) {
      [3.35,6.70,10.05,13.40].forEach(function(t){ tl.fromTo(layers.flash,{opacity:0},{opacity:.34,duration:.07,yoyo:true,repeat:1,ease:"power4.inOut"},t-.03); });
    } else if (name === "film-gate" && layers.vignette) {
      tl.to(layers.vignette,{opacity:.7,scale:1.015,duration:.11,yoyo:true,repeat:18,ease:"none"},.5);
    } else if (name === "soft-vignette-pulse" && layers.vignette) {
      tl.to(layers.vignette,{opacity:.62,duration:1.2,yoyo:true,repeat:3,ease:"sine.inOut"},.4);
    } else if (name === "neon-edge-pulse" && layers.neon) {
      tl.to(layers.neon,{opacity:.58,duration:.5,yoyo:true,repeat:5,ease:"sine.inOut"},2.0);
    }
  }

  function ensureDirectorV2BridgeLayer(){
    var root=document.getElementById("root")||document.body;
    var layer=document.getElementById("motion-v2-bridge-layer");
    if(layer)return layer;
    layer=document.createElement("div");
    layer.id="motion-v2-bridge-layer";
    layer.setAttribute("aria-hidden","true");
    layer.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:70;overflow:hidden;";
    layer.innerHTML='<div class="motion-v2-line"></div><div class="motion-v2-orb"></div><div class="motion-v2-frame"></div>';
    root.appendChild(layer);
    var line=layer.querySelector(".motion-v2-line"),orb=layer.querySelector(".motion-v2-orb"),frame=layer.querySelector(".motion-v2-frame");
    line.style.cssText="position:absolute;left:12%;top:51%;width:0;height:4px;border-radius:999px;background:var(--rt-accent,#4EDC84);box-shadow:0 0 28px color-mix(in srgb,var(--rt-accent,#4EDC84) 60%,transparent);opacity:0;";
    orb.style.cssText="position:absolute;left:50%;top:50%;width:18px;height:18px;border-radius:50%;background:var(--rt-accent,#4EDC84);box-shadow:0 0 44px color-mix(in srgb,var(--rt-accent,#4EDC84) 72%,transparent);opacity:0;transform:translate(-50%,-50%);";
    frame.style.cssText="position:absolute;left:50%;top:50%;width:68%;height:36%;border:2px solid color-mix(in srgb,var(--rt-accent,#4EDC84) 70%,white);border-radius:28px;opacity:0;transform:translate(-50%,-50%) scale(.78);box-shadow:0 0 70px color-mix(in srgb,var(--rt-accent,#4EDC84) 18%,transparent);";
    return layer;
  }

  function applyDirectorV2Continuity(tl, scenes, starts){
    var layer=ensureDirectorV2BridgeLayer();
    if(!layer||!tl)return;
    var line=layer.querySelector(".motion-v2-line"),orb=layer.querySelector(".motion-v2-orb"),frame=layer.querySelector(".motion-v2-frame");
    for(var i=0;i<scenes.length-1;i++){
      var edge=Number(starts[i+1]||0), d=(scenes[i]&&scenes[i].motion_direction)||{}, bridge=String(d.bridge||"");
      if(bridge==="accent_word_to_line"){
        tl.set(line,{opacity:1,width:"8%",left:"18%",top:"48%",height:5,scaleX:.15,transformOrigin:"left"},edge-.48)
          .to(line,{width:"72%",scaleX:1,left:"14%",duration:.42,ease:"expo.inOut"},edge-.48)
          .to(line,{top:"61%",height:3,duration:.20,ease:"power2.inOut"},edge-.08)
          .to(line,{opacity:0,duration:.14},edge+.10);
      }else if(bridge==="line_to_chart_axis"){
        tl.set(line,{opacity:1,width:"68%",left:"16%",top:"62%",height:3},edge-.44)
          .to(line,{rotation:-9,top:"57%",duration:.22,ease:"power2.inOut"},edge-.28)
          .to(line,{width:"78%",left:"11%",rotation:0,top:"68%",duration:.25,ease:"expo.inOut"},edge-.05)
          .to(line,{opacity:0,duration:.16},edge+.12);
      }else if(bridge==="chart_to_ui_frame"){
        tl.set(frame,{opacity:0,scale:.56,width:"58%",height:"22%",rotation:-2},edge-.48)
          .to(frame,{opacity:.88,scale:1,width:"76%",height:"38%",rotation:0,duration:.42,ease:"expo.out"},edge-.42)
          .to(frame,{borderRadius:44,scale:1.06,opacity:0,duration:.22,ease:"power3.in"},edge+.02);
      }else if(bridge==="frame_to_brand_shape"){
        tl.set(frame,{opacity:.72,scale:1,width:"64%",height:"34%",rotation:0,borderRadius:38},edge-.46)
          .to(frame,{width:300,height:300,borderRadius:"50%",scale:.82,duration:.38,ease:"expo.inOut"},edge-.40)
          .set(orb,{opacity:.78,scale:10,left:"50%",top:"50%"},edge-.08)
          .to(orb,{scale:1.2,opacity:0,duration:.28,ease:"expo.out"},edge-.08)
          .to(frame,{opacity:0,scale:1.18,duration:.20},edge+.04);
      }
    }
  }

  function applyDirectorV2(tl, scenes, starts) {
    if (!tl || !Array.isArray(scenes) || !scenes.length) return;
    applyDirectorV2Continuity(tl,scenes,starts);

    scenes.forEach(function(_,idx){
      tl.set("#scene-"+idx,{visibility:idx===0?"visible":"hidden",opacity:1},0);
    });

    scenes.forEach(function(scene,i){
      var d=(scene&&scene.motion_direction)||{};
      var root="#scene-"+i, start=Number(starts[i]||0);
      var nextStart=i<scenes.length-1?Number(starts[i+1]||0):start+Number((scene&&scene.hold_seconds)||2.65);
      var sceneDuration=Math.max(1.8,nextStart-start);
      var intro=Math.min(.58,Math.max(.34,sceneDuration*.20));
      var bodyDelay=Math.min(.62,sceneDuration*.30);
      var motionSpan=Math.max(.72,sceneDuration-.52);
      var exitDur=Math.min(.22,Math.max(.14,sceneDuration*.08));
      var exitAt=Math.max(start+.8,nextStart-exitDur);
      var headline=root+" .headline", body=root+" .body";

      if(i>0) tl.set(root,{visibility:"visible",opacity:1},start);
      tl.set(root+" .scene-inner",{opacity:1},start);
      tl.fromTo(root+" .motion-v2-stage",{backgroundPosition:"0% 0%"},{backgroundPosition:"16% 9%",duration:motionSpan,ease:"none"},start);

      if(d.entrance==="split_word_rise"){
        tl.fromTo(headline+" .word",
          {y:68,opacity:0,rotationX:-28,rotationZ:.8,filter:"blur(7px)"},
          {y:0,opacity:1,rotationX:0,rotationZ:0,filter:"blur(0px)",duration:intro,stagger:Math.min(.045,sceneDuration*.015),ease:"expo.out"},
          start+.12
        );
      }else{
        tl.fromTo(headline,
          {clipPath:"inset(0 100% 0 0)",opacity:.38},
          {clipPath:"inset(0 0% 0 0)",opacity:1,duration:intro,ease:"power3.out"},
          start+.12
        );
      }

      if(document.querySelector(body)){
        tl.fromTo(body,{y:18,opacity:0},{y:0,opacity:1,duration:Math.min(.38,intro),ease:"power2.out"},start+bodyDelay);
      }

      if(String(d.composition||"").indexOf("direct_")===0){
        tl.fromTo(root+" .mv2-direct-rule",
          {scaleX:0,opacity:.35,transformOrigin:"left"},
          {scaleX:1,opacity:1,duration:Math.min(.58,sceneDuration*.24),ease:"expo.inOut"},
          start+Math.min(.48,sceneDuration*.22)
        );
        tl.fromTo(root+" .mv2-direct-ghost .word",
          {x:64,opacity:0},
          {x:0,opacity:.045,duration:Math.min(.62,sceneDuration*.25),stagger:.025,ease:"expo.out"},
          start+Math.min(.28,sceneDuration*.14)
        );
        tl.fromTo(root+" .mv2-direct-dot",
          {scale:.25,opacity:0},
          {scale:1,opacity:1,duration:Math.min(.42,sceneDuration*.18),ease:"back.out(1.8)"},
          start+Math.min(.36,sceneDuration*.16)
        );
      }

      var cameraDuration=Math.max(.65,sceneDuration-.42);
      if(d.camera==="dolly_push") tl.fromTo(root+" .scene-inner",{scale:.995,y:8},{scale:1.045,y:-8,duration:cameraDuration,ease:"power1.inOut"},start+.10);
      else if(d.camera==="dolly_pull") tl.fromTo(root+" .scene-inner",{scale:1.045,y:-8},{scale:1,y:0,duration:cameraDuration,ease:"power1.inOut"},start+.10);
      else if(d.camera==="depth_stack") tl.fromTo(root+" .scene-inner",{scale:1.025,y:18,rotationX:1.2},{scale:1,y:-6,rotationX:-.6,duration:cameraDuration,ease:"power1.inOut"},start+.10);
      else if(d.camera==="lateral_parallax") tl.fromTo(root+" .scene-inner",{x:-24,rotationY:-1},{x:18,rotationY:.8,duration:cameraDuration,ease:"power1.inOut"},start+.10);
      else if(d.camera==="orbit_micro") tl.fromTo(root+" .scene-inner",{rotationY:-2.4,rotationX:1.1,scale:1.015},{rotationY:2,rotationX:-.8,scale:1,duration:cameraDuration,ease:"power1.inOut"},start+.10);

      if(d.composition==="brand_lockup"){
        tl.fromTo(root+" .mv2-brand-ring",{scale:.50,opacity:0,rotation:-18},{scale:1,opacity:.24,rotation:0,duration:Math.min(.72,sceneDuration*.27),ease:"expo.out"},start+.22);
        tl.fromTo(root+" .mv2-brand-logo",{scale:.84,opacity:0},{scale:1,opacity:1,duration:Math.min(.66,sceneDuration*.25),ease:"expo.out"},start+.34);
        tl.fromTo(root+" .cta-pill",{y:22,opacity:0},{y:0,opacity:1,duration:Math.min(.46,sceneDuration*.18),ease:"power3.out"},start+Math.min(.85,sceneDuration*.34));
      }
      if(d.action==="cta_magnetic"){
        tl.to(root+" .cta-pill",{scale:1.035,y:-4,duration:Math.min(.38,sceneDuration*.14),yoyo:true,repeat:1,ease:"back.out(1.7)"},start+Math.min(1.25,sceneDuration*.46));
      }

      if(i<scenes.length-1){
        var next="#scene-"+(i+1);
        tl.to(root+" .mv2-direct-rule",{opacity:0,duration:exitDur},exitAt-exitDur);
        tl.to(root+" .mv2-direct-ghost",{opacity:0,duration:exitDur},exitAt-exitDur);
        tl.to(root+" .scene-inner",{opacity:0,scale:1.012,duration:exitDur,ease:"power2.in"},exitAt);
        tl.set(root,{visibility:"hidden"},nextStart);
        tl.set(next,{visibility:"visible",opacity:1},nextStart);
      }
    });
  }
  function normalizeTransitions(config) {
    return ((config && config.transitions) || []).filter(function(item){
      return item && SHADERS.indexOf(item.shader)!==-1 && Number(item.time)>=0;
    }).map(function(item){
      return {time:Number(item.time),shader:item.shader,duration:clamp(Number(item.duration||.52),.15,1.2)};
    });
  }

  function normalizeRecipes(config){
    var list=(config&&config.recipes)||[];
    var packs=(config&&config.packs)||[];
    packs.forEach(function(pack){ (PACKS[pack]||[]).forEach(function(name){ if(list.indexOf(name)===-1) list.push(name); }); });
    return list.filter(function(name,index){ return RECIPES.indexOf(name)!==-1 && list.indexOf(name)===index; });
  }

  function init(opts) {
    opts=opts||{};
    var tl=opts.timeline, config=opts.config||{}, sceneIds=opts.sceneIds||[], starts=opts.sceneStarts||[], scenes=opts.scenes||[];
    var layers=ensureLayers(), isV2=config.director==="cotativa_motion_director_v2";
    var selectedRecipes=isV2?[]:normalizeRecipes(config);
    if(isV2) applyDirectorV2(tl,scenes,starts);
    selectedRecipes.forEach(function(name){ applyRecipe(tl,name,starts,layers); });

    var transitions=normalizeTransitions(config);
    var shaderScenes=Array.isArray(config.scene_ids)&&config.scene_ids.length
      ? config.scene_ids.filter(function(id){return sceneIds.indexOf(id)!==-1;})
      : sceneIds.slice();
    var shaderActive=false;
    if(transitions.length && shaderScenes.length===transitions.length+1 &&
       window.HyperShader && typeof window.HyperShader.init==="function"){
      var anchors=shaderScenes.map(function(id){return document.getElementById(id);}).filter(Boolean);
      anchors.forEach(function(el){el.style.opacity="0";});
      var firstIndex=sceneIds.indexOf(shaderScenes[0]);
      if(tl && firstIndex>=0) tl.set("#"+shaderScenes[0],{opacity:1},Number(starts[firstIndex]||0));
      try{
        window.HyperShader.init({
          bgColor:(opts.colors&&opts.colors.bg)||"#071520",
          accentColor:(opts.colors&&opts.colors.accent)||"#4EDC84",
          scenes:shaderScenes,transitions:transitions,timeline:tl,
          compositionId:opts.compositionId||"cotativa-hyperframes"
        });
        shaderActive=true;
      }catch(err){
        anchors.forEach(function(el){el.style.opacity="";});
        console.warn("Cotativa Motion: shader fallback",err);
      }
    }

    window.__cotativaMotion={
      version:VERSION,
      profile:config.profile||"enterprise",
      director:config.director||"legacy",
      shaders:SHADERS.slice(),
      recipes:RECIPES.slice(),
      packs:PACKS,
      selectedTransitions:transitions,
      selectedRecipes:selectedRecipes,
      shaderActive:shaderActive
    };
    return window.__cotativaMotion;
  }

  window.CotativaMotion={version:VERSION,shaders:SHADERS,recipes:RECIPES,packs:PACKS,init:init};
})();