// Settings and customization functionality
import { showToast, formatCurrency } from './utils.js';

export class SettingsManager {
    constructor(storage) {
        this.storage = storage;
        this.defaultSettings = {
            companyName: 'Your Business',
            businessType: 'construction',
            primaryColor: '#F59E0B',
            logo: '',
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
                        <button class="tab-btn" data-tab="appearance">Appearance</button>
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

                        <!-- Appearance Settings -->
                        <div class="tab-content" id="appearance-tab">
                            <div class="form-group">
                                <label for="logo-upload">Company Logo</label>
                                <input type="file" id="logo-upload" accept="image/*">
                                <small>Upload your company logo (recommended: 200x180px)</small>
                                ${settings.logo ? `<div class="current-logo"><img src="${settings.logo}" alt="Current Logo" style="max-width: 100px; height: auto;"></div>` : ''}
                            </div>
                            
                            <div class="form-group">
                                <label for="primary-color">Brand Color</label>
                                <div class="color-picker-group">
                                    <input type="color" id="primary-color" value="${settings.primaryColor}">
                                    <input type="text" id="color-text" value="${settings.primaryColor}" placeholder="#F59E0B">
                                </div>
                                <div class="color-presets">
                                    <button type="button" class="color-preset" data-color="#F59E0B" style="background: #F59E0B"></button>
                                    <button type="button" class="color-preset" data-color="#3B82F6" style="background: #3B82F6"></button>
                                    <button type="button" class="color-preset" data-color="#10B981" style="background: #10B981"></button>
                                    <button type="button" class="color-preset" data-color="#EF4444" style="background: #EF4444"></button>
                                    <button type="button" class="color-preset" data-color="#8B5CF6" style="background: #8B5CF6"></button>
                                    <button type="button" class="color-preset" data-color="#F97316" style="background: #F97316"></button>
                                </div>
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

        // Color picker sync
        const colorPicker = document.getElementById('primary-color');
        const colorText = document.getElementById('color-text');
        
        colorPicker.addEventListener('input', (e) => {
            colorText.value = e.target.value;
            this.previewColor(e.target.value);
        });

        colorText.addEventListener('input', (e) => {
            if (e.target.value.match(/^#[0-9A-F]{6}$/i)) {
                colorPicker.value = e.target.value;
                this.previewColor(e.target.value);
            }
        });

        // Color presets
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                colorPicker.value = color;
                colorText.value = color;
                this.previewColor(color);
            });
        });

        // Logo upload
        document.getElementById('logo-upload').addEventListener('change', (e) => {
            this.handleLogoUpload(e);
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

    previewColor(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        document.documentElement.style.setProperty('--primary-light', this.lightenColor(color, 0.9));
    }

    lightenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.round(r + (255 - r) * factor);
        const newG = Math.round(g + (255 - g) * factor);
        const newB = Math.round(b + (255 - b) * factor);
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const logoData = e.target.result;
                // Preview logo
                const preview = document.createElement('div');
                preview.className = 'logo-preview';
                preview.innerHTML = `<img src="${logoData}" alt="Logo Preview" style="max-width: 100px; height: auto; margin-top: 10px;">`;
                
                const existing = document.querySelector('.logo-preview');
                if (existing) existing.remove();
                
                event.target.parentNode.appendChild(preview);
            };
            reader.readAsDataURL(file);
        }
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
            companyName: document.getElementById('company-name').value.trim(),
            businessType: document.getElementById('business-type').value,
            primaryColor: document.getElementById('primary-color').value,
            currency: document.getElementById('currency-select').value,
            dateFormat: document.getElementById('date-format').value,
            contactsAccess: document.getElementById('contacts-access').checked,
            customCategories: this.loadSettings().customCategories,
            theme: 'light' // Always light theme
        };

        // Handle logo
        const logoPreview = document.querySelector('.logo-preview img');
        if (logoPreview) {
            settings.logo = logoPreview.src;
        } else {
            settings.logo = this.loadSettings().logo || '';
        }

        // Validate required fields
        if (!settings.companyName) {
            showToast('Company name is required', 'error');
            return;
        }

        try {
            this.storage.saveSettings(settings);
            this.applySettings(settings);
            showToast('Settings saved successfully', 'success');
            window.closeModal();
            
            // Force reload to apply changes immediately
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Failed to save settings', 'error');
        }
    }

    applySettings(settings) {
        // Apply company name
        document.title = `${settings.companyName} - Business Management`;
        const companyNameElements = document.querySelectorAll('.company-name, .logo-text span');
        companyNameElements.forEach(el => {
            el.textContent = settings.companyName;
        });

        // Apply brand color
        document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
        document.documentElement.style.setProperty('--primary-light', this.lightenColor(settings.primaryColor, 0.9));

        // Apply logo
        if (settings.logo) {
            const logoElements = document.querySelectorAll('.logo-icon, .app-logo img');
            logoElements.forEach(el => {
                if (el.tagName === 'IMG') {
                    el.src = settings.logo;
                } else {
                    el.innerHTML = `<img src="${settings.logo}" alt="${settings.companyName}" style="width: 40px; height: 40px; object-fit: contain;">`;
                }
            });
        }

        // Update category dropdowns
        this.updateCategoryDropdowns(settings);
    }

    updateCategoryDropdowns(settings) {
        // Update vendor category dropdowns
        const vendorSelects = document.querySelectorAll('#vendor-category, #vendor-category-filter');
        vendorSelects.forEach(select => {
            const currentValue = select.value;
            const defaultOptions = select.innerHTML;
            
            if (settings.customCategories.vendor && settings.customCategories.vendor.length > 0) {
                settings.customCategories.vendor.forEach(category => {
                    if (!select.querySelector(`option[value="${category}"]`)) {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        select.appendChild(option);
                    }
                });
            }
            
            select.value = currentValue;
        });

        // Update transaction category dropdowns
        const transactionSelects = document.querySelectorAll('#transaction-category, #transaction-category-filter');
        transactionSelects.forEach(select => {
            const currentValue = select.value;
            
            if (settings.customCategories.transaction && settings.customCategories.transaction.length > 0) {
                settings.customCategories.transaction.forEach(category => {
                    if (!select.querySelector(`option[value="${category}"]`)) {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        select.appendChild(option);
                    }
                });
            }
            
            select.value = currentValue;
        });
    }

    resetToDefaults() {
        if (confirm('This will reset all settings to default values. Are you sure?')) {
            this.storage.saveSettings(this.defaultSettings);
            showToast('Settings reset to defaults', 'success');
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        }
    }

    clearCache() {
        if (confirm('This will clear the application cache and reload the page. Continue?')) {
            // Clear service worker cache
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                    });
                });
            }
            
            // Clear browser cache
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                    });
                });
            }
            
            showToast('Cache cleared successfully', 'success');
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        }
    }

    // Contact picker functionality
    // In settings.js, update the pickContact method
    async pickContact(phoneFieldId, nameFieldId) {
        if (!this.loadSettings().contactsAccess) {
            showToast('Contact access is disabled. Enable it in settings.', 'warning');
            return;
        }

        try {
            if ('contacts' in navigator && 'ContactsManager' in window) {
                const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
                if (contacts && contacts.length > 0) {
                    const contact = contacts[0];
                    
                    // Update phone field
                    const phoneInput = document.getElementById(phoneFieldId);
                    if (phoneInput) {
                        phoneInput.value = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';
                    }
                    
                    // Update name field if provided
                    if (nameFieldId && contact.name) {
                        const nameInput = document.getElementById(nameFieldId);
                        if (nameInput && !nameInput.value) { // Only auto-fill if empty
                            nameInput.value = contact.name;
                        }
                    }
                }
            } else {
                showToast('Contact picker not supported on this device', 'warning');
            }
        } catch (error) {
            console.error('Contact picker error:', error);
            showToast('Could not access contacts', 'error');
        }
    }
}