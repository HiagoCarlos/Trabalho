// src/controllers/authController.js
const express = require('express');
const supabase = require('../config/supabaseClient');

const REMEMBER_ME_COOKIE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 dias
const PREFERENCES_COOKIE_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 dias

exports.pageLogin = async (req, res) => {
  const activeTab = req.query.tab === 'register' ? 'register' : 'login';

  const userPreferences = res.locals.userPreferences || {
    theme: req.cookies.themePreference || 'light',
    language: 'pt-BR'
  };

  // Verifica se há um usuário na sessão para passar um status de login para o template
  const isUserLoggedIn = !!(req.session && req.session.user);

  res.render('auth/auth', {
    title: 'Autenticação',
    messages: req.flash(),
    formData: req.session.formData || {},
    activeTab: activeTab,
    userPreferences: userPreferences,
    csrfToken: req.csrfToken(),
    isUserLoggedIn: isUserLoggedIn // Nova variável para o EJS
  });
};

exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    req.flash('error', 'Email e senha são obrigatórios');
    req.session.formData = req.body;
    return res.redirect('/auth?tab=login#login');
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil do usuário não encontrado');
    }

    req.session.user = {
      ...authData.user,
      profile: profile
    };

    if (rememberMe) {
      req.session.cookie.maxAge = REMEMBER_ME_COOKIE_EXPIRATION;
    } else {
      req.session.cookie.expires = false;
    }

    res.cookie('authToken', authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: rememberMe ? REMEMBER_ME_COOKIE_EXPIRATION : null,
      sameSite: 'strict',
      path: '/'
    });

    res.cookie('userPreferences', JSON.stringify({
      theme: profile.theme_preference || 'light',
      language: profile.language || 'pt-BR'
    }), {
      secure: process.env.NODE_ENV === 'production',
      maxAge: PREFERENCES_COOKIE_EXPIRATION,
      sameSite: 'lax',
      path: '/'
    });

    delete req.session.formData;
    req.flash('success', 'Login realizado com sucesso!');
    return res.redirect('/tasks');

  } catch (error) {
    console.error('Erro no login:', error.message);
    req.session.formData = req.body;
    req.flash('error', error.message || 'Credenciais inválidas');
    return res.redirect('/auth?tab=login#login');
  }
};

exports.register = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    req.flash('error', 'Todos os campos são obrigatórios para o registro.');
    req.session.formData = req.body;
    return res.redirect('/auth?tab=register#register');
  }

  if (password.length < 6) {
    req.flash('error', 'A senha deve ter pelo menos 6 caracteres.');
    req.session.formData = req.body;
    return res.redirect('/auth?tab=register#register');
  }

  if (password !== confirmPassword) {
    req.flash('error', 'As senhas não coincidem.');
    req.session.formData = req.body;
    return res.redirect('/auth?tab=register#register');
  }

  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        req.flash('error', 'Este email já está cadastrado. Tente fazer login.');
        req.session.formData = req.body;
        return res.redirect('/auth?tab=login#login');
      }
      throw signUpError;
    }

    if (!authData.user && !signUpError) {
        req.flash('success', 'Registro quase completo! Verifique seu email para confirmar a conta.');
        return res.redirect('/auth?tab=login#login');
    }
    
    // Se você não tem uma trigger no Supabase para criar perfis automaticamente,
    // você precisaria inserir o perfil manualmente aqui.
    // Exemplo:
    /*
    if (authData.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ auth_id: authData.user.id, email: authData.user.email }]); // Adapte os campos
        if (profileError) {
            console.error('Erro ao criar perfil para novo usuário:', profileError);
            // Considere deletar o usuário do Supabase Auth se a criação do perfil falhar
            // await supabase.auth.admin.deleteUser(authData.user.id); // Requer privilégios de admin
            req.flash('error', 'Erro ao finalizar o registro. Tente novamente.');
            return res.redirect('/auth?tab=register#register');
        }
    }
    */

    req.flash('success', 'Usuário registrado com sucesso! Faça login para continuar.');
    delete req.session.formData;
    return res.redirect('/auth?tab=login#login');

  } catch (error) {
    console.error('Erro no registro:', error.message);
    req.session.formData = req.body;
    req.flash('error', error.message || 'Falha ao registrar. Tente novamente.');
    return res.redirect('/auth?tab=register#register');
  }
};


exports.logout = (req, res) => {
  res.clearCookie('authToken', { path: '/' });
  res.clearCookie('userPreferences', { path: '/' });

  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
      req.flash('error', 'Erro ao encerrar sessão. Tente novamente.');
      return res.redirect('/'); // Ou para uma página de erro específica
    }
    res.redirect('/auth');
  });
};

exports.savePreferences = async (req, res) => {
  try {
    const { theme, language } = req.body; // Supondo que 'language' também pode ser salvo

    if (!req.session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const updates = {};
    if (theme) updates.theme_preference = theme;
    if (language) updates.language = language;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Nenhuma preferência fornecida para salvar.' });
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('auth_id', req.session.user.id);

    if (error) throw error;

    // Atualiza a sessão
    if (req.session.user && req.session.user.profile) {
        if (theme) req.session.user.profile.theme_preference = theme;
        if (language) req.session.user.profile.language = language;
    }

    // Atualiza o cookie de preferências
    const currentPreferences = JSON.parse(req.cookies.userPreferences || '{}');
    const newPreferences = {
        theme: theme || currentPreferences.theme || 'light',
        language: language || currentPreferences.language || 'pt-BR'
    };

    res.cookie('userPreferences', JSON.stringify(newPreferences), {
      secure: process.env.NODE_ENV === 'production',
      maxAge: PREFERENCES_COOKIE_EXPIRATION,
      sameSite: 'lax',
      path: '/'
    });

    res.json({ success: true, preferences: newPreferences });

  } catch (error) {
    console.error('Erro ao salvar preferências:', error);
    res.status(500).json({ error: 'Erro ao salvar preferências' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    if (req.session.user) {
      return res.json({ user: req.session.user });
    }

    const token = req.cookies.authToken;
    if (!token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.clearCookie('authToken', { path: '/' });
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      res.clearCookie('authToken', { path: '/' });
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    req.session.user = {
      ...user,
      profile: profile
    };

    req.session.save(err => {
        if (err) {
            console.error('Erro ao salvar sessão em getCurrentUser:', err);
            return res.status(500).json({ error: 'Falha ao processar sessão' });
        }
        res.json({ user: req.session.user });
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error.message);
    res.status(500).json({ error: error.message });
  }
};