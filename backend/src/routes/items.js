const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

router.post('/', itemController.addItem);
router.get('/', itemController.getAllItems);
router.get('/active', itemController.getActiveItems);
router.put('/:id', itemController.updateItem);
router.delete('/:id', itemController.deleteItem);
router.patch('/:id/toggle', itemController.toggleItemStatus);

router.get('/categories', itemController.getCategories);
router.post('/categories', itemController.addCategory);
router.delete('/categories/:id', itemController.deleteCategory);

module.exports = router;
