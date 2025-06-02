require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');


const app = express();


app.use(helmet());
app.use(cookieParser()); 
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const sessionSecret = process.env.SESSION_SECRET || 'ntem'; 
if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_KEY são obrigatórios no .env');
  process.exit(1); 
}

if (sessionSecret === 'ntem' && process.env.NODE_ENV === 'production') {
  console.warn('AVISO: SESSION_SECRET está usando um valor padrão inseguro em ambiente de produção. Configure uma chave secreta forte no seu arquivo .env!');
}

const supabase = createClient(supabaseUrl, supabaseKey);


app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'src', 'views')); 


app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'src', 'public')));


app.use(session({
  secret: sessionSecret,
  resave: false, 
  saveUninitialized: false, 
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, 
    sameSite: 'lax', 
    maxAge: null 
  }
}));

app.use(flash());


const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);


app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.currentYear = new Date().getFullYear();
  res.locals.session = req.session;
  res.locals.title = 'Task Manager'; 
  res.locals.messages = {
    error: req.flash('error'),
    success: req.flash('success')
  };

  res.locals.currentUrl = req.originalUrl;
  next();
});


app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block'); 
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); 
 
  next();
});


const authRoutes = require('./src/routes/authRoutes'); 
const taskRoutes = require('./src/routes/taskRoutes'); 
const userRoutes = require('./src/routes/userRoutes'); 
app.use('/', authRoutes); 
app.use('/tasks', taskRoutes); 
app.use('/users', userRoutes); 

app.get('/', (req, res) => { 
  try {
    if (req.session.user) { 
      return res.redirect('/tasks'); 
    }
    res.redirect('/auth'); 
  } catch (error) {
    console.error('Erro na rota principal (/):', error); 
   
    res.status(500).render('error', { 
      title: 'Erro Interno', 
      message: 'Ocorreu uma falha ao processar sua requisição.' 
    });
  }
});

app.get('/health', (req, res) => { 
  res.status(200).json({ status: 'OK', timestamp: new Date() }); 
});


app.use((req, res, next) => { 
  res.status(404).render('404', { 
    title: 'Página não encontrada' 
   
  });
});

app.use((err, req, res, next) => { 
  console.error("Erro não tratado:", err.stack); 
  res.status(err.status || 500).render('error', { 
    title: 'Erro no Servidor', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado no servidor.' 
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { 
  console.log(`\nServidor rodando em http://localhost:${PORT}`); 
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});