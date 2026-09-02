class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    }

    save() {
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
        const newTasks = [];
        for (let task of this.tasks) {
            if (task.id !== taskId) {
                newTasks.push(task);
            }
        }
        this.tasks = newTasks;
    }
}