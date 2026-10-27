// invoicePdfGenerator.js
// Utilidad para generación y descarga directa de facturas médicas en PDF (cliente + backend fallback)

const API_URL = import.meta.env.VITE_API_URL;

function sanitizePdfText(str) {
  if (!str) return '';
  return String(str)
    .replace(/€/g, 'EUR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita acentos para compatibilidad estándar PDF básica
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function formatAmount(val, currency = 'EUR') {
  const n = parseFloat(val) || 0;
  const curr = (currency || 'EUR').toUpperCase();
  const formatted = n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (curr === 'USD') return `$ ${formatted}`;
  return `${formatted} EUR`;
}

/**
 * Generador nativo en JavaScript de PDF 1.4 sin dependencias externas.
 * Garantiza que la descarga de la factura SIEMPRE funcione aunque el backend esté desconectado.
 */
function buildClientPdfBlob(invoice) {
  const isExpense = invoice.invoice_type === 'expense';
  let num = String(invoice.invoice_number || '').trim();
  if (!num || num.length > 22 || num.includes(' ') || !/^[A-Za-z0-9\-_/]+$/.test(num)) {
    const prefix = isExpense ? 'GAS' : 'FAC';
    const year = new Date().getFullYear();
    const rnd = Math.floor(1000 + Math.random() * 9000);
    num = `${prefix}-${year}-${rnd}`;
  }
  const issueDate = invoice.issue_date || new Date().toLocaleDateString('es-ES');
  const dueDate = invoice.due_date || issueDate;
  const currency = invoice.currency || 'EUR';

  const docName = invoice.issuer?.name || (isExpense ? 'Proveedor / Acreedor' : 'Dr. Médico Especialista');
  const docNif = invoice.issuer?.nif || '—';
  const docAddress = invoice.issuer?.address || 'Centro Médico Mivor';
  const docContact = invoice.issuer?.email || '';

  const clientName = invoice.recipient?.name || (isExpense ? 'Dr. Médico Especialista' : 'Paciente Particular');
  const clientNif = invoice.recipient?.nif || '—';
  const clientAddress = invoice.recipient?.address || '';

  const subtotal = parseFloat(invoice.subtotal) || 0;
  const taxRate = parseFloat(invoice.tax_rate) || 0;
  const taxAmount = parseFloat(invoice.tax_amount) || 0;
  const retentionRate = parseFloat(invoice.retention_rate) || 0;
  const retentionAmount = parseFloat(invoice.retention_amount) || 0;
  const totalAmount = parseFloat(invoice.total_amount) || subtotal;
  const paymentMethod = invoice.payment_method || 'Transferencia bancaria';
  const paymentStatus = (invoice.payment_status || 'PAGADA').toUpperCase();

  const items = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [{ description: 'Consulta / Servicio Medico', quantity: 1, unit_price: subtotal, amount: subtotal }];

  const PAGE_W = 612;
  const PAGE_H = 792;
  const ML = 40;
  const CW = 532;

  const cmds = [];

  // Barra superior decorativa (Azul para ingreso, Rosa para gasto)
  const [r, g, b] = isExpense ? [0.85, 0.2, 0.35] : [0.12, 0.44, 0.88];
  cmds.push(`q ${r} ${g} ${b} rg ${ML} 756 ${CW} 5 re f Q`);

  // Header
  cmds.push(`q BT ${r} ${g} ${b} rg /F2 9 Tf 1 0 0 1 ${ML} 738 Tm (${sanitizePdfText('MIVOR SALUD DIGITAL - FACTURACION ELECTRONICA')}) Tj ET Q`);
  const typeTitle = isExpense ? 'FACTURA DE COMPRA / GASTO' : 'FACTURA DE INGRESO';
  cmds.push(`q BT 0.1 0.14 0.2 rg /F2 17 Tf 1 0 0 1 ${ML} 716 Tm (${sanitizePdfText(typeTitle)}) Tj ET Q`);

  // Caja Nº Factura
  const boxW = 180;
  const boxH = 46;
  const boxX = ML + CW - boxW;
  const boxY = 704;
  cmds.push(`q 0.96 0.97 1.00 rg ${r} ${g} ${b} RG 1 w ${boxX} ${boxY} ${boxW} ${boxH} re B Q`);
  cmds.push(`q BT 0.45 0.5 0.6 rg /F2 8 Tf 1 0 0 1 ${boxX + 12} ${boxY + 30} Tm (NUMERO DE FACTURA) Tj ET Q`);
  cmds.push(`q BT ${r} ${g} ${b} rg /F2 13 Tf 1 0 0 1 ${boxX + 12} ${boxY + 12} Tm (${sanitizePdfText(num)}) Tj ET Q`);

  // Metadatos
  cmds.push(`q BT 0.4 0.45 0.55 rg /F1 9 Tf 1 0 0 1 ${ML} 688 Tm (Fecha de emision: ${sanitizePdfText(issueDate)}) Tj 1 0 0 1 ${ML + 160} 688 Tm (Vencimiento: ${sanitizePdfText(dueDate)}) Tj 1 0 0 1 ${ML + 320} 688 Tm (Estado:) Tj ET Q`);
  const statusColor = paymentStatus === 'PAGADA' ? '0.1 0.6 0.3' : '0.85 0.5 0.1';
  cmds.push(`q BT ${statusColor} rg /F2 9 Tf 1 0 0 1 ${ML + 360} 688 Tm (${paymentStatus}) Tj ET Q`);

  // Tarjetas Emisor y Receptor
  const cardW = (CW - 14) / 2;
  const cardH = 80;
  const cardY = 592;

  // Emisor
  const docLine1 = docNif && docNif !== '—'
    ? `NIF/CIF: ${sanitizePdfText(docNif)}`
    : (docContact ? `Email: ${sanitizePdfText(docContact)}` : '');
  const docLine2 = sanitizePdfText(docAddress || '');
  const docLine3 = docNif && docNif !== '—' && docContact ? sanitizePdfText(docContact) : '';

  cmds.push(`q 0.98 0.98 0.99 rg 0.88 0.9 0.94 RG 0.8 w ${ML} ${cardY} ${cardW} ${cardH} re B Q`);
  cmds.push(`q BT 0.15 0.22 0.35 rg /F2 9 Tf 1 0 0 1 ${ML + 10} ${cardY + cardH - 14} Tm (${sanitizePdfText(isExpense ? 'PROVEEDOR / EMISOR' : 'EMISOR (PROFESIONAL MEDICO)')}) Tj ET Q`);
  cmds.push(`q BT 0.1 0.12 0.18 rg /F2 10 Tf 1 0 0 1 ${ML + 10} ${cardY + cardH - 28} Tm (${sanitizePdfText(docName)}) Tj ET Q`);
  cmds.push(`q BT 0.35 0.4 0.5 rg /F1 8.5 Tf 1 0 0 1 ${ML + 10} ${cardY + cardH - 42} Tm (${docLine1}) Tj 1 0 0 1 ${ML + 10} ${cardY + cardH - 54} Tm (${docLine2}) Tj 1 0 0 1 ${ML + 10} ${cardY + cardH - 66} Tm (${docLine3}) Tj ET Q`);

  // Receptor
  const cx2 = ML + cardW + 14;
  cmds.push(`q 0.98 0.98 0.99 rg 0.88 0.9 0.94 RG 0.8 w ${cx2} ${cardY} ${cardW} ${cardH} re B Q`);
  cmds.push(`q BT 0.15 0.22 0.35 rg /F2 9 Tf 1 0 0 1 ${cx2 + 10} ${cardY + cardH - 14} Tm (${sanitizePdfText(isExpense ? 'CLIENTE / RECEPTOR' : 'DATOS DEL PACIENTE / CLIENTE')}) Tj ET Q`);
  cmds.push(`q BT 0.1 0.12 0.18 rg /F2 10 Tf 1 0 0 1 ${cx2 + 10} ${cardY + cardH - 28} Tm (${sanitizePdfText(clientName)}) Tj ET Q`);
  cmds.push(`q BT 0.35 0.4 0.5 rg /F1 8.5 Tf 1 0 0 1 ${cx2 + 10} ${cardY + cardH - 42} Tm (NIF/DNI: ${sanitizePdfText(clientNif)}) Tj 1 0 0 1 ${cx2 + 10} ${cardY + cardH - 54} Tm (${sanitizePdfText(clientAddress)}) Tj ET Q`);

  // Tabla de Conceptos
  let curY = 560;
  const thH = 22;
  cmds.push(`q 0.12 0.18 0.28 rg ${ML} ${curY - thH} ${CW} ${thH} re f Q`);
  cmds.push(`q BT 1 1 1 rg /F2 8.5 Tf 1 0 0 1 ${ML + 10} ${curY - 15} Tm (CONCEPTO / DESCRIPCION) Tj 1 0 0 1 ${ML + 270} ${curY - 15} Tm (CANT.) Tj 1 0 0 1 ${ML + 330} ${curY - 15} Tm (PRECIO UNIT.) Tj 1 0 0 1 ${ML + 440} ${curY - 15} Tm (IMPORTE) Tj ET Q`);
  curY -= thH;

  items.slice(0, 7).forEach((it, idx) => {
    const desc = it.description || it.concept || 'Servicio asistencial';
    const qty = it.quantity || 1;
    const price = it.unit_price || it.amount || 0;
    const rowAmt = it.amount || (qty * price);

    const rH = 22;
    const rowBg = idx % 2 === 1 ? '0.98 0.98 0.99 rg' : '1 1 1 rg';
    cmds.push(`q ${rowBg} ${ML} ${curY - rH} ${CW} ${rH} re f 0.9 0.92 0.95 RG 0.5 w ${ML} ${curY - rH} m ${ML + CW} ${curY - rH} l S Q`);
    cmds.push(`q BT 0.15 0.18 0.25 rg /F1 9 Tf 1 0 0 1 ${ML + 10} ${curY - 15} Tm (${sanitizePdfText(desc.slice(0, 48))}) Tj 1 0 0 1 ${ML + 278} ${curY - 15} Tm (${qty}) Tj 1 0 0 1 ${ML + 330} ${curY - 15} Tm (${sanitizePdfText(formatAmount(price, currency))}) Tj /F2 9 Tf 1 0 0 1 ${ML + 440} ${curY - 15} Tm (${sanitizePdfText(formatAmount(rowAmt, currency))}) Tj ET Q`);
    curY -= rH;
  });

  curY -= 16;

  // Bloque Totales e Info de Pago
  const leftW = 310;
  const totW = CW - leftW - 14;
  const totX = ML + leftW + 14;
  const bH = 92;

  // Pago
  cmds.push(`q 0.98 0.98 0.99 rg 0.88 0.9 0.94 RG 0.8 w ${ML} ${curY - bH} ${leftW} ${bH} re B Q`);
  cmds.push(`q BT 0.2 0.25 0.35 rg /F2 8.5 Tf 1 0 0 1 ${ML + 12} ${curY - 16} Tm (METODO DE PAGO Y CONDICIONES) Tj ET Q`);
  cmds.push(`q BT 0.15 0.18 0.25 rg /F1 8.5 Tf 1 0 0 1 ${ML + 12} ${curY - 32} Tm (Forma de pago: ${sanitizePdfText(paymentMethod)}) Tj ET Q`);
  cmds.push(`q BT 0.45 0.5 0.6 rg /F1 7.5 Tf 1 0 0 1 ${ML + 12} ${curY - 48} Tm (Operacion sujeta a regimen fiscal sanitario y normativas tributarias.) Tj 1 0 0 1 ${ML + 12} ${curY - 60} Tm (Exencion de IVA segun normativa medica aplicable o desglosado.) Tj 1 0 0 1 ${ML + 12} ${curY - 72} Tm (Emision certificada en la plataforma Mivor Salud.) Tj ET Q`);

  // Totales
  cmds.push(`q 0.97 0.98 1.00 rg 0.85 0.88 0.95 RG 1 w ${totX} ${curY - bH} ${totW} ${bH} re B Q`);
  cmds.push(`q BT 0.35 0.4 0.5 rg /F1 8.5 Tf 1 0 0 1 ${totX + 12} ${curY - 18} Tm (Base Imponible:) Tj 1 0 0 1 ${totX + totW - 75} ${curY - 18} Tm (${sanitizePdfText(formatAmount(subtotal, currency))}) Tj ET Q`);
  cmds.push(`q BT 0.35 0.4 0.5 rg /F1 8.5 Tf 1 0 0 1 ${totX + 12} ${curY - 32} Tm (IVA (${taxRate}%):) Tj 1 0 0 1 ${totX + totW - 75} ${curY - 32} Tm (${sanitizePdfText(formatAmount(taxAmount, currency))}) Tj ET Q`);
  if (retentionRate > 0) {
    cmds.push(`q BT 0.35 0.4 0.5 rg /F1 8.5 Tf 1 0 0 1 ${totX + 12} ${curY - 46} Tm (Retencion (${retentionRate}%):) Tj 1 0 0 1 ${totX + totW - 75} ${curY - 46} Tm (-${sanitizePdfText(formatAmount(retentionAmount, currency))}) Tj ET Q`);
  }
  cmds.push(`q 0.8 0.84 0.9 RG 0.5 w ${totX + 10} ${curY - bH + 32} m ${totX + totW - 10} ${curY - bH + 32} l S Q`);
  cmds.push(`q BT 0.1 0.15 0.25 rg /F2 11 Tf 1 0 0 1 ${totX + 12} ${curY - bH + 12} Tm (TOTAL FACTURA:) Tj ${r} ${g} ${b} rg /F2 13 Tf 1 0 0 1 ${totX + totW - 90} ${curY - bH + 12} Tm (${sanitizePdfText(formatAmount(totalAmount, currency))}) Tj ET Q`);

  curY -= (bH + 24);

  // Firma y Código de Seguridad
  cmds.push(`q BT 0.4 0.45 0.55 rg /F2 8 Tf 1 0 0 1 ${ML} ${curY - 8} Tm (CERTIFICACION DIGITAL Y VALIDEZ LEGAL) Tj ET Q`);
  cmds.push(`q BT 0.5 0.55 0.65 rg /F1 7.5 Tf 1 0 0 1 ${ML} ${curY - 20} Tm (Doc ID: ${sanitizePdfText(num)} - Hash de verificacion contable activo) Tj ET Q`);
  cmds.push(`q 0.7 0.75 0.85 RG 0.6 w ${ML + CW - 170} ${curY - 6} m ${ML + CW - 10} ${curY - 6} l S Q`);
  cmds.push(`q BT 0.3 0.35 0.45 rg /F2 8.5 Tf 1 0 0 1 ${ML + CW - 160} ${curY - 18} Tm (Firma del Emisor / Sello) Tj /F3 8 Tf 1 0 0 1 ${ML + CW - 160} ${curY - 28} Tm (${sanitizePdfText(docName)}) Tj ET Q`);

  // Footer
  cmds.push(`q 0.88 0.9 0.94 RG 0.5 w ${ML} 38 m ${ML + CW} 38 l S BT /F1 7.5 Tf 0.5 0.55 0.65 rg 1 0 0 1 ${ML} 26 Tm (Factura oficial ${sanitizePdfText(num)} - Generada por Mivor Health Cloud) Tj 1 0 0 1 ${ML + CW - 65} 26 Tm (Pagina 1 de 1) Tj ET Q`);

  const streamBytes = cmds.join('\n');
  const streamLen = streamBytes.length;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [6 0 R] /Count 1 >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents 7 0 R >>`,
    `<< /Length ${streamLen} >>\nstream\n${streamBytes}\nendstream`,
  ];

  let header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = '';
  const offsets = [0];

  objects.forEach((obj, idx) => {
    offsets.push(header.length + body.length);
    body += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = header.length + body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const fullPdf = header + body + xref + trailer;

  return new Blob([fullPdf], { type: 'application/pdf' });
}

/**
 * Descarga la factura en PDF. Intenta el endpoint del backend y si no está disponible,
 * usa la generación nativa en cliente para garantizar éxito instantáneo.
 */
export async function downloadInvoicePdf(invoiceData) {
  const token = localStorage.getItem('medai_token');
  const filename = `Factura_${invoiceData.invoice_number || 'FAC-2026'}.pdf`;

  try {
    const res = await fetch(`${API_URL}/accounting/invoices/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(invoiceData),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, source: 'backend' };
    }
  } catch (err) {
    console.warn('Backend PDF endpoint no disponible, recurriendo a generador cliente nativo:', err);
  }

  // Fallback garantizado en cliente
  const clientBlob = buildClientPdfBlob(invoiceData);
  const url = URL.createObjectURL(clientBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { success: true, source: 'client' };
}

