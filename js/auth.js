// ============================================
// AUTHENTICATION MODULE
// ============================================

const Auth = {
    // Current user
    currentUser: null,
    
    // Storage keys
    STORAGE_KEY: 'ventureflow_user',
    SESSION_KEY: 'ventureflow_session',
    
    /**
     * Initialize auth - check for existing session
     * @returns {boolean} True if user is logged in
     */
    init() {
        // Check for stored session
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                // Check if session is still valid (not expired)
                if (session.expires > Date.now()) {
                    this.currentUser = session.user;
                    console.log('✅ Session restored for:', this.currentUser.email);
                    return true;
                } else {
                    // Session expired
                    this.clearSession();
                    console.log('⏳ Session expired');
                    return false;
                }
            } catch (e) {
                this.clearSession();
                return false;
            }
        }
        return false;
    },
    
    /**
     * Register a new user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {string} name - User's display name
     * @returns {Object} Result { success, message, user }
     */
    register(email, password, name) {
        // Validate inputs
        if (!email || !password || !name) {
            return { success: false, message: 'All fields are required' };
        }
        
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }
        
        if (!this.isValidEmail(email)) {
            return { success: false, message: 'Please enter a valid email address' };
        }
        
        // Check if user already exists
        const users = this.getAllUsers();
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'An account with this email already exists' };
        }
        
        // Create new user
        const newUser = {
            id: 'user_' + Date.now(),
            email: email,
            password: this.hashPassword(password), // Simple hash for demo
            name: name,
            createdAt: new Date().toISOString()
        };
        
        // Save user
        users.push(newUser);
        this.saveUsers(users);
        
        // Auto-login after registration
        this.login(email, password);
        
        return { 
            success: true, 
            message: 'Account created successfully!', 
            user: newUser 
        };
    },
    
    /**
     * Login user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Object} Result { success, message, user }
     */
    login(email, password) {
        if (!email || !password) {
            return { success: false, message: 'Email and password are required' };
        }
        
        const users = this.getAllUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return { success: false, message: 'No account found with this email' };
        }
        
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Incorrect password' };
        }
        
        // Create session
        this.currentUser = user;
        this.saveSession(user);
        
        return { 
            success: true, 
            message: 'Login successful!', 
            user: user 
        };
    },
    
    /**
     * Logout user
     */
    logout() {
        this.currentUser = null;
        this.clearSession();
        console.log('👋 Logged out');
        return { success: true, message: 'Logged out successfully' };
    },
    
    /**
     * Get current user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        return this.currentUser;
    },
    
    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.currentUser !== null;
    },
    
    /**
     * Get user-specific data filter
     * @returns {string} User ID filter
     */
    getUserFilter() {
        return this.isLoggedIn() ? this.currentUser.id : null;
    },
    
    /**
     * Save user session
     * @param {Object} user - User object
     */
    saveSession(user) {
        const session = {
            user: user,
            expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    },
    
    /**
     * Clear user session
     */
    clearSession() {
        localStorage.removeItem(this.SESSION_KEY);
        this.currentUser = null;
    },
    
    /**
     * Get all users from storage
     * @returns {Array} Array of users
     */
    getAllUsers() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },
    
    /**
     * Save users to storage
     * @param {Array} users - Array of users
     */
    saveUsers(users) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    },
    
    /**
     * Simple password hash (for demo - use bcrypt in production)
     * @param {string} password - Plain text password
     * @returns {string} Hashed password
     */
    hashPassword(password) {
        // Simple hash for demo purposes
        // In production, use a proper hashing library
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'hashed_' + hash + '_' + password.length;
    },
    
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean}
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
};

// Expose globally
window.Auth = Auth;