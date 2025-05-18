const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')

router.get('/auth', authController.pageLogin)
router.post('/login', authController.login)
router.post('/register', authController.register)
router.post('/logout', authController.logout)
router.get('/current-user', authController.getCurrentUser)

module.exports = router;