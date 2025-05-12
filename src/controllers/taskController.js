const supabase = require('../config/supabaseClient');

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, dueDate, priority } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Título obrigatório' });
    }
    const userId = req.userId;

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        { title, description, status, due_date: dueDate, priority, user_id: userId }
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, sortBy } = req.query;

    let query = supabase.from('tasks').select('*').eq('user_id', userId);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (sortBy) {
      if (['status', 'priority', 'due_date'].includes(sortBy)) {
        query = query.order(sortBy, { ascending: true });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const userId = req.userId;
    const taskId = req.params.id;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const userId = req.userId;
    const taskId = req.params.id;
    const updates = req.body;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const userId = req.userId;
    const taskId = req.params.id;

    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json({ message: 'Tarefa removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
