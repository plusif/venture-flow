// ============================================
// PATTERN DETECTION ENGINE
// Detects emergent patterns in venture data
// ============================================

const PatternEngine = {
    /**
     * Detect all patterns in current venture data
     * @returns {Array} Array of pattern objects
     */
    detectPatterns() {
        const patterns = [];
        const events = AppState.events;
        const venture = AppState.currentVenture;
        
        if (!venture || events.length === 0) return patterns;
        
        // === PATTERN 1: Price Sensitivity ===
        const rejections = events.filter(e => e.category === 'price_rejection' || e.category === 'customer_objection');
        if (rejections.length >= 2) {
            const severity = rejections.length >= 5 ? 'high' : rejections.length >= 3 ? 'medium' : 'low';
            patterns.push({
                id: 'price_sensitivity_' + Date.now(),
                type: 'price_sensitivity',
                severity: severity,
                title: '💰 Price Sensitivity Detected',
                insight: `Customers have rejected prices ${rejections.length} times. ${rejections.length >= 5 ? 'This is a clear pattern.' : 'Early signal to monitor.'}`,
                recommendation: rejections.length >= 3 
                    ? 'Consider adjusting pricing or offering tiered options.' 
                    : 'Monitor future customer objections closely.',
                count: rejections.length,
                detectedAt: new Date().toISOString()
            });
        }
        
        // === PATTERN 2: Conversion Gap ===
        const interests = events.filter(e => e.category === 'customer_interest');
        const sales = events.filter(e => e.category === 'sale');
        if (interests.length > 0 && sales.length === 0 && interests.length >= 3) {
            patterns.push({
                id: 'conversion_gap_' + Date.now(),
                type: 'conversion_gap',
                severity: interests.length > 5 ? 'high' : 'medium',
                title: '📊 Conversion Gap Detected',
                insight: `${interests.length} customer interests but 0 sales. Something is blocking conversion.`,
                recommendation: 'Follow up with interested customers. Ask about objections. Consider offering a trial or discount.',
                count: interests.length,
                detectedAt: new Date().toISOString()
            });
        }
        
        // === PATTERN 3: Debt Overhang ===
        const totalDebt = AppState.totalUnpaidDebt;
        const totalSupport = AppState.totalSupport;
        if (totalDebt > 0 && totalSupport > 0) {
            const ratio = totalDebt / totalSupport;
            if (ratio > 1.5) {
                patterns.push({
                    id: 'debt_overhang_' + Date.now(),
                    type: 'debt_overhang',
                    severity: ratio > 3 ? 'high' : 'medium',
                    title: '⚠️ Debt Overhang Warning',
                    insight: `Debt (${formatCurrency(totalDebt)}) exceeds support by ${formatCurrency(totalDebt - totalSupport)}.`,
                    recommendation: 'Focus on generating revenue before taking more debt. Consider debt consolidation.',
                    ratio: Math.round(ratio * 100) / 100,
                    detectedAt: new Date().toISOString()
                });
            }
        }
        
        // === PATTERN 4: Production Efficiency ===
        const productionEvents = events.filter(e => e.category === 'production_completion');
        const materialEvents = events.filter(e => e.category === 'material_acquisition');
        if (productionEvents.length > 0 && materialEvents.length > 0) {
            const efficiency = productionEvents.length / materialEvents.length;
            if (efficiency < 0.5 && materialEvents.length >= 3) {
                patterns.push({
                    id: 'production_inefficiency_' + Date.now(),
                    type: 'production_inefficiency',
                    severity: 'medium',
                    title: '🔧 Production Bottleneck Detected',
                    insight: `${productionEvents.length} completions from ${materialEvents.length} material acquisitions. Only ${Math.round(efficiency * 100)}% conversion.`,
                    recommendation: 'Review production workflow. Are materials being wasted? Is there a skills gap?',
                    efficiency: Math.round(efficiency * 100),
                    detectedAt: new Date().toISOString()
                });
            }
        }
        
        // === PATTERN 5: Momentum Growth ===
        const recentEvents = events.filter(e => {
            const d = new Date(e.date);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 7);
            return d >= cutoff;
        });
        const recentSupport = recentEvents.filter(e => e.type === 'support').length;
        const recentFriction = recentEvents.filter(e => e.type === 'friction').length;
        if (recentSupport + recentFriction >= 5) {
            const momentum = recentSupport - recentFriction;
            if (momentum > 3) {
                patterns.push({
                    id: 'positive_momentum_' + Date.now(),
                    type: 'positive_momentum',
                    severity: 'low',
                    title: '📈 Positive Momentum',
                    insight: `Last 7 days: ${recentSupport} support events vs ${recentFriction} friction events. Net +${momentum}.`,
                    recommendation: 'Keep doing what you\'re doing! Consider increasing marketing efforts to capitalize.',
                    momentum: momentum,
                    detectedAt: new Date().toISOString()
                });
            } else if (momentum < -3) {
                patterns.push({
                    id: 'negative_momentum_' + Date.now(),
                    type: 'negative_momentum',
                    severity: 'high',
                    title: '📉 Negative Momentum',
                    insight: `Last 7 days: ${recentSupport} support events vs ${recentFriction} friction events. Net ${momentum}.`,
                    recommendation: 'Review recent friction events. Identify root causes. Consider a pivot.',
                    momentum: momentum,
                    detectedAt: new Date().toISOString()
                });
            }
        }
        
        return patterns;
    },
    
    /**
     * Get active patterns (not yet dismissed)
     * @returns {Array} Active patterns
     */
    getActivePatterns() {
        const all = this.detectPatterns();
        // Filter out patterns that might be stale (older than 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return all.filter(p => {
            const detected = new Date(p.detectedAt);
            // Keep if detected recently OR severity is high
            return detected >= thirtyDaysAgo || p.severity === 'high';
        });
    },
    
    /**
     * Get pattern summary for dashboard
     * @returns {Object} Summary counts
     */
    getSummary() {
        const patterns = this.getActivePatterns();
        return {
            total: patterns.length,
            high: patterns.filter(p => p.severity === 'high').length,
            medium: patterns.filter(p => p.severity === 'medium').length,
            low: patterns.filter(p => p.severity === 'low').length,
            types: patterns.map(p => p.type)
        };
    }
};

// Expose globally
window.PatternEngine = PatternEngine;