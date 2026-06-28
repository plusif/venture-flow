// ============================================
// DATABASE LAYER - COMPLETE FIX
// ============================================

const DB_NAME = 'RealityFlowDB';
const DB_VERSION = 4;

let dbInstance = null;
let dbReady = false;

function openDB() {
    return new Promise((resolve, reject) => {
        try {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const existingStores = db.objectStoreNames;
                
                const stores = [
                    { name: 'venture', keyPath: 'id', indexes: ['active'] },
                    { name: 'events', keyPath: 'id', indexes: ['date', 'type', 'ventureId'] },
                    { name: 'inventory', keyPath: 'id', indexes: ['ventureId', 'status'] },
                    { name: 'debts', keyPath: 'id', indexes: ['ventureId', 'repaid'] },
                    { name: 'countdown', keyPath: 'id', indexes: [] }
                ];
                
                stores.forEach(storeDef => {
                    let store;
                    if (!existingStores.contains(storeDef.name)) {
                        store = db.createObjectStore(storeDef.name, { 
                            keyPath: storeDef.keyPath, 
                            autoIncrement: true 
                        });
                    } else {
                        store = event.target.transaction.objectStore(storeDef.name);
                    }
                    storeDef.indexes.forEach(indexName => {
                        if (!store.indexNames.contains(indexName)) {
                            try {
                                store.createIndex(indexName, indexName, { unique: false });
                            } catch (e) {
                                // Index already exists
                            }
                        }
                    });
                });
                console.log('📦 Database schema updated');
            };
            
            request.onsuccess = (event) => {
                dbInstance = event.target.result;
                dbReady = true;
                console.log('✅ Database opened successfully');
                resolve(dbInstance);
            };
            
            request.onerror = (event) => {
                console.error('❌ IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
        } catch (e) {
            console.error('❌ Failed to open database:', e);
            reject(e);
        }
    });
}

function ensureDB() {
    if (!dbReady || !dbInstance) {
        throw new Error('Database not ready');
    }
    return dbInstance;
}

function dbAdd(store, data) {
    return new Promise((resolve, reject) => {
        try {
            const db = ensureDB();
            const tx = db.transaction(store, 'readwrite');
            const request = tx.objectStore(store).add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (e) {
            reject(e);
        }
    });
}

function dbGetAll(store) {
    return new Promise((resolve, reject) => {
        try {
            const db = ensureDB();
            const tx = db.transaction(store, 'readonly');
            const request = tx.objectStore(store).getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (e) {
            reject(e);
        }
    });
}

function dbGet(store, id) {
    return new Promise((resolve, reject) => {
        try {
            const db = ensureDB();
            const tx = db.transaction(store, 'readonly');
            const request = tx.objectStore(store).get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (e) {
            reject(e);
        }
    });
}

function dbPut(store, data) {
    return new Promise((resolve, reject) => {
        try {
            const db = ensureDB();
            const tx = db.transaction(store, 'readwrite');
            const request = tx.objectStore(store).put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (e) {
            reject(e);
        }
    });
}

function dbDelete(store, id) {
    return new Promise((resolve, reject) => {
        try {
            const db = ensureDB();
            const tx = db.transaction(store, 'readwrite');
            const request = tx.objectStore(store).delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } catch (e) {
            reject(e);
        }
    });
}

function dbGetByIndex(store, index, value) {
    return new Promise((resolve, reject) => {
        try {
            const db = ensureDB();
            const tx = db.transaction(store, 'readonly');
            const objectStore = tx.objectStore(store);
            
            if (!objectStore.indexNames.contains(index)) {
                resolve([]);
                return;
            }
            
            const request = objectStore.index(index).getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } catch (e) {
            resolve([]);
        }
    });
}

function dbClear(store) {
    return new Promise((resolve, reject) => {
        try {
            const db = ensureDB();
            const tx = db.transaction(store, 'readwrite');
            const request = tx.objectStore(store).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        } catch (e) {
            reject(e);
        }
    });
}

function isDBReady() {
    return dbReady && dbInstance !== null;
}

// Create the db object with all methods
const db = {
    open: openDB,
    add: dbAdd,
    getAll: dbGetAll,
    get: dbGet,
    put: dbPut,
    delete: dbDelete,
    getByIndex: dbGetByIndex,
    clear: dbClear,
    isReady: isDBReady
};

// Expose globally - THIS IS CRITICAL
if (typeof window !== 'undefined') {
    window.db = db;
}

console.log('📦 Database module loaded');