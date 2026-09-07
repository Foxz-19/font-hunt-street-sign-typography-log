import{SAMPLE_ENTRIES,getTodayIsoDate,filterEntries,calculateMetrics,addEntry,removeEntry,getEntryById}from'./state.js';
import{loadEntries,saveEntries}from'./storage.js';
import{validateFontEntry,validateDatasetId,validateDatasetTag}from'./validation.js';
import{renderGrid,renderMetricsChips,renderAlertBannerHtml,escapeHtml}from'./render.js';

const state={entries:[],activeFilter:'All',pendingDeleteId:null,lastFocusedElement:null};
const $=id=>document.getElementById(id);
const F=['nickname','location','styleTag','moodNote','dateSpotted'];
const kb=k=>k.replace(/([a-z])([A-Z])/g,'$1-$2').toLowerCase();

function announce(t){const el=$('status-announcer');if(el)el.textContent=t}

export function showToast(msg,type='success',duration=4000){
  const c=$('toast-container');if(!c)return;
  const t=document.createElement('div');
  t.className=`toast toast-${type}`;t.setAttribute('role','status');
  t.innerHTML=`<span>${escapeHtml(msg)}</span>`;
  c.appendChild(t);
  const tid=setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),200)},duration);
  t.onclick=()=>{clearTimeout(tid);t.remove()};
}

export function showPersistentAlert(msg,type='warning'){
  const z=$('persistent-alert-zone');if(!z)return;
  const w=document.createElement('div');
  w.innerHTML=renderAlertBannerHtml(msg,type);
  if(w.firstElementChild)z.appendChild(w.firstElementChild);
}

function updateView(){
  const m=calculateMetrics(state.entries,state.activeFilter);
  const f=filterEntries(state.entries,state.activeFilter);
  const ht=$('header-total-count');if(ht)ht.textContent=String(m.totalCount);
  const cs=$('collection-stats');if(cs)cs.innerHTML=renderMetricsChips(m);
  const cl=$('filter-match-count');
  if(cl)cl.textContent=state.activeFilter==='All'?`Showing all ${m.totalCount} specimens`:`Showing ${m.filteredCount} of ${m.totalCount} (${state.activeFilter})`;
  const bc=$('filter-buttons');
  if(bc)bc.querySelectorAll('.filter-btn').forEach(b=>{b.setAttribute('aria-pressed',b.getAttribute('data-tag')===state.activeFilter?'true':'false')});
  const g=$('entries-grid');if(g)g.innerHTML=renderGrid(f,state.activeFilter,m.totalCount);
}

function clearValidationErrors(){
  F.forEach(k=>{
    const e=$('err-'+kb(k));if(e)e.textContent='';
    const i=$('input-'+kb(k))||$('select-style-tag');
    if(i)i.classList.remove('is-invalid');
  });
  const a=$('form-alert');if(a){a.hidden=true;a.textContent=''}
}

function handleFormSubmit(e){
  e.preventDefault();clearValidationErrors();
  const raw={};for(const k of F)raw[k]=($('input-'+kb(k))||$('select-style-tag'))?.value;
  const v=validateFontEntry(raw);
  if(!v.isValid){
    let first=null;
    const map=F.map(k=>[k,'err-'+kb(k),$('input-'+kb(k))||$('select-style-tag')]);
    for(const[k,eid,el]of map){
      if(v.errors[k]){$(eid).textContent=v.errors[k];el?.classList.add('is-invalid');first=first||el}
    }
    if(first)first.focus();
    announce('Form has errors. Please review fields.');
    return;
  }
  const item=v.sanitized;
  state.entries=addEntry(state.entries,item);
  const sr=saveEntries(state.entries);
  if(!sr.success){
    const a=$('form-alert');if(a){a.hidden=false;a.textContent=`Warning: ${sr.error}`}
    showPersistentAlert(sr.error,'danger');
  }
  updateView();$('entry-form')?.reset();
  const di=$('input-date-spotted');if(di)di.value=getTodayIsoDate();
  showToast(`Logged "${item.nickname}"!`);
  
}

function handleGridClick(e){
  const btn=e.target.closest('[data-action]');if(!btn)return;
  const act=btn.getAttribute('data-action');
  if(act==='delete'){
    try{
      const id=validateDatasetId(btn.getAttribute('data-id'));
      const ent=getEntryById(state.entries,id);
      if(!ent)return showToast('Entry not found.','error');
      state.pendingDeleteId=id;state.lastFocusedElement=document.activeElement;
      const ti=$('dialog-target-info');if(ti)ti.textContent=`"${ent.nickname}" (${ent.location})`;
      const d=$('delete-dialog');if(d?.showModal){d.showModal();$('btn-dialog-cancel')?.focus()}
    }catch(err){showToast(`Error: ${err.message}`,'error')}
  }else if(act==='load-samples'){
    state.entries=[...SAMPLE_ENTRIES];saveEntries(state.entries);updateView();
    showToast('Loaded 7 sample finds!','info');announce('Loaded samples.');
  }else if(act==='clear-filter'){
    state.activeFilter='All';updateView();announce('Filter cleared.');
  }
}

function handleFilterClick(e){
  const btn=e.target.closest('.filter-btn');if(!btn)return;
  try{
    const tag=validateDatasetTag(btn.getAttribute('data-tag'));
    state.activeFilter=tag;updateView();
    const m=calculateMetrics(state.entries,state.activeFilter);
    announce(`Filter: ${tag} (${m.filteredCount} items).`);
  }catch(err){showToast(`Error: ${err.message}`,'error')}
}

function handleConfirmDelete(){
  if(!state.pendingDeleteId)return;
  const id=state.pendingDeleteId;
  const ent=getEntryById(state.entries,id);
  const nm=ent?ent.nickname:'Specimen';
  try{
    state.entries=removeEntry(state.entries,id);
    const sr=saveEntries(state.entries);
    if(!sr.success)showPersistentAlert(sr.error,'danger');
    updateView();showToast(`"${nm}" deleted.`,'info');
  }catch(err){showToast(`Error: ${err.message}`,'error')}
  finally{$('delete-dialog')?.close('confirm')}
}

function handleDialogClose(){
  state.pendingDeleteId=null;
  if(state.lastFocusedElement?.focus)state.lastFocusedElement.focus();
  else $('entries-grid')?.focus();
  state.lastFocusedElement=null;
}

function init(){
  const di=$('input-date-spotted');
  if(di){const t=getTodayIsoDate();di.value=t;di.max=t}
  const l=loadEntries(SAMPLE_ENTRIES);
  state.entries=l.entries;
  if(l.isCorrupted||l.error){
    showPersistentAlert(l.error||'Storage issue',l.isCorrupted?'warning':'danger');
    showToast(l.error||'Storage notice','error',6000);
  }
  updateView();
  $('entry-form')?.addEventListener('submit',handleFormSubmit);
  $('entry-form')?.addEventListener('input',e=>e.target.classList.remove('is-invalid'));
  $('entries-grid')?.addEventListener('click',handleGridClick);
  $('filter-buttons')?.addEventListener('click',handleFilterClick);
  $('btn-dialog-confirm')?.addEventListener('click',handleConfirmDelete);
  $('btn-dialog-cancel')?.addEventListener('click',()=>$('delete-dialog')?.close('cancel'));
  $('delete-dialog')?.addEventListener('close',handleDialogClose);
  $('persistent-alert-zone')?.addEventListener('click',e=>{
    e.target.closest('[data-action="dismiss-alert"]')?.closest('.alert-banner')?.remove();
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
