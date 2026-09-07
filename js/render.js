export function escapeHtml(v){if(v==null)return'';return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
export function getTagFontClass(t){const m={Serif:'font-specimen-serif','Sans-Serif':'font-specimen-sans-serif',Script:'font-specimen-script',Display:'font-specimen-display',Monospace:'font-specimen-monospace','Hand-Painted':'font-specimen-hand-painted'};return m[t]||'font-specimen-other'}
export function getTagBadgeClass(t){return`badge-${String(t||'').toLowerCase().replace(/[^a-z0-9]/g,'-')}`}
export function formatDate(d){if(!d||typeof d!=='string')return'';const p=d.split('-');if(p.length!==3)return escapeHtml(d);const m=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return`${m[parseInt(p[1],10)-1]||p[1]} ${parseInt(p[2],10)}, ${p[0]}`}
export function renderEntryCard(e){
  if(!e)return'';
  const fc=getTagFontClass(e.styleTag),bc=getTagBadgeClass(e.styleTag);
  const id=escapeHtml(e.id),nk=escapeHtml(e.nickname),lc=escapeHtml(e.location),tg=escapeHtml(e.styleTag),md=escapeHtml(e.moodNote),dt=escapeHtml(e.dateSpotted),fd=formatDate(e.dateSpotted);
  return`<article class="specimen-card" id="card-${id}" data-id="${id}" data-tag="${tg}" tabindex="0" aria-labelledby="title-${id}">
<div class="card-top"><span class="card-style-badge ${bc}">${tg}</span><time class="card-date" datetime="${dt}">${fd}</time></div>
<div class="specimen-display"><h3 id="title-${id}" class="specimen-nickname ${fc}">${nk}</h3></div>
<div class="card-meta"><div class="meta-row"><span class="meta-label">Context</span><span class="meta-value">${lc}</span></div>
<div class="meta-row"><span class="meta-label">Mood</span><span class="meta-value mood-text">${md}</span></div></div>
<div class="card-footer"><button type="button" class="btn-card-delete" data-action="delete" data-id="${id}" aria-label="Delete specimen: ${nk}">Delete</button></div>
</article>`.trim();
}
export function renderGrid(f,af,tc){
  const l=Array.isArray(f)?f:[];if(l.length>0)return l.map(renderEntryCard).join('\n');
  if(tc===0)return`<div class="empty-state" role="status"><div class="empty-state-icon" aria-hidden="true">&#9998;</div><h3 class="empty-state-title">No Field Notes Yet</h3><p class="empty-state-text">Your notebook is empty. Log your first find using the form.</p><div class="empty-state-actions"><button type="button" class="btn btn-primary" data-action="load-samples">Load Sample Finds</button></div></div>`.trim();
  const st=escapeHtml(af);
  return`<div class="empty-state" role="status"><div class="empty-state-icon" aria-hidden="true">&#9776;</div><h3 class="empty-state-title">No "${st}" Letterforms Spotted</h3><p class="empty-state-text">None of your ${tc} finds match ${st}.</p><div class="empty-state-actions"><button type="button" class="btn btn-outline" data-action="clear-filter">Show All Styles</button></div></div>`.trim();
}
export function renderMetricsChips(m){
  let h=`<span class="metric-pill"><span>Showing:</span><span class="metric-val">${m.filteredCount} / ${m.totalCount}</span></span>`;
  if(m.topStyle)h+=`<span class="metric-pill"><span>Top Style:</span><span class="metric-val">${escapeHtml(m.topStyle)}</span></span>`;
  return h;
}
export function renderAlertBannerHtml(msg,t='warning'){
  const c=t==='danger'?'alert-danger':'alert-warning';
  return`<div class="alert-banner ${c}" role="alert"><span>${escapeHtml(msg)}</span><button type="button" class="alert-dismiss-btn" data-action="dismiss-alert" aria-label="Dismiss">&times;</button></div>`.trim();
}
