import{test,describe,beforeEach}from'node:test';import assert from'node:assert/strict';
import{STYLE_TAGS,isValidStyleTag,isValidIsoDate,sanitizeString,validateFontEntry,validateDatasetId,validateDatasetTag}from'../js/validation.js';
import{SAMPLE_ENTRIES,getTodayIsoDate,filterEntries,calculateMetrics,addEntry,removeEntry,getEntryById}from'../js/state.js';
import{STORAGE_KEY,BACKUP_KEY,loadEntries,saveEntries,clearStorage}from'../js/storage.js';
import{escapeHtml,getTagFontClass,formatDate,renderEntryCard,renderGrid,renderAlertBannerHtml}from'../js/render.js';

describe('1. Validation',()=>{
  test('tags',()=>{assert.equal(STYLE_TAGS.length,7);assert.ok(isValidStyleTag('Serif')&&!isValidStyleTag('x'))});
  test('date',()=>{assert.ok(isValidIsoDate('2026-09-07')&&isValidIsoDate('2024-02-29')&&!isValidIsoDate('2023-02-29'))});
  test('sanitize',()=>{assert.equal(sanitizeString(' a b '), 'a b')});
  test('entry valid',()=>{const r=validateFontEntry({nickname:'Rusty Gothic',location:'Brooklyn',styleTag:'Display',moodNote:'Blue',dateSpotted:'2026-09-05'});assert.ok(r.isValid&&r.sanitized?.id)});
  test('entry invalid',()=>{const r=validateFontEntry({nickname:'',location:'a',styleTag:'bad',moodNote:'',dateSpotted:'x'});assert.ok(!r.isValid&&r.errors.nickname&&r.errors.location)});
  test('dataset',()=>{assert.equal(validateDatasetId('id1'),'id1');assert.throws(()=>validateDatasetId(''));assert.equal(validateDatasetTag('All'),'All');assert.throws(()=>validateDatasetTag('bad'))});
});

describe('2. State',()=>{
  test('today',()=>{assert.match(getTodayIsoDate(),/^\d{4}-\d{2}-\d{2}$/)});
  test('samples',()=>{assert.equal(SAMPLE_ENTRIES.length,7);const s=new Set(SAMPLE_ENTRIES.map(x=>x.styleTag));STYLE_TAGS.forEach(t=>assert.ok(s.has(t)))});
  test('filter',()=>{assert.equal(filterEntries(SAMPLE_ENTRIES,'All').length,7);assert.equal(filterEntries(SAMPLE_ENTRIES,'Serif').length,1);assert.throws(()=>filterEntries(SAMPLE_ENTRIES,'bad'))});
  test('metrics',()=>{const m=calculateMetrics(SAMPLE_ENTRIES,'Serif');assert.equal(m.totalCount,7);assert.equal(m.filteredCount,1);assert.ok(m.hasEntries)});
  test('add',()=>{const u=addEntry(SAMPLE_ENTRIES,{id:'c1',nickname:'T',location:'L',styleTag:'Script',moodNote:'M',dateSpotted:'2026-09-07',createdAt:Date.now()});assert.equal(u.length,8)});
  test('remove',()=>{const id=SAMPLE_ENTRIES[0].id;const u=removeEntry(SAMPLE_ENTRIES,id);assert.equal(u.length,6);assert.equal(getEntryById(u,id),null);assert.throws(()=>removeEntry(SAMPLE_ENTRIES,'missing'))});
});

describe('3. Storage',()=>{
  let store={};
  beforeEach(()=>{store={};globalThis.window={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}}}});
  test('save & load',()=>{saveEntries(SAMPLE_ENTRIES);const r=loadEntries();assert.ok(r.success&&r.entries.length===7)});
  test('corrupt recovery',()=>{window.localStorage.setItem(STORAGE_KEY,'{bad..');const r=loadEntries(SAMPLE_ENTRIES);assert.ok(!r.success&&r.isCorrupted&&r.entries.length===7);assert.equal(window.localStorage.getItem(BACKUP_KEY),'{bad..')});
  test('sanitize list',()=>{window.localStorage.setItem(STORAGE_KEY,JSON.stringify([SAMPLE_ENTRIES[0],{bad:1}]));const r=loadEntries();assert.ok(!r.success&&r.isCorrupted&&r.entries.length===1)});
  test('clear',()=>{saveEntries(SAMPLE_ENTRIES);clearStorage();assert.equal(window.localStorage.getItem(STORAGE_KEY),null)});
});

describe('4. Render',()=>{
  test('escapeHtml',()=>{assert.equal(escapeHtml('<script>"X"</script>'),'&lt;script&gt;&quot;X&quot;&lt;/script&gt;')});
  test('fontClass',()=>{assert.equal(getTagFontClass('Serif'),'font-specimen-serif');assert.equal(getTagFontClass('Display'),'font-specimen-display')});
  test('formatDate',()=>{assert.equal(formatDate('2026-09-07'),'Sep 7, 2026')});
  test('card',()=>{const h=renderEntryCard(SAMPLE_ENTRIES[0]);assert.ok(h.includes('Rusty Laundromat Gothic')&&h.includes('data-action="delete"'))});
  test('empty grid',()=>{assert.ok(renderGrid([],'All',0).includes('No Field Notes Yet'))});
  test('empty filter',()=>{assert.ok(renderGrid([],'Script',5).includes('No "Script" Letterforms Spotted'))});
  test('banner',()=>{assert.ok(renderAlertBannerHtml('Warn','warning').includes('alert-banner'))});
});