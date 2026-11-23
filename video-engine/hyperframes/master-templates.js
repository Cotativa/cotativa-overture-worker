(function(){
"use strict";

var VERSION="real-template-2";
var IDS=["saas_dashboard","editorial_light","dark_neon_tech","corporate_minimal","performance_ads","social_cards","case_before_after","explainer_vertical"];

function q(s,r){return (r||document).querySelector(s)}
function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function words(v){return String(v||"").split(/\s+/).filter(Boolean).map(function(w){return '<span class="word">'+esc(w)+'</span>'}).join(" ")}
function icon(name,cls){return '<img class="'+(cls||"rt-icon")+'" src="assets/icons/'+esc(name||"world")+'.svg" alt="">'}
function brandTop(label,brand){return '<div class="rt-top topbar"><span>'+esc(label||"RADAR")+'</span><strong>'+esc((brand&&brand.name)||"COTATIVA")+'</strong></div>'}
function brandFoot(brand){return '<div class="rt-foot footer"><span>'+esc((brand&&brand.tagline)||"TECNOLOGIA PARA NEGÓCIOS")+'</span><strong>'+esc((brand&&brand.site)||"cotativa.com")+'</strong></div>'}
function commonText(s){return '<div class="eyebrow rt-kicker">'+icon(s.icon,'rt-kicker-icon')+'<span>'+esc(s.eyebrow||s.label||"RADAR COTATIVA")+'</span></div><h1 class="headline rt-headline">'+words(s.headline||"Tecnologia para negócios")+'</h1><p class="body rt-body">'+esc(s.body||"")+'</p>'}

function ensureStyle(){
 if(document.getElementById("cotativa-real-template-style"))return;
 var st=document.createElement("style");st.id="cotativa-real-template-style";
 st.textContent=`
 :root{
  --rt-bg:#061625;--rt-bg2:#0B263A;--rt-surface:#102F46;--rt-surface2:#173D58;
  --rt-primary:#3B82F6;--rt-accent:#7DD3FC;--rt-text:#F7FBFF;--rt-muted:#B6CBD9;
  --rt-line:rgba(125,211,252,.20);--rt-on-accent:#071520;
 }
 #root{background:var(--rt-bg)!important;color:var(--rt-text)!important}
 #root:before{display:none!important}
 .grid{opacity:.08!important;background-image:linear-gradient(var(--rt-line) 1px,transparent 1px),linear-gradient(90deg,var(--rt-line) 1px,transparent 1px)!important}
 .scene-inner{position:absolute;inset:0;overflow:hidden;background:var(--rt-bg);color:var(--rt-text);isolation:isolate}
 .cotativa-watermark{position:absolute;left:50%;top:53%;z-index:0;pointer-events:none;background:var(--wm-color,#fff);opacity:var(--wm-opacity,.055);width:var(--wm-width,82%);aspect-ratio:var(--wm-ratio,6.628);transform:translate(-50%,-50%) rotate(var(--wm-rotate,0deg));-webkit-mask-image:url("assets/brand/cotativa-horizontal.webp");mask-image:url("assets/brand/cotativa-horizontal.webp");-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-size:var(--wm-mask-size,contain);mask-size:var(--wm-mask-size,contain);-webkit-mask-position:var(--wm-mask-position,center);mask-position:var(--wm-mask-position,center);filter:blur(var(--wm-blur,0px))}
 .scene-inner>.cotativa-watermark~*{z-index:2}
 .rt-top,.rt-foot{position:absolute;left:58px;right:58px;display:flex;justify-content:space-between;align-items:center;z-index:20}
 .rt-top{top:48px}.rt-foot{bottom:42px;border-top:1px solid var(--rt-line);padding-top:18px}
 .rt-top span,.rt-kicker{font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--rt-accent)}
 .rt-top span{font-size:17px}.rt-top strong{font-size:22px;letter-spacing:.05em}
 .rt-foot{font-size:15px;color:var(--rt-muted)}.rt-foot strong{color:var(--rt-text)}
 .rt-kicker{display:flex;align-items:center;gap:14px;font-size:17px}
 .rt-kicker-icon{width:48px;height:48px;padding:10px;border-radius:14px;background:color-mix(in srgb,var(--rt-accent) 10%,transparent);border:1px solid var(--rt-line)}
 .rt-headline{margin:0;font-size:88px;line-height:.95;letter-spacing:-.055em;font-weight:900;color:var(--rt-text)}
 .rt-headline .word{display:inline-block;will-change:transform,opacity,filter}
 .rt-body{margin:0;font-size:29px;line-height:1.4;color:var(--rt-muted)}
 .rt-card,.rt-panel,.rt-step,.rt-chip,.rt-node,.rt-metric{border:1px solid var(--rt-line);background:var(--rt-surface);box-shadow:0 24px 70px rgba(0,0,0,.18)}
 .rt-icon{width:42px;height:42px}.rt-icon-lg{width:76px;height:76px}
 .rt-pill{display:inline-flex;align-items:center;gap:10px;padding:12px 17px;border-radius:999px;background:color-mix(in srgb,var(--rt-accent) 12%,transparent);border:1px solid var(--rt-line);font-size:15px;font-weight:800;letter-spacing:.08em}
 .rt-accent{color:var(--rt-accent)}.rt-primary{color:var(--rt-primary)}
 .cta-pill{background:var(--rt-accent)!important;color:var(--rt-on-accent)!important;box-shadow:0 25px 75px color-mix(in srgb,var(--rt-accent) 24%,transparent)!important}
 .search-ui,.dashboard,.orbit,.phone-wrap{position:relative}
 .result,.kpi,.sat,.bubble{border-color:var(--rt-line)!important}

 /* SaaS Dashboard */
 .tpl-saas_dashboard{background:radial-gradient(circle at 85% 15%,color-mix(in srgb,var(--rt-primary) 28%,transparent),transparent 32%),linear-gradient(155deg,var(--rt-bg),var(--rt-bg2))}
 .saas-shell{position:absolute;left:58px;right:58px;top:130px;bottom:105px}
 .saas-hero{display:grid;grid-template-columns:1.02fr .98fr;gap:36px;align-items:center;height:100%}
 .saas-copy .rt-headline{font-size:78px;margin:40px 0 28px}.saas-copy .rt-body{font-size:27px;max-width:470px}
 .saas-browser{border-radius:30px;overflow:hidden;background:var(--rt-surface);border:1px solid var(--rt-line);box-shadow:0 45px 120px rgba(0,0,0,.34);transform:perspective(1100px) rotateY(-5deg)}
 .saas-browser-head{height:58px;display:flex;align-items:center;gap:8px;padding:0 20px;background:var(--rt-surface2);border-bottom:1px solid var(--rt-line)}
 .saas-browser-head i{width:10px;height:10px;border-radius:50%;background:var(--rt-accent);opacity:.55}
 .saas-browser-body{padding:22px;display:grid;grid-template-columns:110px 1fr;gap:18px;min-height:610px}
 .saas-side{border-radius:18px;background:color-mix(in srgb,var(--rt-bg) 45%,transparent);padding:18px 12px;display:flex;flex-direction:column;gap:16px}
 .saas-side b{width:38px;height:8px;border-radius:9px;background:var(--rt-line)}
 .saas-main{display:grid;grid-template-rows:auto 1fr;gap:18px}
 .saas-titlebar{display:flex;justify-content:space-between;align-items:center}.saas-titlebar strong{font-size:20px}
 .saas-mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
 .saas-mini{border-radius:18px;padding:18px;background:color-mix(in srgb,var(--rt-surface2) 76%,transparent);border:1px solid var(--rt-line)}
 .saas-mini strong{display:block;font-size:30px;margin-top:14px}.saas-mini small{color:var(--rt-muted)}
 .saas-wide{grid-column:1/-1;height:190px;position:relative;overflow:hidden}.saas-wide:after{content:"";position:absolute;left:20px;right:20px;bottom:34px;height:3px;background:linear-gradient(90deg,var(--rt-primary),var(--rt-accent));box-shadow:0 -32px 0 color-mix(in srgb,var(--rt-accent) 10%,transparent),0 -64px 0 color-mix(in srgb,var(--rt-accent) 6%,transparent);transform:skewY(-7deg)}
 .saas-scene{position:absolute;left:58px;right:58px;top:145px;bottom:100px}.saas-scene .rt-headline{font-size:76px;margin:34px 0 20px;max-width:800px}.saas-scene .rt-body{max-width:760px}
 .saas-integrations{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:45px}.saas-integrations .rt-card{height:170px;border-radius:24px;padding:24px;display:flex;align-items:center;gap:20px}.saas-integrations b{font-size:24px}
 .saas-cta{margin-top:45px;display:grid;grid-template-columns:1fr 300px;gap:24px}.saas-lead{padding:28px;border-radius:26px}.saas-lead strong{font-size:30px}.saas-lead p{color:var(--rt-muted);font-size:20px}.saas-phone{height:520px;border:8px solid var(--rt-surface2);border-radius:48px;background:var(--rt-bg2);padding:26px;display:flex;flex-direction:column;gap:18px}.saas-phone .bubble{padding:18px;border-radius:18px;background:var(--rt-surface);font-size:18px}.saas-phone .bubble.answer{background:color-mix(in srgb,var(--rt-accent) 18%,var(--rt-surface))}

 /* Editorial */
 .tpl-editorial_light{background:var(--rt-bg);color:var(--rt-text)}
 .editorial-stage{position:absolute;inset:0;padding:105px 64px 90px;display:grid}
 .editorial-rule{position:absolute;left:64px;right:64px;top:78px;height:5px;background:var(--rt-primary)}
 .editorial-hero{grid-template-columns:160px 1fr;gap:42px;align-content:center}
 .editorial-num{font:900 180px/1 Arial;color:transparent;-webkit-text-stroke:2px var(--rt-primary);opacity:.55}
 .editorial-copy .rt-headline{font-size:100px;margin:26px 0 30px}.editorial-copy .rt-body{font-size:30px;max-width:760px}
 .editorial-columns{grid-template-columns:1.15fr .85fr;gap:52px;align-items:center}.editorial-columns .rt-headline{font-size:82px;margin:28px 0}
 .editorial-aside{padding:32px;border-left:7px solid var(--rt-primary);background:var(--rt-surface);border-radius:0 24px 24px 0}.editorial-aside strong{font-size:56px;display:block;margin-bottom:14px}.editorial-aside p{font-size:24px;line-height:1.4;color:var(--rt-muted)}
 .editorial-quote{align-content:center}.editorial-quote blockquote{margin:30px 0 0;font-size:76px;line-height:1.02;font-weight:900;letter-spacing:-.045em;max-width:900px}.editorial-quote blockquote:before{content:"“";color:var(--rt-primary);font-size:130px;line-height:.4;display:block}
 .editorial-index{grid-template-columns:.8fr 1.2fr;gap:52px;align-items:center}.editorial-index .rt-headline{font-size:78px;margin:26px 0}
 .editorial-list{display:flex;flex-direction:column;gap:14px}.editorial-item{display:grid;grid-template-columns:76px 1fr;gap:18px;align-items:center;padding:20px 0;border-bottom:1px solid var(--rt-line)}.editorial-item b{font-size:38px;color:var(--rt-primary)}.editorial-item span{font-size:23px;font-weight:800}
 .editorial-final{align-content:center;background:var(--rt-primary);margin:70px;border-radius:42px;padding:60px}.editorial-final .rt-kicker,.editorial-final .rt-body{color:color-mix(in srgb,var(--rt-text) 85%,transparent)}.editorial-final .rt-headline{font-size:94px;margin:30px 0}.editorial-final .cta-pill{display:flex;height:105px;border-radius:54px;align-items:center;justify-content:center;font-size:26px;font-weight:900;margin-top:48px;background:var(--rt-text)!important;color:var(--rt-bg)!important}

 /* Dark Neon Tech */
 .tpl-dark_neon_tech{background:radial-gradient(circle at 50% 20%,color-mix(in srgb,var(--rt-accent) 12%,transparent),transparent 28%),#05070a}
 .tech-stage{position:absolute;inset:0;padding:120px 58px 90px}
 .tech-stage:before{content:"";position:absolute;inset:0;background-image:linear-gradient(color-mix(in srgb,var(--rt-accent) 6%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--rt-accent) 6%,transparent) 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(to bottom,transparent,#000 30%,#000 75%,transparent)}
 .tech-center{text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;position:relative}.tech-center .rt-headline{font-size:100px;max-width:900px;margin:32px auto}.tech-center .rt-body{max-width:780px}
 .tech-orb{width:220px;height:220px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle,color-mix(in srgb,var(--rt-accent) 24%,transparent),transparent 65%);border:1px solid var(--rt-line);box-shadow:0 0 100px color-mix(in srgb,var(--rt-accent) 20%,transparent)}.tech-orb img{width:86px;height:86px}
 .tech-terminal{position:relative;margin-top:40px;border-radius:24px;background:#05090d;border:1px solid var(--rt-line);padding:58px 26px 26px;min-height:520px;font-family:monospace;box-shadow:0 35px 100px rgba(0,0,0,.45)}.tech-terminal:before{content:"● ● ●";position:absolute;top:20px;left:24px;color:var(--rt-accent);letter-spacing:8px}.tech-line{font-size:22px;line-height:1.7;color:var(--rt-muted)}.tech-line b{color:var(--rt-accent)}
 .tech-network{position:relative;height:760px;margin-top:30px}.tech-node{position:absolute;width:190px;height:190px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:var(--rt-surface);border:1px solid var(--rt-line);box-shadow:0 0 60px color-mix(in srgb,var(--rt-accent) 10%,transparent)}.tech-node b{font-size:20px}.tech-node.a{left:50px;top:90px}.tech-node.b{right:50px;top:30px}.tech-node.c{left:120px;bottom:55px}.tech-node.d{right:110px;bottom:90px}.tech-hub{position:absolute;left:50%;top:50%;width:230px;height:230px;margin:-115px;border-radius:40px;display:grid;place-items:center;background:linear-gradient(145deg,var(--rt-surface2),var(--rt-surface));border:1px solid var(--rt-line);font-size:26px;font-weight:900}
 .tech-hud{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:42px}.tech-hud .rt-metric{border-radius:22px;padding:24px;height:170px}.tech-hud strong{font-size:46px}.tech-hud small{display:block;color:var(--rt-muted);margin-top:10px}
 .tech-cta{margin-top:50px;border-radius:34px;padding:42px;background:linear-gradient(135deg,color-mix(in srgb,var(--rt-primary) 24%,var(--rt-surface)),var(--rt-surface));border:1px solid var(--rt-line)}.tech-cta .cta-pill{height:100px;border-radius:50px;display:flex;align-items:center;justify-content:center;font-size:25px;font-weight:900;margin-top:28px}

 /* Corporate */
 .tpl-corporate_minimal{background:var(--rt-bg)}
 .corp-stage{position:absolute;inset:0;padding:128px 64px 90px}.corp-stage .rt-headline{font-size:88px;margin:32px 0 26px;max-width:900px}.corp-stage .rt-body{max-width:720px}
 .corp-geometry{position:absolute;right:-70px;top:260px;width:450px;height:450px;border-radius:80px 0 0 80px;background:var(--rt-primary);opacity:.14;transform:rotate(14deg)}
 .corp-services{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:55px}.corp-service{padding:28px;border-radius:24px;min-height:190px}.corp-service img{width:50px}.corp-service b{display:block;font-size:26px;margin:24px 0 10px}.corp-service small{font-size:19px;color:var(--rt-muted);line-height:1.35}
 .corp-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:65px}.corp-metric{padding:28px 20px;border-radius:22px;text-align:center}.corp-metric strong{font-size:52px;display:block}.corp-metric span{font-size:16px;color:var(--rt-muted)}
 .corp-process{display:flex;flex-direction:column;gap:18px;margin-top:52px}.corp-step{display:grid;grid-template-columns:70px 1fr;gap:20px;align-items:center;padding:22px 26px;border-radius:20px}.corp-step b{font-size:36px;color:var(--rt-primary)}.corp-step strong{font-size:24px}.corp-step small{display:block;color:var(--rt-muted);margin-top:6px;font-size:17px}
 .corp-final{position:absolute;left:60px;right:60px;top:260px;bottom:210px;border-radius:44px;background:var(--rt-primary);padding:70px;display:flex;flex-direction:column;justify-content:center}.corp-final .rt-headline{font-size:96px;color:#fff}.corp-final .rt-body{color:rgba(255,255,255,.78)}.corp-final .cta-pill{margin-top:50px;height:110px;border-radius:58px;display:flex;align-items:center;justify-content:center;font-size:27px;font-weight:900;background:#fff!important;color:var(--rt-primary)!important}

 /* Performance */
 .tpl-performance_ads{background:radial-gradient(circle at 85% 10%,color-mix(in srgb,var(--rt-primary) 26%,transparent),transparent 30%),var(--rt-bg)}
 .perf-stage{position:absolute;inset:0;padding:125px 55px 90px}.perf-stage .rt-kicker{font-size:18px}.perf-stage .rt-headline{font-size:122px;line-height:.84;text-transform:uppercase;margin:54px 0 28px}.perf-stage .rt-body{max-width:740px}
 .perf-punch{position:absolute;right:40px;bottom:170px;font:900 240px/1 Arial;color:transparent;-webkit-text-stroke:2px color-mix(in srgb,var(--rt-accent) 28%,transparent)}
 .perf-adcard{margin-top:40px;border-radius:28px;padding:28px;background:var(--rt-surface);border:1px solid var(--rt-line)}.perf-ad-head{display:flex;justify-content:space-between;align-items:center}.perf-ad-head b{font-size:22px}.perf-ad-head span{padding:8px 12px;border-radius:99px;background:var(--rt-accent);color:var(--rt-on-accent);font-size:13px;font-weight:900}.perf-adcard h3{font-size:44px;margin:35px 0 18px}.perf-adcard p{font-size:21px;color:var(--rt-muted)}.perf-adcta{height:76px;border-radius:16px;background:var(--rt-primary);display:grid;place-items:center;font-size:20px;font-weight:900;margin-top:25px}
 .perf-metrics{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:42px}.perf-metric{height:220px;border-radius:26px;padding:28px}.perf-metric strong{font-size:64px;display:block}.perf-metric span{font-size:17px;color:var(--rt-muted)}
 .perf-funnel{display:flex;flex-direction:column;align-items:center;gap:16px;margin-top:38px}.perf-funnel .rt-step{height:105px;border-radius:18px;display:flex;align-items:center;justify-content:space-between;padding:0 30px;font-size:23px;font-weight:900}.perf-funnel .rt-step:nth-child(1){width:92%}.perf-funnel .rt-step:nth-child(2){width:75%}.perf-funnel .rt-step:nth-child(3){width:58%;background:var(--rt-primary);color:#fff}.perf-funnel .rt-step:nth-child(4){width:42%;background:var(--rt-accent);color:var(--rt-on-accent)}
 .perf-final{display:flex;flex-direction:column;justify-content:center;height:100%;text-align:center}.perf-final .rt-headline{font-size:132px}.perf-final .rt-body{margin:28px auto;max-width:720px}.perf-final .cta-pill{width:760px;height:120px;border-radius:62px;margin:40px auto 0;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:900}

 /* Social Cards */
 .tpl-social_cards{background:linear-gradient(160deg,var(--rt-bg),var(--rt-bg2))}
 .social-stage{position:absolute;inset:0;padding:120px 58px 90px}.social-stage .rt-headline{font-size:86px;margin:30px 0 22px}.social-stage .rt-body{max-width:740px}
 .social-stack{position:relative;height:720px;margin-top:25px}.social-card{position:absolute;width:720px;min-height:210px;border-radius:32px;padding:28px;background:var(--rt-surface);border:1px solid var(--rt-line);box-shadow:0 30px 90px rgba(0,0,0,.25)}.social-card:nth-child(1){left:20px;top:40px;transform:rotate(-4deg)}.social-card:nth-child(2){right:0;top:230px;transform:rotate(3deg);background:var(--rt-surface2)}.social-card:nth-child(3){left:85px;top:460px;transform:rotate(-1deg)}.social-card-head{display:flex;align-items:center;gap:16px}.social-avatar{width:58px;height:58px;border-radius:50%;background:var(--rt-primary);display:grid;place-items:center}.social-card b{font-size:22px}.social-card p{font-size:20px;color:var(--rt-muted);line-height:1.35}
 .social-feed{display:flex;flex-direction:column;gap:16px;margin-top:36px}.social-feed .rt-card{padding:22px;border-radius:24px;display:grid;grid-template-columns:60px 1fr auto;gap:18px;align-items:center}.social-feed strong{font-size:22px}.social-feed small{display:block;color:var(--rt-muted);margin-top:6px}.social-feed em{font-style:normal;font-weight:900;color:var(--rt-accent)}
 .social-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:50px}.social-metrics .rt-metric{padding:28px 18px;border-radius:24px;text-align:center}.social-metrics strong{font-size:50px;display:block}.social-metrics span{font-size:16px;color:var(--rt-muted)}
 .social-chat{display:flex;flex-direction:column;gap:18px;margin-top:45px}.social-chat .bubble{max-width:76%;padding:22px 25px;border-radius:24px;background:var(--rt-surface);font-size:22px;line-height:1.35}.social-chat .bubble.answer{align-self:flex-end;background:color-mix(in srgb,var(--rt-accent) 18%,var(--rt-surface2))}
 .social-final{margin-top:48px;padding:36px;border-radius:34px;background:var(--rt-surface);border:1px solid var(--rt-line)}.social-final .cta-pill{height:105px;border-radius:54px;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;margin-top:24px}

 /* Case */
 .tpl-case_before_after{background:var(--rt-bg)}
 .case-stage{position:absolute;inset:0;padding:118px 58px 90px}.case-stage .rt-headline{font-size:84px;margin:30px 0 24px}.case-stage .rt-body{max-width:760px}
 .case-split{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:45px}.case-half{min-height:690px;border-radius:32px;padding:32px;border:1px solid var(--rt-line);background:var(--rt-surface)}.case-half.after{background:linear-gradient(150deg,color-mix(in srgb,var(--rt-primary) 24%,var(--rt-surface)),var(--rt-surface))}.case-half label{font-size:16px;font-weight:900;letter-spacing:.16em}.case-half strong{font-size:58px;display:block;margin:45px 0 26px}.case-half p{font-size:22px;color:var(--rt-muted);line-height:1.4}.case-bars{display:flex;flex-direction:column;gap:14px;margin-top:40px}.case-bar{height:18px;border-radius:12px;background:color-mix(in srgb,var(--rt-muted) 12%,transparent);overflow:hidden}.case-bar i{display:block;height:100%;background:var(--rt-accent);border-radius:12px}
 .case-list{display:flex;flex-direction:column;gap:16px;margin-top:42px}.case-list .rt-card{padding:24px;border-radius:22px;display:grid;grid-template-columns:54px 1fr;gap:18px;align-items:center}.case-list b{font-size:22px}.case-list small{display:block;color:var(--rt-muted);font-size:17px;margin-top:6px}
 .case-results{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:52px}.case-results .rt-metric{height:220px;border-radius:28px;padding:30px}.case-results strong{font-size:66px;display:block}.case-results span{color:var(--rt-muted);font-size:18px}
 .case-final{position:absolute;left:58px;right:58px;top:280px;bottom:190px;border-radius:40px;padding:55px;background:linear-gradient(135deg,var(--rt-primary),color-mix(in srgb,var(--rt-primary) 55%,var(--rt-bg)))}.case-final .rt-headline{font-size:92px;color:#fff}.case-final .rt-body{color:rgba(255,255,255,.8)}.case-final .cta-pill{height:110px;border-radius:56px;display:flex;align-items:center;justify-content:center;font-size:27px;font-weight:900;margin-top:42px;background:#fff!important;color:var(--rt-primary)!important}

 /* Explainer */
 .tpl-explainer_vertical{background:linear-gradient(180deg,var(--rt-bg),var(--rt-bg2))}
 .ex-stage{position:absolute;inset:0;padding:120px 58px 90px}.ex-stage .rt-headline{font-size:86px;margin:30px 0 22px}.ex-stage .rt-body{max-width:740px}
 .ex-number{position:absolute;right:40px;top:135px;font:900 210px/1 Arial;color:transparent;-webkit-text-stroke:2px color-mix(in srgb,var(--rt-accent) 25%,transparent)}
 .ex-step-card{margin-top:55px;border-radius:34px;padding:38px;background:var(--rt-surface);border:1px solid var(--rt-line);display:grid;grid-template-columns:130px 1fr;gap:28px;align-items:center}.ex-step-icon{width:120px;height:120px;border-radius:32px;background:color-mix(in srgb,var(--rt-primary) 20%,transparent);display:grid;place-items:center}.ex-step-icon img{width:62px;height:62px}.ex-step-card strong{font-size:34px}.ex-step-card p{font-size:22px;color:var(--rt-muted);line-height:1.4}
 .ex-diagram{position:relative;height:690px;margin-top:35px}.ex-hub{position:absolute;left:50%;top:50%;width:230px;height:230px;margin:-115px;border-radius:50%;display:grid;place-items:center;background:var(--rt-primary);color:#fff;font-size:24px;font-weight:900;box-shadow:0 30px 90px color-mix(in srgb,var(--rt-primary) 25%,transparent)}.ex-node{position:absolute;width:220px;height:150px;border-radius:28px;display:flex;align-items:center;gap:16px;padding:22px}.ex-node.a{left:20px;top:60px}.ex-node.b{right:10px;top:115px}.ex-node.c{left:80px;bottom:70px}.ex-node.d{right:55px;bottom:40px}.ex-node b{font-size:20px}
 .ex-checks{display:flex;flex-direction:column;gap:17px;margin-top:46px}.ex-check{padding:22px 25px;border-radius:20px;display:grid;grid-template-columns:48px 1fr;gap:18px;align-items:center}.ex-check i{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--rt-accent);color:var(--rt-on-accent);font-style:normal;font-weight:900}.ex-check strong{font-size:23px}
 .ex-final{display:flex;flex-direction:column;justify-content:center;height:100%}.ex-final .rt-headline{font-size:98px}.ex-final .cta-pill{height:112px;border-radius:58px;display:flex;align-items:center;justify-content:center;font-size:27px;font-weight:900;margin-top:45px}
 `;
 document.head.appendChild(st);
}

function applyTheme(root,theme){
 var c=(theme&&theme.colors)||{};
 var vars={bg:c.bg,bg2:c.bg2,surface:c.surface,surface2:c.surface2,primary:c.primary,accent:c.accent,text:c.text,muted:c.muted,line:c.line};
 Object.keys(vars).forEach(function(k){if(vars[k])root.style.setProperty("--rt-"+k,vars[k])});
 root.style.setProperty("--rt-on-accent",(theme&&theme.mode)==="light"?"#FFFFFF":"#071520");
 root.setAttribute("data-theme",(theme&&theme.id)||"enterprise_blue");
 root.setAttribute("data-theme-mode",(theme&&theme.mode)||"dark");
}

function applyWatermark(root,id,watermark,theme){
 watermark=watermark||{};
 var enabled=watermark.enabled!==false&&String(watermark.mode||"subtle")!=="off";
 var mode=String(watermark.mode||"subtle");
 var opacity={off:0,subtle:.055,medium:.085,brand_heavy:.13}[mode];
 if(typeof opacity!=="number")opacity=.055;
 var variant=String(watermark.variant||"auto");
 var autoMap={
  saas_dashboard:"full_logo",editorial_light:"wordmark",dark_neon_tech:"symbol",corporate_minimal:"wordmark",
  performance_ads:"symbol",social_cards:"symbol",case_before_after:"full_logo",explainer_vertical:"full_logo"
 };
 if(variant==="auto")variant=autoMap[id]||"full_logo";
 var light=(theme&&theme.mode)==="light";
 root.style.setProperty("--wm-opacity",enabled?String(opacity):"0");
 root.style.setProperty("--wm-color",light?"#0A2233":"#FFFFFF");
 root.style.setProperty("--wm-blur",mode==="brand_heavy"?"0px":"0.15px");
 if(variant==="symbol"){
  root.style.setProperty("--wm-width","56%");
  root.style.setProperty("--wm-ratio","1.876");
  root.style.setProperty("--wm-mask-size","auto 100%");
  root.style.setProperty("--wm-mask-position","left center");
  root.style.setProperty("--wm-rotate","-7deg");
 }else if(variant==="wordmark"){
  root.style.setProperty("--wm-width","84%");
  root.style.setProperty("--wm-ratio","4.433");
  root.style.setProperty("--wm-mask-size","auto 100%");
  root.style.setProperty("--wm-mask-position","right center");
  root.style.setProperty("--wm-rotate","0deg");
 }else{
  root.style.setProperty("--wm-width","84%");
  root.style.setProperty("--wm-ratio","6.628");
  root.style.setProperty("--wm-mask-size","contain");
  root.style.setProperty("--wm-mask-position","center");
  root.style.setProperty("--wm-rotate","0deg");
 }
 root.setAttribute("data-watermark",enabled?"on":"off");
 root.setAttribute("data-watermark-mode",mode);
 root.setAttribute("data-watermark-variant",variant);
 return {enabled:enabled,mode:mode,variant:variant,opacity:enabled?opacity:0};
}

function saas(s,i,b){
 var top=brandTop(s.label,b),foot=brandFoot(b);
 if(i===0)return '<div class="saas-shell saas-hero">'+
  '<div class="saas-copy">'+commonText(s)+'<div class="rt-pill">'+icon("sparkles")+'VISÃO DIGITAL</div></div>'+
  '<div class="saas-browser search-ui rt-panel"><div class="saas-browser-head"><i></i><i></i><i></i></div><div class="saas-browser-body"><div class="saas-side"><b></b><b></b><b></b><b></b><b></b></div><div class="saas-main"><div class="saas-titlebar"><strong>Growth OS</strong><span class="rt-pill">LIVE</span></div><div class="saas-mini-grid"><div class="saas-mini kpi"><small>VISIBILIDADE</small><strong>+68%</strong></div><div class="saas-mini kpi"><small>LEADS</small><strong>↑ 3.2x</strong></div><div class="saas-mini saas-wide chart"></div></div></div></div></div>'+
  '</div>'+top+foot;
 if(i===1)return '<div class="saas-scene">'+commonText(s)+'<div class="saas-browser search-ui rt-panel"><div class="saas-browser-head"><i></i><i></i><i></i></div><div class="saas-browser-body"><div class="saas-side"><b></b><b></b><b></b></div><div class="saas-main"><div class="rt-pill">'+icon("search")+'BUSCA COM INTENÇÃO</div><div class="saas-mini-grid"><div class="saas-mini result featured"><small>SEO</small><strong>Encontrado</strong></div><div class="saas-mini result"><small>UX</small><strong>Entendido</strong></div><div class="saas-mini saas-wide result"><small>CONVERSÃO</small><strong>'+esc(s.accent||"Oportunidade")+'</strong></div></div></div></div></div></div>'+top+foot;
 if(i===2)return '<div class="saas-scene">'+commonText(s)+'<div class="dashboard saas-mini-grid" style="margin-top:48px"><div class="saas-mini kpi"><small>ALCANCE</small><strong>+68%</strong></div><div class="saas-mini kpi"><small>INTENÇÃO</small><strong>+41%</strong></div><div class="saas-mini kpi"><small>CONTATOS</small><strong>3.2x</strong></div><div class="saas-mini kpi"><small>EFICIÊNCIA</small><strong>↑</strong></div><div class="saas-mini saas-wide chart"></div></div></div>'+top+foot;
 if(i===3)return '<div class="saas-scene">'+commonText(s)+'<div class="saas-integrations orbit"><div class="rt-card sat">'+icon("search")+'<b>SEO</b></div><div class="rt-card sat">'+icon("megaphone")+'<b>ADS</b></div><div class="rt-card sat">'+icon("laptop")+'<b>SITE</b></div><div class="rt-card sat">'+icon("message")+'<b>LEADS</b></div></div></div>'+top+foot;
 return '<div class="saas-scene">'+commonText(s)+'<div class="saas-cta phone-wrap"><div class="saas-lead rt-panel"><strong>Estratégia conectada</strong><p>Conteúdo, mídia, site e conversão trabalhando na mesma direção.</p><div class="cta-pill" style="height:96px;border-radius:50px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;margin-top:30px">FALE COM A COTATIVA</div></div><div class="saas-phone phone"><div class="bubble">Quero mais oportunidades.</div><div class="bubble answer">Vamos estruturar.</div></div></div></div>'+top+foot;
}
function editorial(s,i,b){
 var top=brandTop(s.label,b),foot=brandFoot(b);
 if(i===0)return '<div class="editorial-rule"></div><div class="editorial-stage editorial-hero"><div class="editorial-num">01</div><div class="editorial-copy">'+commonText(s)+'</div></div>'+top+foot;
 if(i===1)return '<div class="editorial-rule"></div><div class="editorial-stage editorial-columns"><div>'+commonText(s)+'</div><aside class="editorial-aside rt-panel"><strong>'+esc(s.accent||"Ponto-chave")+'</strong><p>'+esc(s.body||"")+'</p></aside></div>'+top+foot;
 if(i===2)return '<div class="editorial-rule"></div><div class="editorial-stage editorial-quote"><div class="rt-kicker eyebrow">'+icon(s.icon,'rt-kicker-icon')+'<span>'+esc(s.eyebrow)+'</span></div><blockquote class="headline">'+words(s.headline)+'</blockquote><p class="rt-body body" style="margin-top:34px">'+esc(s.body)+'</p></div>'+top+foot;
 if(i===3)return '<div class="editorial-rule"></div><div class="editorial-stage editorial-index"><div>'+commonText(s)+'</div><div class="editorial-list"><div class="editorial-item rt-step"><b>01</b><span>Diagnóstico</span></div><div class="editorial-item rt-step"><b>02</b><span>Prioridade</span></div><div class="editorial-item rt-step"><b>03</b><span>Execução</span></div><div class="editorial-item rt-step"><b>04</b><span>Medição</span></div></div></div>'+top+foot;
 return '<div class="editorial-stage editorial-final">'+commonText(s)+'<div class="cta-pill">TRANSFORME PRESENÇA EM OPORTUNIDADE</div></div>'+foot;
}
function tech(s,i,b){
 var top=brandTop(s.label,b),foot=brandFoot(b);
 if(i===0)return '<div class="tech-stage"><div class="tech-center"><div class="tech-orb rt-node">'+icon(s.icon,'rt-icon-lg')+'</div>'+commonText(s)+'<div class="rt-pill">SYSTEM / SIGNAL / READY</div></div></div>'+top+foot;
 if(i===1)return '<div class="tech-stage">'+commonText(s)+'<div class="tech-terminal rt-panel"><div class="tech-line"><b>01</b> detect_signal()</div><div class="tech-line"><b>02</b> map_intent()</div><div class="tech-line"><b>03</b> build_experience()</div><div class="tech-line"><b>04</b> connect_conversion()</div><div class="tech-line"><b>&gt;</b> '+esc(s.accent||"growth.ready")+'</div></div></div>'+top+foot;
 if(i===2)return '<div class="tech-stage">'+commonText(s)+'<div class="tech-network orbit"><div class="tech-hub core">COTATIVA</div><div class="tech-node rt-node sat a">'+icon("search")+'<b>SEARCH</b></div><div class="tech-node rt-node sat b">'+icon("chart")+'<b>DATA</b></div><div class="tech-node rt-node sat c">'+icon("code")+'<b>WEB</b></div><div class="tech-node rt-node sat d">'+icon("message")+'<b>LEADS</b></div></div></div>'+top+foot;
 if(i===3)return '<div class="tech-stage">'+commonText(s)+'<div class="tech-hud dashboard"><div class="rt-metric kpi"><strong>99</strong><small>signals mapped</small></div><div class="rt-metric kpi"><strong>4x</strong><small>connected channels</small></div><div class="rt-metric kpi"><strong>24/7</strong><small>digital presence</small></div><div class="rt-metric kpi"><strong>↑</strong><small>opportunity flow</small></div></div></div>'+top+foot;
 return '<div class="tech-stage">'+commonText(s)+'<div class="tech-cta rt-panel"><div class="rt-pill">'+icon("rocket")+'NEXT MOVE</div><div class="cta-pill">ATIVAR ESTRATÉGIA DIGITAL</div></div></div>'+top+foot;
}
function corporate(s,i,b){
 var top=brandTop(s.label,b),foot=brandFoot(b);
 if(i===0)return '<div class="corp-geometry"></div><div class="corp-stage">'+commonText(s)+'<div class="rt-pill" style="margin-top:38px">'+icon("building")+'ESTRUTURA PARA NEGÓCIOS</div></div>'+top+foot;
 if(i===1)return '<div class="corp-stage">'+commonText(s)+'<div class="corp-services"><div class="corp-service rt-card">'+icon("search")+'<b>Encontrabilidade</b><small>SEO, Google e presença local.</small></div><div class="corp-service rt-card">'+icon("laptop")+'<b>Experiência</b><small>Site claro, rápido e confiável.</small></div><div class="corp-service rt-card">'+icon("megaphone")+'<b>Aquisição</b><small>Mídia focada em intenção.</small></div><div class="corp-service rt-card">'+icon("message")+'<b>Conversão</b><small>Jornada conectada ao contato.</small></div></div></div>'+top+foot;
 if(i===2)return '<div class="corp-stage">'+commonText(s)+'<div class="corp-metrics dashboard"><div class="corp-metric rt-metric kpi"><strong>+68%</strong><span>VISIBILIDADE</span></div><div class="corp-metric rt-metric kpi"><strong>3.2x</strong><span>OPORTUNIDADES</span></div><div class="corp-metric rt-metric kpi"><strong>↑</strong><span>EFICIÊNCIA</span></div></div></div>'+top+foot;
 if(i===3)return '<div class="corp-stage">'+commonText(s)+'<div class="corp-process"><div class="corp-step rt-step"><b>01</b><div><strong>Diagnosticar</strong><small>Entender gargalos e objetivo.</small></div></div><div class="corp-step rt-step"><b>02</b><div><strong>Priorizar</strong><small>Começar onde existe maior impacto.</small></div></div><div class="corp-step rt-step"><b>03</b><div><strong>Construir</strong><small>Conectar presença, mídia e conversão.</small></div></div><div class="corp-step rt-step"><b>04</b><div><strong>Medir</strong><small>Evoluir com dados reais.</small></div></div></div></div>'+top+foot;
 return '<div class="corp-final">'+commonText(s)+'<div class="cta-pill">CONVERSE COM A COTATIVA</div></div>'+foot;
}
function performance(s,i,b){
 var top=brandTop(s.label,b),foot=brandFoot(b);
 if(i===0)return '<div class="perf-stage perf-final">'+commonText(s)+'<div class="perf-punch">01</div></div>'+top+foot;
 if(i===1)return '<div class="perf-stage">'+commonText(s)+'<div class="perf-adcard search-ui rt-panel"><div class="perf-ad-head"><b>ANÚNCIO</b><span>ALTA INTENÇÃO</span></div><h3>'+esc(s.accent||"Oferta certa. Hora certa.")+'</h3><p>'+esc(s.body)+'</p><div class="perf-adcta">QUERO SABER MAIS</div></div></div>'+top+foot;
 if(i===2)return '<div class="perf-stage">'+commonText(s)+'<div class="perf-metrics dashboard"><div class="perf-metric rt-metric kpi"><strong>+68%</strong><span>ALCANCE QUALIFICADO</span></div><div class="perf-metric rt-metric kpi"><strong>3.2x</strong><span>MAIS CONTATOS</span></div><div class="perf-metric rt-metric kpi"><strong>-21%</strong><span>DESPERDÍCIO</span></div><div class="perf-metric rt-metric kpi"><strong>↑</strong><span>CONVERSÃO</span></div></div></div>'+top+foot;
 if(i===3)return '<div class="perf-stage">'+commonText(s)+'<div class="perf-funnel"><div class="rt-step">IMPRESSÃO <span>100%</span></div><div class="rt-step">CLIQUE <span>48%</span></div><div class="rt-step">INTENÇÃO <span>24%</span></div><div class="rt-step">LEAD <span>12%</span></div></div></div>'+top+foot;
 return '<div class="perf-stage perf-final">'+commonText(s)+'<div class="cta-pill">GERAR MAIS OPORTUNIDADES</div></div>'+top+foot;
}
function social(s,i,b){
 var top=brandTop(s.label,b),foot=brandFoot(b);
 if(i===0)return '<div class="social-stage">'+commonText(s)+'<div class="social-stack"><div class="social-card rt-card"><div class="social-card-head"><span class="social-avatar">'+icon("sparkles")+'</span><b>Conteúdo relevante</b></div><p>Uma mensagem clara vira atenção.</p></div><div class="social-card rt-card"><div class="social-card-head"><span class="social-avatar">'+icon("users")+'</span><b>Pessoas certas</b></div><p>Distribuição encontra quem tem interesse.</p></div><div class="social-card rt-card"><div class="social-card-head"><span class="social-avatar">'+icon("message")+'</span><b>Conversa</b></div><p>A jornada termina em contato.</p></div></div></div>'+top+foot;
 if(i===1)return '<div class="social-stage">'+commonText(s)+'<div class="social-feed"><div class="rt-card result">'+icon("search")+'<div><strong>Descoberta</strong><small>Google e conteúdo</small></div><em>+42%</em></div><div class="rt-card result">'+icon("megaphone")+'<div><strong>Distribuição</strong><small>Mídia e social</small></div><em>+31%</em></div><div class="rt-card result">'+icon("message")+'<div><strong>Conversa</strong><small>WhatsApp e leads</small></div><em>3.2x</em></div></div></div>'+top+foot;
 if(i===2)return '<div class="social-stage">'+commonText(s)+'<div class="social-metrics dashboard"><div class="rt-metric kpi"><strong>18K</strong><span>ALCANCE</span></div><div class="rt-metric kpi"><strong>7.4%</strong><span>ENGAJAMENTO</span></div><div class="rt-metric kpi"><strong>3.2x</strong><span>CONTATOS</span></div></div></div>'+top+foot;
 if(i===3)return '<div class="social-stage">'+commonText(s)+'<div class="social-chat phone-wrap"><div class="bubble">Vi seu conteúdo e quero entender melhor.</div><div class="bubble answer">Perfeito. Qual é o seu objetivo?</div><div class="bubble">Quero vender mais pela internet.</div><div class="bubble answer">Vamos mapear a prioridade.</div></div></div>'+top+foot;
 return '<div class="social-stage">'+commonText(s)+'<div class="social-final rt-panel"><strong style="font-size:30px">Conteúdo que termina em conversa.</strong><div class="cta-pill">FALE COM A COTATIVA</div></div></div>'+top+foot;
}
function caseTpl(s,i,b){
 var top=brandTop(s.label,b),foot=brandFoot(b);
 if(i===0)return '<div class="case-stage">'+commonText(s)+'<div class="case-split"><div class="case-half"><label>ANTES</label><strong>Presença sem direção</strong><p>Baixa descoberta, mensagem genérica e jornada fragmentada.</p><div class="case-bars"><div class="case-bar"><i style="width:28%"></i></div><div class="case-bar"><i style="width:20%"></i></div><div class="case-bar"><i style="width:35%"></i></div></div></div><div class="case-half after"><label>DEPOIS</label><strong>Estrutura conectada</strong><p>Clareza, encontrabilidade, aquisição e contato trabalhando juntos.</p><div class="case-bars"><div class="case-bar"><i style="width:82%"></i></div><div class="case-bar"><i style="width:76%"></i></div><div class="case-bar"><i style="width:90%"></i></div></div></div></div></div>'+top+foot;
 if(i===1)return '<div class="case-stage">'+commonText(s)+'<div class="case-list"><div class="rt-card">'+icon("search")+'<div><b>Não aparece</b><small>Descoberta limitada.</small></div></div><div class="rt-card">'+icon("laptop")+'<div><b>Não convence</b><small>Experiência pouco clara.</small></div></div><div class="rt-card">'+icon("target")+'<div><b>Não converte</b><small>Jornada sem próximo passo.</small></div></div></div></div>'+top+foot;
 if(i===2)return '<div class="case-stage">'+commonText(s)+'<div class="case-list"><div class="rt-card">'+icon("lightbulb")+'<div><b>Posicionamento</b><small>Mensagem orientada ao objetivo.</small></div></div><div class="rt-card">'+icon("workflow")+'<div><b>Estrutura</b><small>Canais conectados.</small></div></div><div class="rt-card">'+icon("chart")+'<div><b>Medição</b><small>Evolução baseada em dados.</small></div></div></div></div>'+top+foot;
 if(i===3)return '<div class="case-stage">'+commonText(s)+'<div class="case-results dashboard"><div class="rt-metric kpi"><strong>+68%</strong><span>VISIBILIDADE</span></div><div class="rt-metric kpi"><strong>3.2x</strong><span>CONTATOS</span></div><div class="rt-metric kpi"><strong>+41%</strong><span>INTENÇÃO</span></div><div class="rt-metric kpi"><strong>↓</strong><span>ATRITO</span></div></div></div>'+top+foot;
 return '<div class="case-final">'+commonText(s)+'<div class="cta-pill">CONSTRUIR O PRÓXIMO RESULTADO</div></div>'+foot;
}
function explainer(s,i,b){
 var top=brandTop(s.label,b),foot=brandFoot(b);
 if(i===0)return '<div class="ex-stage"><div class="ex-number">01</div>'+commonText(s)+'<div class="ex-step-card rt-card"><div class="ex-step-icon">'+icon(s.icon,'rt-icon-lg')+'</div><div><strong>'+esc(s.accent||"Comece pelo essencial")+'</strong><p>'+esc(s.body)+'</p></div></div></div>'+top+foot;
 if(i===1)return '<div class="ex-stage"><div class="ex-number">02</div>'+commonText(s)+'<div class="ex-step-card rt-card"><div class="ex-step-icon">'+icon("search",'rt-icon-lg')+'</div><div><strong>Identifique a intenção</strong><p>Descubra o que seu cliente procura e em qual momento ele precisa de você.</p></div></div></div>'+top+foot;
 if(i===2)return '<div class="ex-stage">'+commonText(s)+'<div class="ex-diagram orbit"><div class="ex-hub core">ESTRATÉGIA</div><div class="ex-node rt-node sat a">'+icon("search")+'<b>DESCOBERTA</b></div><div class="ex-node rt-node sat b">'+icon("laptop")+'<b>EXPERIÊNCIA</b></div><div class="ex-node rt-node sat c">'+icon("megaphone")+'<b>AQUISIÇÃO</b></div><div class="ex-node rt-node sat d">'+icon("message")+'<b>CONVERSÃO</b></div></div></div>'+top+foot;
 if(i===3)return '<div class="ex-stage">'+commonText(s)+'<div class="ex-checks"><div class="ex-check rt-card"><i>✓</i><strong>Mensagem clara</strong></div><div class="ex-check rt-card"><i>✓</i><strong>Página preparada</strong></div><div class="ex-check rt-card"><i>✓</i><strong>Tráfego com intenção</strong></div><div class="ex-check rt-card"><i>✓</i><strong>Contato fácil</strong></div></div></div>'+top+foot;
 return '<div class="ex-stage ex-final">'+commonText(s)+'<div class="cta-pill">APLICAR NO SEU NEGÓCIO</div></div>'+top+foot;
}

function ensureMotionV2Style(){
 if(document.getElementById("cotativa-motion-v2-stage-style"))return;
 var st=document.createElement("style");st.id="cotativa-motion-v2-stage-style";
 st.textContent='.motion-v2-stage{position:absolute;inset:0;padding:250px 86px 300px;overflow:hidden;perspective:1400px;transform-style:preserve-3d;background:radial-gradient(circle at 78% 18%,color-mix(in srgb,var(--rt-primary) 16%,transparent),transparent 30%),radial-gradient(circle at 18% 78%,color-mix(in srgb,var(--rt-accent) 10%,transparent),transparent 34%),linear-gradient(155deg,var(--rt-bg),var(--rt-bg2))}.motion-v2-stage:before{content:"";position:absolute;inset:170px 54px 260px;border:1px solid transparent;pointer-events:none}.motion-v2-stage .rt-headline{max-width:900px;font-size:78px;line-height:.96;letter-spacing:-.05em;text-wrap:balance}.motion-v2-stage .rt-body{max-width:760px;font-size:27px;line-height:1.34}.mv2-kinetic .rt-headline{font-size:108px;line-height:.88;max-width:930px}.mv2-search .rt-headline{font-size:82px}.mv2-data .rt-headline{font-size:76px;max-width:820px}.mv2-system .rt-headline{font-size:74px;max-width:840px}.mv2-brand .rt-headline{font-size:82px}.mv2-type-echo{position:absolute;left:70px;right:-300px;bottom:250px;font-size:138px;font-weight:950;line-height:.8;opacity:.055;white-space:nowrap;transform:rotate(-7deg)}.mv2-accent-rail{position:absolute;left:86px;bottom:360px;width:72%;height:5px;border-radius:9px;background:var(--rt-accent);box-shadow:0 0 45px color-mix(in srgb,var(--rt-accent) 55%,transparent)}.mv2-searchbox{position:absolute;left:86px;right:86px;top:930px;height:142px;border-radius:38px;display:flex;align-items:center;gap:28px;padding:0 40px;font-size:30px;font-weight:800}.mv2-search-icon svg{width:40px;height:40px}.mv2-query{flex:1}.mv2-cursor{width:3px;height:44px;background:var(--rt-accent)}.mv2-signals{position:absolute;left:120px;right:120px;top:1130px;display:grid;gap:20px}.mv2-signals span{display:block;height:18px;border-radius:20px;background:linear-gradient(90deg,color-mix(in srgb,var(--rt-accent) 70%,transparent),color-mix(in srgb,var(--rt-primary) 28%,transparent));transform-origin:left}.mv2-signals span:nth-child(2){width:82%}.mv2-signals span:nth-child(3){width:64%}.mv2-signals span:nth-child(4){width:45%}.mv2-chart{position:absolute;left:86px;right:86px;top:850px;height:620px;border-radius:42px;overflow:hidden;padding:40px}.mv2-grid{position:absolute;inset:0;opacity:.16;background-image:linear-gradient(var(--rt-line) 1px,transparent 1px),linear-gradient(90deg,var(--rt-line) 1px,transparent 1px);background-size:64px 64px}.mv2-curve{position:absolute;left:55px;right:55px;top:110px;width:calc(100% - 110px);height:330px;overflow:visible}.mv2-bars{position:absolute;left:70px;right:70px;bottom:58px;height:120px;display:flex;align-items:end;gap:28px}.mv2-bars i{flex:1;border-radius:16px 16px 5px 5px;background:linear-gradient(180deg,var(--rt-accent),color-mix(in srgb,var(--rt-primary) 70%,transparent));height:45%}.mv2-bars i:nth-child(2){height:68%}.mv2-bars i:nth-child(3){height:54%}.mv2-bars i:nth-child(4){height:84%}.mv2-bars i:nth-child(5){height:72%}.mv2-bars i:nth-child(6){height:96%}.mv2-system-map{position:absolute;left:100px;right:100px;top:820px;height:720px}.mv2-core,.mv2-node{position:absolute;display:flex;align-items:center;justify-content:center;gap:12px;border:1px solid var(--rt-line);background:color-mix(in srgb,var(--rt-surface) 86%,transparent);box-shadow:0 24px 70px rgba(0,0,0,.22);backdrop-filter:blur(18px)}.mv2-core{left:50%;top:50%;width:240px;height:240px;border-radius:50%;transform:translate(-50%,-50%);font-size:28px;font-weight:950;border-color:color-mix(in srgb,var(--rt-accent) 65%,var(--rt-line));box-shadow:0 0 90px color-mix(in srgb,var(--rt-accent) 18%,transparent)}.mv2-node{width:220px;height:110px;border-radius:30px;font-size:20px}.mv2-node svg{width:28px;height:28px}.mv2-node.n1{left:0;top:0}.mv2-node.n2{right:0;top:0}.mv2-node.n3{left:0;bottom:0}.mv2-node.n4{right:0;bottom:0}.mv2-links{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.mv2-links path{stroke:var(--rt-accent);stroke-width:4;fill:none;opacity:.55;stroke-dasharray:10 14}.mv2-brand{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-top:100px}.mv2-brand .eyebrow,.mv2-brand .body{align-self:center}.mv2-brand .rt-headline{max-width:850px}.mv2-brand-mark{margin-top:90px;position:relative;width:620px;height:360px;display:flex;flex-direction:column;align-items:center;justify-content:center}.mv2-brand-ring{position:absolute;width:310px;height:310px;border:3px solid var(--rt-accent);border-radius:50%;opacity:.32;box-shadow:0 0 100px color-mix(in srgb,var(--rt-accent) 25%,transparent)}.mv2-brand-logo{position:relative;z-index:2;width:min(76%,650px);height:auto;object-fit:contain;filter:drop-shadow(0 24px 55px rgba(0,0,0,.25))}.mv2-brand-tag{font-size:17px;font-weight:850;letter-spacing:.24em;margin-top:12px;z-index:2}.mv2-brand .cta-pill{margin-top:30px;padding:28px 50px;border-radius:999px;background:var(--rt-accent);color:#071520;font-size:22px;font-weight:950}';
 document.head.appendChild(st);
}

function ensureMotionV2RetentionStyle(){
 if(document.getElementById("cotativa-motion-v2-retention-style"))return;
 var st=document.createElement("style");st.id="cotativa-motion-v2-retention-style";
 st.textContent=`
 .mv2-direct{position:absolute;inset:0;padding:330px 88px 300px;overflow:hidden;display:flex;flex-direction:column;justify-content:center;background:radial-gradient(circle at 78% 18%,color-mix(in srgb,var(--rt-primary) 14%,transparent),transparent 31%),radial-gradient(circle at 18% 82%,color-mix(in srgb,var(--rt-accent) 8%,transparent),transparent 35%),linear-gradient(155deg,var(--rt-bg),var(--rt-bg2))}
 .mv2-direct-copy{position:relative;z-index:5;max-width:910px}
 .mv2-direct-label{font-size:18px;letter-spacing:.18em;font-weight:900;color:var(--rt-accent);margin-bottom:34px;text-transform:uppercase}
 .mv2-direct .rt-headline{font-size:112px;line-height:.88;letter-spacing:-.062em;max-width:930px;text-wrap:balance}
 .mv2-direct-question .rt-headline{font-size:126px}
 .mv2-direct-sequence .rt-headline{font-size:108px;line-height:.92}
 .mv2-direct-reveal .rt-headline{font-size:94px;line-height:.94}
 .mv2-direct .rt-body{font-size:28px;line-height:1.35;max-width:760px;margin-top:34px;color:var(--rt-muted)}
 .mv2-direct-rule{width:72%;height:5px;border-radius:99px;background:var(--rt-accent);margin-top:52px;box-shadow:0 0 42px color-mix(in srgb,var(--rt-accent) 48%,transparent);transform-origin:left}
 .mv2-direct-ghost{position:absolute;left:76px;right:-380px;bottom:260px;font-size:150px;font-weight:950;line-height:.8;opacity:.045;white-space:nowrap;transform:rotate(-6deg);pointer-events:none}
 .mv2-direct-dot{position:absolute;right:94px;top:260px;width:18px;height:18px;border-radius:50%;background:var(--rt-accent);box-shadow:0 0 52px color-mix(in srgb,var(--rt-accent) 72%,transparent)}
 .mv2-direct-question .mv2-direct-rule{width:38%}
 .mv2-direct-sequence .mv2-direct-rule{width:86%}
 .mv2-direct-reveal .mv2-direct-rule{width:58%}
 .mv2-brand{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:210px 80px 220px;background:radial-gradient(circle at 50% 46%,color-mix(in srgb,var(--rt-accent) 12%,transparent),transparent 34%),linear-gradient(155deg,var(--rt-bg),var(--rt-bg2))}
 .mv2-brand .rt-kicker{display:none}.mv2-brand .rt-headline{font-size:84px;line-height:.94;max-width:860px;text-wrap:balance}
 .mv2-brand .rt-body{font-size:28px;max-width:720px;margin:28px auto 0}
 .mv2-brand-mark{margin-top:72px;position:relative;width:820px;height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center}
 .mv2-brand-ring{position:absolute;width:330px;height:330px;border:3px solid var(--rt-accent);border-radius:50%;opacity:.24;box-shadow:0 0 110px color-mix(in srgb,var(--rt-accent) 24%,transparent)}
 .mv2-brand-logo{position:relative;z-index:2;width:min(88%,760px);height:auto;object-fit:contain;filter:drop-shadow(0 24px 55px rgba(0,0,0,.28))}
 .mv2-brand-tag{display:none}
 .mv2-brand .cta-pill{margin-top:34px;padding:28px 52px;border-radius:999px;background:var(--rt-accent);color:#071520;font-size:23px;font-weight:950;display:flex;align-items:center;gap:14px}
 `;
 document.head.appendChild(st);
}

function motionV2DirectText(s,cls){
 var label=String(s.label||"").trim();
 var body=String(s.body||"").trim();
 return '<div class="mv2-direct-copy '+cls+'">'+
   (label?'<div class="mv2-direct-label">'+esc(label)+'</div>':'')+
   '<h1 class="headline rt-headline">'+words(s.headline||"Tecnologia para negócios")+'</h1>'+
   (body?'<p class="body rt-body">'+esc(body)+'</p>':'')+
   '<div class="mv2-direct-rule"></div></div>';
}

function motionV2Stage(s,i,b,total){
 var d=(s&&s.motion_direction)||{}, comp=String(d.composition||"direct_statement");
 var last=(i===Math.max(0,(Number(total)||1)-1));
 if(comp==="brand_lockup"||last){
  return '<div class="motion-v2-stage mv2-brand">'+commonText(s)+
    '<div class="mv2-brand-mark"><div class="mv2-brand-ring"></div><img class="mv2-brand-logo" src="assets/brand/cotativa-horizontal.webp" alt="Cotativa"></div>'+
    '<div class="cta-pill">'+icon("brand-whatsapp")+'FALE COM A COTATIVA</div></div>'+brandFoot(b);
 }
 var cls="mv2-direct-statement";
 if(comp==="direct_question")cls="mv2-direct-question";
 else if(comp==="direct_sequence")cls="mv2-direct-sequence";
 else if(comp==="direct_reveal")cls="mv2-direct-reveal";
 return '<div class="motion-v2-stage mv2-direct '+cls+'">'+
   motionV2DirectText(s,cls)+
   '<div class="mv2-direct-ghost" aria-hidden="true">'+words(s.accent||s.headline||"COTATIVA")+'</div>'+
   '<div class="mv2-direct-dot" aria-hidden="true"></div></div>';
}
function render(id,s,i,b){
 if(id==="saas_dashboard")return saas(s,i,b);
 if(id==="editorial_light")return editorial(s,i,b);
 if(id==="dark_neon_tech")return tech(s,i,b);
 if(id==="corporate_minimal")return corporate(s,i,b);
 if(id==="performance_ads")return performance(s,i,b);
 if(id==="social_cards")return social(s,i,b);
 if(id==="case_before_after")return caseTpl(s,i,b);
 return explainer(s,i,b);
}

function animate(tl,id,starts){
 if(!tl)return;
 if(id==="saas_dashboard"){
  tl.fromTo(".saas-browser",{opacity:0,y:80,rotationY:-12},{opacity:1,y:0,rotationY:-5,duration:.7,ease:"expo.out"},.45);
  tl.to(".saas-wide",{boxShadow:"0 0 70px color-mix(in srgb,var(--rt-accent) 18%,transparent)",duration:.7,yoyo:true,repeat:4},7.3);
 }else if(id==="editorial_light"){
  tl.fromTo(".editorial-num",{opacity:0,x:-80},{opacity:.55,x:0,duration:.65,ease:"expo.out"},.25);
  tl.fromTo(".editorial-item",{opacity:0,x:70},{opacity:1,x:0,duration:.42,stagger:.08,ease:"power3.out"},10.6);
 }else if(id==="dark_neon_tech"){
  tl.to(".tech-orb",{scale:1.05,boxShadow:"0 0 150px color-mix(in srgb,var(--rt-accent) 34%,transparent)",duration:1.0,yoyo:true,repeat:5,ease:"sine.inOut"},.4);
  tl.fromTo(".tech-line",{opacity:0,x:-30},{opacity:1,x:0,duration:.28,stagger:.09},3.9);
 }else if(id==="corporate_minimal"){
  tl.fromTo(".corp-service",{opacity:0,y:45},{opacity:1,y:0,duration:.45,stagger:.09,ease:"power3.out"},3.9);
  tl.fromTo(".corp-step",{opacity:0,x:-50},{opacity:1,x:0,duration:.4,stagger:.08},10.55);
 }else if(id==="performance_ads"){
  tl.fromTo(".perf-punch",{opacity:0,scale:.65},{opacity:1,scale:1,duration:.5,ease:"expo.out"},.35);
  tl.fromTo(".perf-funnel .rt-step",{opacity:0,scaleX:.5,transformOrigin:"left"},{opacity:1,scaleX:1,duration:.35,stagger:.09,ease:"power3.out"},10.55);
 }else if(id==="social_cards"){
  tl.fromTo(".social-card",{opacity:0,y:90,rotation:0},{opacity:1,y:0,duration:.55,stagger:.12,ease:"back.out(1.4)"},.65);
  tl.fromTo(".social-chat .bubble",{opacity:0,y:35},{opacity:1,y:0,duration:.38,stagger:.18},10.5);
 }else if(id==="case_before_after"){
  tl.fromTo(".case-half",{opacity:0,y:55},{opacity:1,y:0,duration:.55,stagger:.16,ease:"power3.out"},.55);
  tl.fromTo(".case-bar i",{width:"0%"},{width:function(i){return i<3?"82%":"76%"},duration:.7,stagger:.08},1.1);
 }else{
  tl.fromTo(".ex-step-card",{opacity:0,y:55},{opacity:1,y:0,duration:.55,ease:"expo.out"},.65);
  tl.fromTo(".ex-check",{opacity:0,x:-50},{opacity:1,x:0,duration:.4,stagger:.08},10.5);
 }
}

function init(opts){
 opts=opts||{};ensureStyle();if(opts.motionDirectorV2){ensureMotionV2Style();ensureMotionV2RetentionStyle();}
 var id=String(opts.id||"saas_dashboard");
 if(IDS.indexOf(id)===-1)id="saas_dashboard";
 var root=typeof opts.root==="string"?q(opts.root):opts.root;if(!root)return null;
 root.className="tpl-"+id;
 root.setAttribute("data-master-template",id);
 applyTheme(root,opts.theme||{});
 var watermarkState=applyWatermark(root,id,opts.watermark||{},opts.theme||{});
 var scenes=opts.scenes||[],brand=opts.brand||{};
 for(var i=0;i<scenes.length;i++){
  var section=q("#scene-"+i,root),inner=section&&q(".scene-inner",section);
  var wm=opts.motionDirectorV2?'':'<div class="cotativa-watermark" aria-hidden="true"></div>';
  if(inner)inner.innerHTML=wm+(opts.motionDirectorV2?motionV2Stage(scenes[i]||{},i,brand,scenes.length):render(id,scenes[i]||{},i,brand));
 }
 if(opts.motionDirectorV2!==true) animate(opts.timeline,id,opts.sceneStarts||[]);
 window.__cotativaMasterTemplate={version:VERSION,id:id,theme:(opts.theme&&opts.theme.id)||"",iconPack:opts.iconPack||"",watermark:watermarkState,available:IDS.slice()};
 return window.__cotativaMasterTemplate;
}

window.CotativaTemplates={version:VERSION,ids:IDS,init:init};
})();