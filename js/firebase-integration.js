// Firebase Integration Helper - adds methods to existing App class
// This file extends the main App functionality with Firebase features

export function addFirebaseIntegration(app) {
    // Add Firebase integration methods to the existing app instance
    
    app.setupFirebaseIntegration = function() {
        // Listen for auth state changes to sync data
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                // User signed in - sync data and update UI
                console.log('User authenticated, syncing data...');
                this.storage.syncDataFromCloud();
                this.refreshAllSections();
            } else {
                // User signed out - work with local data only
                console.log('User signed out, using local data only');
            }
        });

        // Add sync button to UI
        this.addSyncButton();
        
        // Add offline indicator
        this.addOfflineIndicator();
    };
    
    app.addSyncButton = function() {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !document.getElementById('sync-btn')) {
            const syncBtn = document.createElement('button');
            syncBtn.id = 'sync-btn';
            syncBtn.className = 'btn btn-secondary';
            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            syncBtn.title = 'Sync data across devices';
            syncBtn.style.display = 'none';
            syncBtn.style.marginRight = '0.5rem';
            
            syncBtn.addEventListener('click', async () => {
                if (this.auth.requireAuth('sync data')) {
                    syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    syncBtn.disabled = true;
                    
                    const success = await this.storage.forceSyncAll();
                    
                    if (success) {
                        showToast('Data synced successfully', 'success');
                        this.refreshAllSections();
                        syncBtn.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                        }, 2000);
                    } else {
                        showToast('Sync failed. Please try again.', 'error');
                        syncBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                        setTimeout(() => {
                            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                        }, 2000);
                    }
                    
                    syncBtn.disabled = false;
                }
            });

            // Show sync button only when authenticated
            this.auth.onAuthStateChanged((user) => {
                syncBtn.style.display = user ? 'flex' : 'none';
            });

            headerActions.insertBefore(syncBtn, headerActions.firstChild);
        }
    };
    
    app.addOfflineIndicator = function() {
        if (!document.getElementById('offline-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.className = 'offline-indicator';
            indicator.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline Mode';
            document.body.appendChild(indicator);
            
            const updateIndicator = () => {
                if (navigator.onLine) {
                    indicator.style.display = 'none';
                } else {
                    indicator.style.display = 'block';
                    indicator.classList.add('show');
                }
            };
            
            window.addEventListener('online', updateIndicator);
            window.addEventListener('offline', updateIndicator);
            updateIndicator();
        }
    };
    
    app.refreshAllSections = function() {
        // Refresh the current section to show updated data
        if (this.currentSection) {
            this.loadSection(this.currentSection);
        }
        
        // Update analytics if on dashboard
        if (this.currentSection === 'dashboard') {
            this.analytics.loadDashboard();
        }
    };
    
    // Enhanced authentication checking for features
    app.requireAuth = function(feature = 'this feature') {
        return this.auth.requireAuth(feature);
    };
    
    // Add user profile management
    app.showUserProfile = function() {
        const user = this.auth.getCurrentUser();
        if (user) {
            // Show user profile modal or section
            showToast(`Logged in as: ${user.displayName || user.email}`, 'info');
        }
    };
}

// Auto-initialize when imported with main app
if (typeof window !== 'undefined' && window.app) {
    addFirebaseIntegration(window.app);
}