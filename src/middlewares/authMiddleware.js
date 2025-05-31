const { supabase } = require('../config/supabaseClient');

async function authenticate(req, res, next) {
  // Verifica se há sessão ativa primeiro
  if (req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Caso não tenha sessão, verifica o token (de headers, query ou cookie)
  const token = req.headers.authorization?.split(' ')[1] || 
                req.query.token || 
                req.cookies.authToken;
  
  if (!token) {
    if (req.accepts('html')) {
      // Se for requisição web, redireciona para login
      req.flash('error', 'Faça login para continuar');
      return res.redirect('/auth');
    }
    return res.status(401).json({ error: 'Token de acesso não fornecido' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) throw error;
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil do usuário não encontrado');
    }

    // Armazena usuário na sessão para requisições web
    if (req.accepts('html')) {
      req.session.user = {
        ...user,
        profile: profile
      };
      await req.session.save();
    }

    req.user = {
      ...user,
      profile: profile
    };
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    // Limpar cookies inválidos
    res.clearCookie('authToken');
    
    if (req.accepts('html')) {
      req.flash('error', 'Sessão expirada. Faça login novamente.');
      return res.redirect('/auth');
    }
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// Middleware para carregar preferências do usuário
async function loadPreferences(req, res, next) {
  try {
    // Verificar cookie de preferências
    if (req.cookies.userPreferences) {
      req.userPreferences = JSON.parse(req.cookies.userPreferences);
    } else if (req.session.user) {
      // Se não houver cookie, carregar do banco de dados
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('theme_preference, language')
        .eq('auth_id', req.session.user.id)
        .single();

      if (!error && profile) {
        req.userPreferences = {
          theme: profile.theme_preference || 'light',
          language: profile.language || 'pt-BR'
        };
        // Atualizar cookie
        res.cookie('userPreferences', JSON.stringify(req.userPreferences), {
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
          sameSite: 'lax',
          path: '/'
        });
      }
    }

    // Valores padrão se não encontrar preferências
    req.userPreferences = req.userPreferences || {
      theme: 'light',
      language: 'pt-BR'
    };

    // Disponibilizar para as views
    res.locals.userPreferences = req.userPreferences;
    next();
  } catch (error) {
    console.error('Erro ao carregar preferências:', error);
    next();
  }
}

module.exports = {
  authenticate,
  loadPreferences
};