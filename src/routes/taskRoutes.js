const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');


router.get('/', TaskController.listTasks);
router.get('/create', TaskController.showCreateForm);
router.get('/edit/:id', TaskController.showEditForm);
router.post('/', TaskController.createTask);
router.post('/:id/update', TaskController.updateTask); 
router.post('/:id/delete', TaskController.deleteTaskForm);

module.exports = router;