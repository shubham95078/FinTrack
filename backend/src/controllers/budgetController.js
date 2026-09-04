const budgetService = require('../services/budgetService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.current = asyncHandler(async (req, res) => {
  const data = await budgetService.getBudget(req.user.userId, req.query.month);
  res.json(data);
});

exports.list = asyncHandler(async (req, res) => {
  const data = await budgetService.listBudgets(req.user.userId);
  res.json(data);
});

exports.upsert = asyncHandler(async (req, res) => {
  const data = await budgetService.upsertBudget(req.user.userId, req.body);
  res.json(data);
});
