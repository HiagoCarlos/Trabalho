const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authenticate = require('../middlewares/authMiddleware');
const upload = require('../config/multer'); // Configuração do upload de arquivos

// Todas as rotas de usuário exigem autenticação
router.use(authenticate);

// Obter perfil do usuário
router.get('/profile', UserController.getProfile);

// Atualizar perfil do usuário
router.put('/profile', UserController.updateProfile);
router.patch('/profile', UserController.updateProfile);

// Upload de avatar
router.post('/avatar', upload.single('avatar'), UserController.uploadAvatar);

// Rotas adicionais para gestão de conta
router.delete('/account', UserController.deleteAccount);

module.exports = router;