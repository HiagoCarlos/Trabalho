document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Verificar se o usuário está logado
    if (localStorage.getItem('token')) {
      toggleAuthState(true);
    }
    
    // Evento de login (simplificado - em produção use um form adequado)
    loginBtn.addEventListener('click', async () => {
      try {
        // Substitua por sua lógica real de login
        const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'usuario@exemplo.com',
            password: 'senha123'
          })
        });
        
        if (!response.ok) throw new Error('Login falhou');
        
        const { data: { token } } = await response.json();
        localStorage.setItem('token', token);
        toggleAuthState(true);
        showAlert('success', 'Login realizado com sucesso!');
      } catch (error) {
        showAlert('error', error.message);
      }
    });
    
    // Evento de logout
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      toggleAuthState(false);
      showAlert('success', 'Logout realizado com sucesso!');
    });
    
    // Alternar estado de autenticação
    function toggleAuthState(isLoggedIn) {
      loginBtn.style.display = isLoggedIn ? 'none' : 'block';
      logoutBtn.style.display = isLoggedIn ? 'block' : 'none';
      
      // Mostrar/ocultar funcionalidades baseado no login
      document.getElementById('task-form').style.display = 
        isLoggedIn ? 'block' : 'none';
      document.getElementById('tasks-list').style.display = 
        isLoggedIn ? 'block' : 'none';
      
      if (isLoggedIn) {
        // Recarregar tarefas se estiver logado
        document.dispatchEvent(new Event('DOMContentLoaded'));
      } else {
        // Limpar lista de tarefas
        document.getElementById('tasks-container').innerHTML = 
          '<p>Faça login para ver suas tarefas.</p>';
      }
    }
  });