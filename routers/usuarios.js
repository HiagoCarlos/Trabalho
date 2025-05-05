const express = require('express');
const router = express.Router();
const db = require('../config/bd');

// Listar usuários
router.get('/', async (req, res) => {
    try {
        const resultado = await db.query('SELECT * FROM usuarios'); // Troque 'usuarios' pela sua tabela real
        res.json(resultado.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao buscar usuários');
    }
});

module.exports = router;
