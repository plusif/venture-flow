// ============================================
// APPLICATION STATE - FIXED
// ============================================

var AppState = {
    ventures: [],
    currentVentureId: null,
    events: [],
    inventory: [],
    debts: [],
    countdown: null,
    initialized: false,
    
    clearVentureData: function() {
        this.events = [];
        this.inventory = [];
        this.debts = [];
    },
    
    hasVentureData: function() {
        return this.events.length > 0 || this.inventory.length > 0 || this.debts.length > 0;
    },
    
    get currentVenture() {
        for (var i = 0; i < this.ventures.length; i++) {
            if (this.ventures[i].id === this.currentVentureId) {
                return this.ventures[i];
            }
        }
        return null;
    },
    
    get totalSupport() {
        var sum = 0;
        for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].type === 'support' && this.events[i].amount) {
                sum += this.events[i].amount;
            }
        }
        return sum;
    },
    
    get totalFriction() {
        var sum = 0;
        for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].type === 'friction' && this.events[i].amount) {
                sum += this.events[i].amount;
            }
        }
        return sum;
    },
    
    get netPosition() {
        return this.totalSupport - this.totalFriction;
    },
    
    get daysRunning() {
        if (!this.currentVenture) return 0;
        return getDaysRunning(this.currentVenture.originDate);
    },
    
    get sales() {
        var result = [];
        for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].category === 'sale') {
                result.push(this.events[i]);
            }
        }
        return result;
    },
    
    get totalSalesAmount() {
        var sum = 0;
        var sales = this.sales;
        for (var i = 0; i < sales.length; i++) {
            sum += (sales[i].amount || 0);
        }
        return sum;
    },
    
    get customerInterests() {
        var result = [];
        for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].category === 'customer_interest') {
                result.push(this.events[i]);
            }
        }
        return result;
    },
    
    get priceRejections() {
        var result = [];
        for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].category === 'price_rejection' || this.events[i].category === 'customer_objection') {
                result.push(this.events[i]);
            }
        }
        return result;
    },
    
    get unpaidDebts() {
        var result = [];
        for (var i = 0; i < this.debts.length; i++) {
            if (!this.debts[i].repaid) {
                result.push(this.debts[i]);
            }
        }
        return result;
    },
    
    get totalUnpaidDebt() {
        var sum = 0;
        var debts = this.unpaidDebts;
        for (var i = 0; i < debts.length; i++) {
            sum += debts[i].amount;
        }
        return sum;
    },
    
    get inventoryForSale() {
        var result = [];
        for (var i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].status === 'for_sale') {
                result.push(this.inventory[i]);
            }
        }
        return result;
    },
    
    get inventorySold() {
        var result = [];
        for (var i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].status === 'sold') {
                result.push(this.inventory[i]);
            }
        }
        return result;
    },
    
    get inventoryInProduction() {
        var result = [];
        for (var i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].status === 'in_production') {
                result.push(this.inventory[i]);
            }
        }
        return result;
    },
    
    get inventoryValue() {
        var sum = 0;
        for (var i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].status !== 'sold') {
                sum += (this.inventory[i].price || 0);
            }
        }
        return sum;
    }
};

window.AppState = AppState;