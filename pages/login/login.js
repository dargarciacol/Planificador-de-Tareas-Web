/* ==========================================================================
   js/login.js - Lógica de Autenticación, Transición y Persistencia
   ========================================================================== */

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

    // 1. Transición a Crear Cuenta (Formulario Derecha | Imagen Registro Izquierda)
    if (btnGoToRegister) {
        btnGoToRegister.addEventListener('click', () => {
            authRow.classList.add('show-register');
            loginForm.classList.add('d-none');
            registerForm.classList.remove('d-none');

            // Alternar contenedores de imagen
            if (loginImageContainer) loginImageContainer.classList.add('d-none');
            if (registerImageContainer) registerImageContainer.classList.remove('d-none');

            if (authSubtitle) {
                authSubtitle.textContent = 'Crea tu cuenta para comenzar a organizarte';
            }
        });
    }

    // 2. Transición a Iniciar Sesión (Formulario Izquierda | Imagen Login Derecha)
    if (btnGoToLogin) {
        btnGoToLogin.addEventListener('click', () => {
            authRow.classList.remove('show-register');
            registerForm.classList.add('d-none');
            loginForm.classList.remove('d-none');

            // Alternar contenedores de imagen
            if (registerImageContainer) registerImageContainer.classList.add('d-none');
            if (loginImageContainer) loginImageContainer.classList.remove('d-none');

            if (authSubtitle) {
                authSubtitle.textContent = 'Ingresa a tu cuenta para gestionar tus tareas';
            }
        });
    }

    // 3. Procesar Formulario de Registro (Guarda en array de usuarios)
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim().toLowerCase();
            const password = document.getElementById('regPassword').value;

            if (name && email && password) {
                // Obtener lista previa de usuarios o inicializar un arreglo vacío
                const users = JSON.parse(localStorage.getItem('registered_users')) || [];

                // Verificar si el correo ya existe
                const userExists = users.some(u => u.email === email);
                if (userExists) {
                    alert('El correo electrónico ya está registrado. Intenta iniciar sesión.');
                    return;
                }

                // Guardar nuevo usuario en la base de datos local
                const newUser = { name, email, password };
                users.push(newUser);
                localStorage.setItem('registered_users', JSON.stringify(users));

                // Establecer la sesión activa
                localStorage.setItem('auth_token', 'session_active_token_' + Date.now());
                localStorage.setItem('user_profile_name', name);
                localStorage.setItem('user_profile_email', email);

                // Redirigir a la raíz
                window.location.href = '../../index.html';
            }
        });
    }

    // 4. Procesar Formulario de Iniciar Sesión (Valida contra registered_users)
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('loginEmail').value.trim().toLowerCase();
            const passwordInput = document.getElementById('loginPassword').value;

            if (emailInput && passwordInput) {
                const users = JSON.parse(localStorage.getItem('registered_users')) || [];

                // Buscar usuario coincidente en email y contraseña
                const validUser = users.find(u => u.email === emailInput && u.password === passwordInput);

                if (validUser) {
                    localStorage.setItem('auth_token', 'session_active_token_' + Date.now());
                    localStorage.setItem('user_profile_name', validUser.name);
                    localStorage.setItem('user_profile_email', validUser.email);

                    window.location.href = '../../index.html';
                } else {
                    alert('Correo o contraseña incorrectos. Por favor, verifica tus credenciales.');
                }
            }
        });
    }

    // 5. Autenticación con Google y Microsoft
    if (btnGoogleAuth) {
        btnGoogleAuth.addEventListener('click', () => {
            localStorage.setItem('auth_token', 'google_oauth_token_' + Date.now());
            localStorage.setItem('user_profile_name', 'Usuario Google');
            localStorage.setItem('user_profile_email', 'google.user@gmail.com');
            window.location.href = '../../index.html';
        });
    }

    if (btnMicrosoftAuth) {
        btnMicrosoftAuth.addEventListener('click', () => {
            localStorage.setItem('auth_token', 'microsoft_oauth_token_' + Date.now());
            localStorage.setItem('user_profile_name', 'Usuario Microsoft');
            localStorage.setItem('user_profile_email', 'microsoft.user@outlook.com');
            window.location.href = '../../index.html';
        });
    }
});

