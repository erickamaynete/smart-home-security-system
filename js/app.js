/**
 * GuardIQ Main Entry Point
 */
import { state } from './state.js';
import { router } from './router.js';
import { initCameras } from './cameras.js';
import { initAlerts } from './alerts.js';
import { initSettings } from './settings.js';
import { initActivity } from './activity.js';
import { initModal } from './modal.js';

async function initApp() {
    console.log('GuardIQ: Initializing App...');
    
    // Load components
    await Promise.all([
        loadComponent('sidebar-container', 'components/sidebar.html'),
        loadComponent('view-dashboard', 'components/dashboard.html'),
        loadComponent('view-cameras', 'components/cameras.html'),
        loadComponent('view-activity', 'components/activity.html'),
        loadComponent('view-alerts', 'components/alerts.html'),
        loadComponent('view-settings', 'components/settings.html')
    ]);
    
    // Initialize Router
    router.init();
    
    // Initialize Functional Modules
    initCameras();
    initAlerts();
    initSettings();
    initActivity();
    initModal();
    
    // Sync Initial State
    state.notify();
    
    // Global Alarm Action
    setupGlobalActions();

    // Listen for view changes to re-sync specific UI elements
    window.addEventListener('viewChanged', (e) => {
        if (e.detail.view === 'dashboard') {
            updateLockUI();
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
        // Sound Alarm
        const alarmBtn = e.target.closest('#trigger-alarm');
        if (alarmBtn) {
            const overlay = document.getElementById('alarm-overlay');
            overlay.hidden = false;
            setTimeout(() => overlay.hidden = true, 3000);
            return;
        }

        // Lock Doors
        const lockBtn = e.target.closest('#lock-doors');
        if (lockBtn) {
            state.setState({ doorsLocked: !state.doorsLocked });
            updateLockUI();
            showToast(state.doorsLocked ? 'All doors locked' : 'All doors unlocked', state.doorsLocked ? 'success' : 'warning');
            return;
        }

        // Request Patrol
        const patrolBtn = e.target.closest('#request-patrol');
        if (patrolBtn) {
            showToast('Security patrol requested. Estimated arrival: 8 mins.', 'info');
            patrolBtn.disabled = true;
            setTimeout(() => patrolBtn.disabled = false, 10000);
            return;
        }

        // Camera Icons (visual feedback)
        const camIcon = e.target.closest('.feed-actions svg');
        if (camIcon) {
            showToast('Action not available in demo mode', 'info');
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
        lockBtn.style.borderColor = 'var(--success)';
    } else {
        icon.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>';
        label.textContent = 'Lock Doors';
        lockBtn.style.borderColor = 'var(--border-color)';
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
