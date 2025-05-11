// src/controllers/taskController.js
const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      user: req.session.userId
    });
    await task.save();
    res.status(200).json({ status: 200, data: task });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const filter = { user: req.session.userId };
    if (req.query.status) filter.status = req.query.status;
    
    const tasks = await Task.find(filter);
    res.status(200).json({ status: 200, data: tasks });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
};

// Outros métodos: updateTask, deleteTask, etc.