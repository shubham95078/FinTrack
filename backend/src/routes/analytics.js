const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.get('/summary', analyticsController.summary);
router.get('/dashboard', analyticsController.dashboard);
router.get('/insights', analyticsController.insights);

module.exports = router;
