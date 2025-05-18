const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');

// Rotas de visualização (EJS)
router.get('/', TaskController.listTasks);
router.get('/create', TaskController.showCreateForm);
router.get('/edit/:id', TaskController.showEditForm);

// Rotas de ação para formulários HTML (POST)
router.post('/', TaskController.createTask); 
router.post('/:id/delete', TaskController.deleteTaskForm);
router.put('/:id/update', TaskController.updateTaskForm);


module.exports = router