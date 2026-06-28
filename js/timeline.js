// ============================================
// TIMELINE RENDERER
// ============================================

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    
    const venture = AppState.currentVenture;
    if (!venture) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📅</span>
                <p>No venture selected.</p>
            </div>
        `;
        return;
    }
    
    // Get date range: from origin to today
    const originDate = new Date(venture.originDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // If origin is in the future, show a message
    if (originDate > today) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⏳</span>
                <p>Venture starts on ${formatDate(venture.originDate)}</p>
                <p style="font-size:11px;color:var(--gray-600);">The timeline will unfold when the day arrives.</p>
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
    
    // Generate all dates from origin to today
    const allDates = [];
    const currentDate = new Date(originDate);
    while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        allDates.push(dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    let html = '<div class="timeline">';
    
    // Show today's date as a marker
    const todayStr = today.toISOString().split('T')[0];
    
    allDates.forEach((date, index) => {
        const events = grouped[date] || [];
        const isOrigin = date === venture.originDate;
        const isToday = date === todayStr;
        const hasLateEntry = events.some(e => e.lateEntry === true);
        const isEmpty = events.length === 0;
        const isPast = date < todayStr;
        const isFuture = date > todayStr;
        
        // Skip future dates (shouldn't happen since we stop at today)
        if (isFuture) return;
        
        html += `<div class="day-block ${isToday ? 'today' : ''} ${isEmpty ? 'empty-day' : ''}">`;
        html += `<div class="day-header">`;
        
        // Date with today indicator
        let dateDisplay = formatDate(date);
        if (isToday) dateDisplay = `📍 ${dateDisplay} (Today)`;
        html += `<span class="day-date ${hasLateEntry ? 'late-entry' : ''} ${isToday ? 'today-label' : ''}">${dateDisplay}</span>`;
        
        if (isOrigin) html += `<span class="origin-badge">● ORIGIN</span>`;
        if (hasLateEntry) html += `<span class="late-badge">📝 Late Entry</span>`;
        if (isEmpty && isPast) html += `<span class="empty-badge">⏳ No activity</span>`;
        if (isEmpty && isToday) html += `<span class="empty-badge today-empty">📝 Add your first event for today</span>`;
        
        html += `</div>`;
        
        if (isEmpty) {
            // Empty day - show a placeholder
            html += `
                <div class="day-row empty-row">
                    <div class="day-col friction-col">
                        <div class="empty-placeholder"></div>
                    </div>
                    <div class="day-col timeline-col">
                        <div class="timeline-line"></div>
                    </div>
                    <div class="day-col support-col">
                        <div class="empty-placeholder"></div>
                    </div>
                </div>
            `;
        } else {
            // Day with events
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
            
            html += `</div>`;
        }
        
        html += `</div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // If no events at all, show a more helpful message
    if (AppState.events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📅</span>
                <p>No events recorded for this venture yet.</p>
                <p style="font-size:11px;color:var(--gray-600);">The timeline shows ${allDates.length} days from origin to today.</p>
                <p style="font-size:11px;color:var(--gray-600);">Start adding events to track reality signals.</p>
                <button class="add-btn" onclick="document.getElementById('add-event-btn')?.click()" style="margin-top:10px;">＋ Add First Event</button>
            </div>
        `;
    }
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