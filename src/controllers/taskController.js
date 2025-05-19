const supabase = require('../config/supabaseClient');
const { format } = require('date-fns');

class TaskController {
  // =============================================
  //  MÉTODOS DE VISUALIZAÇÃO (EJS)
  // =============================================

  /**
   * Lista todas as tarefas do usuário
   */
  static async listTasks(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para acessar suas tarefas');
        return res.redirect('/auth');
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', req.session.user.id)
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Formata as datas para exibição
      const formattedTasks = tasks.map(task => ({
        ...task,
        due_date: task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : null,
        created_at: format(new Date(task.created_at), 'dd/MM/yyyy HH:mm')
      }));

      res.render('tasks/dashboard', {
        title: 'Minhas Tarefas',
        tasks: formattedTasks,
        messages: req.flash(),
        currentUrl: req.originalUrl
      });

    } catch (error) {
      console.error('Erro ao listar tarefas:', error);
      req.flash('error', 'Falha ao carregar tarefas');
      res.redirect('/');
    }
  }

  /**
   * Exibe formulário de criação de tarefa
   */
  static showCreateForm(req, res) {
    if (!req.session.user) {
      req.flash('error', 'Faça login para criar tarefas');
      return res.redirect('/auth');
    }

    res.render('tasks/create', {
      title: 'Nova Tarefa',
      task: {},
      messages: req.flash(),
      formData: req.flash('formData')[0] || {},
      currentUrl: req.originalUrl
    });
  }

  /**
   * Exibe formulário de edição de tarefa
   */
  static async showEditForm(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para editar tarefas');
        return res.redirect('/auth');
      }

      const { id } = req.params;
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .eq('user_id', req.session.user.id)
        .single();

      if (error || !task) {
        req.flash('error', 'Tarefa não encontrada');
        return res.redirect('/tasks');
      }

      // Formata a data para o input type="date"
      const formattedDueDate = task.due_date 
        ? new Date(task.due_date).toISOString().split('T')[0]
        : '';

      res.render('tasks/edit', {
        title: 'Editar Tarefa',
        task: {
          ...task,
          due_date: formattedDueDate
        },
        messages: req.flash(),
        formData: req.flash('formData')[0] || {},
        currentUrl: req.originalUrl
      });

    } catch (error) {
      console.error('Erro ao carregar edição:', error);
      req.flash('error', 'Erro ao carregar tarefa');
      res.redirect('/tasks');
    }
  }

  // =============================================
  //  MÉTODOS DE AÇÃO (FORMULÁRIOS)
  // =============================================

  /**
   * Cria uma nova tarefa
   */
  static async createTask(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para criar tarefas');
        return res.redirect('/auth');
      }

      const { title, description, due_date, status = 'pending' } = req.body;
      const user_id = req.session.user.id;

      // Validações
      if (!title || title.trim().length < 3) {
        req.flash('error', 'Título deve ter pelo menos 3 caracteres');
        req.flash('formData', req.body);
        return res.redirect('/tasks/create');
      }

      const validStatuses = ['pending', 'completed'];
      if (!validStatuses.includes(status)) {
        req.flash('error', 'Status inválido');
        req.flash('formData', req.body);
        return res.redirect('/tasks/create');
      }

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
          status,
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
   * Atualiza uma tarefa existente
   */
  static async updateTask(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para editar tarefas');
        return res.redirect('/auth');
      }

      const { id } = req.params;
      const { title, description, due_date, status = 'pending' } = req.body;
      const user_id = req.session.user.id;

      // Validações
      if (!title || title.trim().length < 3) {
        req.flash('error', 'Título deve ter pelo menos 3 caracteres');
        req.flash('formData', req.body);
        return res.redirect(`/tasks/edit/${id}`);
      }

      const validStatuses = ['pending', 'completed'];
      if (!validStatuses.includes(status)) {
        req.flash('error', 'Status inválido');
        req.flash('formData', req.body);
        return res.redirect(`/tasks/edit/${id}`);
      }

      let formattedDueDate = null;
      if (due_date) {
        formattedDueDate = new Date(due_date);
        if (isNaN(formattedDueDate.getTime())) {
          req.flash('error', 'Data inválida');
          req.flash('formData', req.body);
          return res.redirect(`/tasks/edit/${id}`);
        }
        formattedDueDate = formattedDueDate.toISOString();
      }

      // Verifica se a tarefa pertence ao usuário
      const { data: existingTask, error: findError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', id)
        .eq('user_id', user_id)
        .single();

      if (findError || !existingTask) {
        req.flash('error', 'Tarefa não encontrada');
        return res.redirect('/tasks');
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          description: description ? description.trim() : null,
          due_date: formattedDueDate,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;

      req.flash('success', 'Tarefa atualizada com sucesso!');
      res.redirect('/tasks');

    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      req.flash('error', 'Erro ao atualizar tarefa');
      req.flash('formData', req.body);
      res.redirect(`/tasks/edit/${req.params.id}`);
    }
  }

  /**
   * Remove uma tarefa
   */
  static async deleteTaskForm(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para excluir tarefas');
        return res.redirect('/auth');
      }

      const { id } = req.params;
      const user_id = req.session.user.id;

      // Verifica se a tarefa pertence ao usuário
      const { data: task, error: findError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', id)
        .eq('user_id', user_id)
        .single();

      if (findError || !task) {
        req.flash('error', 'Tarefa não encontrada');
        return res.redirect('/tasks');
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      req.flash('success', 'Tarefa removida com sucesso');
      res.redirect('/tasks');

    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      req.flash('error', 'Erro ao excluir tarefa');
      res.redirect('/tasks');
    }
  }

  // =============================================
  //  MÉTODOS DE API (JSON)
  // =============================================

  /**
   * API: Lista tarefas em JSON
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