/* ==========================================================================
   js/login.js - Autenticación Real Completa (Registro y Login Blindados)
   ========================================================================== */

const API_AUTH_URL = 'https://backend-planificador-de-tareas.onrender.com/api/auth'; // Cambia a /api/users si tus endpoints son esos

document.addEventListener('DOMContentLoaded', () => {
    const authRow = document.getElementById('authRow');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authSubtitle = document.getElementById('authSubtitle');

    const loginImageContainer = document.getElementById('loginImageContainer');
    const registerImageContainer = document.getElementById('registerImageContainer');

    const btnGoToRegister = document.getElementById('btnGoToRegister');
    const btnGoToLogin = document.getElementById('btnGoToLogin');

    const btnGoogleAuth = document.getElementById('btnGoogleAuth');
    const btnMicrosoftAuth = document.getElementById('btnMicrosoftAuth');

    // 1. Transición a Crear Cuenta
    if (btnGoToRegister) {
        btnGoToRegister.addEventListener('click', () => {
            authRow.classList.add('show-register');
            loginForm.classList.add('d-none');
            registerForm.classList.remove('d-none');

            if (loginImageContainer) loginImageContainer.classList.add('d-none');
            if (registerImageContainer) registerImageContainer.classList.remove('d-none');

            if (authSubtitle) {
                authSubtitle.textContent = 'Crea tu cuenta para comenzar a organizarte';
            }
        });
    }

    // 2. Transición a Iniciar Sesión
    if (btnGoToLogin) {
        btnGoToLogin.addEventListener('click', () => {
            authRow.classList.remove('show-register');
            registerForm.classList.add('d-none');
            loginForm.classList.remove('d-none');

            if (registerImageContainer) registerImageContainer.classList.add('d-none');
            if (loginImageContainer) loginImageContainer.classList.remove('d-none');

            if (authSubtitle) {
                authSubtitle.textContent = 'Ingresa a tu cuenta para gestionar tus tareas';
            }
        });
    }

    // 3. Procesar Registro: SOLO CREA LA CUENTA Y DEVUELVE AL LOGIN
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim().toLowerCase();
            const password = document.getElementById('regPassword').value;

            if (!name || !email || !password) return;

            try {
                const response = await fetch(`${API_AUTH_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'No se pudo registrar el usuario');
                }

                alert('¡Cuenta creada con éxito! Ahora inicia sesión con tus datos.');
                
                // Limpiar formulario y forzar transición limpia a la vista de login
                registerForm.reset();
                if (btnGoToLogin) {
                    btnGoToLogin.click(); // Esto activa el botón para mostrar el login
                }

            } catch (error) {
                console.error('Error en registro:', error);
                alert('Error al registrarse: ' + error.message);
            }
        });
    }

    // 4. Procesar Login: SOLICITA EL JWT REAL Y ENTRA AL INICIO (Blindado para JSON o Texto Plano)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) return;

            try {
                const response = await fetch(`${API_AUTH_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) {
                    throw new Error('Correo o contraseña incorrectos');
                }

                // Leer la respuesta de forma segura (soporta JSON o Texto plano del backend)
                const responseText = await response.text();
                let token = '';
                let userName = email.split('@')[0];

                try {
                    const data = JSON.parse(responseText);
                    token = data.token || data.accessToken || data.jwt;
                    if (data.name) userName = data.name;
                    if (!token && typeof data === 'string') token = data;
                } catch (err) {
                    token = responseText.trim();
                }

                if (token) {
                    // GUARDAR EL TOKEN JWT REAL
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('user_profile_name', userName);
                    localStorage.setItem('user_profile_email', email);

                    console.log("✅ Token JWT obtenido y guardado con éxito.");

                    // Redirigir al sistema principal
                    window.location.href = '../../index.html';
                } else {
                    throw new Error('El servidor respondió pero no se pudo extraer el token.');
                }

            } catch (error) {
                console.error('Error en login:', error);
                alert('No se pudo iniciar sesión: ' + error.message);
            }
        });
    }

    // 5. Botones sociales (Aviso por defecto)
    if (btnGoogleAuth) {
        btnGoogleAuth.addEventListener('click', () => {
            alert('La autenticación con Google requiere configuración OAuth en el backend.');
        });
    }

    if (btnMicrosoftAuth) {
        btnMicrosoftAuth.addEventListener('click', () => {
            alert('La autenticación con Microsoft requiere configuración OAuth en el backend.');
        });
    }
});