import { createStore, calcGrandTotal, calcValidGrandTotal, isValidItem, createEmptyItem, createEmptyDraft } from './store.js';
import * as repository from './repository.js';
import { renderCliente, renderVeiculo } from './ui/formCliente.js';
import { renderItensTable, updateSubtotalCell } from './ui/formItens.js';
import { renderPreview } from './ui/preview.js';
import { renderModalEmpresa } from './ui/modalEmpresa.js';
import { renderHistorico } from './ui/historico.js';
import { showToast } from './ui/toast.js';
import { buildWhatsappLink } from './whatsapp.js';
import { brl, formatOsNumber, escapeHtml } from './utils/format.js';

const dom = {
  headerBrand: document.getElementById('app-header-brand'),
  headerOs: document.getElementById('app-header-os'),
  formCliente: document.getElementById('form-cliente'),
  formVeiculo: document.getElementById('form-veiculo'),
  itensServicos: document.getElementById('itens-servicos'),
  itensPecas: document.getElementById('itens-pecas'),
  totalGeral: document.getElementById('total-geral'),
  previewRoot: document.getElementById('preview-root'),
  previewPanel: document.getElementById('preview-panel'),
  modalRoot: document.getElementById('modal-root'),
  whatsappLink: document.getElementById('whatsapp-link'),
  historicoRoot: document.getElementById('historico-root'),
};

const empresaInicial = repository.getEmpresa();
const draftSalvo = repository.getDraft();

const store = createStore({
  empresa: empresaInicial,
  osSeq: repository.peekNextOsNumber(),
  draft: draftSalvo || createEmptyDraft(),
  ui: {
    modalEmpresaOpen: !empresaInicial?.nome,
  },
});

// Pending edits to empresa live outside the store while the modal is open,
// so typing the name doesn't trigger app-wide re-renders (and focus loss)
// before the user actually saves.
let pendingEmpresa = null;

function renderHeader(state) {
  dom.headerBrand.innerHTML = `
    ${state.empresa?.logo ? `<img src="${state.empresa.logo}" alt="Logo" class="app-header__logo">` : ''}
    <h1>${escapeHtml(state.empresa?.nome || 'Talão OS')}</h1>
  `;
  dom.headerOs.textContent = formatOsNumber(state.osSeq);
}

function renderTotals(state) {
  dom.totalGeral.textContent = brl(calcGrandTotal(state.draft));
}

function renderForm(state) {
  renderCliente(dom.formCliente, state.draft.cliente);
  renderVeiculo(dom.formVeiculo, state.draft.veiculo);
  renderItensTable(dom.itensServicos, 'servicos', state.draft.servicos);
  renderItensTable(dom.itensPecas, 'pecas', state.draft.pecas);
  renderTotals(state);
}

function renderAll(state) {
  renderHeader(state);
  renderForm(state);
  renderPreview(dom.previewRoot, state);
  renderModalEmpresa(dom.modalRoot, pendingEmpresa || state.empresa, state.ui.modalEmpresaOpen);
  renderHistorico(dom.historicoRoot, repository.getHistorico());
}

store.subscribe((state) => {
  renderTotals(state);
  renderPreview(dom.previewRoot, state);
  repository.saveDraft(state.draft);
});

renderAll(store.getState());

if (draftSalvo) {
  showToast('Rascunho recuperado.');
}

// --- ações ---

function updateDraftField(path, value) {
  store.setState((state) => {
    const [group, key] = path.split('.');
    return { draft: { ...state.draft, [group]: { ...state.draft[group], [key]: value } } };
  });
}

function updateItemField(section, index, key, value) {
  store.setState((state) => {
    const items = state.draft[section].map((item, i) => (
      i === Number(index) ? { ...item, [key]: value } : item
    ));
    return { draft: { ...state.draft, [section]: items } };
  });
  updateSubtotalCell(section, index, store.getState().draft[section][index]);
}

function addItem(section) {
  store.setState((state) => ({
    draft: { ...state.draft, [section]: [...state.draft[section], createEmptyItem()] },
  }));
  const container = section === 'servicos' ? dom.itensServicos : dom.itensPecas;
  renderItensTable(container, section, store.getState().draft[section]);
}

function removeItem(section, index) {
  store.setState((state) => ({
    draft: { ...state.draft, [section]: state.draft[section].filter((_, i) => i !== Number(index)) },
  }));
  const container = section === 'servicos' ? dom.itensServicos : dom.itensPecas;
  renderItensTable(container, section, store.getState().draft[section]);
}

function abrirConfig() {
  pendingEmpresa = { ...(store.getState().empresa || { nome: '', responsavel: '', logo: null, logoW: 0, logoH: 0 }) };
  store.setState((state) => ({ ui: { ...state.ui, modalEmpresaOpen: true } }));
  renderModalEmpresa(dom.modalRoot, pendingEmpresa, true);
}

function fecharConfig() {
  pendingEmpresa = null;
  store.setState((state) => ({ ui: { ...state.ui, modalEmpresaOpen: false } }));
  renderModalEmpresa(dom.modalRoot, store.getState().empresa, false);
}

