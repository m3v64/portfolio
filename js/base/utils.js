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

function makeDraggable(element, handle) {
    if (!element) return;
    if (!handle) handle = element;

    let isDragging = false;
    let activePointerId = null;
    let offsetX = 0;
    let offsetY = 0;
    let elementWidth = 0;
    let elementHeight = 0;

    const blockedTargetsSelector = 'button, input, textarea, img, select, a';

    function ensurePositioned() {
        const computed = window.getComputedStyle(element);
        if (computed.position !== 'fixed') element.style.position = 'fixed';
    }

    function initializePosition() {
        ensurePositioned();
        const rect = element.getBoundingClientRect();
        element.style.left = `${rect.left}px`;
        element.style.top = `${rect.top}px`;
        element.style.right = '';
        element.style.bottom = '';
        element.style.transform = 'none';
    }

    function clamp(n, min, max) {
        return Math.min(max, Math.max(min, n));
    }

    function setHandleCursor(cursor) {
        handle.style.cursor = cursor;
    }

    handle.style.touchAction = 'none';
    setHandleCursor('grab');

    handle.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target?.closest?.(blockedTargetsSelector)) return;

        initializePosition();

        const rect = element.getBoundingClientRect();
        elementWidth = rect.width;
        elementHeight = rect.height;

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        isDragging = true;
        activePointerId = e.pointerId;
        setHandleCursor('grabbing');

        handle.setPointerCapture?.(e.pointerId);
        e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        if (activePointerId !== null && e.pointerId !== activePointerId) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const minVisible = 50;

        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        newLeft = clamp(newLeft, -elementWidth + minVisible, viewportWidth - minVisible);
        newTop = clamp(newTop, 0, viewportHeight - minVisible);

        element.style.left = `${newLeft}px`;
        element.style.top = `${newTop}px`;
        e.preventDefault();
    });

    function endDrag(e) {
        if (!isDragging) return;
        if (activePointerId !== null && e?.pointerId !== undefined && e.pointerId !== activePointerId) return;
        isDragging = false;
        activePointerId = null;
        setHandleCursor('grab');
    }

    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
    window.addEventListener('blur', endDrag);
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
