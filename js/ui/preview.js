import { brl, fmtQtd, formatDate, formatOsNumber, escapeHtml } from '../utils/format.js';
import { calcItemTotal, calcGrandTotal } from '../store.js';

export function renderPreview(container, state) {
  const { empresa, osSeq, draft } = state;
  const total = calcGrandTotal(draft);
  const temVeiculo = Boolean(draft.veiculo.tipo || draft.veiculo.modelo || draft.veiculo.km);

  container.innerHTML = `
    <div class="preview-doc">
      <div class="preview-doc__header">
        <div class="preview-doc__brand">
          ${empresa?.logo ? `<img src="${empresa.logo}" alt="Logo" class="preview-doc__logo">` : ''}
          <h3>${escapeHtml(empresa?.nome || 'Nome da oficina')}</h3>
        </div>
        <div class="preview-doc__meta">
          <span class="badge mono">${formatOsNumber(osSeq)}</span>
          <p class="preview-doc__label">${formatDate()}</p>
        </div>
      </div>

      <div class="preview-doc__section">
        <p class="preview-doc__label">Cliente</p>
        <p>${escapeHtml(draft.cliente.nome) || '—'}</p>
        <p>${escapeHtml(draft.cliente.contato) || '—'}</p>
      </div>

      ${temVeiculo ? `
      <div class="preview-doc__section">
        <p class="preview-doc__label">Veículo</p>
        <p>${[draft.veiculo.tipo, draft.veiculo.modelo].filter(Boolean).map(escapeHtml).join(' · ') || '—'}${draft.veiculo.km ? ` · ${escapeHtml(draft.veiculo.km)} km` : ''}</p>
      </div>` : ''}

      <div class="preview-doc__section">
        <p class="preview-doc__label">Serviços</p>
        ${renderItemsRows(draft.servicos)}
      </div>

      ${draft.pecasAtivo ? `
      <div class="preview-doc__section">
        <p class="preview-doc__label">Peças</p>
        ${renderItemsRows(draft.pecas)}
      </div>` : ''}

      <div class="total-bar">
        <span>Total</span>
        <span>${brl(total)}</span>
      </div>

      <div class="preview-doc__signatures">
        <div class="preview-doc__signature">Assinatura do Cliente</div>
        <div class="preview-doc__signature">Assinatura do Técnico</div>
      </div>
    </div>
  `;
}

function renderItemsRows(items) {
  if (items.length === 0) {
    return '<p class="empty-state">Nenhum item.</p>';
  }
  return items.map((item) => `
    <div class="preview-doc__row">
      <span>${escapeHtml(item.desc) || '—'} (${fmtQtd(item.qtd)}x)</span>
      <span>${brl(calcItemTotal(item))}</span>
    </div>
  `).join('');
}
