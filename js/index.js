/* ==========================================================================
   js/index.js - Controlador Principal del Dashboard (Render API + JWT)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    const taskManager = new TaskManager();
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');

    // Referencias de Filtros
    const filterAllBtn = document.getElementById('filterAll');
    const filterPendingBtn = document.getElementById('filterPending');
    const filterCompletedBtn = document.getElementById('filterCompleted');
    const searchInput = document.getElementById('searchInput');

    let currentFilter = 'ALL';

    // Referencias del Modal de Edición
    const editTaskModalEl = document.getElementById('editTaskModal');
    let editTaskModal = null;
    if (editTaskModalEl && typeof bootstrap !== 'undefined') {
        editTaskModal = new bootstrap.Modal(editTaskModalEl);
    }
    const editTaskForm = document.getElementById('editTaskForm');

    // 1. Cargar nombre de usuario desde la sesión guardada
    loadUserProfile();

    // 2. Submit del formulario (Crear Tarea en Render)
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const titulo = document.getElementById('titulo').value.trim();
            const descripcion = document.getElementById('descripcion').value.trim();
            const fecha = document.getElementById('fecha').value;
            const prioridad = document.getElementById('prioridad').value;

            if (!titulo || !fecha || !prioridad) return;

            await taskManager.addTask(titulo, descripcion, fecha, prioridad);
            taskForm.reset();
            
            // Recargar datos desde la API para sincronizar el estado
            await taskManager.fetchTasksFromApi();
            renderDashboard();
        });
    }

    // 3. Configurar Eventos de Filtros y Búsqueda
    if (filterAllBtn) filterAllBtn.addEventListener('click', () => setFilter('ALL'));
    if (filterPendingBtn) filterPendingBtn.addEventListener('click', () => setFilter('PENDING'));
    if (filterCompletedBtn) filterCompletedBtn.addEventListener('click', () => setFilter('COMPLETED'));
    if (searchInput) searchInput.addEventListener('input', () => renderDashboard());

    function setFilter(type) {
        currentFilter = type;
        [filterAllBtn, filterPendingBtn, filterCompletedBtn].forEach(btn => {
            if (btn) {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline-secondary');
            }
        });

        if (type === 'ALL' && filterAllBtn) setBtnActive(filterAllBtn);
        if (type === 'PENDING' && filterPendingBtn) setBtnActive(filterPendingBtn);
        if (type === 'COMPLETED' && filterCompletedBtn) setBtnActive(filterCompletedBtn);

        renderDashboard();
    }

    function setBtnActive(btn) {
        btn.classList.remove('btn-outline-secondary');
        btn.classList.add('btn-primary');
    }

    // 4. Delegación de eventos en la lista de tareas
    if (taskList) {
        taskList.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const parentTask = target.closest('[data-task-id]') || target.parentElement;
            const taskId = Number(target.dataset.id || parentTask.dataset.taskId);

            if (target.classList.contains('toggle-btn')) {
                await taskManager.toggleTaskStatus(taskId);
                renderDashboard();
            }

            if (target.classList.contains('edit-btn')) {
                openEditModal(taskId);
            }

            if (target.classList.contains('delete-button') || target.classList.contains('delete-btn')) {
                await taskManager.deleteTask(taskId);
                renderDashboard();
            }
        });
    }

    // 5. Submit del Modal de Edición
    if (editTaskForm) {
        editTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = Number(document.getElementById('editTaskId').value);
            const titulo = document.getElementById('editTaskName').value.trim();
            const descripcion = document.getElementById('editTaskDescription').value.trim();
            const fecha = document.getElementById('editTaskDueDate').value;
            const prioridad = document.getElementById('editTaskPriority').value;

            if (!titulo || !fecha || !prioridad) return;

            await taskManager.updateTask(id, { titulo, descripcion, fecha, prioridad });

            renderDashboard();
            if (editTaskModal) editTaskModal.hide();
        });
    }

    // Modal helpers
    function openEditModal(id) {
        const task = taskManager.tasks.find(t => t.id === id);
        if (!task) return;

        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskName').value = task.titulo;
        document.getElementById('editTaskDescription').value = task.descripcion || '';
        document.getElementById('editTaskDueDate').value = task.fecha;
        document.getElementById('editTaskPriority').value = task.prioridad || 'Media';

        if (editTaskModal) editTaskModal.show();
    }

    // Renderizado y cálculo de contadores del Resumen
    function renderDashboard() {
        updateSummaryCards();
        renderTasks();
    }

    function updateSummaryCards() {
        const pendingEl = document.getElementById('countPending');
        const completedEl = document.getElementById('countCompleted');
        const todayEl = document.getElementById('countToday');

        const todayStr = new Date().toISOString().split('T')[0];

        const pendingCount = taskManager.tasks.filter(t => !t.completed).length;
        const completedCount = taskManager.tasks.filter(t => t.completed).length;
        const todayCount = taskManager.tasks.filter(t => t.fecha === todayStr).length;

        if (pendingEl) pendingEl.textContent = pendingCount;
        if (completedEl) completedEl.textContent = completedCount;
        if (todayEl) todayEl.textContent = todayCount;
    }

    function renderTasks() {
        if (!taskList) return;
        taskList.innerHTML = '';

        let filteredTasks = [...taskManager.tasks];

        // Filtro por Estado
        if (currentFilter === 'PENDING') {
            filteredTasks = filteredTasks.filter(t => !t.completed);
        } else if (currentFilter === 'COMPLETED') {
            filteredTasks = filteredTasks.filter(t => t.completed);
        }

        // Búsqueda por texto
        if (searchInput && searchInput.value.trim() !== '') {
            const query = searchInput.value.toLowerCase().trim();
            filteredTasks = filteredTasks.filter(t =>
                t.titulo.toLowerCase().includes(query) ||
                (t.descripcion && t.descripcion.toLowerCase().includes(query))
            );
        }

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="text-center py-5">
                    <span class="material-symbols-outlined text-secondary fs-1">inbox</span>
                    <p class="text-muted small mt-2">No tienes tareas para mostrar.</p>
                </div>
            `;
            return;
        }

        filteredTasks.forEach(task => {
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
                        <button class="btn btn-sm btn-outline-success toggle-btn rounded-circle p-2 d-flex align-items-center justify-content-center" data-id="${task.id}" title="${task.completed ? 'Reabrir' : 'Completar'}">
                            <span class="material-symbols-outlined align-middle fs-6">${task.completed ? 'undo' : 'check'}</span>
                        </button>
                        <button class="btn btn-sm btn-outline-primary edit-btn rounded-circle p-2 d-flex align-items-center justify-content-center" data-id="${task.id}" title="Editar tarea">
                            <span class="material-symbols-outlined fs-6 align-middle">edit</span>
                        </button>
                        <button class="delete-button btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 rounded-pill px-3" data-id="${task.id}">
                            <span class="material-symbols-outlined fs-6">delete</span>
                            <span>Eliminar</span>
                        </button>
                    </div>
                </div>
            `;
            taskList.appendChild(taskCard);
        });
    }

    function getPriorityBadge(priority) {
        switch(priority) {
            case 'Alta': return 'bg-danger';
            case 'Media': return 'bg-warning text-dark';
            case 'Baja': return 'bg-info text-dark';
            default: return 'bg-secondary';
        }
    }

    function escapeHTML(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function loadUserProfile() {
        const userName = localStorage.getItem('user_profile_name');
        if (userName) {
            const userLabel = document.querySelector('.navbar .fw-medium');
            if (userLabel) userLabel.textContent = userName;
        }
    }

    // 1. Mostrar vista inicial desde la caché local
    renderDashboard();

    // 2. Cargar en vivo la información guardada en Render
    await taskManager.fetchTasksFromApi();
    renderDashboard();
});