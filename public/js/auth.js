document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');

  const showAlert = (type, message) => {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 3000);
  };

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
        localStorage.setItem('token', data.token);
        showAlert('success', 'Registrado com sucesso');
        registerForm.reset();
      } catch (error) {
        showAlert('error', error.message);
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
      if (!password || password.length < 6) {
        showAlert('error', 'Senha inválida');
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
          throw new Error(data.error || 'Erro no login');
        }
        localStorage.setItem('token', data.token);
        showAlert('success', 'Login realizado com sucesso');
        loginForm.reset();
      } catch (error) {
        showAlert('error', error.message);
      }
    });
  }

  // Verificar autenticação em cada requisição
  async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');

    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return response;
  }
});
