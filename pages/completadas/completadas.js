/* ==========================================================================
   pages/completadas/completadas.js
   Lógica dinámica para la gestión de Tareas Completadas (Render API)
   ========================================================================== */

// 1. Configuración de API y Elementos del DOM
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

// 2. Datos Mock de respaldo (10 tareas completadas)
const completedTasksMock = [
    {
        id: 1,
        name: "Diseñar maqueta del Dashboard",
        description: "Crear prototipo de alta fidelidad en Figma para el layout principal y sidebar",
        dueDate: "2026-09-01",
        status: "COMPLETED",
        priority: "Alta"
    },
    {
        id: 2,
        name: "Configurar entidad Task en Spring Boot",
        description: "Definir el modelo JPA con sus anotaciones @Entity, @Table y @Id",
        dueDate: "2026-09-02",
        status: "COMPLETED",
        priority: "Alta"
    },
    {
        id: 3,
        name: "Crear script de base de datos FitLife",
        description: "Construir tablas, llaves primarias y foráneas para el esquema PostgreSQL",
        dueDate: "2026-09-03",
        status: "COMPLETED",
        priority: "Media"
    },
    {
        id: 4,
        name: "Implementar TaskRepository JPA",
        description: "Extender JpaRepository para habilitar operaciones CRUD en la BD",
        dueDate: "2026-09-05",
        status: "COMPLETED",
        priority: "Alta"
    },
    {
        id: 5,
        name: "Desplegar Node.js backend en Render",
        description: "Configurar variables de entorno y conectar base de datos PostgreSQL",
        dueDate: "2026-09-07",
        status: "COMPLETED",
        priority: "Alta"
    },
    {
        id: 6,
        name: "Configurar Swagger OpenAPI UI",
        description: "Agregar dependencia Springdoc y clase SwaggerConfig para documentar la API",
        dueDate: "2026-09-10",
        status: "COMPLETED",
        priority: "Media"
    },
    {
        id: 7,
        name: "Estructurar DTOs de Request y Response",
        description: "Aislar la entidad del modelo creando TaskDTORequest y TaskDTOResponse",
        dueDate: "2026-09-12",
        status: "COMPLETED",
        priority: "Media"
    },
    {
        id: 8,
        name: "Maquetar vista de Tareas Completadas",
        description: "Crear el HTML modular con Bootstrap, Google Icons y estructura responsive",
        dueDate: "2026-09-14",
        status: "COMPLETED",
        priority: "Baja"
    },
    {
        id: 9,
        name: "Resolver conflictos de merge en Git",
        description: "Fusionar ramas del equipo y verificar integridad del repositorio",
        dueDate: "2026-09-15",
        status: "COMPLETED",
        priority: "Alta"
    },
    {
        id: 10,
        name: "Validar conexión JDBC a Supabase",
        description: "Probar cadena de conexión del pooler en application.properties",
        dueDate: "2026-09-16",
        status: "COMPLETED",
        priority: "Alta"
    }
];

// Variables de Estado Local
let completedTasks = [];
let currentPriorityFilter = 'ALL';

// 3. Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    fetchCompletedTasks();
});

// 4. Configuración de Escuchadores de Eventos
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

// 5. Consulta de Tareas (Backend con Fallback a Mock)
async function fetchCompletedTasks() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getHeaders()
        });
        
        if (!response.ok) throw new Error('API inaccesible');

        const data = await response.json();
        
        // Filtrar únicamente las tareas cuyo estado sea completado
        completedTasks = data.filter(task => 
            task.status === 'DONE' || task.status === 'COMPLETED'
        );

        // Si la base de datos aún no devuelve tareas completadas, cargar Mocks de prueba
        if (completedTasks.length === 0) {
            completedTasks = [...completedTasksMock];
        }

    } catch (error) {
        console.warn('Backend offline o falló la petición. Usando datos mock:', error);
        completedTasks = [...completedTasksMock];
    }

    updateCounter();
    applyFilters();
}

// 6. Actualización del Contador en el Encabezado
function updateCounter() {
    if (completedCountBadge) {
        completedCountBadge.textContent = completedTasks.length;
    }
}

