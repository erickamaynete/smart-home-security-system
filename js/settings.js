/**
 * GuardIQ Settings Logic - Hardware Connectivity Focus
 */
import { state } from './state.js';
import { api } from './api.js';
import { showToast } from './app.js';

/** Proxied go2rtc JPEG snapshot (see web.py tapo_proxy → frame.jpeg?src=tapo_c500) */
export const TAPO_STREAM_URL = '/api/stream/tapo';

// Debounce Tapo connectivity to avoid abrupt connect/disconnect on transient errors.
// We require N consecutive failures before flipping offline, and 1 success to flip online.
const TAPO_OFFLINE_FAILURES = 3;
let tapoConsecutiveFailures = 0;

export function initSettings() {
    console.log('GuardIQ: Initializing Hardware Connectivity Settings...');

    probeTapoStream();
    setInterval(probeTapoStream, 30000);
    
    document.addEventListener('click', (e) => {
        // Tapo Config Buttons
        const saveTapoBtn = e.target.closest('#save-tapo-config');
        if (saveTapoBtn) {
            handleSaveTapo();
            return;
        }

        const testTapoBtn = e.target.closest('#test-tapo-stream');
        if (testTapoBtn) {
            handleTestTapo();
            return;
        }
    });

    // Subscribe to state to keep dashboard synced
    state.subscribe((currentState) => {
        if (currentState.tapoConfig) {
            syncTapoUI(currentState.tapoConfig.connected);
        }
    });
}

/**
 * Check go2rtc relay via backend proxy and update connected state.
 */
export async function probeTapoStream() {
    try {
        const res = await fetch(`${TAPO_STREAM_URL}?t=${Date.now()}`);
        if (res.ok) {
            tapoConsecutiveFailures = 0;
            if (!state.tapoConfig?.connected) {
                state.setState(
                    { tapoConfig: { ...state.tapoConfig, connected: true } },
                    { syncServer: false }
                );
            } else {
                syncTapoUI(true);
            }
            return true;
        }

        // Non-OK response counts as a failure, but we don't flip offline immediately.
        tapoConsecutiveFailures += 1;
        if (state.tapoConfig?.connected && tapoConsecutiveFailures >= TAPO_OFFLINE_FAILURES) {
            state.setState(
                { tapoConfig: { ...state.tapoConfig, connected: false } },
                { syncServer: false }
            );
        }
        return state.tapoConfig?.connected ?? false;
    } catch (err) {
        console.warn('Tapo go2rtc probe failed:', err);
        tapoConsecutiveFailures += 1;
        if (state.tapoConfig?.connected && tapoConsecutiveFailures >= TAPO_OFFLINE_FAILURES) {
            state.setState(
                { tapoConfig: { ...state.tapoConfig, connected: false } },
                { syncServer: false }
            );
        }
        return state.tapoConfig?.connected ?? false;
    }
}

/**
 * Sync Tapo C500 status across Dashboard and Settings
 */
let tapoRefreshInterval = null;

