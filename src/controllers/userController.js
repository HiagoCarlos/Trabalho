const supabase = require('../config/supabaseClient'); // sem as chaves
const User = require('../models/User');

class UserController {
  // Obter perfil do usuário
  static async getProfile(req, res) {
    try {
      const user_id = req.user.id;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', user_id)
        .single();
      
      if (error) throw error;
      if (!profile) return res.status(404).json({ error: 'Perfil não encontrado' });

      res.status(200).json(profile);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ error: 'Erro ao buscar perfil do usuário' });
    }
  }

  // Atualizar perfil do usuário
  static async updateProfile(req, res) {
    try {
      const user_id = req.user.id;
      let updates = req.body;

      // Remove campos protegidos
      ['id', 'email', 'created_at'].forEach(field => delete updates[field]);

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('auth_id', user_id)
        .select()
        .single();
      if (updates.theme_preference || updates.language) {
      const preferences = {
        theme: updates.theme_preference || req.user.profile.theme_preference || 'light',
        language: updates.language || req.user.profile.language || 'pt-BR'
      };
      res.cookie('userPreferences', JSON.stringify(preferences), {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
        sameSite: 'lax',
        path: '/'
      });
    }
      if (error) throw error;

      res.status(200).json({
        message: 'Perfil atualizado com sucesso',
        profile: updatedProfile
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Upload de avatar com Supabase Storage
  static async uploadAvatar(req, res) {
    try {
      const user_id = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      // 1. Upload para o Supabase Storage
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${user_id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('user-avatars')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Obtém URL pública
      const { data: { publicUrl } } = supabase
        .storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      // 3. Atualiza o perfil com a nova URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('auth_id', user_id);

      if (updateError) throw updateError;

      res.status(200).json({
        message: 'Avatar atualizado com sucesso',
        avatarUrl: publicUrl
      });
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      res.status(500).json({ error: 'Erro ao atualizar avatar' });
    }
  }

  // Deletar conta (completo)
  static async deleteAccount(req, res) {
    try {
      const user_id = req.user.id;
      
      // 1. Deleta todos os dados relacionados primeiro
      await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user_id);

      // 2. Deleta o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('auth_id', user_id);

      if (profileError) throw profileError;

      // 3. Deleta o usuário do Auth (requer permissões de service role)
      const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
      if (authError) throw authError;

      // 4. Destrói a sessão
      req.session.destroy();

      res.status(200).json({ 
        success: true,
        message: 'Conta deletada com sucesso' 
      });
      
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Erro ao deletar conta'
      });
    }
  }
}

module.exports = UserController;