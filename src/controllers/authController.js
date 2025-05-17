const User = require('../models/User');
const { supabase } = require('../config/supabaseClient');

class AuthController {
  // Registro de novo usuário
  static async signup(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const { data, error } = await User.create(email, password);
      
      if (error) {
        throw error;
      }

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        user: data.user
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Login de usuário
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const { data, error } = await User.login(email, password);
      
      if (error) {
        throw error;
      }

      res.status(200).json({
        message: 'Login realizado com sucesso',
        user: data.user,
        session: data.session
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  }

  // Logout de usuário
  static async logout(req, res) {
    try {
      const { error } = await User.logout();
      
      if (error) {
        throw error;
      }

      res.status(200).json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({ error: 'Erro ao fazer logout' });
    }
  }

  // Obter usuário atual
  static async getCurrentUser(req, res) {
    try {
      const { user, error } = await User.getCurrentUser();
      
      if (error) {
        throw error;
      }

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      res.status(500).json({ error: 'Erro ao obter informações do usuário' });
    }
  } static showLoginForm(req, res) {
  res.render('auth/login', {
    title: 'Login',
    messages: {
      error: req.flash('error'),
      success: req.flash('success'),
      messages: req.session.messages || {}
    }
  });
}

// Método para processar o login
static async handleLogin(req, res) {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      req.flash('error', 'Credenciais inválidas');
      return res.redirect('/login');
    }

    req.session.user = data.user;
    res.redirect('/tasks');
  } catch (error) {
    req.flash('error', 'Erro no servidor');
    res.redirect('/login');
  }
}
}


module.exports = AuthController;