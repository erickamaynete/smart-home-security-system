/**
 * GuardIQ View Router
 */
export const router = {
    views: ['dashboard', 'cameras', 'activity', 'alerts', 'settings'],
    activeView: 'dashboard',
    
    init() {
        // Listen for navigation clicks (event delegation)
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('[data-view]');
            if (navLink) {
                e.preventDefault();
                const viewName = navLink.getAttribute('data-view');
                this.navigate(viewName);
            }
        });
        
        // Initial navigation
        this.navigate(this.activeView);
    },
    
    navigate(viewName) {
        if (!this.views.includes(viewName)) return;
        
        this.activeView = viewName;
        
        // Update URL hash (optional, but good for refresh)
        window.location.hash = viewName;
        
        // Update DOM visibility
        this.views.forEach(view => {
            const container = document.getElementById(`view-${view}`);
            if (container) {
                container.hidden = (view !== viewName);
            }
        });
        
        // Update navigation active states
        document.querySelectorAll('[data-view]').forEach(link => {
            if (link.getAttribute('data-view') === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Dispatch custom event for view-specific initialization
        window.dispatchEvent(new CustomEvent('viewChanged', { detail: { view: viewName } }));
    }
};
