/**
 * Guest screen functionality
 * Handles the guest home screen including control center, sliders, and navigation bar
 */

function guest() {
    if (!guest._state) {
        guest._state = {
            timersStarted: false,
            timeIntervalId: null,
            dateIntervalId: null,
            slidersInit: false,
            volumeSlider: null,
            brightnessSlider: null,
            volumeValue: null,
            brightnessValue: null,
            controlCenterExpanded: false,
            controlCenterListenerBound: false,
            controlCenterAnimating: false,
            controlCenterInitialApplied: false,
            notesInitialized: false
        };
    }

    const controlCenterButton = document.querySelector(".nav-control-center-settings");

    const prefersReducedMotion = (() => {
        try {
            return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
        } catch {
            return false;
        }
    })();

    function getControlCenterGroupEls() {
        return [
            document.querySelector(".control-center-group-1"),
            document.querySelector(".control-center-group-2"),
            document.querySelector(".control-center-group-3"),
            document.querySelector(".control-center-group-4")
        ].filter(Boolean);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function tilesForGroup(groupEl) {
        return Array.from(groupEl.children);
    }

    async function collapseGroup(groupEl, { duration = 160 } = {}) {
        const tiles = tilesForGroup(groupEl);
        if (tiles.length === 0) {
            groupEl.style.display = "none";
            return;
        }

        if (prefersReducedMotion) {
            groupEl.style.display = "none";
            return;
        }

        const animations = tiles.map(tile => {
            try {
                return tile.animate(
                    [
                        { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0px)" },
                        { opacity: 0, transform: "translateY(-6px) scale(0.98)", filter: "blur(2px)" }
                    ],
                    { duration, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" }
                );
            } catch {
                return null;
            }
        }).filter(Boolean);

        await Promise.allSettled(animations.map(a => a.finished));
        groupEl.style.display = "none";
        animations.forEach(a => {
            try { a.cancel(); } catch {}
        });
    }

    async function expandGroup(groupEl, { duration = 190 } = {}) {
        groupEl.style.display = "";

        const tiles = tilesForGroup(groupEl);
        if (tiles.length === 0) return;

        if (prefersReducedMotion) return;

        tiles.forEach(tile => {
            tile.style.opacity = "0";
            tile.style.transform = "translateY(-6px) scale(0.98)";
            tile.style.filter = "blur(2px)";
        });

        const animations = tiles.map(tile => {
            try {
                return tile.animate(
                    [
                        { opacity: 0, transform: "translateY(-6px) scale(0.98)", filter: "blur(2px)" },
                        { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0px)" }
                    ],
                    { duration, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" }
                );
            } catch {
                return null;
            }
        }).filter(Boolean);

        await Promise.allSettled(animations.map(a => a.finished));

        tiles.forEach(tile => {
            tile.style.opacity = "";
            tile.style.transform = "";
            tile.style.filter = "";
        });
        animations.forEach(a => {
            try { a.cancel(); } catch {}
        });
    }

    async function setControlCenterExpanded(isExpanded) {
        if (guest._state.controlCenterAnimating) return;
        guest._state.controlCenterAnimating = true;

        const groups = getControlCenterGroupEls();

        try {
            if (isExpanded) {
                for (const groupEl of groups) {
                    await expandGroup(groupEl);
                    await sleep(55);
                }
            } else {
                for (const groupEl of groups.slice().reverse()) {
                    await collapseGroup(groupEl);
                    await sleep(55);
                }
            }

            guest._state.controlCenterExpanded = isExpanded;
        } finally {
            guest._state.controlCenterAnimating = false;
        }
    }

    if (!guest._state.controlCenterInitialApplied) {
        guest._state.controlCenterInitialApplied = true;
        const groups = getControlCenterGroupEls();
        groups.forEach(groupEl => {
            groupEl.style.display = "none";
        });
        guest._state.controlCenterExpanded = false;
    }

    if (controlCenterButton && !guest._state.controlCenterListenerBound) {
        guest._state.controlCenterListenerBound = true;
        controlCenterButton.addEventListener("click", () => {
            setControlCenterExpanded(!guest._state.controlCenterExpanded);
        });
    }

    var serverState = 3;
    const battery = document.getElementById("nav-battery");
    const date = document.getElementById("nav-date");
    const time = document.getElementById("nav-time");

    if (!battery || !date || !time) { return; }
    switch (serverState) {
        case 3:
            battery.innerHTML = '<img draggable="false" src="assets/svg/battery-full.svg" alt="battery-full">';
            break;
        case 2:
            battery.innerHTML = '<img draggable="false" src="assets/svg/battery-medium.svg" alt="battery-medium">';
            break;
        case 1:
            battery.innerHTML = '<img draggable="false" src="assets/svg/battery-empty.svg" alt="battery-empty">';
            break;
        default:
            battery.innerHTML = '<img draggable="false" src="assets/svg/battery-full.svg" alt="battery-full">';
            break;
    }
    
    function formatShortDate(date = new Date()) {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const dayName = days[date.getDay()];
        const day = date.getDate();
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();

        return `${dayName} ${day} ${monthName} ${year}`;
    }

    function updateDate() {
        var shortDate = formatShortDate();
        date.innerHTML = `${shortDate}`;
    }

    function updateTime() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        time.innerHTML = `${h}:${m}`;
    }

    updateTime();
    updateDate();

    if (!guest._state.slidersInit) {
        const volumeSliderEl = document.querySelector(".volume-slider");
        guest._state.volumeSlider = initDivSlider(volumeSliderEl, {
            storageKey: "portfolio.slider.volume",
            initialValue: guest._state.volumeValue,
            onInput: (v) => {
                guest._state.volumeValue = v;
                // gotta add the logic to play music
            }
        });

        const brightnessSliderEl = document.querySelector(".brightness-slider");
        guest._state.brightnessSlider = initDivSlider(brightnessSliderEl, {
            storageKey: "portfolio.slider.brightness",
            initialValue: guest._state.brightnessValue,
            onInput: (v) => {
                guest._state.brightnessValue = v;
                // another thingy i gotta do
            }
        });

        guest._state.slidersInit = true;
    }

    if (!guest._state.timersStarted) {
        guest._state.timersStarted = true;
        guest._state.timeIntervalId = setInterval(updateTime, 1000);
        guest._state.dateIntervalId = setInterval(updateDate, 60000);
    }

    // Initialize notes app if not already initialized
    if (!guest._state.notesInitialized) {
        guest._state.notesInitialized = false; // Will be set to true by initNotesApp
        setTimeout(() => {
            if (!guest._state.notesInitialized) {
                initNotesApp();
                guest._state.notesInitialized = true;
            }
        }, 100);
    }
}
