const db = require('..//config/bd'); 

exports.listarUsuarios = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*');
        
        if (error) throw error;
        res.render('usuario/index', { usuarios: data });
    } catch (err) {
        res.status(500).send('Erro ao listar usuários');
    }
};

exports.listarTarefas = async (req, res) => {
    res.render('usuario/listatarefas');
};