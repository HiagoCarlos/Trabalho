const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../config/multer');
const supabase = require('../config/supabaseClient'); 

router.use(authenticate);
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.patch('/profile', UserController.updateProfile);
router.post('/avatar', upload.single('avatar'), UserController.uploadAvatar);
router.delete('/account', UserController.deleteAccount);

module.exports = router;