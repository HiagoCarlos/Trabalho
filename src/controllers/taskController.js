const supabase = require('../config/supabaseClient');

class TaskController {
  // =============================================
  //  MÉTODOS DE VISUALIZAÇÃO (EJS)
  // =============================================

  /**
   * Lista todas as tarefas do usuário (renderiza view EJS)
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
        return res.redirect('/auth');
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
   * Mostra formulário de edição de tarefa
   */
  static async showEditForm(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para editar tarefas');
        return res.redirect('/auth');
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
  static async createTask(req, res) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para criar tarefas');
        return res.redirect('/auth');
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
 * Mostra formulário de edição de tarefa (GET)
 */
static async showEditForm(req, res) {
  try {
    if (!req.session.user) {
      req.flash('error', 'Faça login para editar tarefas');
      return res.redirect('/auth');
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

    // Formata a data para o input type="date"
    const formattedDueDate = task.due_date 
      ? new Date(task.due_date).toISOString().split('T')[0]
      : '';

    res.render('tasks/edit', {
      title: 'Editar Tarefa',
      task: {
        ...task,
        due_date: formattedDueDate // Data formatada para o input
      },
      currentUrl: req.originalUrl,
      messages: req.flash(),
      formData: req.flash('formData')[0] || {} // Para manter dados em caso de erro
    });

  } catch (error) {
    console.error('Erro ao carregar edição:', error);
    req.flash('error', 'Erro ao carregar tarefa');
    res.redirect('/tasks');
  }
}

/**
 * Processa a atualização via POST
 */
static async updateTaskForm(req, res) {
  try {
    if (!req.session.user) {
      req.flash('error', 'Faça login para editar tarefas');
      return res.redirect('/auth');
    }

    const taskId = req.params.id;
    const user_id = req.session.user.id;
    const { title, description, due_date, status } = req.body;

    // Validações
    if (!title || title.trim().length < 3) {
      req.flash('error', 'Título deve ter pelo menos 3 caracteres');
      req.flash('formData', req.body); // Mantém os dados digitados
      return res.redirect(`/tasks/edit/${taskId}`);
    }

    // Validar status
    const validStatuses = ['pending', 'completed'];
    if (status && !validStatuses.includes(status)) {
      req.flash('error', 'Status inválido');
      req.flash('formData', req.body);
      return res.redirect(`/tasks/edit/${taskId}`);
    }

    // Validar e formatar data
    let formattedDueDate = null;
    if (due_date) {
      formattedDueDate = new Date(due_date);
      if (isNaN(formattedDueDate.getTime())) {
        req.flash('error', 'Data inválida');
        req.flash('formData', req.body);
        return res.redirect(`/tasks/edit/${taskId}`);
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
      req.flash('error', 'Tarefa não encontrada');
      return res.redirect('/tasks');
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
    res.redirect('/tasks');

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    req.flash('error', 'Erro ao atualizar tarefa');
    req.flash('formData', req.body); // Mantém os dados em caso de erro
    res.redirect(`/tasks/edit/${req.params.id}`);
  }
}
  /**
   * Remove uma tarefa via POST (para formulários HTML)
   */
static async deleteTaskForm(req, res) {
  try {
    if (!req.session.user) {
      req.flash('error', 'Faça login para excluir tarefas');
      return res.redirect('/auth');
    }

    const taskId = req.params.id;
    const user_id = req.session.user.id;

    console.log(`Tentando excluir tarefa ${taskId} para usuário ${user_id}`); // Log importante

    // Verifica se a tarefa pertence ao usuário
    const { data: task, error: findError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .eq('user_id', user_id)
      .single();

    if (findError || !task) {
      console.log('Tarefa não encontrada ou não pertence ao usuário', { findError, task });
      req.flash('error', 'Tarefa não encontrada');
      return res.redirect('/tasks');
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Erro ao excluir no Supabase:', error);
      throw error;
    }

    console.log('Tarefa excluída com sucesso');
    req.flash('success', 'Tarefa removida com sucesso');
    res.redirect('/tasks');

  } catch (error) {
    console.error('Erro completo ao excluir tarefa:', error);
    req.flash('error', 'Erro ao excluir tarefa');
    res.redirect('/tasks');
  }
}

  // =============================================
  //  MÉTODOS DE API (JSON)
  // =============================================

  /**
   * API para buscar tarefas
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

  /**
   * API para atualizar tarefa
   */

  }

module.exports = TaskController;