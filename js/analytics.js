// Analytics and dashboard functionality
import { formatCurrency, formatDate } from './utils.js';

export class AnalyticsManager {
    constructor(storage) {
        this.storage = storage;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Dashboard period filter
        document.getElementById('dashboard-period').addEventListener('change', () => {
            this.loadDashboard();
        });
    }

    loadDashboard() {
        this.updateStatCards();
        this.updateSimpleAnalytics();
        this.renderRecentActivities();
    }

    updateStatCards() {
        const vendors = this.storage.getVendors();
        const projects = this.storage.getProjects();
        const transactions = this.getTransactionsForPeriod();
        
        // Total vendors
        document.getElementById('total-vendors').textContent = vendors.length;
        
        // Active projects
        const activeProjects = projects.filter(p => p.status === 'active').length;
        document.getElementById('active-projects').textContent = activeProjects;
        
        // Total income and expenses
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        document.getElementById('total-income').textContent = formatCurrency(income);
        document.getElementById('total-expenses').textContent = formatCurrency(expenses);
        
        // Update analytics display elements too
        const totalIncomeDisplay = document.getElementById('total-income-display');
        const totalExpensesDisplay = document.getElementById('total-expenses-display');
        if (totalIncomeDisplay) totalIncomeDisplay.textContent = formatCurrency(income);
        if (totalExpensesDisplay) totalExpensesDisplay.textContent = formatCurrency(expenses);
    }

    getTransactionsForPeriod() {
        const period = document.getElementById('dashboard-period').value;
        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterStart, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const transactions = this.storage.getTransactions();
        return transactions.filter(t => new Date(t.date) >= startDate);
    }

    updateSimpleAnalytics() {
        const transactions = this.getTransactionsForPeriod();
        const vendors = this.storage.getVendors();
        const projects = this.storage.getProjects();
        
        // Calculate basic metrics
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netProfit = income - expenses;
        
        // Count active vendors
        const activeVendors = vendors.filter(v => v.status === 'active').length;
        
        // Count projects by status
        const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning').length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;
        const totalProjectValue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
        
        // Find most active vendor
        const vendorTransactionCount = {};
        transactions.forEach(t => {
            if (t.vendorId) {
                vendorTransactionCount[t.vendorId] = (vendorTransactionCount[t.vendorId] || 0) + 1;
            }
        });
        
        let mostActiveVendor = '-';
        if (Object.keys(vendorTransactionCount).length > 0) {
            const mostActiveVendorId = Object.keys(vendorTransactionCount).reduce((a, b) => 
                vendorTransactionCount[a] > vendorTransactionCount[b] ? a : b
            );
            const vendor = vendors.find(v => v.id === mostActiveVendorId);
            mostActiveVendor = vendor ? vendor.name : '-';
        }
        
        // Update simplified analytics display
        this.updateElement('net-profit', formatCurrency(netProfit));
        this.updateElement('active-vendors', activeVendors);
        this.updateElement('planning-projects', activeProjects);
        this.updateElement('completed-projects', completedProjects);
        this.updateElement('total-project-value', formatCurrency(totalProjectValue));
        this.updateElement('total-transactions', transactions.length);
        this.updateElement('most-active-vendor', mostActiveVendor);
    }
    
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    renderRecentActivities() {
        const transactions = this.storage.getTransactions();
        const vendors = this.storage.getVendors();
        const projects = this.storage.getProjects();
        
        // Get recent transactions (last 10)
        const recentTransactions = transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
        
        const activitiesList = document.getElementById('recent-activities-list');
        if (!activitiesList) return;
        
        activitiesList.innerHTML = '';
        
        if (recentTransactions.length === 0) {
            activitiesList.innerHTML = '<p class="no-activities">No recent activities</p>';
            return;
        }
        
        recentTransactions.forEach(transaction => {
            const vendor = vendors.find(v => v.id === transaction.vendorId);
            const project = projects.find(p => p.id === transaction.projectId);
            
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const typeIcon = transaction.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down';
            const typeClass = transaction.type === 'income' ? 'income' : 'expense';
            
            activityItem.innerHTML = `
                <div class="activity-icon ${typeClass}">
                    <i class="fas ${typeIcon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${transaction.description || 'Transaction'}</div>
                    <div class="activity-details">
                        ${vendor ? vendor.name : ''} ${project ? '• ' + project.name : ''}
                    </div>
                    <div class="activity-date">${formatDate(transaction.date)}</div>
                </div>
                <div class="activity-amount ${typeClass}">
                    ${formatCurrency(transaction.amount)}
                </div>
            `;
            
            activitiesList.appendChild(activityItem);
        });
    }
}