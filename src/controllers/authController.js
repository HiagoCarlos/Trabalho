const supabase = require('../config/supabaseClient');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const { user, error } = await supabase.auth.api.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { session, error } = await supabase.auth.api.signInWithEmail(email, password);

    if (error || !session) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    res.json({ token: session.access_token, userId: session.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
