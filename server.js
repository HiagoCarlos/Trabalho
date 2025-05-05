const express = require('express');
const app = express();
require('dotenv').config();

app.set('view engine', 'ejs'); // Configura para usar EJS
app.set('views', './views');  // Define a pasta onde ficam as views

app.use(express.json());

// Rotas
const usuariosRouter = require('./routers/usuarios');
app.use('/usuarios', usuariosRouter);

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
