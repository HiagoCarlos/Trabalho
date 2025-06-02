const supabase = require('../config/supabaseClient');
const User = require('../models/User');

class UserController {
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


  static async updateProfile(req, res) {
    try {
      const user_id = req.user.id;
      let updates = req.body;

   
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
        maxAge: 30 * 24 * 60 * 60 * 1000, 
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

  static async uploadAvatar(req, res) {
    try {
      const user_id = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

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


      const { data: { publicUrl } } = supabase
        .storage
        .from('user-avatars')
        .getPublicUrl(filePath);
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

  static async deleteAccount(req, res) {
    try {
      const user_id = req.user.id;

      await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user_id);

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('auth_id', user_id);

      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
      if (authError) throw authError;

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