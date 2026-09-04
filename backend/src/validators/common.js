const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate');

const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username and password are required'),
  body('password').notEmpty().withMessage('Username and password are required'),
  validate,
];

const entryRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('amount').notEmpty().withMessage('Amount is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('type').isIn(['income', 'expense', 'loan']).withMessage('Type must be income, expense, or loan'),
  body('date')
    .optional({ values: 'falsy' })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be YYYY-MM-DD'),
  validate,
];

const idParam = [param('id').isInt({ min: 1 }).withMessage('Invalid id'), validate];

const listEntryRules = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isIn(['date', 'amount', 'title', 'category']),
  query('order').optional().isIn(['asc', 'desc']),
  query('type').optional().isIn(['income', 'expense', 'loan']),
  validate,
];

module.exports = { registerRules, loginRules, entryRules, idParam, listEntryRules };
