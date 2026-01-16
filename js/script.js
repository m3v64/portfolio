function boot() {
    const logLines = [
        { text: "[nix-shell:~]$ ", type: "command", type2: "delay", command: "bootctl" },
        { text: "[ OK ] Boot sequence initialized...", type: "nextDelay" },
        { text: "[0.000001] macOS Subsystem for Linux v26.4 build 521", type: "nextDelay" },
        { text: "[0.000312] Kernel: Darwin-x64 hybrid core detected", type: "nextDelay" },
        { text: "[0.000913] Mounting volumes...", type: "nextDelay" },
        { text: "[0.002101] /mnt/macroot mounted as extHFS+", type: "nextDelay" },
        { text: "[0.002559] /dev/sda1 → /Volumes/LINUX_SYS" },
        { text: "[ OK ] Filesystem check complete" },
        { text: "[WARN ] Network adapter eno not responding, retrying..." },
        { text: "[ OK ] Connected: 195.169.153.147" },
        { text: "[INFO] User profile loaded: m3v", type: "nextDelay" },
        { text: "[0.004833] Initializing GUI subsystem...", type: "nextDelay" },
        { text: "[0.005012] Launching Aqua compositor (compat mode)" },
        { text: "[ OK ] Display environment: pseudo-X11 mode", type: "nextDelay" },
        { text: "[0.006204] Injecting Apple frameworks into Linux runtime" },
        { text: "[INFO] Starting shell instance for guest@m3v.terminal" },
        { text: "[ OK ] Environment variables loaded (PATH, SHELL)" },
        { text: "[guest@m3v.terminal:~]$ ", type: "command", command: "uname -a" },
        { text: ("Subsystem m3v.local.guest 26.4.52-applelinux " + formatDate() + " x86_64 GNU/Apple/Linux") },
        { text: "[guest@m3v.terminal:~]$ ", type: "command", command: "whoami" },
        { text: "guest" },
        { text: "[guest@m3v.terminal:~]$ ", type: "command", type2: "fastType", command: "echo Welcome to macOS Subsystem for Linux" },
        { text: "Welcome to macOS Subsystem for Linux" },
        { text: "[guest@m3v.terminal:~]$ ", type: "blink" }
    ];

    function printLine(line) {
        const tty = document.getElementById("tty");
        let lineDiv = document.createElement("div");
        lineDiv.className = "logs";
        tty.appendChild(lineDiv);
        return new Promise(resolve => {
            let modifier = line.type;
            switch(modifier) {
                case "command":
                    lineDiv.textContent = line.text;
                    let i = 0;
                    function typingEffect() {
                        if (i < line.command.length) {
                            lineDiv.textContent += line.command[i];
                            i++;
                            let random;
                            if (line.type2 === "fastType") random = Math.floor(Math.random() * 21) + 10;
                            else random = Math.floor(Math.random() * 61) + 30;
                            setTimeout(typingEffect, random);
                        } else if (line.type2 === "delay") {
                            let random = Math.floor(Math.random() * 241) + 120;
                            setTimeout(resolve, random);
                        } else {
                            resolve();
                        }
                    }
                    typingEffect();
                    break;
                case "nextDelay":
                    lineDiv.textContent = line.text;
                    let random = Math.floor(Math.random() * 281) + 140;
                    setTimeout(resolve, random);
                    break;
                default:
                    lineDiv.textContent = line.text;
                    resolve();
                    break;
            }
        });
    }

    function formatDate() {
        const d = new Date();

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const dayName = days[d.getUTCDay()];
        const monthName = months[d.getUTCMonth()];
        const day = d.getUTCDate().toString().padStart(2, "0");

        const hours = d.getUTCHours().toString().padStart(2, "0");
        const minutes = d.getUTCMinutes().toString().padStart(2, "0");
        const seconds = d.getUTCSeconds().toString().padStart(2, "0");

        const year = d.getUTCFullYear();

        return `${dayName} ${monthName} ${day} ${hours}:${minutes}:${seconds} UTC ${year}`;
    }

    async function startBoot() {
        for (let line of logLines) {
            await printLine(line);
            await new Promise(r => setTimeout(r, 150));
        }
        navigate("login-screen", true, 800);
    }
    startBoot();
}

