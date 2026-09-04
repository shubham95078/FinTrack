const express = require('express');
const entryController = require('../controllers/entryController');
const { authenticate } = require('../middleware/auth');
const { entryRules, idParam, listEntryRules } = require('../validators/common');

const router = express.Router();

router.use(authenticate);
router.get('/', listEntryRules, entryController.list);
router.post('/', entryRules, entryController.create);
router.put('/:id', idParam, entryRules, entryController.update);
router.delete('/:id', idParam, entryController.remove);

module.exports = router;
