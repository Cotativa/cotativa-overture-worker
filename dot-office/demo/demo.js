/**
 * Dot Office public demo controller.
 * Never sends network requests, authenticates, reads customer data or dispatches jobs.
 * All snapshots are synthetic and only affect the 3D presentation layer.
 */
const root=document.querySelector('[data-dot-office]');
const dataEl=root?.querySelector('[data-dot-office-stations-json]');
const initial=JSON.parse(dataEl?.textContent||'{}');
const snapshot=structuredClone(initial);
const stateLine=root.querySelector('[data-demo-render-state]');
const title=root.querySelector('[data-demo-station-title]');
const detail=root.querySelector('[data-demo-station-detail]');
const navButton=root.querySelector('[data-dot-navmesh-toggle]');

const sectorNames=new Map((initial.stations||[]).map(s=>[s.key,s.label]));
function setDemoState(mode){
  const working=mode==='working';
  let count=0;
  snapshot.agents=(snapshot.agents||[]).map((a,i)=>{
    const shouldWork=working&&i%3!==1;
    if(shouldWork)count++;
    return {...a,current_job_id:shouldWork?1000+i:0,job_status:shouldWork?'processing':'idle',behavior:{mode:shouldWork?'working':'idle',animation:shouldWork?'typing':'idle'}};
  });
  snapshot.metrics.processing_agents=count;
  snapshot.stations=(snapshot.stations||[]).map(s=>{
    const num=snapshot.agents.filter(a=>a.station===s.key&&a.current_job_id>0).length;
    return {...s,status:num?'working':'standby',metrics:[
      {label:'Funcionários',value:snapshot.agents.filter(a=>a.station===s.key).length},
      {label:'Executando',value:num}
    ]};
  });
  snapshot.task_board=working?[{agent_name:'Dot Demo',label:'Tarefa de demonstração — sem backend',status:'processing',progress:47}]:[];
  window.DotOfficeEngine?.updateSnapshot(snapshot);
  stateLine.textContent=working?count+' personagens em atividade fictícia':'Equipe simulada disponível';
}

root.addEventListener('dot:station-click',event=>{
  const key=String(event.detail?.key||'');
  const sector=snapshot.stations.find(s=>s.key===key);
  title.textContent=sector?.label||sectorNames.get(key)||'Departamento';
  detail.textContent=(sector?.detail||'Prévia sem dados reais')+' Clique em Visão geral para voltar à câmera panorâmica.';
});

root.addEventListener('dot:navmesh-change',event=>{
  const enabled=Boolean(event.detail?.visible);
  navButton.setAttribute('aria-pressed',String(enabled));
  navButton.textContent='Circulação: '+(enabled?'ON':'OFF');
});
navButton.addEventListener('click',()=>{
  window.DotOfficeEngine?.toggleNavigation();
});
root.querySelector('[data-dot-camera-reset]')?.addEventListener('click',()=>{
  window.DotOfficeEngine?.resetView();
  title.textContent='Selecione uma área';
  detail.textContent='Clique no escritório para aproximar a câmera e acompanhar o estado fictício de cada setor.';
});
root.querySelectorAll('[data-demo-mode]').forEach(button=>button.addEventListener('click',()=>{
  setDemoState(button.dataset.demoMode);
}));
let attempts=0;
const waiting=setInterval(()=>{
  attempts++;
  const engine=window.DotOfficeEngine;
  if(engine?.getState){
    clearInterval(waiting);
    const state=engine.getState();
    stateLine.textContent='3D ativo · '+state.stations+' estações · '+state.humanRenderer;
    const every=setInterval(()=>{
      if(!document.contains(root)){clearInterval(every);return;}
      const current=window.DotOfficeEngine?.getState?.();
      if(current)stateLine.textContent='3D ativo · '+current.fps+' FPS · '+current.quality;
    },3000);
  }else if(document.documentElement.dataset.cotativaOfficeEngine==='3-error'||attempts>45){
    clearInterval(waiting);
    stateLine.textContent='Visualização indisponível neste navegador. Confira WebGL, rede e Console.';
  }
},500);
