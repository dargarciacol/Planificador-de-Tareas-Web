function validFormFieldInput(data) {

    let isValid = true;

    // Validar título
    const titulo = document.getElementById("titulo");
    const tituloError = document.getElementById("tareaError");

    if (!data.titulo || data.titulo.trim() === "") {

        titulo.classList.add("is-invalid");
        titulo.classList.remove("is-valid");

        tituloError.textContent = "La tarea es obligatoria.";

        isValid = false;

    } else {

        titulo.classList.remove("is-invalid");
        titulo.classList.add("is-valid");

    }


    // Validar descripción
    const descripcion = document.getElementById("descripcion");
    const descripcionError = document.getElementById("descripcionError");

    if (!data.descripcion || data.descripcion.trim() === "") {

        descripcion.classList.add("is-invalid");
        descripcion.classList.remove("is-valid");

        descripcionError.textContent = "La descripción es obligatoria.";

        isValid = false;

    } else {

        descripcion.classList.remove("is-invalid");
        descripcion.classList.add("is-valid");

    }


    // Validar fecha
    const fecha = document.getElementById("fecha");
    const fechaError = document.getElementById("fechaError");

    if (!data.fecha || data.fecha.trim() === "") {

        fecha.classList.add("is-invalid");
        fecha.classList.remove("is-valid");

        fechaError.textContent = "La fecha es obligatoria.";

        isValid = false;

    } else {

        fecha.classList.remove("is-invalid");
        fecha.classList.add("is-valid");

    }


    // Validar prioridad
    const prioridad = document.getElementById("prioridad");
    const prioridadError = document.getElementById("prioridadError");

    if (!data.prioridad || data.prioridad.trim() === "") {

        prioridad.classList.add("is-invalid");
        prioridad.classList.remove("is-valid");

        prioridadError.textContent = "Debes seleccionar una prioridad.";

        isValid = false;

    } else {

        prioridad.classList.remove("is-invalid");
        prioridad.classList.add("is-valid");

    }


    return isValid;
}


// Obtener formulario
const taskForm = document.getElementById("taskForm");


// Escuchar el envío del formulario
taskForm.addEventListener("submit", function (event) {

    event.preventDefault();


    // Obtener datos
    const data = {

        titulo: document.getElementById("titulo").value,

        descripcion: document.getElementById("descripcion").value,

        fecha: document.getElementById("fecha").value,

        prioridad: document.getElementById("prioridad").value

    };


    // Ejecutar validación
    const isValid = validFormFieldInput(data);


    if (isValid) {

        console.log("Formulario válido");

    } else {

        console.log("Formulario inválido");

    }

});