const supabase = require('../config/supabaseClient');

async function authenticate(req, res, next) {

  if (req.session.user) {
    req.user = req.session.user;
    return next();
  }

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

  if (req.accepts('html')) {
    req.flash('error', 'Faça login para continuar.');
    return res.redirect('/auth');
  }
  return res.status(401).json({ error: 'Token de acesso não fornecido ou inválido' });
}

async function loadPreferences(req, res, next) {
  let preferences = {
    theme: 'light', 
    language: 'pt-BR' 
  };

  try {
    if (req.cookies.userPreferences) {
      const parsedPrefs = JSON.parse(req.cookies.userPreferences);
      preferences.theme = parsedPrefs.theme || preferences.theme;
      preferences.language = parsedPrefs.language || preferences.language;
    } else if (req.session.user && req.session.user.id) {
     
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('theme_preference, language')
        .eq('auth_id', req.session.user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil para preferências:', profileError.message);
  
      } else if (profile) {
        preferences.theme = profile.theme_preference || preferences.theme;
        preferences.language = profile.language || preferences.language;
        
      
        res.cookie('userPreferences', JSON.stringify(preferences), {
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000,
          sameSite: 'lax',
          path: '/'
        });
      }
    }
  } catch (error) {

    console.error('Erro ao carregar/processar preferências do usuário:', error.message);
  }

  req.userPreferences = preferences;
  res.locals.userPreferences = preferences; 
  
  
  next();
}

module.exports = {
  authenticate,
  loadPreferences
};