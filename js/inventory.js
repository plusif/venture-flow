// ============================================
// INVENTORY CRUD OPERATIONS - WITH USER ID SUPPORT
// ============================================

// Track current detail product ID
let currentDetailProductId = null;

function renderInventory() {
    const container = document.getElementById('inventory-list');
    if (!container) return;
    
    if (AppState.inventory.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📦</span>
                <p>No products added yet.</p>
                <p style="font-size:11px;color:var(--gray-600);">Add products to track your inventory.</p>
            </div>
        `;
        return;
    }
    
    const statusLabels = { 
        'for_sale': 'For Sale', 
        'sold': 'Sold', 
        'in_production': 'In Production',
        'lay_by': 'Lay-by',
        'on_hold': 'On Hold',
        'on_shelf': 'On Shelf'
    };
    const statusClasses = { 
        'for_sale': 'status-for-sale', 
        'sold': 'status-sold', 
        'in_production': 'status-production',
        'lay_by': 'status-lay-by',
        'on_hold': 'status-on-hold',
        'on_shelf': 'status-on-shelf'
    };
    
    let html = '';
    AppState.inventory.forEach(item => {
        // Image thumbnail
        const imageHtml = item.imageData 
            ? `<div class="item-image-thumb"><img src="${item.imageData}" alt="${escapeHtml(item.name)}"></div>`
            : `<div class="item-image-thumb no-image">📷</div>`;
        
        const statusLabel = statusLabels[item.status] || item.status;
        const statusClass = statusClasses[item.status] || '';
        
        html += `
            <div class="inventory-item" onclick="openInventoryDetail(${item.id})" style="cursor:pointer;">
                ${imageHtml}
                <div class="item-info">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-details">Cost: ${formatCurrency(item.cost)} | Price: ${formatCurrency(item.price)}</div>
                </div>
                <div style="text-align:right;">
                    <span class="item-status ${statusClass}">${statusLabel}</span>
                    <button class="edit-btn-sm" onclick="event.stopPropagation();openEditInventory(${item.id})">✎</button>
                    <button class="delete-btn" onclick="event.stopPropagation();deleteInventory(${item.id})">✕</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// INVENTORY DETAIL VIEW
// ============================================

function openInventoryDetail(id) {
    const item = AppState.inventory.find(i => i.id === id);
    if (!item) {
        showToast('Product not found', 'error');
        return;
    }
    
    currentDetailProductId = id;
    
    const modal = document.getElementById('inventory-detail-modal');
    const nameEl = document.getElementById('detail-product-name');
    const imageEl = document.getElementById('detail-product-image');
    const noImageEl = document.getElementById('detail-no-image');
    const costEl = document.getElementById('detail-cost');
    const priceEl = document.getElementById('detail-price');
    const statusEl = document.getElementById('detail-status');
    const profitEl = document.getElementById('detail-profit');
    const idInput = document.getElementById('detail-product-id');
    
    // Set values
    nameEl.textContent = item.name;
    idInput.value = item.id;
    
    // Image
    if (item.imageData) {
        imageEl.src = item.imageData;
        imageEl.style.display = 'block';
        noImageEl.style.display = 'none';
    } else {
        imageEl.style.display = 'none';
        noImageEl.style.display = 'block';
    }
    
    // Details
    costEl.textContent = formatCurrency(item.cost);
    priceEl.textContent = formatCurrency(item.price);
    
    const statusLabels = { 
        'for_sale': '🛒 For Sale', 
        'sold': '✅ Sold', 
        'in_production': '🔧 In Production',
        'lay_by': '📦 Lay-by',
        'on_hold': '⏸ On Hold',
        'on_shelf': '📚 On Shelf'
    };
    statusEl.textContent = statusLabels[item.status] || item.status;
    
    const profit = item.price - item.cost;
    const profitColor = profit > 0 ? 'var(--support)' : profit < 0 ? 'var(--friction)' : 'var(--gray-400)';
    profitEl.textContent = formatCurrency(profit);
    profitEl.style.color = profitColor;
    
    // Highlight current status button
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === item.status) {
            btn.classList.add('active');
        }
    });
    
    modal.classList.add('visible');
}

function closeInventoryDetail() {
    document.getElementById('inventory-detail-modal').classList.remove('visible');
    currentDetailProductId = null;
}

function editFromDetail() {
    const id = parseInt(document.getElementById('detail-product-id').value);
    if (id) {
        closeInventoryDetail();
        // Small delay to let modal close
        setTimeout(() => {
            openEditInventory(id);
        }, 300);
    }
}

// ============================================
// INVENTORY STATUS MANAGEMENT
// ============================================

