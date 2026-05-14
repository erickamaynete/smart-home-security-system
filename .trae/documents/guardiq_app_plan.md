# Plan: GuardIQ Smart Home Security App Implementation

This plan outlines the steps to build the GuardIQ smart home security web app, following a modular vanilla JavaScript architecture.

## 1. Directory & File Structure Setup
- Create `css/`, `js/`, and `components/` directories.
- Initialize all required files as placeholders.

## 2. Base HTML & Global Styles
- **index.html**: Setup the layout shell, link Google Fonts (Outfit), and include CSS/JS entry points.
- **css/main.css**: Define CSS variables (colors, spacing), reset styles, and typography.
- **css/layout.css**: Implement the sidebar (fixed) and main content area responsive grid.

## 3. Global State & Navigation
- **js/state.js**: Implement a shared state object for `armed` status, `alertCount`, and `cameraStatuses`.
- **js/router.js**: Create logic to handle view switching by toggling `hidden` attributes on view containers.
- **js/app.js**: Handle component fetching and injection into the DOM.

## 4. UI Components (CSS & HTML)
- **css/components.css**: Style global UI elements: cards, buttons, toggles, badges, and sliders.
- **components/sidebar.html**: Build the navigation and user profile sidebar.
- **components/dashboard.html**: Create the main overview with stat cards and quick actions.
- **components/cameras.html**, **activity.html**, **alerts.html**, **settings.html**: Build the individual view markups.

## 5. View-Specific Logic
- **js/cameras.js**:
    - Implement live timestamp updates.
    - Create motion detection simulation (random 8-12s interval).
    - Add category filtering for the camera list.
- **js/alerts.js**:
    - Handle alert dismissal.
    - Update state and sidebar badges.
    - Implement the "All clear" empty state.
- **js/settings.js**:
    - Wire up toggles and sliders to the global state.
- **css/views.css**: Add specific styling for each view (e.g., camera grid, timeline list).

## 6. Refinement & Polish
- Ensure the "Sound Alarm" full-screen overlay works.
- Implement responsive design for mobile (bottom tab bar).
- Verify all state changes sync across different views (e.g., Armed toggle in sidebar vs. dashboard).

## 7. Final Verification
- Test all interactions: navigation, filtering, dismissing alerts, toggling state.
- Ensure the app runs correctly via a local HTTP server.
