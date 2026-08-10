import { createEmptyDraft } from './store.js';

const STORAGE_KEYS = {
  empresa: 'talaoos_empresa',
  seq: 'talaoos_seq',
  draft: 'talaoos_draft',
  historico: 'talaoos_historico',
  currentOsSeq: 'talaoos_current_seq',
};

const DRAFT_SAVE_DELAY_MS = 500;
let draftSaveTimer = null;

export function getEmpresa() {
  // Swap for `await fetch('/api/empresa')` once a backend exists.
  const raw = localStorage.getItem(STORAGE_KEYS.empresa);
  return raw ? JSON.parse(raw) : null;
}

export function saveEmpresa(empresa) {
  // Swap for `await fetch('/api/empresa', { method: 'PUT', body: ... })`.
  localStorage.setItem(STORAGE_KEYS.empresa, JSON.stringify(empresa));
}

export function peekNextOsNumber() {
  // Swap for `await fetch('/api/os/next')`.
  const raw = localStorage.getItem(STORAGE_KEYS.seq);
  const seq = raw ? parseInt(raw, 10) : 0;
  return seq + 1;
}

export function consumeNextOsNumber() {
  // Swap for `await fetch('/api/os/next', { method: 'POST' })`.
  const next = peekNextOsNumber();
  localStorage.setItem(STORAGE_KEYS.seq, String(next));
  return next;
}

export function getDraft() {
  const raw = localStorage.getItem(STORAGE_KEYS.draft);
  if (!raw) return null;
  try {
    return { ...createEmptyDraft(), ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function saveDraft(draft) {
  // Swap for `await fetch('/api/draft', { method: 'PUT', body: ... })`.
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(draft));
  }, DRAFT_SAVE_DELAY_MS);
}

export function clearDraft() {
  clearTimeout(draftSaveTimer);
  localStorage.removeItem(STORAGE_KEYS.draft);
}

// The OS number assigned to the draft currently being edited, if any has
// been consumed yet. Kept separate from the draft so "Gerar PDF" can be
// clicked more than once (e.g. to fix a typo and reissue) without burning a
// new number each time — only "Nova OS" clears this.
export function getCurrentOsSeq() {
  const raw = localStorage.getItem(STORAGE_KEYS.currentOsSeq);
  return raw ? parseInt(raw, 10) : null;
}

export function setCurrentOsSeq(seq) {
  if (seq === null) {
    localStorage.removeItem(STORAGE_KEYS.currentOsSeq);
  } else {
    localStorage.setItem(STORAGE_KEYS.currentOsSeq, String(seq));
  }
}

export function getHistorico() {
  const raw = localStorage.getItem(STORAGE_KEYS.historico);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Upserts by osNumero: regenerating the same OS (before starting a new one)
// updates its existing entry instead of adding a duplicate.
export function addHistoricoEntry(entry) {
  const semEsteOs = getHistorico().filter((item) => item.osNumero !== entry.osNumero);
  const historico = [entry, ...semEsteOs];
  localStorage.setItem(STORAGE_KEYS.historico, JSON.stringify(historico));
  return historico;
}
