// ============================================
// DEFAULT DATA - FIXED
// ============================================

const DEFAULT_VENTURE = {
    id: 1,
    name: 'Interior Design Business',
    description: 'Building and selling coffee tables, string art, and interior decor items',
    originDate: '2026-06-15',
    active: true,
    createdAt: new Date().toISOString()
};

const DEFAULT_EVENTS = [
    { id: 1, date: '2026-06-15', type: 'friction', category: 'debt_borrowed', amount: 3000, description: 'Borrowed 3000 from family to finance making 2 tables', ventureId: 1, lateEntry: false },
    { id: 2, date: '2026-06-15', type: 'support', category: 'material_acquisition', amount: 0, description: 'Acquired wood materials worth 3000 for table construction', ventureId: 1, lateEntry: false },
    { id: 3, date: '2026-06-16', type: 'support', category: 'production_completion', amount: 0, description: 'Production of first 2 tables initiated', ventureId: 1, lateEntry: false },
    { id: 4, date: '2026-06-17', type: 'support', category: 'production_completion', amount: 0, description: 'Table construction progressing toward completion', ventureId: 1, lateEntry: false },
    { id: 5, date: '2026-06-18', type: 'support', category: 'production_completion', amount: 0, description: 'Table structures completed', ventureId: 1, lateEntry: false },
    { id: 6, date: '2026-06-19', type: 'friction', category: 'debt_borrowed', amount: 500, description: 'Borrowed 500 to purchase paint and nails for finishing tables', ventureId: 1, lateEntry: false },
    { id: 7, date: '2026-06-19', type: 'support', category: 'material_acquisition', amount: 0, description: 'Finishing materials acquired (paint and nails)', ventureId: 1, lateEntry: false },
    { id: 8, date: '2026-06-20', type: 'friction', category: 'debt_borrowed', amount: 400, description: 'Borrowed 400 to top up paint and nails', ventureId: 1, lateEntry: false },
    { id: 9, date: '2026-06-20', type: 'support', category: 'production_completion', amount: 0, description: 'Finishing work continues on tables', ventureId: 1, lateEntry: false },
    { id: 10, date: '2026-06-21', type: 'friction', category: 'customer_objection', amount: 0, description: 'First customer interested but says price (3800) is too expensive', ventureId: 1, lateEntry: false },
    { id: 11, date: '2026-06-21', type: 'support', category: 'customer_interest', amount: 0, description: 'First market contact made — demand confirmed', ventureId: 1, lateEntry: false },
    { id: 12, date: '2026-06-22', type: 'support', category: 'production_completion', amount: 0, description: 'Both tables completed and ready for display', ventureId: 1, lateEntry: false },
    { id: 13, date: '2026-06-23', type: 'friction', category: 'customer_objection', amount: 0, description: 'Second customer interested but price (3800) is too expensive — pattern emerging', ventureId: 1, lateEntry: false },
    { id: 14, date: '2026-06-23', type: 'support', category: 'customer_interest', amount: 0, description: 'Second customer interest — demand not isolated', ventureId: 1, lateEntry: false },
    { id: 15, date: '2026-06-24', type: 'support', category: 'idea_generation', amount: 0, description: 'String art concept generated — diversification idea', ventureId: 1, lateEntry: false },
    { id: 16, date: '2026-06-25', type: 'friction', category: 'debt_borrowed', amount: 100, description: 'Borrowed 100 from workshop for string art materials', ventureId: 1, lateEntry: false },
    { id: 17, date: '2026-06-25', type: 'support', category: 'production_completion', amount: 0, description: 'String art production started', ventureId: 1, lateEntry: false },
    { id: 18, date: '2026-06-26', type: 'friction', category: 'debt_borrowed', amount: 1000, description: 'Borrowed 1000 from family', ventureId: 1, lateEntry: false },
    { id: 19, date: '2026-06-26', type: 'support', category: 'debt_repaid', amount: 100, description: 'Repaid 100 workshop debt', ventureId: 1, lateEntry: false },
    { id: 20, date: '2026-06-26', type: 'friction', category: 'expense', amount: 200, description: 'Bought strings and nails for string art', ventureId: 1, lateEntry: false },
    { id: 21, date: '2026-06-26', type: 'support', category: 'material_acquisition', amount: 0, description: 'Used leftover paint from tables — resource efficiency', ventureId: 1, lateEntry: false },
    { id: 22, date: '2026-06-26', type: 'friction', category: 'price_rejection', amount: 0, description: 'Customer offered 2800 against stated 4000 — price gap of 1200 identified', ventureId: 1, lateEntry: false },
    { id: 23, date: '2026-06-26', type: 'support', category: 'customer_interest', amount: 0, description: 'Third customer came with cash — strongest demand signal yet', ventureId: 1, lateEntry: false }
];

const DEFAULT_INVENTORY = [
    { id: 1, name: 'Coffee Table 1', cost: 2100, price: 3500, status: 'for_sale', ventureId: 1 },
    { id: 2, name: 'Coffee Table 2', cost: 2100, price: 3500, status: 'for_sale', ventureId: 1 },
    { id: 3, name: 'String Art 1', cost: 400, price: 350, status: 'for_sale', ventureId: 1 }
];

const DEFAULT_DEBTS = [
    { id: 1, creditor: 'Family (15/06)', amount: 3000, dateBorrowed: '2026-06-15', repaid: false, ventureId: 1 },
    { id: 2, creditor: 'Friend (19/06)', amount: 500, dateBorrowed: '2026-06-19', repaid: false, ventureId: 1 },
    { id: 3, creditor: 'Friend (20/06)', amount: 400, dateBorrowed: '2026-06-20', repaid: false, ventureId: 1 },
    { id: 4, creditor: 'Workshop (25/06)', amount: 100, dateBorrowed: '2026-06-25', repaid: true, ventureId: 1 },
    { id: 5, creditor: 'Family (26/06)', amount: 1000, dateBorrowed: '2026-06-26', repaid: false, ventureId: 1 }
];

async function loadDefaultData() {
    try {
        console.log('📦 Checking if default data needs to be loaded...');
        
        // Check if venture already exists
        const existingVentures = await db.getAll('venture');
        if (existingVentures && existingVentures.length > 0) {
            console.log('📦 Data already exists in database, skipping default load');
            return false;
        }
        
        console.log('📦 Loading default data into database...');
        
        // Add default venture
        await db.add('venture', DEFAULT_VENTURE);
        console.log('✅ Default venture added');
        
        // Add default events
        for (const event of DEFAULT_EVENTS) {
            await db.add('events', event);
        }
        console.log(`✅ ${DEFAULT_EVENTS.length} default events added`);
        
        // Add default inventory
        for (const item of DEFAULT_INVENTORY) {
            await db.add('inventory', item);
        }
        console.log(`✅ ${DEFAULT_INVENTORY.length} default inventory items added`);
        
        // Add default debts
        for (const debt of DEFAULT_DEBTS) {
            await db.add('debts', debt);
        }
        console.log(`✅ ${DEFAULT_DEBTS.length} default debts added`);
        
        console.log('✅ Default data loaded successfully into database');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to load default data into database:', error);
        throw error;
    }
}

// Make available globally
window.DEFAULT_VENTURE = DEFAULT_VENTURE;
window.DEFAULT_EVENTS = DEFAULT_EVENTS;
window.DEFAULT_INVENTORY = DEFAULT_INVENTORY;
window.DEFAULT_DEBTS = DEFAULT_DEBTS;
window.loadDefaultData = loadDefaultData;