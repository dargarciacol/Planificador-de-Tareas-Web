class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    }

    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
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
        this.saveToLocalStorage();
        return newTask;
    }

    toggleTaskStatus(id) {
        this.tasks = this.tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this.saveToLocalStorage();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToLocalStorage();
    }
}