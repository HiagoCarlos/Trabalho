document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorMessage = document.getElementById('errorMessage');

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          errorMessage.textContent = data.error || 'Erro no login';
          return;
        }

        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      } catch (err) {
        errorMessage.textContent = 'Erro no login';
      }
    });
  }

  // On protected pages, check token presence and validity
  const protectedPaths = ['/dashboard', '/tasks'];
  if (protectedPaths.includes(window.location.pathname)) {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  }
});
