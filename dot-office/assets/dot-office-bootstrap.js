/**
 * Cotativa Office Engine bootstrap v4.29.48-diorama
 * Engine 3 is authoritative. Rejected legacy office renderers are not used.
 */
try{
  await import('./dot-office-engine3.js?v=4.29.48-diorama');
  document.documentElement.dataset.cotativaOfficeEngine='3';
}catch(error){
  console.error('[Cotativa Office Engine 3] failed',error);
  document.querySelectorAll('.dot-office-engine3-canvas,.dot-engine3-loading').forEach(node=>node.remove());
  document.documentElement.dataset.cotativaOfficeEngine='3-error';
  const stage=document.querySelector('[data-dot-office-stage]');
  if(stage){
    const box=document.createElement('div');
    box.className='dot-engine3-error';
    box.innerHTML='<strong>Office Engine 3 não iniciou</strong><span>O renderer antigo foi desativado. Recarregue a página; se persistir, consulte o diagnóstico do Deploy Center.</span>';
    Object.assign(box.style,{
      position:'absolute',inset:'20px',display:'grid',placeContent:'center',gap:'8px',
      textAlign:'center',border:'1px solid rgba(255,179,92,.45)',borderRadius:'18px',
      background:'rgba(7,19,28,.96)',color:'#eef7f6',fontFamily:'system-ui,sans-serif'
    });
    stage.appendChild(box);
  }
}