// 7. Lógica de Filtrado (Búsqueda y Prioridad)
function applyFilters() {
    let result = [...completedTasks];

    // Búsqueda en título o descripción
    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.toLowerCase().trim();
        result = result.filter(task =>
            task.name.toLowerCase().includes(query) ||
            (task.description && task.description.toLowerCase().includes(query))
        );
    }

    // Filtro por Prioridad
    if (currentPriorityFilter !== 'ALL') {
        result = result.filter(task => task.priority === currentPriorityFilter);
    }

    renderTasks(result);
}

// 8. Renderizado Dinámico en el DOM
function renderTasks(tasks) {
    if (!completedTaskList) return;

    if (tasks.length === 0) {
        completedTaskList.innerHTML = `
            <div class="text-center py-5">
                <span class="material-symbols-outlined text-secondary" style="font-size: 58px;">check_circle_outline</span>
                <h5 class="fw-semibold mt-3 text-dark">No se encontraron tareas completadas</h5>
                <p class="text-muted small">No hay coincidencias para el filtro o la búsqueda actual.</p>
            </div>
        `;
        return;
    }

    completedTaskList.innerHTML = tasks.map(task => `
        <div class="card completed-task-card shadow-sm border-0 mb-2">
            <div class="card-body p-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
                
                <!-- Información de la Tarea -->
                <div class="d-flex align-items-center gap-3 flex-grow-1">
                    <span class="material-symbols-outlined text-success fs-3">task_alt</span>
                    <div>
                        <h6 class="m-0 completed-title">${escapeHTML(task.name)}</h6>
                        <p class="text-muted small mb-0 mt-1">${escapeHTML(task.description || 'Sin descripción')}</p>
                    </div>
                </div>

                <!-- Metadata y Acciones -->
                <div class="d-flex align-items-center gap-3 flex-wrap">
                    <!-- Fecha -->
                    <small class="text-muted d-flex align-items-center gap-1">
                        <span class="material-symbols-outlined fs-6">calendar_today</span>
                        ${task.dueDate || 'Sin fecha'}
                    </small>

                    <!-- Badge de Prioridad -->
                    <span class="badge ${getPriorityBadgeClass(task.priority)} px-3 py-1">
                        ${task.priority || 'Baja'}
                    </span>

                    <!-- Botón Reabrir -->
                    <button onclick="reopenTask(${task.id})" class="btn btn-outline-warning btn-sm btn-reopen d-flex align-items-center gap-1" title="Reabrir tarea">
                        <span class="material-symbols-outlined fs-6">undo</span>
                        <span>Reabrir</span>
                    </button>

                    <!-- Botón Eliminar -->
                    <button onclick="deleteTask(${task.id})" class="btn btn-outline-danger btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" title="Eliminar definitivamente">
                        <span class="material-symbols-outlined fs-6">delete</span>
                    </button>
                </div>

            </div>
        </div>
    `).join('');
}

// 9. Funciones Auxiliares de Diseño
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
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// 10. Funciones Globales de Acción (Accesibles desde el HTML)
window.reopenTask = async function(id) {
    const taskIndex = completedTasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const task = completedTasks[taskIndex];

    try {
        // Intenta actualizar en el backend cambiando estado a PENDING enviando JWT
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

        if (response.ok || response.status === 200) {
            completedTasks.splice(taskIndex, 1);
            updateCounter();
            applyFilters();
        } else {
            // Reabrir localmente si la API rechaza
            completedTasks.splice(taskIndex, 1);
            updateCounter();
            applyFilters();
        }
    } catch (err) {
        // Fallback local
        completedTasks.splice(taskIndex, 1);
        updateCounter();
        applyFilters();
    }
};

window.deleteTask = async function(id) {
    if (!confirm('¿Seguro que deseas eliminar esta tarea permanentemente?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });

        if (response.ok || response.status === 204 || response.status === 404) {
            completedTasks = completedTasks.filter(t => t.id !== id);
            updateCounter();
            applyFilters();
        }
    } catch (err) {
        // Fallback local
        completedTasks = completedTasks.filter(t => t.id !== id);
        updateCounter();
        applyFilters();
    }
};