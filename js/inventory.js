// ============================================
// INVENTORY CRUD OPERATIONS - FIXED
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
        html += `
            <div class="inventory-item">
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
    
    if (data) {
        editId.value = data.id;
        title.textContent = 'Edit Product';
        submitBtn.textContent = 'Update Product';
        document.getElementById('inv-name').value = data.name;
        document.getElementById('inv-cost').value = data.cost;
        document.getElementById('inv-price').value = data.price;
        document.getElementById('inv-status').value = data.status;
    } else {
        editId.value = '';
        title.textContent = 'Add Product';
        submitBtn.textContent = 'Add Product';
        document.getElementById('inventory-form').reset();
        document.getElementById('inv-status').value = 'for_sale';
    }
    
    modal.classList.add('visible');
}

function openEditInventory(id) {
    const item = AppState.inventory.find(i => i.id === id);
    if (item) openInventoryModal(item);
}

async function saveInventory() {
    try {
        const editId = document.getElementById('inv-edit-id').value;
        const name = document.getElementById('inv-name').value.trim();
        const cost = parseInt(document.getElementById('inv-cost').value) || 0;
        const price = parseInt(document.getElementById('inv-price').value) || 0;
        const status = document.getElementById('inv-status').value;
        
        if (!name) {
            showToast('Please enter a product name', 'error');
            return;
        }
        
        const data = { name, cost, price, status, ventureId: AppState.currentVentureId };
        
        if (editId) {
            data.id = parseInt(editId);
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
        
        renderInventory();
        renderDashboard();
    } catch (error) {
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