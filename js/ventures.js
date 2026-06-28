// ============================================
// VENTURES CRUD OPERATIONS - FIXED
// ============================================

function renderVentures() {
    var container = document.getElementById('ventures-list');
    if (!container) return;
    
    if (AppState.ventures.length === 0) {
        container.innerHTML = 
            '<div class="empty-state">' +
                '<span class="empty-icon">🏢</span>' +
                '<p>No ventures created yet.</p>' +
                '<p style="font-size:11px;color:var(--gray-600);">Create your first venture to start tracking.</p>' +
            '</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < AppState.ventures.length; i++) {
        var v = AppState.ventures[i];
        var isActive = v.id === AppState.currentVentureId;
        var eventCount = 0;
        var debtTotal = 0;
        var sales = 0;
        
        for (var j = 0; j < AppState.events.length; j++) {
            if (AppState.events[j].ventureId === v.id) {
                eventCount++;
                if (AppState.events[j].category === 'sale') sales++;
            }
        }
        for (var d = 0; d < AppState.debts.length; d++) {
            if (AppState.debts[d].ventureId === v.id && !AppState.debts[d].repaid) {
                debtTotal += AppState.debts[d].amount;
            }
        }
        
        html += 
            '<div class="venture-list-item" onclick="switchVenture(' + v.id + ')">' +
                '<div class="venture-info">' +
                    '<div class="venture-name">' + escapeHtml(v.name) + '</div>' +
                    '<div class="venture-meta">' +
                        formatDate(v.originDate) + ' · ' + eventCount + ' events · ' + sales + ' sales' +
                        (debtTotal > 0 ? ' · Debt: ' + formatCurrency(debtTotal) : '') +
                        (eventCount === 0 ? ' · <span style="color:var(--gray-600);">No data yet</span>' : '') +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<span class="venture-status ' + (isActive ? 'active' : 'inactive') + '">' +
                        (isActive ? '● Active' : 'Switch') +
                    '</span>' +
                    '<button class="delete-btn" onclick="event.stopPropagation();deleteVenture(' + v.id + ')" title="Delete venture">✕</button>' +
                '</div>' +
            '</div>';
    }
    
    container.innerHTML = html;
}

function openVentureModal() {
    var modal = document.getElementById('venture-modal');
    if (!modal) return;
    document.getElementById('venture-form').reset();
    document.getElementById('venture-origin').value = today();
    modal.classList.add('visible');
}

async function saveVenture() {
    try {
        var name = document.getElementById('venture-name').value.trim();
        var originDate = document.getElementById('venture-origin').value;
        var description = document.getElementById('venture-description').value.trim();
        
        if (!name || !originDate) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        var data = {
            name: name,
            originDate: originDate,
            description: description,
            active: false,
            createdAt: new Date().toISOString()
        };
        
        var savedId = null;
        try {
            if (window.db.isReady && window.db.isReady()) {
                savedId = await window.db.add('venture', data);
                data.id = savedId;
                console.log('✅ Venture saved to database:', data.id);
            }
        } catch (e) {
            console.warn('DB add failed, using memory only:', e);
        }
        
        if (!data.id) {
            data.id = Date.now() + Math.random() * 1000;
        }
        
        AppState.ventures.push(data);
        await switchVenture(data.id);
        
        showToast('✨ "' + name + '" created! Start adding events.', 'success');
        
        document.getElementById('venture-modal').classList.remove('visible');
        document.getElementById('venture-form').reset();
        renderVentures();
        updateVentureSelector();
        
    } catch (error) {
        console.error('Failed to create venture:', error);
        showToast('Failed to create venture', 'error');
    }
}

async function deleteVenture(id) {
    var venture = null;
    for (var i = 0; i < AppState.ventures.length; i++) {
        if (AppState.ventures[i].id === id) {
            venture = AppState.ventures[i];
            break;
        }
    }
    if (!venture) return;
    if (AppState.ventures.length <= 1) {
        showToast('Cannot delete the last venture', 'error');
        return;
    }
    if (!confirm('Delete venture "' + venture.name + '" and ALL its data?')) return;
    
    try {
        if (window.db.isReady && window.db.isReady()) {
            try {
                var allEvents = await window.db.getAll('events');
                for (var e = 0; e < allEvents.length; e++) {
                    if (allEvents[e].ventureId === id) {
                        await window.db.delete('events', allEvents[e].id);
                    }
                }
                
                var allInventory = await window.db.getAll('inventory');
                for (var inv = 0; inv < allInventory.length; inv++) {
                    if (allInventory[inv].ventureId === id) {
                        await window.db.delete('inventory', allInventory[inv].id);
                    }
                }
                
                var allDebts = await window.db.getAll('debts');
                for (var d = 0; d < allDebts.length; d++) {
                    if (allDebts[d].ventureId === id) {
                        await window.db.delete('debts', allDebts[d].id);
                    }
                }
                
                await window.db.delete('venture', id);
                console.log('✅ Venture deleted from database');
            } catch (err) {
                console.warn('DB delete failed:', err);
            }
        }
        
        var newVentures = [];
        for (var v = 0; v < AppState.ventures.length; v++) {
            if (AppState.ventures[v].id !== id) {
                newVentures.push(AppState.ventures[v]);
            }
        }
        AppState.ventures = newVentures;
        
        var newEvents = [];
        for (var ev = 0; ev < AppState.events.length; ev++) {
            if (AppState.events[ev].ventureId !== id) {
                newEvents.push(AppState.events[ev]);
            }
        }
        AppState.events = newEvents;
        
        var newInventory = [];
        for (var inv2 = 0; inv2 < AppState.inventory.length; inv2++) {
            if (AppState.inventory[inv2].ventureId !== id) {
                newInventory.push(AppState.inventory[inv2]);
            }
        }
        AppState.inventory = newInventory;
        
        var newDebts = [];
        for (var d2 = 0; d2 < AppState.debts.length; d2++) {
            if (AppState.debts[d2].ventureId !== id) {
                newDebts.push(AppState.debts[d2]);
            }
        }
        AppState.debts = newDebts;
        
        if (AppState.currentVentureId === id) {
            var newActive = AppState.ventures[0];
            if (newActive) {
                newActive.active = true;
                if (window.db.isReady && window.db.isReady()) {
                    try {
                        await window.db.put('venture', newActive);
                    } catch (e) {}
                }
                await switchVenture(newActive.id);
            }
        }
        
        renderAll();
        showToast('"' + venture.name + '" deleted', 'success');
    } catch (error) {
        console.error('Failed to delete venture:', error);
        showToast('Failed to delete venture', 'error');
    }
}