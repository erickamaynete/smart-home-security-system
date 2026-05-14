/**
 * GuardIQ Settings Logic
 */
import { state } from './state.js';
import { showToast } from './app.js';

export function initSettings() {
    console.log('GuardIQ: Initializing Settings...');
    
    // Handle Toggles and Sliders
    document.addEventListener('input', (e) => {
        const slider = e.target.closest('#motion-slider');
        if (slider) {
            handleSlider(slider);
        }
    });

    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('.toggle');
        if (toggle) {
            handleToggle(toggle);
        }
    });
    
    // Subscribe to state to keep toggles in sync
    state.subscribe(syncUI);
}

/**
 * Handle slider input
 */
function handleSlider(slider) {
    const value = parseInt(slider.value);
    state.setState({ motionSensitivity: value });
    const labels = ['Low', 'Medium', 'High'];
    showToast(`Motion sensitivity set to ${labels[value-1]}`, 'info');
}

/**
 * Handle toggle clicks
 */
function handleToggle(toggle) {
    toggle.classList.toggle('active');
    const isActive = toggle.classList.contains('active');
    const label = toggle.previousElementSibling?.querySelector('h4')?.textContent || 'Setting';
    
    // Check for specific toggles
    if (toggle.id === 'sidebar-armed-toggle' || toggle.id === 'settings-armed-toggle') {
        state.setState({ armed: isActive });
        showToast(`System ${isActive ? 'Armed' : 'Disarmed'}`, isActive ? 'success' : 'warning');
        return;
    }

    if (label === 'Night Vision') {
        state.setState({ nightVision: isActive });
        showToast(`Night vision ${isActive ? 'enabled' : 'disabled'}`, 'info');
    } else if (label === 'Two-Factor Authentication') {
        state.setState({ twoFactor: isActive });
        showToast(`2FA ${isActive ? 'enabled' : 'disabled'}`, 'success');
    } else if (label === 'Push Notifications') {
        state.setState({ notifications: { push: isActive } });
        showToast(`Push notifications ${isActive ? 'on' : 'off'}`, 'info');
    } else if (label === 'SMS Alerts') {
        state.setState({ notifications: { sms: isActive } });
        showToast(`SMS alerts ${isActive ? 'on' : 'off'}`, 'info');
    } else if (label === 'Email Reports') {
        state.setState({ notifications: { email: isActive } });
        showToast(`Email reports ${isActive ? 'on' : 'off'}`, 'info');
    }
}

/**
 * Sync all UI elements with global state
 */
function syncUI(currentState) {
    // Sync Armed Toggles
    const armedToggles = [
        document.getElementById('sidebar-armed-toggle'),
        document.getElementById('settings-armed-toggle')
    ];
    
    armedToggles.forEach(toggle => {
        if (toggle) {
            if (currentState.armed) toggle.classList.add('active');
            else toggle.classList.remove('active');
        }
    });
    
    // Update status text in sidebar
    const sidebarText = document.getElementById('sidebar-armed-text');
    if (sidebarText) {
        sidebarText.textContent = currentState.armed ? 'ARMED' : 'DISARMED';
    }
    
    // Update status value in dashboard
    const dashStatus = document.getElementById('dash-status-value');
    if (dashStatus) {
        dashStatus.textContent = currentState.armed ? 'ARMED' : 'DISARMED';
        dashStatus.style.color = currentState.armed ? 'var(--success)' : 'var(--text-secondary)';
    }

    // Update Slider if it exists
    const slider = document.getElementById('motion-slider');
    if (slider) slider.value = currentState.motionSensitivity;
}

