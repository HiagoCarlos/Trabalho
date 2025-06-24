// models/User.js
const supabase = require('../config/supabaseClient');

class User {
  // ---------- campos privados ----------
  #authId;        // corresponde a auth.users.id  (uuid)
  #email;
  #name;
  #avatarUrl;
  #createdAt;

  constructor({ authId, email, name = null, avatarUrl = null, createdAt = null }) {
    this.#authId    = authId;
    this.#email     = email;
    this.#name      = name;
    this.#avatarUrl = avatarUrl;
    this.#createdAt = createdAt;
  }

  // ---------- getters públicos ----------
  get id()        { return this.#authId; }  
  get email()     { return this.#email; }
  get name()      { return this.#name; }
  get avatarUrl() { return this.#avatarUrl; }
  get createdAt() { return this.#createdAt; }

  // ======================================================
  //  A U T H
  // ======================================================
  static async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { data: null, error };

    // Cria linha de profile “espelho” logo após sign-up
    await supabase.from('profiles').insert({
      auth_id: data.user.id,
      email
    });

    return { data: new User({ authId: data.user.id, email, createdAt: data.user.created_at }), error: null };
  }

  static async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error };

    // Busca dados de profile para popular name/avatar
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();

    return { data: new User({
        authId:    data.user.id,
        email:     data.user.email,
        name:      prof?.name ?? null,
        avatarUrl: prof?.avatar_url ?? null,
        createdAt: data.user.created_at
      }),
      error: null
    };
  }

  static async logout() {
    return await supabase.auth.signOut(); // devolve { error }
  }

  // user “atual” via sessão/token
  static async current() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { data: null, error };

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', user.id)
      .single();

    return { data: new User({
      authId:    user.id,
      email:     user.email,
      name:      prof?.name ?? null,
      avatarUrl: prof?.avatar_url ?? null,
      createdAt: user.created_at
    }), error: null };
  }

  // ======================================================
  //  P R O F I L E
  // ======================================================
  /** updateProfile recebe um objeto tipo { name, avatar_url } */
  static async updateProfile(authId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('auth_id', authId)
      .select()
      .single();

    if (error) return { data: null, error };
    return { data, error: null };
  }

  static async getProfile(authId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', authId)
      .single();
    return { data, error };
  }
}

module.exports = User;
