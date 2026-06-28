// ============================================
// EXPORT FUNCTIONS
// ============================================

async function exportJSON() {
    try {
        const data = {
            venture: AppState.currentVenture,
            ventures: AppState.ventures,
            events: AppState.events,
            inventory: AppState.inventory,
            debts: AppState.debts,
            countdown: AppState.countdown,
            exportedAt: new Date().toISOString(),
            version: '2.0'
        };
        downloadFile(JSON.stringify(data, null, 2), 'reality-flow-backup.json', 'application/json');
        showToast('JSON exported!', 'success');
    } catch (error) {
        showToast('Failed to export JSON', 'error');
    }
}

function exportCSV() {
    try {
        let csv = 'Date,Type,Category,Amount,Description,Late Entry\n';
        AppState.events.forEach(e => {
            csv += `${e.date},${e.type},${e.category},${e.amount || 0},"${e.description.replace(/"/g, '""')}",${e.lateEntry ? 'Yes' : 'No'}\n`;
        });
        downloadFile(csv, 'reality-flow-events.csv', 'text/csv');
        showToast('CSV exported!', 'success');
    } catch (error) {
        showToast('Failed to export CSV', 'error');
    }
}

function exportExcel() {
    try {
        let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8">
        <style>th {background:#1a1a2e;color:white;font-weight:bold;} td,th {padding:6px 10px;border:1px solid #ccc;}</style>
        </head><body>
        <h2>Venture Flow - Export</h2>
        <p>Venture: ${AppState.currentVenture?.name || 'Unknown'}</p>
        <p>Exported: ${new Date().toLocaleString()}</p>
        <h3>Events</h3>
        <table><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Description</th><th>Late Entry</th></tr>`;
        
        AppState.events.forEach(e => {
            html += `<tr><td>${e.date}</td><td>${e.type}</td><td>${getCategoryLabel(e.category)}</td><td>${e.amount || 0}</td><td>${e.description}</td><td>${e.lateEntry ? 'Yes' : 'No'}</td></tr>`;
        });
        
        html += `</table>
        <h3>Inventory</h3>
        <table><tr><th>Name</th><th>Cost</th><th>Price</th><th>Status</th></tr>`;
        AppState.inventory.forEach(i => {
            html += `<tr><td>${i.name}</td><td>${i.cost}</td><td>${i.price}</td><td>${i.status}</td></tr>`;
        });
        
        html += `</table>
        <h3>Debts</h3>
        <table><tr><th>Creditor</th><th>Amount</th><th>Date</th><th>Status</th></tr>`;
        AppState.debts.forEach(d => {
            html += `<tr><td>${d.creditor}</td><td>${d.amount}</td><td>${d.dateBorrowed}</td><td>${d.repaid ? 'Paid' : 'Unpaid'}</td></tr>`;
        });
        
        html += `</table></body></html>`;
        downloadFile(html, 'reality-flow-export.xls', 'application/vnd.ms-excel');
        showToast('Excel exported!', 'success');
    } catch (error) {
        showToast('Failed to export Excel', 'error');
    }
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}