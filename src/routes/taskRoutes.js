const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');

// Rota para página de tarefas (EJS)
router.get('/', TaskController.listTasks);

// Rota para criar tarefa (API)
router.post('/api/tasks', TaskController.createTask);

// Rota para mostrar formulário de edição (EJS)
router.get('/edit/:id', TaskController.showEditForm);

// Rota para atualizar tarefa (API)
router.put('/api/tasks/:id', TaskController.updateTask);

// Rota para excluir tarefa (API)
router.delete('/api/tasks/:id', TaskController.deleteTask);

module.exports = router;