// ============================================
// TIMELINE RENDERER
// ============================================

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    
    if (AppState.events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📅</span>
                <p>No events recorded for this venture yet.</p>
                <p style="font-size:11px;color:var(--gray-600);">Start adding events to track reality signals.</p>
            </div>
        `;
        return;
    }
    
    // Group events by date
    const grouped = {};
    AppState.events.forEach(event => {
        if (!grouped[event.date]) grouped[event.date] = [];
        grouped[event.date].push(event);
    });
    
    const dates = Object.keys(grouped).sort();
    const originDate = AppState.currentVenture ? AppState.currentVenture.originDate : dates[0];
    
    let html = '<div class="timeline">';
    
    dates.forEach((date) => {
        const events = grouped[date];
        const isOrigin = date === originDate;
        const hasLateEntry = events.some(e => e.lateEntry === true);
        
        html += `<div class="day-block">`;
        html += `<div class="day-header">`;
        html += `<span class="day-date ${hasLateEntry ? 'late-entry' : ''}">${formatDate(date)}</span>`;
        if (isOrigin) html += `<span class="origin-badge">● ORIGIN</span>`;
        if (hasLateEntry) html += `<span class="late-badge">📝 Late Entry</span>`;
        html += `</div>`;
        
        const frictionEvents = events.filter(e => e.type === 'friction');
        const supportEvents = events.filter(e => e.type === 'support');
        const maxEvents = Math.max(frictionEvents.length, supportEvents.length, 1);
        
        html += `<div class="day-row">`;
        
        // Left: Friction
        html += `<div class="day-col friction-col">`;
        frictionEvents.forEach(event => {
            html += createEventCardHTML(event, 'friction');
        });
        for (let i = frictionEvents.length; i < maxEvents; i++) {
            html += `<div style="height:24px;"></div>`;
        }
        html += `</div>`;
        
        // Center: Timeline
        html += `<div class="day-col timeline-col">`;
        html += `<div class="timeline-line"></div>`;
        html += `</div>`;
        
        // Right: Support
        html += `<div class="day-col support-col">`;
        supportEvents.forEach(event => {
            html += createEventCardHTML(event, 'support');
        });
        for (let i = supportEvents.length; i < maxEvents; i++) {
            html += `<div style="height:24px;"></div>`;
        }
        html += `</div>`;
        
        html += `</div></div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function createEventCardHTML(event, type) {
    const isLate = event.lateEntry === true;
    const amountHtml = event.amount && event.amount > 0 
        ? `<div class="event-amount amount-${type}">${type === 'friction' ? '-' : '+'} ${formatCurrency(event.amount)}</div>`
        : `<div class="event-amount amount-empty">—</div>`;
    
    return `
        <div class="event-card ${type} ${isLate ? 'late-entry' : ''}" data-event-id="${event.id}">
            ${amountHtml}
            <div class="event-description">${escapeHtml(event.description)}</div>
            <span class="event-badge">${getCategoryLabel(event.category)}</span>
            <div class="event-actions">
                <button class="edit-btn-sm" onclick="event.stopPropagation();openEditEvent(${event.id})">✎</button>
                <button class="delete-btn" onclick="event.stopPropagation();deleteEvent(${event.id})">✕</button>
            </div>
        </div>
    `;
}