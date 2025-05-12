document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  const tasksContainer = document.getElementById('tasks-container');
  const addTaskForm = document.getElementById('add-task-form');
  const statusFilter = document.getElementById('status-filter');

  const API_BASE = '/api/tasks';

  async function fetchTasks(status = 'all', sortBy = '') {
    let url = API_BASE + '?';
    if (status && status !== 'all') {
      url += `status=${encodeURIComponent(status)}&`;
    }
    if (sortBy) {
      url += `sortBy=${encodeURIComponent(sortBy)}&`;
    }
    const res = await fetch(url, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw new Error('Failed to fetch tasks');
    }
    return await res.json();
  }

  function renderTasks(tasks) {
    tasksContainer.innerHTML = '';
    if (tasks.length === 0) {
      tasksContainer.innerHTML = '<p>Nenhuma tarefa encontrada.</p>';
      return;
    }
    tasks.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task-item' + (task.status === 'concluída' ? ' completed' : '');
      taskDiv.dataset.id = task.id;

      const title = document.createElement('h3');
      title.textContent = task.title;
      taskDiv.appendChild(title);

      if (task.description) {
        const desc = document.createElement('p');
        desc.textContent = task.description;
        taskDiv.appendChild(desc);
      }

      if (task.due_date) {
        const dueDate = document.createElement('p');
        dueDate.textContent = 'Prazo: ' + new Date(task.due_date).toLocaleDateString();
        taskDiv.appendChild(dueDate);
      }

      if (task.priority) {
        const priority = document.createElement('p');
        priority.textContent = 'Prioridade: ' + task.priority;
        taskDiv.appendChild(priority);
      }

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'task-actions';

      if (task.status !== 'concluída') {
        const completeBtn = document.createElement('button');
        completeBtn.className = 'complete-btn';
        completeBtn.textContent = 'Concluir';
        completeBtn.addEventListener('click', () => updateTaskStatus(task.id, 'concluída'));
        actionsDiv.appendChild(completeBtn);
      }

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Excluir';
      deleteBtn.addEventListener('click', () => deleteTask(task.id));
      actionsDiv.appendChild(deleteBtn);

      taskDiv.appendChild(actionsDiv);

      tasksContainer.appendChild(taskDiv);
    });
  }

  async function loadTasks() {
    try {
      const status = statusFilter.value;
      const tasks = await fetchTasks(status);
      renderTasks(tasks);
    } catch (err) {
      console.error(err);
    }
  }

  async function addTask(event) {
    event.preventDefault();
    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-desc');

    const newTask = {
      title: titleInput.value,
      description: descInput.value,
      status: 'pendente',
      priority: 'média'
    };

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify(newTask)
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error('Failed to add task');
      }
      titleInput.value = '';
      descInput.value = '';
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  }

  async function updateTaskStatus(taskId, status) {
    try {
      const res = await fetch(`${API_BASE}/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error('Failed to update task');
      }
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteTask(taskId) {
    try {
      const res = await fetch(`${API_BASE}/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        throw new Error('Failed to delete task');
      }
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  }

  addTaskForm.addEventListener('submit', addTask);
  statusFilter.addEventListener('change', loadTasks);

  loadTasks();
});
