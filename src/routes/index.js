const express = require('express');
const router = express.Router();

router.use('/tasks', require('./taskRoutes'));
router.use('/auth', require('./authRoutes'));

module.exports = router;