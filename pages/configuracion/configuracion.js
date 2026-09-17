/* ==========================================================================
   pages/configuracion/configuracion.js
   Lógica responsiva e integración REST API para preferencias y perfil
   ========================================================================== */

const API_USERS_URL = 'https://backend-planificador-de-tareas.onrender.com/api/users';

document.addEventListener('DOMContentLoaded', () => {
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

            // 1. Actualización en localStorage (Respuesta inmediata)
            localStorage.setItem('user_profile_name', userName);
            localStorage.setItem('user_profile_email', userEmail);
            
            const navbarUserName = document.querySelector('.navbar .fw-medium');
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
    const savedName = localStorage.getItem('user_profile_name');
    const savedEmail = localStorage.getItem('user_profile_email');
    const savedDarkMode = localStorage.getItem('user_pref_dark_mode') === 'true';
    const savedNotifications = localStorage.getItem('user_pref_notifications') !== 'false';

    if (savedName) {
        const nameInput = document.getElementById('configUserName');
        if (nameInput) nameInput.value = savedName;
        
        const navbarUserName = document.querySelector('.navbar .fw-medium');
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