async function updateInventoryStatus(newStatus) {
    const id = parseInt(document.getElementById('detail-product-id').value);
    if (!id) {
        showToast('No product selected', 'error');
        return;
    }
    
    const item = AppState.inventory.find(i => i.id === id);
    if (!item) {
        showToast('Product not found', 'error');
        return;
    }
    
    // If status is the same, just close
    if (item.status === newStatus) {
        closeInventoryDetail();
        return;
    }
    
    // Confirmation for sold
    if (newStatus === 'sold') {
        if (!confirm(`Mark "${item.name}" as sold? This will record a sale.`)) {
            return;
        }
    }
    
    try {
        // Update the item
        item.status = newStatus;
        await window.db.put('inventory', item);
        
        // If marking as sold, also add a sale event
        if (newStatus === 'sold') {
            const eventData = {
                date: today(),
                type: 'support',
                category: 'sale',
                amount: item.price,
                description: `Sold: ${item.name} for ${formatCurrency(item.price)}`,
                ventureId: AppState.currentVentureId,
                lateEntry: false
            };
            
            // ============================================
            // NEW: Add user ID to event if auth is enabled
            // ============================================
            if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
                eventData.userId = Auth.getUserFilter();
            } else {
                eventData.userId = 'dev_user';
            }
            
            try {
                const id = await window.db.add('events', eventData);
                eventData.id = id;
            } catch (e) {
                console.warn('DB event add failed, using memory only:', e);
                eventData.id = Date.now() + Math.random() * 1000;
            }
            AppState.events.push(eventData);
            AppState.events.sort((a, b) => new Date(a.date) - new Date(b.date));
            showToast(`✅ "${item.name}" marked as sold! Sale recorded.`, 'success');
        } else {
            const statusLabels = { 
                'for_sale': 'For Sale', 
                'sold': 'Sold', 
                'in_production': 'In Production',
                'lay_by': 'Lay-by',
                'on_hold': 'On Hold',
                'on_shelf': 'On Shelf'
            };
            showToast(`📌 "${item.name}" status updated to ${statusLabels[newStatus] || newStatus}`, 'success');
        }
        
        // Update the detail view
        openInventoryDetail(id);
        
        // Refresh all views
        renderInventory();
        renderDashboard();
        renderReports();
        updateStatusBar();
        
    } catch (error) {
        console.error('Failed to update status:', error);
        showToast('Failed to update status', 'error');
    }
}

// ============================================
// INVENTORY MODAL (Open/Edit)
// ============================================

function openInventoryModal(data = null) {
    const modal = document.getElementById('inventory-modal');
    if (!modal) return;
    
    const editId = document.getElementById('inv-edit-id');
    const title = document.getElementById('inv-modal-title');
    const submitBtn = document.getElementById('inv-submit-btn');
    const imagePreview = document.getElementById('inv-image-preview');
    const imageDisplay = document.getElementById('inv-image-display');
    const imageData = document.getElementById('inv-image-data');
    const imageInput = document.getElementById('inv-image-input');
    
    // Reset the form first
    document.getElementById('inventory-form').reset();
    document.getElementById('inv-edit-id').value = '';
    document.getElementById('inv-status').value = 'for_sale';
    
    if (data) {
        editId.value = data.id;
        title.textContent = 'Edit Product';
        submitBtn.textContent = 'Update Product';
        document.getElementById('inv-name').value = data.name;
        document.getElementById('inv-cost').value = data.cost;
        document.getElementById('inv-price').value = data.price;
        document.getElementById('inv-status').value = data.status;
        
        // Load existing image if any
        if (data.imageData) {
            imageDisplay.src = data.imageData;
            imagePreview.style.display = 'block';
            imageData.value = data.imageData;
        } else {
            imagePreview.style.display = 'none';
            imageData.value = '';
        }
    } else {
        editId.value = '';
        title.textContent = 'Add Product';
        submitBtn.textContent = 'Add Product';
        document.getElementById('inv-name').value = '';
        document.getElementById('inv-cost').value = '';
        document.getElementById('inv-price').value = '';
        document.getElementById('inv-status').value = 'for_sale';
        imagePreview.style.display = 'none';
        imageData.value = '';
        imageInput.value = '';
    }
    
    modal.classList.add('visible');
}

function openEditInventory(id) {
    const item = AppState.inventory.find(i => i.id === id);
    if (item) openInventoryModal(item);
}

// ============================================
// IMAGE CAPTURE FUNCTIONS (GLOBALLY ACCESSIBLE)
// ============================================

window.captureInventoryImage = function() {
    console.log('📸 Capture image called');
    const input = document.getElementById('inv-image-input');
    if (!input) {
        console.error('❌ Image input not found');
        showToast('Error: Image input not found', 'error');
        return;
    }
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        input.setAttribute('capture', 'environment');
        input.setAttribute('accept', 'image/*');
        console.log('📸 Camera mode enabled');
    } else {
        input.removeAttribute('capture');
        input.setAttribute('accept', 'image/*');
        console.log('📁 File upload mode (no camera)');
    }
    
    input.click();
};

