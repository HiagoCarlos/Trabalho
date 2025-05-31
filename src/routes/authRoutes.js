const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, loadPreferences } = require('../middlewares/authMiddleware');
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: true });

router.get('/auth', csrfProtection, loadPreferences, authController.pageLogin);
router.post('/login', csrfProtection, authController.login);
router.post('/register', csrfProtection, authController.register);
router.post('/logout', authenticate, authController.logout);
router.get('/current-user', authenticate, authController.getCurrentUser);
router.post('/save-preferences', authenticate, authController.savePreferences);

// Rota para verificar autenticação via cookie
router.get('/check-auth', (req, res) => {
  if (req.cookies.authToken) {
    return res.json({ authenticated: true });
  }
  res.json({ authenticated: false });
});

module.exports = router;