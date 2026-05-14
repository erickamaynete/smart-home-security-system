/**
 * GuardIQ Camera Logic
 */
import { state } from './state.js';
import { router } from './router.js';
import { showToast } from './app.js';

export function initCameras() {
    console.log('GuardIQ: Initializing Cameras...');
    
    // Start live timestamp updates
    setInterval(updateTimestamps, 1000);
    
    // Start motion simulation
    startMotionSimulation();
    
    // Setup listeners (delegated)
    document.addEventListener('click', (e) => {
        // Filter buttons
        const filterBtn = e.target.closest('#view-cameras [data-filter]');
        if (filterBtn) {
            handleFilter(filterBtn);
            return;
        }

        // View button
        const viewBtn = e.target.closest('.camera-row .btn:not(.resync-btn)');
        if (viewBtn && viewBtn.textContent === 'View') {
            const row = viewBtn.closest('.camera-row');
            const name = row.querySelector('h4').textContent;
            router.navigate('dashboard');
            showToast(`Switching to ${name} feed`, 'success');
            return;
        }

        // Re-sync button
        const resyncBtn = e.target.closest('.camera-row .btn');
        if (resyncBtn && resyncBtn.textContent === 'Re-sync') {
            handleResync(resyncBtn);
        }
    });
}

/**
 * Handle camera re-sync simulation
 */
function handleResync(btn) {
    const row = btn.closest('.camera-row');
    const name = row.querySelector('h4').textContent;
    
    btn.disabled = true;
    btn.textContent = 'Syncing...';
    showToast(`Attempting to re-sync ${name}...`, 'info');

    setTimeout(() => {
        const statusDot = row.querySelector('.status-dot');
        const statusText = row.querySelector('.status-col span:last-child');
        
        statusDot.style.background = 'var(--success)';
        statusText.textContent = 'Online';
        statusText.style.color = 'var(--text-primary)';
        
        btn.textContent = 'View';
        btn.disabled = false;
        
        showToast(`${name} is now online`, 'success');
    }, 2000);
}

/**
 * Update all feed timestamps to current time
 */
function updateTimestamps() {
    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').split('.')[0];
    document.querySelectorAll('.feed-timestamp').forEach(el => {
        el.textContent = timestampStr;
    });
}

/**
 * Randomly simulate motion on one camera
 */
function startMotionSimulation() {
    const cameras = ['front-door', 'backyard', 'garage', 'side-gate'];
    
    const triggerMotion = () => {
        const randomCam = cameras[Math.floor(Math.random() * cameras.length)];
        const cameraEl = document.querySelector(`.camera-feed-card[data-camera="${randomCam}"]`);
        
        if (cameraEl) {
            const statusBadge = cameraEl.querySelector('.motion-status');
            
            // Update UI to "Motion"
            statusBadge.textContent = 'Motion';
            statusBadge.className = 'badge badge-danger motion-status';
            
            // Update State
            const newStatuses = { ...state.cameraStatuses };
            newStatuses[randomCam] = 'motion';
            state.setState({ cameraStatuses: newStatuses });
            
            // Update Dashboard Stat "Last Activity"
            const lastActivity = document.getElementById('last-activity-value');
            if (lastActivity) lastActivity.textContent = 'just now';

            // Reset after 4 seconds
            setTimeout(() => {
                statusBadge.textContent = 'Clear';
                statusBadge.className = 'badge badge-success motion-status';
                
                const resetStatuses = { ...state.cameraStatuses };
                resetStatuses[randomCam] = 'clear';
                state.setState({ cameraStatuses: resetStatuses });
            }, 4000);
        }
        
        // Schedule next motion event (8-12 seconds)
        const nextInterval = Math.floor(Math.random() * 4000) + 8000;
        setTimeout(triggerMotion, nextInterval);
    };
    
    // First trigger after 5s
    setTimeout(triggerMotion, 5000);
}

/**
 * Handle camera list filtering
 */
function handleFilter(btn) {
    const filter = btn.getAttribute('data-filter');
    
    // Update active button state
    btn.parentElement.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Filter rows
    document.querySelectorAll('.camera-row').forEach(row => {
        const category = row.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
            row.style.display = 'grid';
        } else {
            row.style.display = 'none';
        }
    });
}
