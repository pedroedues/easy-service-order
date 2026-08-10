import { brl, fmtQtd, formatOsNumber, formatDate, formatDateTime, sanitizeFilename, normalizePlaca } from '../utils/format.js';
import { calcItemTotal, calcValidGrandTotal, isValidItem } from '../store.js';
import { shortHash } from '../utils/hash.js';

const VENDOR_BASE = new URL('../vendor/', import.meta.url);

const MARGIN = 20;
const INK = '#1F2933';
const INK_MUTED = '#5A6570';
const STEEL = '#D8DCE1';
const SIGNAL = '#E8A33D';

function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Não foi possível carregar ${url}`));
    document.head.appendChild(script);
  });
}

async function ensurePdfLibs() {
  if (!window.jspdf?.jsPDF) {
    await loadScript(new URL('jspdf.umd.min.js', VENDOR_BASE).href);
  }
  if (!window.jspdf?.jsPDF?.API?.autoTable) {
    await loadScript(new URL('jspdf.plugin.autotable.min.js', VENDOR_BASE).href);
  }
}

export async function generatePdf({ empresa, osSeq, draft }) {
  const now = new Date();
  const osNumero = formatOsNumber(osSeq, now);
  return buildAndSave({ empresa, osNumero, now, draft });
}

// Reprints a PDF exactly as originally issued, from a stored histórico
// snapshot — same OS number, same emission date, same empresa data as it
// was at the time (not whatever the config screen holds today).
export async function regeneratePdf(entry) {
  const draft = {
    cliente: entry.cliente,
    veiculo: entry.veiculo,
    servicos: entry.servicos,
    pecas: entry.pecas,
  };
  return buildAndSave({
    empresa: entry.empresa,
    osNumero: entry.osNumero,
    now: new Date(entry.dataHora),
    draft,
  });
}

async function buildAndSave({ empresa, osNumero, now, draft }) {
  await ensurePdfLibs();
  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const servicosValidos = draft.servicos.filter(isValidItem);
  const pecasValidas = draft.pecas.filter(isValidItem);
  const total = calcValidGrandTotal(draft);
  const codigo = shortHash(`${empresa?.nome || ''}|${osNumero}|${now.toISOString()}|${total}`);

  drawHeader(doc, { empresa, osNumero, data: formatDate(now), pageWidth });

  let cursorY = 50;
  cursorY = drawInfoSection(doc, cursorY, 'Cliente', [draft.cliente.nome, draft.cliente.contato]);

  const placa = normalizePlaca(draft.veiculo.placa);
  if (draft.veiculo.tipo || draft.veiculo.modelo || draft.veiculo.km || placa) {
    cursorY = drawInfoSection(doc, cursorY, 'Veículo', [
      [draft.veiculo.tipo, draft.veiculo.modelo].filter(Boolean).join(' · '),
      placa ? `Placa ${placa}` : '',
      draft.veiculo.km ? `${draft.veiculo.km} km` : '',
    ]);
  }

  cursorY = drawItemsTable(doc, cursorY, 'Serviços', servicosValidos);

  if (pecasValidas.length > 0) {
    cursorY = drawItemsTable(doc, cursorY, 'Peças', pecasValidas);
  }

  cursorY = drawTotal(doc, cursorY, total, pageWidth);
  drawSignatures(doc, cursorY, pageWidth, empresa?.responsavel);
  drawFooterOnAllPages(doc, { codigo, emitidoEm: formatDateTime(now) });

  doc.save(buildFilename(osNumero, draft.cliente.nome, placa));
}

function buildFilename(osNumero, clienteNome, placa) {
  const partes = [sanitizeFilename(osNumero)];
  if (placa) partes.push(sanitizeFilename(placa));
  partes.push(sanitizeFilename(clienteNome || 'cliente'));
  return `${partes.join('_')}.pdf`;
}

function extractImageFormat(dataUrl) {
  const match = /^data:image\/(png|jpeg|jpg|webp);/i.exec(dataUrl || '');
  if (!match) return 'PNG';
  const ext = match[1].toUpperCase();
  return ext === 'JPG' ? 'JPEG' : ext;
}

function drawHeader(doc, { empresa, osNumero, data, pageWidth }) {
  const headerTop = 14;
  let textX = MARGIN;

  if (empresa?.logo) {
    const maxH = 16;
    const ratio = (empresa.logoW && empresa.logoH) ? empresa.logoW / empresa.logoH : 1;
    const width = maxH * ratio;
    doc.addImage(empresa.logo, extractImageFormat(empresa.logo), MARGIN, headerTop, width, maxH);
    textX = MARGIN + width + 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(INK);
  doc.text(empresa?.nome || '', textX, headerTop + 11);

  const boxWidth = 52;
  const boxHeight = 18;
  const boxX = pageWidth - MARGIN - boxWidth;
  const boxY = headerTop - 2;
  const boxCenterX = boxX + boxWidth / 2;

  doc.setDrawColor(STEEL);
  doc.setLineWidth(0.4);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 1.5, 1.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(INK);
  doc.text(osNumero, boxCenterX, boxY + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(INK_MUTED);
  doc.text(data, boxCenterX, boxY + 14, { align: 'center' });

  doc.setDrawColor(INK);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 40, pageWidth - MARGIN, 40);
}

function drawInfoSection(doc, y, titulo, linhas) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(INK_MUTED);
  doc.text(titulo.toUpperCase(), MARGIN, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(INK);
  let cursor = y + 6;
  linhas.filter(Boolean).forEach((linha) => {
    doc.text(String(linha), MARGIN, cursor);
    cursor += 5;
  });

  doc.setDrawColor(STEEL);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, cursor, doc.internal.pageSize.getWidth() - MARGIN, cursor);

  return cursor + 8;
}

function drawItemsTable(doc, y, titulo, itens) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(INK_MUTED);
  doc.text(titulo.toUpperCase(), MARGIN, y);

  const body = itens.map((item) => [
    item.desc,
    fmtQtd(item.qtd),
    brl(item.preco),
    brl(calcItemTotal(item)),
  ]);

  doc.autoTable({
    startY: y + 3,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Descrição', 'Qtd.', 'Unit.', 'Subtotal']],
    body,
    styles: { font: 'helvetica', fontSize: 10, textColor: INK, cellPadding: 2.5 },
    headStyles: { fillColor: '#EDEFF2', textColor: INK, fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'right', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
    },
    rowPageBreak: 'avoid',
    theme: 'plain',
  });

  return doc.lastAutoTable.finalY + 8;
}

function drawTotal(doc, y, total, pageWidth) {
  const boxHeight = 12;
  let cursorY = y;

  if (cursorY + boxHeight > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    cursorY = MARGIN;
  }

  doc.setFillColor(SIGNAL);
  doc.rect(MARGIN, cursorY, pageWidth - MARGIN * 2, boxHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(INK);
  doc.text('TOTAL GERAL', MARGIN + 4, cursorY + 8);
  doc.text(brl(total), pageWidth - MARGIN - 4, cursorY + 8, { align: 'right' });

  return cursorY + boxHeight + 16;
}

function drawSignatures(doc, y, pageWidth, responsavel) {
  const pageHeight = doc.internal.pageSize.getHeight();
  let cursorY = y;

  if (cursorY + 30 > pageHeight - 20) {
    doc.addPage();
    cursorY = MARGIN + 10;
  }

  const lineY = cursorY + 15;
  const colWidth = (pageWidth - MARGIN * 2 - 10) / 2;
  const tecnicoColX = MARGIN + colWidth + 10;

  if (responsavel?.trim()) {
    doc.setFont('times', 'italic');
    doc.setFontSize(16);
    doc.setTextColor(INK);
    doc.text(responsavel.trim(), tecnicoColX + colWidth / 2, lineY - 3, { align: 'center' });
  }

  doc.setDrawColor(INK);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, lineY, MARGIN + colWidth, lineY);
  doc.line(tecnicoColX, lineY, tecnicoColX + colWidth, lineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(INK_MUTED);
  doc.text('Assinatura do Cliente', MARGIN + colWidth / 2, lineY + 5, { align: 'center' });
  doc.text('Assinatura do Técnico', tecnicoColX + colWidth / 2, lineY + 5, { align: 'center' });
}

function drawFooterOnAllPages(doc, { codigo, emitidoEm }) {
  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(INK_MUTED);
    doc.text(`Página ${i} de ${totalPages}`, MARGIN, pageHeight - 10);
    doc.text(`Emitido em ${emitidoEm}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Cód. ref.: ${codigo}`, pageWidth - MARGIN, pageHeight - 10, { align: 'right' });
  }
}
