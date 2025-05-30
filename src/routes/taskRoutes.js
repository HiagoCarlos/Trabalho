const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');

// Rotas de visualização (GET)
router.get('/', TaskController.listTasks);
router.get('/create', TaskController.showCreateForm);
router.get('/edit/:id', TaskController.showEditForm);

// Rotas de ação (POST)
router.post('/', TaskController.createTask);
router.post('/:id/update', TaskController.updateTask); // Alterado para POST
router.post('/:id/delete', TaskController.deleteTaskForm);

module.exports = router;