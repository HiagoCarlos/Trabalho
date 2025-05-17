const { supabase } = require('../config/supabaseClient');

async function authenticate(req, res, next) {
  // Verifica se há sessão ativa primeiro
  if (req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Caso não tenha sessão, verifica o token (para APIs)
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  
  if (!token) {
    if (req.accepts('html')) {
      // Se for requisição web, redireciona para login
      req.session.messages = { error: 'Faça login para continuar' };
      return res.redirect('/login');
    }
    return res.status(401).json({ error: 'Token de acesso não fornecido' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) throw error;
    if (!user) throw new Error('Usuário não autenticado');

    // Armazena usuário na sessão para requisições web
    if (req.accepts('html')) {
      req.session.user = user;
      req.session.save();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    if (req.accepts('html')) {
      req.session.messages = { error: 'Token inválido ou expirado' };
      return res.redirect('/login');
    }
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = authenticate;