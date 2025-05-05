require('dotenv').config();
const express = require('express');
const app = express();

// Middlewares
app.use(express.json());

// Importar rotas
const usuariosRouter = require('./routers/usuarios');

// Usar rotas
app.use('/usuarios', usuariosRouter);

// Rota raiz
app.get('/', (req, res) => {
    res.send('API está rodando!');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
