// server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Rotas
app.get('/', (req, res) => {
  res.status(200).send('Bem-vindo ao Gerenciador de Tarefas!');
});

// Simulação de erro 404
app.use((req, res, next) => {
  res.status(404).json({ 
    status: 404, 
    error: 'Endpoint não encontrado' 
  });
});

// Manipulador de erro 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 500, 
    error: 'Erro interno no servidor' 
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});