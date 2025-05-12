// src/routes/authRoutes.js (versão Supabase)
const express = require('express');
const router = express.Router();
const supabase = require('../config/bd');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  // Comparação de senha (você precisaria armazenar senhas hasheadas)
  if (password !== data.password) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET);
  res.json({ token });
});

module.exports = router;