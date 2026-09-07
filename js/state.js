import { STYLE_TAGS, isValidStyleTag } from './validation.js';

export function getTodayIsoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** @type {Array<import('./validation.js').FontEntry>} */
export const SAMPLE_ENTRIES = Object.freeze([
  { id: 's1', nickname: 'Rusty Laundromat Gothic', location: 'Brooklyn', styleTag: 'Display', moodNote: 'Cobalt blue', dateSpotted: '2026-09-01', createdAt:1 },
  { id: 's2', nickname: 'Art Deco Transom Numerals', location: 'San Francisco', styleTag: 'Serif', moodNote: 'Gilded verdigris', dateSpotted: '2026-09-02', createdAt:1 },
  { id: 's3', nickname: 'Chunky Diner Menu Slab', location: 'Flagstaff', styleTag: 'Sans-Serif', moodNote: 'Cherry red', dateSpotted: '2026-09-03', createdAt:1 },
  { id: 's4', nickname: 'Corner Bodega Awning Script', location: 'NYC', styleTag: 'Script', moodNote: 'Canary yellow', dateSpotted: '2026-09-04', createdAt:1 },
  { id: 's5', nickname: 'Subway Relay Junction Plate', location: 'Boston', styleTag: 'Monospace', moodNote: 'Machine grey', dateSpotted: '2026-09-05', createdAt:1 },
  { id: 's6', nickname: 'Guadalupe Fruit Cart Gothic', location: 'Austin', styleTag: 'Hand-Painted', moodNote: 'Lime enamel', dateSpotted: '2026-09-06', createdAt:1 },
  { id: 's7', nickname: 'Harbor Chandlery Stencil', location: 'Portland', styleTag: 'Other', moodNote: 'Charcoal stencil', dateSpotted: '2026-09-07', createdAt:1 }
]);

export function filterEntries(entries, filterTag) {
  if (!Array.isArray(entries)) return [];
  if (!filterTag || filterTag === 'All') return [...entries];
  if (!isValidStyleTag(filterTag)) throw new Error(`Cannot filter by unrecognized style tag: "${filterTag}"`);
  return entries.filter(item => item.styleTag === filterTag);
}

export function calculateMetrics(entries, activeFilter = 'All') {
  const safe = Array.isArray(entries) ? entries : [];
  const filtered = filterEntries(safe, activeFilter);
  /** @type {Record<import('./validation.js').StyleTag, number>} */
  const byTag = { 'Serif': 0, 'Sans-Serif': 0, 'Script': 0, 'Display': 0, 'Monospace': 0, 'Hand-Painted': 0, 'Other': 0 };

  for (const item of safe) {
    if (isValidStyleTag(item.styleTag)) byTag[item.styleTag] = (byTag[item.styleTag] || 0) + 1;
  }

  let topStyle = null, maxCount = 0;
  for (const tag of STYLE_TAGS) {
    if (byTag[tag] > maxCount) { maxCount = byTag[tag]; topStyle = tag; }
  }

  return { totalCount: safe.length, filteredCount: filtered.length, activeFilter, byTag, topStyle: maxCount > 0 ? topStyle : null, hasEntries: safe.length > 0 };
}

export function addEntry(entries, newEntry) {
  if (!newEntry?.id) throw new Error('addEntry requires a valid FontEntry with an id');
  return [newEntry, ...(Array.isArray(entries) ? entries : [])];
}

export function removeEntry(entries, id) {
  if (!id) throw new Error('removeEntry requires a non-empty string id');
  const safe = Array.isArray(entries) ? entries : [];
  if (!safe.some(i => i.id === id)) throw new Error(`Entry with id "${id}" was not found`);
  return safe.filter(item => item.id !== id);
}

export function getEntryById(entries, id) {
  return Array.isArray(entries) ? entries.find(item => item.id === id) || null : null;
}
