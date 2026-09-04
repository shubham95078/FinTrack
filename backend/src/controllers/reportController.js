const reportService = require('../services/reportService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.csv = asyncHandler(async (req, res) => {
  const csv = await reportService.buildCsv(req.user.userId, req.query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="fintrack-report.csv"');
  res.send(csv);
});

exports.pdf = asyncHandler(async (req, res) => {
  await reportService.buildPdf(req.user.userId, req.user.username, req.query, res);
});
