// src/controllers/taskController.js
const Task = require('../models/Task');

exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(task);
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tarefa removida com sucesso' });
  } catch (error) {
    next(error);
  }
};

// Já existente
exports.createTask = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    
    const task = new Task({
      title,
      description,
      user: req.user.id
    });
    
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};