document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const taskForm = document.getElementById('add-task-form');
    const tasksContainer = document.getElementById('tasks-container');
    const statusFilter = document.getElementById('status-filter');
    
    // Carregar tarefas ao iniciar
    loadTasks();
    
    // Evento para adicionar tarefa
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('task-title').value;
      const description = document.getElementById('task-desc').value;
      
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ title, description })
        });
        
        if (!response.ok) throw new Error('Erro ao adicionar tarefa');
        
        taskForm.reset();
        loadTasks();
      } catch (error) {
        showAlert('error', error.message);
      }
    });
    
    // Evento para filtrar tarefas
    statusFilter.addEventListener('change', loadTasks);
    
    // Função para carregar tarefas
    async function loadTasks() {
      try {
        const status = statusFilter.value;
        let url = '/api/tasks';
        if (status !== 'all') url += `?status=${status}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar tarefas');
        
        const tasks = await response.json();
        renderTasks(tasks);
      } catch (error) {
        showAlert('error', error.message);
      }
    }
    
    // Função para renderizar tarefas
    function renderTasks(tasks) {
      tasksContainer.innerHTML = '';
      
      if (tasks.length === 0) {
        tasksContainer.innerHTML = '<p>Nenhuma tarefa encontrada.</p>';
        return;
      }
      
      tasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = `task-card ${task.status === 'concluída' ? 'completed' : ''}`;
        taskEl.innerHTML = `
          <h3>${task.title}</h3>
          <p>${task.description || 'Sem descrição'}</p>
          <p><strong>Status:</strong> ${task.status}</p>
          <div class="task-actions">
            <button class="complete-btn" data-id="${task._id}">
              ${task.status === 'concluída' ? 'Desmarcar' : 'Concluir'}
            </button>
            <button class="delete-btn" data-id="${task._id}">Excluir</button>
          </div>
        `;
        tasksContainer.appendChild(taskEl);
      });
      
      // Adicionar eventos aos botões
      document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', toggleTaskStatus);
      });
      
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteTask);
      });
    }
    
    // Função para alternar status da tarefa
    async function toggleTaskStatus(e) {
      const taskId = e.target.getAttribute('data-id');
      const isCompleted = e.target.textContent.trim() === 'Desmarcar';
      
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            status: isCompleted ? 'pendente' : 'concluída' 
          })
        });
        
        if (!response.ok) throw new Error('Erro ao atualizar tarefa');
        
        loadTasks();
      } catch (error) {
        showAlert('error', error.message);
      }
    }
    
    // Função para excluir tarefa
    async function deleteTask(e) {
      const taskId = e.target.getAttribute('data-id');
      
      if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
      
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Erro ao excluir tarefa');
        
        loadTasks();
      } catch (error) {
        showAlert('error', error.message);
      }
    }
  });
  
  // Função para mostrar alertas (em utils.js)
  function showAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.body.prepend(alert);
    
    setTimeout(() => {
      alert.remove();
    }, 3000);
  }