const SCREEN_ORDER = {
    "boot-screen": { init: boot },
    "login-screen": { init: login },
    "home-screen-guest": { init: guest, enter: guest }
};

const displayedScreens = new Set();

function runScreenOrder(screenId) {
    const order = SCREEN_ORDER[screenId];
    if (!order) return;

    if (typeof order.init === "function" && !displayedScreens.has(screenId)) {
        displayedScreens.add(screenId);
        order.init();
    }

    if (typeof order.enter === "function") {
        order.enter();
    }
}

function navigate(screenId, fade = true, delay = 300) {
    showScreen(screenId, fade, delay);
}

function login() {
    const guestButton = document.getElementById("guest-button");
    if (guestButton) {
        guestButton.addEventListener("click", () => {
            navigate("home-screen-guest", true);
        });
    }

    const adminButton = document.getElementById("admin-button");
    if (adminButton) {
        adminButton.addEventListener("click", () => {
            adminForm();
        });
    }

    const closeButton = document.getElementById("button-close");
    if (closeButton) {
        closeButton.addEventListener("click", () => {
            adminForm();
        });
    }

    function adminForm() {
        const adminLogin = document.getElementById("admin-login");
        const userSelector = document.querySelector(".login-user-selector");
        const transitionTime = 420;

        const isHidden = adminLogin.style.display === 'none' || adminLogin.classList.contains('hide');

        if (isHidden) {
            adminLogin.removeAttribute('inert');
            adminLogin.classList.remove('hide');
            adminLogin.classList.add('show');

            if (userSelector) {
                userSelector.style.transition = 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease-in-out';
                userSelector.style.transform = 'translateY(2vh)';
                userSelector.style.opacity = '0.6';
            }
        } else {
            adminLogin.classList.remove('show');
            adminLogin.classList.add('hide');

            if (userSelector) {
                userSelector.style.transform = 'translateY(-2vh)';
                userSelector.style.opacity = '1';
            }

            adminLogin.setAttribute('inert', '');
        }
    }

    function startClock() {
        const templateCache = {};
        const currentDigits = {};

        for (let i = 0; i <= 10; i++) {
            const template = document.getElementById(`svg-digit-${i}`);
            if (!template) return;
            templateCache[i] = template.content.cloneNode(true);
        }

        function setDigit(id, digit) {
            if (currentDigits[id] === digit) return;
            
            const el = document.getElementById(id);
            el.innerHTML = '';
            el.appendChild(templateCache[digit].cloneNode(true));
            el.style.setProperty('--digit-mask', `url('../../assets/svg/Vector-${digit}.svg')`);
            currentDigits[id] = digit;
        }

        function update() {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, "0");
            const m = String(now.getMinutes()).padStart(2, "0");

            setDigit("h1", h[0]);
            setDigit("h2", h[1]);
            setDigit("colon", "10");
            setDigit("m1", m[0]);
            setDigit("m2", m[1]);
        }
        
        update();
        setInterval(update, 1000);
    }
    startClock();
}

function showScreen(screenId, fade, delay = 300) {
    const screens = document.querySelectorAll('.screen');
    const target = document.getElementById(screenId);

    if (fade && target) {
        target.classList.remove('hidden');
        target.removeAttribute('inert');
        if (target.classList.contains('fade-in')) {
            void target.offsetWidth;
            target.classList.add('show');
        } else if (target.classList.contains('fade-out')) {
            void target.offsetWidth;
            target.classList.add('hide');
        }

        const current = document.querySelector('.screen:not(.hidden)');
        if (current && current.id !== screenId) {
            current.classList.add('fade-out', 'hide');
        }
    }

    setTimeout(() => {
        screens.forEach(s => {
            if (s.id === screenId) {
                s.classList.remove('hidden');
                s.removeAttribute('inert');
                if (s.classList.contains('fade-in')) {
                    void s.offsetWidth;
                    s.classList.add('show');
                } else if (s.classList.contains('fade-out')) {
                    void s.offsetWidth;
                    s.classList.add('hide');
                }
            } else {
                if (s.classList.contains('fade-out')) {
                    s.classList.add('hide');
                    setTimeout(() => {
                        s.classList.add('hidden');
                        s.setAttribute('inert', '');
                        s.classList.remove('show', 'hide', 'fade-out');
                    }, 900);
                } else {
                    s.classList.add('hidden');
                    s.setAttribute('inert', '');
                    s.classList.remove('show', 'hide');
                }
            }
        });

        runScreenOrder(screenId);
    }, delay);
}

