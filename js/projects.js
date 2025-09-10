// Project management functionality
import { showToast, formatCurrency, formatDate } from './utils.js';

export class ProjectManager {
    constructor(storage) {
        this.storage = storage;
        this.currentProject = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupModal();
    }

    setupEventListeners() {
        // Add project button
        document.getElementById('add-project-btn').addEventListener('click', () => {
            this.showProjectModal();
        });

        // Search functionality
        document.getElementById('project-search').addEventListener('input', () => {
            this.filterProjects();
        });

        // Filter functionality
        document.getElementById('project-status-filter').addEventListener('change', () => {
            this.filterProjects();
        });
    }

    setupModal() {
        this.createProjectModal();
    }

    createProjectModal() {
        const existingModal = document.getElementById('project-modal');
        if (existingModal) return;

        const modalHTML = `
            <div class="modal" id="project-modal">
                <div class="modal-header">
                    <h3 id="project-modal-title">Add Project</h3>
                    <button class="btn-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="project-form" class="modal-body">
                    <div class="form-group">
                        <label for="project-name">Project Name *</label>
                        <input type="text" id="project-name" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="project-type">Type</label>
                            <select id="project-type">
                                <option value="">Select Type</option>
                                <option value="residential">Residential</option>
                                <option value="commercial">Commercial</option>
                                <option value="renovation">Renovation</option>
                                <option value="infrastructure">Infrastructure</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="project-status">Status</label>
                            <select id="project-status">
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                                <option value="on-hold">On Hold</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group" style="display: none;">
                        <label for="project-location">Location</label>
                        <input type="text" id="project-location">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="project-start-date">Start Date</label>
                            <input type="date" id="project-start-date">
                        </div>
                        
                        <div class="form-group">
                            <label for="project-end-date">End Date</label>
                            <input type="date" id="project-end-date">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="project-budget">Budget</label>
                            <input type="number" id="project-budget" step="0.01" min="0">
                        </div>
                        
                        <div class="form-group" style="display: none;">
                            <label for="project-progress">Progress (%)</label>
                            <input type="number" id="project-progress" min="0" max="100" value="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="project-client">Client</label>
                        <input type="text" id="project-client">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="project-client-contact">Client Contact</label>
                            <input type="text" id="project-client-contact">
                        </div>
                        
                        <div class="form-group">
                            <label for="project-client-phone">Client Phone</label>
                            <input type="tel" id="project-client-phone">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="project-description">Description</label>
                        <textarea id="project-description" rows="3"></textarea>
                    </div>
                    
                    <div class="form-group" style="display: none;">
                        <label for="project-notes">Notes</label>
                        <textarea id="project-notes" rows="2"></textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Project</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('modal-overlay').insertAdjacentHTML('beforeend', modalHTML);

        // Setup form submission
        document.getElementById('project-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProject();
        });
    }

    loadProjects() {
        this.renderProjectsGrid();
    }

    renderProjectsGrid() {
        const projects = this.getFilteredProjects();
        const grid = document.getElementById('projects-grid');
        
        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-hammer"></i>
                    <h3>No Projects Found</h3>
                    <p>Add your first project to get started</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = projects.map(project => {
            const transactions = this.storage.getTransactionsByProject(project.id);
            const totalSpent = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            return `
                <div class="project-card" data-project-id="${project.id}">
                    <div class="project-header">
                        <h3>${project.name}</h3>
                        <span class="status-badge ${project.status}">${project.status}</span>
                    </div>
                    
                    <div class="project-meta">
                        ${project.type ? `
                            <div class="project-meta-item">
                                <i class="fas fa-tag"></i>
                                <span>${project.type}</span>
                            </div>
                        ` : ''}
                        
                        ${project.location ? `
                            <div class="project-meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${project.location}</span>
                            </div>
                        ` : ''}
                        
                        ${project.client ? `
                            <div class="project-meta-item">
                                <i class="fas fa-user"></i>
                                <span>${project.client}</span>
                            </div>
                        ` : ''}
                        
                        ${project.startDate ? `
                            <div class="project-meta-item">
                                <i class="fas fa-calendar-start"></i>
                                <span>Start: ${formatDate(project.startDate)}</span>
                            </div>
                        ` : ''}
                        
                        ${project.endDate ? `
                            <div class="project-meta-item">
                                <i class="fas fa-calendar-end"></i>
                                <span>End: ${formatDate(project.endDate)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="project-progress" style="display: none;">
                        <div class="project-progress-label">
                            <span>Progress</span>
                            <span>${project.progress || 0}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${project.progress || 0}%"></div>
                        </div>
                    </div>
                    
                    <div class="project-financials">
                        <div class="financial-item">
                            <span class="financial-label">Budget:</span>
                            <span class="financial-value">${project.budget ? formatCurrency(project.budget) : 'N/A'}</span>
                        </div>
                        <div class="financial-item">
                            <span class="financial-label">Spent:</span>
                            <span class="financial-value text-danger">${formatCurrency(totalSpent)}</span>
                        </div>
                        <div class="financial-item">
                            <span class="financial-label">Income:</span>
                            <span class="financial-value text-success">${formatCurrency(totalIncome)}</span>
                        </div>
                        ${project.budget ? `
                            <div class="financial-item">
                                <span class="financial-label">Remaining:</span>
                                <span class="financial-value ${project.budget - totalSpent >= 0 ? 'text-success' : 'text-danger'}">
                                    ${formatCurrency(project.budget - totalSpent)}
                                </span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${project.description ? `
                        <div class="project-description">
                            <p>${project.description}</p>
                        </div>
                    ` : ''}
                    
                    <div class="project-actions">
                        <button class="btn btn-sm btn-primary" onclick="projectManager.viewPaymentHistory('${project.id}')">
                            <i class="fas fa-history"></i> Payments
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="projectManager.viewProject('${project.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="projectManager.editProject('${project.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="projectManager.deleteProject('${project.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Make projectManager globally available
        window.projectManager = this;
    }

    getFilteredProjects() {
        let projects = this.storage.getProjects();
        
        // Apply search filter
        const searchTerm = document.getElementById('project-search').value.toLowerCase();
        if (searchTerm) {
            projects = projects.filter(project =>
                project.name.toLowerCase().includes(searchTerm) ||
                project.description.toLowerCase().includes(searchTerm) ||
                project.location.toLowerCase().includes(searchTerm) ||
                project.client.toLowerCase().includes(searchTerm)
            );
        }

        // Apply status filter
        const statusFilter = document.getElementById('project-status-filter').value;
        if (statusFilter) {
            projects = projects.filter(project => project.status === statusFilter);
        }

        // Sort by creation date (newest first)
        projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return projects;
    }

    filterProjects() {
        this.renderProjectsGrid();
    }

    showProjectModal(project = null) {
        // Check authentication
        if (!this.storage.requireAuth()) {
            showToast('Please login to manage projects', 'warning');
            return;
        }
        this.currentProject = project;
        const title = project ? 'Edit Project' : 'Add Project';
        
        document.getElementById('project-modal-title').textContent = title;
        
        // Reset form
        document.getElementById('project-form').reset();
        
        // Populate form if editing
        if (project) {
            document.getElementById('project-name').value = project.name || '';
            document.getElementById('project-type').value = project.type || '';
            document.getElementById('project-status').value = project.status || 'planning';
            document.getElementById('project-location').value = project.location || '';
            document.getElementById('project-start-date').value = project.startDate || '';
            document.getElementById('project-end-date').value = project.endDate || '';
            document.getElementById('project-budget').value = project.budget || '';
            document.getElementById('project-progress').value = project.progress || 0;
            document.getElementById('project-client').value = project.client || '';
            document.getElementById('project-client-contact').value = project.clientContact || '';
            document.getElementById('project-client-phone').value = project.clientPhone || '';
            document.getElementById('project-description').value = project.description || '';
            document.getElementById('project-notes').value = project.notes || '';
        }
        
        window.showModal('project-modal');
    }

    saveProject() {
        const projectData = {
            name: document.getElementById('project-name').value.trim(),
            type: document.getElementById('project-type').value,
            status: document.getElementById('project-status').value,
            location: document.getElementById('project-location').value.trim(),
            startDate: document.getElementById('project-start-date').value,
            endDate: document.getElementById('project-end-date').value,
            budget: parseFloat(document.getElementById('project-budget').value) || null,
            progress: parseInt(document.getElementById('project-progress').value) || 0,
            client: document.getElementById('project-client').value.trim(),
            clientContact: document.getElementById('project-client-contact').value.trim(),
            clientPhone: document.getElementById('project-client-phone').value.trim(),
            description: document.getElementById('project-description').value.trim(),
            notes: document.getElementById('project-notes').value.trim()
        };

        // Validate required fields
        if (!projectData.name) {
            showToast('Please enter a project name', 'error');
            return;
        }

        // Validate date range
        if (projectData.startDate && projectData.endDate && projectData.startDate > projectData.endDate) {
            showToast('End date must be after start date', 'error');
            return;
        }

        // Validate progress
        if (projectData.progress < 0 || projectData.progress > 100) {
            showToast('Progress must be between 0 and 100', 'error');
            return;
        }

        try {
            let result;
            if (this.currentProject) {
                result = this.storage.updateProject(this.currentProject.id, projectData);
                showToast('Project updated successfully', 'success');
            } else {
                result = this.storage.addProject(projectData);
                showToast('Project added successfully', 'success');
            }

            if (result) {
                window.closeModal();
                this.renderProjectsGrid();
                
                // Refresh analytics if on dashboard
                if (window.app && window.app.analytics) {
                    window.app.analytics.loadDashboard();
                }
            } else {
                showToast('Failed to save project', 'error');
            }
        } catch (error) {
            console.error('Error saving project:', error);
            showToast('Failed to save project', 'error');
        }
    }

    viewProject(projectId) {
        const project = this.storage.getProjectById(projectId);
        if (!project) {
            showToast('Project not found', 'error');
            return;
        }

        const transactions = this.storage.getTransactionsByProject(projectId);
        const totalSpent = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const modalContent = `
            <div class="project-details">
                <div class="project-header">
                    <h3>${project.name}</h3>
                    <span class="status-badge ${project.status}">${project.status}</span>
                </div>
                
                <div class="project-info-grid">
                    ${project.type ? `
                        <div class="info-item">
                            <label>Type:</label>
                            <span>${project.type}</span>
                        </div>
                    ` : ''}
                    
                    ${project.location ? `
                        <div class="info-item">
                            <label>Location:</label>
                            <span>${project.location}</span>
                        </div>
                    ` : ''}
                    
                    ${project.client ? `
                        <div class="info-item">
                            <label>Client:</label>
                            <span>${project.client}</span>
                        </div>
                    ` : ''}
                    
                    ${project.clientContact ? `
                        <div class="info-item">
                            <label>Client Contact:</label>
                            <span>${project.clientContact}</span>
                        </div>
                    ` : ''}
                    
                    ${project.clientPhone ? `
                        <div class="info-item">
                            <label>Client Phone:</label>
                            <span>${project.clientPhone}</span>
                        </div>
                    ` : ''}
                    
                    ${project.startDate ? `
                        <div class="info-item">
                            <label>Start Date:</label>
                            <span>${formatDate(project.startDate)}</span>
                        </div>
                    ` : ''}
                    
                    ${project.endDate ? `
                        <div class="info-item">
                            <label>End Date:</label>
                            <span>${formatDate(project.endDate)}</span>
                        </div>
                    ` : ''}
                    
                    <div class="info-item">
                        <label>Progress:</label>
                        <span>${project.progress || 0}%</span>
                    </div>
                    
                    ${project.budget ? `
                        <div class="info-item">
                            <label>Budget:</label>
                            <span><strong>${formatCurrency(project.budget)}</strong></span>
                        </div>
                    ` : ''}
                    
                    <div class="info-item">
                        <label>Total Spent:</label>
                        <span class="text-danger"><strong>${formatCurrency(totalSpent)}</strong></span>
                    </div>
                    
                    <div class="info-item">
                        <label>Total Income:</label>
                        <span class="text-success"><strong>${formatCurrency(totalIncome)}</strong></span>
                    </div>
                    
                    ${project.budget ? `
                        <div class="info-item">
                            <label>Remaining Budget:</label>
                            <span class="${project.budget - totalSpent >= 0 ? 'text-success' : 'text-danger'}">
                                <strong>${formatCurrency(project.budget - totalSpent)}</strong>
                            </span>
                        </div>
                    ` : ''}
                    
                    <div class="info-item">
                        <label>Transactions:</label>
                        <span>${transactions.length} transactions</span>
                    </div>
                    
                    <div class="info-item">
                        <label>Created:</label>
                        <span>${formatDate(project.createdAt)}</span>
                    </div>
                </div>
                
                ${project.description ? `
                    <div class="info-item">
                        <label>Description:</label>
                        <p>${project.description}</p>
                    </div>
                ` : ''}
                
                ${project.notes ? `
                    <div class="info-item">
                        <label>Notes:</label>
                        <p>${project.notes}</p>
                    </div>
                ` : ''}
                
                <div class="project-actions">
                    <button class="btn btn-primary" onclick="projectManager.editProject('${project.id}')">
                        <i class="fas fa-edit"></i> Edit Project
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                </div>
            </div>
        `;

        this.showInfoModal('Project Details', modalContent);
    }

    editProject(projectId) {
        const project = this.storage.getProjectById(projectId);
        if (!project) {
            showToast('Project not found', 'error');
            return;
        }
        
        this.showProjectModal(project);
    }

    deleteProject(projectId) {
        const project = this.storage.getProjectById(projectId);
        if (!project) {
            showToast('Project not found', 'error');
            return;
        }

        // Check if project has transactions
        const transactions = this.storage.getTransactionsByProject(projectId);
        
        let confirmMessage = `Are you sure you want to delete "${project.name}"?`;
        if (transactions.length > 0) {
            confirmMessage += `\n\nThis project has ${transactions.length} transaction(s). Deleting the project will not affect existing transactions.`;
        }

        if (confirm(confirmMessage)) {
            try {
                this.storage.deleteProject(projectId);
                showToast('Project deleted successfully', 'success');
                this.renderProjectsGrid();
                
                // Refresh analytics if on dashboard
                if (window.app && window.app.analytics) {
                    window.app.analytics.loadDashboard();
                }
            } catch (error) {
                console.error('Error deleting project:', error);
                showToast('Failed to delete project', 'error');
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

    // Update project progress
    updateProjectProgress(projectId, progress) {
        const project = this.storage.getProjectById(projectId);
        if (!project) {
            showToast('Project not found', 'error');
            return;
        }

        if (progress < 0 || progress > 100) {
            showToast('Progress must be between 0 and 100', 'error');
            return;
        }

        try {
            this.storage.updateProject(projectId, { progress });
            this.renderProjectsGrid();
            showToast('Project progress updated', 'success');
        } catch (error) {
            console.error('Error updating project progress:', error);
            showToast('Failed to update progress', 'error');
        }
    }

    // View payment history for a project
    viewPaymentHistory(projectId) {
        const project = this.storage.getProjectById(projectId);
        if (!project) {
            showToast('Project not found', 'error');
            return;
        }

        // Get all transactions for this project
        const allTransactions = this.storage.getTransactions();
        const projectTransactions = allTransactions.filter(transaction => transaction.projectId === projectId);
        
        if (projectTransactions.length === 0) {
            showToast(`No payment history found for ${project.name}`, 'info');
            return;
        }

        // Sort transactions by date (newest first)
        projectTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate totals
        let totalSpent = 0;
        let totalReceived = 0;
        let outstandingAmount = 0;
        let netAmount = 0;

        projectTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount || 0);
            if (transaction.type === 'expense') {
                totalSpent += amount;
                if (transaction.paymentStatus === 'credit' || transaction.paymentStatus === 'partial') {
                    outstandingAmount += parseFloat(transaction.outstandingAmount || 0);
                }
            } else if (transaction.type === 'income') {
                totalReceived += amount;
            }
        });

        netAmount = totalReceived - totalSpent;

        // Get vendors for display
        const vendors = this.storage.getVendors();

        // Calculate progress if budget exists
        const progressInfo = project.budget ? 
            `<div class="summary-item budget">
                <div class="summary-label">Budget:</div>
                <div class="summary-amount">${formatCurrency(project.budget)}</div>
            </div>
            <div class="summary-item remaining">
                <div class="summary-label">Remaining Budget:</div>
                <div class="summary-amount ${(project.budget - totalSpent) >= 0 ? 'text-success' : 'text-danger'}">
                    ${formatCurrency(project.budget - totalSpent)}
                </div>
            </div>` : '';

        const modalContent = `
            <div class="payment-history">
                <div class="payment-summary">
                    <h3>Payment History for ${project.name}</h3>
                    <div class="summary-grid">
                        <div class="summary-item expense">
                            <div class="summary-label">Total Spent:</div>
                            <div class="summary-amount">${formatCurrency(totalSpent)}</div>
                        </div>
                        <div class="summary-item income">
                            <div class="summary-label">Total Received:</div>
                            <div class="summary-amount">${formatCurrency(totalReceived)}</div>
                        </div>
                        <div class="summary-item outstanding">
                            <div class="summary-label">Outstanding Amount:</div>
                            <div class="summary-amount">${formatCurrency(outstandingAmount)}</div>
                        </div>
                        ${progressInfo}
                        <div class="summary-item net">
                            <div class="summary-label">Net Amount:</div>
                            <div class="summary-amount ${netAmount >= 0 ? 'text-success' : 'text-danger'}">
                                ${formatCurrency(netAmount)}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="payment-history-table">
                    <h4>Transaction History (${projectTransactions.length} transactions)</h4>
                    <div class="table-responsive">
                        <table class="payment-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Vendor</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Outstanding</th>
                                    <th>Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${projectTransactions.map(transaction => {
                                    const vendor = vendors.find(v => v.id === transaction.vendorId);
                                    const paymentStatus = transaction.paymentStatus || 'paid';
                                    const outstandingAmt = transaction.outstandingAmount || 0;
                                    
                                    return `
                                        <tr class="${transaction.type}">
                                            <td>${formatDate(transaction.date)}</td>
                                            <td>${vendor ? vendor.name : 'N/A'}</td>
                                            <td>
                                                <span class="transaction-type ${transaction.type}">
                                                    ${transaction.type === 'expense' ? 'You Give' : 'You Got'}
                                                </span>
                                            </td>
                                            <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                                                <strong>${formatCurrency(transaction.amount)}</strong>
                                            </td>
                                            <td>
                                                <span class="payment-status ${paymentStatus}">
                                                    ${paymentStatus === 'paid' ? 'Paid' : 
                                                      paymentStatus === 'credit' ? 'Credit' : 'Partial'}
                                                </span>
                                            </td>
                                            <td class="text-danger">
                                                ${outstandingAmt > 0 ? formatCurrency(outstandingAmt) : '-'}
                                            </td>
                                            <td>${transaction.description || ''}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="payment-actions">
                    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                    <button class="btn btn-primary" onclick="projectManager.printProjectPaymentHistory('${projectId}')">
                        <i class="fas fa-print"></i> Print History
                    </button>
                </div>
            </div>
        `;

        // Use the showInfoModal from transactions manager (shared modal)
        if (window.transactionManager && window.transactionManager.showInfoModal) {
            window.transactionManager.showInfoModal(`Payment History - ${project.name}`, modalContent);
        } else {
            // Fallback if transaction manager not available
            showToast('Please go to Transactions section first to initialize payment history', 'warning');
        }
    }

    // Print project payment history
    printProjectPaymentHistory(projectId) {
        const project = this.storage.getProjectById(projectId);
        if (!project) return;

        const allTransactions = this.storage.getTransactions();
        const projectTransactions = allTransactions.filter(transaction => transaction.projectId === projectId);
        const vendors = this.storage.getVendors();
        
        // Create print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Project Payment History - ${project.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
                        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .expense { color: #dc3545; }
                        .income { color: #28a745; }
                        .print-date { text-align: right; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="print-date">Printed on: ${new Date().toLocaleDateString()}</div>
                    <h1>Project Payment History - ${project.name}</h1>
                    <div class="summary">
                        <h3>Summary:</h3>
                        <p><strong>Total Spent:</strong> ${formatCurrency(projectTransactions
                            .filter(t => t.type === 'expense')
                            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0))}</p>
                        <p><strong>Total Received:</strong> ${formatCurrency(projectTransactions
                            .filter(t => t.type === 'income')
                            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0))}</p>
                        <p><strong>Outstanding:</strong> ${formatCurrency(projectTransactions
                            .reduce((sum, t) => sum + parseFloat(t.outstandingAmount || 0), 0))}</p>
                        ${project.budget ? `<p><strong>Budget:</strong> ${formatCurrency(project.budget)}</p>` : ''}
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Vendor</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Outstanding</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projectTransactions.map(transaction => {
                                const vendor = vendors.find(v => v.id === transaction.vendorId);
                                return `
                                    <tr>
                                        <td>${formatDate(transaction.date)}</td>
                                        <td>${vendor ? vendor.name : 'N/A'}</td>
                                        <td class="${transaction.type}">
                                            ${transaction.type === 'expense' ? 'You Give' : 'You Got'}
                                        </td>
                                        <td class="${transaction.type}">${formatCurrency(transaction.amount)}</td>
                                        <td>${transaction.paymentStatus || 'paid'}</td>
                                        <td>${transaction.outstandingAmount ? formatCurrency(transaction.outstandingAmount) : '-'}</td>
                                        <td>${transaction.description || ''}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}
