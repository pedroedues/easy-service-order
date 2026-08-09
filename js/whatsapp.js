import { brl, formatOsNumber } from './utils/format.js';

export function buildWhatsappLink(cliente, osSeq, total) {
  const digits = (cliente?.contato || '').replace(/\D/g, '');
  const numero = digits.length >= 10 ? `55${digits.replace(/^55/, '')}` : '';
  const mensagem = `Olá ${cliente?.nome || ''}! Segue a ${formatOsNumber(osSeq)}, total ${brl(total)}.`;
  const texto = encodeURIComponent(mensagem.trim());
  return numero ? `https://wa.me/${numero}?text=${texto}` : `https://wa.me/?text=${texto}`;
}
