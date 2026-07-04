// ============================================
// TIMELINE RENDERER - FIXED (Timezone Issue)
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
    
    // ============================================
    // FIX: Get today's date properly with timezone
    // ============================================
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = year + '-' + month + '-' + day;
    const today = new Date(todayStr + 'T00:00:00');
    
    // Get origin date
    const originDate = new Date(venture.originDate + 'T00:00:00');
    
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
    
    // === CRITICAL: Filter events to only include today and past ===
    const validEvents = AppState.events.filter(e => e.date <= todayStr);
    
    // If there are future events in the database, log a warning
    const futureEvents = AppState.events.filter(e => e.date > todayStr);
    if (futureEvents.length > 0) {
        console.warn(`⚠️ Found ${futureEvents.length} future events. They will not be displayed.`, futureEvents);
    }
    
    // Group events by date (only valid events)
    const grouped = {};
    validEvents.forEach(event => {
        if (!grouped[event.date]) grouped[event.date] = [];
        grouped[event.date].push(event);
    });
    
    // ============================================
    // FIX: Generate all dates using timezone-safe method
    // ============================================
    const allDates = [];
    const currentDate = new Date(originDate);
    while (currentDate <= today) {
        // Use local date components instead of toISOString()
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = y + '-' + m + '-' + d;
        allDates.push(dateStr);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // If no dates (shouldn't happen), show empty
    if (allDates.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📅</span>
                <p>No dates in timeline.</p>
            </div>
        `;
        return;
    }
    
    // ============================================
    // BUILD TIMELINE HTML WITH NAVIGATION
    // ============================================
    
    let html = `
        <!-- Timeline Navigation -->
        <div class="timeline-nav">
            <div class="timeline-nav-left">
                <button class="timeline-nav-btn" onclick="scrollToToday()" title="Jump to Today">
                    📍 Today
                </button>
                <button class="timeline-nav-btn" onclick="scrollToOrigin()" title="Jump to Origin">
                    🏁 Origin
                </button>
            </div>
            <div class="timeline-nav-right">
                <input type="date" id="timeline-date-jump" class="timeline-date-jump" 
                       min="${venture.originDate}" max="${todayStr}" 
                       onchange="jumpToDate(this.value)">
                <label for="timeline-date-jump" class="timeline-jump-label">Jump to</label>
            </div>
        </div>
    `;
    
    html += '<div class="timeline" id="timeline-scroll-container">';
    
    allDates.forEach((date) => {
        const events = grouped[date] || [];
        const isOrigin = date === venture.originDate;
        const isToday = date === todayStr;
        const hasLateEntry = events.some(e => e.lateEntry === true);
        const isEmpty = events.length === 0;
        
        // Add a data attribute for easy targeting
        html += `<div class="day-block ${isToday ? 'today' : ''} ${isEmpty ? 'empty-day' : ''}" data-date="${date}" id="day-${date}">`;
        html += `<div class="day-header">`;
        
        // Date with today indicator
        let dateDisplay = formatDate(date);
        if (isToday) dateDisplay = `📍 ${dateDisplay} (Today)`;
        html += `<span class="day-date ${hasLateEntry ? 'late-entry' : ''} ${isToday ? 'today-label' : ''}">${dateDisplay}</span>`;
        
        if (isOrigin) html += `<span class="origin-badge">● ORIGIN</span>`;
        if (hasLateEntry) html += `<span class="late-badge">📝 Late Entry</span>`;
        if (isEmpty) html += `<span class="empty-badge">⏳ No activity</span>`;
        
        html += `</div>`;
        
        if (isEmpty) {
            // Empty day - show a placeholder with click-to-add functionality
            html += `
                <div class="day-row empty-row" onclick="openEventModal('${date}', true)">
                    <div class="day-col friction-col">
                        <div class="empty-placeholder">＋</div>
                    </div>
                    <div class="day-col timeline-col">
                        <div class="timeline-line"></div>
                    </div>
                    <div class="day-col support-col">
                        <div class="empty-placeholder">＋</div>
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
    
    // ============================================
    // Check for events BEFORE setting innerHTML
    // ============================================
    if (validEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📅</span>
                <p>No events recorded for this venture yet.</p>
                <p style="font-size:11px;color:var(--gray-600);">The timeline shows ${allDates.length} days from origin to today.</p>
                <p style="font-size:11px;color:var(--gray-600);">Start adding events to track reality signals.</p>
                <button class="add-btn" onclick="document.getElementById('add-event-btn')?.click()" style="margin-top:10px;">＋ Add First Event</button>
            </div>
        `;
        return;
    }
    
    // Set the HTML content
    container.innerHTML = html;
    
    // ============================================
    // AUTO-SCROLL TO TODAY
    // ============================================
    setTimeout(() => {
        if (typeof scrollToToday === 'function') {
            scrollToToday();
        }
    }, 200);
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

// ============================================
// TIMELINE NAVIGATION FUNCTIONS
// ============================================

/**
 * Scroll to today's entry in the timeline
 */
function scrollToToday() {
    // Use timezone-safe method for today
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = year + '-' + month + '-' + day;
    
    const todayElement = document.getElementById('day-' + todayStr);
    const container = document.getElementById('timeline-scroll-container');
    
    if (todayElement && container) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            const containerRect = container.getBoundingClientRect();
            const todayRect = todayElement.getBoundingClientRect();
            const scrollOffset = todayRect.top - containerRect.top + container.scrollTop - 20;
            
            mainContent.scrollTo({
                top: scrollOffset,
                behavior: 'smooth'
            });
        }
    } else {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.scrollTo({
                top: mainContent.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
}

/**
 * Scroll to the origin date
 */
function scrollToOrigin() {
    const venture = AppState.currentVenture;
    if (!venture) return;
    
    const originElement = document.getElementById('day-' + venture.originDate);
    const container = document.getElementById('timeline-scroll-container');
    
    if (originElement && container) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            const containerRect = container.getBoundingClientRect();
            const originRect = originElement.getBoundingClientRect();
            const scrollOffset = originRect.top - containerRect.top + container.scrollTop - 20;
            
            mainContent.scrollTo({
                top: scrollOffset,
                behavior: 'smooth'
            });
        }
    }
}

/**
 * Jump to a specific date
 * @param {string} dateStr - Date in YYYY-MM-DD format
 */
function jumpToDate(dateStr) {
    if (!dateStr) return;
    
    const targetElement = document.getElementById('day-' + dateStr);
    const container = document.getElementById('timeline-scroll-container');
    
    if (targetElement && container) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            const containerRect = container.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            const scrollOffset = targetRect.top - containerRect.top + container.scrollTop - 20;
            
            mainContent.scrollTo({
                top: scrollOffset,
                behavior: 'smooth'
            });
            
            // Highlight the target briefly
            targetElement.style.transition = 'background 0.3s';
            targetElement.style.background = 'rgba(46, 204, 113, 0.1)';
            setTimeout(() => {
                targetElement.style.background = '';
            }, 1500);
        }
    } else {
        showToast('No entries found for this date', 'warning');
    }
}

// Make navigation functions globally accessible
window.scrollToToday = scrollToToday;
window.scrollToOrigin = scrollToOrigin;
window.jumpToDate = jumpToDate;