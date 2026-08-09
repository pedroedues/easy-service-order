import { brl, escapeHtml } from '../utils/format.js';
import { calcItemTotal } from '../store.js';

const ADD_LABELS = {
  servicos: '+ Adicionar serviço',
  pecas: '+ Adicionar peça',
};

export function renderItensTable(container, section, items) {
  const addLabel = ADD_LABELS[section];

  if (items.length === 0) {
    container.innerHTML = `
      <p class="empty-state">Nenhum item adicionado.</p>
      <button type="button" class="btn btn--ghost" data-action="add-item" data-section="${section}">${addLabel}</button>
    `;
    return;
  }

  const rows = items.map((item, index) => `
    <tr>
      <td class="itens-table__desc">
        <input type="text" data-field="item.desc" data-section="${section}" data-index="${index}" value="${escapeHtml(item.desc)}" placeholder="Descrição">
      </td>
      <td class="itens-table__qtd">
        <input type="number" min="0" step="1" data-field="item.qtd" data-section="${section}" data-index="${index}" value="${item.qtd}">
      </td>
      <td class="itens-table__preco">
        <input type="number" min="0" step="0.01" data-field="item.preco" data-section="${section}" data-index="${index}" value="${item.preco === 0 ? '' : item.preco}" placeholder="0,00">
      </td>
      <td class="itens-table__subtotal" data-subtotal-cell="${section}-${index}">${brl(calcItemTotal(item))}</td>
      <td>
        <button type="button" class="itens-table__remove" data-action="remove-item" data-section="${section}" data-index="${index}" aria-label="Remover item">✕</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="itens-table">
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Qtd.</th>
          <th>Unit.</th>
          <th>Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <button type="button" class="btn btn--ghost" data-action="add-item" data-section="${section}">${addLabel}</button>
  `;
}

export function updateSubtotalCell(section, index, item) {
  const cell = document.querySelector(`[data-subtotal-cell="${section}-${index}"]`);
  if (cell) cell.textContent = brl(calcItemTotal(item));
}
