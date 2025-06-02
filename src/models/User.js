const supabase = require('../config/supabaseClient');

class User {
  /**
   * 
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{data, error}>}
   */
  static async create(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    return { data, error };
  }

  /**
   * 
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{data, error}>}
   */
  static async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  }

  /**
   * 
   * @returns {Promise<{error}>}
   */
  static async logout() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  /**
   * 
   * @returns {Promise<{data, error}>}
   */
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }

  /**
   * 
   * @param {string} userId 
   * @param {object} updates 
   * @returns {Promise<{data, error}>}
   */
  static async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    return { data, error };
  }

  /**
   * 
   * @param {string} userId 
   * @returns {Promise<{data, error}>}
   */
  static async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  }
}

module.exports = User;