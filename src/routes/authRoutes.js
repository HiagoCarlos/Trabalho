const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const upload = require('../config/multer');
router.get('/auth', (req, res) => {
  // Determina a aba ativa baseada na URL ou define 'login' como padrão
  const activeTab = req.query.tab === 'register' ? 'register' : 'login';
  
  res.render('auth/auth', {
    messages: req.flash(),
    formData: req.body || {},
    activeTab: activeTab // Passa a variável para o template
  });
});
// Rota unificada que renderiza o template com abas
router.get('/auth', (req, res) => {
  res.render('auth/auth', {
    messages: req.flash(),
    formData: req.body || {}
  });
});

// Rota POST para login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      req.flash('error', 'Email e senha são obrigatórios');
      return res.redirect('/auth#login');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    req.session.user = data.user;
    req.flash('success', 'Login realizado com sucesso!');
    res.redirect('/tasks');
    
  } catch (error) {
    req.flash('error', 'Credenciais inválidas');
    res.redirect('/auth#login');
  }
});

// Rota POST para registro
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    
    if (!email || !password) {
      req.flash('error', 'Email e senha são obrigatórios');
      return res.redirect('/auth#register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'As senhas não coincidem');
      return res.redirect('/auth#register');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth'
      }
    });

    if (error) throw error;

    req.flash(
      'success', 
      data.user?.identities?.length === 0 
        ? 'Confirme seu email para ativar a conta' 
        : 'Registro realizado com sucesso!'
    );
    res.redirect('/auth#login');
    
  } catch (error) {
    req.flash('error', error.message || 'Erro ao registrar');
    res.redirect('/auth#register');
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/auth');
});

module.exports = router;