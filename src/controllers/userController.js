const User = require('../models/User');

class UserController {
  // Obter perfil do usuário
  static async getProfile(req, res) {
    try {
      const user_id = req.user.id;
      
      const { data: profile, error } = await User.getProfile(user_id);
      
      if (error) {
        throw error;
      }

      if (!profile) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }

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
      const updates = req.body;

      // Remove campos que não devem ser atualizados
      delete updates.id;
      delete updates.email; // Email deve ser atualizado via auth

      const { data: updatedProfile, error } = await User.updateProfile(user_id, updates);
      
      if (error) {
        throw error;
      }

      res.status(200).json({
        message: 'Perfil atualizado com sucesso',
        profile: updatedProfile
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Upload de avatar (simplificado)
  static async uploadAvatar(req, res) {
    try {
      const user_id = req.user.id;
      const file = req.file; // Assume que está usando multer ou similar

      if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      // Aqui você implementaria o upload para o Supabase Storage
      // Esta é uma implementação simplificada
      const avatarUrl = `/uploads/${file.filename}`;

      // Atualiza o perfil com a nova URL do avatar
      const { error } = await User.updateProfile(user_id, { avatar_url: avatarUrl });
      
      if (error) {
        throw error;
      }

      res.status(200).json({
        message: 'Avatar atualizado com sucesso',
        avatarUrl
      });
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      res.status(500).json({ error: 'Erro ao atualizar avatar' });
    }
  }
}

module.exports = UserController;