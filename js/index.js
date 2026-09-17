document.addEventListener('DOMContentLoaded', async () => {
    const taskManager = new TaskManager();
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');

    // Referencias del Modal de Edición
    const editTaskModalEl = document.getElementById('editTaskModal');
    let editTaskModal = null;
    if (editTaskModalEl && typeof bootstrap !== 'undefined') {
        editTaskModal = new bootstrap.Modal(editTaskModalEl);
    }
    const editTaskForm = document.getElementById('editTaskForm');

    // Función auxiliar para prevenir inyección de código (XSS)
    function escapeHTML(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Submit del formulario principal (Crear Tarea)
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const titulo = document.getElementById('titulo').value.trim();
            const descripcion = document.getElementById('descripcion').value.trim();
            const fecha = document.getElementById('fecha').value;
            const prioridad = document.getElementById('prioridad').value;

            if (!titulo || !fecha || !prioridad) {
                return;
            }

            await taskManager.addTask(titulo, descripcion, fecha, prioridad);
            taskForm.reset();
            renderTasks();
        });
    }

    // Renderizar la lista de tareas en el DOM
    function renderTasks() {
        if (!taskList) return;
        taskList.innerHTML = '';

        if (!taskManager.tasks || taskManager.tasks.length === 0) {
            taskList.innerHTML = `
                <div class="text-center py-5">
                    <span class="material-symbols-outlined text-secondary fs-1">inbox</span>
                    <p class="text-muted small mt-2">No tienes tareas registradas.</p>
                </div>
            `;
            if (typeof updateCounters === 'function') updateCounters();
            return;
        }

        taskManager.tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = `card border-0 shadow-sm rounded-4 p-3 mb-2 ${task.completed ? 'bg-light' : ''}`;
            taskCard.setAttribute('data-task-id', task.id);
            
            taskCard.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="${task.completed ? 'text-decoration-line-through text-muted' : 'fw-semibold'}">${escapeHTML(task.titulo)}</h5>
                        <p class="text-secondary small mb-2">${escapeHTML(task.descripcion)}</p>
                        <div class="d-flex gap-2 align-items-center">
                            <span class="badge bg-secondary">${escapeHTML(task.fecha)}</span>
                            <span class="badge ${getPriorityBadge(task.prioridad)}">${escapeHTML(task.prioridad)}</span>
                        </div>
                    </div>
                    <div class="d-flex gap-2 align-items-center">
                        <!-- Botón Marcar Estado -->
                        <button class="btn btn-sm btn-outline-success toggle-btn rounded-circle p-2 d-flex align-items-center justify-content-center" data-id="${task.id}" title="${task.completed ? 'Reabrir' : 'Completar'}">
                            <span class="material-symbols-outlined align-middle fs-6">
                                ${task.completed ? 'undo' : 'check'}
                            </span>
                        </button>

                        <!-- Botón Editar (Lápiz) -->
                        <button class="btn btn-sm btn-outline-primary edit-btn rounded-circle p-2 d-flex align-items-center justify-content-center" data-id="${task.id}" title="Editar tarea">
                            <span class="material-symbols-outlined fs-6 align-middle">edit</span>
                        </button>

                        <!-- Botón Eliminar -->
                        <button class="delete-button btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 rounded-pill px-3" data-id="${task.id}">
                            <span class="material-symbols-outlined fs-6">delete</span>
                            <span>Eliminar</span>
                        </button>
                    </div>
                </div>
            `;
            taskList.appendChild(taskCard);
        });

        if (typeof updateCounters === 'function') {
            updateCounters();
        }
    }

    function getPriorityBadge(priority) {
        switch(priority) {
            case 'Alta': return 'bg-danger';
            case 'Media': return 'bg-warning text-dark';
            case 'Baja': return 'bg-info text-dark';
            default: return 'bg-secondary';
        }
    }

    // Delegación de eventos en la lista de tareas
    if (taskList) {
        taskList.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const parentTask = target.closest('[data-task-id]') || target.parentElement;
            const taskId = Number(target.dataset.id || parentTask.dataset.taskId);

            // Alternar estado
            if (target.classList.contains('toggle-btn')) {
                await taskManager.toggleTaskStatus(taskId);
                renderTasks();
            }

            // Abrir Modal de Edición
            if (target.classList.contains('edit-btn')) {
                openEditModal(taskId);
            }

            // Eliminar tarea
            if (target.classList.contains('delete-button') || target.classList.contains('delete-btn')) {
                await taskManager.deleteTask(taskId);
                renderTasks();
            }
        });
    }

    // Función para prellenar y abrir el Modal de Edición
    function openEditModal(id) {
        const task = taskManager.tasks.find(t => t.id === id);
        if (!task) return;

        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskName').value = task.titulo;
        document.getElementById('editTaskDescription').value = task.descripcion || '';
        document.getElementById('editTaskDueDate').value = task.fecha;
        document.getElementById('editTaskPriority').value = task.prioridad || 'Media';

        if (editTaskModal) {
            editTaskModal.show();
        }
    }

    // Submit del Formulario del Modal de Edición
    if (editTaskForm) {
        editTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = Number(document.getElementById('editTaskId').value);
            const titulo = document.getElementById('editTaskName').value.trim();
            const descripcion = document.getElementById('editTaskDescription').value.trim();
            const fecha = document.getElementById('editTaskDueDate').value;
            const prioridad = document.getElementById('editTaskPriority').value;

            if (!titulo || !fecha || !prioridad) return;

            // Invocar actualización en el TaskManager / API
            await taskManager.updateTask(id, { titulo, descripcion, fecha, prioridad });

            renderTasks();
            if (editTaskModal) editTaskModal.hide();
        });
    }

    // 1. Mostrar primero datos en caché (localStorage) de manera inmediata
    renderTasks();

    // 2. Cargar datos actualizados desde la API en Render
    await taskManager.fetchTasksFromApi();
    renderTasks();
});