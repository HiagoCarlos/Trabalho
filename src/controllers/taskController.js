const Task = require('../models/Task');
const { supabase } = require('../config/supabaseClient');

class TaskController {
  /**
   * Lista todas as tarefas (para renderização EJS)
   */
  static async listTasks(req, res) {
    try {
      // Verifica se o usuário está logado
      if (!req.session.user) {
        return res.redirect('/login');
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', req.session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.render('tasks/dashboard', {
        title: 'Minhas Tarefas',
        tasks,
        currentUrl: req.originalUrl
      });
    } catch (error) {
      console.error('Erro ao listar tarefas:', error);
      res.render('error', {
        title: 'Erro',
        message: 'Falha ao carregar tarefas'
      });
    }
  }

  /**
   * Cria uma nova tarefa (API JSON)
   */
  static async createTask(req, res) {
    try {
      const { title, description, due_date, status } = req.body;
      const user_id = req.session.user.id;

      if (!title) {
        return res.status(400).json({ error: 'Título é obrigatório' });
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title,
            description,
            user_id,
            due_date,
            status: status || 'pending',
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      res.status(201).json({
        success: true,
        task: data[0]
      });
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Mostra formulário de edição (EJS)
   */
  static async showEditForm(req, res) {
    try {
      const taskId = req.params.id;
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !task) {
        throw new Error('Tarefa não encontrada');
      }

      res.render('tasks/edit', {
        title: 'Editar Tarefa',
        task
      });
    } catch (error) {
      console.error('Erro ao carregar edição:', error);
      res.render('error', {
        title: 'Erro',
        message: 'Não foi possível carregar a tarefa'
      });
    }
  }

  /**
   * Atualiza uma tarefa existente (API JSON)
   */
  static async updateTask(req, res) {
    try {
      const taskId = req.params.id;
      const updates = req.body;

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select();

      if (error) throw error;

      res.json({
        success: true,
        task: data[0]
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Exclui uma tarefa (API JSON)
   */
  static async deleteTask(req, res) {
    try {
      const taskId = req.params.id;

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = TaskController;