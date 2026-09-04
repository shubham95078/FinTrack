const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.get('/csv', reportController.csv);
router.get('/pdf', reportController.pdf);

module.exports = router;
