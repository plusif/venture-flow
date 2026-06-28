// ============================================
// EVENT CRUD OPERATIONS - FIXED
// ============================================

function openEventModal(date, isLate = false) {
    const modal = document.getElementById('event-modal');
    const dateInput = document.getElementById('event-date');
    const title = document.getElementById('event-modal-title');
    const submitBtn = document.getElementById('event-submit-btn');
    const lateCheckbox = document.getElementById('event-late-entry');
    const editId = document.getElementById('event-edit-id');
    
    if (!modal) return;
    
    editId.value = '';
    title.textContent = isLate ? 'Add Late Entry' : 'Add Event';
    submitBtn.textContent = 'Save Event';
    lateCheckbox.checked = isLate;
    dateInput.value = date || today();
    
    document.getElementById('event-form').reset();
    document.getElementById('event-amount').value = '';
    document.getElementById('event-description').value = '';
    
    const frictionRadio = document.querySelector('input[name="eventType"][value="friction"]');
    if (frictionRadio) frictionRadio.checked = true;
    document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('active'));
    const frictionOpt = document.querySelector('.radio-option.friction');
    if (frictionOpt) frictionOpt.classList.add('active');
    updateCategoryOptions('friction');
    
    modal.classList.add('visible');
}

function openEditEvent(id) {
    const event = AppState.events.find(e => e.id === id);
    if (!event) return;
    
    const modal = document.getElementById('event-modal');
    if (!modal) return;
    
    const title = document.getElementById('event-modal-title');
    const submitBtn = document.getElementById('event-submit-btn');
    const editId = document.getElementById('event-edit-id');
    const dateInput = document.getElementById('event-date');
    const categorySelect = document.getElementById('event-category');
    const amountInput = document.getElementById('event-amount');
    const descInput = document.getElementById('event-description');
    const lateCheckbox = document.getElementById('event-late-entry');
    
    editId.value = event.id;
    title.textContent = 'Edit Event';
    submitBtn.textContent = 'Update Event';
    dateInput.value = event.date;
    amountInput.value = event.amount || '';
    descInput.value = event.description;
    lateCheckbox.checked = event.lateEntry || false;
    
    const typeInput = document.querySelector(`input[name="eventType"][value="${event.type}"]`);
    if (typeInput) {
        typeInput.checked = true;
        document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('active'));
        const typeOpt = document.querySelector(`.radio-option.${event.type}`);
        if (typeOpt) typeOpt.classList.add('active');
        updateCategoryOptions(event.type);
    }
    
    if (categorySelect) categorySelect.value = event.category;
    modal.classList.add('visible');
}

async function saveEvent() {
    try {
        const editId = document.getElementById('event-edit-id').value;
        const date = document.getElementById('event-date').value;
        const type = document.querySelector('input[name="eventType"]:checked')?.value;
        const category = document.getElementById('event-category').value;
        const amount = parseInt(document.getElementById('event-amount').value) || 0;
        const description = document.getElementById('event-description').value.trim();
        const lateEntry = document.getElementById('event-late-entry').checked;
        
        if (!date || !description) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const eventData = {
            date,
            type,
            category,
            amount,
            description,
            ventureId: AppState.currentVentureId,
            lateEntry
        };
        
        if (editId) {
            // Update existing
            eventData.id = parseInt(editId);
            try {
                await window.db.put('events', eventData);
            } catch (e) {
                console.warn('DB update failed, updating memory only:', e);
            }
            const idx = AppState.events.findIndex(e => e.id === parseInt(editId));
            if (idx !== -1) AppState.events[idx] = eventData;
            showToast('Event updated successfully!', 'success');
        } else {
            // Add new
            try {
                const id = await window.db.add('events', eventData);
                eventData.id = id;
            } catch (e) {
                console.warn('DB add failed, using memory only:', e);
                eventData.id = Date.now() + Math.random() * 1000;
            }
            AppState.events.push(eventData);
            AppState.events.sort((a, b) => new Date(a.date) - new Date(b.date));
            showToast(lateEntry ? 'Late entry added!' : 'Event saved!', 'success');
        }
        
        document.getElementById('event-modal').classList.remove('visible');
        
        renderTimeline();
        renderDashboard();
        renderReports();
        updateStatusBar();
        
    } catch (error) {
        console.error('Error saving event:', error);
        showToast('Failed to save event', 'error');
    }
}

async function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    try {
        try {
            await window.db.delete('events', id);
        } catch (e) {
            console.warn('DB delete failed, removing from memory only:', e);
        }
        AppState.events = AppState.events.filter(e => e.id !== id);
        renderTimeline();
        renderDashboard();
        renderReports();
        updateStatusBar();
        showToast('Event deleted', 'success');
    } catch (error) {
        showToast('Failed to delete event', 'error');
    }
}