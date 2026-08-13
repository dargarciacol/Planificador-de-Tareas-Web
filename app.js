// =====================================================
// PLANIFICADOR DE TAREAS
// =====================================================


// =====================================================
// OBTENER ELEMENTOS DEL DOM
// =====================================================

const taskForm = document.getElementById("taskForm");

const tituloInput = document.getElementById("titulo");
const descripcionInput = document.getElementById("descripcion");
const fechaInput = document.getElementById("fecha");
const prioridadInput = document.getElementById("prioridad");


// Contenedor donde aparecerán las tareas
const taskList = document.getElementById("taskList");


// =====================================================
// VALIDACIÓN DEL FORMULARIO
// =====================================================

function validFormFieldInput(data) {

    let isValid = true;


    // -------------------------
    // Validar título
    // -------------------------

    const tituloError = document.getElementById("tareaError");

    if (!data.titulo || data.titulo.trim() === "") {

        tituloInput.classList.add("is-invalid");
        tituloInput.classList.remove("is-valid");

        tituloError.textContent = "La tarea es obligatoria.";

        isValid = false;

    } else {

        tituloInput.classList.remove("is-invalid");
        tituloInput.classList.add("is-valid");

    }


    // -------------------------
    // Validar descripción
    // -------------------------

    const descripcionError =
        document.getElementById("descripcionError");

    if (!data.descripcion || data.descripcion.trim() === "") {

        descripcionInput.classList.add("is-invalid");
        descripcionInput.classList.remove("is-valid");

        descripcionError.textContent =
            "La descripción es obligatoria.";

        isValid = false;

    } else {

        descripcionInput.classList.remove("is-invalid");
        descripcionInput.classList.add("is-valid");

    }


    // -------------------------
    // Validar fecha
    // -------------------------

    const fechaError =
        document.getElementById("fechaError");

    if (!data.fecha || data.fecha.trim() === "") {

        fechaInput.classList.add("is-invalid");
        fechaInput.classList.remove("is-valid");

        fechaError.textContent =
            "La fecha es obligatoria.";

        isValid = false;

    } 
    else {

        fechaInput.classList.remove("is-invalid");
        fechaInput.classList.add("is-valid");

    }


    // -------------------------
    // Validar prioridad
    // -------------------------

    const prioridadError =
        document.getElementById("prioridadError");

    if (!data.prioridad || data.prioridad.trim() === "") {

        prioridadInput.classList.add("is-invalid");
        prioridadInput.classList.remove("is-valid");

        prioridadError.textContent =
            "Debes seleccionar una prioridad.";

        isValid = false;

    } 
    
    else {

        prioridadInput.classList.remove("is-invalid");
        prioridadInput.classList.add("is-valid");

    }


    return isValid;
}


// =====================================================
// CREAR TARJETA DE TAREA
// =====================================================

function crearTarjetaTarea(tarea) {

    const tarjeta = document.createElement("div");

    tarjeta.className = "card border rounded-4";


    // Color de la prioridad

    let prioridadClase = "";

    if (tarea.prioridad === "Alta") {

        prioridadClase = "bg-warning text-dark";

    } else if (tarea.prioridad === "Media") {

        prioridadClase = "bg-primary";

    } else {

        prioridadClase = "bg-success";

    }


    // Formatear fecha

    const fechaFormateada =
        formatearFecha(tarea.fecha);


    tarjeta.innerHTML = `

        <div class="card-body">

            <div class="d-flex justify-content-between">

                <div>

                    <h5 class="mb-1">
                        ${tarea.titulo}
                    </h5>

                    <p class="text-secondary mb-2">
                        ${tarea.descripcion}
                    </p>

                </div>


                <span class="badge ${prioridadClase} align-self-start">

                    ${tarea.prioridad}

                </span>

            </div>


            <div class="d-flex justify-content-between align-items-center mt-3">


                <small class="text-secondary d-flex align-items-center gap-1">

                    <span class="material-symbols-outlined fs-6">
                        calendar_month
                    </span>

                    ${fechaFormateada}

                </small>


                <div class="d-flex gap-2">


                    <button
                        type="button"
                        class="btn btn-outline-primary btn-sm btn-completar"
                        title="Completar tarea">

                        <span class="material-symbols-outlined">
                            task_alt
                        </span>

                    </button>


                    <button
                        type="button"
                        class="btn btn-outline-danger btn-sm btn-eliminar"
                        title="Eliminar tarea">

                        <span class="material-symbols-outlined">
                            delete
                        </span>

                    </button>


                </div>


            </div>

        </div>

    `;


    
    // BOTÓN ELIMINAR
 

    const botonEliminar =
        tarjeta.querySelector(".btn-eliminar");


    botonEliminar.addEventListener("click", function () {

        tarjeta.remove();

        actualizarResumen();

        guardarTareas();

    });


   
    // BOTÓN COMPLETAR
   
    const botonCompletar =
        tarjeta.querySelector(".btn-completar");


    botonCompletar.addEventListener("click", function () {

        tarjeta.classList.toggle("opacity-75");

        botonCompletar.classList.toggle("btn-success");
        botonCompletar.classList.toggle("btn-outline-primary");

        actualizarResumen();

    });


    return tarjeta;
}



