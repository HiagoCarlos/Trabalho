const supabase = require('../config/supabaseClient');

class Task {
  #id;
  #title;
  #description;
  #userId;
  #status;
  #dueDate;
  #createdAt;

  constructor({ id = null, title, description, userId, status = 'pending', dueDate = null, createdAt = null }) {
    this.#id = id;
    this.#title = title;
    this.#description = description;
    this.#userId = userId;
    this.#status = status;
    this.#dueDate = dueDate;
    this.#createdAt = createdAt;
  }

  // ======= GETTERS ============
  get id()          { return this.#id; }
  get title()       { return this.#title; }
  get description() { return this.#description; }
  get userId()      { return this.#userId; }
  get status()      { return this.#status; }
  get dueDate()     { return this.#dueDate; }
  get createdAt()   { return this.#createdAt; }


  /**
   * Cria uma nova tarefa
   */
  static async create(title, description, userId, dueDate = null, status = 'pending') {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        { 
          title, 
          description, 
          user_id: userId, 
          due_date: dueDate, 
          status,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) return { data: null, error };
    const task = new Task({
      id: data[0].id,
      title: data[0].title,
      description: data[0].description,
      userId: data[0].user_id,
      status: data[0].status,
      dueDate: data[0].due_date,
      createdAt: data[0].created_at
    });

    return { data: task, error: null };
  }

  /**
   * Obtém todas as tarefas de um usuário
   */
  static async getAll(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error };
    
    const tasks = data.map(task => new Task({
      id: task.id,
      title: task.title,
      description: task.description,
      userId: task.user_id,
      status: task.status,
      dueDate: task.due_date,
      createdAt: task.created_at
    }));

    return { data: tasks, error: null };
  }

  /**
   * Obtém uma tarefa por ID
   */
  static async getById(taskId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) return { data: null, error };

    const task = new Task({
      id: data.id,
      title: data.title,
      description: data.description,
      userId: data.user_id,
      status: data.status,
      dueDate: data.due_date,
      createdAt: data.created_at
    });

    return { data: task, error: null };
  }

  /**
   * Atualiza uma tarefa
   */
  static async update(taskId, updates) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select();

    return { data, error };
  }

  /**
   * Remove uma tarefa
   */
  static async delete(taskId) {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    return { data, error };
  }

  /**
   * Filtra tarefas por status
   */
  static async filterByStatus(userId, status) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('due_date', { ascending: true });

    if (error) return { data: null, error };

    const tasks = data.map(task => new Task({
      id: task.id,
      title: task.title,
      description: task.description,
      userId: task.user_id,
      status: task.status,
      dueDate: task.due_date,
      createdAt: task.created_at
    }));

    return { data: tasks, error: null };
  }
}

module.exports = Task;
