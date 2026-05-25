/**
 * Session storage (no API imports — avoids circular deps)
 */
const TOKEN_KEY = 'homesecure_token';
const USER_KEY = 'homesecure_user';

export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function setSession(token, user) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
    return Boolean(getToken());
}
