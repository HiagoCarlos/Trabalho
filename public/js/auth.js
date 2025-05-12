document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('login-form');

  // Verifica se já está autenticado
  checkAuthStatus();

  const showAlert = (type, message) => {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.left = '50%';
    alert.style.transform = 'translateX(-50%)';
    alert.style.padding = '10px 20px';
    alert.style.borderRadius = '5px';
    alert.style.color = type === 'error' ? '#721c24' : '#155724';
    alert.style.backgroundColor = type === 'error' ? '#f8d7da' : '#d4edda';
    alert.style.border = type === 'error' ? '1px solid #f5c6cb' : '1px solid #c3e6cb';
    alert.style.zIndex = '1000';
    alert.textContent = message;
    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 3000);
  };

  function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    
    // Se estiver na página de login/registro mas já autenticado
    if (token && (currentPath === '/login' || currentPath === '/register')) {
      window.location.href = '/dashboard';
    }
    
    // Se tentar acessar páginas protegidas sem autenticação
    if (!token && (currentPath === '/dashboard' || currentPath === '/tasks')) {
      window.location.href = '/login';
    }
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = registerForm.elements['email'].value.trim();
      const password = registerForm.elements['password'].value;

      if (!email) {
        showAlert('error', 'Email é obrigatório');
        return;
      }
      if (!password || password.length < 6) {
        showAlert('error', 'Senha deve ter pelo menos 6 caracteres');
        return;
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Erro no registro');
        }
        
        // Armazena o token e verifica antes de redirecionar
        localStorage.setItem('token', data.token);
        showAlert('success', 'Registrado com sucesso! Redirecionando...');
        
        // Delay para mostrar a mensagem
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
        
      } catch (error) {
        console.error('Registration error:', error);
        showAlert('error', error.message || 'Erro ao registrar');
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.elements['email'].value.trim();
      const password = loginForm.elements['password'].value;

      if (!email) {
        showAlert('error', 'Email é obrigatório');
        return;
      }
      if (!password) {
        showAlert('error', 'Senha é obrigatória');
        return;
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Credenciais inválidas');
        }
        
        // Verifica se o token foi recebido
        if (!data.token) {
          throw new Error('Token não recebido');
        }
        
        localStorage.setItem('token', data.token);
        showAlert('success', 'Login realizado! Redirecionando...');
        
        // Verificação adicional antes de redirecionar
        setTimeout(() => {
          if (localStorage.getItem('token')) {
            window.location.href = '/dashboard';
          } else {
            showAlert('error', 'Autenticação falhou');
          }
        }, 1500);
        
      } catch (error) {
        console.error('Login error:', error);
        showAlert('error', error.message || 'Erro ao fazer login');
      }
    });
  }
});

// Função para usar em outras páginas
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    window.location.href = '/login';
    return Promise.reject('Não autenticado');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return Promise.reject('Sessão expirada');
  }

  return response;
}