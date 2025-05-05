// src/controllers/usuarioController.js
const supabase = require('../config/bd');

exports.listarUsuarios = async (req, res) => {
    res.send('🚀 Entrou na função listarUsuarios com sucesso!');
}
