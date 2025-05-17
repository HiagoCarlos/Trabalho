require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash');
const { createClient } = require('@supabase/supabase-js');

// Verificação das variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const sessionSecret = process.env.SESSION_SECRET || 'segredo-padrao';

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_KEY são obrigatórios no .env');
  process.exit(1);
}

// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações do Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 dia
}));
app.use(flash());

// Middleware para variáveis globais
app.use((req, res, next) => {
  res.locals = {
    currentYear: new Date().getFullYear(),
    session: req.session,
    title: 'Task Manager',
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    },
    supabase: supabase
  };
  next();
});

// Rotas
const authRoutes = require(path.join(__dirname, 'src', 'routes', 'authRoutes'));
const taskRoutes = require(path.join(__dirname, 'src', 'routes', 'taskRoutes'));

app.use('/', authRoutes);
app.use('/tasks', taskRoutes);

// Rota raiz (deve vir antes do 404 handler)
app.get('/', (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect('/tasks');
    }
    res.redirect('/login');
  } catch (error) {
    console.error('Erro na rota principal:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Falha ao processar a requisição'
    });
  }
});

// Rota 404 (deve ser a última rota)
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Página não encontrada'
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

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});