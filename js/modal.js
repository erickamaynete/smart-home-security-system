/**
 * GuardIQ Video Modal Logic
 */
import { showToast } from './app.js';

function getCameraRowMeta(row) {
    if (!row) return null;
    const videoSrc = row.getAttribute('data-video');
    const title = row.querySelector('h4, h3')?.textContent?.trim();
    if (!videoSrc || !title) return null;
    return { title, videoSrc };
}

export function openVideoModal(title, videoSrc) {
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    const modalTitle = document.getElementById('modal-title');
    if (!modal || !modalVideo || !modalTitle) return;

    modalTitle.textContent = title;
    modalVideo.src = videoSrc;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    showToast(`Viewing ${title}`, 'info');
}

export function initModal() {
    const modal = document.getElementById('video-modal');
    const closeBtn = document.getElementById('close-modal');
    const modalOverlay = modal.querySelector('.modal-overlay');
    const modalVideo = document.getElementById('modal-video');
    const modalTitle = document.getElementById('modal-title');
    const modalAlarm = document.getElementById('modal-alarm');

    // Global listener for zoom buttons
    document.addEventListener('click', (e) => {
        const thumbBtn = e.target.closest('.camera-row .thumb-box');
        if (thumbBtn) {
            const row = thumbBtn.closest('.camera-row');
            const meta = getCameraRowMeta(row);
            if (meta) {
                document.querySelectorAll('.camera-row.is-active').forEach((el) => {
                    el.classList.remove('is-active');
                });
                row?.classList.add('is-active');
                openModal(meta.title, meta.videoSrc);
            }
            return;
        }

        const zoomBtn = e.target.closest('.zoom-btn');
        if (zoomBtn) {
            const row = zoomBtn.closest('.camera-row');
            const card = zoomBtn.closest('.camera-feed-card');
            const timelineEntry = zoomBtn.closest('.timeline-entry');

            let videoSrc = zoomBtn.getAttribute('data-video');
            let title = 'Video Preview';

            if (row) {
                const meta = getCameraRowMeta(row);
                if (meta) {
                    openModal(meta.title, meta.videoSrc);
                    return;
                }
            }

            if (card) {
                videoSrc = card.getAttribute('data-video');
                title = card.querySelector('h3').textContent;
            } else if (timelineEntry) {
                title = timelineEntry.querySelector('p').textContent + ' (Recording)';
            }

            openModal(title, videoSrc);
            return;
        }

        const viewBtn = e.target.closest('.camera-row .btn');
        if (viewBtn && viewBtn.textContent.trim() === 'View') {
            const meta = getCameraRowMeta(viewBtn.closest('.camera-row'));
            if (meta) openModal(meta.title, meta.videoSrc);
            return;
        }

        // Also handle "View Camera" in alerts
        const viewAlertBtn = e.target.closest('.alert-card .btn-primary');
        if (viewAlertBtn) {
            // For demo, we'll just show the Front Door if it's a person detection
            const card = viewAlertBtn.closest('.alert-card');
            const title = card.querySelector('h3').textContent;
            const videoSrc = "frontdoor.mp4";
            
            setTimeout(() => openModal(`Investigating: ${title}`, videoSrc), 500);
        }
    });

    function openModal(title, videoSrc) {
        openVideoModal(title, videoSrc);
    }

    function closeModal() {
        modal.hidden = true;
        modalVideo.pause();
        modalVideo.src = '';
        document.body.style.overflow = '';
        document.querySelectorAll('.camera-row.is-active').forEach((el) => {
            el.classList.remove('is-active');
        });
    }

    closeBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    // Modal Alarm Button
    modalAlarm.addEventListener('click', () => {
        const overlay = document.getElementById('alarm-overlay');
        overlay.hidden = false;
        showToast('SIREN ACTIVATED', 'danger');
        
        setTimeout(() => {
            overlay.hidden = true;
        }, 3000);
    });
}
