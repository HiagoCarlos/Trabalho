// src/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Verifica se usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Cria token JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    
    res.status(201).json({ token });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  // Implemente similar ao register
};