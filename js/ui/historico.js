import { brl, escapeHtml } from '../utils/format.js';

export function renderHistorico(container, historico) {
  if (historico.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma OS gerada ainda nesta sessão.</p>';
    return;
  }

  const items = historico.map((entry) => `
    <div class="historico-item">
      <span class="historico-item__os mono">${escapeHtml(entry.osNumero)}</span>
      <span class="historico-item__cliente">${escapeHtml(entry.cliente) || '—'}</span>
      <span class="historico-item__total">${brl(entry.total)}</span>
    </div>
  `).join('');

  container.innerHTML = `<div class="historico-list">${items}</div>`;
}
