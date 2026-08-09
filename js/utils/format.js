const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const quantityFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
});

export function brl(value) {
  return currencyFormatter.format(Number(value) || 0);
}

export function fmtQtd(value) {
  return quantityFormatter.format(Number(value) || 0);
}

export function pad4(value) {
  return String(Number(value) || 0).padStart(4, '0');
}

export function formatOsNumber(seq, date = new Date()) {
  return `OS-${date.getFullYear()}-${pad4(seq)}`;
}

export function formatDate(date = new Date()) {
  return date.toLocaleDateString('pt-BR');
}

export function formatDateTime(date = new Date()) {
  const hora = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${formatDate(date)} ${hora}`;
}

export function sanitizeFilename(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
