const express = require('express');
const router = express.Router();
const db = require('../config/bd');
const path = require('path');
const user = require('../controllers/usuarios');

router.get('/', async (req, res) => {
    res.render('usuario/index');
});


router.get('/teste', async (req, res) => {
    res.render('usuario/index');
});

router.get('/tarefas', async (req, res) => {
    res.render('usuario/listatarefas');
    user.listarUsuarios
});

module.exports = router;