// FORMATEAR FECHA


function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }

    const partes = fecha.split("-");

    if (partes.length !== 3) {
        return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}



// AGREGAR TAREA

function agregarTarea(tarea) {

    if (!taskList) {

        console.error(
            "No se encontró el elemento #taskList"
        );

        return;
    }


    const tarjeta =
        crearTarjetaTarea(tarea);


    // La nueva tarea aparece al principio

    taskList.prepend(tarjeta);


    // Ocultar mensaje de estado vacío

    const emptyState =
        document.getElementById("emptyState");

    if (emptyState) {

        emptyState.style.display = "none";

    }


    actualizarResumen();

    guardarTareas();
}



// EVENTO SUBMIT DEL FORMULARIO

if (taskForm) {

    taskForm.addEventListener("submit", function (event) {

        event.preventDefault();


        // Obtener datos

        const data = {

            titulo: tituloInput.value.trim(),

            descripcion:
                descripcionInput.value.trim(),

            fecha: fechaInput.value,

            prioridad: prioridadInput.value

        };


        // Validar

        const isValid =
            validFormFieldInput(data);


        if (!isValid) {

            console.log("Formulario inválido");

            return;

        }


        console.log("Formulario válido");


        // Crear tarea

        agregarTarea(data);


        // Limpiar formulario

        taskForm.reset();


        // Quitar estados de validación

        tituloInput.classList.remove("is-valid");

        descripcionInput.classList.remove("is-valid");

        fechaInput.classList.remove("is-valid");

        prioridadInput.classList.remove("is-valid");

    });

}



// LOCAL STORAGE


function guardarTareas() {

    if (!taskList) {
        return;
    }


    const tarjetas =
        taskList.querySelectorAll(".card");


    const tareas = [];


    tarjetas.forEach(function (tarjeta) {

        const titulo =
            tarjeta.querySelector("h5");

        const descripcion =
            tarjeta.querySelector("p");

        const prioridad =
            tarjeta.querySelector(".badge");


        const fecha =
            tarjeta.querySelector(
                "small"
            );


        if (titulo && descripcion && prioridad && fecha) {

            tareas.push({

                titulo:
                    titulo.textContent.trim(),

                descripcion:
                    descripcion.textContent.trim(),

                prioridad:
                    prioridad.textContent.trim(),

                fecha:
                    fecha.textContent.trim()

            });

        }

    });


    localStorage.setItem(
        "tareas",
        JSON.stringify(tareas)
    );

}


// ACTUALIZAR RESUMEN


function actualizarResumen() {

    if (!taskList) {
        return;
    }


    const tareas =
        taskList.querySelectorAll(".card");


    const pendientes =
        document.querySelectorAll(
            ".btn-completar"
        ).length;


    const completadas =
        taskList.querySelectorAll(
            ".opacity-75"
        ).length;


    const totalPendientes =
        Math.max(
            tareas.length - completadas,
            0
        );


    const resumen =
        document.querySelectorAll(
            ".mt-5 .row.g-3 h3"
        );


    if (resumen.length >= 3) {

        resumen[0].textContent =
            totalPendientes;

        resumen[1].textContent =
            completadas;

        resumen[2].textContent =
            calcularTareasHoy();

    }

}



// CALCULAR TAREAS PARA HOY


function calcularTareasHoy() {

    if (!taskList) {
        return 0;
    }


    const hoy =
        new Date().toISOString().split("T")[0];


    let cantidad = 0;


    const tarjetas =
        taskList.querySelectorAll(".card");


    tarjetas.forEach(function (tarjeta) {

        const fecha =
            tarjeta.querySelector("small");


        if (fecha) {

            const texto =
                fecha.textContent.trim();


            const partes =
                texto.split("/");


            if (partes.length === 3) {

                const fechaTarea =
                    `${partes[2]}-${partes[1]}-${partes[0]}`;


                if (fechaTarea === hoy) {

                    cantidad++;

                }

            }

        }

    });


    return cantidad;
}



// CARGAR TAREAS 

function cargarTareas() {

    if (!taskList) {
        return;
    }


    const tareasGuardadas =
        localStorage.getItem("tareas");


    if (!tareasGuardadas) {

        actualizarResumen();

        return;

    }


    try {

        const tareas =
            JSON.parse(tareasGuardadas);


        tareas.forEach(function (tarea) {

            const tarjeta =
                crearTarjetaTarea(tarea);


            taskList.prepend(tarjeta);

        });


        actualizarResumen();


    } catch (error) {

        console.error(
            "Error al cargar las tareas:",
            error
        );

    }

}


// INICIAR APLICACIÓN


document.addEventListener(
    "DOMContentLoaded",
    function () {

        cargarTareas();

        actualizarResumen();

    }
);