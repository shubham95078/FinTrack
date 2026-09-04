const express = require('express');
const recurringController = require('../controllers/recurringController');
const { authenticate } = require('../middleware/auth');
const { idParam } = require('../validators/common');

const router = express.Router();
router.use(authenticate);
router.get('/', recurringController.list);
router.post('/', recurringController.create);
router.put('/:id', idParam, recurringController.update);
router.delete('/:id', idParam, recurringController.remove);

module.exports = router;
