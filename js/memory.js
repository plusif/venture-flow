// ============================================
// MEMORY ENGINE
// Compresses events into stateful memory chunks
// ============================================

const MemoryEngine = {
    /**
     * Generate a memory summary for a given period
     * @param {number} period - Days to summarize (default: 14)
     * @returns {Object} Memory summary
     */
    summarize(period = 14) {
        const events = AppState.events;
        const now = new Date();
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - period);
        
        const periodEvents = events.filter(e => new Date(e.date) >= cutoff);
        
        // Calculate metrics
        const support = periodEvents.filter(e => e.type === 'support');
        const friction = periodEvents.filter(e => e.type === 'friction');
        const sales = periodEvents.filter(e => e.category === 'sale');
        const interests = periodEvents.filter(e => e.category === 'customer_interest');
        const rejections = periodEvents.filter(e => e.category === 'price_rejection' || e.category === 'customer_objection');
        
        // Calculate amounts
        const supportAmount = support.reduce((sum, e) => sum + (e.amount || 0), 0);
        const frictionAmount = friction.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        // Find most common categories
        const categoryCounts = {};
        periodEvents.forEach(e => {
            categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
        });
        
        let topCategory = null;
        let topCount = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            if (count > topCount) {
                topCount = count;
                topCategory = cat;
            }
        });
        
        // Generate memory phrase
        const netChange = support.length - friction.length;
        let sentiment = 'neutral';
        let sentimentPhrase = '⚖️ Balanced';
        if (netChange > 3) {
            sentiment = 'positive';
            sentimentPhrase = '📈 Growing';
        } else if (netChange < -3) {
            sentiment = 'negative';
            sentimentPhrase = '📉 Needs attention';
        }
        
        return {
            period: period,
            startDate: cutoff.toISOString().split('T')[0],
            endDate: now.toISOString().split('T')[0],
            totalEvents: periodEvents.length,
            supportCount: support.length,
            frictionCount: friction.length,
            supportAmount: supportAmount,
            frictionAmount: frictionAmount,
            netAmount: supportAmount - frictionAmount,
            salesCount: sales.length,
            interestsCount: interests.length,
            rejectionsCount: rejections.length,
            conversionRate: interests.length > 0 ? Math.round(sales.length / interests.length * 100) : 0,
            topCategory: topCategory,
            topCategoryLabel: topCategory ? getCategoryLabel(topCategory) : null,
            sentiment: sentiment,
            sentimentPhrase: sentimentPhrase,
            netChange: netChange,
            // Summary for display
            summary: `${sentimentPhrase} · ${periodEvents.length} events · ${sales.length} sales · ${formatCurrency(supportAmount - frictionAmount)} net`
        };
    },
    
    /**
     * Get venture memory for header display
     * @returns {string} Memory phrase
     */
    getVentureMemory() {
        const venture = AppState.currentVenture;
        if (!venture) return 'No venture selected';
        
        const days = AppState.daysRunning;
        const sales = AppState.sales.length;
        const summary = this.summarize(14);
        
        return `${venture.name} — Day ${days} · ${sales} sales · ${summary.sentimentPhrase}`;
    },
    
    /**
     * Get memory timeline (last N periods)
     * @param {number} periods - Number of periods (default: 4 periods of 7 days)
     * @returns {Array} Array of memory summaries
     */
    getMemoryTimeline(periods = 4, periodDays = 7) {
        const timeline = [];
        const now = new Date();
        
        for (let i = periods - 1; i >= 0; i--) {
            const end = new Date(now);
            end.setDate(end.getDate() - (i * periodDays));
            
            // Get events for this period
            const start = new Date(end);
            start.setDate(start.getDate() - periodDays);
            
            const periodEvents = AppState.events.filter(e => {
                const date = new Date(e.date);
                return date >= start && date < end;
            });
            
            const support = periodEvents.filter(e => e.type === 'support').length;
            const friction = periodEvents.filter(e => e.type === 'friction').length;
            const sales = periodEvents.filter(e => e.category === 'sale').length;
            
            timeline.push({
                period: `Week ${periods - i}`,
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0],
                support: support,
                friction: friction,
                sales: sales,
                net: support - friction,
                total: periodEvents.length
            });
        }
        
        return timeline;
    },
    
    /**
     * Generate memory card HTML for display
     * @param {Object} summary - Memory summary from summarize()
     * @returns {string} HTML
     */
    renderMemoryCard(summary) {
        if (!summary) summary = this.summarize(14);
        
        return `
            <div class="memory-card">
                <div class="memory-header">
                    <span class="memory-sentiment ${summary.sentiment}">${summary.sentimentPhrase}</span>
                    <span class="memory-period">Last ${summary.period} days</span>
                </div>
                <div class="memory-stats">
                    <div class="memory-stat">
                        <span class="memory-stat-value">${summary.totalEvents}</span>
                        <span class="memory-stat-label">Events</span>
                    </div>
                    <div class="memory-stat">
                        <span class="memory-stat-value support">${summary.supportCount}</span>
                        <span class="memory-stat-label">Support</span>
                    </div>
                    <div class="memory-stat">
                        <span class="memory-stat-value friction">${summary.frictionCount}</span>
                        <span class="memory-stat-label">Friction</span>
                    </div>
                    <div class="memory-stat">
                        <span class="memory-stat-value ${summary.salesCount > 0 ? 'support' : 'neutral'}">${summary.salesCount}</span>
                        <span class="memory-stat-label">Sales</span>
                    </div>
                </div>
                <div class="memory-detail">
                    ${summary.topCategory ? `Top activity: <strong>${summary.topCategoryLabel}</strong>` : ''}
                    ${summary.conversionRate > 0 ? `· Conversion: <strong>${summary.conversionRate}%</strong>` : ''}
                </div>
                <div class="memory-net">
                    Net position: <strong class="${summary.netAmount > 0 ? 'support' : 'friction'}">${formatCurrency(summary.netAmount)}</strong>
                </div>
            </div>
        `;
    }
};

// Expose globally
window.MemoryEngine = MemoryEngine;