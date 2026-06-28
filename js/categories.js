// ============================================
// EVENT CATEGORIES
// ============================================

const CATEGORIES = {
    friction: [
        { value: 'debt_borrowed', label: 'Debt Borrowed' },
        { value: 'expense', label: 'Expense' },
        { value: 'price_rejection', label: 'Price Rejection' },
        { value: 'customer_objection', label: 'Customer Objection' },
        { value: 'delay', label: 'Delay' },
        { value: 'resource_shortage', label: 'Resource Shortage' },
        { value: 'production_failure', label: 'Production Failure' },
        { value: 'market_silence', label: 'Market Silence' }
    ],
    support: [
        { value: 'sale', label: 'Sale' },
        { value: 'customer_interest', label: 'Customer Interest' },
        { value: 'production_completion', label: 'Production Complete' },
        { value: 'material_acquisition', label: 'Material Acquired' },
        { value: 'skill_gained', label: 'Skill Gained' },
        { value: 'idea_generation', label: 'New Idea' },
        { value: 'market_validation', label: 'Market Validation' },
        { value: 'debt_repaid', label: 'Debt Repaid' },
        { value: 'negotiation', label: 'Negotiation' }
    ]
};

function getCategoryLabel(value) {
    const all = [...CATEGORIES.friction, ...CATEGORIES.support];
    const found = all.find(c => c.value === value);
    return found ? found.label : value;
}

function getCategoriesByType(type) {
    return CATEGORIES[type] || [];
}

function updateCategoryOptions(type) {
    const select = document.getElementById('event-category');
    select.innerHTML = '';
    const categories = getCategoriesByType(type);
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.value;
        opt.textContent = cat.label;
        select.appendChild(opt);
    });
}