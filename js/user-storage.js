// User-specific storage management for data isolation
export class UserStorageManager {
    constructor() {
        this.currentUserId = null;
        this.keys = {
            vendors: 'business_management_vendors',
            transactions: 'business_management_transactions',
            projects: 'business_management_projects',
            settings: 'business_management_settings'
        };
    }

    // Set current user for data isolation
    setCurrentUser(userId) {
        this.currentUserId = userId;
        this.initializeUserData();
    }

    // Clear current user (logout)
    clearCurrentUser() {
        this.currentUserId = null;
    }

    // Get user-specific storage keys
    getUserKeys() {
        if (!this.currentUserId) {
            throw new Error('No user is currently logged in');
        }
        return {
            vendors: `${this.keys.vendors}_${this.currentUserId}`,
            transactions: `${this.keys.transactions}_${this.currentUserId}`,
            projects: `${this.keys.projects}_${this.currentUserId}`,
            settings: `${this.keys.settings}_${this.currentUserId}`
        };
    }

    initializeUserData() {
        if (!this.currentUserId) return;
        
        const userKeys = this.getUserKeys();
        
        // Initialize with empty arrays if no data exists for this user
        if (!localStorage.getItem(userKeys.vendors)) {
            this.saveVendors([]);
        }
        if (!localStorage.getItem(userKeys.transactions)) {
            this.saveTransactions([]);
        }
        if (!localStorage.getItem(userKeys.projects)) {
            this.saveProjects([]);
        }
        if (!localStorage.getItem(userKeys.settings)) {
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

    // Check if user is logged in
    requireUser() {
        if (!this.currentUserId) {
            throw new Error('User must be logged in to access this data');
        }
    }

    // Vendor operations
    getVendors() {
        this.requireUser();
        try {
            const userKeys = this.getUserKeys();
            return JSON.parse(localStorage.getItem(userKeys.vendors)) || [];
        } catch (error) {
            console.error('Error loading vendors:', error);
            return [];
        }
    }

    saveVendors(vendors) {
        this.requireUser();
        try {
            const userKeys = this.getUserKeys();
            localStorage.setItem(userKeys.vendors, JSON.stringify(vendors));
            return true;
        } catch (error) {
            console.error('Error saving vendors:', error);
            return false;
        }
    }

    addVendor(vendor) {
        this.requireUser();
        const vendors = this.getVendors();
        vendor.id = this.generateId();
        vendor.createdAt = new Date().toISOString();
        vendor.updatedAt = new Date().toISOString();
        vendor.totalSpent = 0;
        vendor.status = vendor.status || 'active';
        
        vendors.push(vendor);
        return this.saveVendors(vendors) ? vendor : null;
    }

    updateVendor(id, updatedVendor) {
        this.requireUser();
        const vendors = this.getVendors();
        const index = vendors.findIndex(v => v.id === id);
        
        if (index !== -1) {
            vendors[index] = { ...vendors[index], ...updatedVendor, updatedAt: new Date().toISOString() };
            this.saveVendors(vendors);
            this.updateVendorTotals();
            return vendors[index];
        }
        return null;
    }

    deleteVendor(id) {
        this.requireUser();
        const vendors = this.getVendors();
        const filteredVendors = vendors.filter(v => v.id !== id);
        
        if (filteredVendors.length !== vendors.length) {
            this.saveVendors(filteredVendors);
            this.updateVendorTotals();
            return true;
        }
        return false;
    }

    getVendorById(id) {
        this.requireUser();
        const vendors = this.getVendors();
        return vendors.find(v => v.id === id);
    }

    // Transaction operations
    getTransactions() {
        this.requireUser();
        try {
            const userKeys = this.getUserKeys();
            return JSON.parse(localStorage.getItem(userKeys.transactions)) || [];
        } catch (error) {
            console.error('Error loading transactions:', error);
            return [];
        }
    }

    saveTransactions(transactions) {
        this.requireUser();
        try {
            const userKeys = this.getUserKeys();
            localStorage.setItem(userKeys.transactions, JSON.stringify(transactions));
            return true;
        } catch (error) {
            console.error('Error saving transactions:', error);
            return false;
        }
    }

    addTransaction(transaction) {
        this.requireUser();
        const transactions = this.getTransactions();
        transaction.id = this.generateId();
        transaction.createdAt = new Date().toISOString();
        transaction.updatedAt = new Date().toISOString();
        
        transactions.push(transaction);
        const success = this.saveTransactions(transactions);
        
        if (success) {
            this.updateVendorTotals();
        }
        
        return success ? transaction : null;
    }

    updateTransaction(id, updatedTransaction) {
        this.requireUser();
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updatedTransaction, updatedAt: new Date().toISOString() };
            this.saveTransactions(transactions);
            this.updateVendorTotals();
            return transactions[index];
        }
        return null;
    }

    deleteTransaction(id) {
        this.requireUser();
        const transactions = this.getTransactions();
        const filteredTransactions = transactions.filter(t => t.id !== id);
        
        if (filteredTransactions.length !== transactions.length) {
            this.saveTransactions(filteredTransactions);
            this.updateVendorTotals();
            return true;
        }
        return false;
    }