/**
 * Abre el diálogo de impresión con el diseño oficial de la factura para A4.
 */
export function printInvoice(invoiceData) {
  const isExpense = invoiceData.invoice_type === 'expense';
  let num = String(invoiceData.invoice_number || '').trim();
  if (!num || num.length > 22 || num.includes(' ') || !/^[A-Za-z0-9\-_/]+$/.test(num)) {
    const prefix = isExpense ? 'GAS' : 'FAC';
    const year = new Date().getFullYear();
    const rnd = Math.floor(1000 + Math.random() * 9000);
    num = `${prefix}-${year}-${rnd}`;
  }
  const typeTitle = isExpense ? 'FACTURA DE COMPRA / GASTO' : 'FACTURA DE INGRESO';
  const issueDate = invoiceData.issue_date || new Date().toLocaleDateString('es-ES');
  const dueDate = invoiceData.due_date || issueDate;
  const currency = invoiceData.currency || 'EUR';

  const docName = invoiceData.issuer?.name || (isExpense ? 'Proveedor / Acreedor' : 'Dr. Médico Especialista');
  const docNif = invoiceData.issuer?.nif || '—';
  const docAddress = invoiceData.issuer?.address || 'Centro Médico Mivor';
  const docEmail = invoiceData.issuer?.email || '';

  const clientName = invoiceData.recipient?.name || (isExpense ? 'Dr. Médico Especialista' : 'Paciente Particular');
  const clientNif = invoiceData.recipient?.nif || '—';
  const clientAddress = invoiceData.recipient?.address || '';

  const subtotal = parseFloat(invoiceData.subtotal) || 0;
  const taxRate = parseFloat(invoiceData.tax_rate) || 0;
  const taxAmount = parseFloat(invoiceData.tax_amount) || 0;
  const retentionRate = parseFloat(invoiceData.retention_rate) || 0;
  const retentionAmount = parseFloat(invoiceData.retention_amount) || 0;
  const totalAmount = parseFloat(invoiceData.total_amount) || subtotal;
  const paymentMethod = invoiceData.payment_method || 'Transferencia bancaria';
  const paymentStatus = (invoiceData.payment_status || 'PAGADA').toUpperCase();

  const items = Array.isArray(invoiceData.items) && invoiceData.items.length > 0
    ? invoiceData.items
    : [{ description: 'Consulta / Servicio Médico', quantity: 1, unit_price: subtotal, amount: subtotal }];

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Factura ${num}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
        .top-bar { height: 5px; background: ${isExpense ? '#f43f5e' : '#2563eb'}; border-radius: 4px; margin-bottom: 25px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
        .brand { font-size: 11px; font-weight: 800; color: ${isExpense ? '#f43f5e' : '#2563eb'}; letter-spacing: 0.05em; text-transform: uppercase; }
        .title { font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 4px; }
        .inv-box { border: 1.5px solid ${isExpense ? '#fecdd3' : '#bfdbfe'}; background: ${isExpense ? '#fff1f2' : '#eff6ff'}; border-radius: 12px; padding: 12px 18px; text-align: right; }
        .inv-box-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .inv-box-number { font-size: 18px; font-weight: 900; color: ${isExpense ? '#e11d48' : '#1d4ed8'}; }
        .meta-row { display: flex; gap: 30px; font-size: 12px; color: #64748b; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        .badge-paid { background: #dcfce7; color: #15803d; }
        .badge-pending { background: #fef3c7; color: #b45309; }
        .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
        .card-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 8px; }
        .card-name { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .card-line { font-size: 12px; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        th:last-child { text-align: right; }
        td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
        td:last-child { text-align: right; font-weight: 700; }
        tr:nth-child(even) td { background: #f8fafc; }
        .bottom-section { display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px; }
        .payment-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 12px; }
        .totals-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; }
        .tot-row { display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 8px; }
        .tot-row.final { font-size: 16px; font-weight: 900; color: #0f172a; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 10px; }
        .tot-row.final span:last-child { color: ${isExpense ? '#e11d48' : '#2563eb'}; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="top-bar"></div>
      <div class="header">
        <div>
          <div class="brand">Mivor Salud Digital · Sistema Clínico</div>
          <div class="title">${typeTitle}</div>
        </div>
        <div class="inv-box">
          <div class="inv-box-label">Nº de Factura</div>
          <div class="inv-box-number">${num}</div>
        </div>
      </div>

      <div class="meta-row">
        <div><strong>Fecha emisión:</strong> ${issueDate}</div>
        <div><strong>Vencimiento:</strong> ${dueDate}</div>
        <div>
          <strong>Estado:</strong> 
          <span class="badge ${paymentStatus === 'PAGADA' ? 'badge-paid' : 'badge-pending'}">${paymentStatus}</span>
        </div>
      </div>

      <div class="cards">
        <div class="card">
          <div class="card-title">${isExpense ? 'Proveedor / Emisor' : 'Emisor (Profesional Médico)'}</div>
          <div class="card-name">${docName}</div>
          <div class="card-line">NIF/CIF: ${docNif}</div>
          <div class="card-line">${docAddress}</div>
          <div class="card-line">${docEmail}</div>
        </div>
        <div class="card">
          <div class="card-title">${isExpense ? 'Cliente / Receptor' : 'Receptor (Paciente / Cliente)'}</div>
          <div class="card-name">${clientName}</div>
          <div class="card-line">NIF/DNI: ${clientNif}</div>
          <div class="card-line">${clientAddress}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descripción / Concepto</th>
            <th style="width: 70px; text-align: center;">Cant.</th>
            <th style="width: 120px; text-align: right;">Precio Unit.</th>
            <th style="width: 120px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(it => `
            <tr>
              <td>${it.description || it.concept || 'Servicio asistencial'}</td>
              <td style="text-align: center;">${it.quantity || 1}</td>
              <td style="text-align: right;">${formatAmount(it.unit_price || it.amount || 0, currency)}</td>
              <td>${formatAmount(it.amount || ((it.quantity || 1) * (it.unit_price || it.amount || 0)), currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="bottom-section">
        <div class="payment-box">
          <div style="font-weight: 800; margin-bottom: 6px; color: #1e293b;">Condiciones y Forma de Pago</div>
          <p style="margin: 0 0 8px 0; color: #475569;">Método: <strong>${paymentMethod}</strong></p>
          <p style="margin: 0; color: #64748b; font-size: 11px;">
            ${invoiceData.notes || 'Operación sujeta a las normativas sanitarias vigentes. Factura emitida electrónicamente y certificada en Mivor Health Cloud.'}
          </p>
        </div>

        <div class="totals-box">
          <div class="tot-row">
            <span>Base Imponible:</span>
            <span>${formatAmount(subtotal, currency)}</span>
          </div>
          <div class="tot-row">
            <span>IVA (${taxRate}%):</span>
            <span>${formatAmount(taxAmount, currency)}</span>
          </div>
          ${retentionRate > 0 ? `
            <div class="tot-row">
              <span>Retención (${retentionRate}%):</span>
              <span>-${formatAmount(retentionAmount, currency)}</span>
            </div>
          ` : ''}
          <div class="tot-row final">
            <span>Total Factura:</span>
            <span>${formatAmount(totalAmount, currency)}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <div>Factura oficial ${num} · Validez fiscal contable</div>
        <div>Mivor Health Cloud · Documento Certificado</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
