/**
 * Main entry point
 * Initializes the application and sets up the initial screen
 */

const SCREEN_ORDER = {
    "boot-screen": { init: boot },
    "login-screen": { init: login },
    "home-screen-guest": { init: guest, enter: guest }
};

window.addEventListener('load', () => {
    let startScreenId = "home-screen-guest";
    if (!document.getElementById(startScreenId)) startScreenId = "boot-screen";

    navigate(startScreenId, true);

    const fadingElement = document.querySelector('.fade-in');
    if (fadingElement) {
        fadingElement.classList.add('show');
    }

    setTimeout(() => {
        if (document.getElementById('home-screen-guest') && !document.getElementById('home-screen-guest').classList.contains('hidden')) {
            initNotesApp();
        }
    }, 500);
});
