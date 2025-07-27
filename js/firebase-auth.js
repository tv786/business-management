// Firebase Authentication integration
import { firebaseConfig } from './firebase-config.js';
import { showToast } from './utils.js';

export class FirebaseAuthManager {
    constructor() {
        this.auth = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.isInitialized = false;
        this.authStateCallbacks = [];
        this.init();
    }

    async init() {
        try {
            // Import Firebase Auth
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
            const { 
                getAuth, 
                onAuthStateChanged, 
                signInWithEmailAndPassword,
                createUserWithEmailAndPassword,
                signOut,
                updateProfile,
                GoogleAuthProvider,
                signInWithPopup
            } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);
            this.auth = getAuth(app);
            
            // Store auth methods for later use
            this.authMethods = {
                signInWithEmailAndPassword,
                createUserWithEmailAndPassword,
                signOut,
                updateProfile,
                GoogleAuthProvider,
                signInWithPopup
            };

            // Listen for auth state changes
            onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                this.isAuthenticated = !!user;
                
                if (user) {
                    console.log('User authenticated:', user.uid);
                    // Only show welcome back message on fresh login, not on every reload
                    const hasShownWelcomeBack = sessionStorage.getItem('welcome_back_shown');
                    if (!hasShownWelcomeBack) {
                        showToast(`Welcome back, ${user.displayName || user.email}!`, 'success');
                        sessionStorage.setItem('welcome_back_shown', 'true');
                    }
                } else {
                    console.log('User signed out');
                    // Clear the welcome back flag when user signs out
                    sessionStorage.removeItem('welcome_back_shown');
                }
                
                this.updateUIState();
                this.notifyAuthStateChanged(user);
            });

            this.isInitialized = true;
            this.setupEventListeners();
            console.log('Firebase Auth initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Firebase Auth:', error);
            showToast('Authentication system unavailable. Using offline mode.', 'warning');
            this.isInitialized = false;
        }
    }

    // Register callback for auth state changes
    onAuthStateChanged(callback) {
        this.authStateCallbacks.push(callback);
        // Call immediately if already initialized
        if (this.isInitialized) {
            callback(this.currentUser);
        }
    }

    // Notify all registered callbacks
    notifyAuthStateChanged(user) {
        this.authStateCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth state callback error:', error);
            }
        });
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const switchToSignup = document.getElementById('switch-to-signup');
        const switchToLogin = document.getElementById('switch-to-login');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const googleLoginBtn = document.getElementById('google-login-btn');
        const googleSignupBtn = document.getElementById('google-signup-btn');

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

        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        if (googleSignupBtn) {
            googleSignupBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        // Close modals when clicking outside or on close button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('btn-close')) {
                this.closeModal();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        this.setupFormValidation();
    }

    setupFormValidation() {
        const loginEmail = document.getElementById('login-email');
        const loginPassword = document.getElementById('login-password');
        const signupEmail = document.getElementById('signup-email');
        const signupPassword = document.getElementById('signup-password');
        const signupConfirmPassword = document.getElementById('signup-confirm-password');
        const signupName = document.getElementById('signup-name');

        // Real-time validation for login form
        if (loginEmail) {
            loginEmail.addEventListener('input', () => this.validateEmail(loginEmail));
        }

        if (loginPassword) {
            loginPassword.addEventListener('input', () => this.validatePassword(loginPassword));
        }

        // Real-time validation for signup form
        if (signupEmail) {
            signupEmail.addEventListener('input', () => this.validateEmail(signupEmail));
        }

        if (signupPassword) {
            signupPassword.addEventListener('input', () => this.validatePassword(signupPassword));
        }

        if (signupConfirmPassword) {
            signupConfirmPassword.addEventListener('input', () => this.validatePasswordMatch(signupPassword, signupConfirmPassword));
        }

        if (signupName) {
            signupName.addEventListener('input', () => this.validateName(signupName));
        }
    }

    validateEmail(emailInput) {
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        this.setFieldValidation(emailInput, isValid, isValid ? '' : 'Please enter a valid email address');
        return isValid;
    }

    validatePassword(passwordInput) {
        const password = passwordInput.value;
        const isValid = password.length >= 6;
        
        this.setFieldValidation(passwordInput, isValid, isValid ? '' : 'Password must be at least 6 characters');
        return isValid;
    }

    validatePasswordMatch(passwordInput, confirmPasswordInput) {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const isValid = password === confirmPassword && password.length > 0;
        
        this.setFieldValidation(confirmPasswordInput, isValid, isValid ? '' : 'Passwords do not match');
        return isValid;
    }

    validateName(nameInput) {
        const name = nameInput.value.trim();
        const isValid = name.length >= 2;
        
        this.setFieldValidation(nameInput, isValid, isValid ? '' : 'Name must be at least 2 characters');
        return isValid;
    }

    setFieldValidation(input, isValid, errorMessage) {
        const errorDiv = input.parentNode.querySelector('.field-error') || this.createErrorDiv(input);
        
        if (isValid) {
            input.classList.remove('error');
            input.classList.add('valid');
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        } else {
            input.classList.remove('valid');
            input.classList.add('error');
            errorDiv.textContent = errorMessage;
            errorDiv.style.display = 'block';
        }
    }

    createErrorDiv(input) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        input.parentNode.appendChild(errorDiv);
        return errorDiv;
    }

    showLoginModal() {
        document.getElementById('login-modal').style.display = 'flex';
        document.getElementById('signup-modal').style.display = 'none';
        document.getElementById('login-email').focus();
    }

    showSignupModal() {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('signup-modal').style.display = 'flex';
        document.getElementById('signup-name').focus();
    }

    closeModal() {
        const loginModal = document.getElementById('login-modal');
        const signupModal = document.getElementById('signup-modal');
        
        if (loginModal) loginModal.style.display = 'none';
        if (signupModal) signupModal.style.display = 'none';
        
        // Also hide the modal overlay if needed
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.style.display = 'none';
        
        this.clearFormErrors();
    }
    // Add this new method to close all modals
    closeAllModals() {
        this.closeModal();
    }

    clearFormErrors() {
        const errorDivs = document.querySelectorAll('.field-error');
        errorDivs.forEach(div => {
            div.textContent = '';
            div.style.display = 'none';
        });

        const inputs = document.querySelectorAll('.error, .valid');
        inputs.forEach(input => {
            input.classList.remove('error', 'valid');
        });
    }

    async handleLogin() {
        if (!this.isInitialized) {
            showToast('Authentication system not available', 'error');
            return;
        }

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        // Validate form
        const isEmailValid = this.validateEmail(document.getElementById('login-email'));
        const isPasswordValid = this.validatePassword(document.getElementById('login-password'));

        if (!isEmailValid || !isPasswordValid) {
            showToast('Please fix the errors in the form', 'error');
            return;
        }

        try {
            this.setLoading('login-btn', true);
            
            const userCredential = await this.authMethods.signInWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            console.log('User logged in:', user.uid);
            showToast('Login successful!', 'success');
            this.closeModal();
            
            // Auto reload page after successful login
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed. Please try again.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later.';
                    break;
            }
            
            showToast(errorMessage, 'error');
        } finally {
            this.setLoading('login-btn', false);
        }
    }

    async handleSignup() {
        if (!this.isInitialized) {
            showToast('Authentication system not available', 'error');
            return;
        }

        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        // Validate form
        const isNameValid = this.validateName(document.getElementById('signup-name'));
        const isEmailValid = this.validateEmail(document.getElementById('signup-email'));
        const isPasswordValid = this.validatePassword(document.getElementById('signup-password'));
        const isPasswordMatchValid = this.validatePasswordMatch(
            document.getElementById('signup-password'),
            document.getElementById('signup-confirm-password')
        );

        if (!isNameValid || !isEmailValid || !isPasswordValid || !isPasswordMatchValid) {
            showToast('Please fix the errors in the form', 'error');
            return;
        }

        try {
            this.setLoading('signup-btn', true);
            
            const userCredential = await this.authMethods.createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Update user profile with display name
            await this.authMethods.updateProfile(user, {
                displayName: name
            });
            
            console.log('User signed up:', user.uid);
            showToast(`Welcome, ${name}! Account created successfully.`, 'success');
            this.closeModal();
            
            // Auto reload page after successful signup
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = 'Signup failed. Please try again.';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password accounts are not enabled.';
                    break;
            }
            
            showToast(errorMessage, 'error');
        } finally {
            this.setLoading('signup-btn', false);
        }
    }

    async signInWithGoogle() {
        if (!this.isInitialized) {
            showToast('Authentication system not available', 'error');
            return;
        }

        try {
            const provider = new this.authMethods.GoogleAuthProvider();
            const result = await this.authMethods.signInWithPopup(this.auth, provider);
            const user = result.user;
            
            console.log('Google sign-in successful:', user.uid);
            showToast(`Welcome, ${user.displayName}!`, 'success');
            this.closeModal();
            
            // Auto reload page after successful Google sign-in
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Google sign-in error:', error);
            let errorMessage = 'Google sign-in failed. Please try again.';
            
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Sign-in cancelled.';
                    break;
                case 'auth/popup-blocked':
                    errorMessage = 'Pop-up blocked. Please enable pop-ups for this site.';
                    break;
                case 'auth/cancelled-popup-request':
                    errorMessage = 'Sign-in cancelled.';
                    break;
            }
            
            showToast(errorMessage, 'error');
        }
    }

    async logout() {
        if (!this.isInitialized) {
            showToast('Authentication system not available', 'error');
            return;
        }
        
        try {
            await this.authMethods.signOut(this.auth);
            console.log('User logged out successfully');
            showToast('Logged out successfully', 'success');
            
            // Clear session storage flags
            sessionStorage.removeItem('welcome_back_shown');
            sessionStorage.removeItem('welcome_shown');
            
            // Auto reload page after successful logout
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Logout failed. Please try again.', 'error');
        }
    }
    
    // Clear all user data from localStorage
    clearUserData() {
        const dataKeys = [
            'business_management_vendors',
            'business_management_transactions', 
            'business_management_projects',
            'business_management_settings',  // Added settings to be cleared
            'business_management_last_sync'
        ];
        
        dataKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('User data cleared from localStorage');
    }
    
    // Refresh all UI sections to show empty state
    refreshAllSections() {
        // Trigger refresh of all sections through the main app
        if (window.app) {
            // Reset data in all managers
            if (window.app.vendors) {
                window.app.vendors.renderVendorsTable();
                window.app.vendors.setupFilterDropdowns();
            }
            if (window.app.transactions) {
                window.app.transactions.renderTransactionsTable();
                window.app.transactions.populateFilterDropdowns();
            }
            if (window.app.projects) {
                window.app.projects.renderProjectsGrid();
            }
            if (window.app.analytics) {
                window.app.analytics.loadDashboard();
            }
            
            // Force reload current section
            const currentSection = window.app.currentSection || 'dashboard';
            setTimeout(() => {
                window.app.loadSection(currentSection);
            }, 100);
        }
    }
    
    // Force refresh of all data after login
    forceDataRefresh() {
        // Small delay to ensure Firebase auth state is fully updated
        setTimeout(() => {
            if (window.app) {
                // Clear any cached data first
                const currentTime = Date.now();
                localStorage.setItem('business_management_last_refresh', currentTime.toString());
                
                // Refresh all managers
                if (window.app.vendors) {
                    window.app.vendors.renderVendorsTable();
                    window.app.vendors.setupFilterDropdowns();
                }
                if (window.app.transactions) {
                    window.app.transactions.renderTransactionsTable();
                    window.app.transactions.populateFilterDropdowns();
                }
                if (window.app.projects) {
                    window.app.projects.renderProjectsGrid();
                }
                if (window.app.analytics) {
                    window.app.analytics.loadDashboard();
                }
                
                // Refresh settings and company name display
                if (window.app.settings) {
                    const settings = window.app.settings.loadSettings();
                    window.app.settings.applySettings(settings);
                }
                
                // Force reload current section to ensure fresh data
                const currentSection = window.app.currentSection || 'dashboard';
                window.app.loadSection(currentSection);
            }
        }, 200);
    }

    updateUIState() {
        const loginBtn = document.getElementById('login-btn');
        const userProfile = document.getElementById('user-profile');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');

        if (this.isAuthenticated && this.currentUser) {
            // Hide login button, show user profile
            if (loginBtn) loginBtn.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';
            
            // Update user info
            if (userName) {
                userName.textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            }
            
            if (userAvatar) {
                if (this.currentUser.photoURL) {
                    userAvatar.src = this.currentUser.photoURL;
                } else {
                    // Generate a simple avatar with user initials
                    const initials = this.getInitials(this.currentUser.displayName || this.currentUser.email);
                    userAvatar.src = this.generateAvatarDataURL(initials);
                }
            }
            
        } else {
            // Show login button, hide user profile
            if (loginBtn) loginBtn.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
        }
    }

    getInitials(name) {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    generateAvatarDataURL(initials) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 40;
        canvas.height = 40;
        
        // Background
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(0, 0, 40, 40);
        
        // Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 20, 20);
        
        return canvas.toDataURL();
    }

    setLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
        } else {
            button.disabled = false;
            if (buttonId === 'login-btn') {
                button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            } else if (buttonId === 'signup-btn') {
                button.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
            }
        }
    }

    // Check if user needs to be authenticated for a feature
    requireAuth(feature = 'this feature') {
        if (!this.isAuthenticated) {
            showToast(`Please log in to use ${feature}`, 'warning');
            this.showLoginModal();
            return false;
        }
        return true;
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if Firebase is initialized
    isReady() {
        return this.isInitialized;
    }
}