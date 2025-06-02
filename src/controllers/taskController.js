// src/controllers/taskController.js
const supabase = require('../config/supabaseClient');
const { format } = require('date-fns'); // Usado para formatar datas

class TaskController {
  // =============================================
  //  MÉTODOS DE VISUALIZAÇÃO (EJS)
  // =============================================

  /**
   * Lista todas as tarefas do usuário
   */
  static async listTasks(req, res, next) { // Adicionado next para melhor tratamento de erro
    try {
      if (!req.session.user) {
        req.flash('error', 'Faça login para acessar suas tarefas');
        return res.redirect('/auth');
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', req.session.user.id)
        .order('due_date', { ascending: true, nullsFirst: false }) // Garante que tarefas sem data não quebrem a ordenação
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar tarefas no Supabase:', error);
        throw error; // Lança o erro para ser pego pelo catch
      }

      const formattedTasks = tasks.map(task => ({
        ...task,
        due_date: task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : 'N/A',
        created_at: task.created_at ? format(new Date(task.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'
      }));

      res.render('tasks/dashboard', {
        title: 'Minhas Tarefas',
        tasks: formattedTasks,
        // messages já é adicionado globalmente em server.js (res.locals.messages)
        // csrfToken já é adicionado globalmente em server.js (res.locals.csrfToken)
        // currentUrl já é adicionado globalmente em server.js (res.locals.currentUrl)
        // theme virá de userPreferences, que é carregado pelo middleware loadPreferences
        // e userPreferences é disponibilizado globalmente via res.locals.userPreferences
        // ou passado explicitamente pelo controller se necessário (como no authController)
        // Vamos garantir que userPreferences esteja disponível para o layout/header
        userPreferences: req.userPreferences || res.locals.userPreferences || { theme: 'light', language: 'pt-BR' }
      });

    } catch (error) {
      console.error('Erro detalhado ao listar tarefas:', error);
      req.flash('error', 'Falha ao carregar suas tarefas. Tente novamente.');
      // Em vez de redirecionar para '/', que pode redirecionar para /auth e causar loops se houver erro lá,
      // renderize uma página de erro ou redirecione para uma página segura.
      // Se o erro for grave, o manipulador de erro global em server.js pode pegar.
      // Por agora, vamos redirecionar para uma página inicial segura se for erro de fluxo.
      // Se for erro de DB, o throw error acima deve ser pego pelo global error handler.
      // Se não houver sessão, já redirecionou para /auth.
      // Este catch é mais para erros após a verificação de sessão.
      return res.status(500).render('error', {
         title: 'Erro ao Listar Tarefas',
         message: 'Não foi possível carregar suas tarefas no momento.'
      });
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
      task: {}, // Para formulários de criação, um objeto vazio é comum
      formData: req.flash('formData')[0] || {},
      // messages, csrfToken, currentUrl, userPreferences virão de res.locals
      userPreferences: req.userPreferences || res.locals.userPreferences || { theme: 'light', language: 'pt-BR' }
    });
  }

  /**
   * Exibe formulário de edição de tarefa
   */
  static async showEditForm(req, res, next) { // Adicionado next
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
        .eq('user_id', req.session.user.id) // Garante que o usuário só edite suas próprias tarefas
        .single();

      if (error) {
        console.error(`Erro ao buscar tarefa ${id} para edição:`, error);
        throw error;
      }

      if (!task) {
        req.flash('error', 'Tarefa não encontrada ou você não tem permissão para editá-la.');
        return res.redirect('/tasks');
      }

      // Formata a data para o input type="date" (YYYY-MM-DD)
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
        // messages, csrfToken, currentUrl virão de res.locals
      });

    } catch (error) {
      console.error('Erro ao carregar formulário de edição de tarefa:', error);
      req.flash('error', 'Erro ao carregar a tarefa para edição.');
      return res.redirect('/tasks');
    }
  }

  // =============================================
  //  MÉTODOS DE AÇÃO (FORMULÁRIOS)
  // =============================================

  /**
   * Cria uma nova tarefa
   */
  static async createTask(req, res, next) { // Adicionado next
    try {
      if (!req.session.user) {
        // Isso não deveria acontecer se a rota POST também for protegida por autenticação
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
        // Adiciona verificação de validade da data e se não é uma data no passado (opcional)
        if (isNaN(parsedDate.getTime())) {
          req.flash('error', 'Data de conclusão inválida.');
          req.flash('formData', req.body);
          return res.redirect('/tasks/create');
        }
        // Opcional: impedir datas no passado para novas tarefas
        // if (parsedDate < new Date().setHours(0,0,0,0)) {
        //    req.flash('error', 'A data de conclusão não pode ser no passado.');
        //    req.flash('formData', req.body);
        //    return res.redirect('/tasks/create');
        // }
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
          created_at: new Date().toISOString() // Supabase pode fazer isso automaticamente se configurado
        }])
        .select(); // Retorna o registro inserido

      if (error) {
        console.error('Erro ao inserir tarefa no Supabase:', error);
        throw error;
      }

      req.flash('success', `Tarefa "${data[0].title}" criada com sucesso!`);
      res.redirect('/tasks'); // Redireciona para a lista de tarefas

    } catch (error) {
      console.error('Erro detalhado ao criar tarefa:', error);
      req.flash('error', 'Ocorreu um erro ao criar a tarefa. Verifique os dados e tente novamente.');
      req.flash('formData', req.body); // Preserva os dados do formulário
      res.redirect('/tasks/create');
    }
  }

  /**
   * Atualiza uma tarefa existente
   */
  static async updateTask(req, res, next) { // Adicionado next
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
      if (status && !validStatuses.includes(status)) { // Status é opcional na atualização
        req.flash('error', 'Status da tarefa inválido.');
        req.flash('formData', req.body);
        return res.redirect(`/tasks/edit/${id}`);
      }

      let formattedDueDate = null;
      if (due_date) { // due_date pode não ser enviado se não for alterado
        const parsedDate = new Date(due_date);
        if (isNaN(parsedDate.getTime())) {
          req.flash('error', 'Data de conclusão inválida.');
          req.flash('formData', req.body);
          return res.redirect(`/tasks/edit/${id}`);
        }
        formattedDueDate = parsedDate.toISOString();
      }


      // Verifica se a tarefa pertence ao usuário antes de atualizar
      const { data: existingTask, error: findError } = await supabase
        .from('tasks')
        .select('id, due_date') // Seleciona due_date para não sobrescrever se não for enviado
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
        // Apenas atualiza due_date se um valor válido for fornecido no formulário.
        // Se due_date não for enviado (ou for string vazia), pode-se optar por manter o valor existente ou definir como null.
        due_date: due_date ? formattedDueDate : existingTask.due_date, // Mantém a data existente se não for alterada
        status: status || existingTask.status, // Mantém status existente se não for alterado
        updated_at: new Date().toISOString()
      };
      // Se o campo due_date for enviado como vazio e você quiser limpá-lo:
      if (due_date === '') {
          updatePayload.due_date = null;
      }


      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', id) // Garante que estamos atualizando a tarefa correta
        // .eq('user_id', user_id) // Dupla checagem, já feita acima, mas não prejudica
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

  /**
   * Remove uma tarefa (processa o envio do formulário de deleção)
   */
  static async deleteTaskForm(req, res, next) { // Adicionado next
    try {
      if (!req.session.user) {
        req.flash('error', 'Sessão inválida. Faça login para excluir tarefas.');
        return res.redirect('/auth');
      }

      const { id } = req.params;
      const user_id = req.session.user.id;

      // Verifica se a tarefa pertence ao usuário antes de deletar
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
        // .eq('user_id', user_id); // Opcional, já verificado

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

  // =============================================
  //  MÉTODOS DE API (JSON) - Se necessário
  // =============================================

  /**
   * API: Lista tarefas em JSON
   */
  static async getTasksAPI(req, res) {
    try {
      // Para API, a autenticação pode vir de um token JWT no header, por exemplo.
      // A lógica aqui assume que req.user já foi populado por um middleware de autenticação de API.
      // Se estiver usando a mesma sessão do navegador:
      if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Não autorizado' });
      }
      const userId = req.session.user.id; // ou req.user.id se for um middleware de API

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