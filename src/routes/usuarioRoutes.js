const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

router.get('/', usuarioController.listarUsuarios);
router.get('/teste', (req, res) => res.render('usuario/index'));
router.get('/tarefas', usuarioController.listarTarefas);

module.exports = router;