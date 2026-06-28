// ============================================
// DASHBOARD RENDERER
// ============================================

function renderDashboard() {
    const container = document.getElementById('dashboard-container');
    
    const salesCount = AppState.sales.length;
    const totalSalesAmount = AppState.totalSalesAmount;
    const customerInterests = AppState.customerInterests.length;
    const priceRejections = AppState.priceRejections.length;
    const conversionRate = customerInterests > 0 ? Math.round(salesCount / customerInterests * 100) : 0;
    
    const forSale = AppState.inventoryForSale.length;
    const sold = AppState.inventorySold.length;
    const inProduction = AppState.inventoryInProduction.length;
    const inventoryValue = AppState.inventoryValue;
    
    const unpaidDebts = AppState.unpaidDebts.length;
    const totalDebt = AppState.totalUnpaidDebt;
    const totalDebtAll = AppState.debts.reduce((sum, d) => sum + d.amount, 0);
    
    let html = `
        <div class="dashboard-grid">
            <div class="stat-card">
                <span class="stat-number ${AppState.netPosition > 0 ? 'positive' : AppState.netPosition < 0 ? 'negative' : 'neutral'}">
                    ${formatCurrency(AppState.netPosition)}
                </span>
                <span class="stat-label">Net Position</span>
            </div>
            <div class="stat-card">
                <span class="stat-number positive">${formatCurrency(AppState.totalSupport)}</span>
                <span class="stat-label">Total Support (+)</span>
            </div>
            <div class="stat-card">
                <span class="stat-number negative">${formatCurrency(AppState.totalFriction)}</span>
                <span class="stat-label">Total Friction (−)</span>
            </div>
            <div class="stat-card">
                <span class="stat-number neutral">${AppState.daysRunning}</span>
                <span class="stat-label">Days Running</span>
            </div>
        </div>
        
        <div class="dashboard-section">
            <h3>📈 Sales & Market</h3>
            <div class="signal-row"><span class="signal-label">Sales</span><span class="signal-value support">${salesCount} (${formatCurrency(totalSalesAmount)})</span></div>
            <div class="signal-row"><span class="signal-label">Customer Interests</span><span class="signal-value support">${customerInterests}</span></div>
            <div class="signal-row"><span class="signal-label">Price Rejections</span><span class="signal-value friction">${priceRejections}</span></div>
            <div class="signal-row"><span class="signal-label">Conversion Rate</span>
                <span class="signal-value ${customerInterests > 0 && salesCount > 0 ? 'support' : 'friction'}">${conversionRate}%</span>
            </div>
        </div>
        
        <div class="dashboard-section">
            <h3>📦 Inventory</h3>
            <div class="signal-row"><span class="signal-label">For Sale</span><span class="signal-value support">${forSale}</span></div>
            <div class="signal-row"><span class="signal-label">Sold</span><span class="signal-value">${sold}</span></div>
            <div class="signal-row"><span class="signal-label">In Production</span><span class="signal-value neutral">${inProduction}</span></div>
            <div class="signal-row"><span class="signal-label">Inventory Value</span><span class="signal-value support">${formatCurrency(inventoryValue)}</span></div>
        </div>
        
        <div class="dashboard-section">
            <h3>💰 Debts</h3>
            <div class="signal-row"><span class="signal-label">Unpaid Debts</span><span class="signal-value friction">${unpaidDebts} (${formatCurrency(totalDebt)})</span></div>
            <div class="signal-row"><span class="signal-label">Paid Debts</span><span class="signal-value support">${AppState.debts.filter(d => d.repaid).length}</span></div>
            <div class="signal-row"><span class="signal-label">Total Debt (All)</span><span class="signal-value friction">${formatCurrency(totalDebtAll)}</span></div>
        </div>
        
        <div class="chart-container">
            <h4>📊 Reality Trend (Last 14 Days)</h4>
            <div class="chart-canvas-wrapper"><canvas id="trend-chart"></canvas></div>
        </div>
    `;
    
    // ============================================
    // NEW: MEMORY CARD
    // ============================================
    if (typeof MemoryEngine !== 'undefined' && AppState.events.length > 0) {
        const memory = MemoryEngine.summarize(14);
        html += `
            <div class="dashboard-section">
                <h3>🧠 Venture Memory</h3>
                ${MemoryEngine.renderMemoryCard(memory)}
            </div>
        `;
    }
    
    // ============================================
    // NEW: ANOMALY ALERTS
    // ============================================
    if (typeof AnomalyEngine !== 'undefined' && AppState.events.length > 0) {
        const anomalies = AnomalyEngine.getActiveAnomalies();
        if (anomalies.length > 0) {
            const urgentCount = anomalies.filter(a => a.severity === 'high').length;
            const borderColor = urgentCount > 0 ? 'var(--friction)' : 'var(--warning)';
            html += `
                <div class="dashboard-section" style="border-color:${borderColor};">
                    <h3>⚠️ ${anomalies.length} Anomal${anomalies.length > 1 ? 'ies' : 'y'} Detected</h3>
                    ${AnomalyEngine.renderAnomalies(anomalies.slice(0, 3))}
                    ${anomalies.length > 3 ? `<div style="text-align:center;margin-top:8px;font-size:12px;color:var(--gray-500);">+ ${anomalies.length - 3} more (see Advisor tab for details)</div>` : ''}
                </div>
            `;
        }
    }
    
    // ============================================
    // NEW: PATTERN SUMMARY
    // ============================================
    if (typeof PatternEngine !== 'undefined' && AppState.events.length > 0) {
        const patterns = PatternEngine.getActivePatterns();
        if (patterns.length > 0) {
            const highCount = patterns.filter(p => p.severity === 'high').length;
            html += `
                <div class="dashboard-section">
                    <h3>📐 ${patterns.length} Pattern${patterns.length > 1 ? 's' : ''} Detected</h3>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:4px 0;">
            `;
            patterns.slice(0, 4).forEach(p => {
                const color = p.severity === 'high' ? 'var(--friction)' : p.severity === 'medium' ? 'var(--warning)' : 'var(--support)';
                html += `
                    <div style="display:flex;align-items:center;gap:6px;font-size:12px;padding:4px 6px;background:var(--bg-secondary);border-radius:4px;">
                        <span style="color:${color};font-weight:600;">${p.severity === 'high' ? '🔴' : p.severity === 'medium' ? '🟡' : '🟢'}</span>
                        <span style="color:var(--gray-300);">${p.title.length > 30 ? p.title.substring(0, 30) + '...' : p.title}</span>
                    </div>
                `;
            });
            if (patterns.length > 4) {
                html += `<div style="font-size:11px;color:var(--gray-500);text-align:center;grid-column:span 2;">+ ${patterns.length - 4} more patterns</div>`;
            }
            html += `</div></div>`;
        }
    }
    
    container.innerHTML = html;
    renderTrendChart();
}

