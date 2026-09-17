/* ==========================================================================
   pages/estadisticas/estadisticas.js
   Procesamiento de métricas y exportación a Excel (Render API + JWT)
   ========================================================================== */

const API_URL = 'https://backend-planificador-de-tareas.onrender.com/api/tasks';

// Mocks de Respaldo
const completedTasksMock = [
    { id: 1, name: "Diseñar maqueta del Dashboard", description: "Prototipo Figma", dueDate: "2026-09-01", status: "COMPLETED", priority: "Alta" },
    { id: 2, name: "Configurar entidad Task en Spring Boot", description: "Modelo JPA", dueDate: "2026-09-02", status: "COMPLETED", priority: "Alta" },
    { id: 3, name: "Crear script de base de datos FitLife", description: "Tablas PostgreSQL", dueDate: "2026-09-03", status: "COMPLETED", priority: "Media" },
    { id: 4, name: "Implementar TaskRepository JPA", description: "Operaciones CRUD", dueDate: "2026-09-05", status: "COMPLETED", priority: "Alta" },
    { id: 5, name: "Desplegar Node.js backend en Render", description: "Variables de entorno", dueDate: "2026-09-07", status: "COMPLETED", priority: "Alta" },
    { id: 6, name: "Configurar Swagger OpenAPI UI", description: "Documentación API", dueDate: "2026-09-10", status: "COMPLETED", priority: "Media" },
    { id: 7, name: "Estructurar DTOs de Request y Response", description: "Capa DTO", dueDate: "2026-09-12", status: "COMPLETED", priority: "Media" },
    { id: 8, name: "Maquetar vista de Tareas Completadas", description: "Layout HTML/CSS", dueDate: "2026-09-14", status: "COMPLETED", priority: "Baja" },
    { id: 9, name: "Resolver conflictos de merge en Git", description: "Merge branches", dueDate: "2026-09-15", status: "COMPLETED", priority: "Alta" },
    { id: 10, name: "Validar conexión JDBC a Supabase", description: "JDBC String", dueDate: "2026-09-16", status: "COMPLETED", priority: "Alta" }
];

let completedTasks = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchAndProcessData();
    document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
});

// Obtener cabeceras con autenticación JWT
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

async function fetchAndProcessData() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getHeaders()
        });
        
        if (!response.ok) throw new Error('API Offline');

        const data = await response.json();
        completedTasks = data.filter(t => t.status === 'DONE' || t.status === 'COMPLETED');

        if (completedTasks.length === 0) {
            completedTasks = [...completedTasksMock];
        }
    } catch (error) {
        console.warn('Usando datos de prueba en estadísticas:', error);
        completedTasks = [...completedTasksMock];
    }

    renderMetrics();
    renderTablePreview();
}

function renderMetrics() {
    const total = completedTasks.length;
    const alta = completedTasks.filter(t => t.priority === 'Alta').length;
    const media = completedTasks.filter(t => t.priority === 'Media').length;
    const baja = completedTasks.filter(t => t.priority === 'Baja').length;

    // Actualizar KPIs
    const kpiTotalEl = document.getElementById('kpiTotal');
    const kpiAltaEl = document.getElementById('kpiAlta');
    const kpiMediaEl = document.getElementById('kpiMedia');
    const kpiBajaEl = document.getElementById('kpiBaja');

    if (kpiTotalEl) kpiTotalEl.textContent = total;
    if (kpiAltaEl) kpiAltaEl.textContent = alta;
    if (kpiMediaEl) kpiMediaEl.textContent = media;
    if (kpiBajaEl) kpiBajaEl.textContent = baja;

    // Calcular Porcentajes
    const pctAltaVal = total > 0 ? Math.round((alta / total) * 100) : 0;
    const pctMediaVal = total > 0 ? Math.round((media / total) * 100) : 0;
    const pctBajaVal = total > 0 ? Math.round((baja / total) * 100) : 0;

    // Renderizar Texto Porcentaje
    const pctAltaEl = document.getElementById('pctAlta');
    const pctMediaEl = document.getElementById('pctMedia');
    const pctBajaEl = document.getElementById('pctBaja');

    if (pctAltaEl) pctAltaEl.textContent = `${pctAltaVal}%`;
    if (pctMediaEl) pctMediaEl.textContent = `${pctMediaVal}%`;
    if (pctBajaEl) pctBajaEl.textContent = `${pctBajaVal}%`;

    // Renderizar Ancho de Barras
    const barAltaEl = document.getElementById('barAlta');
    const barMediaEl = document.getElementById('barMedia');
    const barBajaEl = document.getElementById('barBaja');

    if (barAltaEl) barAltaEl.style.width = `${pctAltaVal}%`;
    if (barMediaEl) barMediaEl.style.width = `${pctMediaVal}%`;
    if (barBajaEl) barBajaEl.style.width = `${pctBajaVal}%`;
}

function renderTablePreview() {
    const tbody = document.getElementById('previewTableBody');
    if (!tbody) return;

    if (completedTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No hay tareas para mostrar</td></tr>`;
        return;
    }

    tbody.innerHTML = completedTasks.map(task => `
        <tr>
            <td><strong>#${task.id}</strong></td>
            <td>${task.name}</td>
            <td class="text-muted small">${task.description || 'N/A'}</td>
            <td>${task.dueDate || 'Sin fecha'}</td>
            <td>
                <span class="badge ${getBadgeClass(task.priority)}">${task.priority || 'Normal'}</span>
            </td>
            <td><span class="badge bg-success-subtle text-success">Completada</span></td>
        </tr>
    `).join('');
}

function getBadgeClass(priority) {
    switch (priority) {
        case 'Alta': return 'bg-danger-subtle text-danger border border-danger-subtle';
        case 'Media': return 'bg-warning-subtle text-warning border border-warning-subtle';
        case 'Baja': return 'bg-info-subtle text-info border border-info-subtle';
        default: return 'bg-light text-dark border';
    }
}

// Exportar a Excel (SheetJS)
function exportToExcel() {
    if (completedTasks.length === 0) {
        alert('No hay datos disponibles para exportar.');
        return;
    }

    // 1. Mapear los datos a un formato de columnas limpio para Excel
    const dataForExcel = completedTasks.map(t => ({
        ID: t.id,
        "Nombre de Tarea": t.name,
        "Descripción": t.description || 'Sin descripción',
        "Fecha Cumplimiento": t.dueDate || 'N/A',
        "Prioridad": t.priority || 'Baja',
        "Estado": "COMPLETADA"
    }));

    // 2. Crear Hoja de Trabajo (Worksheet)
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);

    // 3. Crear Libro de Trabajo (Workbook)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tareas Completadas");

    // 4. Descargar el archivo Excel .xlsx
    XLSX.writeFile(workbook, `Reporte_Estadisticas_Tareas_${new Date().toISOString().split('T')[0]}.xlsx`);
}