// ============================================
// REPORTS RENDERER
// ============================================

function renderReports() {
    const container = document.getElementById('reports-container');
    
    const sales = AppState.sales;
    const customerInterests = AppState.customerInterests;
    const priceRejections = AppState.priceRejections;
    const unpaidDebts = AppState.unpaidDebts;
    const inventoryValue = AppState.inventoryValue;
    
    // Price gap analysis
    let priceGapEvents = AppState.events.filter(e => e.category === 'price_rejection');
    let avgGap = 0;
    let gapDescriptions = [];
    priceGapEvents.forEach(e => {
        const match = e.description.match(/(\d+)/g);
        if (match && match.length >= 2) {
            const offered = parseInt(match[match.length - 1]);
            const stated = parseInt(match[0]);
            if (stated && offered) {
                avgGap += stated - offered;
                gapDescriptions.push(`${stated} → ${offered} (gap: ${stated - offered})`);
            }
        }
    });
    avgGap = priceGapEvents.length > 0 ? Math.round(avgGap / priceGapEvents.length) : 0;
    
    let html = `
        <div class="dashboard-section">
            <h3>📤 Export Data</h3>
            <div class="export-buttons">
                <button class="export-btn json" onclick="exportJSON()">📄 JSON</button>
                <button class="export-btn csv" onclick="exportCSV()">📊 CSV</button>
                <button class="export-btn excel" onclick="exportExcel()">📈 Excel</button>
            </div>
        </div>
        
        <div class="report-section">
            <h3>📊 Reality Validation Status</h3>
            <div class="signal-row">
                <span class="signal-label">Perceived Viability</span>
                <span class="signal-value ${sales.length > 0 ? 'support' : 'friction'}">
                    ${sales.length > 0 ? '✅ PROVEN' : '⏳ AWAITING'}
                </span>
            </div>
            <div class="signal-row">
                <span class="signal-label">Market Demand</span>
                <span class="signal-value ${customerInterests.length > 0 ? 'support' : 'friction'}">
                    ${customerInterests.length > 0 ? '✅ CONFIRMED' : '❌ UNCERTAIN'}
                </span>
            </div>
            <div class="signal-row">
                <span class="signal-label">Price Validation</span>
                <span class="signal-value ${sales.length > 0 ? 'support' : priceRejections.length > 0 ? 'friction' : 'neutral'}">
                    ${sales.length > 0 ? '✅ VALIDATED' : priceRejections.length > 0 ? '❌ GAP' : '⏳ PENDING'}
                </span>
            </div>
            <div class="signal-row">
                <span class="signal-label">Production Capability</span>
                <span class="signal-value support">✅ PROVEN</span>
            </div>
        </div>
        
        <div class="report-section">
            <h3>📈 Key Metrics</h3>
            <div class="signal-row">
                <span class="signal-label">Unpaid Debt</span>
                <span class="signal-value friction">${formatCurrency(AppState.totalUnpaidDebt)}</span>
            </div>
            <div class="signal-row">
                <span class="signal-label">Inventory Value</span>
                <span class="signal-value support">${formatCurrency(inventoryValue)}</span>
            </div>
            <div class="signal-row">
                <span class="signal-label">Net Position</span>
                <span class="signal-value ${AppState.netPosition > 0 ? 'support' : 'friction'}">
                    ${formatCurrency(AppState.netPosition)}
                </span>
            </div>
            <div class="signal-row">
                <span class="signal-label">Conversion Rate</span>
                <span class="signal-value ${customerInterests.length > 0 && sales.length > 0 ? 'support' : 'friction'}">
                    ${customerInterests.length > 0 ? Math.round(sales.length / customerInterests.length * 100) : 0}%
                </span>
            </div>
        </div>
    `;
    
    // Price Gap Analysis
    if (priceGapEvents.length > 0) {
        html += `
            <div class="report-section">
                <h3>💰 Price Gap Analysis</h3>
                <div class="signal-row">
                    <span class="signal-label">Average Gap</span>
                    <span class="signal-value friction">${formatCurrency(avgGap)}</span>
                </div>
                <div style="margin-top:6px;font-size:11px;color:var(--gray-500);">
                    <strong>Details:</strong><br>${gapDescriptions.map(d => '• ' + d).join('<br>')}
                </div>
                <div style="margin-top:6px;padding:8px;background:#1a0f0f;border-radius:6px;font-size:11px;color:var(--gray-300);">
                    <strong>📌 Insight:</strong> Market signals price is ${Math.round(avgGap / 3500 * 100)}% above willingness to pay.
                </div>
            </div>
        `;
    }
    
    // Reality Balance
    const totalFriction = AppState.totalFriction;
    const totalSupport = AppState.totalSupport;
    const maxVal = Math.max(totalFriction, totalSupport, 1);
    const frictionPct = Math.round(totalFriction / maxVal * 100);
    const supportPct = Math.round(totalSupport / maxVal * 100);
    
    html += `
        <div class="report-section">
            <h3>⚖️ Reality Balance</h3>
            <div class="gap-bar">
                <div class="gap-friction" style="width:${frictionPct}%;"></div>
                <div class="gap-support" style="width:${supportPct}%;"></div>
                ${frictionPct + supportPct < 100 ? `<div class="gap-empty" style="width:${100 - frictionPct - supportPct}%;"></div>` : ''}
            </div>
            <div class="gap-label">
                <span style="color:var(--friction);">Friction: ${formatCurrency(totalFriction)}</span>
                <span style="color:var(--support);">Support: ${formatCurrency(totalSupport)}</span>
            </div>
            <div style="margin-top:4px;font-size:11px;color:var(--gray-500);">
                ${totalSupport > totalFriction ? '✅ Reality is supporting your idea.' : 
                  totalFriction > totalSupport ? '⚠️ Reality is resisting. Address friction points.' : 
                  '⚖️ Reality is balanced.'}
            </div>
        </div>
    `;
    
    // ============================================
    // NEW: PROBABILITY TRACKER
    // ============================================
    if (typeof ProbabilityEngine !== 'undefined' && AppState.events.length > 0) {
        const probs = ProbabilityEngine.getProbabilityBreakdown();
        const probRecommendations = ProbabilityEngine.getRecommendations();
        
        html += `
            <div class="report-section">
                <h3>🎯 Probability Tracker</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;padding:6px 0;">
        `;
        
        // Sort probabilities by value (highest first)
        const sortedProbs = Object.entries(probs)
            .filter(([key]) => key !== 'overall')
            .sort((a, b) => b[1] - a[1]);
        
        sortedProbs.forEach(([key, value]) => {
            const label = key.replace(/_/g, ' ').toUpperCase();
            const pct = Math.round(value * 100);
            const color = pct > 60 ? 'var(--support)' : pct > 40 ? 'var(--warning)' : 'var(--friction)';
            const barColor = pct > 60 ? '#2ecc71' : pct > 40 ? '#f1c40f' : '#e74c3c';
            html += `
                <div style="display:flex;flex-direction:column;gap:2px;padding:4px 0;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;">
                        <span style="color:var(--gray-400);">${label}</span>
                        <span style="color:${color};font-weight:600;">${pct}%</span>
                    </div>
                    <div style="height:4px;background:var(--gray-700);border-radius:2px;overflow:hidden;">
                        <div style="height:100%;width:${pct}%;background:${barColor};border-radius:2px;transition:width 0.3s;"></div>
                    </div>
                </div>
            `;
        });
        
        // Overall success rate
        const overallPct = Math.round(probs.overall * 100);
        html += `
            <div style="grid-column:span 2;display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--gray-700);margin-top:4px;">
                <span style="font-weight:600;color:var(--gray-300);">Overall Success Rate</span>
                <span style="font-weight:700;color:${overallPct > 50 ? 'var(--support)' : 'var(--friction)'};">${overallPct}%</span>
            </div>
        `;
        
        html += `</div>`;
        
        // Probability recommendations
        if (probRecommendations.length > 0) {
            html += `
                <div style="font-size:12px;color:var(--gray-400);margin-top:8px;padding-top:8px;border-top:1px solid var(--gray-700);">
                    <div style="font-weight:600;color:var(--gray-300);margin-bottom:4px;">💡 Probability Insights</div>
            `;
            probRecommendations.forEach(r => {
                const icon = r.probability > 60 ? '✅' : '⚠️';
                html += `<div style="padding:2px 0;">${icon} ${r.advice}</div>`;
            });
            html += `</div>`;
        }
        
        html += `</div>`;
    }
    
    // ============================================
    // NEW: SCENARIO SIMULATOR
    // ============================================
    if (typeof Simulator !== 'undefined' && AppState.events.length > 0) {
        html += `
            <div class="report-section">
                <h3>🔮 Scenario Simulator</h3>
                <div style="font-size:13px;color:var(--gray-400);margin-bottom:10px;">
                    Test different strategies to see their potential impact on your venture.
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        `;
        
        const presets = Simulator.getPresets();
        const presetColors = {
            conservative: 'var(--support)',
            moderate: 'var(--warning)',
            aggressive: 'var(--friction)'
        };
        
        Object.entries(presets).forEach(([name, params]) => {
            const result = Simulator.runScenario(params);
            const changeClass = result.projected.change > 0 ? 'support' : result.projected.change < 0 ? 'friction' : 'neutral';
            const changeSymbol = result.projected.change > 0 ? '+' : '';
            const borderColor = presetColors[name] || 'var(--gray-600)';
            
            html += `
                <div style="padding:12px;background:var(--bg-secondary);border-radius:8px;border:1px solid var(--gray-700);text-align:center;border-top:3px solid ${borderColor};">
                    <div style="font-weight:600;font-size:13px;text-transform:capitalize;color:var(--gray-300);">${name}</div>
                    <div style="font-size:18px;font-weight:700;color:var(--${changeClass});margin:4px 0;">
                        ${changeSymbol}${formatCurrency(result.projected.change)}
                    </div>
                    <div style="font-size:12px;color:var(--gray-500);">
                        ${result.projected.sales} sales · ${result.score}% score
                    </div>
                    <div style="font-size:11px;color:var(--gray-600);margin-top:4px;">
                        ${result.projected.debt > result.current.debt ? '📈 Debt +' + formatCurrency(result.projected.debt - result.current.debt) : 
                          result.projected.debt < result.current.debt ? '📉 Debt -' + formatCurrency(result.current.debt - result.projected.debt) :
                          '⚖️ Debt unchanged'}
                    </div>
                    ${result.paybackPeriod ? `<div style="font-size:10px;color:var(--gray-600);">Payback: ${result.paybackPeriod}d</div>` : ''}
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Add a "Custom Scenario" button/link
        html += `
            <div style="text-align:center;margin-top:10px;font-size:12px;color:var(--gray-500);">
                💡 Hover over each scenario to see the full breakdown.
                <br><span style="font-size:11px;color:var(--gray-600);">Conservative = small changes · Moderate = balanced · Aggressive = big moves</span>
            </div>
        `;
        
        html += `</div>`;
    }
    
    // ============================================
    // NEW: PATTERN SUMMARY (Reports Version)
    // ============================================
    if (typeof PatternEngine !== 'undefined' && AppState.events.length > 0) {
        const patterns = PatternEngine.getActivePatterns();
        if (patterns.length > 0) {
            html += `
                <div class="report-section">
                    <h3>📐 Detected Patterns (${patterns.length})</h3>
                    <div style="display:flex;flex-direction:column;gap:6px;padding:4px 0;">
            `;
            patterns.forEach(p => {
                const color = p.severity === 'high' ? 'var(--friction)' : p.severity === 'medium' ? 'var(--warning)' : 'var(--support)';
                const icon = p.severity === 'high' ? '🔴' : p.severity === 'medium' ? '🟡' : '🟢';
                html += `
                    <div style="padding:10px 12px;background:var(--bg-secondary);border-radius:6px;border-left:3px solid ${color};">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <span>${icon}</span>
                            <span style="font-weight:600;font-size:13px;color:var(--gray-200);">${p.title}</span>
                            <span style="font-size:10px;padding:1px 8px;border-radius:8px;background:${color}22;color:${color};text-transform:uppercase;">${p.severity}</span>
                        </div>
                        <div style="font-size:12px;color:var(--gray-400);margin-top:4px;">${p.insight}</div>
                        <div style="font-size:12px;color:var(--gray-500);margin-top:2px;">💡 ${p.recommendation}</div>
                    </div>
                `;
            });
            html += `</div></div>`;
        }
    }
    
    // ============================================
    // NEW: ANOMALY SUMMARY (Reports Version)
    // ============================================
    if (typeof AnomalyEngine !== 'undefined' && AppState.events.length > 0) {
        const anomalies = AnomalyEngine.getActiveAnomalies();
        if (anomalies.length > 0) {
            html += `
                <div class="report-section" style="border-color:${anomalies.some(a => a.severity === 'high') ? 'var(--friction)' : 'var(--warning)'};">
                    <h3>⚠️ Active Anomalies (${anomalies.length})</h3>
                    <div style="display:flex;flex-direction:column;gap:6px;padding:4px 0;">
            `;
            anomalies.forEach(a => {
                const color = a.severity === 'high' ? 'var(--friction)' : a.severity === 'medium' ? 'var(--warning)' : 'var(--support)';
                const icon = a.severity === 'high' ? '🔴' : a.severity === 'medium' ? '🟡' : '🟢';
                html += `
                    <div style="padding:10px 12px;background:var(--bg-secondary);border-radius:6px;border-left:3px solid ${color};">
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            <span>${icon}</span>
                            <span style="font-weight:600;font-size:13px;color:var(--gray-200);">${a.title}</span>
                            <span style="font-size:10px;padding:1px 8px;border-radius:8px;background:${color}22;color:${color};text-transform:uppercase;">${a.severity}</span>
                            ${a.date ? `<span style="font-size:10px;color:var(--gray-600);">${formatDate(a.date)}</span>` : ''}
                        </div>
                        <div style="font-size:12px;color:var(--gray-400);margin-top:4px;">${a.message}</div>
                        ${a.description ? `<div style="font-size:11px;color:var(--gray-500);margin-top:2px;">${a.description}</div>` : ''}
                    </div>
                `;
            });
            html += `</div></div>`;
        }
    }
    
    // ============================================
    // NEW: MEMORY SUMMARY (Reports Version)
    // ============================================
    if (typeof MemoryEngine !== 'undefined' && AppState.events.length > 0) {
        const memory = MemoryEngine.summarize(30); // 30-day summary for reports
        html += `
            <div class="report-section">
                <h3>🧠 30-Day Memory Summary</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;padding:8px 0;">
                    <div style="text-align:center;padding:8px;background:var(--bg-secondary);border-radius:6px;">
                        <div style="font-size:20px;font-weight:700;color:var(--gray-200);">${memory.totalEvents}</div>
                        <div style="font-size:10px;color:var(--gray-500);text-transform:uppercase;">Events</div>
                    </div>
                    <div style="text-align:center;padding:8px;background:var(--bg-secondary);border-radius:6px;">
                        <div style="font-size:20px;font-weight:700;color:var(--support);">${memory.supportCount}</div>
                        <div style="font-size:10px;color:var(--gray-500);text-transform:uppercase;">Support</div>
                    </div>
                    <div style="text-align:center;padding:8px;background:var(--bg-secondary);border-radius:6px;">
                        <div style="font-size:20px;font-weight:700;color:var(--friction);">${memory.frictionCount}</div>
                        <div style="font-size:10px;color:var(--gray-500);text-transform:uppercase;">Friction</div>
                    </div>
                    <div style="text-align:center;padding:8px;background:var(--bg-secondary);border-radius:6px;">
                        <div style="font-size:20px;font-weight:700;color:${memory.netAmount > 0 ? 'var(--support)' : 'var(--friction)'};">${formatCurrency(memory.netAmount)}</div>
                        <div style="font-size:10px;color:var(--gray-500);text-transform:uppercase;">Net Amount</div>
                    </div>
                </div>
                <div style="text-align:center;font-size:12px;color:var(--gray-400);padding:4px 0;border-top:1px solid var(--gray-700);">
                    ${memory.sentimentPhrase} · ${memory.salesCount} sales · ${memory.conversionRate}% conversion
                    ${memory.topCategory ? `· Top: ${memory.topCategoryLabel}` : ''}
                </div>
            </div>
        `;
    }
    
    // Alerts
    if (sales.length === 0 && AppState.events.length > 0) {
        html += `
            <div class="report-section" style="border-color:var(--warning);">
                <h3>⚠️ Alert</h3>
                <div style="color:var(--warning);font-size:13px;">
                    ${AppState.daysRunning} days with no sale. 
                    ${priceRejections.length > 0 ? 'Consider adjusting pricing.' : 'Increase marketing efforts.'}
                </div>
            </div>
        `;
    }
    
    if (sales.length > 0) {
        html += `
            <div class="report-section" style="border-color:var(--support);">
                <h3>🎉 Validation Achieved</h3>
                <div style="color:var(--support);font-size:13px;">
                    ${sales.length} sale(s)! Perceived viability validated. Continue building momentum.
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}