function salvarConfig() {
  if (!pendingEmpresa?.nome?.trim()) {
    showToast('Informe o nome da oficina.', 'error');
    return;
  }

  const empresaSalva = pendingEmpresa;
  repository.saveEmpresa(empresaSalva);
  pendingEmpresa = null;

  store.setState((state) => ({ empresa: empresaSalva, ui: { ...state.ui, modalEmpresaOpen: false } }));
  const state = store.getState();
  renderHeader(state);
  renderModalEmpresa(dom.modalRoot, empresaSalva, false);
  renderPreview(dom.previewRoot, state);
  showToast('Dados da oficina salvos.', 'success');
}

function uploadLogo(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      pendingEmpresa = {
        ...pendingEmpresa,
        logo: reader.result,
        logoW: img.naturalWidth,
        logoH: img.naturalHeight,
      };
      renderModalEmpresa(dom.modalRoot, pendingEmpresa, true);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function validarDraft(state) {
  const erros = [];
  if (!state.empresa?.nome?.trim()) erros.push('Cadastre o nome da oficina.');
  if (!state.draft.cliente.nome.trim()) erros.push('Informe o nome do cliente.');
  if (!state.draft.servicos.some(isValidItem)) erros.push('Adicione ao menos um serviço válido.');
  return erros;
}

async function gerarPdf() {
  const state = store.getState();
  const erros = validarDraft(state);
  if (erros.length > 0) {
    showToast(erros[0], 'error');
    return;
  }

  const osSeq = repository.consumeNextOsNumber();
  showToast('Gerando PDF...');

  try {
    const { generatePdf } = await import('./pdf/generatePdf.js');
    await generatePdf({ empresa: state.empresa, osSeq, draft: state.draft });

    const totalGerado = calcValidGrandTotal(state.draft);
    const osNumero = formatOsNumber(osSeq);

    repository.addHistoricoEntry({
      osNumero,
      osSeq,
      dataHora: new Date().toISOString(),
      empresa: { ...state.empresa },
      cliente: { ...state.draft.cliente },
      veiculo: { ...state.draft.veiculo },
      servicos: state.draft.servicos.filter(isValidItem),
      pecas: state.draft.pecas.filter(isValidItem),
      total: totalGerado,
    });

    repository.clearDraft();
    store.setState({ draft: createEmptyDraft(), osSeq: repository.peekNextOsNumber() });
    renderAll(store.getState());

    dom.whatsappLink.hidden = false;
    dom.whatsappLink.href = buildWhatsappLink({
      empresaNome: state.empresa?.nome || '',
      cliente: state.draft.cliente,
      veiculo: state.draft.veiculo,
      servicos: state.draft.servicos,
      pecas: state.draft.pecas,
      total: totalGerado,
    });
    showToast('PDF gerado com sucesso.', 'success');
  } catch (error) {
    console.error(error);
    showToast('Não foi possível gerar o PDF.', 'error');
  }
}

async function reimprimirOs(index) {
  const entry = repository.getHistorico()[Number(index)];
  if (!entry) return;

  showToast('Gerando PDF...');
  try {
    const { regeneratePdf } = await import('./pdf/generatePdf.js');
    await regeneratePdf(entry);
    showToast('PDF gerado novamente.', 'success');
  } catch (error) {
    console.error(error);
    showToast('Não foi possível gerar o PDF.', 'error');
  }
}

function novaOs() {
  const confirmado = window.confirm('Iniciar uma nova OS? O rascunho atual será descartado.');
  if (!confirmado) return;

  repository.clearDraft();
  store.setState({ draft: createEmptyDraft() });
  dom.whatsappLink.hidden = true;
  renderAll(store.getState());
}

function imprimir() {
  window.print();
}

function togglePreview() {
  const aberto = dom.previewPanel.dataset.open === 'true';
  dom.previewPanel.dataset.open = String(!aberto);
}

// --- delegação de eventos ---
// main.js concentra a ligação entre eventos de entrada e o store; os módulos
// de UI só renderizam a partir do estado que recebem.

document.addEventListener('input', (event) => {
  const { target } = event;
  const { field, section, index } = target.dataset;
  if (!field) return;

  if (field === 'empresa.nome' || field === 'empresa.responsavel') {
    pendingEmpresa = { ...pendingEmpresa, [field.split('.')[1]]: target.value };
    return;
  }

  if (field.startsWith('item.')) {
    updateItemField(section, index, field.split('.')[1], target.value);
    return;
  }

  updateDraftField(field, target.value);
});

document.addEventListener('change', (event) => {
  if (event.target.dataset.action === 'upload-logo') {
    uploadLogo(event.target.files?.[0]);
  }
});

document.addEventListener('click', (event) => {
  if (event.target.classList?.contains('modal-overlay')) {
    fecharConfig();
    return;
  }

  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const { action, section, index } = trigger.dataset;

  switch (action) {
    case 'abrir-config':
      abrirConfig();
      break;
    case 'fechar-config':
      fecharConfig();
      break;
    case 'salvar-config':
      salvarConfig();
      break;
    case 'add-item':
      addItem(section);
      break;
    case 'remove-item':
      removeItem(section, index);
      break;
    case 'reimprimir-os':
      reimprimirOs(index);
      break;
    case 'gerar-pdf':
      gerarPdf();
      break;
    case 'nova-os':
      novaOs();
      break;
    case 'imprimir':
      imprimir();
      break;
    case 'toggle-preview':
      togglePreview();
      break;
    default:
      break;
  }
});
