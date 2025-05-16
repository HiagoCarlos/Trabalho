const express = require('express');
const router = express.Router();

// Importar todas as rotas
const authRoutes = require('./authRoutes');
const taskRoutes = require('./taskRoutes');
const userRoutes = require('./userRoutes');

// Rota de saúde da API
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'API funcionando' });
});

// Configurar prefixos para as rotas
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);

// Rota para 404 - Não encontrado
router.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

module.exports = router;