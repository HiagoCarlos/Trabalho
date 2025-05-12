const supabase = require('../config/supabaseClient');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (req.accepts('html')) {
        return res.redirect('/login');
      }
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.api.getUser(token);

    if (error || !user) {
      if (req.accepts('html')) {
        return res.redirect('/login');
      }
      return res.status(401).json({ error: 'Autenticação falhou' });
    }

    req.userId = user.id;
    next();
  } catch (err) {
    if (req.accepts('html')) {
      return res.redirect('/login');
    }
    res.status(401).json({ error: 'Autenticação falhou' });
  }
};
