import { escapeHtml } from '../utils/format.js';

export function renderModalEmpresa(container, empresa, isOpen) {
  if (!isOpen) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="modal-overlay">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-empresa-title">
        <h2 class="modal__title" id="modal-empresa-title">Dados da oficina</h2>

        <div class="modal__field">
          <label for="empresa-nome">Nome da oficina *</label>
          <input id="empresa-nome" type="text" data-field="empresa.nome" value="${escapeHtml(empresa?.nome || '')}" placeholder="Nome da sua oficina">
        </div>

        <div class="modal__field">
          <label for="empresa-logo">Logo (opcional)</label>
          <input id="empresa-logo" type="file" accept="image/*" data-action="upload-logo">
          ${empresa?.logo ? `<img src="${empresa.logo}" alt="Prévia do logo" class="logo-preview">` : ''}
        </div>

        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" data-action="fechar-config">Cancelar</button>
          <button type="button" class="btn btn--primary" data-action="salvar-config">Salvar</button>
        </div>
      </div>
    </div>
  `;
}
