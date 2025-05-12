require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com o banco de dados
require('./src/config/bd');

// Rotas
const routes = require('./src/routes');
app.use('/api', routes);

// Rota para o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
const { errorHandler } = require('./src/utils/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});