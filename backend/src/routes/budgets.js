const express = require('express');
const budgetController = require('../controllers/budgetController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.get('/', budgetController.current);
router.get('/history', budgetController.list);
router.put('/', budgetController.upsert);

module.exports = router;
