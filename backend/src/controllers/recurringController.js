const recurringService = require('../services/recurringService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  await recurringService.processDueForUser(req.user.userId);
  const data = await recurringService.listRecurring(req.user.userId);
  res.json(data);
});

exports.create = asyncHandler(async (req, res) => {
  const data = await recurringService.createRecurring(req.user.userId, req.body);
  res.status(201).json(data);
});

exports.update = asyncHandler(async (req, res) => {
  const data = await recurringService.updateRecurring(
    req.user.userId,
    Number(req.params.id),
    req.body
  );
  res.json(data);
});

exports.remove = asyncHandler(async (req, res) => {
  await recurringService.deleteRecurring(req.user.userId, Number(req.params.id));
  res.status(204).send();
});
