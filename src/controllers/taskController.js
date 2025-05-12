const Task = require('../models/Task');

const validateTaskInput = (data, isUpdate = false) => {
  const errors = {};
  if (!isUpdate) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      errors.title = 'Title is required and must be a non-empty string';
    }
  } else {
    if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim() === '')) {
      errors.title = 'Title must be a non-empty string if provided';
    }
  }
  if (data.status && !['pendente', 'concluída'].includes(data.status)) {
    errors.status = 'Status must be either "pendente" or "concluída"';
  }
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

exports.createTask = async (req, res) => {
  try {
    const { errors, isValid } = validateTaskInput(req.body);
    if (!isValid) {
      return res.status(400).json({ errors });
    }
    const task = new Task({
      ...req.body,
      user: req.userId
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { errors, isValid } = validateTaskInput(req.body, true);
    if (!isValid) {
      return res.status(400).json({ errors });
    }
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const filter = { user: req.userId };
    if (req.query.status) {
      if (!['pendente', 'concluída'].includes(req.query.status)) {
        return res.status(400).json({ error: 'Invalid status filter' });
      }
      filter.status = req.query.status;
    }
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
