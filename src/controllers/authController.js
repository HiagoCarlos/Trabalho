const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');


// Rota unificada de login/registro (GET)
router.get('/auth', (req, res) => {
  const activeTab = req.query.tab === 'register' ? 'register' : 'login';
  
  res.render('auth/auth', {
    title: 'Autenticação',
    messages: req.flash(),
    formData: req.session.formData || {},
    activeTab: activeTab
  });
});

// Rota de login (POST)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validação básica
    if (!email || !password) {
      req.flash('error', 'Email e senha são obrigatórios');
      return res.redirect('/auth#login');
    }

    // 1. Autenticação no Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    // 2. Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil do usuário não encontrado');
    }

    // 3. Armazenar dados na sessão
    req.session.user = {
      ...authData.user,
      profile: profile
    };

    // Limpar dados temporários
    delete req.session.formData;
    
    req.flash('success', 'Login realizado com sucesso!');
    return res.redirect('/tasks');

  } catch (error) {
    console.error('Erro no login:', error);
    
    // Armazenar dados do formulário para não perder o que o usuário digitou
    req.session.formData = req.body;
    req.flash('error', error.message || 'Credenciais inválidas');
    return res.redirect('/auth#login');
  }
});

// Rota de registro (POST)
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword, name } = req.body;
    
    // Validações
    if (!email || !password || !confirmPassword) {
      req.flash('error', 'Todos os campos são obrigatórios');
      return res.redirect('/auth#register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'As senhas não coincidem');
      return res.redirect('/auth#register');
    }

    if (password.length < 6) {
      req.flash('error', 'A senha deve ter pelo menos 6 caracteres');
      return res.redirect('/auth#register');
    }

    // 1. Registrar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
        },
        emailRedirectTo: `${process.env.BASE_URL || 'http://localhost:3000'}/auth`
      }
    });

    if (authError) throw authError;

    // 2. Criar perfil na tabela profiles
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          auth_id: authData.user.id,
          email: authData.user.email,
          name: name || '',
          created_at: new Date().toISOString()
        });

      if (profileError) throw profileError;
    }

    // Limpar dados temporários
    delete req.session.formData;

    // Mensagem diferente se for necessário confirmar email
    const successMessage = authData.user?.identities?.length === 0
      ? 'Confirme seu email para ativar a conta'
      : 'Registro realizado com sucesso! Faça login para continuar';

    req.flash('success', successMessage);
    return res.redirect('/auth#login');

  } catch (error) {
    console.error('Erro no registro:', error);
    
    // Armazenar dados do formulário
    req.session.formData = req.body;
    req.flash('error', error.message || 'Erro ao registrar usuário');
    return res.redirect('/auth#register');
  }
});

// Rota de logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir sessão:', err);
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    
    res.clearCookie('connect.sid');
    return res.redirect('/auth');
  });
});

// Rota para verificar usuário atual (API)
router.get('/current-user', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', req.session.user.id)
      .single();

    if (error || !profile) {
      throw new Error('Perfil não encontrado');
    }

    res.json({
      user: {
        ...req.session.user,
        profile: profile
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;