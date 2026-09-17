/* ==========================================================================
   pages/configuracion/configuracion.js
   Lógica responsiva e integración REST API para preferencias y perfil
   ========================================================================== */

const API_USERS_URL = 'https://backend-planificador-de-tareas.onrender.com/api/users';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mostrar y sincronizar el nombre real del usuario de forma uniforme
    const userNameElement = document.getElementById("user-name") || document.querySelector('.navbar .fw-medium');
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
            localStorage.removeItem('user_id');
            localStorage.removeItem('tasks');

            // Redirección inteligente al login según la ubicación de la página actual
            const isInSubfolder = window.location.pathname.includes('/pages/');
            window.location.href = isInSubfolder ? '../../login.html' : 'login.html';
        });
    }

    // 3. Cargar configuraciones guardadas y eventos propios de la vista
    loadSavedSettings();
    initEvents();
});

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

function initEvents() {
    // Guardar Información de Perfil (Local y Backend)
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userName = document.getElementById('configUserName').value.trim();
            const userEmail = document.getElementById('configUserEmail').value.trim().toLowerCase();
            const userId = localStorage.getItem('user_id');

            if (!userName || !userEmail) {
                alert('Por favor, completa los campos requeridos.');
                return;
            }

            // 1. Actualización en localStorage usando 'user_name' para unificarlo con el resto de la app
            localStorage.setItem('user_name', userName);
            localStorage.setItem('user_profile_email', userEmail);
            
            const navbarUserName = document.querySelector('.navbar .fw-medium') || document.getElementById("user-name");
            if (navbarUserName) navbarUserName.textContent = userName;

            // 2. Persistencia en Backend mediante PUT /api/users/{id}
            if (userId) {
                try {
                    const response = await fetch(`${API_USERS_URL}/${userId}`, {
                        method: 'PUT',
                        headers: getHeaders(),
                        body: JSON.stringify({
                            name: userName,
                            email: userEmail
                        })
                    });

                    if (response.ok) {
                        alert('¡Perfil actualizado con éxito en el servidor!');
                    } else {
                        console.warn('No se pudo sincronizar el cambio en el servidor. Guardado localmente.');
                        alert('Información guardada localmente.');
                    }
                } catch (error) {
                    console.error('Error al conectar con la API:', error);
                    alert('Información guardada en modo local (sin conexión al servidor).');
                }
            } else {
                alert('¡Información guardada con éxito!');
            }
        });
    }

    // Activar / Desactivar Modo Oscuro
    const switchDarkMode = document.getElementById('switchDarkMode');
    const darkModeBtnNavbar = document.getElementById('darkModeBtn');

    if (switchDarkMode) {
        switchDarkMode.addEventListener('change', (e) => {
            toggleDarkMode(e.target.checked);
        });
    }

    if (darkModeBtnNavbar) {
        darkModeBtnNavbar.addEventListener('click', () => {
            const isCurrentlyDark = document.body.classList.contains('bg-dark');
            const newStatus = !isCurrentlyDark;
            if (switchDarkMode) switchDarkMode.checked = newStatus;
            toggleDarkMode(newStatus);
        });
    }

    // Notificaciones
    const switchNotifications = document.getElementById('switchNotifications');
    if (switchNotifications) {
        switchNotifications.addEventListener('change', (e) => {
            localStorage.setItem('user_pref_notifications', e.target.checked);
        });
    }
}

function loadSavedSettings() {
    // Soportamos tanto 'user_name' como el antiguo por compatibilidad
    const savedName = localStorage.getItem('user_name') || localStorage.getItem('user_profile_name');
    const savedEmail = localStorage.getItem('user_profile_email');
    const savedDarkMode = localStorage.getItem('user_pref_dark_mode') === 'true';
    const savedNotifications = localStorage.getItem('user_pref_notifications') !== 'false';

    if (savedName) {
        const nameInput = document.getElementById('configUserName');
        if (nameInput) nameInput.value = savedName;
        
        const navbarUserName = document.querySelector('.navbar .fw-medium') || document.getElementById("user-name");
        if (navbarUserName) navbarUserName.textContent = savedName;
    }

    if (savedEmail) {
        const emailInput = document.getElementById('configUserEmail');
        if (emailInput) emailInput.value = savedEmail;
    }

    const switchDarkMode = document.getElementById('switchDarkMode');
    if (switchDarkMode) switchDarkMode.checked = savedDarkMode;
    toggleDarkMode(savedDarkMode);

    const switchNotifications = document.getElementById('switchNotifications');
    if (switchNotifications) switchNotifications.checked = savedNotifications;
}

function toggleDarkMode(isDark) {
    localStorage.setItem('user_pref_dark_mode', isDark);
    if (isDark) {
        document.body.classList.add('bg-dark', 'text-white');
    } else {
        document.body.classList.remove('bg-dark', 'text-white');
    }
}