import { showToast } from './utils.js';

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authKey = 'business_auth_user';
        this.demoMode = false;
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
    }

    showLoginModal() {
        this.closeAllModals();
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('login-email').focus();
        }
    }

    showSignupModal() {
        this.closeAllModals();
        const modal = document.getElementById('signup-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('signup-name').focus();
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        // Check if user exists in storage
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            showToast('User not found. Please sign up first.', 'error');
            return;
        }

        // Simple password check (in real app, use proper hashing)
        if (user.password !== password) {
            showToast('Invalid password', 'error');
            return;
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
        
        showToast(`Welcome back, ${this.currentUser.name}!`, 'success');
    }

    async handleSignup() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (!name || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        // Check if user already exists
        const users = this.getStoredUsers();
        if (users.find(u => u.email === email)) {
            showToast('User already exists. Please login instead.', 'error');
            return;
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
        
        showToast(`Welcome to the platform, ${this.currentUser.name}!`, 'success');
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
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const color = colors[name.length % colors.length];
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" fill="${color}" rx="20"/>
                <text x="20" y="26" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
                      text-anchor="middle" fill="white">${initials}</text>
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