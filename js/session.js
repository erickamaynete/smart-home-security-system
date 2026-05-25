/**
 * Client session helpers for HomeSecure auth
 */
import { api } from './api.js';
import {
    getToken,
    setSession,
    clearSession,
    isLoggedIn,
} from './storage.js';

export {
    getToken,
    setSession,
    clearSession,
    isLoggedIn,
    getStoredUser,
} from './storage.js';

export function getInitials(name) {
    if (!name) return '?';
    return name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

export function applyUserProfile(user) {
    const initials = user?.initials || getInitials(user?.name);
    const avatar = document.querySelector('.user-block .avatar');
    const nameEl = document.querySelector('.user-block .user-name');
    if (avatar && user?.name) avatar.textContent = initials;
    if (nameEl && user?.name) nameEl.textContent = user.name;

    const navbarAvatar = document.getElementById('navbar-user-avatar');
    const navbarName = document.getElementById('navbar-user-name');
    if (navbarAvatar && user?.name) navbarAvatar.textContent = initials;
    if (navbarName && user?.name) navbarName.textContent = user.name;
}

export async function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return null;
    }

    try {
        const user = await api.getMe();
        setSession(getToken(), user);
        return user;
    } catch {
        clearSession();
        window.location.href = '/login.html';
        return null;
    }
}

export async function logout() {
    try {
        await api.logout();
    } catch {
        /* still clear locally */
    }
    clearSession();
    window.location.href = '/login.html';
}
