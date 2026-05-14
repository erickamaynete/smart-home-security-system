/**
 * GuardIQ Global State Management
 */
export const state = {
    armed: true,
    alertCount: 3,
    doorsLocked: true,
    motionSensitivity: 2, // 1: Low, 2: Med, 3: High
    nightVision: true,
    twoFactor: true,
    notifications: {
        push: true,
        sms: false,
        email: false
    },
    cameraStatuses: {
        'front-door': 'clear',
        'backyard': 'clear',
        'garage': 'clear',
        'side-gate': 'clear',
        'living-room': 'clear',
        'basement': 'offline'
    },
    
    // Listeners for state changes
    listeners: [],
    
    /**
     * Update state and notify listeners
     * @param {Object} newState 
     */
    setState(newState) {
        // Handle nested updates for notifications
        if (newState.notifications) {
            this.notifications = { ...this.notifications, ...newState.notifications };
            delete newState.notifications;
        }
        
        Object.assign(this, newState);
        this.notify();
    },
    
    /**
     * Subscribe to state changes
     * @param {Function} callback 
     */
    subscribe(callback) {
        this.listeners.push(callback);
    },
    
    /**
     * Notify all subscribers
     */
    notify() {
        this.listeners.forEach(callback => callback(this));
    }
};
