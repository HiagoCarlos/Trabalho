const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const supabase = require('../config/supabaseClient');

// Rotas de visualização (GET)
router.get('/login', (req, res) => {
  const messages = req.session.messages || {};
  req.session.messages = {};
  res.render('auth/login', { messages });
});

router.get('/register', (req, res) => {
  const messages = req.session.messages || {};
  req.session.messages = {};
  res.render('auth/register', { messages });
});

// Rotas de API (POST)
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    req.session.messages = { 
      success: 'Registro realizado! Verifique seu email.' 
    };
    res.redirect('/login');
    
  } catch (error) {
    req.session.messages = { 
      error: error.message || 'Erro no registro' 
    };
    res.redirect('/register');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    req.session.user = data.user;
    req.session.messages = { success: 'Login realizado com sucesso!' };
    res.redirect('/dashboard');
    
  } catch (error) {
    req.session.messages = { 
      error: 'Credenciais inválidas' 
    };
    res.redirect('/login');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  res.json(req.session.user);
})
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validação básica
    if (!email || !password) {
      req.flash('error', 'Email e senha são obrigatórios');
      return res.redirect('/register');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/login' // Página após confirmação
      }
    });

    if (error) {
      console.error('Erro no registro:', error);
      throw error;
    }

    // Mensagem diferente caso precise de confirmação de email
    const message = data.user?.identities?.length === 0
      ? 'Confirme seu email para ativar a conta'
      : 'Registro realizado com sucesso!';

    req.flash('success', message);
    res.redirect('/login');
    
  } catch (error) {
    console.error('Erro no registro:', error);
    req.flash('error', error.message || 'Erro ao registrar');
    res.redirect('/register');
  }
});

module.exports = router;