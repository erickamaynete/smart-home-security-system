/**
 * Navbar user menu dropdown
 */
import { logout } from './session.js';
import { getStoredUser } from './storage.js';

export function initNavbar() {
    const toggle = document.getElementById('navbar-user-toggle');
    const dropdown = document.getElementById('navbar-user-dropdown');
    const logoutBtn = document.getElementById('navbar-dropdown-logout');

    if (!toggle || !dropdown) return;

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = toggle.getAttribute('aria-expanded') === 'true';
        setUserMenuOpen(!open);
    });

    logoutBtn?.addEventListener('click', () => {
        setUserMenuOpen(false);
        logout();
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar-user-menu')) {
            setUserMenuOpen(false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setUserMenuOpen(false);
    });
}

export function setUserMenuOpen(open) {
    const toggle = document.getElementById('navbar-user-toggle');
    const dropdown = document.getElementById('navbar-user-dropdown');
    if (!toggle || !dropdown) return;

    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    dropdown.hidden = !open;
}

export function updateNavbarUserDetails(user) {
    if (!user) return;

    const phone = user.phone?.trim() || 'Not set';
    const fields = {
        'navbar-dropdown-avatar': user.initials || '?',
        'navbar-dropdown-name': user.name || 'User',
        'navbar-dropdown-email': user.email || '—',
        'navbar-dropdown-phone': phone,
    };

    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

export function refreshNavbarUserFromStorage() {
    updateNavbarUserDetails(getStoredUser());
}
