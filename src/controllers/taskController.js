const supabase = require('../config/supabaseClient');

class TaskController {
  /**
   * Lista todas as tarefas do usuário (renderiza view EJS)
   */
  static async listTasks(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para acessar suas tarefas');
        return res.redirect('/login');
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', req.session.user.id)
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.render('tasks/dashboard', {
        title: 'Minhas Tarefas',
        tasks: tasks || [],
        currentUrl: req.originalUrl,
        messages: req.flash()
      });

    } catch (error) {
      console.error('Erro ao listar tarefas:', error);
      req.flash('error', 'Falha ao carregar tarefas');
      res.redirect('/');
    }
  }

  /**
   * Mostra formulário de criação de tarefa
   */
  static showCreateForm(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para criar tarefas');
        return res.redirect('/login');
      }

      res.render('tasks/create', {
        title: 'Nova Tarefa',
        task: {},
        currentUrl: req.originalUrl,
        formData: req.flash('formData')[0] || {}
      });

    } catch (error) {
      console.error('Erro ao exibir formulário:', error);
      req.flash('error', 'Erro ao carregar formulário');
      res.redirect('/tasks');
    }
  }

  /**
   * Cria nova tarefa (tratamento para formulário HTML)
   */
  static async createTask(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para criar tarefas');
        return res.redirect('/login');
      }

      const { title, description, due_date, status } = req.body;
      const user_id = req.session.user.id;

      // Validações
      if (!title || title.trim().length < 3) {
        req.flash('error', 'Título deve ter pelo menos 3 caracteres');
        req.flash('formData', req.body);
        return res.redirect('/tasks/create');
      }

      // Validar status
      const validStatuses = ['pending', 'completed'];
      if (status && !validStatuses.includes(status)) {
        req.flash('error', 'Status inválido');
        req.flash('formData', req.body);
        return res.redirect('/tasks/create');
      }

      // Validar e formatar data
      let formattedDueDate = null;
      if (due_date) {
        formattedDueDate = new Date(due_date);
        if (isNaN(formattedDueDate.getTime())) {
          req.flash('error', 'Data inválida');
          req.flash('formData', req.body);
          return res.redirect('/tasks/create');
        }
        formattedDueDate = formattedDueDate.toISOString();
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: title.trim(),
          description: description ? description.trim() : null,
          user_id,
          due_date: formattedDueDate,
          status: status || 'pending',
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      req.flash('success', 'Tarefa criada com sucesso!');
      res.redirect('/tasks');

    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      req.flash('error', 'Erro ao criar tarefa');
      req.flash('formData', req.body);
      res.redirect('/tasks/create');
    }
  }

  /**
   * Mostra formulário de edição de tarefa
   */
  static async showEditForm(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para editar tarefas');
        return res.redirect('/login');
      }

      const taskId = req.params.id;
      const user_id = req.session.user.id;

      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', user_id)
        .single();

      if (error || !task) {
        req.flash('error', 'Tarefa não encontrada');
        return res.redirect('/tasks');
      }

      res.render('tasks/edit', {
        title: 'Editar Tarefa',
        task,
        currentUrl: req.originalUrl
      });

    } catch (error) {
      console.error('Erro ao carregar edição:', error);
      req.flash('error', 'Erro ao carregar tarefa');
      res.redirect('/tasks');
    }
  }

  /**
   * Atualiza uma tarefa existente
   */
  static async updateTask(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Não autorizado' 
        });
      }

      const taskId = req.params.id;
      const user_id = req.session.user.id;
      const { title, description, due_date, status } = req.body;

      // Validações
      if (!title || title.trim().length < 3) {
        return res.status(400).json({ 
          success: false,
          error: 'Título deve ter pelo menos 3 caracteres' 
        });
      }

      // Validar status
      const validStatuses = ['pending', 'completed'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false,
          error: 'Status inválido. Use "pending" ou "completed"' 
        });
      }

      // Validar e formatar data
      let formattedDueDate = null;
      if (due_date) {
        formattedDueDate = new Date(due_date);
        if (isNaN(formattedDueDate.getTime())) {
          return res.status(400).json({ 
            success: false,
            error: 'Formato de data inválido' 
          });
        }
        formattedDueDate = formattedDueDate.toISOString();
      }

      // Verifica se a tarefa pertence ao usuário
      const { data: existingTask, error: findError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', taskId)
        .eq('user_id', user_id)
        .single();

      if (findError || !existingTask) {
        return res.status(404).json({ 
          success: false,
          error: 'Tarefa não encontrada' 
        });
      }

      const updates = {
        title: title.trim(),
        description: description ? description.trim() : null,
        due_date: formattedDueDate,
        status: status || 'pending',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select();

      if (error) throw error;

      req.flash('success', 'Tarefa atualizada com sucesso!');
      res.json({ 
        success: true,
        task: data[0],
        redirect: '/tasks' // Para redirecionamento via AJAX
      });

    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erro interno ao atualizar tarefa' 
      });
    }
  }

  /**
   * Remove uma tarefa
   */
  static async deleteTask(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Não autorizado' 
        });
      }

      const taskId = req.params.id;
      const user_id = req.session.user.id;

      // Verifica se a tarefa pertence ao usuário
      const { data: task, error: findError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', taskId)
        .eq('user_id', user_id)
        .single();

      if (findError || !task) {
        return res.status(404).json({ 
          success: false,
          error: 'Tarefa não encontrada' 
        });
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      req.flash('success', 'Tarefa removida com sucesso');
      res.json({ 
        success: true,
        redirect: '/tasks' // Para redirecionamento via AJAX
      });

    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erro interno ao excluir tarefa' 
      });
    }
  }

  /**
   * API para buscar tarefas (opcional)
   */
  static async getTasksAPI(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', req.session.user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      res.json({
        success: true,
        tasks: tasks || []
      });

    } catch (error) {
      console.error('Erro na API de tarefas:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erro ao buscar tarefas' 
      });
    }
  }
}

module.exports = TaskController;