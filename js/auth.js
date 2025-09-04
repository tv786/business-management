import { showToast } from './utils.js';

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authKey = 'business_auth_user';
        this.demoMode = false;
    }
    
    // Add to AuthManager class in auth.js
    closeModal() {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('signup-modal').style.display = 'none';
    }

    init() {
        this.loadStoredAuth();
        this.setupEventListeners();
        this.updateUIState();
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const switchToSignup = document.getElementById('switch-to-signup');
        const switchToLogin = document.getElementById('switch-to-login');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        if (switchToSignup) {
            switchToSignup.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSignupModal();
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup();
            });
        }

        // Add real-time form validation
        this.setupFormValidation();
    }

    setupFormValidation() {
        // Login form validation
        const loginEmail = document.getElementById('login-email');
        const loginPassword = document.getElementById('login-password');
        
        if (loginEmail) {
            loginEmail.addEventListener('blur', () => this.validateEmail(loginEmail));
            loginEmail.addEventListener('input', () => this.clearError(loginEmail));
        }
        
        if (loginPassword) {
            loginPassword.addEventListener('blur', () => this.validateRequired(loginPassword));
            loginPassword.addEventListener('input', () => this.clearError(loginPassword));
        }

        // Signup form validation
        const signupName = document.getElementById('signup-name');
        const signupEmail = document.getElementById('signup-email');
        const signupPassword = document.getElementById('signup-password');
        const signupConfirmPassword = document.getElementById('signup-confirm-password');
        
        if (signupName) {
            signupName.addEventListener('blur', () => this.validateRequired(signupName));
            signupName.addEventListener('input', () => this.clearError(signupName));
        }
        
        if (signupEmail) {
            signupEmail.addEventListener('blur', () => this.validateEmail(signupEmail));
            signupEmail.addEventListener('input', () => this.clearError(signupEmail));
        }
        
        if (signupPassword) {
            signupPassword.addEventListener('input', () => {
                this.checkPasswordStrength(signupPassword);
                this.clearError(signupPassword);
            });
            signupPassword.addEventListener('blur', () => this.validatePassword(signupPassword));
        }
        
        if (signupConfirmPassword) {
            signupConfirmPassword.addEventListener('blur', () => this.validatePasswordMatch(signupPassword, signupConfirmPassword));
            signupConfirmPassword.addEventListener('input', () => this.clearError(signupConfirmPassword));
        }
    }

    validateEmail(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(input.value);
        this.setFieldValidation(input, isValid);
        return isValid;
    }

    validateRequired(input) {
        const isValid = input.value.trim().length > 0;
        this.setFieldValidation(input, isValid);
        return isValid;
    }

    validatePassword(input) {
        const isValid = input.value.length >= 6;
        this.setFieldValidation(input, isValid);
        return isValid;
    }

    validatePasswordMatch(passwordInput, confirmInput) {
        const isValid = passwordInput.value === confirmInput.value && confirmInput.value.length > 0;
        this.setFieldValidation(confirmInput, isValid);
        return isValid;
    }

    setFieldValidation(input, isValid) {
        const formGroup = input.closest('.form-group');
        if (isValid) {
            formGroup.classList.remove('error');
            formGroup.classList.add('success');
        } else {
            formGroup.classList.remove('success');
            formGroup.classList.add('error');
        }
    }

    clearError(input) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.remove('error', 'success');
    }

    checkPasswordStrength(passwordInput) {
        const password = passwordInput.value;
        const strengthBar = passwordInput.parentElement.querySelector('.strength-bar');
        
        if (!strengthBar) return;

        let strength = 0;
        if (password.length >= 6) strength += 1;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^A-Za-z0-9]/)) strength += 1;

        strengthBar.className = 'strength-bar';
        if (strength === 1) {
            strengthBar.classList.add('weak');
        } else if (strength === 2 || strength === 3) {
            strengthBar.classList.add('medium');
        } else if (strength === 4) {
            strengthBar.classList.add('strong');
        }
    }

    // In the AuthManager class, update these methods:
    showLoginModal() {
        this.closeAllModals();
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.add('show');
            document.getElementById('login-email').focus();
            
            // Add click outside handler
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        }
    }

    showSignupModal() {
        this.closeAllModals();
        const modal = document.getElementById('signup-modal');
        if (modal) {
            modal.classList.add('show');
            document.getElementById('signup-name').focus();
            
            // Add click outside handler
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        }
    }

    closeAllModals() {
        const loginModal = document.getElementById('login-modal');
        const signupModal = document.getElementById('signup-modal');
        
        if (loginModal) loginModal.classList.remove('show');
        if (signupModal) signupModal.classList.remove('show');
        
        // Remove event listeners to prevent memory leaks
        if (loginModal) loginModal.removeEventListener('click', this.closeAllModals);
        if (signupModal) signupModal.removeEventListener('click', this.closeAllModals);
    }


    async handleLogin() {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Clear previous errors
        this.clearError(emailInput);
        this.clearError(passwordInput);

        // Validate form
        let isValid = true;
        if (!this.validateEmail(emailInput)) {
            isValid = false;
        }
        if (!this.validateRequired(passwordInput)) {
            isValid = false;
        }

        if (!isValid) {
            showToast('Please correct the errors in the form', 'error');
            return;
        }

        // Show loading state
        const submitBtn = document.querySelector('#login-form .btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        submitBtn.disabled = true;

        // Simulate API delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            // Check if user exists in storage
            const users = this.getStoredUsers();
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
                throw new Error('User not found. Please sign up first.');
            }

            // Simple password check (in real app, use proper hashing)
            if (user.password !== password) {
                throw new Error('Invalid password. Please try again.');
            }

            // Login successful
            this.currentUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || this.generateAvatar(user.name)
            };

            this.isAuthenticated = true;
            this.saveAuth();
            this.updateUIState();
            this.closeAllModals();
            
            // Clear form
            emailInput.value = '';
            passwordInput.value = '';
            
            showToast(`Welcome back, ${this.currentUser.name}!`, 'success');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleSignup() {
        const nameInput = document.getElementById('signup-name');
        const emailInput = document.getElementById('signup-email');
        const passwordInput = document.getElementById('signup-password');
        const confirmPasswordInput = document.getElementById('signup-confirm-password');
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Clear previous errors
        this.clearError(nameInput);
        this.clearError(emailInput);
        this.clearError(passwordInput);
        this.clearError(confirmPasswordInput);

        // Validate form
        let isValid = true;
        if (!this.validateRequired(nameInput)) {
            isValid = false;
        }
        if (!this.validateEmail(emailInput)) {
            isValid = false;
        }
        if (!this.validatePassword(passwordInput)) {
            isValid = false;
        }
        if (!this.validatePasswordMatch(passwordInput, confirmPasswordInput)) {
            isValid = false;
        }

        if (!isValid) {
            showToast('Please correct the errors in the form', 'error');
            return;
        }

        // Show loading state
        const submitBtn = document.querySelector('#signup-form .btn-primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;

        // Simulate API delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // Check if user already exists
            const users = this.getStoredUsers();
            if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
                throw new Error('An account with this email already exists. Please login instead.');
            }

            // Create new user
            const newUser = {
                id: this.generateId(),
                name: name,
                email: email,
                password: password, // In real app, hash this
                avatar: this.generateAvatar(name),
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            this.saveUsers(users);

            // Auto-login the new user
            this.currentUser = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar
            };

            this.isAuthenticated = true;
            this.saveAuth();
            this.updateUIState();
            this.closeAllModals();
            
            // Clear form
            nameInput.value = '';
            emailInput.value = '';
            passwordInput.value = '';
            confirmPasswordInput.value = '';
            
            showToast(`Welcome to the platform, ${this.currentUser.name}!`, 'success');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.clearAuth();
        this.updateUIState();
        showToast('Logged out successfully', 'info');
    }

    updateUIState() {
        const loginBtn = document.getElementById('login-btn');
        const userProfile = document.getElementById('user-profile');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');

        if (this.isAuthenticated && this.currentUser) {
            // Show user profile, hide login button
            if (loginBtn) loginBtn.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';
            if (userName) userName.textContent = this.currentUser.name;
            if (userAvatar) userAvatar.src = this.currentUser.avatar;
        } else {
            // Show login button, hide user profile
            if (loginBtn) loginBtn.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
        }
    }

    // Check if user is authenticated (for protected features)
    requireAuth() {
        if (!this.isAuthenticated) {
            showToast('Please login to use this feature', 'warning');
            this.showLoginModal();
            return false;
        }
        return true;
    }

    // Storage methods
    getStoredUsers() {
        const users = localStorage.getItem('business_users');
        return users ? JSON.parse(users) : [];
    }

    saveUsers(users) {
        localStorage.setItem('business_users', JSON.stringify(users));
    }

    loadStoredAuth() {
        const auth = localStorage.getItem(this.authKey);
        if (auth) {
            try {
                const authData = JSON.parse(auth);
                this.currentUser = authData.user;
                this.isAuthenticated = authData.isAuthenticated;
            } catch (e) {
                console.error('Error loading auth data:', e);
                this.clearAuth();
            }
        }
    }

    saveAuth() {
        const authData = {
            user: this.currentUser,
            isAuthenticated: this.isAuthenticated
        };
        localStorage.setItem(this.authKey, JSON.stringify(authData));
    }

    clearAuth() {
        localStorage.removeItem(this.authKey);
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateAvatar(name) {
        // Return transparent/empty avatar instead of initials
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" fill="transparent"/>
            </svg>
        `)}`;
    }

    // Public methods for other modules
    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}