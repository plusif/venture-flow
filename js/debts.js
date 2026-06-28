// ============================================
// DEBTS CRUD OPERATIONS - FIXED
// ============================================

function renderDebts() {
    const container = document.getElementById('debts-list');
    if (!container) return;
    
    if (AppState.debts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">💰</span>
                <p>No debts recorded.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    AppState.debts.forEach(debt => {
        html += `
            <div class="debt-item">
                <div class="debt-info">
                    <div class="debt-creditor">${escapeHtml(debt.creditor)}</div>
                    <div style="font-size:11px;color:var(--gray-500);">${formatDate(debt.dateBorrowed)}</div>
                </div>
                <div style="text-align:right;">
                    <div class="debt-amount">${formatCurrency(debt.amount)}</div>
                    <div>
                        <span class="debt-status ${debt.repaid ? 'debt-status-paid' : 'debt-status-unpaid'}">
                            ${debt.repaid ? 'Paid' : 'Unpaid'}
                        </span>
                        ${!debt.repaid ? `<button class="edit-btn-sm" onclick="markDebtPaid(${debt.id})">✓</button>` : ''}
                        <button class="edit-btn-sm" onclick="openEditDebt(${debt.id})">✎</button>
                        <button class="delete-btn" onclick="deleteDebt(${debt.id})">✕</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function openDebtModal(data = null) {
    const modal = document.getElementById('debt-modal');
    if (!modal) return;
    
    const editId = document.getElementById('debt-edit-id');
    const title = document.getElementById('debt-modal-title');
    const submitBtn = document.getElementById('debt-submit-btn');
    
    if (data) {
        editId.value = data.id;
        title.textContent = 'Edit Debt';
        submitBtn.textContent = 'Update Debt';
        document.getElementById('debt-creditor').value = data.creditor;
        document.getElementById('debt-amount').value = data.amount;
        document.getElementById('debt-date').value = data.dateBorrowed;
    } else {
        editId.value = '';
        title.textContent = 'Add Debt';
        submitBtn.textContent = 'Add Debt';
        document.getElementById('debt-form').reset();
        document.getElementById('debt-date').value = today();
    }
    
    modal.classList.add('visible');
}

function openEditDebt(id) {
    const debt = AppState.debts.find(d => d.id === id);
    if (debt) openDebtModal(debt);
}

async function saveDebt() {
    try {
        const editId = document.getElementById('debt-edit-id').value;
        const creditor = document.getElementById('debt-creditor').value.trim();
        const amount = parseInt(document.getElementById('debt-amount').value) || 0;
        const dateBorrowed = document.getElementById('debt-date').value;
        
        if (!creditor || !dateBorrowed) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const data = { creditor, amount, dateBorrowed, repaid: false, ventureId: AppState.currentVentureId };
        
        if (editId) {
            data.id = parseInt(editId);
            const existing = AppState.debts.find(d => d.id === parseInt(editId));
            if (existing) data.repaid = existing.repaid;
            try {
                await window.db.put('debts', data);
            } catch (e) {
                console.warn('DB update failed, updating memory only:', e);
            }
            const idx = AppState.debts.findIndex(d => d.id === parseInt(editId));
            if (idx !== -1) AppState.debts[idx] = data;
            showToast('Debt updated!', 'success');
        } else {
            try {
                const id = await window.db.add('debts', data);
                data.id = id;
            } catch (e) {
                console.warn('DB add failed, using memory only:', e);
                data.id = Date.now() + Math.random() * 1000;
            }
            AppState.debts.push(data);
            
            // Also add as friction event
            const eventData = {
                date: dateBorrowed,
                type: 'friction',
                category: 'debt_borrowed',
                amount: amount,
                description: `Borrowed ${formatCurrency(amount)} from ${creditor}`,
                ventureId: AppState.currentVentureId,
                lateEntry: false
            };
            try {
                const id = await window.db.add('events', eventData);
                eventData.id = id;
            } catch (e) {
                console.warn('DB event add failed, using memory only:', e);
                eventData.id = Date.now() + Math.random() * 1000;
            }
            AppState.events.push(eventData);
            AppState.events.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            showToast('Debt added!', 'success');
        }
        
        document.getElementById('debt-modal').classList.remove('visible');
        document.getElementById('debt-form').reset();
        document.getElementById('debt-edit-id').value = '';
        
        renderDebts();
        renderTimeline();
        renderDashboard();
        renderReports();
        updateStatusBar();
    } catch (error) {
        showToast('Failed to save debt', 'error');
    }
}

async function markDebtPaid(id) {
    if (!confirm('Mark this debt as paid?')) return;
    try {
        const debt = AppState.debts.find(d => d.id === id);
        if (debt) {
            debt.repaid = true;
            debt.repaidDate = today();
            try {
                await window.db.put('debts', debt);
            } catch (e) {
                console.warn('DB update failed, updating memory only:', e);
            }
            
            // Also add as a support event
            const eventData = {
                date: debt.repaidDate,
                type: 'support',
                category: 'debt_repaid',
                amount: debt.amount,
                description: `Repaid ${debt.creditor} ${formatCurrency(debt.amount)}`,
                ventureId: AppState.currentVentureId,
                lateEntry: false
            };
            try {
                const id = await window.db.add('events', eventData);
                eventData.id = id;
            } catch (e) {
                console.warn('DB event add failed, using memory only:', e);
                eventData.id = Date.now() + Math.random() * 1000;
            }
            AppState.events.push(eventData);
            AppState.events.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            renderDebts();
            renderTimeline();
            renderDashboard();
            renderReports();
            updateStatusBar();
            showToast('Debt marked as paid', 'success');
        }
    } catch (error) {
        showToast('Failed to mark debt as paid', 'error');
    }
}

async function deleteDebt(id) {
    if (!confirm('Delete this debt?')) return;
    try {
        try {
            await window.db.delete('debts', id);
        } catch (e) {
            console.warn('DB delete failed, removing from memory only:', e);
        }
        AppState.debts = AppState.debts.filter(d => d.id !== id);
        renderDebts();
        renderDashboard();
        showToast('Debt deleted', 'success');
    } catch (error) {
        showToast('Failed to delete debt', 'error');
    }
}