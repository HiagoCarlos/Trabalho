require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const connectDB = require('./src/config/bd');
const taskRoutes = require('./src/routes/taskRoutes');
const authRoutes = require('./src/routes/authRoutes');
const { errorHandler } = require('./src/utils/errorHandler');

connectDB();

app.use(express.json());

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'index.html'));
});

// Serve listatarefas.html for /tasks route
app.get('/tasks', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'views', 'listatarefas.html'));
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;

