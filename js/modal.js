/**
 * GuardIQ Video Modal Logic
 */
import { showToast } from './app.js';

export function initModal() {
    const modal = document.getElementById('video-modal');
    const closeBtn = document.getElementById('close-modal');
    const modalOverlay = modal.querySelector('.modal-overlay');
    const modalVideo = document.getElementById('modal-video');
    const modalTitle = document.getElementById('modal-title');
    const modalAlarm = document.getElementById('modal-alarm');

    // Global listener for zoom buttons
    document.addEventListener('click', (e) => {
        const zoomBtn = e.target.closest('.zoom-btn');
        if (zoomBtn) {
            const card = zoomBtn.closest('.camera-feed-card');
            const timelineEntry = zoomBtn.closest('.timeline-entry');
            
            let videoSrc = zoomBtn.getAttribute('data-video');
            let title = "Video Preview";

            if (card) {
                videoSrc = card.getAttribute('data-video');
                title = card.querySelector('h3').textContent;
            } else if (timelineEntry) {
                title = timelineEntry.querySelector('p').textContent + " (Recording)";
            }
            
            openModal(title, videoSrc);
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
        modalTitle.textContent = title;
        modalVideo.src = videoSrc;
        modal.hidden = false;
        document.body.style.overflow = 'hidden'; // Prevent scroll
        
        showToast(`Viewing ${title}`, 'info');
    }

    function closeModal() {
        modal.hidden = true;
        modalVideo.pause();
        modalVideo.src = "";
        document.body.style.overflow = '';
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
