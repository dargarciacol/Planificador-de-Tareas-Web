/* ==========================================================================
   pages/todas/todas.js
   Lógica para listar, filtrar, editar y eliminar tareas (Render API en Línea)
   ========================================================================== */

const API_URL = 'https://backend-planificador-de-tareas.onrender.com/api/tasks';

// Elementos del DOM
const allTaskList = document.getElementById('allTaskList');
const totalTasksCountBadge = document.getElementById('totalTasksCount');
const searchInput = document.getElementById('searchInput');

const filterAllBtn = document.getElementById('filterAll');
const filterPendingBtn = document.getElementById('filterPending');
const filterCompletedBtn = document.getElementById('filterCompleted');
const prioritySelectFilter = document.getElementById('prioritySelectFilter');

// Modal de Edición
const editTaskModalEl = document.getElementById('editTaskModal');
let editTaskModal = null;
const editTaskForm = document.getElementById('editTaskForm');

let allTasks = [];
let currentStatusFilter = 'ALL';
let currentPriorityFilter = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
    if (editTaskModalEl && typeof bootstrap !== 'undefined') {
        editTaskModal = new bootstrap.Modal(editTaskModalEl);
    }
    initEvents();
    fetchAllTasks();
});

// Función auxiliar para obtener cabeceras con JWT
function getHeaders() {
    const token = localStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

function initEvents() {
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    if (filterAllBtn) filterAllBtn.addEventListener('click', () => setStatusFilter(filterAllBtn, 'ALL'));
    if (filterPendingBtn) filterPendingBtn.addEventListener('click', () => setStatusFilter(filterPendingBtn, 'PENDING'));
    if (filterCompletedBtn) filterCompletedBtn.addEventListener('click', () => setStatusFilter(filterCompletedBtn, 'COMPLETED'));

    if (prioritySelectFilter) {
        prioritySelectFilter.addEventListener('change', (e) => {
            currentPriorityFilter = e.target.value;
            applyFilters();
        });
    }

    if (editTaskForm) {
        editTaskForm.addEventListener('submit', handleEditFormSubmit);
    }
}

function setStatusFilter(btn, filterType) {
    [filterAllBtn, filterPendingBtn, filterCompletedBtn].forEach(b => {
        if (b) { b.classList.remove('btn-primary'); b.classList.add('btn-outline-secondary'); }
    });
    btn.classList.remove('btn-outline-secondary');
    btn.classList.add('btn-primary');
    currentStatusFilter = filterType;
    applyFilters();
}

// Consultar todas las tareas directamente desde el backend en línea
async function fetchAllTasks() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getHeaders()
        });
        
        if (!response.ok) throw new Error('API offline');

        const data = await response.json();
        
        allTasks = data.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description || '',
            dueDate: t.dueDate || '',
            status: t.status,
            priority: t.priority || 'Baja'
        }));

    } catch (error) {
        console.error('Error al conectar con la API (Todas las tareas):', error);
        allTasks = [];
    }

    updateCounter();
    applyFilters();
}

function updateCounter() {
    if (totalTasksCountBadge) {
        totalTasksCountBadge.textContent = allTasks.length;
    }
}

function applyFilters() {
    let result = [...allTasks];

    // Búsqueda por texto
    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.toLowerCase().trim();
        result = result.filter(task =>
            task.name.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
        );
    }

    // Filtro por Estado
    if (currentStatusFilter === 'PENDING') {
        result = result.filter(t => t.status !== 'DONE' && t.status !== 'COMPLETED');
    } else if (currentStatusFilter === 'COMPLETED') {
        result = result.filter(t => t.status === 'DONE' || t.status === 'COMPLETED');
    }

    // Filtro por Prioridad
    if (currentPriorityFilter !== 'ALL') {
        result = result.filter(t => t.priority === currentPriorityFilter);
    }

    renderTasks(result);
}

