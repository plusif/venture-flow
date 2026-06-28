// ============================================
// PROBABILITY ENGINE
// Calculates outcome probabilities from historical data
// ============================================

const ProbabilityEngine = {
    /**
     * Calculate probability that an event category leads to a sale
     * @param {string} category - Event category
     * @param {number} daysWindow - Days after event to consider (default: 7)
     * @returns {number} Probability (0-1)
     */
    calculateSaleProbability(category, daysWindow = 7) {
        const events = AppState.events;
        if (events.length === 0) return 0.5; // neutral
        
        const categoryEvents = events.filter(e => e.category === category);
        if (categoryEvents.length === 0) return 0.5;
        
        let ledToSale = 0;
        categoryEvents.forEach(e => {
            const eventDate = new Date(e.date);
            const hasSaleFollowUp = events.some(s => 
                s.category === 'sale' && 
                new Date(s.date) > eventDate &&
                (new Date(s.date) - eventDate) <= daysWindow * 86400000
            );
            if (hasSaleFollowUp) ledToSale++;
        });
        
        return ledToSale / categoryEvents.length;
    },
    
    /**
     * Get probability breakdown for all categories
     * @returns {Object} Category → probability mapping
     */
    getProbabilityBreakdown() {
        const categories = [
            'customer_interest', 
            'production_completion', 
            'material_acquisition', 
            'negotiation',
            'idea_generation',
            'market_validation'
        ];
        
        const result = {};
        categories.forEach(cat => {
            result[cat] = this.calculateSaleProbability(cat);
        });
        
        // Add overall success rate
        const allSales = AppState.sales.length;
        const allEvents = AppState.events.length;
        result.overall = allEvents > 0 ? allSales / allEvents : 0.5;
        
        return result;
    },
    
    /**
     * Get probability trend over time
     * @param {string} category - Category to analyze
     * @param {number} periods - Number of periods to analyze (default: 7 days)
     * @returns {Array} Array of {date, probability} objects
     */
    getProbabilityTrend(category, periods = 7) {
        const events = AppState.events;
        const result = [];
        const now = new Date();
        
        for (let i = periods - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Get events up to this date
            const eventsUpToDate = events.filter(e => e.date <= dateStr);
            const tempState = {
                events: eventsUpToDate,
                sales: eventsUpToDate.filter(e => e.category === 'sale')
            };
            
            // Calculate probability for this period
            const categoryEvents = eventsUpToDate.filter(e => e.category === category);
            if (categoryEvents.length === 0) {
                result.push({ date: dateStr, probability: null });
                continue;
            }
            
            let ledToSale = 0;
            categoryEvents.forEach(e => {
                const eventDate = new Date(e.date);
                const hasSaleFollowUp = eventsUpToDate.some(s => 
                    s.category === 'sale' && 
                    new Date(s.date) > eventDate &&
                    (new Date(s.date) - eventDate) <= 7 * 86400000
                );
                if (hasSaleFollowUp) ledToSale++;
            });
            
            result.push({
                date: dateStr,
                probability: ledToSale / categoryEvents.length
            });
        }
        
        return result;
    },
    
    /**
     * Get recommendation based on probabilities
     * @returns {Array} Recommendations
     */
    getRecommendations() {
        const probs = this.getProbabilityBreakdown();
        const recommendations = [];
        
        // Find highest probability actions
        const sorted = Object.entries(probs)
            .filter(([key]) => key !== 'overall')
            .sort((a, b) => b[1] - a[1]);
        
        if (sorted.length > 0 && sorted[0][1] > 0.6) {
            recommendations.push({
                action: sorted[0][0],
                probability: Math.round(sorted[0][1] * 100),
                advice: `High probability action: ${sorted[0][0].replace('_', ' ')} leads to sales ${Math.round(sorted[0][1] * 100)}% of the time.`
            });
        }
        
        // Find lowest probability actions
        if (sorted.length > 0 && sorted[sorted.length - 1][1] < 0.3) {
            recommendations.push({
                action: sorted[sorted.length - 1][0],
                probability: Math.round(sorted[sorted.length - 1][1] * 100),
                advice: `Low probability action: ${sorted[sorted.length - 1][0].replace('_', ' ')}. Consider alternative approaches.`
            });
        }
        
        return recommendations;
    }
};

// Expose globally
window.ProbabilityEngine = ProbabilityEngine;