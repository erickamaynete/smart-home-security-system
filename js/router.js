/**
 * GuardIQ View Router
 */
import { closeSidebar } from './sidebar.js';

const SETTINGS_VIEWS = [
    'account-security',
    'notification-settings',
    'help-settings',
    'about-system',
    'settings',
];

export const VIEW_LABELS = {
    dashboard: 'System Overview',
    cameras: 'Install Cameras',
    activity: 'Activity Log',
    alerts: 'Active Alerts',
    'account-security': 'Account Security',
    'notification-settings': 'Notification Settings',
    'help-settings': 'Help Settings',
    'about-system': 'About System',
    'settings': 'Hardware & Settings',
};

function updateNavbar(viewName) {
    const navbar = document.getElementById('top-navbar');
    const titleEl = document.getElementById('navbar-title');
    const brandEl = document.querySelector('.navbar-brand');
    const isDashboard = viewName === 'dashboard';
    const isCameras = viewName === 'cameras';
    const isActivity = viewName === 'activity';
    const backBtn = document.getElementById('navbar-back-btn');

    navbar?.classList.toggle('is-dashboard', isDashboard);
    navbar?.classList.toggle('is-cameras', isCameras);
    navbar?.classList.toggle('is-activity', isActivity);

    if (backBtn) {
        backBtn.hidden = !(isCameras || isActivity);
    }

    if (brandEl) {
        brandEl.hidden = !isDashboard;
    }

    if (titleEl) {
        titleEl.hidden = isDashboard;
        if (!isDashboard) {
            titleEl.textContent = VIEW_LABELS[viewName] || viewName;
        }
    }

    document.title = isDashboard
        ? 'HomeSecure | Smart Home Security'
        : `${VIEW_LABELS[viewName] || viewName} | HomeSecure`;
}

export const router = {
    views: [
        'dashboard',
        'cameras',
        'activity',
        'alerts',
        'account-security',
        'notification-settings',
        'help-settings',
        'about-system',
        'settings',
    ],
    activeView: 'dashboard',

    init() {
        document.addEventListener('click', (e) => {
            const settingsToggle = e.target.closest('#settings-nav-toggle');
            if (settingsToggle) {
                e.preventDefault();
                this.toggleSettingsMenu();
                return;
            }

            const navLink = e.target.closest('[data-view]');
            if (navLink) {
                e.preventDefault();
                const viewName = navLink.getAttribute('data-view');
                this.navigate(viewName);
            }
        });

        const hash = window.location.hash.replace('#', '');
        if (this.views.includes(hash)) {
            this.navigate(hash);
        } else {
            this.navigate(this.activeView);
        }
    },

    toggleSettingsMenu() {
        const group = document.getElementById('settings-nav-group');
        const submenu = document.getElementById('settings-submenu');
        const toggle = document.getElementById('settings-nav-toggle');
        if (!group || !submenu || !toggle) return;

        const open = group.classList.toggle('open');
        submenu.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    },

    setSettingsMenuOpen(open) {
        const group = document.getElementById('settings-nav-group');
        const submenu = document.getElementById('settings-submenu');
        const toggle = document.getElementById('settings-nav-toggle');
        if (!group || !submenu || !toggle) return;

        group.classList.toggle('open', open);
        submenu.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    },

    navigate(viewName) {
        if (!this.views.includes(viewName)) return;

        this.activeView = viewName;
        window.location.hash = viewName;

        this.views.forEach((view) => {
            const container = document.getElementById(`view-${view}`);
            if (container) {
                container.hidden = view !== viewName;
            }
        });

        document.querySelectorAll('.nav-item[data-view]').forEach((link) => {
            link.classList.toggle('active', link.getAttribute('data-view') === viewName);
        });

        document.querySelectorAll('.nav-subitem[data-view]').forEach((link) => {
            link.classList.toggle('active', link.getAttribute('data-view') === viewName);
        });

        const settingsGroup = document.getElementById('settings-nav-group');
        const settingsToggle = document.getElementById('settings-nav-toggle');
        const isSettingsView = SETTINGS_VIEWS.includes(viewName);

        if (settingsGroup) {
            settingsGroup.classList.toggle('has-active', isSettingsView);
        }
        if (settingsToggle) {
            settingsToggle.classList.toggle('active', isSettingsView);
        }

        if (isSettingsView) {
            this.setSettingsMenuOpen(true);
        }

        updateNavbar(viewName);
        closeSidebar();

        window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: viewName } }));
    },
};
