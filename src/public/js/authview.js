    document.addEventListener('DOMContentLoaded', function() {
        const authDataContainer = document.getElementById('authDataContainer');
        const activeTabFromData = authDataContainer.dataset.activeTab;
        const csrfTokenFromData = authDataContainer.dataset.csrfToken;
        const userIsLoggedInFromData = authDataContainer.dataset.userLoggedIn === 'true';

        // Gerenciamento de abas
        const tabs = document.querySelectorAll('.auth-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        function setActiveTab(targetTabId) {
            tabs.forEach(tab => {
                if (tab.getAttribute('data-tab') === targetTabId) {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });

            if (targetTabId === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else if (targetTabId === 'register') {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        }

        // Set initial tab
        let initialTab = activeTabFromData;
        if (window.location.hash) {
            const hashTab = window.location.hash.substring(1);
            if (hashTab === 'login' || hashTab === 'register') {
                initialTab = hashTab;
            }
        }
        setActiveTab(initialTab);

        tabs.forEach(tab => {
            tab.addEventListener('click', function(event) {
                event.preventDefault();
                const targetTabId = this.getAttribute('data-tab');
                setActiveTab(targetTabId);
                history.pushState(null, null, '#' + targetTabId);
            });
        });

         window.addEventListener('hashchange', function() {
            const hashTab = window.location.hash.substring(1);
            if (hashTab === 'login' || hashTab === 'register') {
                setActiveTab(hashTab);
            } else if (!hashTab && activeTabFromData) { 
                setActiveTab(activeTabFromData);
            }
        });


        const themeToggle = document.getElementById('theme-toggle');
        const htmlElement = document.documentElement;

        const savedTheme = localStorage.getItem('theme') || (userIsLoggedInFromData ? (document.querySelector('html').dataset.theme || 'light') : 'light');
        if (savedTheme) {
            htmlElement.setAttribute('data-theme', savedTheme);
            themeToggle.checked = savedTheme === 'dark';
        }


        themeToggle.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            if (userIsLoggedInFromData) {
                saveThemePreference(newTheme);
            }
        });

        function saveThemePreference(theme) {
            fetch('/save-preferences', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': csrfTokenFromData 
                },
                body: JSON.stringify({ theme: theme })
            })
            .then(response => {
                if (!response.ok) {
                    
                    console.error('Resposta não OK ao salvar preferência de tema:', response.status);
                    return response.json().then(errData => Promise.reject(errData));
                }
                return response.json();
            })
            .then(data => {
                if (!data.success) {
                    console.error('Erro ao salvar preferência de tema no servidor:', data.error);
                } else {
                    console.log('Preferência de tema salva no servidor.');
                }
            })
            .catch(error => {
                console.error('Erro na requisição para salvar preferência de tema:', error);
            });
        }

      
        const forms = document.querySelectorAll('.auth-form'); 
        forms.forEach(form => {
            form.addEventListener('submit', function(event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated'); r
            }, false);
        });

    });