const entryService = require('../services/entryService');
const recurringService = require('../services/recurringService');
const { asyncHandler } = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  await recurringService.processDueForUser(req.user.userId);
  const result = await entryService.listEntries(req.user.userId, req.query);
  res.json(result);
});

exports.create = asyncHandler(async (req, res) => {
  const entry = await entryService.createEntry(req.user.userId, req.body);
  res.status(201).json(entry);
});

exports.update = asyncHandler(async (req, res) => {
  const entry = await entryService.updateEntry(req.user.userId, Number(req.params.id), req.body);
  res.json(entry);
});

exports.remove = asyncHandler(async (req, res) => {
  await entryService.deleteEntry(req.user.userId, Number(req.params.id));
  res.status(204).send();
});
