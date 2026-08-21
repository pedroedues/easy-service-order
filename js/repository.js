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
    try {
      localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(draft));
    } catch (error) {
      console.error('Não foi possível salvar o rascunho', error);
    }
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

function isQuotaExceeded(error) {
  return error && (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014);
}

// Upserts by osNumero: regenerating the same OS (before starting a new one)
// updates its existing entry instead of adding a duplicate. If storage is
// full, the oldest entries are dropped one at a time until it fits, rather
// than letting the quota error crash PDF generation.
export function addHistoricoEntry(entry) {
  const semEsteOs = getHistorico().filter((item) => item.osNumero !== entry.osNumero);
  let historico = [entry, ...semEsteOs];

  while (historico.length > 0) {
    try {
      localStorage.setItem(STORAGE_KEYS.historico, JSON.stringify(historico));
      return historico;
    } catch (error) {
      if (!isQuotaExceeded(error) || historico.length === 1) {
        console.error('Não foi possível salvar o histórico', error);
        return historico;
      }
      historico = historico.slice(0, -1);
    }
  }
  return historico;
}
