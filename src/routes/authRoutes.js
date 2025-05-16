const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Registro de novo usuário
router.post('/signup', AuthController.signup);

// Login de usuário
router.post('/login', AuthController.login);

// Logout de usuário
router.post('/logout', AuthController.logout);

// Obter informações do usuário atual
router.get('/me', AuthController.getCurrentUser);


router.get('/login', (req, res) => res.render('auth/login'));
router.post('/login', AuthController.handleLogin);
router.get('/register', (req, res) => res.render('auth/register'));

module.exports = router;