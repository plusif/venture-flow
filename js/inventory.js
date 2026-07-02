// ============================================
// INVENTORY CRUD OPERATIONS - WITH IMAGE SUPPORT (FIXED)
// ============================================

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
    
    const statusLabels = { 'for_sale': 'For Sale', 'sold': 'Sold', 'in_production': 'In Production' };
    const statusClasses = { 'for_sale': 'status-for-sale', 'sold': 'status-sold', 'in_production': 'status-production' };
    
    let html = '';
    AppState.inventory.forEach(item => {
        // Image thumbnail
        const imageHtml = item.imageData 
            ? `<div class="item-image-thumb"><img src="${item.imageData}" alt="${escapeHtml(item.name)}"></div>`
            : `<div class="item-image-thumb no-image">📷</div>`;
        
        html += `
            <div class="inventory-item">
                ${imageHtml}
                <div class="item-info">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-details">Cost: ${formatCurrency(item.cost)} | Price: ${formatCurrency(item.price)}</div>
                </div>
                <div style="text-align:right;">
                    <span class="item-status ${statusClasses[item.status] || ''}">${statusLabels[item.status] || item.status}</span>
                    <button class="edit-btn-sm" onclick="openEditInventory(${item.id})">✎</button>
                    <button class="delete-btn" onclick="deleteInventory(${item.id})">✕</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

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

// These need to be in the global scope for onclick to work
window.captureInventoryImage = function() {
    console.log('📸 Capture image called');
    const input = document.getElementById('inv-image-input');
    if (!input) {
        console.error('❌ Image input not found');
        showToast('Error: Image input not found', 'error');
        return;
    }
    
    // Check if camera is available
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Set capture attribute for camera
        input.setAttribute('capture', 'environment');
        input.setAttribute('accept', 'image/*');
        console.log('📸 Camera mode enabled');
    } else {
        // Fallback: use file input
        input.removeAttribute('capture');
        input.setAttribute('accept', 'image/*');
        console.log('📁 File upload mode (no camera)');
    }
    
    // Trigger the file picker
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
    
    // Remove capture attribute to show file picker
    input.removeAttribute('capture');
    input.setAttribute('accept', 'image/*');
    console.log('📁 File picker mode');
    
    // Trigger the file picker
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

// ============================================
// IMAGE UPLOAD HANDLER
// ============================================

window.handleInventoryImageUpload = function(event) {
    console.log('📸 Image upload handler triggered');
    const file = event.target.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }
    
    console.log('📁 File selected:', file.name, file.type, file.size);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('❌ Please select an image file.', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file size (max 5MB)
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
        
        // Validate image is required for new products
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
        
        if (editId) {
            data.id = parseInt(editId);
            // Preserve existing image if no new image was uploaded
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