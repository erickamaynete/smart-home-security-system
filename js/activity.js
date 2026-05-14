/**
 * GuardIQ Activity Log Logic
 */
export function initActivity() {
    console.log('GuardIQ: Initializing Activity Log...');
    
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
