// Firebase Firestore integration for cross-device data sync
import { firebaseConfig } from './firebase-config.js';

export class FirebaseStorageManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.isOnline = navigator.onLine;
        
        // Fallback to localStorage for offline functionality
        this.localStorageKeys = {
            vendors: 'business_management_vendors',
            transactions: 'business_management_transactions', 
            projects: 'business_management_projects',
            settings: 'business_management_settings',
            lastSync: 'business_management_last_sync'
        };
        
        this.init();
        this.setupOfflineDetection();
    }

    async init() {
    try {
        // Import Firebase services
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        const { getFirestore, enableNetwork, disableNetwork } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        
        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        this.auth = getAuth(app);
        this.db = getFirestore(app);
        
        // Initialize data
        this.initializeData();
        
        // Listen for auth state changes
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            if (user) {
                console.log('User authenticated:', user.uid);
                this.syncDataFromCloud();
            } else {
                console.log('User signed out');
                this.currentUser = null;
                // Clear data when user signs out
                this.clearLocalUserData();
            }
        });
        
        this.isInitialized = true;
        console.log('Firebase initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        console.log('Falling back to localStorage only');
        this.isInitialized = false;
    }
}

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Back online - syncing data');
            if (this.currentUser) {
                this.syncDataToCloud();
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Gone offline - using localStorage');
        });
    }

    // Get user's Firestore document reference
    getUserDocRef(collection) {
        if (!this.currentUser || !this.db) return null;
        
        const { doc, collection: firestoreCollection } = window.firestoreModules;
        return doc(firestoreCollection(this.db, 'users', this.currentUser.uid, collection));
    }

    // Sync data from cloud to local storage
    async syncDataFromCloud() {
        if (!this.isOnline || !this.currentUser || !this.isInitialized) return;

        try {
            const { doc, getDoc, collection } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            const collections = ['vendors', 'transactions', 'projects', 'settings'];
            
            for (const collectionName of collections) {
                const docRef = doc(this.db, 'users', this.currentUser.uid, collectionName, 'data');
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    localStorage.setItem(this.localStorageKeys[collectionName], JSON.stringify(data.items || data));
                    console.log(`Synced ${collectionName} from cloud`);
                }
            }
            
            localStorage.setItem(this.localStorageKeys.lastSync, new Date().toISOString());
            
        } catch (error) {
            console.error('Error syncing from cloud:', error);
        }
    }

    // Sync data from local storage to cloud
    async syncDataToCloud() {
        if (!this.isOnline || !this.currentUser || !this.isInitialized) return;

        try {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            
            const collections = ['vendors', 'transactions', 'projects', 'settings'];
            
            for (const collectionName of collections) {
                const localData = localStorage.getItem(this.localStorageKeys[collectionName]);
                if (localData) {
                    const docRef = doc(this.db, 'users', this.currentUser.uid, collectionName, 'data');
                    await setDoc(docRef, {
                        items: JSON.parse(localData),
                        lastUpdated: new Date().toISOString()
                    }, { merge: true });
                    console.log(`Synced ${collectionName} to cloud`);
                }
            }
            
        } catch (error) {
            console.error('Error syncing to cloud:', error);
        }
    }

    // Vendor operations (with cloud sync)
    getVendors() {
        try {
            return JSON.parse(localStorage.getItem(this.localStorageKeys.vendors)) || [];
        } catch (error) {
            console.error('Error loading vendors:', error);
            return [];
        }
    }

    async saveVendors(vendors) {
        try {
            localStorage.setItem(this.localStorageKeys.vendors, JSON.stringify(vendors));
            
            // Sync to cloud if online and authenticated
            if (this.isOnline && this.currentUser && this.isInitialized) {
                await this.syncVendorsToCloud(vendors);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving vendors:', error);
            return false;
        }
    }

    async syncVendorsToCloud(vendors) {
        try {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            const docRef = doc(this.db, 'users', this.currentUser.uid, 'vendors', 'data');
            await setDoc(docRef, {
                items: vendors,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error('Error syncing vendors to cloud:', error);
        }
    }

    addVendor(vendor) {
        if (!this.requireAuth()) {
            console.log('Authentication required for adding vendor');
            return Promise.resolve(null);
        }
        
        const vendors = this.getVendors();
        vendor.id = this.generateId();
        vendor.createdAt = new Date().toISOString();
        vendor.updatedAt = new Date().toISOString();
        vendor.totalSpent = 0;
        vendor.status = vendor.status || 'active';
        
        vendors.push(vendor);
        return this.saveVendors(vendors).then(() => vendor).catch(() => null);
    }

    updateVendor(id, updatedVendor) {
        const vendors = this.getVendors();
        const index = vendors.findIndex(v => v.id === id);
        
        if (index !== -1) {
            updatedVendor.updatedAt = new Date().toISOString();
            vendors[index] = { ...vendors[index], ...updatedVendor };
            return this.saveVendors(vendors).then(() => vendors[index]).catch(() => null);
        }
        return null;
    }

    deleteVendor(id) {
        const vendors = this.getVendors();
        const filteredVendors = vendors.filter(v => v.id !== id);
        return this.saveVendors(filteredVendors);
    }

    // Transaction operations
    getTransactions() {
        try {
            return JSON.parse(localStorage.getItem(this.localStorageKeys.transactions)) || [];
        } catch (error) {
            console.error('Error loading transactions:', error);
            return [];
        }
    }

    // In firebase-storage.js, add to the FirebaseStorageManager class
    getVendorById(id) {
        const vendors = this.getVendors();
        return vendors.find(v => v.id === id) || null;
    }

    getProjectById(id) {
        const projects = this.getProjects();
        return projects.find(p => p.id === id) || null;
    }

    getTransactionById(id) {
        const transactions = this.getTransactions();
        return transactions.find(t => t.id === id) || null;
    }

    getTransactionsByProject(projectId) {
        const transactions = this.getTransactions();
        return transactions.filter(t => t.projectId === projectId);
    }

    getTransactionsByVendor(vendorId) {
        const transactions = this.getTransactions();
        return transactions.filter(t => t.vendorId === vendorId);
    }

    async saveTransactions(transactions) {
        try {
            localStorage.setItem(this.localStorageKeys.transactions, JSON.stringify(transactions));
            
            if (this.isOnline && this.currentUser && this.isInitialized) {
                await this.syncTransactionsToCloud(transactions);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving transactions:', error);
            return false;
        }
    }

    async syncTransactionsToCloud(transactions) {
        try {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            const docRef = doc(this.db, 'users', this.currentUser.uid, 'transactions', 'data');
            await setDoc(docRef, {
                items: transactions,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error('Error syncing transactions to cloud:', error);
        }
    }

    addTransaction(transaction) {
        if (!this.requireAuth()) {
            console.log('Authentication required for adding transaction');
            return Promise.resolve(null);
        }
        
        const transactions = this.getTransactions();
        transaction.id = this.generateId();
        transaction.createdAt = new Date().toISOString();
        transaction.updatedAt = new Date().toISOString();
        
        transactions.push(transaction);
        return this.saveTransactions(transactions).then(() => transaction).catch(() => null);
    }

    updateTransaction(id, updatedTransaction) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        
        if (index !== -1) {
            updatedTransaction.updatedAt = new Date().toISOString();
            transactions[index] = { ...transactions[index], ...updatedTransaction };
            return this.saveTransactions(transactions).then(() => transactions[index]).catch(() => null);
        }
        return null;
    }

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filteredTransactions = transactions.filter(t => t.id !== id);
        return this.saveTransactions(filteredTransactions);
    }

    // Project operations
    getProjects() {
        try {
            return JSON.parse(localStorage.getItem(this.localStorageKeys.projects)) || [];
        } catch (error) {
            console.error('Error loading projects:', error);
            return [];
        }
    }

    async saveProjects(projects) {
        try {
            localStorage.setItem(this.localStorageKeys.projects, JSON.stringify(projects));
            
            if (this.isOnline && this.currentUser && this.isInitialized) {
                await this.syncProjectsToCloud(projects);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving projects:', error);
            return false;
        }
    }

    async syncProjectsToCloud(projects) {
        try {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            const docRef = doc(this.db, 'users', this.currentUser.uid, 'projects', 'data');
            await setDoc(docRef, {
                items: projects,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error('Error syncing projects to cloud:', error);
        }
    }

    addProject(project) {
        if (!this.requireAuth()) {
            console.log('Authentication required for adding project');
            return Promise.resolve(null);
        }
        
        const projects = this.getProjects();
        project.id = this.generateId();
        project.createdAt = new Date().toISOString();
        project.updatedAt = new Date().toISOString();
        project.status = project.status || 'planning';
        project.progress = project.progress || 0;
        
        projects.push(project);
        return this.saveProjects(projects).then(() => project).catch(() => null);
    }

    updateProject(id, updatedProject) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        
        if (index !== -1) {
            updatedProject.updatedAt = new Date().toISOString();
            projects[index] = { ...projects[index], ...updatedProject };
            return this.saveProjects(projects).then(() => projects[index]).catch(() => null);
        }
        return null;
    }

    deleteProject(id) {
        const projects = this.getProjects();
        const filteredProjects = projects.filter(p => p.id !== id);
        return this.saveProjects(filteredProjects);
    }

    // Settings operations
    getSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem(this.localStorageKeys.settings));
            return settings || {
                companyName: 'Your Business',
                businessType: 'construction',
                primaryColor: '#F59E0B',
                currency: 'INR',
                theme: 'light',
                customCategories: {
                    vendor: [],
                    transaction: []
                }
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    async saveSettings(settings) {
        try {
            localStorage.setItem(this.localStorageKeys.settings, JSON.stringify(settings));
            
            if (this.isOnline && this.currentUser && this.isInitialized) {
                await this.syncSettingsToCloud(settings);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    async syncSettingsToCloud(settings) {
        try {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            const docRef = doc(this.db, 'users', this.currentUser.uid, 'settings', 'data');
            await setDoc(docRef, {
                ...settings,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error('Error syncing settings to cloud:', error);
        }
    }

    // User profile operations
    async saveUserProfile(profile) {
        if (!this.currentUser || !this.isInitialized) return false;
        
        try {
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            const docRef = doc(this.db, 'users', this.currentUser.uid);
            await setDoc(docRef, {
                ...profile,
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error saving user profile:', error);
            return false;
        }
    }

    async getUserProfile() {
        if (!this.currentUser || !this.isInitialized) return null;
        
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
            const docRef = doc(this.db, 'users', this.currentUser.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    // Clear local user data when logging out
    clearLocalUserData() {
        const dataKeys = [
            this.localStorageKeys.vendors,
            this.localStorageKeys.transactions,
            this.localStorageKeys.projects,
            this.localStorageKeys.lastSync
        ];
        
        dataKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Initialize empty data structure
        this.initializeData();
        
        console.log('Local user data cleared');
    }

    // Check if user is authenticated before allowing operations
    requireAuth() {
        if (!this.currentUser) {
            return false;
        }
        return true;
    }

    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Initialize data with defaults if needed  
    initializeData() {
        if (!localStorage.getItem(this.localStorageKeys.vendors)) {
            this.saveVendors([]);
        }
        if (!localStorage.getItem(this.localStorageKeys.transactions)) {
            this.saveTransactions([]);
        }
        if (!localStorage.getItem(this.localStorageKeys.projects)) {
            this.saveProjects([]);
        }
        if (!localStorage.getItem(this.localStorageKeys.settings)) {
            this.saveSettings({
                companyName: 'Your Business',
                businessType: 'construction',
                primaryColor: '#F59E0B',
                currency: 'INR',
                theme: 'light',
                customCategories: {
                    vendor: [],
                    transaction: []
                }
            });
        }
    }

    // Force sync all data (useful for manual sync button)
    async forceSyncAll() {
        if (!this.isOnline || !this.currentUser || !this.isInitialized) {
            console.log('Cannot sync: offline or not authenticated');
            return false;
        }

        try {
            await this.syncDataToCloud();
            await this.syncDataFromCloud();
            console.log('Force sync completed');
            return true;
        } catch (error) {
            console.error('Force sync failed:', error);
            return false;
        }
    }
}