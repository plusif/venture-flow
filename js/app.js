// ============================================
// MAIN APPLICATION CONTROLLER
// ============================================

async function initApp() {
    try {
        console.log('🚀 Initializing Venture Flow...');
        
        // ADD THIS: Wait a tiny bit for DOM to be fully ready
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 1. Open Database
        let dbOpen = false;
        try {
            await window.db.open();
            dbOpen = true;
            console.log('✅ Database opened successfully');
        } catch (dbError) {
            console.warn('⚠️ Database error, using in-memory fallback:', dbError);
            dbOpen = false;
        }
        
        // 2. Check if we need to load default data
        if (dbOpen) {
            try {
                const existingVentures = await window.db.getAll('venture');
                if (!existingVentures || existingVentures.length === 0) {
                    console.log('📦 No data found in database, loading default data...');
                    await loadDefaultData();
                    console.log('✅ Default data loaded into database');
                } else {
                    console.log(`📦 Found ${existingVentures.length} ventures in database`);
                }
            } catch (e) {
                console.warn('⚠️ Error checking/loading default data:', e);
            }
        }
        
        // 3. Load Ventures from database
        try {
            if (dbOpen) {
                AppState.ventures = await window.db.getAll('venture');
                console.log(`✅ Loaded ${AppState.ventures.length} ventures from DB`);
            }
        } catch (e) {
            console.warn('⚠️ Could not load ventures from DB:', e);
        }
        
        // 4. If no ventures, set default in memory
        if (!AppState.ventures || AppState.ventures.length === 0) {
            console.log('📦 No ventures found, creating default...');
            AppState.ventures = [{
                id: 1,
                name: 'Interior Design Business',
                description: 'Building and selling coffee tables, string art, and interior decor items',
                originDate: '2026-06-15',
                active: true,
                createdAt: new Date().toISOString()
            }];
            
            // Load default data into memory
            AppState.events = DEFAULT_EVENTS.map(e => ({ ...e }));
            AppState.inventory = DEFAULT_INVENTORY.map(i => ({ ...i }));
            AppState.debts = DEFAULT_DEBTS.map(d => ({ ...d }));
            console.log('📦 Default data loaded into memory');
        }
        
        // 5. Set Current Venture
        const activeVenture = AppState.ventures.find(v => v.active);
        AppState.currentVentureId = activeVenture ? activeVenture.id : 
            (AppState.ventures.length > 0 ? AppState.ventures[0].id : null);
        
        console.log(`📍 Current venture: ${AppState.currentVentureId}`);
        
        // 6. Load Countdown
        try {
            if (dbOpen) {
                const countdownData = await window.db.getAll('countdown');
                AppState.countdown = countdownData.length > 0 ? countdownData[0] : null;
            }
        } catch (e) {
            AppState.countdown = null;
        }
        
        // 7. Load Venture Data - CRITICAL: Only load data for the current venture
        if (AppState.currentVentureId) {
            // Clear any existing data first
            AppState.clearVentureData();
            
            if (dbOpen) {
                await loadVentureDataFromDB(AppState.currentVentureId);
            } else {
                // Use in-memory data filtered by venture
                const filteredEvents = AppState.events.filter(e => e.ventureId === AppState.currentVentureId);
                const filteredInventory = AppState.inventory.filter(i => i.ventureId === AppState.currentVentureId);
                const filteredDebts = AppState.debts.filter(d => d.ventureId === AppState.currentVentureId);
                
                AppState.events = filteredEvents;
                AppState.inventory = filteredInventory;
                AppState.debts = filteredDebts;
                AppState.events.sort((a, b) => new Date(a.date) - new Date(b.date));
                console.log(`📦 Using memory data: ${AppState.events.length} events`);
            }
        }
        
        AppState.initialized = true;
        
        // 8. Render Everything
        renderAll();
        
        // 9. Setup Event Listeners
        setupEventListeners();
        
        // 10. Start Countdown Timer
        if (AppState.countdown) {
            startCountdownTimer();
        }
        
        // 11. Register Advisor (NEW)
        if (typeof Advisor !== 'undefined' && Advisor.register) {
            Advisor.register();
            console.log('🧠 Advisor registered successfully');
        } else {
            console.warn('⚠️ Advisor not available');
        }
        
        // 12. Update Advisor Badge (NEW)
        updateAdvisorBadge();
        
        console.log('✅ Venture Flow initialized successfully!');
        console.log(`📊 ${AppState.events.length} events, ${AppState.inventory.length} products, ${AppState.debts.length} debts`);
        console.log(`🏢 ${AppState.ventures.length} ventures, active: ${AppState.currentVentureId}`);
        
        setTimeout(() => {
            renderAll();
            updateAdvisorBadge();
        }, 100);
        
    } catch (error) {
        console.error('❌ Failed to initialize:', error);
        showToast('Failed to load app. Please refresh.', 'error');
        
        // Emergency fallback
        console.log('🔄 Emergency fallback: Loading default data directly...');
        AppState.ventures = [{
            id: 1,
            name: 'Interior Design Business',
            description: 'Building and selling coffee tables, string art, and interior decor items',
            originDate: '2026-06-15',
            active: true,
            createdAt: new Date().toISOString()
        }];
        AppState.events = DEFAULT_EVENTS.map(e => ({ ...e }));
        AppState.inventory = DEFAULT_INVENTORY.map(i => ({ ...i }));
        AppState.debts = DEFAULT_DEBTS.map(d => ({ ...d }));
        AppState.currentVentureId = 1;
        AppState.initialized = true;
        renderAll();
        setupEventListeners();
        
        // Try to register advisor even in fallback
        if (typeof Advisor !== 'undefined' && Advisor.register) {
            Advisor.register();
            updateAdvisorBadge();
        }
        
        showToast('Loaded with fallback data', 'warning');
    }
}