function initDivSlider(trackEl, { onInput, initialValue, storageKey } = {}) {
    if (!trackEl) return null;

    const thumbEl = trackEl.querySelector(".volume-slider-selector, .brightness-slider-selector");
    if (!thumbEl) return null;

    const min = Number.parseFloat(trackEl.dataset.min ?? "0") || 0;
    const max = Number.parseFloat(trackEl.dataset.max ?? "1") || 1;
    const stepRaw = Number.parseFloat(trackEl.dataset.step ?? "0.01");
    const step = Number.isFinite(stepRaw) && stepRaw > 0 ? stepRaw : 0.01;

    const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
    const snap = (n) => Math.round(n / step) * step;

    function readStoredValue() {
        if (!storageKey) return null;
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw == null) return null;
            const n = Number.parseFloat(raw);
            return Number.isFinite(n) ? n : null;
        } catch {
            return null;
        }
    }

    const stored = readStoredValue();
    const starting = Number.isFinite(initialValue)
        ? initialValue
        : (stored ?? Number.parseFloat(trackEl.dataset.value ?? "0.4"));

    let currentValue = clamp(starting, min, max);
    if (!Number.isFinite(currentValue)) currentValue = clamp(0.4, min, max);

    let dragging = false;
    let activePointerId = null;
    let hasMoved = false;

    const rootEl = document.documentElement;
    let prevRootCursor = "";

    function setDraggingCursor(isDragging) {
        if (isDragging) {
            prevRootCursor = rootEl.style.cursor;
            rootEl.style.cursor = "grabbing";
            thumbEl.style.cursor = "grabbing";
        } else {
            rootEl.style.cursor = prevRootCursor;
            thumbEl.style.cursor = "grab";
        }
    }

    function setValue(nextValue, { emit = true } = {}) {
        const v = clamp(snap(nextValue), min, max);
        currentValue = v;
        trackEl.dataset.value = String(v);

        if (storageKey) {
            try {
                localStorage.setItem(storageKey, String(v));
            } catch {
                console.log("was not able to save local storage variables");
            }
        }

        const percent = max === min ? 0 : ((v - min) / (max - min)) * 100;
        trackEl.style.setProperty("--value-percent", String(percent));

        trackEl.setAttribute("aria-valuemin", String(min));
        trackEl.setAttribute("aria-valuemax", String(max));
        trackEl.setAttribute("aria-valuenow", String(v));
        trackEl.setAttribute("aria-valuetext", `${Math.round(percent)}%`);

        if (emit && typeof onInput === "function") onInput(v);
    }

    function valueFromClientX(clientX) {
        const rect = trackEl.getBoundingClientRect();
        const x = clamp(clientX - rect.left, 0, rect.width);
        const t = rect.width === 0 ? 0 : x / rect.width;
        return min + t * (max - min);
    }

    thumbEl.addEventListener("pointerdown", (e) => {
        dragging = true;
        hasMoved = false;
        activePointerId = e.pointerId;
        thumbEl.setPointerCapture?.(e.pointerId);
        setDraggingCursor(true);
        e.preventDefault();
    });

    thumbEl.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        if (activePointerId !== null && e.pointerId !== activePointerId) return;

        hasMoved = true;
        setValue(valueFromClientX(e.clientX));
    });

    function endDrag(e) {
        if (activePointerId !== null && e?.pointerId !== undefined && e.pointerId !== activePointerId) return;
        dragging = false;
        activePointerId = null;

        setDraggingCursor(false);
    }

    thumbEl.addEventListener("pointerup", endDrag);
    thumbEl.addEventListener("pointercancel", endDrag);

    window.addEventListener("blur", () => {
        if (!dragging) return;
        dragging = false;
        activePointerId = null;
        setDraggingCursor(false);
    });

    setValue(currentValue, { emit: false });

    return {
        get value() {
            return currentValue;
        },
        setValue
    };
}

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

