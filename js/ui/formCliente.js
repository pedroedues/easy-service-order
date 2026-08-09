import { escapeHtml } from '../utils/format.js';

export function renderCliente(container, cliente) {
  container.innerHTML = `
    <div class="field-grid">
      <div>
        <label for="cliente-nome">Nome *</label>
        <input id="cliente-nome" type="text" data-field="cliente.nome" value="${escapeHtml(cliente.nome)}" placeholder="Nome completo">
      </div>
      <div>
        <label for="cliente-contato">Contato *</label>
        <input id="cliente-contato" type="text" data-field="cliente.contato" value="${escapeHtml(cliente.contato)}" placeholder="Telefone ou WhatsApp">
      </div>
    </div>
  `;
}

export function renderVeiculo(container, veiculo) {
  const tipos = ['Carro', 'Moto', 'Caminhão', 'Outro'];
  const opcoes = tipos.map((tipo) => (
    `<option value="${tipo}" ${veiculo.tipo === tipo ? 'selected' : ''}>${tipo}</option>`
  )).join('');

  container.innerHTML = `
    <div class="field-grid">
      <div>
        <label for="veiculo-tipo">Tipo</label>
        <select id="veiculo-tipo" data-field="veiculo.tipo">
          <option value="" ${veiculo.tipo === '' ? 'selected' : ''}>Selecione</option>
          ${opcoes}
        </select>
      </div>
      <div>
        <label for="veiculo-modelo">Modelo</label>
        <input id="veiculo-modelo" type="text" data-field="veiculo.modelo" value="${escapeHtml(veiculo.modelo)}" placeholder="Ex.: Onix 2018">
      </div>
      <div>
        <label for="veiculo-km">KM</label>
        <input id="veiculo-km" type="text" inputmode="numeric" data-field="veiculo.km" value="${escapeHtml(veiculo.km)}" placeholder="Ex.: 52000">
      </div>
    </div>
  `;
}
