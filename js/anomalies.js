// ============================================
// ANOMALY DETECTION ENGINE
// Flags statistically unusual events
// ============================================

const AnomalyEngine = {
    /**
     * Detect all anomalies in current venture data
     * @returns {Array} Array of anomaly objects
     */
    detectAnomalies() {
        const anomalies = [];
        const events = AppState.events;
        
        if (events.length < 3) return anomalies;
        
        // === ANOMALY 1: Unusually Large Amounts ===
        const amountEvents = events.filter(e => e.amount && e.amount > 0);
        if (amountEvents.length >= 3) {
            const avgAmount = amountEvents.reduce((sum, e) => sum + e.amount, 0) / amountEvents.length;
            const stdDev = Math.sqrt(
                amountEvents.reduce((sum, e) => sum + Math.pow(e.amount - avgAmount, 2), 0) / amountEvents.length
            );
            
            amountEvents.forEach(e => {
                if (e.amount > avgAmount + 2 * stdDev) {
                    anomalies.push({
                        id: 'large_amount_' + Date.now() + '_' + e.id,
                        type: 'unusual_amount',
                        severity: e.amount > avgAmount + 3 * stdDev ? 'high' : 'medium',
                        title: '💰 Unusually Large Transaction',
                        message: `${formatCurrency(e.amount)} (avg is ${formatCurrency(avgAmount)})`,
                        description: e.description,
                        date: e.date,
                        category: e.category,
                        type_label: e.type === 'support' ? 'Support' : 'Friction'
                    });
                }
            });
        }
        
        // === ANOMALY 2: Sales Gap ===
        const sales = events.filter(e => e.category === 'sale');
        if (sales.length > 0) {
            const lastSale = new Date(sales[sales.length - 1].date);
            const daysSince = (new Date() - lastSale) / 86400000;
            if (daysSince > 7) {
                anomalies.push({
                    id: 'sales_gap_' + Date.now(),
                    type: 'sales_gap',
                    severity: daysSince > 14 ? 'high' : 'medium',
                    title: '📊 Sales Gap Detected',
                    message: `No sales for ${Math.round(daysSince)} days`,
                    description: `Last sale was on ${formatDate(sales[sales.length - 1].date)}`,
                    date: sales[sales.length - 1].date,
                    daysSince: Math.round(daysSince)
                });
            }
        }
        
        // === ANOMALY 3: Consecutive Friction Events ===
        const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
        let frictionStreak = 0;
        let maxStreak = 0;
        let streakStart = null;
        
        sortedEvents.forEach(e => {
            if (e.type === 'friction') {
                frictionStreak++;
                if (frictionStreak > maxStreak) {
                    maxStreak = frictionStreak;
                    streakStart = e.date;
                }
            } else {
                frictionStreak = 0;
            }
        });
        
        if (maxStreak >= 3) {
            anomalies.push({
                id: 'friction_streak_' + Date.now(),
                type: 'friction_streak',
                severity: maxStreak >= 5 ? 'high' : 'medium',
                title: '⚠️ Friction Streak',
                message: `${maxStreak} consecutive friction events`,
                description: `Starting from ${formatDate(streakStart)}. Review these events for patterns.`,
                date: streakStart,
                count: maxStreak
            });
        }
        
        // === ANOMALY 4: Rapid Support Growth ===
        const recentEvents = events.filter(e => {
            const d = new Date(e.date);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 3);
            return d >= cutoff;
        });
        const recentSupport = recentEvents.filter(e => e.type === 'support');
        if (recentSupport.length >= 3) {
            anomalies.push({
                id: 'rapid_growth_' + Date.now(),
                type: 'rapid_growth',
                severity: 'low',
                title: '🚀 Rapid Growth Detected',
                message: `${recentSupport.length} support events in 3 days`,
                description: 'Momentum is building. Capitalize on this!',
                date: recentEvents[recentEvents.length - 1].date,
                count: recentSupport.length
            });
        }
        
        return anomalies;
    },
    
    /**
     * Get active anomalies (not yet dismissed)
     * @returns {Array} Active anomalies
     */
    getActiveAnomalies() {
        const all = this.detectAnomalies();
        // Filter out stale anomalies (older than 14 days)
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 14);
        
        return all.filter(a => {
            if (!a.date) return true;
            const date = new Date(a.date);
            return date >= cutoff || a.severity === 'high';
        });
    },
    
    /**
     * Get anomaly summary
     * @returns {Object} Summary counts
     */
    getSummary() {
        const anomalies = this.getActiveAnomalies();
        return {
            total: anomalies.length,
            high: anomalies.filter(a => a.severity === 'high').length,
            medium: anomalies.filter(a => a.severity === 'medium').length,
            low: anomalies.filter(a => a.severity === 'low').length,
            types: anomalies.map(a => a.type)
        };
    },
    
    /**
     * Render anomaly alert HTML
     * @param {Array} anomalies - Array of anomalies
     * @returns {string} HTML
     */
    renderAnomalies(anomalies) {
        if (!anomalies) anomalies = this.getActiveAnomalies();
        if (anomalies.length === 0) {
            return `
                <div class="anomaly-empty">
                    <span>✅ No anomalies detected</span>
                </div>
            `;
        }
        
        let html = '';
        anomalies.forEach(a => {
            const severityIcon = a.severity === 'high' ? '🔴' : a.severity === 'medium' ? '🟡' : '🟢';
            html += `
                <div class="anomaly-item severity-${a.severity}">
                    <div class="anomaly-header">
                        <span class="anomaly-icon">${severityIcon}</span>
                        <span class="anomaly-title">${a.title}</span>
                        <span class="anomaly-severity">${a.severity.toUpperCase()}</span>
                    </div>
                    <div class="anomaly-message">${a.message}</div>
                    ${a.description ? `<div class="anomaly-description">${a.description}</div>` : ''}
                    ${a.date ? `<div class="anomaly-date">${formatDate(a.date)}</div>` : ''}
                </div>
            `;
        });
        
        return html;
    }
};

// Expose globally
window.AnomalyEngine = AnomalyEngine;