// src/middlewares/authMiddleware.js
const supabase = require('../config/supabaseClient'); // CORREÇÃO CRÍTICA AQUI

async function authenticate(req, res, next) {
  // 1. Check for active session first
  if (req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // 2. If no session, try to use authToken from cookie
  const token = req.cookies.authToken;

  if (token) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError) {
        console.warn('Falha na validação do authToken (Supabase):', userError.message);
        res.clearCookie('authToken', { path: '/' });
      } else if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        if (profileError || !profile) {
          console.warn('Perfil não encontrado para usuário validado por authToken:', profileError?.message);
          res.clearCookie('authToken', { path: '/' });
        } else {
          req.session.user = {
            ...user,
            profile: profile
          };
          req.user = req.session.user;

          return req.session.save(err => {
            if (err) {
              console.error("Erro ao salvar sessão após reautenticação por token:", err);
              return next(err);
            }
            return next();
          });
        }
      }
    } catch (error) {
      console.error('Erro inesperado durante a autenticação por token:', error);
      res.clearCookie('authToken', { path: '/' });
    }
  }

  // 3. If no session and no valid authToken
  if (req.accepts('html')) {
    req.flash('error', 'Faça login para continuar.');
    return res.redirect('/auth');
  }
  return res.status(401).json({ error: 'Token de acesso não fornecido ou inválido' });
}

async function loadPreferences(req, res, next) {
  let preferences = {
    theme: 'light', // Default theme
    language: 'pt-BR' // Default language
  };

  try {
    if (req.cookies.userPreferences) {
      const parsedPrefs = JSON.parse(req.cookies.userPreferences);
      preferences.theme = parsedPrefs.theme || preferences.theme;
      preferences.language = parsedPrefs.language || preferences.language;
    } else if (req.session.user && req.session.user.id) {
      // Se não houver cookie, mas houver sessão, carregar do banco de dados
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('theme_preference, language')
        .eq('auth_id', req.session.user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil para preferências:', profileError.message);
        // Mantém os defaults se houver erro no DB
      } else if (profile) {
        preferences.theme = profile.theme_preference || preferences.theme;
        preferences.language = profile.language || preferences.language;
        
        // Atualizar/criar cookie com as preferências do DB
        res.cookie('userPreferences', JSON.stringify(preferences), {
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
          sameSite: 'lax',
          path: '/'
        });
      }
    }
  } catch (error) {
    // Erro ao parsear cookie JSON ou outro erro inesperado
    console.error('Erro ao carregar/processar preferências do usuário:', error.message);
    // preferences já contém os defaults
  }

  req.userPreferences = preferences;
  res.locals.userPreferences = preferences; // Garante que sempre seja definido
  
  // Log para depuração
  // console.log('loadPreferences: Definindo res.locals.userPreferences para:', res.locals.userPreferences);
  
  next();
}

module.exports = {
  authenticate,
  loadPreferences
};