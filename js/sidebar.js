/**
 * Sidebar drawer — toggled from navbar burger menu
 */
const OPEN_CLASS = 'sidebar-open';

export function initSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('sidebar-container');

    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
        if (document.body.classList.contains(OPEN_CLASS)) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    backdrop?.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSidebar();
    });

    sidebar.addEventListener('click', (e) => {
        const link = e.target.closest('[data-view]');
        if (link) closeSidebar();
    });

    document.getElementById('logout-btn')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);
}

export function openSidebar() {
    document.body.classList.add(OPEN_CLASS);
    const toggle = document.getElementById('sidebar-toggle');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('sidebar-container');
    toggle?.setAttribute('aria-expanded', 'true');
    toggle?.setAttribute('aria-label', 'Close menu');
    backdrop?.removeAttribute('hidden');
    sidebar?.setAttribute('aria-hidden', 'false');
}

export function closeSidebar() {
    document.body.classList.remove(OPEN_CLASS);
    const toggle = document.getElementById('sidebar-toggle');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('sidebar-container');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open menu');
    backdrop?.setAttribute('hidden', '');
    sidebar?.setAttribute('aria-hidden', 'true');
}
