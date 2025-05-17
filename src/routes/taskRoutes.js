const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const supabase = require('../config/supabaseClient');


// Rotas de visualização (EJS)
router.get('/', TaskController.listTasks);
router.get('/create', TaskController.showCreateForm);
router.get('/edit/:id', TaskController.showEditForm);

// Rotas de API (JSON)
router.post('/', TaskController.createTask); 
router.put('/api/tasks/:id', TaskController.updateTask);
router.delete('/api/tasks/:id', TaskController.deleteTask);

module.exports = router;