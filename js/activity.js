/**
 * GuardIQ Activity Log Logic
 */
import { state } from './state.js';
import { TAPO_STREAM_URL } from './settings.js';

const MAX_ACTIVITY_ENTRIES = 30;

const CAMERA_LABELS = {
    'main-indoor': 'Main Indoor (Tapo C500)',
    'front-door': 'Front Door',
    backyard: 'Backyard',
    garage: 'Garage',
    'side-gate': 'Side Gate',
    'living-room': 'Living Room',
    basement: 'Basement',
};

function pad2(n) {
    return String(n).padStart(2, '0');
}

function hhmm(date) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function relativeWhen(date) {
    // Keep it simple: show "Just now" for the current session, otherwise show HH:MM.
    return 'Just now';
}

function ensureTimeline() {
    return document.getElementById('activity-timeline');
}

function trimTimeline(timeline) {
    if (!timeline) return;
    const entries = timeline.querySelectorAll('.timeline-entry');
    for (let i = MAX_ACTIVITY_ENTRIES; i < entries.length; i += 1) {
        entries[i].remove();
    }
}

function makeMotionEntry({ cameraId, titleText, subtitleText, timeText, videoSrc }) {
    const entry = document.createElement('div');
    entry.className = 'timeline-entry';
    entry.setAttribute('data-category', 'motion');

    entry.innerHTML = `
        <div class="entry-icon" style="background: rgba(0, 194, 255, 0.15); color: var(--accent);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
        <div style="flex: 1;">
            <p style="font-size: 14px; font-weight: 500;">${titleText}</p>
            <p style="font-size: 12px; color: var(--text-secondary);">${subtitleText}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
            <button class="btn btn-outline zoom-btn" style="padding: 4px 10px; font-size: 11px;" data-video="${videoSrc}">
                View
            </button>
            <span style="font-size: 12px; color: var(--text-secondary);">${timeText}</span>
        </div>
    `;

    // Store camera id for potential future filtering/debugging
    entry.setAttribute('data-camera', cameraId);
    return entry;
}

function addActivityEntry(entry) {
    const timeline = ensureTimeline();
    if (!timeline || !entry) return;
    timeline.prepend(entry);
    trimTimeline(timeline);
}

export function initActivity() {
    console.log('GuardIQ: Initializing Activity Log...');
    
    // Log motion events (including Tapo main-indoor) when cameraStatuses transitions into "motion".
    let lastStatuses = { ...state.cameraStatuses };
    state.subscribe((current) => {
        const next = current.cameraStatuses || {};
        const prev = lastStatuses || {};

        Object.keys(next).forEach((cameraId) => {
            const was = prev[cameraId];
            const now = next[cameraId];
            if (was !== 'motion' && now === 'motion') {
                const label = CAMERA_LABELS[cameraId] || cameraId;
                const isTapo = cameraId === 'main-indoor';
                const videoSrc = isTapo ? TAPO_STREAM_URL : (document.querySelector(`.camera-feed-card[data-camera="${cameraId}"]`)?.getAttribute('data-video') || 'frontdoor.mp4');
                const when = new Date();

                addActivityEntry(
                    makeMotionEntry({
                        cameraId,
                        titleText: 'Motion Detected',
                        subtitleText: `${label} — ${relativeWhen(when)}`,
                        timeText: hhmm(when),
                        videoSrc,
                    })
                );
            }
        });

        lastStatuses = { ...next };
    });

    document.addEventListener('click', (e) => {
        const filterBtn = e.target.closest('#view-activity [data-filter]');
        if (filterBtn) {
            handleActivityFilter(filterBtn);
        }
    });
}

function handleActivityFilter(btn) {
    const filter = btn.getAttribute('data-filter');
    
    // Update active button state
    btn.parentElement.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Filter entries
    document.querySelectorAll('.timeline-entry').forEach(entry => {
        const category = entry.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
            entry.style.display = 'flex';
        } else {
            entry.style.display = 'none';
        }
    });
}
