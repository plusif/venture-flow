// ============================================
// ADVISOR ENGINE
// Synthesizes all engines into actionable advice
// ============================================

const Advisor = {
    /**
     * Get comprehensive recommendations
     * @returns {Array} Prioritized recommendations
     */
    getRecommendations() {
        const recommendations = [];
        
        // Gather data from all engines
        const patterns = typeof PatternEngine !== 'undefined' ? PatternEngine.getActivePatterns() : [];
        const anomalies = typeof AnomalyEngine !== 'undefined' ? AnomalyEngine.getActiveAnomalies() : [];
        const probabilities = typeof ProbabilityEngine !== 'undefined' ? ProbabilityEngine.getRecommendations() : [];
        const memory = typeof MemoryEngine !== 'undefined' ? MemoryEngine.summarize(14) : null;
        const venture = AppState.currentVenture;
        
        if (!venture || AppState.events.length === 0) {
            return [{
                priority: '💡 Getting Started',
                title: 'Start Tracking Events',
                action: 'Add your first event to start receiving intelligent advice.',
                detail: 'The more data you add, the smarter the advice becomes.'
            }];
        }
        
        // === RULE 1: Patterns to Recommendations ===
        patterns.forEach(p => {
            const priorityMap = {
                'high': '🔥 Urgent',
                'medium': '⚡ Important',
                'low': '💡 Opportunity'
            };
            
            recommendations.push({
                priority: priorityMap[p.severity] || '💡 Opportunity',
                title: p.title,
                action: p.recommendation,
                detail: p.insight,
                source: 'pattern',
                sourceId: p.id,
                severity: p.severity
            });
        });
        
        // === RULE 2: Anomalies to Alerts ===
        anomalies.forEach(a => {
            const priorityMap = {
                'high': '🔥 Urgent',
                'medium': '⚡ Important',
                'low': '💡 Opportunity'
            };
            
            recommendations.push({
                priority: priorityMap[a.severity] || '💡 Opportunity',
                title: a.title,
                action: a.message,
                detail: a.description || 'Investigate this anomaly.',
                source: 'anomaly',
                sourceId: a.id,
                severity: a.severity
            });
        });
        
        // === RULE 3: Probability Insights ===
        probabilities.forEach(p => {
            recommendations.push({
                priority: p.probability > 70 ? '⚡ Important' : '💡 Opportunity',
                title: `🎯 ${p.action.replace('_', ' ').toUpperCase()}`,
                action: p.advice,
                detail: `Probability: ${p.probability}%`,
                source: 'probability',
                severity: p.probability > 70 ? 'high' : 'medium'
            });
        });
        
        // === RULE 4: Memory-Based Advice ===
        if (memory && memory.totalEvents > 0) {
            // Sales drought
            if (memory.salesCount === 0 && AppState.daysRunning > 3) {
                recommendations.push({
                    priority: '🔥 Urgent',
                    title: '🚨 No Sales Detected',
                    action: 'Focus on closing at least one sale today.',
                    detail: `${AppState.daysRunning} days in, ${memory.interestsCount} interests, 0 sales. You need a win.`,
                    source: 'memory',
                    severity: 'high'
                });
            }
            
            // Positive momentum advice
            if (memory.netChange > 3 && memory.salesCount > 0) {
                recommendations.push({
                    priority: '💡 Opportunity',
                    title: '📈 Capitalize on Momentum',
                    action: 'Double down on what\'s working. Consider increasing marketing or outreach.',
                    detail: `Last ${memory.period} days have been positive with ${memory.supportCount} support events.`,
                    source: 'memory',
                    severity: 'low'
                });
            }
            
            // Debt advice
            const debtRatio = memory.frictionAmount / (memory.supportAmount || 1);
            if (debtRatio > 1.5) {
                recommendations.push({
                    priority: '⚡ Important',
                    title: '💰 Debt-to-Support Ratio High',
                    action: 'Review expenses and look for ways to reduce costs.',
                    detail: `Friction (${formatCurrency(memory.frictionAmount)}) exceeds support (${formatCurrency(memory.supportAmount)}) by ${formatCurrency(memory.netAmount)}.`,
                    source: 'memory',
                    severity: 'medium'
                });
            }
        }
        
        // === RULE 5: Venture Age Advice ===
        const days = AppState.daysRunning;
        if (days > 0 && AppState.events.length < days * 0.5) {
            recommendations.push({
                priority: '💡 Opportunity',
                title: '📝 Increase Event Frequency',
                action: 'Try to log at least one event per day to get better insights.',
                detail: `You have ${AppState.events.length} events over ${days} days. More data = better advice.`,
                source: 'memory',
                severity: 'low'
            });
        }
        
        // Sort by priority
        const priorityOrder = { '🔥 Urgent': 0, '⚡ Important': 1, '💡 Opportunity': 2 };
        recommendations.sort((a, b) => {
            return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        });
        
        // Remove duplicates (by title)
        const seen = new Set();
        return recommendations.filter(r => {
            const key = r.title;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },
    
    /**
     * Get summary of advisor status
     * @returns {Object} Status summary
     */
    getStatus() {
        const recommendations = this.getRecommendations();
        const urgent = recommendations.filter(r => r.priority === '🔥 Urgent').length;
        const important = recommendations.filter(r => r.priority === '⚡ Important').length;
        const opportunities = recommendations.filter(r => r.priority === '💡 Opportunity').length;
        
        return {
            total: recommendations.length,
            urgent: urgent,
            important: important,
            opportunities: opportunities,
            topRecommendation: recommendations.length > 0 ? recommendations[0] : null,
            hasUrgent: urgent > 0
        };
    },
    
    /**
     * Render advisor HTML
     * @param {Array} recommendations - Optional recommendations array
     * @returns {string} HTML
     */
    render(recommendations) {
        if (!recommendations) recommendations = this.getRecommendations();
        
        if (recommendations.length === 0) {
            return `
                <div class="advisor-empty">
                    <span class="advisor-icon">🧠</span>
                    <p>No recommendations yet. Keep adding events to get smarter advice.</p>
                </div>
            `;
        }
        
        let html = `<div class="advisor-list">`;
        recommendations.forEach(r => {
            const priorityIcon = r.priority === '🔥 Urgent' ? '🔴' : 
                               r.priority === '⚡ Important' ? '🟡' : '🟢';
            html += `
                <div class="advisor-item priority-${r.priority.replace('🔥 ', '').replace('⚡ ', '').replace('💡 ', '').toLowerCase()}">
                    <div class="advisor-header">
                        <span class="advisor-priority">${r.priority}</span>
                        <span class="advisor-title">${r.title}</span>
                    </div>
                    <div class="advisor-action">${r.action}</div>
                    <div class="advisor-detail">${r.detail}</div>
                    ${r.source ? `<div class="advisor-source">Source: ${r.source}</div>` : ''}
                </div>
            `;
        });
        html += `</div>`;
        
        return html;
    },
    
    /**
     * Initialize advisor (no registration needed - HTML already has it)
     */
    init() {
        console.log('🧠 Advisor initialized (using hardcoded HTML)');
        // Just render if the container exists
        const container = document.getElementById('advisor-container');
        if (container) {
            renderAdvisor();
        }
    }
};

// Render function for advisor view
function renderAdvisor() {
    const container = document.getElementById('advisor-container');
    if (!container) return;
    
    const status = Advisor.getStatus();
    const recommendations = Advisor.getRecommendations();
    
    // Add alert badge if urgent
    const badgeHtml = status.hasUrgent 
        ? `<div class="advisor-alert">⚠️ ${status.urgent} urgent ${status.urgent === 1 ? 'issue' : 'issues'} need attention</div>` 
        : '';
    
    container.innerHTML = `
        <div class="advisor-header-bar">
            <h2>🧠 Intelligent Advisor</h2>
            <div class="advisor-stats">
                <span class="advisor-stat urgent">🔥 ${status.urgent}</span>
                <span class="advisor-stat important">⚡ ${status.important}</span>
                <span class="advisor-stat opportunity">💡 ${status.opportunities}</span>
            </div>
        </div>
        ${badgeHtml}
        <div class="advisor-content">
            ${Advisor.render(recommendations)}
        </div>
    `;
}

// Expose globally
window.Advisor = Advisor;
window.renderAdvisor = renderAdvisor;