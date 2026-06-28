// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateStr) {
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-KE', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

function formatCurrency(amount) {
    return 'Ksh ' + Number(amount).toLocaleString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getDaysRunning(originDate) {
    if (!originDate) return 0;
    try {
        const origin = new Date(originDate + 'T00:00:00');
        const now = new Date();
        return Math.ceil((now - origin) / (1000 * 60 * 60 * 24));
    } catch (e) {
        return 0;
    }
}

function today() {
    return new Date().toISOString().split('T')[0];
}

function generateId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function formatCountdown(targetDate) {
    try {
        const now = new Date();
        const target = new Date(targetDate);
        const diff = target - now;
        
        if (diff <= 0) return '⏰ Time Reached!';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        let display = '';
        if (days > 0) display += `${days}d `;
        display += `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        return display;
    } catch (e) {
        return 'Invalid date';
    }
}