const express = require('express');
const goalController = require('../controllers/goalController');
const { authenticate } = require('../middleware/auth');
const { idParam } = require('../validators/common');

const router = express.Router();
router.use(authenticate);
router.get('/', goalController.list);
router.post('/', goalController.create);
router.put('/:id', idParam, goalController.update);
router.delete('/:id', idParam, goalController.remove);

module.exports = router;
