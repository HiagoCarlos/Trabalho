require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const supabase = require('./src/config/supabaseClient');

// Configuração do Supabase (APENAS UMA VEZ)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_KEY são obrigatórios no .env');
  process.exit(1);
}


// Inicializa o Express
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  // Disponibiliza variáveis globais para todas as views
  res.locals.currentYear = new Date().getFullYear();
  res.locals.session = req.session;
  next();
});

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'ntem',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 dia
}));

// Middleware para injetar Supabase e sessão em todas as views
app.use((req, res, next) => {
  res.locals.supabase = supabase;
  res.locals.session = req.session;
  next();
});

// Rotas
const authRoutes = require(path.join(__dirname, 'src', 'routes', 'authRoutes'));
const taskRoutes = require(path.join(__dirname, 'src', 'routes', 'taskRoutes'));
app.use(express.static(path.join(__dirname, 'src', 'public')));


app.use('/', authRoutes);
app.use('/tasks', taskRoutes);

// Rota 404
// Rota 404 - Página não encontrada
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Página não encontrada',
    currentYear: new Date().getFullYear()
  });

  
});

// Middleware de erro 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Erro no servidor',
    message: 'Ocorreu um erro inesperado'
  });
});

// Depois de todas as rotas
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err.stack);
  res.status(500).render('error', {
    title: 'Erro no servidor',
    message: 'Ocorreu um erro inesperado'
  });
});

app.get('/', (req, res) => {
  try {
    res.redirect('/tasks'); // ou renderize sua view inicial
  } catch (error) {
    console.error('Erro na rota principal:', error);
    res.status(500).render('error', { 
      title: 'Erro', 
      message: 'Falha ao carregar a página inicial' 
    });
  }
});


// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});