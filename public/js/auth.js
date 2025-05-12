document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('login-form');

  // Check token and redirect on page load for persistent login
  const token = localStorage.getItem('token');
  const currentPath = window.location.pathname;
  if (token && (currentPath === '/login' || currentPath === '/register')) {
    window.history.replaceState({}, '', '/dashboard');
  }

  // Função para carregar conteúdo dinâmico
  const loadContent = (path) => {
    const contentDiv = document.getElementById('app-content');
    if (!contentDiv) return;

    contentDiv.innerHTML = '<div class="loading">Carregando...</div>';

    switch(path) {
      case '/dashboard':
        fetchDashboardContent();
        break;
      case '/tasks':
        fetchTasksContent();
        break;
      case '/login':
        // Redirect to backend login page
        window.location.href = '/login';
        break;
      case '/register':
        // Redirect to backend register page
        window.location.href = '/register';
        break;
      default:
        contentDiv.innerHTML = '<h1>Página não encontrada</h1>';
    }
  };

  // Função para navegação SPA
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    loadContent(path);
  };

  // Verifica status de autenticação ao carregar
  checkAuthStatus();

  // Função para mostrar alertas estilizados
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

  // Função para verificar autenticação
  function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    console.log('checkAuthStatus token:', token);
    console.log('checkAuthStatus currentPath:', currentPath);

    // Redireciona se autenticado tentando acessar login/register
    if (token && (currentPath === '/login' || currentPath === '/register')) {
      navigateTo('/dashboard');
    }

    // Redireciona para login se não autenticado tentando acessar áreas protegidas
    if (!token && (currentPath === '/dashboard' || currentPath === '/tasks')) {
      navigateTo('/login');
    }
  }

  // Função para buscar conteúdo do dashboard
  async function fetchDashboardContent() {
    try {
      const response = await fetchWithAuth('/api/tasks');
      const tasks = await response.json();

      const contentDiv = document.getElementById('app-content');
      contentDiv.innerHTML = `
        <h1>Dashboard</h1>
        <div class="user-info">
          <p>Bem-vindo, ${JSON.parse(localStorage.getItem('user')).email}</p>
        </div>
        <div class="tasks-container">
          <h2>Suas Tarefas</h2>
          <ul class="tasks-list">
            ${tasks.map(task => `
              <li class="task-item ${task.status}">
                <h3>${task.title}</h3>
                <p>${task.description || 'Sem descrição'}</p>
                <span class="status">${task.status}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    } catch (error) {
      showAlert('error', 'Erro ao carregar tarefas');
      console.error('Dashboard error:', error);
    }
  }

  // Função para buscar conteúdo da página de tarefas
  async function fetchTasksContent() {
    try {
      const response = await fetchWithAuth('/api/tasks');
      const tasks = await response.json();

      const contentDiv = document.getElementById('app-content');
      contentDiv.innerHTML = `
        <h1>Gerenciar Tarefas</h1>
        <div class="tasks-actions">
          <button id="create-task">Nova Tarefa</button>
        </div>
        <div class="tasks-table">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(task => `
                <tr>
                  <td>${task.title}</td>
                  <td>${task.description || '-'}</td>
                  <td class="status-cell ${task.status}">
                    ${task.status}
                  </td>
                  <td class="actions">
                    <button class="edit-btn" data-id="${task._id}">Editar</button>
                    <button class="delete-btn" data-id="${task._id}">Excluir</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Adiciona event listeners para os botões
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const taskId = e.target.getAttribute('data-id');
          editTask(taskId);
        });
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const taskId = e.target.getAttribute('data-id');
          deleteTask(taskId);
        });
      });

      document.getElementById('create-task').addEventListener('click', () => {
        showCreateTaskForm();
      });
    } catch (error) {
      showAlert('error', 'Erro ao carregar tarefas');
      console.error('Tasks error:', error);
    }
  }

  // Função para registrar usuário
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

        // Armazena os dados do usuário
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.userId,
          email: email
        }));

        showAlert('success', 'Registro realizado com sucesso!');

        // Navega para o dashboard imediatamente
        navigateTo('/dashboard');

      } catch (error) {
        console.error('Registration error:', error);
        showAlert('error', error.message || 'Erro ao registrar');
      }
    });
  }

  // Função para login
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

        console.log('Login response status:', res.status);
        const data = await res.json();
        console.log('Login response data:', data);

        if (!res.ok) {
          throw new Error(data.error || 'Credenciais inválidas');
        }

        // Armazena os dados do usuário
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.userId,
          email: email
        }));

        showAlert('success', 'Login realizado com sucesso!');

        // Navega para o dashboard imediatamente
        navigateTo('/dashboard');

      } catch (error) {
        console.error('Login error:', error);
        showAlert('error', error.message || 'Erro ao fazer login');
      }
    });
  }

  // Adiciona listener para navegação SPA
  document.body.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) {
      e.preventDefault();
      navigateTo(e.target.getAttribute('href'));
    }
  });

  // Listener para eventos de popstate (voltar/avançar no navegador)
  window.addEventListener('popstate', () => {
    loadContent(window.location.pathname);
  });

  // Load initial content dynamically on page load
  loadContent(window.location.pathname);
});

// Função para requisições autenticadas
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  console.log('fetchWithAuth token:', token);

  if (!token) {
    window.location.href = '/login';
    return Promise.reject('Não autenticado');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });
    console.log(`fetchWithAuth response status for ${url}:`, response.status);

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject('Sessão expirada');
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Funções auxiliares para gerenciamento de tarefas
async function editTask(taskId) {
  try {
    const response = await fetchWithAuth(`/api/tasks/${taskId}`);
    const task = await response.json();

    // Implemente seu formulário de edição aqui
    console.log('Edit task:', task);
    showAlert('info', `Editando tarefa: ${task.title}`);

  } catch (error) {
    showAlert('error', 'Erro ao carregar tarefa para edição');
    console.error('Edit task error:', error);
  }
}

async function deleteTask(taskId) {
  if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

  try {
    const response = await fetchWithAuth(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showAlert('success', 'Tarefa excluída com sucesso!');
      fetchTasksContent(); // Recarrega a lista
    } else {
      throw new Error('Falha ao excluir tarefa');
    }
  } catch (error) {
    showAlert('error', 'Erro ao excluir tarefa');
    console.error('Delete task error:', error);
  }
}

function showCreateTaskForm() {
  const contentDiv = document.getElementById('app-content');
  contentDiv.innerHTML = `
    <div class="task-form">
      <h2>Nova Tarefa</h2>
      <form id="taskForm">
        <div class="form-group">
          <label for="title">Título:</label>
          <input type="text" id="title" required>
        </div>
        <div class="form-group">
          <label for="description">Descrição:</label>
          <textarea id="description" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="status">Status:</label>
          <select id="status">
            <option value="pendente">Pendente</option>
            <option value="concluída">Concluída</option>
          </select>
        </div>
        <button type="submit">Salvar</button>
      </form>
    </div>
  `;

  document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await createTask();
  });
}

async function createTask() {
  try {
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const status = document.getElementById('status').value;

    const response = await fetchWithAuth('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description, status })
    });

    if (response.ok) {
      showAlert('success', 'Tarefa criada com sucesso!');
      fetchTasksContent(); // Recarrega a lista
    } else {
      throw new Error('Falha ao criar tarefa');
    }
  } catch (error) {
    showAlert('error', 'Erro ao criar tarefa');
    console.error('Create task error:', error);
  }
}
