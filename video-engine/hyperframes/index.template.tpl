<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1080,height=1920">
<title>Cotativa HyperFrames Real Templates</title>
<script src="assets/gsap.min.js"></script>
<script src="assets/shader-transitions.js"></script>
<script src="assets/premium-motion.js"></script>
<script src="assets/master-templates.js"></script>
<style>
:root{
  --rt-bg:{{THEME_BG}};
  --rt-primary:{{THEME_PRIMARY}};
  --rt-accent:{{THEME_ACCENT}};
}
*{box-sizing:border-box}
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:var(--rt-bg);font-family:Arial,Helvetica,sans-serif}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:var(--rt-bg)}
.clip{position:absolute;inset:0;overflow:hidden}
.scene-inner{position:absolute;inset:0;overflow:hidden;will-change:transform,filter,opacity}
.grid{position:absolute;inset:0;z-index:2;pointer-events:none;background-size:64px 64px}
.light-beam{position:absolute;top:-300px;bottom:-300px;width:230px;left:-360px;z-index:99;background:linear-gradient(90deg,transparent,rgba(255,255,255,.20),transparent);filter:blur(20px);transform:rotate(12deg);pointer-events:none}
.word{display:inline-block;will-change:transform,opacity,filter}
</style>
</head>
<body>
<div id="root" data-composition-id="cotativa-hyperframes" data-start="0" data-duration="{{TOTAL_DURATION}}" data-width="1080" data-height="1920">
  <div class="grid"></div>
  <div class="light-beam"></div>
{{SCENE_SECTIONS_HTML}}
</div>

<script>
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({paused:true});
var sceneStarts = {{SCENE_STARTS_JSON}};
var sceneIds = {{SCENE_IDS_JSON}};
var scenesConfig = {{SCENES_CONFIG_JSON}};
var masterTemplateConfig = {{MASTER_TEMPLATE_CONFIG_JSON}};
var themeConfig = {{THEME_CONFIG_JSON}};
var brandConfig = {{BRAND_CONFIG_JSON}};
var watermarkConfig = {{WATERMARK_CONFIG_JSON}};
var iconPack = "{{ICON_PACK}}";
var motionConfig = {{MOTION_CONFIG_JSON}};
var motionDirectorV2 = motionConfig && motionConfig.director === "cotativa_motion_director_v2";

if (window.CotativaTemplates && typeof window.CotativaTemplates.init === "function") {
  window.CotativaTemplates.init({
    id: "{{MASTER_TEMPLATE_ID}}",
    root: "#root",
    timeline: tl,
    sceneStarts: sceneStarts,
    scenes: scenesConfig,
    theme: themeConfig,
    iconPack: iconPack,
    brand: brandConfig,
    watermark: watermarkConfig,
    motionDirectorV2: motionDirectorV2,
    config: masterTemplateConfig
  });
}

function animateScene(id,start){
  var inner=document.querySelector(id+" .scene-inner");
  var words=document.querySelectorAll(id+" .headline .word");
  var kicker=document.querySelector(id+" .eyebrow");
  var body=document.querySelector(id+" .body");
  var details=document.querySelectorAll(id+" .rt-card,"+id+" .rt-panel,"+id+" .rt-step,"+id+" .rt-chip,"+id+" .rt-node,"+id+" .rt-metric");
  if(inner) tl.fromTo(inner,{scale:.985,filter:"blur(7px)"},{scale:1,filter:"blur(0px)",duration:.48,ease:"power3.out"},start);
  if(words.length) tl.fromTo(words,{opacity:0,y:62,rotateX:-42,filter:"blur(9px)"},{opacity:1,y:0,rotateX:0,filter:"blur(0px)",duration:.52,stagger:.035,ease:"expo.out"},start+.08);
  if(kicker) tl.fromTo(kicker,{opacity:0,x:-36},{opacity:1,x:0,duration:.34,ease:"power3.out"},start+.05);
  if(body) tl.fromTo(body,{opacity:0,y:22},{opacity:1,y:0,duration:.38,ease:"power2.out"},start+.52);
  if(details.length) tl.fromTo(details,{opacity:0,y:24},{opacity:1,y:0,duration:.40,stagger:.035,ease:"power2.out"},start+.72);
}
if (!motionDirectorV2) {
  for(var i=0;i<scenesConfig.length;i++) animateScene("#scene-"+i,sceneStarts[i]);
}

if (window.CotativaMotion && typeof window.CotativaMotion.init === "function") {
  window.CotativaMotion.init({
    timeline: tl,
    compositionId: "cotativa-hyperframes",
    sceneIds: sceneIds,
    sceneStarts: sceneStarts,
    scenes: scenesConfig,
    config: motionConfig,
    colors: {bg:"{{THEME_BG}}",accent:"{{THEME_ACCENT}}"}
  });
}

window.__cotativaRealTemplate = {
  version:"real-template-2",
  template:"{{MASTER_TEMPLATE_ID}}",
  theme:(themeConfig&&themeConfig.id)||"",
  iconPack:iconPack,
  watermark:watermarkConfig
};
window.__timelines["cotativa-hyperframes"] = tl;
</script>
</body>
</html>
