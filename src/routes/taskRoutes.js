// src/routes/taskRoutes.js
const express = require('express');
const router = express.Router(); // ← Importante usar express.Router()
const taskController = require('../controllers/taskController');

// Rotas corretas com funções handler
router.get('/', taskController.getTasks);
router.post('/', taskController.createTask); 
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;