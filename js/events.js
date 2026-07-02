// ============================================
// EVENT CRUD OPERATIONS - WITH USER ID SUPPORT
// ============================================

function openEventModal(date, isLate = false) {
    const modal = document.getElementById('event-modal');
    const dateInput = document.getElementById('event-date');
    const title = document.getElementById('event-modal-title');
    const submitBtn = document.getElementById('event-submit-btn');
    const lateCheckbox = document.getElementById('event-late-entry');
    const editId = document.getElementById('event-edit-id');
    
    if (!modal) return;
    
    const todayStr = today();
    
    editId.value = '';
    title.textContent = isLate ? 'Add Late Entry' : 'Add Event';
    submitBtn.textContent = 'Save Event';
    
    // Reset the form first
    document.getElementById('event-form').reset();
    document.getElementById('event-amount').value = '';
    document.getElementById('event-description').value = '';
    
    // Set date: default to today, or use provided date (if valid)
    let selectedDate = date || todayStr;
    
    // If the provided date is in the future, reset to today
    if (selectedDate > todayStr) {
        selectedDate = todayStr;
        showToast('⏳ Cannot record events in the future. Date set to today.', 'warning');
    }
    
    // CRITICAL: Set the date input value
    dateInput.value = selectedDate;
    
    // Set max date to today (prevents selecting future dates in picker)
    dateInput.max = todayStr;
    
    // Set min date to origin (optional - prevents going before venture started)
    if (AppState.currentVenture) {
        dateInput.min = AppState.currentVenture.originDate;
    }
    
    // If this is a late entry, check the checkbox
    lateCheckbox.checked = isLate || (selectedDate < todayStr);
    
    // Force the date input to show the value
    // Some browsers need this to update the display
    dateInput.dispatchEvent(new Event('change'));
    
    // Update help text
    updateDateHelpText(selectedDate);
    
    // Reset radio buttons to friction by default
    const frictionRadio = document.querySelector('input[name="eventType"][value="friction"]');
    if (frictionRadio) frictionRadio.checked = true;
    document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('active'));
    const frictionOpt = document.querySelector('.radio-option.friction');
    if (frictionOpt) frictionOpt.classList.add('active');
    updateCategoryOptions('friction');
    
    modal.classList.add('visible');
    
    // Setup the date handler after modal is open
    setTimeout(setupEventDateHandler, 100);
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
    const todayStr = today();
    
    editId.value = event.id;
    title.textContent = 'Edit Event';
    submitBtn.textContent = 'Update Event';
    
    // Set date - if it's a future date (shouldn't happen), reset to today
    let eventDate = event.date;
    if (eventDate > todayStr) {
        eventDate = todayStr;
        showToast('⚠️ This event was in the future. Date reset to today.', 'warning');
    }
    
    // CRITICAL: Set the date input value
    dateInput.value = eventDate;
    dateInput.max = todayStr;
    
    // Set min date to origin
    if (AppState.currentVenture) {
        dateInput.min = AppState.currentVenture.originDate;
    }
    
    amountInput.value = event.amount || '';
    descInput.value = event.description;
    lateCheckbox.checked = event.lateEntry || (eventDate < todayStr);
    
    // Force the date input to show the value
    dateInput.dispatchEvent(new Event('change'));
    
    // Update help text
    updateDateHelpText(eventDate);
    
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
    
    // Setup the date handler after modal is open
    setTimeout(setupEventDateHandler, 100);
}

/**
 * Update the help text below the date field
 */
function updateDateHelpText(selectedDate) {
    const helpText = document.getElementById('date-help-text');
    if (!helpText) return;
    
    const todayStr = today();
    
    if (selectedDate === todayStr) {
        helpText.textContent = '📅 Today\'s date is pre-filled. Select a past date for late entries.';
        helpText.style.color = 'var(--gray-500)';
    } else if (selectedDate < todayStr) {
        helpText.textContent = `📝 You're adding a late entry for ${formatDate(selectedDate)}. The "Late Entry" checkbox is auto-checked.`;
        helpText.style.color = 'var(--warning)';
    } else {
        helpText.textContent = '⏳ Future dates are not allowed. Please select today or a past date.';
        helpText.style.color = 'var(--friction)';
    }
}

/**
 * Handle date change on the event form
 * Prevents future dates and shows appropriate messages
 */
function handleEventDateChange() {
    const dateInput = document.getElementById('event-date');
    const lateCheckbox = document.getElementById('event-late-entry');
    const todayStr = today();
    
    if (!dateInput) return;
    
    const selectedDate = dateInput.value;
    
    // If user tries to select a future date
    if (selectedDate > todayStr) {
        showToast('⏳ Cannot record events in the future! Resetting to today.', 'warning');
        dateInput.value = todayStr;
        lateCheckbox.checked = false;
        updateDateHelpText(todayStr);
        return;
    }
    
    // If user selects a date before today, auto-check "late entry"
    if (selectedDate < todayStr) {
        lateCheckbox.checked = true;
    } else {
        // If date is today, uncheck late entry
        lateCheckbox.checked = false;
    }
    
    // Update help text
    updateDateHelpText(selectedDate);
}

/**
 * Setup event form date handling
 * Call this when the event modal opens
 */
function setupEventDateHandler() {
    const dateInput = document.getElementById('event-date');
    if (dateInput) {
        // Remove any existing listener to avoid duplicates
        dateInput.removeEventListener('change', handleEventDateChange);
        dateInput.addEventListener('change', handleEventDateChange);
    }
}

async function saveEvent() {
    try {
        const editId = document.getElementById('event-edit-id').value;
        let date = document.getElementById('event-date').value;
        const type = document.querySelector('input[name="eventType"]:checked')?.value;
        const category = document.getElementById('event-category').value;
        const amount = parseInt(document.getElementById('event-amount').value) || 0;
        const description = document.getElementById('event-description').value.trim();
        const lateEntry = document.getElementById('event-late-entry').checked;
        const todayStr = today();
        
        if (!date || !description) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // === CRITICAL VALIDATION: No future dates ===
        if (date > todayStr) {
            showToast('❌ Cannot record events in the future! Date set to today.', 'error');
            document.getElementById('event-date').value = todayStr;
            updateDateHelpText(todayStr);
            return;
        }
        
        // Check if date is before venture origin
        if (AppState.currentVenture && date < AppState.currentVenture.originDate) {
            showToast(`❌ Cannot record events before venture started (${formatDate(AppState.currentVenture.originDate)})`, 'error');
            return;
        }
        
        const eventData = {
            date,
            type,
            category,
            amount,
            description,
            ventureId: AppState.currentVentureId,
            lateEntry: lateEntry || date < todayStr // Auto-mark as late if date is before today
        };
        
        // ============================================
        // NEW: Add user ID if auth is enabled
        // ============================================
        if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
            eventData.userId = Auth.getUserFilter();
            console.log('👤 Adding event for user:', eventData.userId);
        } else {
            // Fallback for development without auth
            eventData.userId = 'dev_user';
        }
        
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
            
            const isLate = eventData.lateEntry;
            showToast(isLate ? '📝 Late entry added!' : '✅ Event saved!', 'success');
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