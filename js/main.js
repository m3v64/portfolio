const SCREEN_ORDER = {
    "boot-screen": { init: boot },
    "login-screen": { init: login },
    "home-screen-guest": { init: guest, enter: guest }
};

window.addEventListener('load', () => {
    let startScreenId = "boot-screen";
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