function syncTapoUI(connected) {
    // Dashboard Sync
    const dashPulse = document.getElementById('dash-tapo-pulse');
    const dashBadge = document.getElementById('dash-tapo-badge');
    const dashIP = document.getElementById('dash-tapo-ip-text');
    const dashMotion = document.getElementById('dash-tapo-motion');
    const dashPlaceholder = document.getElementById('dash-tapo-placeholder');
    const dashFeed = document.getElementById('dash-tapo-feed');

    if (dashPulse) dashPulse.style.display = connected ? 'block' : 'none';
    if (dashBadge) {
        dashBadge.textContent = connected ? 'TAPO LIVE' : 'TAPO OFFLINE';
        dashBadge.style.background = connected ? 'var(--accent)' : 'var(--text-secondary)';
    }
    if (dashIP) dashIP.textContent = connected ? `WiFi: ${state.tapoConfig.ip}` : 'WiFi: Disconnected';
    if (dashMotion) {
        dashMotion.textContent = connected ? 'Clear' : 'Offline';
        dashMotion.className = connected ? 'badge badge-success motion-status' : 'badge badge-gray motion-status';
    }
    if (dashPlaceholder) dashPlaceholder.style.display = connected ? 'none' : 'flex';

    const dashTimestamp = document.getElementById('dash-tapo-timestamp');
    
    if (dashFeed) {
        dashFeed.onerror = () => {
            // Treat image load error as a transient failure.
            tapoConsecutiveFailures += 1;
            if (state.tapoConfig?.connected && tapoConsecutiveFailures >= TAPO_OFFLINE_FAILURES) {
                state.setState(
                    { tapoConfig: { ...state.tapoConfig, connected: false } },
                    { syncServer: false }
                );
            }
        };

        if (connected) {
            dashFeed.style.opacity = '1';
            if (!tapoRefreshInterval) {
                console.log('GuardIQ: Starting Tapo go2rtc relay cycle');
                const updateFeed = () => {
                    if (!state.tapoConfig?.connected) return;
                    dashFeed.src = `${TAPO_STREAM_URL}?t=${Date.now()}`;
                    if (dashTimestamp) {
                        const now = new Date();
                        dashTimestamp.textContent = now.toISOString().replace('T', ' ').split('.')[0];
                    }
                };
                updateFeed();
                tapoRefreshInterval = setInterval(updateFeed, 2000);
            }
        } else {
            dashFeed.style.opacity = '0.2';
            dashFeed.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            if (tapoRefreshInterval) {
                clearInterval(tapoRefreshInterval);
                tapoRefreshInterval = null;
            }
        }
    }

    // Settings Sync
    const settingsDot = document.getElementById('tapo-status-dot');
    const settingsText = document.getElementById('tapo-status-text');

    if (settingsDot) settingsDot.style.backgroundColor = connected ? 'var(--success)' : 'var(--text-secondary)';
    if (settingsText) settingsText.textContent = connected ? 'Connected' : 'Disconnected';
}

/**
 * Save Tapo C500 Configuration
 */
async function handleSaveTapo() {
    const ipEl = document.getElementById('tapo-ip');
    const userEl = document.getElementById('tapo-user');
    const passEl = document.getElementById('tapo-pass');
    if (!ipEl || !userEl || !passEl) return;

    // Sanitize IP: replace commas with dots and remove spaces
    const ip = ipEl.value.replace(/,/g, '.').replace(/\s/g, '');
    ipEl.value = ip; // Update UI to show fixed IP
    
    const user = userEl.value;
    const pass = passEl.value;

    showToast(`Updating Tapo C500 configuration at ${ip}...`, 'info');

    try {
        const data = await api.testHardware('Tapo-C500', ip, '554');
        
        state.setState({
            tapoConfig: {
                ...state.tapoConfig,
                ip,
                username: user,
                password: pass,
            },
        });

        const streamOk = await probeTapoStream();
        showToast(
            streamOk
                ? (data.message || 'Tapo C500 saved — live stream via go2rtc')
                : 'Camera IP saved, but go2rtc stream is not ready yet',
            streamOk ? 'success' : 'warning'
        );
    } catch (error) {
        showToast(error.message || 'Could not verify Tapo C500 connection', 'danger');
    }
}

/**
 * Test Tapo C500 Stream
 */
async function handleTestTapo() {
    const ipEl = document.getElementById('tapo-ip');
    if (!ipEl) return;
    
    // Sanitize IP
    const ip = ipEl.value.replace(/,/g, '.').replace(/\s/g, '');
    ipEl.value = ip;

    showToast('Testing Tapo stream via go2rtc...', 'info');

    try {
        await api.testHardware('Tapo-C500', ip, '554');
        const streamOk = await probeTapoStream();
        if (streamOk) {
            showToast('Tapo C500 live — go2rtc relay is working', 'success');
        } else {
            showToast('Camera reachable, but go2rtc has no frame yet. Check tapo_c500 in go2rtc.', 'warning');
        }
    } catch (error) {
        showToast(error.message || 'Tapo C500 connection test failed', 'danger');
    }
}
