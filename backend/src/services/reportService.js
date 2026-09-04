const PDFDocument = require('pdfkit');
const { query } = require('../db/pool');
const { mapEntry } = require('../utils/mappers');
const analyticsService = require('./analyticsService');

async function loadEntries(userId, { from, to } = {}) {
  const where = ['user_id = $1'];
  const params = [userId];
  if (from) {
    params.push(from);
    where.push(`date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`date <= $${params.length}`);
  }
  const result = await query(
    `SELECT * FROM entries WHERE ${where.join(' AND ')} ORDER BY date DESC, id DESC`,
    params
  );
  return result.rows.map(mapEntry);
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function buildCsv(userId, filters) {
  const entries = await loadEntries(userId, filters);
  const header = ['id', 'date', 'type', 'title', 'category', 'amount', 'loan_type', 'person', 'note'];
  const lines = [header.join(',')];
  for (const e of entries) {
    lines.push(
      [
        e.id,
        e.date,
        e.type,
        csvEscape(e.title),
        csvEscape(e.category),
        e.amount,
        e.loan_type || '',
        csvEscape(e.person),
        csvEscape(e.note),
      ].join(',')
    );
  }
  return lines.join('\n');
}

function pipePdf(doc, res) {
  return new Promise((resolve, reject) => {
    doc.on('error', reject);
    res.on('finish', resolve);
    doc.pipe(res);
  });
}

async function buildPdf(userId, username, filters, res) {
  const [entries, summary] = await Promise.all([
    loadEntries(userId, filters),
    analyticsService.summary(userId),
  ]);
  const rangeLabel = [filters.from || 'start', filters.to || 'today'].join(' → ');

  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="fintrack-report.pdf"');

  const done = pipePdf(doc, res);

  doc.fontSize(20).text('FinTrack Financial Report', { align: 'center' });
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor('#444').text(`Prepared for ${username}`, { align: 'center' });
  doc.text(`Range: ${rangeLabel}`, { align: 'center' });
  doc.moveDown();
  doc.fillColor('#000').fontSize(13).text('Summary');
  doc.fontSize(11).moveDown(0.3);
  doc.text(`Income: ₹${summary.totalIncome.toFixed(2)}`);
  doc.text(`Expense: ₹${summary.totalExpense.toFixed(2)}`);
  doc.text(`Balance: ₹${summary.balance.toFixed(2)}`);
  doc.text(`Loan given: ₹${summary.totalLoanGiven.toFixed(2)}`);
  doc.text(`Loan taken: ₹${summary.totalLoanTaken.toFixed(2)}`);
  doc.moveDown();
  doc.fontSize(13).text(`Transactions (${entries.length})`);
  doc.moveDown(0.4);
  doc.fontSize(9);

  entries.slice(0, 80).forEach((e) => {
    const line = `${e.date}  ${e.type.padEnd(8)}  ₹${Number(e.amount).toFixed(2).padStart(10)}  ${e.title} (${e.category})`;
    doc.text(line, { width: 500 });
  });
  if (entries.length > 80) {
    doc.moveDown(0.5).text(`…and ${entries.length - 80} more entries (export CSV for the full list).`);
  }

  doc.end();
  await done;
}

module.exports = { buildCsv, buildPdf };
