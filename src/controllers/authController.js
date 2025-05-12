const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const user = new User({ email, password });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Senha inválida' });
    }

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user._id);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
