const supabase = require('../config/supabaseClient');
const { format } = require('date-fns'); 

class TaskController {
  static async listTasks(req, res, next) { 
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para acessar suas tarefas');
        return res.redirect('/auth');
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', req.session.user.id)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tarefas no Supabase:', error);
        throw error; 
      }

      const formattedTasks = tasks.map(task => ({
        ...task,
        due_date: task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : 'N/A',
        created_at: task.created_at ? format(new Date(task.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'
      }));

      res.render('tasks/dashboard', {
        title: 'Minhas Tarefas',
        tasks: formattedTasks,
        userPreferences: req.userPreferences || res.locals.userPreferences || { theme: 'light', language: 'pt-BR' }
      });

    } catch (error) {
      console.error('Erro detalhado ao listar tarefas:', error);
      req.flash('error', 'Falha ao carregar suas tarefas. Tente novamente.');
      return res.status(500).render('error', {
         title: 'Erro ao Listar Tarefas',
         message: 'Não foi possível carregar suas tarefas no momento.'
      });
    }
  }

  static showCreateForm(req, res) {
    if (!req.session.user) {
      req.flash('error', 'Faça login para criar tarefas');
      return res.redirect('/auth');
    }

    res.render('tasks/create', {
      title: 'Nova Tarefa',
      task: {},
      formData: req.flash('formData')[0] || {},
      userPreferences: req.userPreferences || res.locals.userPreferences || { theme: 'light', language: 'pt-BR' }
    });
  }


  static async showEditForm(req, res, next) {
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

      if (error) {
        console.error(`Erro ao buscar tarefa ${id} para edição:`, error);
        throw error;
      }

      if (!task) {
        req.flash('error', 'Tarefa não encontrada ou você não tem permissão para editá-la.');
        return res.redirect('/tasks');
      }

      const formattedDueDate = task.due_date
        ? new Date(task.due_date).toISOString().split('T')[0]
        : '';

      res.render('tasks/edit', {
        title: 'Editar Tarefa',
        task: {
          ...task,
          due_date: formattedDueDate
        },
        formData: req.flash('formData')[0] || {},
        userPreferences: req.userPreferences || res.locals.userPreferences || { theme: 'light', language: 'pt-BR' }
      
      });

    } catch (error) {
      console.error('Erro ao carregar formulário de edição de tarefa:', error);
      req.flash('error', 'Erro ao carregar a tarefa para edição.');
      return res.redirect('/tasks');
    }
  }

  static async createTask(req, res, next) { 
    try {
      if (!req.session.user) {
       
        req.flash('error', 'Sessão inválida. Faça login para criar tarefas.');
        return res.redirect('/auth');
      }

      const { title, description, due_date, status = 'pending' } = req.body;
      const user_id = req.session.user.id;

      if (!title || title.trim().length < 3) {
        req.flash('error', 'O título da tarefa deve ter pelo menos 3 caracteres.');
        req.flash('formData', req.body);
        return res.redirect('/tasks/create');
      }

      const validStatuses = ['pending', 'completed'];
      if (!validStatuses.includes(status)) {
        req.flash('error', 'Status da tarefa inválido.');
        req.flash('formData', req.body);
        return res.redirect('/tasks/create');
      }

      let formattedDueDate = null;
      if (due_date) {
        const parsedDate = new Date(due_date);
        if (isNaN(parsedDate.getTime())) {
          req.flash('error', 'Data de conclusão inválida.');
          req.flash('formData', req.body);
          return res.redirect('/tasks/create');
        }
        
        formattedDueDate = parsedDate.toISOString();
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
      if (error) {
        console.error('Erro ao inserir tarefa no Supabase:', error);
        throw error;
      }

      req.flash('success', `Tarefa "${data[0].title}" criada com sucesso!`);
      res.redirect('/tasks'); 

    } catch (error) {
      console.error('Erro detalhado ao criar tarefa:', error);
      req.flash('error', 'Ocorreu um erro ao criar a tarefa. Verifique os dados e tente novamente.');
      req.flash('formData', req.body);
      res.redirect('/tasks/create');
    }
  }


  static async updateTask(req, res, next) { 
    try {
      if (!req.session.user) {
        req.flash('error', 'Sessão inválida. Faça login para editar tarefas.');
        return res.redirect('/auth');
      }

      const { id } = req.params;
      const { title, description, due_date, status } = req.body;
      const user_id = req.session.user.id;

      if (!title || title.trim().length < 3) {
        req.flash('error', 'O título da tarefa deve ter pelo menos 3 caracteres.');
        req.flash('formData', req.body);
        return res.redirect(`/tasks/edit/${id}`);
      }

      const validStatuses = ['pending', 'completed'];
      if (status && !validStatuses.includes(status)) { 
        req.flash('error', 'Status da tarefa inválido.');
        req.flash('formData', req.body);
        return res.redirect(`/tasks/edit/${id}`);
      }

      let formattedDueDate = null;
      if (due_date) { 
        const parsedDate = new Date(due_date);
        if (isNaN(parsedDate.getTime())) {
          req.flash('error', 'Data de conclusão inválida.');
          req.flash('formData', req.body);
          return res.redirect(`/tasks/edit/${id}`);
        }
        formattedDueDate = parsedDate.toISOString();
      }
      const { data: existingTask, error: findError } = await supabase
        .from('tasks')
        .select('id, due_date') 
        .eq('id', id)
        .eq('user_id', user_id)
        .single();

      if (findError || !existingTask) {
        req.flash('error', 'Tarefa não encontrada ou você não tem permissão para editá-la.');
        return res.redirect('/tasks');
      }
      
      const updatePayload = {
        title: title.trim(),
        description: description ? description.trim() : null,
        due_date: due_date ? formattedDueDate : existingTask.due_date,
        status: status || existingTask.status, 
        updated_at: new Date().toISOString()
      };
      if (due_date === '') {
          updatePayload.due_date = null;
      }


      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', id) 
        .select();

      if (error) {
        console.error(`Erro ao atualizar tarefa ${id} no Supabase:`, error);
        throw error;
      }

      req.flash('success', `Tarefa "${data[0].title}" atualizada com sucesso!`);
      res.redirect('/tasks');

    } catch (error) {
      console.error('Erro detalhado ao atualizar tarefa:', error);
      req.flash('error', 'Ocorreu um erro ao atualizar a tarefa.');
      req.flash('formData', req.body);
      res.redirect(`/tasks/edit/${req.params.id}`);
    }
  }

  static async deleteTaskForm(req, res, next) {
    try {
      if (!req.session.user) {
        req.flash('error', 'Sessão inválida. Faça login para excluir tarefas.');
        return res.redirect('/auth');
      }

      const { id } = req.params;
      const user_id = req.session.user.id;

      const { data: task, error: findError } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('id', id)
        .eq('user_id', user_id)
        .single();

      if (findError || !task) {
        req.flash('error', 'Tarefa não encontrada ou você não tem permissão para excluí-la.');
        return res.redirect('/tasks');
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
     

      if (error) {
        console.error(`Erro ao excluir tarefa ${id} no Supabase:`, error);
        throw error;
      }

      req.flash('success', `Tarefa "${task.title}" removida com sucesso.`);
      res.redirect('/tasks');

    } catch (error) {
      console.error('Erro detalhado ao excluir tarefa:', error);
      req.flash('error', 'Ocorreu um erro ao excluir a tarefa.');
      res.redirect('/tasks');
    }
  }

  static async getTasksAPI(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Não autorizado' });
      }
      const userId = req.session.user.id; 

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
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