    getTransactionById(id) {
        this.requireUser();
        const transactions = this.getTransactions();
        return transactions.find(t => t.id === id);
    }

    // Project operations
    getProjects() {
        this.requireUser();
        try {
            const userKeys = this.getUserKeys();
            return JSON.parse(localStorage.getItem(userKeys.projects)) || [];
        } catch (error) {
            console.error('Error loading projects:', error);
            return [];
        }
    }

    saveProjects(projects) {
        this.requireUser();
        try {
            const userKeys = this.getUserKeys();
            localStorage.setItem(userKeys.projects, JSON.stringify(projects));
            return true;
        } catch (error) {
            console.error('Error saving projects:', error);
            return false;
        }
    }

    addProject(project) {
        this.requireUser();
        const projects = this.getProjects();
        project.id = this.generateId();
        project.createdAt = new Date().toISOString();
        project.updatedAt = new Date().toISOString();
        project.status = project.status || 'planning';
        project.progress = project.progress || 0;
        
        projects.push(project);
        return this.saveProjects(projects) ? project : null;
    }

    updateProject(id, updatedProject) {
        this.requireUser();
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updatedProject, updatedAt: new Date().toISOString() };
            this.saveProjects(projects);
            return projects[index];
        }
        return null;
    }

    deleteProject(id) {
        this.requireUser();
        const projects = this.getProjects();
        const filteredProjects = projects.filter(p => p.id !== id);
        
        if (filteredProjects.length !== projects.length) {
            this.saveProjects(filteredProjects);
            return true;
        }
        return false;
    }

    getProjectById(id) {
        this.requireUser();
        const projects = this.getProjects();
        return projects.find(p => p.id === id);
    }

    // Settings operations
    getSettings() {
        this.requireUser();
        try {
            const userKeys = this.getUserKeys();
            return JSON.parse(localStorage.getItem(userKeys.settings)) || {};
        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        }
    }

    saveSettings(settings) {
        this.requireUser();
        try {
            const userKeys = this.getUserKeys();
            localStorage.setItem(userKeys.settings, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    updateVendorTotals() {
        this.requireUser();
        const vendors = this.getVendors();
        const transactions = this.getTransactions();
        
        vendors.forEach(vendor => {
            const vendorTransactions = transactions.filter(t => t.vendorId === vendor.id && t.type === 'expense');
            vendor.totalSpent = vendorTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        });
        
        this.saveVendors(vendors);
    }

    // Search and filter methods
    searchVendors(query) {
        this.requireUser();
        const vendors = this.getVendors();
        const lowerQuery = query.toLowerCase();
        return vendors.filter(vendor => 
            vendor.name.toLowerCase().includes(lowerQuery) ||
            vendor.email.toLowerCase().includes(lowerQuery) ||
            vendor.phone.includes(query) ||
            vendor.category.toLowerCase().includes(lowerQuery)
        );
    }

    searchTransactions(query) {
        this.requireUser();
        const transactions = this.getTransactions();
        const lowerQuery = query.toLowerCase();
        return transactions.filter(transaction => 
            transaction.description.toLowerCase().includes(lowerQuery) ||
            transaction.category.toLowerCase().includes(lowerQuery) ||
            transaction.amount.toString().includes(query)
        );
    }

    searchProjects(query) {
        this.requireUser();
        const projects = this.getProjects();
        const lowerQuery = query.toLowerCase();
        return projects.filter(project => 
            project.name.toLowerCase().includes(lowerQuery) ||
            project.description.toLowerCase().includes(lowerQuery) ||
            project.category.toLowerCase().includes(lowerQuery)
        );
    }

    // Date range filtering
    getTransactionsByDateRange(startDate, endDate) {
        this.requireUser();
        const transactions = this.getTransactions();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= start && transactionDate <= end;
        });
    }

    getTransactionsByVendor(vendorId) {
        this.requireUser();
        const transactions = this.getTransactions();
        return transactions.filter(transaction => transaction.vendorId === vendorId);
    }

    getTransactionsByProject(projectId) {
        this.requireUser();
        const transactions = this.getTransactions();
        return transactions.filter(transaction => transaction.projectId === projectId);
    }

    getProjectsByStatus(status) {
        this.requireUser();
        const projects = this.getProjects();
        return projects.filter(project => project.status === status);
    }

    // Data export/import
    exportData() {
        this.requireUser();
        return {
            vendors: this.getVendors(),
            transactions: this.getTransactions(),
            projects: this.getProjects(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            userId: this.currentUserId
        };
    }

    importData(data) {
        this.requireUser();
        if (data.vendors) this.saveVendors(data.vendors);
        if (data.transactions) this.saveTransactions(data.transactions);
        if (data.projects) this.saveProjects(data.projects);
        if (data.settings) this.saveSettings(data.settings);
        
        // Update vendor totals after import
        this.updateVendorTotals();
        return true;
    }
}