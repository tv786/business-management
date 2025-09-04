// Settings and customization functionality
import { showToast, formatCurrency } from './utils.js';

export class SettingsManager {
    constructor(storage) {
        this.storage = storage;
        this.defaultSettings = {
            companyName: 'Your Business',
            businessType: 'construction',


            currency: 'INR',
            language: 'en',
            dateFormat: 'DD/MM/YYYY',
            customCategories: {
                vendor: [],
                transaction: [],
                project: []
            },
            contactsAccess: false,
            theme: 'light'
        };
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
    }

    loadSettings() {
        const settings = this.storage.getSettings();
        if (!settings || Object.keys(settings).length === 0) {
            this.storage.saveSettings(this.defaultSettings);
            return this.defaultSettings;
        }
        return { ...this.defaultSettings, ...settings };
    }

    setupEventListeners() {
        // Settings modal trigger
        document.addEventListener('click', (e) => {
            if (e.target.id === 'settings-btn' || e.target.closest('#settings-btn')) {
                this.showSettingsModal();
            }
        });
    }

    showSettingsModal() {
        const settings = this.loadSettings();
        
        const modalHTML = `
            <div class="modal settings-modal" id="settings-modal">
                <div class="modal-header">
                    <h3>Business Settings</h3>
                    <button class="btn-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body settings-content">
                    <div class="settings-tabs">
                        <button class="tab-btn active" data-tab="general">General</button>

                        <button class="tab-btn" data-tab="categories">Categories</button>
                        <button class="tab-btn" data-tab="advanced">Advanced</button>
                    </div>

                    <form id="settings-form">
                        <!-- General Settings -->
                        <div class="tab-content active" id="general-tab">
                            <div class="form-group">
                                <label for="company-name">Company/Business Name *</label>
                                <input type="text" id="company-name" value="${settings.companyName}" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="business-type">Business Type</label>
                                <select id="business-type">
                                    <option value="construction" ${settings.businessType === 'construction' ? 'selected' : ''}>Construction</option>
                                    <option value="retail" ${settings.businessType === 'retail' ? 'selected' : ''}>Retail/Shop</option>
                                    <option value="manufacturing" ${settings.businessType === 'manufacturing' ? 'selected' : ''}>Manufacturing</option>
                                    <option value="services" ${settings.businessType === 'services' ? 'selected' : ''}>Services</option>
                                    <option value="restaurant" ${settings.businessType === 'restaurant' ? 'selected' : ''}>Restaurant/Food</option>
                                    <option value="automotive" ${settings.businessType === 'automotive' ? 'selected' : ''}>Automotive</option>
                                    <option value="healthcare" ${settings.businessType === 'healthcare' ? 'selected' : ''}>Healthcare</option>
                                    <option value="education" ${settings.businessType === 'education' ? 'selected' : ''}>Education</option>
                                    <option value="other" ${settings.businessType === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="currency-select">Currency</label>
                                <select id="currency-select">
                                    <option value="INR" ${settings.currency === 'INR' ? 'selected' : ''}>Indian Rupee (₹)</option>
                                    <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>US Dollar ($)</option>
                                    <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                                    <option value="GBP" ${settings.currency === 'GBP' ? 'selected' : ''}>British Pound (£)</option>
                                </select>
                            </div>
                        </div>



                        <!-- Categories Settings -->
                        <div class="tab-content" id="categories-tab">
                            <div class="custom-categories">
                                <h4>Custom Vendor Categories</h4>
                                <div class="category-manager" data-type="vendor">
                                    <div class="add-category">
                                        <input type="text" placeholder="Add custom vendor category" id="new-vendor-category">
                                        <button type="button" onclick="settingsManager.addCustomCategory('vendor')">Add</button>
                                    </div>
                                    <div class="category-list" id="vendor-categories">
                                        ${(settings.customCategories.vendor || []).map(cat => `
                                            <div class="category-item">
                                                <span>${cat}</span>
                                                <button type="button" onclick="settingsManager.removeCustomCategory('vendor', '${cat}')">&times;</button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                <h4>Custom Transaction Categories</h4>
                                <div class="category-manager" data-type="transaction">
                                    <div class="add-category">
                                        <input type="text" placeholder="Add custom transaction category" id="new-transaction-category">
                                        <button type="button" onclick="settingsManager.addCustomCategory('transaction')">Add</button>
                                    </div>
                                    <div class="category-list" id="transaction-categories">
                                        ${(settings.customCategories.transaction || []).map(cat => `
                                            <div class="category-item">
                                                <span>${cat}</span>
                                                <button type="button" onclick="settingsManager.removeCustomCategory('transaction', '${cat}')">&times;</button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Advanced Settings -->
                        <div class="tab-content" id="advanced-tab">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="contacts-access" ${settings.contactsAccess ? 'checked' : ''}>
                                    Enable Contact List Access
                                </label>
                                <small>Allow importing contacts from device for vendors and clients</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="date-format">Date Format</label>
                                <select id="date-format">
                                    <option value="DD/MM/YYYY" ${settings.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                                    <option value="MM/DD/YYYY" ${settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                                    <option value="YYYY-MM-DD" ${settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <button type="button" class="btn btn-secondary" onclick="settingsManager.resetToDefaults()">Reset to Defaults</button>
                                <button type="button" class="btn btn-secondary" onclick="settingsManager.clearCache()">Clear Cache</button>
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Settings</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('settings-modal');
        if (existingModal) {
            existingModal.remove();
        }

        document.getElementById('modal-overlay').insertAdjacentHTML('beforeend', modalHTML);
        
        this.setupSettingsEventListeners();
        window.showModal('settings-modal');
        window.settingsManager = this;
    }

    setupSettingsEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });


        // Form submission
        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }



    addCustomCategory(type) {
        const input = document.getElementById(`new-${type}-category`);
        const category = input.value.trim();
        
        if (!category) {
            showToast('Please enter a category name', 'warning');
            return;
        }

        const settings = this.loadSettings();
        if (!settings.customCategories[type]) {
            settings.customCategories[type] = [];
        }

        if (settings.customCategories[type].includes(category)) {
            showToast('Category already exists', 'warning');
            return;
        }

        settings.customCategories[type].push(category);
        this.storage.saveSettings(settings);
        
        // Update display
        const categoryList = document.getElementById(`${type}-categories`);
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <span>${category}</span>
            <button type="button" onclick="settingsManager.removeCustomCategory('${type}', '${category}')">&times;</button>
        `;
        categoryList.appendChild(categoryItem);
        
        input.value = '';
        showToast('Category added successfully', 'success');
    }

    removeCustomCategory(type, category) {
        const settings = this.loadSettings();
        if (settings.customCategories[type]) {
            settings.customCategories[type] = settings.customCategories[type].filter(cat => cat !== category);
            this.storage.saveSettings(settings);
            
            // Remove from display
            const categoryItems = document.querySelectorAll(`#${type}-categories .category-item`);
            categoryItems.forEach(item => {
                if (item.querySelector('span').textContent === category) {
                    item.remove();
                }
            });
            
            showToast('Category removed successfully', 'success');
        }
    }

    saveSettings() {
        const settings = {
            companyName: document.getElementById('company-name').value,
            businessType: document.getElementById('business-type').value,
            currency: document.getElementById('currency-select').value,
            dateFormat: document.getElementById('date-format').value,
            contactsAccess: document.getElementById('contacts-access').checked,
            customCategories: this.loadSettings().customCategories,
            theme: 'light'
        };

        try {
            this.storage.saveSettings(settings);
            this.applySettings(settings);
            
            showToast('Settings saved successfully', 'success');
            
            // Close modal
            window.closeModal();
            
            // Refresh all data displays
            setTimeout(() => {
                window.location.reload();
            }, 500);
            
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Error saving settings', 'error');
        }
    }

    applySettings(settings) {
        // Update company name in header
        const companyNameElements = document.querySelectorAll('.company-name, .logo-text span');
        companyNameElements.forEach(el => {
            el.textContent = settings.companyName;
        });
    }

    resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
            this.storage.saveSettings(this.defaultSettings);
            this.applySettings(this.defaultSettings);
            showToast('Settings reset to defaults', 'success');
            
            // Refresh the page to show changes
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    clearCache() {
        if (confirm('Are you sure you want to clear all cached data? This will remove all offline data.')) {
            localStorage.clear();
            showToast('Cache cleared successfully', 'success');
            
            // Reload to fresh state
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }
}