async function loadVentureDataFromDB(ventureId) {
    console.log(`📂 Loading data for venture ${ventureId} from database...`);
    AppState.currentVentureId = ventureId;
    
    // Clear existing data first
    AppState.clearVentureData();
    
    try {
        // Try loading from database using indexes
        const events = await window.db.getByIndex('events', 'ventureId', ventureId);
        const inventory = await window.db.getByIndex('inventory', 'ventureId', ventureId);
        const debts = await window.db.getByIndex('debts', 'ventureId', ventureId);
        
        if (events && events.length > 0) {
            AppState.events = events;
            AppState.inventory = inventory || [];
            AppState.debts = debts || [];
            console.log(`✅ Loaded ${events.length} events from DB`);
        } else {
            // Fallback: get all and filter
            const allEvents = await window.db.getAll('events');
            const allInventory = await window.db.getAll('inventory');
            const allDebts = await window.db.getAll('debts');
            
            AppState.events = allEvents.filter(e => e.ventureId === ventureId);
            AppState.inventory = allInventory.filter(i => i.ventureId === ventureId);
            AppState.debts = allDebts.filter(d => d.ventureId === ventureId);
            console.log(`✅ Loaded ${AppState.events.length} events (filtered)`);
        }
    } catch (e) {
        console.warn('⚠️ Error loading venture data:', e);
        AppState.events = [];
        AppState.inventory = [];
        AppState.debts = [];
    }
    
    AppState.events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function renderAll() {
    console.log('🔄 Rendering all views...');
    updateVentureSelector();
    updateVentureDate();
    renderTimeline();
    renderDashboard();
    renderInventory();
    renderDebts();
    renderReports();
    renderVentures();
    updateStatusBar();
    renderCountdown();
    // Update advisor badge after re-render
    updateAdvisorBadge();
}

async function switchVenture(id) {
    console.log(`🔄 Switching to venture ${id}...`);
    
    try {
        // Update active status
        for (const v of AppState.ventures) {
            v.active = v.id === id;
            if (window.db.isReady()) {
                try {
                    await window.db.put('venture', v);
                } catch (e) {
                    console.warn('DB put failed:', e);
                }
            }
        }
        
        // Set current venture ID
        AppState.currentVentureId = id;
        
        // CRITICAL: Clear all existing data before loading new venture data
        AppState.clearVentureData();
        
        // Load data for the new venture
        if (window.db.isReady()) {
            await loadVentureDataFromDB(id);
        } else {
            // Fallback: filter memory data
            AppState.events = AppState.events.filter(e => e.ventureId === id);
            AppState.inventory = AppState.inventory.filter(i => i.ventureId === id);
            AppState.debts = AppState.debts.filter(d => d.ventureId === id);
            AppState.events.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        
        // Render everything with the new data
        renderAll();
        
        const venture = AppState.ventures.find(v => v.id === id);
        const dataCount = AppState.events.length;
        showToast(`Switched to "${venture ? venture.name : 'Venture'}" (${dataCount} events)`, 'success');
        
        console.log(`✅ Switched to "${venture ? venture.name : 'Venture'}" with ${dataCount} events`);
        
    } catch (error) {
        console.error('❌ Failed to switch venture:', error);
        showToast('Failed to switch venture', 'error');
    }
}

// ============================================
// ADVISOR BADGE (NEW)
// ============================================

function updateAdvisorBadge() {
    try {
        if (typeof Advisor === 'undefined') return;
        
        const status = Advisor.getStatus();
        const advisorBtn = document.querySelector('[data-view="advisor"]');
        if (!advisorBtn) return;
        
        // Remove existing badge
        const oldBadge = advisorBtn.querySelector('.advisor-badge');
        if (oldBadge) oldBadge.remove();
        
        // Add new badge if urgent
        if (status.hasUrgent) {
            const badge = document.createElement('span');
            badge.className = 'advisor-badge';
            badge.textContent = status.urgent;
            badge.style.cssText = `
                background: #e74c3c;
                color: white;
                font-size: 9px;
                padding: 1px 6px;
                border-radius: 10px;
                margin-left: 4px;
                font-weight: 700;
                display: inline-block;
                min-width: 16px;
                text-align: center;
                line-height: 16px;
                animation: pulse-badge 2s infinite;
            `;
            advisorBtn.appendChild(badge);
        }
    } catch (e) {
        // Silently fail - badge is non-critical
    }
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

function updateVentureSelector() {
    const selector = document.getElementById('venture-selector');
    if (!selector) return;
    selector.innerHTML = '';
    AppState.ventures.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.name;
        if (v.id === AppState.currentVentureId) opt.selected = true;
        selector.appendChild(opt);
    });
    selector.onchange = function(e) {
        switchVenture(parseInt(e.target.value));
    };
}

function updateVentureDate() {
    const venture = AppState.currentVenture;
    const el = document.getElementById('venture-date');
    if (!el) return;
    if (venture) {
        const d = new Date(venture.originDate + 'T00:00:00');
        el.textContent = `Since: ${d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    } else {
        el.textContent = 'Since: --';
    }
}

function updateStatusBar() {
    const netEl = document.getElementById('net-position');
    const supportEl = document.getElementById('total-support');
    const frictionEl = document.getElementById('total-friction');
    const daysEl = document.getElementById('total-days');
    
    if (netEl) {
        netEl.textContent = formatCurrency(AppState.netPosition);
        netEl.className = 'status-value ' + 
            (AppState.netPosition > 0 ? 'positive' : AppState.netPosition < 0 ? 'negative' : 'neutral');
    }
    if (supportEl) {
        supportEl.textContent = '+ ' + formatCurrency(AppState.totalSupport);
    }
    if (frictionEl) {
        frictionEl.textContent = '- ' + formatCurrency(AppState.totalFriction);
    }
    if (daysEl) {
        daysEl.textContent = AppState.daysRunning;
    }
}

// ============================================
// TOAST
// ============================================

let appToastTimeout = null;

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toast-message');
    
    if (!toast || !messageEl) return;
    
    messageEl.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('visible');
    
    clearTimeout(appToastTimeout);
    appToastTimeout = setTimeout(function() {
        toast.classList.remove('visible');
    }, 3000);
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navigation
    var navBtns = document.querySelectorAll('.nav-btn');
    for (var i = 0; i < navBtns.length; i++) {
        navBtns[i].addEventListener('click', function() {
            var allBtns = document.querySelectorAll('.nav-btn');
            for (var j = 0; j < allBtns.length; j++) {
                allBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            var view = this.dataset.view;
            var allViews = document.querySelectorAll('.view');
            for (var k = 0; k < allViews.length; k++) {
                allViews[k].classList.remove('active');
            }
            var targetView = document.getElementById('view-' + view);
            if (targetView) targetView.classList.add('active');
            
            if (view === 'dashboard') renderDashboard();
            if (view === 'inventory') renderInventory();
            if (view === 'debts') renderDebts();
            if (view === 'reports') renderReports();
            if (view === 'ventures') renderVentures();
            if (view === 'advisor') renderAdvisor();
            
            // Update badge when switching to advisor
            if (view === 'advisor') {
                setTimeout(updateAdvisorBadge, 100);
            }
        });
    }
    
    // Modal close buttons
    var closeBtns = document.querySelectorAll('.modal-close');
    for (var m = 0; m < closeBtns.length; m++) {
        closeBtns[m].addEventListener('click', function() {
            var modalId = this.dataset.modal;
            var modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('visible');
        });
    }
    
    // Modal overlay clicks
    var overlays = document.querySelectorAll('.modal-overlay');
    for (var o = 0; o < overlays.length; o++) {
        overlays[o].addEventListener('click', function() {
            this.parentElement.classList.remove('visible');
        });
    }
    
    // Add Event
    var addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', function() {
            openEventModal(today(), false);
        });
    }
    
    var addLateBtn = document.getElementById('add-late-event-btn');
    if (addLateBtn) {
        addLateBtn.addEventListener('click', function() {
            openEventModal(today(), true);
        });
    }
    
    // Event form radio
    var radioOptions = document.querySelectorAll('.radio-option');
    for (var r = 0; r < radioOptions.length; r++) {
        radioOptions[r].addEventListener('click', function() {
            var parent = this.closest('.radio-group');
            if (parent) {
                var siblings = parent.querySelectorAll('.radio-option');
                for (var s = 0; s < siblings.length; s++) {
                    siblings[s].classList.remove('active');
                }
            }
            this.classList.add('active');
            this.querySelector('input').checked = true;
            updateCategoryOptions(this.dataset.type);
        });
    }
    
    // Event form submit
    var eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveEvent();
        });
    }
    
    // Inventory
    var addInvBtn = document.getElementById('add-inventory-btn');
    if (addInvBtn) {
        addInvBtn.addEventListener('click', function() {
            openInventoryModal();
        });
    }
    
    var invForm = document.getElementById('inventory-form');
    if (invForm) {
        invForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveInventory();
        });
    }
    
    // Debts
    var addDebtBtn = document.getElementById('add-debt-btn');
    if (addDebtBtn) {
        addDebtBtn.addEventListener('click', function() {
            openDebtModal();
        });
    }
    
    var debtForm = document.getElementById('debt-form');
    if (debtForm) {
        debtForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveDebt();
        });
    }
    
    // Ventures
    var addVentureBtn = document.getElementById('add-venture-btn');
    if (addVentureBtn) {
        addVentureBtn.addEventListener('click', function() {
            openVentureModal();
        });
    }
    
    var ventureForm = document.getElementById('venture-form');
    if (ventureForm) {
        ventureForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveVenture();
        });
    }
    
    // Countdown
    var countdownForm = document.getElementById('countdown-form');
    if (countdownForm) {
        countdownForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveCountdown();
        });
    }
    
    var clearBtn = document.getElementById('countdown-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', async function() {
            await clearCountdown();
        });
    }
    
    // Settings
    var settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            var reportsBtn = document.querySelector('[data-view="reports"]');
            if (reportsBtn) reportsBtn.click();
            setTimeout(function() {
                var content = document.getElementById('main-content');
                if (content) content.scrollTop = 0;
            }, 100);
        });
    }
    
}

// ============================================
// INIT
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

var appResizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(appResizeTimeout);
    appResizeTimeout = setTimeout(function() {
        var dashboardView = document.getElementById('view-dashboard');
        if (dashboardView && dashboardView.classList.contains('active')) {
            renderDashboard();
        }
    }, 300);
});