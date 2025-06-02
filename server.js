// server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');

// Inicializa o Express app
const app = express();

// Middlewares de segurança devem vir primeiro
app.use(helmet()); // Ajuda a proteger contra várias vulnerabilidades web conhecidas
app.use(cookieParser()); // Analisa os cabeçalhos de Cookie e preenche req.cookies

// Verificação das variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const sessionSecret = process.env.SESSION_SECRET || 'ntem'; 
if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_KEY são obrigatórios no .env');
  process.exit(1); // Termina o processo se variáveis críticas não estiverem definidas
}

if (sessionSecret === 'ntem' && process.env.NODE_ENV === 'production') {
  console.warn('AVISO: SESSION_SECRET está usando um valor padrão inseguro em ambiente de produção. Configure uma chave secreta forte no seu arquivo .env!');
}

// Inicialização do cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações do Express
app.set('view engine', 'ejs'); // Define EJS como o motor de visualização
app.set('views', path.join(__dirname, 'src', 'views')); // Define o diretório para os arquivos de visualização

// Middlewares gerais
app.use(express.urlencoded({ extended: true })); // Analisa corpos de requisição urlencoded
app.use(express.json()); // Analisa corpos de requisição JSON
app.use(express.static(path.join(__dirname, 'src', 'public'))); // Serve arquivos estáticos

// Configuração da sessão
app.use(session({
  secret: sessionSecret,
  resave: false, // Não salva a sessão se não for modificada
  saveUninitialized: false, // Não cria sessão até algo ser armazenado
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Usa cookies seguros (HTTPS) em produção
    httpOnly: true, // Previne acesso ao cookie via JavaScript no lado do cliente
    sameSite: 'lax', // Mitiga CSRF. 'strict' pode ser usado se apropriado.
    maxAge: null // Cookie de sessão por padrão (expira quando o navegador fecha)
  }
}));

app.use(flash()); // Para mensagens flash (requer sessão)

// Proteção CSRF (deve vir após cookieParser e session)
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Middleware para disponibilizar o token CSRF e outras variáveis globais para as views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.currentYear = new Date().getFullYear();
  res.locals.session = req.session;
  res.locals.title = 'Task Manager'; // Título padrão
  res.locals.messages = {
    error: req.flash('error'),
    success: req.flash('success')
  };
  // Evite expor o cliente supabase inteiro para as views se não for necessário
  // res.locals.supabase = supabase;
  res.locals.currentUrl = req.originalUrl;
  next();
});

// Cabeçalhos de segurança adicionais (alguns podem ser cobertos pelo helmet, mas redundância não prejudica)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY'); // Previne clickjacking
  res.setHeader('X-XSS-Protection', '1; mode=block'); // Habilita filtro XSS em navegadores mais antigos (obsoleto, mas inofensivo)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); // Controla informações de referência
  // Considere adicionar um Content-Security-Policy (CSP) robusto aqui ou via helmet
  next();
});

// Importação de rotas
const authRoutes = require('./src/routes/authRoutes'); //
const taskRoutes = require('./src/routes/taskRoutes'); //
const userRoutes = require('./src/routes/userRoutes'); //

// Configuração das rotas
app.use('/', authRoutes); //
app.use('/tasks', taskRoutes); //
app.use('/users', userRoutes); //

// Rota raiz: redireciona para tarefas se logado, senão para autenticação
app.get('/', (req, res) => { //
  try {
    if (req.session.user) { //
      return res.redirect('/tasks'); //
    }
    res.redirect('/auth'); //
  } catch (error) {
    console.error('Erro na rota principal (/):', error); //
    // Idealmente, renderize uma página de erro amigável
    res.status(500).render('error', { //
      title: 'Erro Interno', //
      message: 'Ocorreu uma falha ao processar sua requisição.' //
    });
  }
});

// Rota de health check (útil para monitoramento)
app.get('/health', (req, res) => { //
  res.status(200).json({ status: 'OK', timestamp: new Date() }); //
});

// Rota 404 (Manipulador de página não encontrada - deve ser o último manipulador de rota)
app.use((req, res, next) => { //
  res.status(404).render('404', { //
    title: 'Página não encontrada' //
    // userPreferences: res.locals.userPreferences || { theme: 'light' } // Se suas views 404 usarem tema
  });
});

// Manipulador de erro global (500 - deve ter 4 argumentos: err, req, res, next)
app.use((err, req, res, next) => { //
  console.error("Erro não tratado:", err.stack); //
  res.status(err.status || 500).render('error', { //
    title: 'Erro no Servidor', //
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado no servidor.' //
    // userPreferences: res.locals.userPreferences || { theme: 'light' } // Se suas views de erro usarem tema
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { //
  console.log(`\nServidor rodando em http://localhost:${PORT}`); //
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});