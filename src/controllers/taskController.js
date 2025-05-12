const Task = require('../models/Task');
const db = require('../../config/bd'); 

// Criar tarefa
exports.createTask = async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      user: req.session.userId
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Listar tarefas
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.session.userId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Atualizar tarefa
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deletar tarefa
exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tarefa deletada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};