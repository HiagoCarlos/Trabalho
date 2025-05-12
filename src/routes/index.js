const express = require('express');
const router = express.Router();

// Importação de todas as rotas
const taskRoutes = require('./taskRoutes');
const authRoutes = require('./authRoutes');
const usuarioRoutes = require('./usuarioRoutes');

// Prefixos das rotas
router.use('/tasks', taskRoutes);
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);

module.exports = router;