window.uploadInventoryImage = function() {
    console.log('📁 Upload image called');
    const input = document.getElementById('inv-image-input');
    if (!input) {
        console.error('❌ Image input not found');
        showToast('Error: Image input not found', 'error');
        return;
    }
    
    input.removeAttribute('capture');
    input.setAttribute('accept', 'image/*');
    console.log('📁 File picker mode');
    input.click();
};

window.clearInventoryImage = function() {
    console.log('🗑️ Clear image called');
    const preview = document.getElementById('inv-image-preview');
    const display = document.getElementById('inv-image-display');
    const dataInput = document.getElementById('inv-image-data');
    const fileInput = document.getElementById('inv-image-input');
    
    if (preview) preview.style.display = 'none';
    if (display) display.src = '';
    if (dataInput) dataInput.value = '';
    if (fileInput) fileInput.value = '';
    showToast('Image cleared', 'info');
};

window.handleInventoryImageUpload = function(event) {
    console.log('📸 Image upload handler triggered');
    const file = event.target.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }
    
    console.log('📁 File selected:', file.name, file.type, file.size);
    
    if (!file.type.startsWith('image/')) {
        showToast('❌ Please select an image file.', 'error');
        event.target.value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('❌ Image too large. Max 5MB.', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('✅ Image read successfully');
        const imageData = e.target.result;
        const preview = document.getElementById('inv-image-preview');
        const display = document.getElementById('inv-image-display');
        const dataInput = document.getElementById('inv-image-data');
        
        if (display) display.src = imageData;
        if (preview) preview.style.display = 'block';
        if (dataInput) dataInput.value = imageData;
        showToast('✅ Image captured successfully!', 'success');
    };
    reader.onerror = function() {
        console.error('❌ Failed to read image');
        showToast('❌ Failed to read image.', 'error');
    };
    reader.readAsDataURL(file);
};

// ============================================
// SAVE INVENTORY
// ============================================

async function saveInventory() {
    try {
        const editId = document.getElementById('inv-edit-id').value;
        const name = document.getElementById('inv-name').value.trim();
        const cost = parseInt(document.getElementById('inv-cost').value) || 0;
        const price = parseInt(document.getElementById('inv-price').value) || 0;
        const status = document.getElementById('inv-status').value;
        const imageData = document.getElementById('inv-image-data').value;
        
        console.log('📦 Saving inventory:', { name, cost, price, status, hasImage: !!imageData, editId });
        
        if (!name) {
            showToast('Please enter a product name', 'error');
            return;
        }
        
        if (!imageData && !editId) {
            showToast('📷 Please take or upload an image of the product', 'error');
            return;
        }
        
        const data = { 
            name, 
            cost, 
            price, 
            status, 
            imageData: imageData || null,
            ventureId: AppState.currentVentureId
        };
        
        // ============================================
        // NEW: Add user ID if auth is enabled
        // ============================================
        if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
            data.userId = Auth.getUserFilter();
            console.log('👤 Adding inventory for user:', data.userId);
        } else {
            // Fallback for development without auth
            data.userId = 'dev_user';
        }
        
        if (editId) {
            data.id = parseInt(editId);
            if (!data.imageData) {
                const existing = AppState.inventory.find(i => i.id === parseInt(editId));
                if (existing && existing.imageData) {
                    data.imageData = existing.imageData;
                }
            }
            try {
                await window.db.put('inventory', data);
            } catch (e) {
                console.warn('DB update failed, updating memory only:', e);
            }
            const idx = AppState.inventory.findIndex(i => i.id === parseInt(editId));
            if (idx !== -1) AppState.inventory[idx] = data;
            showToast('Product updated!', 'success');
        } else {
            try {
                const id = await window.db.add('inventory', data);
                data.id = id;
            } catch (e) {
                console.warn('DB add failed, using memory only:', e);
                data.id = Date.now() + Math.random() * 1000;
            }
            AppState.inventory.push(data);
            showToast('Product added!', 'success');
        }
        
        document.getElementById('inventory-modal').classList.remove('visible');
        document.getElementById('inventory-form').reset();
        document.getElementById('inv-edit-id').value = '';
        document.getElementById('inv-image-preview').style.display = 'none';
        document.getElementById('inv-image-data').value = '';
        document.getElementById('inv-image-input').value = '';
        
        renderInventory();
        renderDashboard();
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('Failed to save product', 'error');
    }
}

async function deleteInventory(id) {
    if (!confirm('Delete this product?')) return;
    try {
        try {
            await window.db.delete('inventory', id);
        } catch (e) {
            console.warn('DB delete failed, removing from memory only:', e);
        }
        AppState.inventory = AppState.inventory.filter(i => i.id !== id);
        renderInventory();
        renderDashboard();
        showToast('Product deleted', 'success');
    } catch (error) {
        showToast('Failed to delete product', 'error');
    }
}