function renderTrendChart() {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 300;
    const height = 120;
    canvas.width = width;
    canvas.height = height;
    
    const now = new Date();
    const dates = [];
    const supportData = [];
    const frictionData = [];
    
    for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
        
        let support = 0, friction = 0;
        AppState.events.forEach(e => {
            if (e.date === dateStr) {
                if (e.type === 'support' && e.amount) support += e.amount;
                if (e.type === 'friction' && e.amount) friction += e.amount;
            }
        });
        supportData.push(support);
        frictionData.push(friction);
    }
    
    const maxVal = Math.max(1, ...supportData, ...frictionData);
    const padding = { top: 8, bottom: 16, left: 4, right: 4 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const stepX = chartWidth / (dates.length - 1);
    
    ctx.clearRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }
    
    // Support line
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.beginPath();
    supportData.forEach((val, i) => {
        const x = padding.left + i * stepX;
        const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Friction line
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    frictionData.forEach((val, i) => {
        const x = padding.left + i * stepX;
        const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#868e96';
    ctx.font = '7px system-ui, sans-serif';
    ctx.textAlign = 'center';
    dates.forEach((date, i) => {
        if (i % 2 === 0) {
            const x = padding.left + i * stepX;
            try {
                const d = new Date(date + 'T00:00:00');
                ctx.fillText(d.getDate() + '/' + (d.getMonth() + 1), x, height - 2);
            } catch (e) {}
        }
    });
    
    // Legend
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(width - 60, 2, 10, 4);
    ctx.fillStyle = '#868e96';
    ctx.font = '7px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Support', width - 48, 6);
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(width - 60, 10, 10, 4);
    ctx.fillStyle = '#868e96';
    ctx.fillText('Friction', width - 48, 14);
}