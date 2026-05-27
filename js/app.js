/**
 * GuardIQ Main Entry Point
 */
import { state } from './state.js';
import { api } from './api.js';
import { requireAuth, applyUserProfile, logout } from './session.js';
import { router } from './router.js';
import { initCameras } from './cameras.js';
import { initAlerts } from './alerts.js';
import { initSettings, probeTapoStream } from './settings.js';
import { initAccountSecurity } from './account-security.js';
import { initActivity } from './activity.js';
import { initModal } from './modal.js';
import { initSidebar } from './sidebar.js';
import { initNavbar, updateNavbarUserDetails } from './navbar.js';

async function initApp() {
    console.log('GuardIQ: Initializing App...');

    const user = await requireAuth();
    if (!user) return;

    try {
        await state.loadFromServer();
    } catch (error) {
        console.warn('Running without server state:', error);
    }

    // Load components
    await Promise.all([
        loadComponent('sidebar-container', 'components/sidebar.html'),
        loadComponent('navbar-container', 'components/navbar.html'),
        loadComponent('view-dashboard', 'components/dashboard.html'),
        loadComponent('view-cameras', 'components/cameras.html'),
        loadComponent('view-activity', 'components/activity.html'),
        loadComponent('view-alerts', 'components/alerts.html'),
        loadComponent('view-account-security', 'components/account-security.html'),
        loadComponent('view-notification-settings', 'components/notification-settings.html'),
        loadComponent('view-help-settings', 'components/help-settings.html'),
        loadComponent('view-about-system', 'components/about-system.html'),
        loadComponent('view-settings', 'components/settings.html')
    ]);

    applyUserProfile(user);
    updateNavbarUserDetails(user);
    initNavbar();

    // Initialize Router
    router.init();
    initSidebar();

    // Initialize Functional Modules
    initCameras();
    initAlerts();
    initSettings();
    initAccountSecurity();
    initActivity();
    initModal();
    
    // Sync Initial State
    state.notify();
    
    // Global Alarm Action
    setupGlobalActions();

    // Specific hardware sync for dashboard components that might be loaded later
    window.addEventListener('viewChanged', (e) => {
        if (e.detail.view === 'dashboard') {
            updateLockUI();
            probeTapoStream();
            state.notify();
        }
    });
}

/**
 * Fetch and inject component HTML
 */
async function loadComponent(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error('Error loading component:', error);
    }
}

/**
 * Show a toast notification
 */
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Setup Global UI Actions
 */
function setupGlobalActions() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('#logout-btn')) {
            logout();
            return;
        }

        // Sound Alarm
        const alarmBtn = e.target.closest('#trigger-alarm');
        if (alarmBtn) {
            api.triggerAlarm().catch(() => {});
            const overlay = document.getElementById('alarm-overlay');
            overlay.hidden = false;
            setTimeout(() => overlay.hidden = true, 3000);
            return;
        }

        // Lock Doors
        const lockBtn = e.target.closest('#lock-doors');
        if (lockBtn) {
            api.toggleLock()
                .then((data) => {
                    state.setState({ doorsLocked: data.doorsLocked }, { syncServer: false });
                    updateLockUI();
                    showToast(
                        data.doorsLocked ? 'All doors locked' : 'All doors unlocked',
                        data.doorsLocked ? 'success' : 'warning'
                    );
                })
                .catch(() => showToast('Could not update door locks', 'warning'));
            return;
        }

        // Request Patrol
        const patrolBtn = e.target.closest('#request-patrol');
        if (patrolBtn) {
            api.requestPatrol()
                .then((data) => showToast(data.message, 'info'))
                .catch(() => showToast('Could not request patrol', 'warning'));
            patrolBtn.disabled = true;
            setTimeout(() => patrolBtn.disabled = false, 10000);
            return;
        }
    });
}

/**
 * Update Lock UI on Dashboard
 */
function updateLockUI() {
    const lockBtn = document.getElementById('lock-doors');
    if (!lockBtn) return;
    
    const icon = lockBtn.querySelector('svg');
    const label = lockBtn.querySelector('span');
    
    if (state.doorsLocked) {
        icon.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
        label.textContent = 'Unlock Doors';
        lockBtn.classList.add('action-btn--locked');
    } else {
        icon.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>';
        label.textContent = 'Lock Doors';
        lockBtn.classList.remove('action-btn--locked');
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
