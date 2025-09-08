// Transaction management functionality
import { showToast, formatCurrency, formatDate, formatDateWithTime, pickContact, isContactPickerSupported } from './utils.js';

export class TransactionManager {
    constructor(storage) {
        this.storage = storage;
        this.currentTransaction = null;
        this.sortColumn = 'date';
        this.sortDirection = 'desc';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModal();
    }

    setupEventListeners() {
        // Add transaction button
        document.getElementById('add-transaction-btn').addEventListener('click', () => {
            this.showTransactionModal();
        });

        // Quick add income button
        document.getElementById('add-income-btn').addEventListener('click', () => {
            this.showTransactionModal('income');
        });

        // Quick add expense button
        document.getElementById('add-expense-btn').addEventListener('click', () => {
            this.showTransactionModal('expense');
        });

        // Quick add credit button
        document.getElementById('add-credit-btn').addEventListener('click', () => {
            this.showTransactionModal('credit');
        });

        // Quick add partial button
        document.getElementById('add-partial-btn').addEventListener('click', () => {
            this.showTransactionModal('partial');
        });

        // Search functionality
        document.getElementById('transaction-search').addEventListener('input', () => {
            this.filterTransactions();
        });

        // Filter functionality
        document.getElementById('transaction-type-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-vendor-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-project-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-date-from').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-date-to').addEventListener('change', () => {
            this.filterTransactions();
        });

        // New filter event listeners
        document.getElementById('transaction-category-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('transaction-payment-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        // Table sorting
        document.querySelectorAll('#transactions-table th[data-sort]').forEach(th => {
            th.addEventListener('click', (e) => {
                const column = e.currentTarget.dataset.sort;
                this.sortTransactions(column);
            });
        });
    }

    setupModal() {
        // Create transaction modal if it doesn't exist
        this.createTransactionModal();
    }

    createTransactionModal() {
        const existingModal = document.getElementById('transaction-modal');
        if (existingModal) return;

        const modalHTML = `
            <div class="modal" id="transaction-modal">
                <div class="modal-header">
                    <h3 id="transaction-modal-title">Add Transaction</h3>
                    <button class="btn-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="transaction-form" class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="transaction-type">Type *</label>
                            <select id="transaction-type" required>
                                <option value="">Select Type</option>
                                <option value="income">You Got</option>
                                <option value="expense">You Give</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="transaction-date">Date & Time *</label>
                            <input type="datetime-local" id="transaction-date" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="transaction-vendor">Vendor</label>
                            <div class="input-with-quick-add">
                                <select id="transaction-vendor">
                                    <option value="">Select Vendor</option>
                                </select>
                                <button type="button" class="btn-quick-add" id="quick-add-vendor" title="Add New Vendor">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="transaction-project">Project</label>
                            <div class="input-with-quick-add">
                                <select id="transaction-project">
                                    <option value="">Select Project</option>
                                </select>
                                <button type="button" class="btn-quick-add" id="quick-add-project" title="Add New Project">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="transaction-amount">Amount *</label>
                            <input type="number" id="transaction-amount" step="0.01" min="0" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="transaction-category">Category</label>
                            <select id="transaction-category">
                                <option value="">Select Category</option>
                                <option value="materials">Materials</option>
                                <option value="labor">Labor</option>
                                <option value="equipment">Equipment</option>
                                <option value="transport">Transport</option>
                                <option value="utilities">Utilities</option>
                                <option value="permits">Permits & Licenses</option>
                                <option value="consultation">Consultation</option>
                                <option value="rental">Rental</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="payment">Client Payment</option>
                                <option value="advance">Advance Payment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Payment Method</label>
                        <div class="radio-group" id="transaction-payment-method">
                            <label class="radio-option">
                                <input type="radio" name="payment-method" value="cash">
                                <span class="radio-label">Cash</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="payment-method" value="check">
                                <span class="radio-label">Check</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="payment-method" value="upi">
                                <span class="radio-label">UPI</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="payment-method" value="bank-transfer">
                                <span class="radio-label">Bank Transfer</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="payment-method" value="card">
                                <span class="radio-label">Card</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="payment-method" value="credit">
                                <span class="radio-label">Credit (Pay Later)</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="transaction-payment-status">Payment Status</label>
                        <select id="transaction-payment-status">
                            <option value="paid">Paid</option>
                            <option value="credit">Credit (Unpaid)</option>
                            <option value="partial">Partially Paid</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="amount-paid-group" style="display: none;">
                        <label for="transaction-amount-paid">Amount Paid</label>
                        <input type="number" id="transaction-amount-paid" step="0.01" min="0" placeholder="Enter amount already paid">
                    </div>
                    
                    <div class="form-group" id="due-date-group" style="display: none;">
                        <label for="transaction-due-date">Due Date</label>
                        <input type="date" id="transaction-due-date">
                    </div>
                    
                    <div class="form-group">
                        <label for="transaction-description">Description</label>
                        <textarea id="transaction-description" rows="3"></textarea>
                    </div>
                    
                    <div class="form-group" style="display: none;">
                        <label for="transaction-notes">Notes</label>
                        <textarea id="transaction-notes" rows="2"></textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Transaction</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('modal-overlay').insertAdjacentHTML('beforeend', modalHTML);

        // Setup form submission
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        // Setup quick add buttons
        document.getElementById('quick-add-vendor').addEventListener('click', () => {
            this.showQuickAddVendorModal();
        });

        document.getElementById('quick-add-project').addEventListener('click', () => {
            this.showQuickAddProjectModal();
        });

        // Set default date to today
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        
        // Setup payment status change handler
        document.getElementById('transaction-payment-status').addEventListener('change', (e) => {
            this.handlePaymentStatusChange(e.target.value);
        });
    }

    handlePaymentStatusChange(status) {
        const amountPaidGroup = document.getElementById('amount-paid-group');
        const dueDateGroup = document.getElementById('due-date-group');
        
        if (status === 'partial') {
            amountPaidGroup.style.display = 'block';
            dueDateGroup.style.display = 'block';
        } else if (status === 'credit') {
            amountPaidGroup.style.display = 'none';
            dueDateGroup.style.display = 'block';
        } else {
            amountPaidGroup.style.display = 'none';
            dueDateGroup.style.display = 'none';
        }
    }

    showQuickAddVendorModal() {
        const existingModal = document.getElementById('quick-vendor-modal');
        if (existingModal) existingModal.remove();

        const contactPickerSupported = isContactPickerSupported();
        
        const modalHTML = `
            <div class="modal-overlay" id="quick-vendor-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Quick Add Vendor</h3>
                        <button class="btn-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                    </div>
                <form id="quick-vendor-form" class="modal-body">
                    <div class="form-group">
                        <label for="quick-vendor-name">Vendor Name *</label>
                        <div class="contact-picker-wrapper">
                            <input type="text" id="quick-vendor-name" required>
                            ${contactPickerSupported ? `
                                <button type="button" class="btn-contact-picker" id="vendor-contact-picker">
                                    <i class="fas fa-address-book"></i>
                                    Pick from Contacts
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="quick-vendor-phone">Phone Number</label>
                        <input type="tel" id="quick-vendor-phone">
                    </div>
                    
                    <div class="form-group">
                        <label for="quick-vendor-category">Category</label>
                        <select id="quick-vendor-category">
                            <option value="">Select Category</option>
                            <option value="supplier">Supplier</option>
                            <option value="contractor">Contractor</option>
                            <option value="service-provider">Service Provider</option>
                            <option value="consultant">Consultant</option>
                            <option value="client">Client</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Add Vendor</button>
                    </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show the modal with animation
        setTimeout(() => {
            document.getElementById('quick-vendor-modal').classList.add('show');
        }, 10);

        // Setup contact picker for vendor
        if (contactPickerSupported) {
            document.getElementById('vendor-contact-picker').addEventListener('click', async () => {
                const contact = await pickContact();
                if (contact) {
                    document.getElementById('quick-vendor-name').value = contact.name;
                    document.getElementById('quick-vendor-phone').value = contact.phone;
                }
            });
        }

        // Setup form submission
        document.getElementById('quick-vendor-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveQuickVendor();
        });
    }

    showQuickAddProjectModal() {
        const existingModal = document.getElementById('quick-project-modal');
        if (existingModal) existingModal.remove();

        const contactPickerSupported = isContactPickerSupported();
        
        const modalHTML = `
            <div class="modal-overlay" id="quick-project-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Quick Add Project</h3>
                        <button class="btn-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                    </div>
                <form id="quick-project-form" class="modal-body">
                    <div class="form-group">
                        <label for="quick-project-name">Project Name *</label>
                        <input type="text" id="quick-project-name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="quick-project-client">Client Name</label>
                        <div class="contact-picker-wrapper">
                            <input type="text" id="quick-project-client">
                            ${contactPickerSupported ? `
                                <button type="button" class="btn-contact-picker" id="project-contact-picker">
                                    <i class="fas fa-address-book"></i>
                                    Pick from Contacts
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="quick-project-phone">Client Phone</label>
                        <input type="tel" id="quick-project-phone">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="quick-project-type">Project Type</label>
                            <select id="quick-project-type">
                                <option value="">Select Type</option>
                                <option value="construction">Construction</option>
                                <option value="renovation">Renovation</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="consultation">Consultation</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="quick-project-budget">Budget</label>
                            <input type="number" id="quick-project-budget" step="0.01" min="0">
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Add Project</button>
                    </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show the modal with animation
        setTimeout(() => {
            document.getElementById('quick-project-modal').classList.add('show');
        }, 10);

        // Setup contact picker for project client
        if (contactPickerSupported) {
            document.getElementById('project-contact-picker').addEventListener('click', async () => {
                const contact = await pickContact();
                if (contact) {
                    document.getElementById('quick-project-client').value = contact.name;
                    document.getElementById('quick-project-phone').value = contact.phone;
                }
            });
        }

        // Setup form submission
        document.getElementById('quick-project-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveQuickProject();
        });
    }

    saveQuickVendor() {
        const vendorData = {
            name: document.getElementById('quick-vendor-name').value.trim(),
            phone: document.getElementById('quick-vendor-phone').value.trim(),
            category: document.getElementById('quick-vendor-category').value,
            status: 'active',
            email: '',
            address: '',
            notes: 'Added via quick add during transaction creation'
        };

        if (!vendorData.name) {
            showToast('Please enter a vendor name', 'error');
            return;
        }

        const savedVendor = this.storage.addVendor(vendorData);
        if (savedVendor) {
            showToast('Vendor added successfully', 'success');
            
            // Close modal
            document.getElementById('quick-vendor-modal').remove();
            
            // Refresh vendor dropdown and select the new vendor
            this.populateFilterDropdowns();
            document.getElementById('transaction-vendor').value = savedVendor.id;
        } else {
            showToast('Failed to add vendor', 'error');
        }
    }

    saveQuickProject() {
        const projectData = {
            name: document.getElementById('quick-project-name').value.trim(),
            client: document.getElementById('quick-project-client').value.trim(),
            clientPhone: document.getElementById('quick-project-phone').value.trim(),
            type: document.getElementById('quick-project-type').value,
            budget: parseFloat(document.getElementById('quick-project-budget').value) || null,
            status: 'planning',
            progress: 0,
            location: '',
            startDate: '',
            endDate: '',
            clientContact: '',
            description: 'Created via quick add during transaction creation',
            notes: ''
        };

        if (!projectData.name) {
            showToast('Please enter a project name', 'error');
            return;
        }

        const savedProject = this.storage.addProject(projectData);
        if (savedProject) {
            showToast('Project added successfully', 'success');
            
            // Close modal
            document.getElementById('quick-project-modal').remove();
            
            // Refresh project dropdown and select the new project
            this.populateFilterDropdowns();
            document.getElementById('transaction-project').value = savedProject.id;
        } else {
            showToast('Failed to add project', 'error');
        }
    }

    loadTransactions() {
        this.populateFilterDropdowns();
        this.renderTransactionsTable();
    }

    populateFilterDropdowns() {
        // Populate vendor filter
        const vendors = this.storage.getVendors();
        const vendorFilter = document.getElementById('transaction-vendor-filter');
        const vendorSelect = document.getElementById('transaction-vendor');
        
        [vendorFilter, vendorSelect].forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = select.id.includes('filter') ? 
                    '<option value="">All Vendors</option>' : 
                    '<option value="">Select Vendor</option>';
                
                vendors.forEach(vendor => {
                    select.innerHTML += `<option value="${vendor.id}">${vendor.name}</option>`;
                });
                
                select.value = currentValue;
            }
        });

        // Populate project filter
        const projects = this.storage.getProjects();
        const projectFilter = document.getElementById('transaction-project-filter');
        const projectSelect = document.getElementById('transaction-project');
        
        [projectFilter, projectSelect].forEach(select => {
            if (select) {
                const currentValue = select.value;
                select.innerHTML = select.id.includes('filter') ? 
                    '<option value="">All Projects</option>' : 
                    '<option value="">Select Project</option>';
                
                projects.forEach(project => {
                    select.innerHTML += `<option value="${project.id}">${project.name}</option>`;
                });
                
                select.value = currentValue;
            }
        });
    }

    renderTransactionsTable() {
        const transactions = this.getFilteredTransactions();
        const tbody = document.getElementById('transactions-table-body');
        
        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <div class="empty-state">
                            <i class="fas fa-receipt"></i>
                            <h3>No Transactions Found</h3>
                            <p>Add your first transaction to get started</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = transactions.map(transaction => {
            const vendor = this.storage.getVendorById(transaction.vendorId);
            const project = this.storage.getProjectById(transaction.projectId);
            const paymentStatus = transaction.paymentStatus || 'paid';
            const outstandingAmount = transaction.outstandingAmount || 0;
            
            // Get payment status display and color
            const getPaymentStatusDisplay = (status) => {
                switch(status) {
                    case 'paid': return '<span class="payment-status paid"><i class="fas fa-check-circle"></i> Paid</span>';
                    case 'credit': return '<span class="payment-status credit"><i class="fas fa-clock"></i> Credit</span>';
                    case 'partial': return '<span class="payment-status partial"><i class="fas fa-hourglass-half"></i> Partial</span>';
                    default: return '<span class="payment-status paid"><i class="fas fa-check-circle"></i> Paid</span>';
                }
            };
            
            return `
                <tr data-transaction-id="${transaction.id}" class="${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}">
                    <td>${formatDateWithTime(transaction.date)}</td>
                    
                    <td>${vendor ? vendor.name : 'N/A'}</td>
                    <td>${project ? project.name : 'N/A'}</td>
                    <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                        <strong>${formatCurrency(transaction.amount)}</strong> <br/>
                        <p class="payment-status">${getPaymentStatusDisplay(paymentStatus)}</p>
                    </td>
                    
                    <td class="text-danger">
                        ${outstandingAmount > 0 ? `<strong>${formatCurrency(outstandingAmount)}</strong>` : '-'}
                    </td>
                    <td><span class="payment-method">${transaction.paymentMethod || 'N/A'}</span></td>
                    <td>
                        <div class="transaction-desc">
                            ${transaction.description}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            ${outstandingAmount > 0 ? `
                                <button class="action-btn pay" onclick="transactionManager.markAsPaid('${transaction.id}')" title="Mark as Paid">
                                    <i class="fas fa-dollar-sign"></i>
                                </button>
                            ` : ''}
                            <button class="action-btn view" onclick="transactionManager.viewTransaction('${transaction.id}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" onclick="transactionManager.editTransaction('${transaction.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="transactionManager.deleteTransaction('${transaction.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Update transaction summary
        this.updateTransactionSummary(transactions);

        // Make transactionManager globally available
        window.transactionManager = this;
    }

    getFilteredTransactions() {
        let transactions = this.storage.getTransactions();
        
        // Apply search filter
        const searchTerm = document.getElementById('transaction-search').value.toLowerCase();
        if (searchTerm) {
            transactions = transactions.filter(transaction => {
                const vendor = this.storage.getVendorById(transaction.vendorId);
                const project = this.storage.getProjectById(transaction.projectId);
                
                return transaction.description.toLowerCase().includes(searchTerm) ||
                       (vendor && vendor.name.toLowerCase().includes(searchTerm)) ||
                       (project && project.name.toLowerCase().includes(searchTerm)) ||
                       (transaction.category && transaction.category.toLowerCase().includes(searchTerm)) ||
                       (transaction.paymentMethod && transaction.paymentMethod.toLowerCase().includes(searchTerm));
            });
        }

        // Apply type filter
        const typeFilter = document.getElementById('transaction-type-filter').value;
        if (typeFilter) {
            transactions = transactions.filter(transaction => transaction.type === typeFilter);
        }

        // Apply vendor filter
        const vendorFilter = document.getElementById('transaction-vendor-filter').value;
        if (vendorFilter) {
            transactions = transactions.filter(transaction => transaction.vendorId === vendorFilter);
        }

        // Apply project filter
        const projectFilter = document.getElementById('transaction-project-filter').value;
        if (projectFilter) {
            transactions = transactions.filter(transaction => transaction.projectId === projectFilter);
        }

        // Apply date range filter
        const dateFrom = document.getElementById('transaction-date-from').value;
        const dateTo = document.getElementById('transaction-date-to').value;
        
        if (dateFrom) {
            transactions = transactions.filter(transaction => transaction.date >= dateFrom);
        }
        
        if (dateTo) {
            transactions = transactions.filter(transaction => transaction.date <= dateTo);
        }

        // Apply category filter
        const categoryFilter = document.getElementById('transaction-category-filter').value;
        if (categoryFilter) {
            transactions = transactions.filter(transaction => transaction.category === categoryFilter);
        }

        // Apply payment method filter
        const paymentFilter = document.getElementById('transaction-payment-filter').value;
        if (paymentFilter) {
            transactions = transactions.filter(transaction => transaction.paymentMethod === paymentFilter);
        }

        // Apply sorting
        transactions.sort((a, b) => {
            let aValue = a[this.sortColumn];
            let bValue = b[this.sortColumn];
            
            // Handle different data types
            if (this.sortColumn === 'amount') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            } else if (this.sortColumn === 'date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else if (this.sortColumn === 'vendor') {
                const vendorA = this.storage.getVendorById(a.vendorId);
                const vendorB = this.storage.getVendorById(b.vendorId);
                aValue = vendorA ? vendorA.name.toLowerCase() : '';
                bValue = vendorB ? vendorB.name.toLowerCase() : '';
            } else if (this.sortColumn === 'project') {
                const projectA = this.storage.getProjectById(a.projectId);
                const projectB = this.storage.getProjectById(b.projectId);
                aValue = projectA ? projectA.name.toLowerCase() : '';
                bValue = projectB ? projectB.name.toLowerCase() : '';
            } else {
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
            }
            
            if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return transactions;
    }

    sortTransactions(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Update sort indicators
        document.querySelectorAll('#transactions-table th[data-sort] i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });

        const currentTh = document.querySelector(`#transactions-table th[data-sort="${column}"] i`);
        currentTh.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'}`;

        this.renderTransactionsTable();
    }

    filterTransactions() {
        this.renderTransactionsTable();
    }

    updateTransactionSummary(filteredTransactions) {
        const allTransactions = this.storage.getTransactions();
        
        // Calculate totals for all transactions
        const totalIncome = allTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        const totalExpense = allTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        const netAmount = totalIncome - totalExpense;
        
        // Calculate filtered total
        const filteredTotal = filteredTransactions
            .reduce((sum, t) => {
                const amount = parseFloat(t.amount || 0);
                return t.type === 'income' ? sum + amount : sum - amount;
            }, 0);
        
        // Calculate outstanding credit amounts
        const outstandingTotal = allTransactions
            .filter(t => t.paymentStatus === 'credit' || t.paymentStatus === 'partial')
            .reduce((sum, t) => sum + parseFloat(t.outstandingAmount || 0), 0);
        
        // Update summary display
        document.getElementById('total-income').textContent = formatCurrency(totalIncome);
        document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
        document.getElementById('net-amount').textContent = formatCurrency(netAmount);
        document.getElementById('net-amount').className = `summary-value ${netAmount >= 0 ? 'income' : 'expense'}`;
        document.getElementById('filtered-total').textContent = formatCurrency(Math.abs(filteredTotal));
        
        // Update outstanding total if element exists
        const outstandingElement = document.getElementById('outstanding-total');
        if (outstandingElement) {
            outstandingElement.textContent = formatCurrency(outstandingTotal);
        }
    }

    showTransactionModal(transactionOrType = null) {
        // Check authentication
        if (!this.storage.requireAuth()) {
            showToast('Please login to manage transactions', 'warning');
            return;
        }
        
        // Handle different parameter types
        let transaction = null;
        let presetType = null;
        
        if (typeof transactionOrType === 'string') {
            // Parameter is a transaction type for quick add
            presetType = transactionOrType;
        } else if (transactionOrType && typeof transactionOrType === 'object') {
            // Parameter is a transaction object for editing
            transaction = transactionOrType;
        }
        
        this.currentTransaction = transaction;
        const title = transaction ? 'Edit Transaction' : 'Add Transaction';
        
        document.getElementById('transaction-modal-title').textContent = title;
        
        // Populate dropdowns
        this.populateFilterDropdowns();
        
        // Reset form
        document.getElementById('transaction-form').reset();
        
        // Set default date to today if adding new
        if (!transaction) {
            // Set to current date with current time
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            document.getElementById('transaction-date').value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        // Set preset type if it's a quick add
        if (presetType) {
            if (presetType === 'credit' || presetType === 'partial') {
                // For credit and partial, set as expense by default
                document.getElementById('transaction-type').value = 'expense';
                // Set the payment status
                document.getElementById('transaction-payment-status').value = presetType;
                // Trigger the payment status change handler
                this.handlePaymentStatusChange(presetType);
            } else {
                document.getElementById('transaction-type').value = presetType;
            }
        }
        
        // Populate form if editing
        if (transaction) {
            document.getElementById('transaction-type').value = transaction.type || '';
            document.getElementById('transaction-date').value = transaction.date || '';
            document.getElementById('transaction-vendor').value = transaction.vendorId || '';
            document.getElementById('transaction-project').value = transaction.projectId || '';
            document.getElementById('transaction-amount').value = transaction.amount || '';
            document.getElementById('transaction-category').value = transaction.category || '';
            // Set payment method radio button
            const paymentMethodRadios = document.querySelectorAll('input[name="payment-method"]');
            paymentMethodRadios.forEach(radio => {
                radio.checked = radio.value === (transaction.paymentMethod || '');
            });
            document.getElementById('transaction-payment-status').value = transaction.paymentStatus || 'paid';
            document.getElementById('transaction-amount-paid').value = transaction.amountPaid || '';
            document.getElementById('transaction-due-date').value = transaction.dueDate || '';
            document.getElementById('transaction-description').value = transaction.description || '';
            document.getElementById('transaction-notes').value = transaction.notes || '';
            
            // Trigger payment status change to show/hide appropriate fields
            this.handlePaymentStatusChange(transaction.paymentStatus || 'paid');
        }
        
        window.showModal('transaction-modal');
    }

    saveTransaction() {
        const paymentStatus = document.getElementById('transaction-payment-status').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const amountPaid = paymentStatus === 'partial' ? parseFloat(document.getElementById('transaction-amount-paid').value) || 0 : (paymentStatus === 'paid' ? amount : 0);
        
        const transactionData = {
            type: document.getElementById('transaction-type').value,
            date: document.getElementById('transaction-date').value,
            vendorId: document.getElementById('transaction-vendor').value || null,
            projectId: document.getElementById('transaction-project').value || null,
            amount: amount,
            category: document.getElementById('transaction-category').value,
            paymentMethod: document.querySelector('input[name="payment-method"]:checked')?.value || '',
            paymentStatus: paymentStatus,
            amountPaid: amountPaid,
            outstandingAmount: amount - amountPaid,
            dueDate: document.getElementById('transaction-due-date').value || null,
            description: document.getElementById('transaction-description').value.trim() || '-',
            notes: document.getElementById('transaction-notes').value.trim()
        };

        // Validate required fields
        if (!transactionData.type || !transactionData.date || !transactionData.amount) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate amount
        if (transactionData.amount <= 0) {
            showToast('Amount must be greater than zero', 'error');
            return;
        }
        
        // Validate partial payment amount
        if (transactionData.paymentStatus === 'partial' && transactionData.amountPaid >= transactionData.amount) {
            showToast('Amount paid cannot be greater than or equal to total amount', 'error');
            return;
        }

        try {
            let result;
            if (this.currentTransaction) {
                result = this.storage.updateTransaction(this.currentTransaction.id, transactionData);
                showToast('Transaction updated successfully', 'success');
            } else {
                result = this.storage.addTransaction(transactionData);
                showToast('Transaction added successfully', 'success');
            }

            if (result) {
                window.closeModal();
                this.renderTransactionsTable();
                
                // Refresh analytics if on dashboard
                if (window.app && window.app.analytics) {
                    window.app.analytics.loadDashboard();
                }
            } else {
                showToast('Failed to save transaction', 'error');
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
            showToast('Failed to save transaction', 'error');
        }
    }

    viewTransaction(transactionId) {
        const transaction = this.storage.getTransactionById(transactionId);
        if (!transaction) {
            showToast('Transaction not found', 'error');
            return;
        }

        const vendor = this.storage.getVendorById(transaction.vendorId);
        const project = this.storage.getProjectById(transaction.projectId);
        
        const modalContent = `
            <div class="transaction-details">
                <div class="transaction-header">
                    <h3>${transaction.description}</h3>
                    <span class="status-badge ${transaction.type}">${transaction.type}</span>
                </div>
                
                <div class="transaction-info-grid">
                    <div class="info-item">
                        <label>Amount:</label>
                        <span class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                            <strong>${formatCurrency(transaction.amount)}</strong>
                        </span>
                    </div>
                    
                    <div class="info-item">
                        <label>Date & Time:</label>
                        <span>${formatDateWithTime(transaction.date)}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Category:</label>
                        <span>${transaction.category || 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Vendor:</label>
                        <span>${vendor ? vendor.name : 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Project:</label>
                        <span>${project ? project.name : 'N/A'}</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Created:</label>
                        <span>${formatDate(transaction.createdAt)}</span>
                    </div>
                </div>
                
                ${transaction.notes ? `
                    <div class="info-item">
                        <label>Notes:</label>
                        <p>${transaction.notes}</p>
                    </div>
                ` : ''}
                
                <div class="transaction-actions">
                    <button class="btn btn-primary" onclick="transactionManager.editTransaction('${transaction.id}')">
                        <i class="fas fa-edit"></i> Edit Transaction
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showInfoModal('Transaction Details', modalContent);
    }

    editTransaction(transactionId) {
        const transaction = this.storage.getTransactionById(transactionId);
        if (!transaction) {
            showToast('Transaction not found', 'error');
            return;
        }
        
        this.showTransactionModal(transaction);
    }

    deleteTransaction(transactionId) {
        const transaction = this.storage.getTransactionById(transactionId);
        if (!transaction) {
            showToast('Transaction not found', 'error');
            return;
        }

        const confirmMessage = `Are you sure you want to delete this ${transaction.type} transaction of ${formatCurrency(transaction.amount)}?`;

        if (confirm(confirmMessage)) {
            try {
                this.storage.deleteTransaction(transactionId);
                showToast('Transaction deleted successfully', 'success');
                this.renderTransactionsTable();
                
                // Refresh analytics if on dashboard
                if (window.app && window.app.analytics) {
                    window.app.analytics.loadDashboard();
                }
            } catch (error) {
                console.error('Error deleting transaction:', error);
                showToast('Failed to delete transaction', 'error');
            }
        }
    }

    showInfoModal(title, content) {
        // Create or update info modal
        let modal = document.getElementById('info-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'info-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-header">
                    <h3 id="info-modal-title"></h3>
                    <button class="btn-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body" id="info-modal-body"></div>
            `;
            document.getElementById('modal-overlay').appendChild(modal);
        }

        document.getElementById('info-modal-title').textContent = title;
        document.getElementById('info-modal-body').innerHTML = content;
        
        window.showModal('info-modal');
    }

    // Export transactions to CSV
    exportTransactionsToCSV() {
        const transactions = this.getFilteredTransactions();
        const headers = ['Date', 'Type', 'Vendor', 'Project', 'Amount', 'Category', 'Description', 'Notes'];
        
        const csvContent = [
            headers.join(','),
            ...transactions.map(transaction => {
                const vendor = this.storage.getVendorById(transaction.vendorId);
                const project = this.storage.getProjectById(transaction.projectId);
                
                return [
                    `"${transaction.date}"`,
                    `"${transaction.type}"`,
                    `"${vendor ? vendor.name : ''}"`,
                    `"${project ? project.name : ''}"`,
                    transaction.amount,
                    `"${transaction.category || ''}"`,
                    `"${transaction.description}"`,
                    `"${transaction.notes || ''}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Transactions exported to CSV', 'success');
    }

    markAsPaid(transactionId) {
        const transaction = this.storage.getTransactionById(transactionId);
        if (!transaction) {
            showToast('Transaction not found', 'error');
            return;
        }

        if (confirm(`Mark transaction "${transaction.description}" as fully paid?`)) {
            try {
                const updatedData = {
                    paymentStatus: 'paid',
                    amountPaid: transaction.amount,
                    outstandingAmount: 0
                };
                
                this.storage.updateTransaction(transactionId, updatedData);
                showToast('Transaction marked as paid', 'success');
                this.renderTransactionsTable();
                
                // Refresh analytics if on dashboard
                if (window.app && window.app.analytics) {
                    window.app.analytics.loadDashboard();
                }
            } catch (error) {
                console.error('Error marking transaction as paid:', error);
                showToast('Failed to update transaction', 'error');
            }
        }
    }
}
