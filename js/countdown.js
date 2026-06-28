// ============================================
// COUNTDOWN TIMER - FIXED
// ============================================

var countdownInterval = null;

function renderCountdown() {
    var container = document.getElementById('countdown-container');
    if (!container) return;
    
    if (!AppState.countdown) {
        container.className = '';
        container.innerHTML = 
            '<div class="flex-between">' +
                '<span class="countdown-title">⏱ No countdown set</span>' +
                '<button class="countdown-toggle" onclick="openCountdownModal()">Set Timer</button>' +
            '</div>';
        return;
    }
    
    container.className = 'visible';
    container.innerHTML = 
        '<div class="countdown-header">' +
            '<span class="countdown-title">' + escapeHtml(AppState.countdown.label || 'Countdown') + '</span>' +
            '<div>' +
                '<button class="countdown-toggle" onclick="openCountdownModal()">✎</button>' +
                '<button class="countdown-toggle" onclick="toggleCountdownVisibility()" style="font-size:12px;">' +
                    (AppState.countdown.hidden ? '👁 Show' : '🙈 Hide') +
                '</button>' +
            '</div>' +
        '</div>' +
        '<div id="countdown-display" ' + (AppState.countdown.hidden ? 'style="display:none;"' : '') + '>' +
            formatCountdown(AppState.countdown.targetDate) +
        '</div>';
}

function startCountdownTimer() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(function() {
        if (AppState.countdown && !AppState.countdown.hidden) {
            var display = document.getElementById('countdown-display');
            if (display) {
                display.textContent = formatCountdown(AppState.countdown.targetDate);
                var diff = new Date(AppState.countdown.targetDate) - new Date();
                if (diff < 0) display.textContent = '⏰ Time Reached!';
            }
        }
    }, 1000);
}

function toggleCountdownVisibility() {
    if (AppState.countdown) {
        AppState.countdown.hidden = !AppState.countdown.hidden;
        if (window.db.isReady && window.db.isReady()) {
            window.db.put('countdown', AppState.countdown).catch(function(e) { console.warn('DB put failed:', e); });
        }
        renderCountdown();
        if (!AppState.countdown.hidden) startCountdownTimer();
    }
}

function openCountdownModal() {
    var modal = document.getElementById('countdown-modal');
    if (!modal) return;
    
    var targetInput = document.getElementById('countdown-target');
    var labelInput = document.getElementById('countdown-label');
    
    if (AppState.countdown) {
        try {
            var d = new Date(AppState.countdown.targetDate);
            targetInput.value = d.toISOString().slice(0, 16);
            labelInput.value = AppState.countdown.label || '';
        } catch (e) { targetInput.value = ''; }
    } else {
        var now = new Date();
        now.setDate(now.getDate() + 7);
        targetInput.value = now.toISOString().slice(0, 16);
        labelInput.value = '';
    }
    
    modal.classList.add('visible');
}

async function saveCountdown() {
    var targetDate = document.getElementById('countdown-target').value;
    var label = document.getElementById('countdown-label').value.trim();
    
    if (!targetDate) {
        showToast('Please select a target date', 'error');
        return;
    }
    
    var data = {
        targetDate: new Date(targetDate).toISOString(),
        label: label || 'Countdown',
        hidden: false
    };
    
    try {
        if (AppState.countdown && AppState.countdown.id) {
            data.id = AppState.countdown.id;
            if (window.db.isReady && window.db.isReady()) {
                await window.db.put('countdown', data);
            }
        } else {
            if (window.db.isReady && window.db.isReady()) {
                var id = await window.db.add('countdown', data);
                data.id = id;
            } else {
                data.id = Date.now() + Math.random() * 1000;
            }
        }
        
        AppState.countdown = data;
        document.getElementById('countdown-modal').classList.remove('visible');
        renderCountdown();
        startCountdownTimer();
        showToast('Countdown set!', 'success');
    } catch (error) {
        console.error('Failed to save countdown:', error);
        showToast('Failed to save countdown', 'error');
    }
}

async function clearCountdown() {
    if (!confirm('Clear countdown?')) return;
    try {
        if (AppState.countdown && AppState.countdown.id) {
            if (window.db.isReady && window.db.isReady()) {
                await window.db.delete('countdown', AppState.countdown.id);
            }
        }
        AppState.countdown = null;
        document.getElementById('countdown-modal').classList.remove('visible');
        renderCountdown();
        if (countdownInterval) clearInterval(countdownInterval);
        showToast('Countdown cleared', 'success');
    } catch (error) {
        showToast('Failed to clear countdown', 'error');
    }
}