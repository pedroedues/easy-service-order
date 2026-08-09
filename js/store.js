export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(patch) {
    state = typeof patch === 'function'
      ? { ...state, ...patch(state) }
      : { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}

export function calcItemTotal(item) {
  return (Number(item.qtd) || 0) * (Number(item.preco) || 0);
}

export function calcSectionTotal(items) {
  return items.reduce((sum, item) => sum + calcItemTotal(item), 0);
}

export function calcGrandTotal(draft) {
  const servicosTotal = calcSectionTotal(draft.servicos);
  const pecasTotal = draft.pecasAtivo ? calcSectionTotal(draft.pecas) : 0;
  return servicosTotal + pecasTotal;
}

export function isValidItem(item) {
  return item.desc.trim() !== '' && Number(item.qtd) > 0;
}

export function createEmptyItem() {
  return { desc: '', qtd: 1, preco: 0 };
}

export function createEmptyDraft() {
  return {
    cliente: { nome: '', contato: '' },
    veiculo: { tipo: '', modelo: '', km: '' },
    servicos: [createEmptyItem()],
    pecas: [],
    pecasAtivo: false,
  };
}
