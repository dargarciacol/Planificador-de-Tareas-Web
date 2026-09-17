/* ==========================================================================
   pages/estadisticas/estadisticas.js
   Procesamiento de métricas y exportación a Excel (Render API + JWT en Línea)
   ========================================================================== */

const API_URL = 'https://backend-planificador-de-tareas.onrender.com/api/tasks';

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
        
        // Mapear y filtrar únicamente las tareas completadas desde la base de datos
        completedTasks = data
            .map(t => ({
                id: t.id,
                name: t.name,
                description: t.description || '',
                dueDate: t.dueDate || '',
                status: t.status,
                priority: t.priority || 'Baja'
            }))
            .filter(t => t.status === 'DONE' || t.status === 'COMPLETED');

    } catch (error) {
        console.error('Error al conectar con la API de estadísticas:', error);
        completedTasks = [];
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
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No hay tareas completadas para mostrar estadísticas</td></tr>`;
        return;
    }

    tbody.innerHTML = completedTasks.map(task => `
        <tr>
            <td><strong>#${task.id}</strong></td>
            <td>${escapeHTML(task.name)}</td>
            <td class="text-muted small">${escapeHTML(task.description || 'N/A')}</td>
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

function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Exportar a Excel (SheetJS)
function exportToExcel() {
    if (completedTasks.length === 0) {
        alert('No hay datos disponibles para exportar.');
        return;
    }

    const dataForExcel = completedTasks.map(t => ({
        ID: t.id,
        "Nombre de Tarea": t.name,
        "Descripción": t.description || 'Sin descripción',
        "Fecha Cumplimiento": t.dueDate || 'N/A',
        "Prioridad": t.priority || 'Baja',
        "Estado": "COMPLETADA"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tareas Completadas");

    XLSX.writeFile(workbook, `Reporte_Estadisticas_Tareas_${new Date().toISOString().split('T')[0]}.xlsx`);
}