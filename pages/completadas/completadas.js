/* ==========================================================================
   pages/completadas/completadas.js
   Lógica dinámica para la gestión de Tareas Completadas (Render API en Línea)
   ========================================================================== */

const API_URL = 'https://backend-planificador-de-tareas.onrender.com/api/tasks';

const completedTaskList = document.getElementById('completedTaskList');
const completedCountBadge = document.getElementById('completedCount');
const searchInput = document.getElementById('searchInput');

const filterAllBtn = document.getElementById('filterAll');
const filterHighBtn = document.getElementById('filterHigh');
const filterMediumBtn = document.getElementById('filterMedium');

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

// Variables de Estado Local
let completedTasks = [];
let currentPriorityFilter = 'ALL';

// Inicialización Unificada (Nombre de usuario, Logout seguro y Eventos)
document.addEventListener('DOMContentLoaded', () => {
    // 1. Mostrar el nombre real del usuario guardado en el login
    const userNameElement = document.getElementById("user-name");
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
            localStorage.removeItem('tasks');

            // Redirección inteligente al login según la ubicación de la página actual
            const isInSubfolder = window.location.pathname.includes('/pages/');
            window.location.href = isInSubfolder ? '../../login.html' : 'login.html';
        });
    }

    // 3. Inicialización original de la vista de completadas
    initEvents();
    fetchCompletedTasks();
});

// Configuración de Escuchadores de Eventos
function initEvents() {
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    if (filterAllBtn) {
        filterAllBtn.addEventListener('click', () => {
            setActiveFilterBtn(filterAllBtn);
            currentPriorityFilter = 'ALL';
            applyFilters();
        });
    }

    if (filterHighBtn) {
        filterHighBtn.addEventListener('click', () => {
            setActiveFilterBtn(filterHighBtn);
            currentPriorityFilter = 'Alta';
            applyFilters();
        });
    }

    if (filterMediumBtn) {
        filterMediumBtn.addEventListener('click', () => {
            setActiveFilterBtn(filterMediumBtn);
            currentPriorityFilter = 'Media';
            applyFilters();
        });
    }
}

// Consulta de Tareas directamente desde la API en línea
async function fetchCompletedTasks() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getHeaders()
        });
        
        if (!response.ok) throw new Error('API inaccesible');

        const data = await response.json();
        
        // Mapear y filtrar únicamente las tareas cuyo estado sea completado (DONE o COMPLETED)
        completedTasks = data
            .map(t => ({
                id: t.id,
                name: t.name,
                description: t.description || '',
                dueDate: t.dueDate || '',
                status: t.status,
                priority: t.priority || 'Baja'
            }))
            .filter(task => task.status === 'DONE' || task.status === 'COMPLETED');

    } catch (error) {
        console.error('Error al conectar con la API de Render:', error);
        completedTasks = [];
    }

    updateCounter();
    applyFilters();
}

// Actualización del Contador en el Encabezado
function updateCounter() {
    if (completedCountBadge) {
        completedCountBadge.textContent = completedTasks.length;
    }
}

// Lógica de Filtrado (Búsqueda y Prioridad)
function applyFilters() {
    let result = [...completedTasks];

    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.toLowerCase().trim();
        result = result.filter(task =>
            task.name.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
        );
    }

    if (currentPriorityFilter !== 'ALL') {
        result = result.filter(task => task.priority === currentPriorityFilter);
    }

    renderTasks(result);
}

// Renderizado Dinámico en el DOM
function renderTasks(tasks) {
    if (!completedTaskList) return;

    if (tasks.length === 0) {
        completedTaskList.innerHTML = `
            <div class="text-center py-5">
                <span class="material-symbols-outlined text-secondary" style="font-size: 58px;">check_circle_outline</span>
                <h5 class="fw-semibold mt-3 text-dark">No se encontraron tareas completadas</h5>
                <p class="text-muted small">Completa algunas tareas desde el inicio para verlas aquí.</p>
            </div>
        `;
        return;
    }

    completedTaskList.innerHTML = tasks.map(task => `
        <div class="card completed-task-card shadow-sm border-0 mb-2">
            <div class="card-body p-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                
                <div class="d-flex align-items-center gap-3 flex-grow-1">
                    <span class="material-symbols-outlined text-success fs-3">task_alt</span>
                    <div>
                        <h6 class="m-0 completed-title">${escapeHTML(task.name)}</h6>
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

                    <button onclick="reopenTask(${task.id})" class="btn btn-outline-warning btn-sm btn-reopen d-flex align-items-center gap-1" title="Reabrir tarea">
                        <span class="material-symbols-outlined fs-6">undo</span>
                        <span>Reabrir</span>
                    </button>

                    <button onclick="deleteTask(${task.id})" class="btn btn-outline-danger btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" title="Eliminar definitivamente">
                        <span class="material-symbols-outlined fs-6">delete</span>
                    </button>
                </div>

            </div>
        </div>
    `).join('');
}

function getPriorityBadgeClass(priority) {
    switch (priority) {
        case 'Alta': return 'badge-priority-alta';
        case 'Media': return 'badge-priority-media';
        case 'Baja': return 'badge-priority-baja';
        default: return 'badge-priority-baja';
    }
}

function setActiveFilterBtn(selectedBtn) {
    [filterAllBtn, filterHighBtn, filterMediumBtn].forEach(btn => {
        if (btn) {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-secondary');
        }
    });

    if (selectedBtn) {
        selectedBtn.classList.remove('btn-outline-secondary');
        selectedBtn.classList.add('btn-primary');
    }
}

function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Funciones Globales de Acción en Línea
window.reopenTask = async function(id) {
    const task = completedTasks.find(t => t.id === id);
    if (!task) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
                name: task.name,
                description: task.description,
                dueDate: task.dueDate,
                status: 'PENDING',
                priority: task.priority
            })
        });

        if (response.ok) {
            await fetchCompletedTasks(); // Recargar desde la API en línea
        }
    } catch (err) {
        console.error('Error al reabrir la tarea:', err);
    }
};

window.deleteTask = async function(id) {
    if (!confirm('¿Seguro que deseas eliminar esta tarea permanentemente?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok || response.status === 204) {
            await fetchCompletedTasks(); // Recargar desde la API en línea
        }
    } catch (err) {
        console.error('Error al eliminar la tarea:', err);
    }
};