require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const connectDB = require('./src/config/bd');
const taskRoutes = require('./src/routes/taskRoutes');
const authRoutes = require('./src/routes/authRoutes');
const { errorHandler } = require('./src/utils/errorHandler');
const { authenticate } = require('./src/middlewares/auth'); // Importe o middleware

connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/tasks', authenticate, taskRoutes); // Protege rotas de tarefas
app.use('/api/auth', authRoutes);

// Rotas do Frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'register.html'));
});

// Rotas protegidas (servem o HTML inicial)
app.get(['/dashboard', '/tasks'], (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'dashboard.html'));
});

// Adicione esta rota para o SPA (importante!)
// Todas outras rotas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'login.html'));
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

module.exports = app;