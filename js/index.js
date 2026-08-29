document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');

    // Manejo del formulario
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const titulo = document.getElementById('titulo').value.trim();
        const descripcion = document.getElementById('descripcion').value.trim();
        const fecha = document.getElementById('fecha').value;
        const prioridad = document.getElementById('prioridad').value;

        // Validaciones básicas
        if (!titulo || !descripcion || !fecha || !prioridad) {
            // Activa las clases is-invalid de Bootstrap si están vacíos
            return;
        }

        taskManager.addTask(titulo, descripcion, fecha, prioridad);
        taskForm.reset();
        renderTasks();
    });

    // Función para renderizar el HTML dinámico
    function renderTasks() {
        taskList.innerHTML = '';

        taskManager.tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `card border-0 shadow-sm rounded-4 p-3 ${task.completed ? 'bg-light' : ''}`;
            
            taskCard.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="${task.completed ? 'text-decoration-line-through text-muted' : 'fw-semibold'}">${task.titulo}</h5>
                        <p class="text-secondary small mb-2">${task.descripcion}</p>
                        <div class="d-flex gap-2 align-items-center">
                            <span class="badge bg-secondary">${task.fecha}</span>
                            <span class="badge ${getPriorityBadge(task.prioridad)}">${task.prioridad}</span>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-success toggle-btn" data-id="${task.id}">
                            <span class="material-symbols-outlined align-middle">
                                ${task.completed ? 'undo' : 'check'}
                            </span>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${task.id}">
                            <span class="material-symbols-outlined align-middle">delete</span>
                        </button>
                    </div>
                </div>
            `;
            taskList.appendChild(taskCard);
        });

        updateCounters();
    }

    function getPriorityBadge(priority) {
        switch(priority) {
            case 'Alta': return 'bg-danger';
            case 'Media': return 'bg-warning text-dark';
            case 'Baja': return 'bg-info text-dark';
            default: return 'bg-secondary';
        }
    }

    // Delegación de eventos para botones dinámicos
    taskList.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = Number(target.dataset.id);

        if (target.classList.contains('toggle-btn')) {
            taskManager.toggleTaskStatus(id);
            renderTasks();
        }

        if (target.classList.contains('delete-btn')) {
            taskManager.deleteTask(id);
            renderTasks();
        }
    });

    // Render inicial
    renderTasks();
});