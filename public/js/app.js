document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    
    // Carregar tarefas ao iniciar
    loadTasks();
  
    // Adicionar nova tarefa
    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('task-title').value;
      const description = document.getElementById('task-description').value;
      
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, description })
        });
        
        if (!response.ok) throw new Error('Erro ao criar tarefa');
        
        taskForm.reset();
        loadTasks();
      } catch (error) {
        alert(error.message);
      }
    });
  
    // Carregar tarefas
    async function loadTasks() {
      try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        
        taskList.innerHTML = tasks.map(task => `
          <div class="task-card" data-id="${task._id}">
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <button class="delete-btn">Excluir</button>
            <button class="complete-btn">
              ${task.status === 'concluída' ? 'Desmarcar' : 'Concluir'}
            </button>
          </div>
        `).join('');
        
        // Adicionar eventos aos botões
        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', deleteTask);
        });
        
        document.querySelectorAll('.complete-btn').forEach(btn => {
          btn.addEventListener('click', toggleTaskStatus);
        });
      } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
      }
    }
  
    // Deletar tarefa
    async function deleteTask(e) {
      const taskId = e.target.closest('.task-card').dataset.id;
      
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erro ao deletar tarefa');
        
        loadTasks();
      } catch (error) {
        alert(error.message);
      }
    }
  
    // Alternar status
    async function toggleTaskStatus(e) {
      const taskId = e.target.closest('.task-card').dataset.id;
      
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: e.target.textContent.trim() === 'Concluir' ? 'concluída' : 'pendente'
          })
        });
        
        if (!response.ok) throw new Error('Erro ao atualizar tarefa');
        
        loadTasks();
      } catch (error) {
        alert(error.message);
      }
    }
  });