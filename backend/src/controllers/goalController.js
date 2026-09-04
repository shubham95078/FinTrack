const goalService = require('../services/goalService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  res.json(await goalService.listGoals(req.user.userId));
});

exports.create = asyncHandler(async (req, res) => {
  const data = await goalService.createGoal(req.user.userId, req.body);
  res.status(201).json(data);
});

exports.update = asyncHandler(async (req, res) => {
  const data = await goalService.updateGoal(req.user.userId, Number(req.params.id), req.body);
  res.json(data);
});

exports.remove = asyncHandler(async (req, res) => {
  await goalService.deleteGoal(req.user.userId, Number(req.params.id));
  res.status(204).send();
});
