import { brl, fmtQtd, formatDateTime, normalizePlaca, escapeHtml } from '../utils/format.js';
import { calcItemTotal } from '../store.js';

export function renderHistorico(container, historico) {
  if (historico.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma OS gerada ainda nesta sessão.</p>';
    return;
  }

  const items = historico.map((entry, index) => renderEntry(entry, index)).join('');
  container.innerHTML = `<div class="historico-list">${items}</div>`;
}

function renderEntry(entry, index) {
  const veiculoLabel = [entry.veiculo?.tipo, entry.veiculo?.modelo].filter(Boolean).join(' · ');
  const placa = normalizePlaca(entry.veiculo?.placa);
  const veiculoLinha = [veiculoLabel, placa ? `Placa ${placa}` : ''].filter(Boolean).join(' · ');

  return `
    <details class="historico-item">
      <summary class="historico-item__summary">
        <span class="historico-item__os mono">${escapeHtml(entry.osNumero)}</span>
        <span class="historico-item__cliente">${escapeHtml(entry.cliente?.nome) || '—'}</span>
        <span class="historico-item__total mono">${brl(entry.total)}</span>
      </summary>
      <div class="historico-item__body">
        <p class="preview-doc__label">Emitida em ${formatDateTime(new Date(entry.dataHora))}</p>
        ${veiculoLinha ? `<p>${escapeHtml(veiculoLinha)}</p>` : ''}

        <p class="preview-doc__label">Serviços</p>
        ${renderItemsList(entry.servicos)}

        ${entry.pecas?.length ? `
        <p class="preview-doc__label">Peças</p>
        ${renderItemsList(entry.pecas)}` : ''}

        <button type="button" class="btn btn--ghost btn--block" data-action="reimprimir-os" data-index="${index}">Gerar PDF novamente</button>
      </div>
    </details>
  `;
}

function renderItemsList(items) {
  if (!items || items.length === 0) {
    return '<p class="empty-state">Nenhum item.</p>';
  }
  return items.map((item) => `
    <div class="preview-doc__row">
      <span>${escapeHtml(item.desc)} (${fmtQtd(item.qtd)}x)</span>
      <span>${brl(calcItemTotal(item))}</span>
    </div>
  `).join('');
}
