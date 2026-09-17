/* ==========================================================================
   pages/hoy/hoy.js - Gestión de Tareas de Hoy (Render API en Línea)
   ========================================================================== */

const API_URL = 'https://backend-planificador-de-tareas.onrender.com/api/tasks';

// Elementos del DOM
const todayTaskList = document.getElementById('todayTaskList');
const todayCountBadge = document.getElementById('todayCount');
const currentDateText = document.getElementById('currentDateText');
const searchInput = document.getElementById('searchInput');

const filterAllBtn = document.getElementById('filterAll');
const filterPendingBtn = document.getElementById('filterPending');
const filterCompletedBtn = document.getElementById('filterCompleted');

// Elementos del Modal de Edición
const editTaskModalEl = document.getElementById('editTaskModal');
let editTaskModal = null;
const editTaskForm = document.getElementById('editTaskForm');

// Función auxiliar para obtener las cabeceras con el Token JWT
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

let todayTasks = [];
let currentStatusFilter = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mostrar el nombre real del usuario guardado en el login
    const userNameElement = document.getElementById("user-name") || document.querySelector('.navbar .fw-medium');
    const storedName = localStorage.getItem('user_name');
    if (userNameElement) {
        userNameElement.textContent = storedName ? storedName : "Usuario";
    }

    // 2. Configuración unificada y segura del botón de Cerrar Sesión (Evita Error 500)
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Limpieza total del almacenamiento local del navegador
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_id');
            localStorage.removeItem('tasks');

            // Redirección inteligente al login según la ubicación de la página actual
            const isInSubfolder = window.location.pathname.includes('/pages/');
            window.location.href = isInSubfolder ? '../../login.html' : 'login.html';
        });
    }

    // 3. Inicialización original de la vista de hoy
    if (editTaskModalEl && typeof bootstrap !== 'undefined') {
        editTaskModal = new bootstrap.Modal(editTaskModalEl);
    }
    setCurrentDateHeader();
    initEvents();
    fetchTodayTasks();
});

// Helper: Fecha actual en formato YYYY-MM-DD
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Renderiza fecha legible en el header
function setCurrentDateHeader() {
    if (!currentDateText) return;
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateFormatted = today.toLocaleDateString('es-ES', options);
    currentDateText.textContent = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
}

// Configuración de Filtros y Formulario
function initEvents() {
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    if (filterAllBtn) filterAllBtn.addEventListener('click', () => setFilter(filterAllBtn, 'ALL'));
    if (filterPendingBtn) filterPendingBtn.addEventListener('click', () => setFilter(filterPendingBtn, 'PENDING'));
    if (filterCompletedBtn) filterCompletedBtn.addEventListener('click', () => setFilter(filterCompletedBtn, 'COMPLETED'));

    if (editTaskForm) {
        editTaskForm.addEventListener('submit', handleEditFormSubmit);
    }
}

function setFilter(btn, filterType) {
    [filterAllBtn, filterPendingBtn, filterCompletedBtn].forEach(b => {
        if (b) { b.classList.remove('btn-primary'); b.classList.add('btn-outline-secondary'); }
    });
    btn.classList.remove('btn-outline-secondary');
    btn.classList.add('btn-primary');
    currentStatusFilter = filterType;
    applyFilters();
}

// Consultar API / Backend directamente
async function fetchTodayTasks() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('API inaccesible');

        const data = await response.json();
        const todayStr = getTodayString();
        
        // Filtrar exclusivamente las tareas cuya fecha coincida con el día de hoy
        todayTasks = data
            .map(t => ({
                id: t.id,
                name: t.name,
                description: t.description || '',
                dueDate: t.dueDate || '',
                status: t.status,
                priority: t.priority || 'Baja'
            }))
            .filter(task => task.dueDate === todayStr);

    } catch (error) {
        console.error('Error al conectar con la API de Render (Hoy):', error);
        todayTasks = [];
    }

    updateCounter();
    applyFilters();
}