// Notes App Functionality
function initNotesApp() {
    const STORAGE_KEY = 'portfolio.notes';
    let notes = [];
    let currentNoteId = null;

    // Load notes from localStorage
    function loadNotes() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            notes = stored ? JSON.parse(stored) : [];
            if (notes.length === 0) {
                // Create default welcome note
                notes.push({
                    id: Date.now(),
                    title: 'Welcome to Notes',
                    content: '# Welcome to Notes\n\nThis is a dynamic markdown note-taking app.\n\n## Features\n- **Bold** and *italic* text\n- [Links](https://example.com)\n- Images\n- Headers (H1-H6)\n\nStart editing to see the live preview!',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                });
                saveNotes();
            }
        } catch (e) {
            console.error('Error loading notes:', e);
            notes = [];
        }
    }

    // Save notes to localStorage
    function saveNotes() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        } catch (e) {
            console.error('Error saving notes:', e);
        }
    }

    // Get note title from content (first line or first 50 chars)
    function getNoteTitle(content) {
        if (!content) return 'Untitled Note';
        const firstLine = content.split('\n')[0];
        let title = firstLine.replace(/^#+ /, '').trim();
        if (!title) {
            title = content.substring(0, 50).trim();
        }
        return title || 'Untitled Note';
    }

    // Render markdown to HTML
    function renderMarkdown(markdown) {
        try {
            const html = marked.parse(markdown || '');
            return DOMPurify.sanitize(html);
        } catch (e) {
            console.error('Error rendering markdown:', e);
            return '<p>Error rendering markdown</p>';
        }
    }

    // Render notes list in explorer
    function renderNotesList() {
        const explorer = document.querySelector('.notes-explorer');
        if (!explorer) return;

        explorer.innerHTML = '';
        
        notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item glass';
            noteItem.textContent = note.title;
            noteItem.dataset.noteId = note.id;
            
            if (note.id === currentNoteId) {
                noteItem.classList.add('active');
            }
            
            noteItem.addEventListener('click', () => {
                loadNote(note.id);
            });
            
            explorer.appendChild(noteItem);
        });
    }

    // Load and display a note
    function loadNote(noteId) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        currentNoteId = noteId;
        
        const noteInput = document.querySelector('.note-input');
        const notePreview = document.querySelector('.note-preview');
        const semiDivider = document.querySelector('.semi-devider-y');
        
        if (!noteInput || !notePreview) return;

        // Show editor and preview
        noteInput.style.display = 'block';
        noteInput.removeAttribute('inert');
        semiDivider.style.display = 'block';
        semiDivider.removeAttribute('inert');
        
        // Create or get textarea
        let textarea = noteInput.querySelector('textarea');
        if (!textarea) {
            textarea = document.createElement('textarea');
            textarea.className = 'note-textarea';
            textarea.placeholder = 'Start typing your note in markdown...';
            noteInput.appendChild(textarea);
        }
        
        textarea.value = note.content;
        notePreview.innerHTML = renderMarkdown(note.content);
        
        renderNotesList();
        
        // Update preview on input
        textarea.removeEventListener('input', handleTextareaInput);
        textarea.addEventListener('input', handleTextareaInput);
    }

    // Handle textarea input
    function handleTextareaInput(e) {
        const textarea = e.target;
        const content = textarea.value;
        
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            note.content = content;
            note.title = getNoteTitle(content);
            note.modified = new Date().toISOString();
            saveNotes();
            
            const notePreview = document.querySelector('.note-preview');
            if (notePreview) {
                notePreview.innerHTML = renderMarkdown(content);
            }
            
            renderNotesList();
        }
    }

    // Insert text at cursor position
    function insertAtCursor(textarea, before, after = '') {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        
        const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
        textarea.value = newText;
        
        // Set cursor position
        const newCursorPos = start + before.length + selectedText.length + after.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
        
        // Trigger input event
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Create new note
    function createNewNote() {
        const newNote = {
            id: Date.now(),
            title: 'New Note',
            content: '# New Note\n\nStart writing...',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        
        notes.unshift(newNote);
        saveNotes();
        renderNotesList();
        loadNote(newNote.id);
    }

    // Setup UI controls
    function setupControls() {
        // New note button
        const newNoteBtn = document.querySelector('.new-notes-option');
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', createNewNote);
        }

        // Text formatting controls
        const textOptions = document.querySelector('.notes-text-options');
        if (textOptions) {
            const buttons = textOptions.querySelectorAll('img');
            
            // Text/Header dropdown button
            if (buttons[0]) {
                buttons[0].addEventListener('click', (e) => {
                    showHeaderDropdown(e.target);
                });
            }
            
            // Image button
            if (buttons[1]) {
                buttons[1].addEventListener('click', (e) => {
                    showImageDropdown(e.target);
                });
            }
            
            // Link button
            if (buttons[2]) {
                buttons[2].addEventListener('click', (e) => {
                    showLinkDropdown(e.target);
                });
            }
            
            // Share button (not implemented yet)
            if (buttons[3]) {
                buttons[3].addEventListener('click', () => {
                    alert('Share functionality coming soon!');
                });
            }
        }

        // Window controls
        const minimizeBtn = document.querySelector('.window-option-minimize');
        const maximizeBtn = document.querySelector('.window-option-maximize');
        const closeBtn = document.querySelector('.window-option-close');
        const notesWindow = document.querySelector('.notes-window');
        
        if (closeBtn && notesWindow) {
            closeBtn.addEventListener('click', () => {
                notesWindow.style.display = 'none';
            });
        }
        
        // Taskbar icon to show notes
        const notesIcon = document.querySelector('.taskbar-icon-1');
        if (notesIcon && notesWindow) {
            notesIcon.addEventListener('click', () => {
                notesWindow.style.display = notesWindow.style.display === 'none' ? 'flex' : 'none';
            });
        }
    }

    // Show header dropdown
    function showHeaderDropdown(button) {
        const textarea = document.querySelector('.note-textarea');
        if (!textarea) return;

        const dropdown = createDropdown([
            { label: 'Heading 1', action: () => insertAtCursor(textarea, '# ', '') },
            { label: 'Heading 2', action: () => insertAtCursor(textarea, '## ', '') },
            { label: 'Heading 3', action: () => insertAtCursor(textarea, '### ', '') },
            { label: 'Heading 4', action: () => insertAtCursor(textarea, '#### ', '') },
            { label: 'Heading 5', action: () => insertAtCursor(textarea, '##### ', '') },
            { label: 'Heading 6', action: () => insertAtCursor(textarea, '###### ', '') },
            { label: 'Bold', action: () => insertAtCursor(textarea, '**', '**') },
            { label: 'Italic', action: () => insertAtCursor(textarea, '*', '*') }
        ]);

        showDropdownAtElement(dropdown, button);
    }

    // Show link dropdown
    function showLinkDropdown(button) {
        const textarea = document.querySelector('.note-textarea');
        if (!textarea) return;

        const dropdown = createInputDropdown(
            'Insert Link',
            [
                { label: 'Text', placeholder: 'Link text', id: 'link-text' },
                { label: 'URL', placeholder: 'https://example.com', id: 'link-url' }
            ],
            (values) => {
                const text = values['link-text'] || 'link';
                const url = values['link-url'] || 'https://';
                insertAtCursor(textarea, `[${text}](${url})`, '');
            }
        );

        showDropdownAtElement(dropdown, button);
    }

    // Show image dropdown
    function showImageDropdown(button) {
        const textarea = document.querySelector('.note-textarea');
        if (!textarea) return;

        const dropdown = createInputDropdown(
            'Insert Image',
            [
                { label: 'Alt Text', placeholder: 'Image description', id: 'img-alt' },
                { label: 'URL', placeholder: 'https://example.com/image.jpg', id: 'img-url' }
            ],
            (values) => {
                const alt = values['img-alt'] || 'image';
                const url = values['img-url'] || 'https://';
                insertAtCursor(textarea, `![${alt}](${url})`, '');
            }
        );

        showDropdownAtElement(dropdown, button);
    }

    // Create dropdown menu
    function createDropdown(items) {
        const dropdown = document.createElement('div');
        dropdown.className = 'notes-dropdown glass';
        
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'notes-dropdown-item';
            menuItem.textContent = item.label;
            menuItem.addEventListener('click', () => {
                item.action();
                dropdown.remove();
            });
            dropdown.appendChild(menuItem);
        });
        
        return dropdown;
    }

    // Create input dropdown
    function createInputDropdown(title, inputs, onSubmit) {
        const dropdown = document.createElement('div');
        dropdown.className = 'notes-dropdown glass notes-dropdown-form';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'notes-dropdown-title';
        titleEl.textContent = title;
        dropdown.appendChild(titleEl);
        
        const values = {};
        
        inputs.forEach(input => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'notes-dropdown-input-group';
            
            const label = document.createElement('label');
            label.textContent = input.label;
            label.className = 'notes-dropdown-label';
            inputGroup.appendChild(label);
            
            const inputEl = document.createElement('input');
            inputEl.type = 'text';
            inputEl.placeholder = input.placeholder;
            inputEl.className = 'notes-dropdown-input';
            inputEl.id = input.id;
            inputGroup.appendChild(inputEl);
            
            dropdown.appendChild(inputGroup);
        });
        
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Insert';
        submitBtn.className = 'notes-dropdown-submit';
        submitBtn.addEventListener('click', () => {
            inputs.forEach(input => {
                const inputEl = dropdown.querySelector(`#${input.id}`);
                values[input.id] = inputEl.value;
            });
            onSubmit(values);
            dropdown.remove();
        });
        dropdown.appendChild(submitBtn);
        
        return dropdown;
    }

    // Show dropdown at element position
    function showDropdownAtElement(dropdown, element) {
        // Remove any existing dropdowns
        document.querySelectorAll('.notes-dropdown').forEach(d => d.remove());
        
        const rect = element.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.zIndex = '1000';
        
        document.body.appendChild(dropdown);
        
        // Close on click outside
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!dropdown.contains(e.target) && e.target !== element) {
                    dropdown.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 10);
    }

    // Make divider draggable for resizing
    function setupResizableDivider() {
        const divider = document.querySelector('.semi-devider-y');
        const noteInput = document.querySelector('.note-input');
        const notePreview = document.querySelector('.note-preview');
        
        if (!divider || !noteInput || !notePreview) return;
        
        let isDragging = false;
        let startX = 0;
        let startInputWidth = 0;
        let startPreviewWidth = 0;
        
        divider.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startInputWidth = noteInput.offsetWidth;
            startPreviewWidth = notePreview.offsetWidth;
            
            // Prevent text selection while dragging
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const containerWidth = noteInput.parentElement.offsetWidth - divider.offsetWidth;
            
            // Calculate new widths
            const newInputWidth = startInputWidth + deltaX;
            const newPreviewWidth = startPreviewWidth - deltaX;
            
            // Set minimum widths (20% of container)
            const minWidth = containerWidth * 0.2;
            
            if (newInputWidth >= minWidth && newPreviewWidth >= minWidth) {
                const inputPercent = (newInputWidth / containerWidth) * 100;
                const previewPercent = (newPreviewWidth / containerWidth) * 100;
                
                noteInput.style.flex = `1 1 ${inputPercent}%`;
                notePreview.style.flex = `1 1 ${previewPercent}%`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            }
        });
    }

    // Initialize
    loadNotes();
    renderNotesList();
    if (notes.length > 0) {
        loadNote(notes[0].id);
    }
    setupControls();
    setupResizableDivider();
}

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