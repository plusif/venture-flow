// ============================================
// ADVISOR ENGINE - WITH AUTO-REFRESH & INTERACTIVE FILTERS
// Synthesizes all engines into actionable advice
// ============================================

// Track current filter state
let advisorFilter = 'all'; // 'all', 'urgent', 'important', 'opportunity'

const Advisor = {
    /**
     * Get comprehensive recommendations with real-time data
     * NOW includes time-based anomalies that update automatically
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
        const todayStr = today();
        
        if (!venture || AppState.events.length === 0) {
            return [{
                priority: '💡 Getting Started',
                title: 'Start Tracking Events',
                action: 'Add your first event to start receiving intelligent advice.',
                detail: 'The more data you add, the smarter the advice becomes.'
            }];
        }

        // ============================================
        // TIME-BASED RECOMMENDATIONS
        // These update automatically even without new events!
        // ============================================

        // 1. Sales drought (time-based)
        const sales = AppState.sales;
        if (sales.length > 0) {
            const lastSale = new Date(sales[sales.length - 1].date);
            const daysSinceSale = Math.floor((new Date() - lastSale) / 86400000);
            
            if (daysSinceSale >= 3) {
                recommendations.push({
                    priority: daysSinceSale >= 7 ? '🔥 Urgent' : '⚡ Important',
                    title: `📊 ${daysSinceSale} Days Since Last Sale`,
                    action: daysSinceSale >= 7 
                        ? 'Urgent: No sales for over a week. Reach out to past customers or run a promotion.'
                        : 'Follow up with interested prospects. Consider a small discount to close deals.',
                    detail: `Last sale was on ${formatDate(sales[sales.length - 1].date)}. ${daysSinceSale} days ago.`,
                    source: 'time-based',
                    severity: daysSinceSale >= 7 ? 'high' : 'medium'
                });
            }
        } else if (AppState.daysRunning > 3) {
            // No sales at all after 3+ days
            recommendations.push({
                priority: AppState.daysRunning > 7 ? '🔥 Urgent' : '⚡ Important',
                title: `🚨 ${AppState.daysRunning} Days, 0 Sales`,
                action: 'Focus on getting your first sale. Lower prices, offer a trial, or increase outreach.',
                detail: `You've been running for ${AppState.daysRunning} days with no sales. This is critical.`,
                source: 'time-based',
                severity: AppState.daysRunning > 7 ? 'high' : 'medium'
            });
        }

        // 2. Activity drought (time-based)
        const lastEvent = AppState.events.length > 0 
            ? new Date(AppState.events[AppState.events.length - 1].date)
            : null;
        
        if (lastEvent) {
            const daysSinceEvent = Math.floor((new Date() - lastEvent) / 86400000);
            if (daysSinceEvent >= 3) {
                recommendations.push({
                    priority: daysSinceEvent >= 7 ? '⚡ Important' : '💡 Opportunity',
                    title: `📝 ${daysSinceEvent} Days Since Last Event`,
                    action: 'Add a late entry to keep your timeline current. Even small events matter.',
                    detail: `Your last event was on ${formatDate(lastEvent.toISOString().split('T')[0])}.`,
                    source: 'time-based',
                    severity: daysSinceEvent >= 7 ? 'medium' : 'low'
                });
            }
        }

        // 3. Venture age milestones (time-based)
        const days = AppState.daysRunning;
        if (days > 0 && days % 7 === 0 && days > 0) {
            recommendations.push({
                priority: '💡 Opportunity',
                title: `🎉 ${days} Days Running!`,
                action: 'Review your progress. What\'s working? What isn\'t? Time for a strategy review.',
                detail: `You've been at this for ${days} days. Milestone reached!`,
                source: 'time-based',
                severity: 'low'
            });
        }

        // 4. Day of week patterns (time-based)
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0) { // Sunday
            recommendations.push({
                priority: '💡 Opportunity',
                title: '📅 Week Ahead Planning',
                action: 'Plan your week. Set 3 key goals for the next 7 days.',
                detail: 'Sunday is a great day to review last week and plan the week ahead.',
                source: 'time-based',
                severity: 'low'
            });
        }
        if (dayOfWeek === 5) { // Friday
            recommendations.push({
                priority: '💡 Opportunity',
                title: '📅 Week in Review',
                action: 'Review this week\'s events. What worked? What didn\'t?',
                detail: 'Friday is a good day to reflect on the week\'s progress.',
                source: 'time-based',
                severity: 'low'
            });
        }

        // 5. Month-end check (time-based)
        const todayDate = new Date();
        const lastDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
        if (todayDate.getDate() === lastDayOfMonth) {
            recommendations.push({
                priority: '💡 Opportunity',
                title: '📊 Month-End Review',
                action: 'Review your monthly performance. Calculate total support, friction, and net position.',
                detail: `Last day of the month. Time to assess your progress over the past ${todayDate.getMonth() + 1} months.`,
                source: 'time-based',
                severity: 'low'
            });
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
            // Sales drought (from memory) - only if no time-based sales drought exists
            const hasSalesDrought = recommendations.some(r => 
                r.title.includes('Days Since Last Sale') || r.title.includes('0 Sales')
            );
            
            if (memory.salesCount === 0 && AppState.daysRunning > 3 && !hasSalesDrought) {
                recommendations.push({
                    priority: AppState.daysRunning > 7 ? '🔥 Urgent' : '⚡ Important',
                    title: '🚨 No Sales Detected',
                    action: 'Focus on closing at least one sale today.',
                    detail: `${AppState.daysRunning} days in, ${memory.interestsCount} interests, 0 sales. You need a win.`,
                    source: 'memory',
                    severity: AppState.daysRunning > 7 ? 'high' : 'medium'
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
        const days2 = AppState.daysRunning;
        if (days2 > 0 && AppState.events.length < days2 * 0.5) {
            recommendations.push({
                priority: '💡 Opportunity',
                title: '📝 Increase Event Frequency',
                action: 'Try to log at least one event per day to get better insights.',
                detail: `You have ${AppState.events.length} events over ${days2} days. More data = better advice.`,
                source: 'memory',
                severity: 'low'
            });
        }
        
        // === RULE 6: Financial Health Check ===
        const totalDebt = AppState.totalUnpaidDebt;
        const totalSupport = AppState.totalSupport;
        if (totalDebt > 0 && totalSupport > 0) {
            const debtRatio2 = totalDebt / totalSupport;
            if (debtRatio2 > 2) {
                recommendations.push({
                    priority: '🔥 Urgent',
                    title: '⚠️ Critical Debt Level',
                    action: 'Debt is more than 2x support. Stop borrowing and focus on revenue generation.',
                    detail: `Debt: ${formatCurrency(totalDebt)} · Support: ${formatCurrency(totalSupport)} · Ratio: ${Math.round(debtRatio2 * 100)}%`,
                    source: 'financial',
                    severity: 'high'
                });
            } else if (debtRatio2 > 1.2) {
                recommendations.push({
                    priority: '⚡ Important',
                    title: '⚠️ High Debt Level',
                    action: 'Debt is exceeding support. Consider reducing expenses or increasing revenue.',
                    detail: `Debt: ${formatCurrency(totalDebt)} · Support: ${formatCurrency(totalSupport)} · Ratio: ${Math.round(debtRatio2 * 100)}%`,
                    source: 'financial',
                    severity: 'medium'
                });
            }
        }

        // === RULE 7: Inventory Health Check ===
        const forSale = AppState.inventoryForSale.length;
        const sold = AppState.inventorySold.length;
        if (forSale > 0 && sold === 0 && AppState.daysRunning > 5) {
            recommendations.push({
                priority: '⚡ Important',
                title: '📦 Inventory Not Moving',
                action: 'You have products for sale but no sales. Consider reducing prices or increasing marketing.',
                detail: `${forSale} products for sale, 0 sold. Time to review your pricing or promotion strategy.`,
                source: 'inventory',
                severity: 'medium'
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
     * Get filtered recommendations
     * @param {string} filter - 'all', 'urgent', 'important', 'opportunity'
     * @returns {Array} Filtered recommendations
     */
    getFilteredRecommendations(filter = 'all') {
        const all = this.getRecommendations();
        
        if (filter === 'all') return all;
        
        const priorityMap = {
            'urgent': '🔥 Urgent',
            'important': '⚡ Important',
            'opportunity': '💡 Opportunity'
        };
        
        const targetPriority = priorityMap[filter];
        if (!targetPriority) return all;
        
        return all.filter(r => r.priority === targetPriority);
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
            hasUrgent: urgent > 0,
            lastUpdated: new Date().toISOString()
        };
    },
    
    /**
     * Render advisor HTML with filter tabs
     * @param {Array} recommendations - Optional recommendations array
     * @param {string} filter - Current filter
     * @returns {string} HTML
     */
    render(recommendations, filter = 'all') {
        if (!recommendations) recommendations = this.getFilteredRecommendations(filter);
        
        if (recommendations.length === 0) {
            const filterLabels = {
                'all': 'No recommendations yet.',
                'urgent': '✅ No urgent issues!',
                'important': '✅ No important issues!',
                'opportunity': '💡 No opportunities yet.'
            };
            return `
                <div class="advisor-empty">
                    <span class="advisor-icon">🧠</span>
                    <p>${filterLabels[filter] || 'No recommendations yet.'}</p>
                    <p style="font-size:11px;color:var(--gray-600);">Keep adding events to get smarter advice.</p>
                </div>
            `;
        }
        
        let html = `<div class="advisor-list">`;
        recommendations.forEach(r => {
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
     * Initialize advisor with auto-refresh
     */
    init() {
        console.log('🧠 Advisor initialized with auto-refresh');
        
        // Render immediately
        const container = document.getElementById('advisor-container');
        if (container) {
            renderAdvisor();
        }
        
        // Set up auto-refresh every 5 minutes (300,000 ms)
        if (window.advisorRefreshInterval) {
            clearInterval(window.advisorRefreshInterval);
        }
        window.advisorRefreshInterval = setInterval(() => {
            // Only refresh if the advisor tab is visible
            const advisorView = document.getElementById('view-advisor');
            if (advisorView && advisorView.classList.contains('active')) {
                console.log('🔄 Auto-refreshing Advisor...');
                renderAdvisor();
            }
        }, 300000); // 5 minutes
    },

    /**
     * Clean up interval when done
     */
    destroy() {
        if (window.advisorRefreshInterval) {
            clearInterval(window.advisorRefreshInterval);
            window.advisorRefreshInterval = null;
            console.log('🧠 Advisor auto-refresh stopped');
        }
    }
};

// ============================================
// RENDER FUNCTION FOR ADVISOR VIEW
// ============================================

function renderAdvisor() {
    const container = document.getElementById('advisor-container');
    if (!container) return;
    
    const status = Advisor.getStatus();
    const filteredRecommendations = Advisor.getFilteredRecommendations(advisorFilter);
    
    // Add last updated timestamp
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-KE', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const dateStr = now.toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    // Add alert badge if urgent
    const badgeHtml = status.hasUrgent 
        ? `<div class="advisor-alert">⚠️ ${status.urgent} urgent ${status.urgent === 1 ? 'issue' : 'issues'} need attention</div>` 
        : '';
    
    // Build filter tabs with counts
    const filterTabs = `
        <div class="advisor-filter-tabs">
            <button class="advisor-filter-btn ${advisorFilter === 'all' ? 'active' : ''}" 
                    data-filter="all" 
                    onclick="setAdvisorFilter('all')">
                📋 All <span class="filter-count">${status.total}</span>
            </button>
            <button class="advisor-filter-btn ${advisorFilter === 'urgent' ? 'active' : ''} urgent" 
                    data-filter="urgent" 
                    onclick="setAdvisorFilter('urgent')">
                🔥 Urgent <span class="filter-count urgent-count">${status.urgent}</span>
            </button>
            <button class="advisor-filter-btn ${advisorFilter === 'important' ? 'active' : ''} important" 
                    data-filter="important" 
                    onclick="setAdvisorFilter('important')">
                ⚡ Important <span class="filter-count important-count">${status.important}</span>
            </button>
            <button class="advisor-filter-btn ${advisorFilter === 'opportunity' ? 'active' : ''} opportunity" 
                    data-filter="opportunity" 
                    onclick="setAdvisorFilter('opportunity')">
                💡 Opportunity <span class="filter-count opportunity-count">${status.opportunities}</span>
            </button>
        </div>
    `;
    
    container.innerHTML = `
        <div class="advisor-header-bar">
            <h2>🧠 Intelligent Advisor</h2>
        </div>
        <div style="font-size:10px;color:var(--gray-600);text-align:right;padding:4px 0;border-bottom:1px solid var(--gray-700);margin-bottom:8px;">
            📅 ${dateStr} · 🕐 ${timeStr} · Auto-refreshes every 5 minutes
        </div>
        ${filterTabs}
        ${badgeHtml}
        <div class="advisor-content">
            ${Advisor.render(filteredRecommendations, advisorFilter)}
        </div>
        <div style="font-size:9px;color:var(--gray-700);text-align:center;padding:8px 0;margin-top:8px;border-top:1px solid var(--gray-800);">
            💡 Emergent Intelligence · ${status.total} total recommendations · ${status.hasUrgent ? '⚠️ Urgent issues detected' : '✅ All clear'}
        </div>
    `;
}

// ============================================
// FILTER CONTROL FUNCTION
// ============================================

function setAdvisorFilter(filter) {
    advisorFilter = filter;
    renderAdvisor();
}

// ============================================
// AUTO-REFRESH ON PAGE VISIBILITY CHANGE
// ============================================

// When the user comes back to the tab, refresh immediately
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        const advisorView = document.getElementById('view-advisor');
        if (advisorView && advisorView.classList.contains('active')) {
            console.log('🔄 Tab visible, refreshing Advisor...');
            renderAdvisor();
        }
    }
});

// Expose globally
window.Advisor = Advisor;
window.renderAdvisor = renderAdvisor;
window.setAdvisorFilter = setAdvisorFilter;
window.advisorFilter = 'all';