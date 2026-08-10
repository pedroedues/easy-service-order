import { brl, normalizePlaca } from './utils/format.js';
import { isValidItem, calcItemTotal } from './store.js';

function formatItemLines(items) {
  return items
    .filter(isValidItem)
    .map((item) => `- ${item.desc} — ${brl(calcItemTotal(item))}`)
    .join('\n');
}

export function buildWhatsappMessage({ empresaNome, cliente, veiculo, servicos, pecas, total }) {
  const placa = normalizePlaca(veiculo?.placa);
  const veiculoBase = [veiculo?.tipo, veiculo?.modelo].filter(Boolean).join(' ');
  const veiculoLabel = (veiculoBase + (placa ? ` (${placa})` : '')).trim();
  const titulo = veiculoLabel
    ? `*_Orçamento ${empresaNome} - ${veiculoLabel}_*`
    : `*_Orçamento ${empresaNome}_*`;

  const servicosLines = formatItemLines(servicos);
  const pecasLines = formatItemLines(pecas);

  const partes = [];
  if (cliente?.nome) partes.push(`Olá ${cliente.nome}!`);
  partes.push(titulo);
  partes.push(`*Mão de obra*\n${servicosLines || '- —'}`);
  if (pecasLines) partes.push(`*Peças*\n${pecasLines}`);
  partes.push(`*Total: ${brl(total)}*`);

  return partes.join('\n\n');
}

export function buildWhatsappLink({ empresaNome, cliente, veiculo, servicos, pecas, total }) {
  const digits = (cliente?.contato || '').replace(/\D/g, '');
  const numero = digits.length >= 10 ? `55${digits.replace(/^55/, '')}` : '';
  const mensagem = buildWhatsappMessage({ empresaNome, cliente, veiculo, servicos, pecas, total });
  const texto = encodeURIComponent(mensagem);
  return numero ? `https://wa.me/${numero}?text=${texto}` : `https://wa.me/?text=${texto}`;
}
