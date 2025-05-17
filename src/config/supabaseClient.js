const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Teste de conexão
supabase.auth.getSession()
  .then(({ data }) => {
    console.log('Conexão com Supabase estabelecida com sucesso!');
  })
  .catch(err => {
    console.error('Erro na conexão com Supabase:', err.message);
  });

module.exports = supabase;