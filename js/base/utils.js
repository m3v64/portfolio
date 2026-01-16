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

// Make element draggable by a handle
function makeDraggable(element, handle) {
    if (!element || !handle) return;
    
    let isDragging = false;
    let offsetX, offsetY;
    
    // Convert transform positioning to absolute positioning on first drag
    function initializePosition() {
        const rect = element.getBoundingClientRect();
        element.style.left = `${rect.left}px`;
        element.style.top = `${rect.top}px`;
        element.style.transform = 'none';
    }
    
    handle.addEventListener('mousedown', (e) => {
        // Don't drag if clicking on buttons, inputs, or other interactive elements
        if (e.target.closest('button, input, textarea, img, select, a')) {
            return;
        }
        
        // Initialize position if using transform
        if (element.style.transform !== 'none' && element.style.transform !== '') {
            initializePosition();
        }
        
        isDragging = true;
        
        // Calculate offset between mouse and element's top-left corner
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        handle.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        
        // Calculate new position maintaining the offset
        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;
        
        // Get element and viewport dimensions for boundary checking
        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Constrain to viewport boundaries
        // Keep at least 50px of the element visible on each edge
        const minVisible = 50;
        newLeft = Math.max(-rect.width + minVisible, Math.min(newLeft, viewportWidth - minVisible));
        newTop = Math.max(0, Math.min(newTop, viewportHeight - minVisible));
        
        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            handle.style.cursor = 'grab';
        }
    });
    
    // Set initial cursor
    handle.style.cursor = 'grab';
}

// Slider utility
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
