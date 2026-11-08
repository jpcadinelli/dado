import { facesFromCount } from './dice.js';

export const TYPES = Object.freeze({
  D4: { name: 'D4', faces: facesFromCount(4) },
  D6: { name: 'D6', faces: facesFromCount(6) },
  D8: { name: 'D8', faces: facesFromCount(8) },
  D10: { name: 'D10', faces: facesFromCount(10) },
  D12: { name: 'D12', faces: facesFromCount(12) },
  D20: { name: 'D20', faces: facesFromCount(20) }
});

export const CLASSIC_CATEGORIES = [
  { value: 'P', title: 'Pessoa, lugar ou animal' },
  { value: 'O', title: 'Objeto' },
  { value: 'A', title: 'Ação' },
  { value: 'D', title: 'Difícil' },
  { value: 'L', title: 'Lazer' },
  { value: 'T', title: 'Todos jogam' }
];
export const MIX_CATEGORIES = CLASSIC_CATEGORIES.map((face, index) => index === 5 ? { value: 'M', title: 'Mix — qualquer categoria' } : face);

const KEY = 'dado-virtual:v2:';
export function readSetting(key, fallback) {
  try {
    const raw = localStorage.getItem(KEY + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
export function saveSetting(key, value) {
  try { localStorage.setItem(KEY + key, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function removeSetting(key) {
  try { localStorage.removeItem(KEY + key); } catch { /* modo privado */ }
}
export function safeFaces(input) {
  if (!Array.isArray(input) || input.length !== 6) return null;
  const faces = input.map(x => ({ value: String(x?.value ?? '').trim().slice(0, 12), title: String(x?.title ?? '').trim().slice(0, 70) }));
  return faces.some(x => !x.value) ? null : faces.map(x => ({ ...x, title: x.title || x.value }));
}
