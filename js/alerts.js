/**
 * GuardIQ Alerts Logic
 */
import { state } from './state.js';
import { router } from './router.js';
import { showToast } from './app.js';

export function initAlerts() {
    console.log('GuardIQ: Initializing Alerts...');
    
    // Listen for alert actions
    document.addEventListener('click', (e) => {
        // Dismiss
        const dismissBtn = e.target.closest('.dismiss-alert');
        if (dismissBtn) {
            handleDismiss(dismissBtn);
            return;
        }

        // View Camera
        const viewBtn = e.target.closest('.alert-card .btn-primary');
        if (viewBtn) {
            const card = viewBtn.closest('.alert-card');
            const title = card.querySelector('h3').textContent;
            router.navigate('dashboard');
            showToast(`Investigating: ${title}`, 'warning');
        }
    });
    
    // Subscribe to state changes to update badges
    state.subscribe(updateAlertUI);
}

/**
 * Handle alert card dismissal
 */
function handleDismiss(btn) {
    const card = btn.closest('.alert-card');
    if (card) {
        // Fade out animation
        card.style.opacity = '0';
        card.style.transform = 'translateX(20px)';
        card.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            card.remove();
            
            // Update state
            const newCount = Math.max(0, state.alertCount - 1);
            state.setState({ alertCount: newCount });
            
            // Check for empty state
            checkEmptyState();
        }, 3000); // 3s fade out for effect
        
        // Immediate feedback: disable button
        btn.disabled = true;
        btn.textContent = 'Dismissing...';
    }
}

/**
 * Update UI based on alert count
 */
function updateAlertUI(currentState) {
    const badge = document.getElementById('alert-badge');
    if (badge) {
        badge.textContent = currentState.alertCount;
        badge.style.display = currentState.alertCount > 0 ? 'block' : 'none';
    }
}

/**
 * Show empty state if no alerts remain
 */
function checkEmptyState() {
    const list = document.getElementById('alerts-list');
    const empty = document.getElementById('alerts-empty');
    
    if (list && list.children.length === 0) {
        if (empty) empty.style.display = 'block';
    }
}
