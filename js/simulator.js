// ============================================
// SIMULATOR ENGINE
// Runs "what-if" scenarios for venture decisions
// ============================================

const Simulator = {
    /**
     * Run a scenario simulation
     * @param {Object} params - Scenario parameters
     * @returns {Object} Simulation results
     */
    runScenario(params) {
        const currentSales = AppState.sales.length;
        const currentDebt = AppState.totalUnpaidDebt;
        const currentNetPosition = AppState.netPosition;
        const currentInventory = AppState.inventoryValue;
        const currentEvents = AppState.events;
        
        // Default parameters
        const p = {
            priceReduction: params.priceReduction || 0, // Percentage
            marketingBudget: params.marketingBudget || 0, // Ksh
            newProductCost: params.newProductCost || 0, // Ksh
            productionEfficiency: params.productionEfficiency || 1, // Multiplier
            salesMultiplier: params.salesMultiplier || 1 // Multiplier
        };
        
        // === SIMULATION LOGIC ===
        
        // 1. Price reduction effect
        const priceElasticity = 0.3; // 10% price drop → 30% more sales
        const priceEffect = (p.priceReduction / 100) * priceElasticity * 10;
        const projectedSales = Math.round(currentSales * (1 + priceEffect) * p.salesMultiplier);
        
        // 2. Marketing effect
        const marketingROI = 0.15; // Every 1 Ksh = 0.15 Ksh in sales value
        const marketingSales = Math.round(p.marketingBudget * marketingROI / 500); // Each sale ~500 Ksh avg
        const totalProjectedSales = projectedSales + marketingSales;
        
        // 3. New product cost
        const newDebt = currentDebt + p.newProductCost;
        
        // 4. Production efficiency
        const inventoryAdjustment = Math.round(currentInventory * (p.productionEfficiency - 1));
        
        // 5. Projected revenue
        const avgSaleAmount = AppState.totalSalesAmount / (currentSales || 1);
        const projectedRevenue = totalProjectedSales * (avgSaleAmount * (1 - p.priceReduction / 100));
        
        // 6. Projected net position
        const projectedNetPosition = currentNetPosition 
            + projectedRevenue 
            - p.newProductCost 
            - p.marketingBudget 
            + inventoryAdjustment;
        
        // 7. Payback period (if investing)
        let paybackPeriod = null;
        const totalInvestment = p.newProductCost + p.marketingBudget;
        if (totalInvestment > 0 && totalProjectedSales > currentSales) {
            const additionalSales = totalProjectedSales - currentSales;
            const additionalRevenue = additionalSales * avgSaleAmount;
            if (additionalRevenue > 0) {
                paybackPeriod = Math.round(totalInvestment / additionalRevenue * 30); // in days
            }
        }
        
        // === GENERATE INSIGHTS ===
        const insights = [];
        const change = projectedNetPosition - currentNetPosition;
        
        if (change > 0) {
            insights.push(`✅ Projected net position increases by ${formatCurrency(change)}`);
        } else if (change < 0) {
            insights.push(`⚠️ Projected net position decreases by ${formatCurrency(Math.abs(change))}`);
        } else {
            insights.push(`⚖️ Net position remains unchanged`);
        }
        
        if (totalProjectedSales > currentSales) {
            insights.push(`📈 Projected sales increase by ${totalProjectedSales - currentSales} units`);
        } else if (totalProjectedSales < currentSales) {
            insights.push(`📉 Projected sales decrease by ${currentSales - totalProjectedSales} units`);
        }
        
        if (newDebt > currentDebt) {
            insights.push(`💰 Debt increases by ${formatCurrency(newDebt - currentDebt)}`);
        } else if (newDebt < currentDebt) {
            insights.push(`💪 Debt decreases by ${formatCurrency(currentDebt - newDebt)}`);
        }
        
        if (paybackPeriod !== null && paybackPeriod > 0) {
            insights.push(`⏱ Estimated payback period: ${paybackPeriod} days`);
        }
        
        // === FINAL RESULT ===
        return {
            // Inputs
            inputs: p,
            
            // Current state
            current: {
                sales: currentSales,
                debt: currentDebt,
                netPosition: currentNetPosition,
                inventory: currentInventory
            },
            
            // Projected state
            projected: {
                sales: totalProjectedSales,
                debt: newDebt,
                netPosition: projectedNetPosition,
                inventory: currentInventory + inventoryAdjustment,
                revenue: projectedRevenue,
                change: change
            },
            
            // Insights
            insights: insights,
            paybackPeriod: paybackPeriod,
            
            // Recommendation
            recommendation: change > 0 ? '✅ Proceed with confidence' : 
                           change > -5000 ? '⚡ Proceed with caution' : 
                           '⚠️ Reconsider or adjust parameters',
            
            // Score (0-100)
            score: Math.min(100, Math.max(0, 50 + (change / 1000) * 5))
        };
    },
    
    /**
     * Run multiple scenarios for comparison
     * @param {Array} scenarioParams - Array of parameter sets
     * @returns {Array} Array of simulation results
     */
    runScenarios(scenarioParams) {
        return scenarioParams.map((params, index) => {
            const result = this.runScenario(params);
            result.scenarioId = index + 1;
            return result;
        });
    },
    
    /**
     * Generate parameter presets
     * @returns {Object} Preset scenarios
     */
    getPresets() {
        const avgSale = AppState.totalSalesAmount / (AppState.sales.length || 1);
        const avgCost = AppState.inventory.reduce((sum, i) => sum + (i.cost || 0), 0) / (AppState.inventory.length || 1);
        
        return {
            conservative: {
                priceReduction: 5,
                marketingBudget: Math.round(avgSale * 0.5),
                newProductCost: Math.round(avgCost * 0.5),
                salesMultiplier: 1.1
            },
            moderate: {
                priceReduction: 10,
                marketingBudget: Math.round(avgSale * 1),
                newProductCost: Math.round(avgCost * 1),
                salesMultiplier: 1.3
            },
            aggressive: {
                priceReduction: 15,
                marketingBudget: Math.round(avgSale * 2),
                newProductCost: Math.round(avgCost * 1.5),
                salesMultiplier: 1.6
            }
        };
    },
    
    /**
     * Render simulation results as HTML
     * @param {Object} result - Simulation result
     * @returns {string} HTML
     */
    renderResult(result) {
        if (!result) return '<p>Run a simulation to see results</p>';
        
        const changeClass = result.projected.change > 0 ? 'positive' : result.projected.change < 0 ? 'negative' : 'neutral';
        
        return `
            <div class="simulation-result">
                <div class="sim-score">
                    <span class="sim-score-value" style="color: ${result.score > 70 ? 'var(--support)' : result.score > 40 ? 'var(--warning)' : 'var(--friction)'}">
                        ${result.score}%
                    </span>
                    <span class="sim-score-label">Confidence Score</span>
                </div>
                
                <div class="sim-grid">
                    <div class="sim-item">
                        <span class="sim-label">Current Net Position</span>
                        <span class="sim-value">${formatCurrency(result.current.netPosition)}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Projected Net Position</span>
                        <span class="sim-value ${changeClass}">${formatCurrency(result.projected.netPosition)}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Change</span>
                        <span class="sim-value ${changeClass}">${result.projected.change > 0 ? '+' : ''}${formatCurrency(result.projected.change)}</span>
                    </div>
                    <div class="sim-item">
                        <span class="sim-label">Projected Sales</span>
                        <span class="sim-value">${result.projected.sales} (${result.current.sales} →)</span>
                    </div>
                </div>
                
                <div class="sim-insights">
                    ${result.insights.map(i => `<div class="sim-insight">${i}</div>`).join('')}
                </div>
                
                <div class="sim-recommendation">
                    <strong>Recommendation:</strong> ${result.recommendation}
                    ${result.paybackPeriod ? ` (Payback: ${result.paybackPeriod} days)` : ''}
                </div>
            </div>
        `;
    }
};

// Expose globally
window.Simulator = Simulator;