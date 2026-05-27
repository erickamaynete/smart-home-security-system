/**
 * HomeSecure web.py API client
 */
import { getToken } from './storage.js';

const API_BASE = '/api';

async function request(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    let data = null;
    const text = await response.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = { error: text };
        }
    }

    if (!response.ok) {
        const message = data?.error || `Request failed (${response.status})`;
        throw new Error(message);
    }

    return data;
}

export const api = {
    login(email, password) {
        return request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    signup(name, email, password) {
        return request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
    },

    logout() {
        return request('/auth/logout', { method: 'POST' });
    },

    getMe() {
        return request('/auth/me');
    },

    changePassword(currentPassword, newPassword) {
        return request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },

    resetPassword(email, newPassword) {
        return request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, newPassword }),
        });
    },

    getState() {
        return request('/state');
    },

    patchState(updates) {
        return request('/state', {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    triggerAlarm() {
        return request('/alarm', { method: 'POST' });
    },

    toggleLock() {
        return request('/lock-doors', { method: 'POST' });
    },

    requestPatrol() {
        return request('/patrol', { method: 'POST' });
    },

    testHardware(deviceType, ip, port) {
        // Ensure deviceType is URI encoded and path ends with trailing slash if needed by web.py
        const encodedType = encodeURIComponent(deviceType);
        return request(`/hardware/test/${encodedType}`, {
            method: 'POST',
            body: JSON.stringify({ ip, port }),
        });
    },
};
