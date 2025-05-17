const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient'); // sem as chaves

// =============================================
//  ROTA: Página de Login/Registro (GET)
// =============================================
router.get('/auth', (req, res) => {
  const activeTab = req.query.tab === 'register' ? 'register' : 'login';
  
  res.render('auth/auth', {
    title: 'Autenticação',
    messages: {
      error: req.flash('error'),
      success: req.flash('success')
    },
    formData: req.session.formData || {}, // Mantém dados do form em caso de erro
    activeTab: activeTab
  });
});

// =============================================
//  ROTA: Login (POST)
// =============================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Validação básica
  if (!email || !password) {
    req.flash('error', 'Email e senha são obrigatórios');
    return res.redirect('/auth#login');
  }

  try {
    // 1. Autenticar no Supabase Auth
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

    // 3. Salvar dados na sessão
    req.session.user = {
      ...authData.user,
      profile: profile
    };

    // 4. Limpar dados temporários e redirecionar
    delete req.session.formData;
    req.flash('success', 'Login realizado com sucesso!');
    return res.redirect('/tasks');

  } catch (error) {
    console.error('Erro no login:', error.message);
    
    // Guarda os dados digitados para não perder
    req.session.formData = req.body;
    req.flash('error', error.message || 'Credenciais inválidas');
    return res.redirect('/auth#login');
  }
});

// =============================================
//  ROTA: Registro (POST)
// =============================================
router.post('/register', async (req, res) => {
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

  try {
    // 1. Registrar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || '' }, // Dados extras no JWT
        emailRedirectTo: `${process.env.BASE_URL || 'http://localhost:3000'}/auth` // URL pós-confirmação
      }
    });

    if (authError) throw authError;

    // 2. Criar perfil na tabela 'profiles'
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

    // 3. Feedback e redirecionamento
    delete req.session.formData;
    const successMessage = authData.user?.identities?.length === 0
      ? 'Confirme seu email para ativar a conta'
      : 'Registro realizado com sucesso! Faça login para continuar';

    req.flash('success', successMessage);
    return res.redirect('/auth#login');

  } catch (error) {
    console.error('Erro no registro:', error.message);
    
    req.session.formData = req.body;
    req.flash('error', error.message || 'Erro ao registrar usuário');
    return res.redirect('/auth#register');
  }
});

// =============================================
//  ROTA: Logout (POST)
// =============================================
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
      return res.status(500).json({ error: 'Erro ao encerrar sessão' });
    }

    res.clearCookie('connect.sid'); // Remove o cookie de sessão
    return res.redirect('/auth');
  });
});

// =============================================
//  ROTA: Verificar Usuário Atual (API - GET)
// =============================================
router.get('/current-user', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
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
    console.error('Erro ao buscar usuário:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;