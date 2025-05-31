const express = require('express');
const supabase = require('../config/supabaseClient');

// Tempo de expiração dos cookies (em milissegundos)
const COOKIE_EXPIRATION = 24 * 60 * 60 * 1000; // 1 dia
const PREFERENCES_COOKIE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 dias

exports.pageLogin = async (req, res) => {
  const activeTab = req.query.tab === 'register' ? 'register' : 'login';
  
  // Verifica cookie de preferência de tema
  const theme = req.cookies.themePreference || 'light';
  
  res.render('auth/auth', {
    title: 'Autenticação',
    messages: req.flash(),
    formData: req.session.formData || {},
    activeTab: activeTab,
    theme: theme,
    csrfToken: req.csrfToken()
  });
};

exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  // Validação básica
  if (!email || !password) {
    req.flash('error', 'Email e senha são obrigatórios');
    return res.redirect('/auth#login');
  }

  try {
    // Autenticar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil do usuário não encontrado');
    }

    // Salvar dados na sessão
    req.session.user = {
      ...authData.user,
      profile: profile
    };

    // Configurar cookies
    // Cookie de autenticação (HTTP Only para segurança)
    res.cookie('authToken', authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: rememberMe ? COOKIE_EXPIRATION : null, // Persistente se "Lembrar de mim" estiver marcado
      sameSite: 'strict',
      path: '/'
    });

    // Cookie de preferências (não HTTP Only para acesso via JS)
    res.cookie('userPreferences', JSON.stringify({
      theme: profile.theme_preference || 'light',
      language: profile.language || 'pt-BR'
    }), {
      secure: process.env.NODE_ENV === 'production',
      maxAge: PREFERENCES_COOKIE_EXPIRATION,
      sameSite: 'lax',
      path: '/'
    });

    // Limpar dados temporários e redirecionar
    delete req.session.formData;
    req.flash('success', 'Login realizado com sucesso!');
    return res.redirect('/tasks');

  } catch (error) {
    console.error('Erro no login:', error.message);
    
    req.session.formData = req.body;
    req.flash('error', error.message || 'Credenciais inválidas');
    return res.redirect('/auth#login');
  }
};

exports.logout = (req, res) => {
  // Limpar todos os cookies relacionados à autenticação
  res.clearCookie('authToken');
  res.clearCookie('userPreferences');
  res.clearCookie('connect.sid'); // Cookie de sessão

  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
      return res.status(500).json({ error: 'Erro ao encerrar sessão' });
    }
    return res.redirect('/auth');
  });
};

exports.savePreferences = async (req, res) => {
  try {
    const { theme, language } = req.body;
    
    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Atualizar no banco de dados
    const { error } = await supabase
      .from('profiles')
      .update({
        theme_preference: theme,
        language: language
      })
      .eq('auth_id', req.session.user.id);

    if (error) throw error;

    // Atualizar cookie de preferências
    res.cookie('userPreferences', JSON.stringify({
      theme: theme,
      language: language
    }), {
      secure: process.env.NODE_ENV === 'production',
      maxAge: PREFERENCES_COOKIE_EXPIRATION,
      sameSite: 'lax',
      path: '/'
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Erro ao salvar preferências:', error);
    res.status(500).json({ error: 'Erro ao salvar preferências' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    // Tentar obter usuário da sessão primeiro
    if (req.session.user) {
      return res.json({ user: req.session.user });
    }

    // Se não houver sessão, verificar token do cookie
    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Criar sessão para o usuário
    req.session.user = {
      ...user,
      profile: profile
    };

    res.json({ user: req.session.user });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error.message);
    res.status(500).json({ error: error.message });
  }
};