function renderTasks(tasks) {
    if (!allTaskList) return;

    if (tasks.length === 0) {
        allTaskList.innerHTML = `
            <div class="text-center py-5">
                <span class="material-symbols-outlined text-secondary" style="font-size: 58px;">inbox</span>
                <h5 class="fw-semibold mt-3 text-dark">No se encontraron tareas</h5>
                <p class="text-muted small">Crea algunas tareas desde el inicio o cambia los filtros de búsqueda.</p>
            </div>
        `;
        return;
    }

    allTaskList.innerHTML = tasks.map(task => {
        const isDone = task.status === 'DONE' || task.status === 'COMPLETED';
        return `
            <div class="card all-task-card shadow-sm border-0 mb-2 ${isDone ? 'is-completed' : ''}">
                <div class="card-body p-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                    
                    <div class="d-flex align-items-center gap-3 flex-grow-1">
                        <button onclick="toggleTaskStatus(${task.id})" class="task-check-btn ${isDone ? 'checked' : ''}" title="${isDone ? 'Marcar como pendiente' : 'Marcar como completada'}">
                            <span class="material-symbols-outlined">${isDone ? 'check_circle' : 'radio_button_unchecked'}</span>
                        </button>
                        <div>
                            <h6 class="m-0 task-title fw-semibold text-dark">${escapeHTML(task.name)}</h6>
                            <p class="text-muted small mb-0 mt-1">${escapeHTML(task.description || 'Sin descripción')}</p>
                        </div>
                    </div>

                    <div class="d-flex align-items-center gap-3 flex-wrap">
                        <small class="text-muted d-flex align-items-center gap-1">
                            <span class="material-symbols-outlined fs-6">calendar_today</span>
                            ${task.dueDate || 'Sin fecha'}
                        </small>

                        <span class="badge ${getPriorityBadgeClass(task.priority)} px-3 py-1">
                            ${task.priority || 'Baja'}
                        </span>

                        <span class="badge ${isDone ? 'badge-status-completed' : 'badge-status-pending'} rounded-pill px-3 py-1">
                            ${isDone ? 'Completada' : 'Pendiente'}
                        </span>

                        <button onclick="openEditModal(${task.id})" class="btn btn-outline-primary btn-sm rounded-circle" title="Editar tarea">
                            <span class="material-symbols-outlined fs-6">edit</span>
                        </button>

                        <button onclick="deleteTask(${task.id})" class="btn btn-outline-danger btn-sm rounded-circle" title="Eliminar tarea">
                            <span class="material-symbols-outlined fs-6">delete</span>
                        </button>
                    </div>

                </div>
            </div>
        `;
    }).join('');
}

function getPriorityBadgeClass(priority) {
    switch (priority) {
        case 'Alta': return 'badge-alta';
        case 'Media': return 'badge-media';
        case 'Baja': return 'badge-baja';
        default: return 'badge-baja';
    }
}

function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Abrir Modal y cargar datos actuales
window.openEditModal = function(id) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskName').value = task.name;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskDueDate').value = task.dueDate;
    document.getElementById('editTaskPriority').value = task.priority || 'Media';

    if (editTaskModal) editTaskModal.show();
};

// Guardar Cambios Editados via PUT
async function handleEditFormSubmit(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editTaskId').value);
    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    const updatedData = {
        name: document.getElementById('editTaskName').value.trim(),
        description: document.getElementById('editTaskDescription').value.trim(),
        dueDate: document.getElementById('editTaskDueDate').value,
        priority: document.getElementById('editTaskPriority').value,
        status: task.status
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            if (editTaskModal) editTaskModal.hide();
            await fetchAllTasks(); // Recargar datos sincronizados
        }
    } catch (err) {
        console.error('Error al actualizar la tarea:', err);
    }
}

// Alternar Estado
window.toggleTaskStatus = async function(id) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    const isCurrentlyDone = task.status === 'DONE' || task.status === 'COMPLETED';
    const newStatus = isCurrentlyDone ? 'PENDING' : 'DONE';

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                name: task.name,
                description: task.description,
                dueDate: task.dueDate,
                priority: task.priority,
                status: newStatus
            })
        });

        if (response.ok) {
            await fetchAllTasks();
        }
    } catch (err) {
        console.error('Error al alternar estado:', err);
    }
};

// Eliminar Tarea
window.deleteTask = async function(id) {
    if (!confirm('¿Deseas eliminar permanentemente esta tarea?')) return;
    
    try { 
        const response = await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        }); 

        if (response.ok || response.status === 204) {
            await fetchAllTasks();
        }
    } catch (err) {
        console.error('Error al eliminar tarea:', err);
    }
};