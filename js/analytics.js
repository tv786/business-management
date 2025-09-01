// Analytics and dashboard functionality
import { formatCurrency, formatDate } from './utils.js';

export class AnalyticsManager {
    constructor(storage) {
        this.storage = storage;
        this.charts = {};
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
        this.updateAnalytics();
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

    updateAnalytics() {
        this.updateFinancialAnalytics();
        this.updateTransactionAnalytics();
        this.updateVendorAnalytics();
        this.updateProjectAnalytics();
        this.updateTimeAnalytics();
        this.updateCategoryAnalytics();
    }

    updateFinancialAnalytics() {
        const transactions = this.getTransactionsForPeriod();
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netProfit = income - expenses;
        const profitMargin = income > 0 ? ((netProfit / income) * 100).toFixed(1) : 0;
        const avgTransaction = transactions.length > 0 ? (income + expenses) / transactions.length : 0;
        
        const period = document.getElementById('dashboard-period').value;
        const daysInPeriod = this.getDaysInPeriod(period);
        const dailyAvgIncome = daysInPeriod > 0 ? income / daysInPeriod : 0;
        const dailyAvgExpenses = daysInPeriod > 0 ? expenses / daysInPeriod : 0;
        
        document.getElementById('net-profit').textContent = formatCurrency(netProfit);
        document.getElementById('profit-margin').textContent = profitMargin + '%';
        document.getElementById('avg-transaction').textContent = formatCurrency(avgTransaction);
        document.getElementById('daily-avg-income').textContent = formatCurrency(dailyAvgIncome);
        document.getElementById('daily-avg-expenses').textContent = formatCurrency(dailyAvgExpenses);
    }

    updateTransactionAnalytics() {
        const transactions = this.getTransactionsForPeriod();
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        const largestIncome = incomeTransactions.length > 0 ? Math.max(...incomeTransactions.map(t => t.amount)) : 0;
        const largestExpense = expenseTransactions.length > 0 ? Math.max(...expenseTransactions.map(t => t.amount)) : 0;
        
        document.getElementById('total-transactions').textContent = transactions.length;
        document.getElementById('income-transactions').textContent = incomeTransactions.length;
        document.getElementById('expense-transactions').textContent = expenseTransactions.length;
        document.getElementById('largest-income').textContent = formatCurrency(largestIncome);
        document.getElementById('largest-expense').textContent = formatCurrency(largestExpense);
    }

    updateVendorAnalytics() {
        const vendors = this.storage.getVendors();
        const transactions = this.getTransactionsForPeriod();
        const activeVendors = vendors.filter(v => v.status === 'active').length;
        const inactiveVendors = vendors.filter(v => v.status === 'inactive').length;
        
        // Calculate vendor spending
        const vendorSpending = {};
        const vendorTransactionCount = {};
        transactions.filter(t => t.type === 'expense' && t.vendorId).forEach(transaction => {
            const vendor = vendors.find(v => v.id === transaction.vendorId);
            if (vendor) {
                vendorSpending[vendor.name] = (vendorSpending[vendor.name] || 0) + transaction.amount;
                vendorTransactionCount[vendor.name] = (vendorTransactionCount[vendor.name] || 0) + 1;
            }
        });
        
        const topVendorSpending = Object.keys(vendorSpending).length > 0 ? Math.max(...Object.values(vendorSpending)) : 0;
        const avgVendorSpending = Object.keys(vendorSpending).length > 0 ? 
            Object.values(vendorSpending).reduce((a, b) => a + b, 0) / Object.keys(vendorSpending).length : 0;
        
        const mostActiveVendor = Object.keys(vendorTransactionCount).length > 0 ?
            Object.entries(vendorTransactionCount).reduce((a, b) => a[1] > b[1] ? a : b)[0] : '-';
        
        document.getElementById('active-vendors').textContent = activeVendors;
        document.getElementById('inactive-vendors').textContent = inactiveVendors;
        document.getElementById('top-vendor-spending').textContent = formatCurrency(topVendorSpending);
        document.getElementById('avg-vendor-spending').textContent = formatCurrency(avgVendorSpending);
        document.getElementById('most-active-vendor').textContent = mostActiveVendor;
    }

    updateProjectAnalytics() {
        const projects = this.storage.getProjects();
        const transactions = this.getTransactionsForPeriod();
        
        const planningProjects = projects.filter(p => p.status === 'planning').length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;
        const onHoldProjects = projects.filter(p => p.status === 'on-hold').length;
        
        // Calculate project values from transactions
        const projectValues = {};
        transactions.forEach(transaction => {
            if (transaction.projectId) {
                projectValues[transaction.projectId] = (projectValues[transaction.projectId] || 0) + 
                    (transaction.type === 'income' ? transaction.amount : -transaction.amount);
            }
        });
        
        const totalProjectValue = Object.values(projectValues).reduce((sum, val) => sum + Math.abs(val), 0);
        const avgProjectCost = projects.length > 0 ? totalProjectValue / projects.length : 0;
        
        document.getElementById('planning-projects').textContent = planningProjects;
        document.getElementById('completed-projects').textContent = completedProjects;
        document.getElementById('onhold-projects').textContent = onHoldProjects;
        document.getElementById('total-project-value').textContent = formatCurrency(totalProjectValue);
        document.getElementById('avg-project-cost').textContent = formatCurrency(avgProjectCost);
    }

    updateTimeAnalytics() {
        const period = document.getElementById('dashboard-period').value;
        const transactions = this.getTransactionsForPeriod();
        const daysInPeriod = this.getDaysInPeriod(period);
        
        // Get unique transaction dates
        const transactionDates = [...new Set(transactions.map(t => t.date))];
        const transactionDays = transactionDates.length;
        const transactionsPerDay = transactionDays > 0 ? (transactions.length / transactionDays).toFixed(1) : 0;
        
        // Get last transaction date
        const allTransactions = this.storage.getTransactions();
        const lastTransaction = allTransactions.length > 0 ? 
            allTransactions.reduce((latest, t) => new Date(t.date) > new Date(latest.date) ? t : latest) : null;
        const lastTransactionDate = lastTransaction ? formatDate(lastTransaction.date) : '-';
        
        // Business activity level
        const activityLevel = transactionDays / daysInPeriod;
        let businessActivity = 'Low';
        if (activityLevel > 0.7) businessActivity = 'High';
        else if (activityLevel > 0.4) businessActivity = 'Medium';
        
        document.getElementById('days-in-period').textContent = daysInPeriod;
        document.getElementById('transaction-days').textContent = transactionDays;
        document.getElementById('transactions-per-day').textContent = transactionsPerDay;
        document.getElementById('last-transaction-date').textContent = lastTransactionDate;
        document.getElementById('business-activity').textContent = businessActivity;
    }

    updateCategoryAnalytics() {
        const transactions = this.getTransactionsForPeriod();
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        // Calculate category totals
        const categoryTotals = {};
        expenseTransactions.forEach(transaction => {
            const category = transaction.category || 'other';
            categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
        });
        
        // Find top category
        const topCategory = Object.keys(categoryTotals).length > 0 ?
            Object.entries(categoryTotals).reduce((a, b) => a[1] > b[1] ? a : b) : ['-', 0];
        
        // Specific category costs
        const materialsCost = categoryTotals['materials'] || 0;
        const laborCost = categoryTotals['labor'] || 0;
        const transportCost = categoryTotals['transport'] || 0;
        
        document.getElementById('top-expense-category').textContent = this.formatCategoryName(topCategory[0]);
        document.getElementById('top-category-amount').textContent = formatCurrency(topCategory[1]);
        document.getElementById('materials-cost').textContent = formatCurrency(materialsCost);
        document.getElementById('labor-cost').textContent = formatCurrency(laborCost);
        document.getElementById('transport-cost').textContent = formatCurrency(transportCost);
    }

    getDaysInPeriod(period) {
        const now = new Date();
        switch (period) {
            case 'week': return 7;
            case 'month': return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            case 'quarter': return 90;
            case 'year': return 365;
            default: return 30;
        }
    }

    formatCategoryName(category) {
        if (category === '-') return '-';
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/[-_]/g, ' ');
    }
}
