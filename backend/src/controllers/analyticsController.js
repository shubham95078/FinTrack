const analyticsService = require('../services/analyticsService');
const budgetService = require('../services/budgetService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.summary = asyncHandler(async (req, res) => {
  const data = await analyticsService.summary(req.user.userId);
  res.json(data);
});

exports.dashboard = asyncHandler(async (req, res) => {
  const data = await analyticsService.dashboard(req.user.userId, req.query.month);
  res.json(data);
});

exports.insights = asyncHandler(async (req, res) => {
  const [data, budget] = await Promise.all([
    analyticsService.insights(req.user.userId),
    budgetService.getBudget(req.user.userId),
  ]);
  res.json({
    ...data,
    budgetAlert: budget.alert,
    overBudget: budget.overBudget,
    budget,
  });
});
