/**
 * GuardIQ Global State Management
 */
import { api } from './api.js';

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
    setState(newState, options = {}) {
        const { syncServer = true } = options;

        // Handle nested updates for notifications
        const payload = { ...newState };
        if (payload.notifications) {
            this.notifications = { ...this.notifications, ...payload.notifications };
            delete payload.notifications;
        }

        Object.assign(this, payload);
        this.notify();

        if (syncServer) {
            api.patchState(newState).catch((err) => {
                console.warn('Failed to sync state with server:', err);
            });
        }
    },

    /**
     * Load initial state from the web.py API
     */
    async loadFromServer() {
        const serverState = await api.getState();
        this.setState(serverState, { syncServer: false });
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
