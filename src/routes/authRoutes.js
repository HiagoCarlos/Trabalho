const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: true });

router.get('/auth', csrfProtection, authController.pageLogin);
router.get('/current-user', authController.getCurrentUser);
router.post('/login', csrfProtection, authController.login);
router.post('/register', csrfProtection, authController.register);
router.post('/logout', authController.logout);
router.post('/save-preferences', authController.savePreferences);

module.exports = router;