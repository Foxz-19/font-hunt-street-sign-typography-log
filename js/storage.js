import { validateFontEntry } from './validation.js';

export const STORAGE_KEY = 'font_hunt_entries_v1';
export const BACKUP_KEY = 'font_hunt_corrupted_backup_v1';
let memoryFallbackStore = null;

export function checkStorageAvailability() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { available: false, error: 'Storage API unavailable.' };
  }
  try {
    window.localStorage.setItem('__test__', '1');
    window.localStorage.removeItem('__test__');
    return { available: true, error: null };
  } catch (e) {
    return { available: false, error: `Storage blocked. Using session.` };
  }
}

export function loadEntries(defaultEntries = []) {
  const check = checkStorageAvailability();
  if (!check.available) {
    if (!memoryFallbackStore) memoryFallbackStore = [...defaultEntries];
    return { success: false, entries: memoryFallbackStore, error: check.error, isCorrupted: false, isMemoryFallback: true };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      if (defaultEntries.length) saveEntries(defaultEntries);
      return { success: true, entries: [...defaultEntries], error: null, isCorrupted: false, isMemoryFallback: false };
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      try { window.localStorage.setItem(BACKUP_KEY, raw); } catch {}
      saveEntries(defaultEntries);
      return { success: false, entries: [...defaultEntries], error:'Corrupt data.', isCorrupted: true, isMemoryFallback: false };
    }
    if (!Array.isArray(parsed)) {
      saveEntries(defaultEntries);
      return { success: false, entries: [...defaultEntries], error:'Invalid schema.', isCorrupted: true, isMemoryFallback: false };
    }
    const valid = [];
    let hadBad = false;
    for (const item of parsed) {
      const res = validateFontEntry(item);
      if (res.isValid && res.sanitized) valid.push(res.sanitized);
      else hadBad = true;
    }
    if (hadBad) {
      saveEntries(valid);
      return { success: false, entries: valid, error:'Repaired.', isCorrupted: true, isMemoryFallback: false };
    }
    return { success: true, entries: valid, error: null, isCorrupted: false, isMemoryFallback: false };
  } catch (e) {
    return { success: false, entries: [...defaultEntries], error: e.message, isCorrupted: false, isMemoryFallback: false };
  }
}

export function saveEntries(entries) {
  if (!Array.isArray(entries)) return { success: false, error:'Bad input.', isMemoryFallback: false };
  const check = checkStorageAvailability();
  if (!check.available) {
    memoryFallbackStore = [...entries];
    return { success: false, error: check.error, isMemoryFallback: true };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return { success: true, error: null, isMemoryFallback: false };
  } catch (e) {
    memoryFallbackStore = [...entries];
    return { success: false, error: `Write failed: ${e.message}`, isMemoryFallback: true };
  }
}

export function clearStorage() {
  const check = checkStorageAvailability();
  if (!check.available) { memoryFallbackStore = []; return { success: true, error: null }; }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
