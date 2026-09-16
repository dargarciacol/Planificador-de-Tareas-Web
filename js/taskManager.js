class TaskManager {
    constructor() {
        this.tasks = this.load();
    }

    // 1. Carga segura con manejo de fallos
    load() {
        try {
            const storedTasks = localStorage.getItem('tasks');
            return storedTasks ? JSON.parse(storedTasks) : [];
        } catch (error) {
            console.error('Error al recuperar tareas de localStorage. Se reiniciará la lista:', error);
            // Si el JSON está corrupto, evitamos que la app se rompa
            return [];
        }
    }

    // 2. Guardado seguro con control de cuota y errores
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

    addTask(titulo, descripcion, fecha, prioridad) {
        const newTask = {
            id: Date.now(),
            titulo,
            descripcion,
            fecha,
            prioridad,
            completed: false
        };
        this.tasks.push(newTask);
        this.save();
        return newTask;
    }

    toggleTaskStatus(id) {
        this.tasks = this.tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this.save();
    }

    deleteTask(taskId) {
        // Simplificado con .filter()
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        
        // CORRECCIÓN: Guardar cambios tras eliminar
        this.save(); 
    }

    // Opcional: Cumplimiento de limpieza/derecho al olvido local
    clearAllTasks() {
        this.tasks = [];
        localStorage.removeItem('tasks');
    }
}