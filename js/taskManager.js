/* ==========================================================================
   js/taskManager.js - Gestor de Tareas Sincronizado con Render y JWT Real
   ========================================================================== */

class TaskManager {
    constructor() {
        // URL desplegada en Render
        this.apiUrl = 'https://backend-planificador-de-tareas.onrender.com/api/tasks';
        this.tasks = this.load();
    }

    // Obtener cabeceras con autenticación JWT segura
    getHeaders() {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            console.warn("⚠️ [TaskManager] No se encontró 'auth_token' en localStorage. La petición al backend dará 403.");
        }

        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // 1. Carga segura con manejo de fallos desde localStorage
    load() {
        try {
            const storedTasks = localStorage.getItem('tasks');
            return storedTasks ? JSON.parse(storedTasks) : [];
        } catch (error) {
            console.error('Error al recuperar tareas de localStorage. Se reiniciará la lista:', error);
            return [];
        }
    }

    // 2. Guardado seguro en localStorage
    save() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('El almacenamiento local está lleno. No se pudo guardar la tarea.');
            } else {
                console.error('Error al guardar en localStorage:', error);
            }
        }
    }

    // 3. Obtener todas las tareas (Consumo API con diagnóstico de JWT)
    async fetchTasksFromApi() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: this.getHeaders()
            });
            
            if (response.status === 401 || response.status === 403) {
                throw new Error(`Acceso denegado (${response.status}). Token JWT inválido, expirado o ausente.`);
            }

            if (!response.ok) {
                throw new Error(`Error al conectar con la API: ${response.status}`);
            }
            
            const apiTasks = await response.json();
            
            // Mapear campos del Backend (name, dueDate, status) a la estructura del Frontend (titulo, fecha, completed)
            this.tasks = apiTasks.map(t => ({
                id: t.id,
                titulo: t.name,
                descripcion: t.description,
                fecha: t.dueDate,
                prioridad: t.priority,
                completed: t.status === 'DONE' || t.status === 'COMPLETED'
            }));

            this.save();
            return this.tasks;
        } catch (error) {
            console.error('❌ Error al sincronizar con la API:', error.message);
            return this.tasks; // Fallback a datos locales si falla
        }
    }

    // 4. Agregar nueva tarea
    async addTask(titulo, descripcion, fecha, prioridad) {
        const newTask = {
            id: Date.now(),
            titulo,
            descripcion,
            fecha,
            prioridad,
            completed: false
        };

        // Guardado Local Inmediato
        this.tasks.push(newTask);
        this.save();

        // Intento de Persistencia en Backend
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    name: titulo,
                    description: descripcion,
                    dueDate: fecha,
                    priority: prioridad,
                    status: 'PENDING'
                })
            });

            if (response.ok) {
                const createdTask = await response.json();
                // Actualizar el ID temporal por el ID asignado por PostgreSQL
                newTask.id = createdTask.id;
                this.save();
            } else {
                console.warn(`⚠️ Servidor rechazó el guardado (Estado: ${response.status})`);
            }
        } catch (error) {
            console.warn('Guardado en API falló. Se mantiene la copia local:', error);
        }

        return newTask;
    }

    // 5. Editar tarea existente (Soporte para el Modal de Edición)
    async updateTask(id, updatedData) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index === -1) return;

        // Actualizar copia local
        this.tasks[index] = {
            ...this.tasks[index],
            titulo: updatedData.titulo,
            descripcion: updatedData.descripcion,
            fecha: updatedData.fecha,
            prioridad: updatedData.prioridad
        };
        this.save();

        // Actualizar en el Backend vía PUT
        try {
            await fetch(`${this.apiUrl}/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    name: updatedData.titulo,
                    description: updatedData.descripcion,
                    dueDate: updatedData.fecha,
                    priority: updatedData.prioridad,
                    status: this.tasks[index].completed ? 'DONE' : 'PENDING'
                })
            });
        } catch (error) {
            console.warn('Actualización en API falló. Se mantiene el cambio local:', error);
        }
    }

    // 6. Cambiar estado Pendiente / Completada
    async toggleTaskStatus(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        this.save();

        try {
            await fetch(`${this.apiUrl}/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    name: task.titulo,
                    description: task.descripcion,
                    dueDate: task.fecha,
                    priority: task.prioridad,
                    status: task.completed ? 'DONE' : 'PENDING'
                })
            });
        } catch (error) {
            console.warn('Cambio de estado en API falló. Sincronización local retenida.');
        }
    }

    // 7. Eliminar tarea
    async deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.save();

        try {
            await fetch(`${this.apiUrl}/${taskId}`, { 
                method: 'DELETE',
                headers: this.getHeaders()
            });
        } catch (error) {
            console.warn('Eliminación en API falló. Eliminada localmente.');
        }
    }

    // 8. Limpiar todo
    clearAllTasks() {
        this.tasks = [];
        localStorage.removeItem('tasks');
    }
}