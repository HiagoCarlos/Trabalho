// src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Banco de dados em memória
let tasks = [];
let nextId = 1;

// GET /tasks - Listar todas
router.get('/', (req, res) => {
  res.json(tasks);
});

// POST /tasks - Criar nova
router.post('/', (req, res) => {
  const { title, description } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }
  
  const newTask = {
    id: nextId++,
    title,
    description: description || '',
    status: 'pendente',
    createdAt: new Date()
  };
  
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// ... (adicionar outras rotas conforme necessário)

module.exports = router;