function updateCounter() {
    if (todayCountBadge) {
        const pendingCount = todayTasks.filter(t => t.status !== 'DONE' && t.status !== 'COMPLETED').length;
        todayCountBadge.textContent = pendingCount;
    }
}

function applyFilters() {
    let result = [...todayTasks];

    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.toLowerCase().trim();
        result = result.filter(task =>
            task.name.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
        );
    }

    if (currentStatusFilter === 'PENDING') {
        result = result.filter(t => t.status !== 'DONE' && t.status !== 'COMPLETED');
    } else if (currentStatusFilter === 'COMPLETED') {
        result = result.filter(t => t.status === 'DONE' || t.status === 'COMPLETED');
    }

    renderTasks(result);
}

// Renderizado con Botón de Editar y Estado en Línea
function renderTasks(tasks) {
    if (!todayTaskList) return;

    if (tasks.length === 0) {
        todayTaskList.innerHTML = `
            <div class="text-center py-5">
                <span class="material-symbols-outlined text-secondary" style="font-size: 58px;">event_available</span>
                <h5 class="fw-semibold mt-3 text-dark">No hay tareas programadas para hoy</h5>
                <p class="text-muted small">Crea o programa tareas con la fecha de hoy desde el inicio.</p>
            </div>
        `;
        return;
    }

    todayTaskList.innerHTML = tasks.map(task => {
        const isDone = task.status === 'DONE' || task.status === 'COMPLETED';
        return `
            <div class="card today-task-card shadow-sm border-0 mb-2 ${isDone ? 'is-completed' : ''}">
                <div class="card-body p-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                    
                    <div class="d-flex align-items-center gap-3 flex-grow-1">
                        <button onclick="toggleTaskStatus(${task.id})" class="task-check-btn ${isDone ? 'checked' : ''}" title="${isDone ? 'Marcar pendiente' : 'Marcar completada'}">
                            <span class="material-symbols-outlined">${isDone ? 'check_circle' : 'radio_button_unchecked'}</span>
                        </button>
                        <div>
                            <h6 class="m-0 task-title fw-semibold text-dark">${escapeHTML(task.name)}</h6>
                            <p class="text-muted small mb-0 mt-1">${escapeHTML(task.description || 'Sin descripción')}</p>
                        </div>
                    </div>

                    <div class="d-flex align-items-center gap-2">
                        <span class="badge ${getPriorityBadgeClass(task.priority)} px-3 py-1 me-2">
                            ${task.priority || 'Baja'}
                        </span>

                        <button onclick="openEditModal(${task.id})" class="btn btn-outline-primary btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" title="Editar tarea">
                            <span class="material-symbols-outlined fs-6">edit</span>
                        </button>

                        <button onclick="deleteTask(${task.id})" class="btn btn-outline-danger btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" title="Eliminar tarea">
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

// Abrir Modal y Prellenar Datos
window.openEditModal = function(id) {
    const task = todayTasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskName').value = task.name;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskDueDate').value = task.dueDate;
    document.getElementById('editTaskPriority').value = task.priority || 'Media';

    if (editTaskModal) editTaskModal.show();
};

// Enviar Petición PUT al Servidor
async function handleEditFormSubmit(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editTaskId').value);
    const task = todayTasks.find(t => t.id === id);
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
            await fetchTodayTasks(); // Recargar datos sincronizados
        }
    } catch (err) {
        console.error('Error al actualizar la tarea:', err);
    }
}

// Cambiar estado Pendiente / Completada
window.toggleTaskStatus = async function(id) {
    const task = todayTasks.find(t => t.id === id);
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
            await fetchTodayTasks();
        }
    } catch (err) {
        console.error('Error al alternar estado:', err);
    }
};

// Eliminar Tarea
window.deleteTask = async function(id) {
    if (!confirm('¿Deseas eliminar esta tarea?')) return;
    
    try { 
        const response = await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        }); 

        if (response.ok || response.status === 204) {
            await fetchTodayTasks();
        }
    } catch (err) {
        console.error('Error al eliminar tarea:', err);
    }
};