/**
 * Main entry point
 * Initializes the application and sets up the initial screen
 */

// Screen order configuration
// This must be defined after all screen modules are loaded
const SCREEN_ORDER = {
    "boot-screen": { init: boot },
    "login-screen": { init: login },
    "home-screen-guest": { init: guest, enter: guest }
};

window.addEventListener('load', () => {
    // Default to boot screen, but can be overridden for development/testing
    // Set to "home-screen-guest" to skip boot sequence during development
    let startScreenId = "boot-screen";
    if (!document.getElementById(startScreenId)) startScreenId = "home-screen-guest";

    navigate(startScreenId, true);

    const fadingElement = document.querySelector('.fade-in');
    if (fadingElement) {
        fadingElement.classList.add('show');
    }

    // Initialize notes app when on guest screen
    setTimeout(() => {
        if (document.getElementById('home-screen-guest') && !document.getElementById('home-screen-guest').classList.contains('hidden')) {
            initNotesApp();
        }
    }, 500);
});
