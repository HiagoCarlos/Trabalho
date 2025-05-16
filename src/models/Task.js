// models/Task.js
const supabase = require('../config/supabaseClient');

class Task {
  /**
   * Cria uma nova tarefa
   * @param {string} title 
   * @param {string} description 
   * @param {string} userId 
   * @param {string} dueDate 
   * @param {string} status 
   * @returns {Promise<{data, error}>}
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
    
    return { data, error };
  }

  /**
   * Obtém todas as tarefas de um usuário
   * @param {string} userId 
   * @returns {Promise<{data, error}>}
   */
  static async getAll(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  }

  /**
   * Obtém uma tarefa por ID
   * @param {string} taskId 
   * @returns {Promise<{data, error}>}
   */
  static async getById(taskId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    return { data, error };
  }

  /**
   * Atualiza uma tarefa
   * @param {string} taskId 
   * @param {object} updates 
   * @returns {Promise<{data, error}>}
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
   * @param {string} taskId 
   * @returns {Promise<{data, error}>}
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
   * @param {string} userId 
   * @param {string} status 
   * @returns {Promise<{data, error}>}
   */
  static async filterByStatus(userId, status) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('due_date', { ascending: true });
    
    return { data, error };
  }
}

module.exports = Task;