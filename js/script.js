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

function initDivSlider(trackEl, { onInput } = {}) {
    if (!trackEl) return null;

    const thumbEl = trackEl.querySelector(".volume-slider-selector");
    if (!thumbEl) return null;

    const min = Number.parseFloat(trackEl.dataset.min ?? "0") || 0;
    const max = Number.parseFloat(trackEl.dataset.max ?? "1") || 1;
    const stepRaw = Number.parseFloat(trackEl.dataset.step ?? "0.01");
    const step = Number.isFinite(stepRaw) && stepRaw > 0 ? stepRaw : 0.01;

    const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
    const snap = (n) => Math.round(n / step) * step;

    let currentValue = clamp(
        Number.parseFloat(trackEl.dataset.value ?? "0.5"),
        min,
        max
    );
    if (!Number.isFinite(currentValue)) currentValue = 0.5;

    let dragging = false;
    let activePointerId = null;
    let hasMoved = false;

    function setValue(nextValue, { emit = true } = {}) {
        const v = clamp(snap(nextValue), min, max);
        currentValue = v;
        trackEl.dataset.value = String(v);

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
    }

    thumbEl.addEventListener("pointerup", endDrag);
    thumbEl.addEventListener("pointercancel", endDrag);

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
        guest._state = { timersStarted: false, timeIntervalId: null, dateIntervalId: null, volumeSliderInit: false };
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

    if (!guest._state.volumeSliderInit) {
        const sliderEl = document.querySelector(".volume-slider");
        initDivSlider(sliderEl, {
            onInput: (v) => {
                // gotta add the logic to play music
            }
        });
        guest._state.volumeSliderInit = true;
    }

    if (!guest._state.timersStarted) {
        guest._state.timersStarted = true;
        guest._state.timeIntervalId = setInterval(updateTime, 1000);
        guest._state.dateIntervalId = setInterval(updateDate, 60000);
    }
}

window.addEventListener('load', () => {
    let startScreenId = "home-screen-guest";
    if (!document.getElementById(startScreenId)) startScreenId = "boot-screen";

    navigate(startScreenId, true);

    const fadingElement = document.querySelector('.fade-in');
    if (fadingElement) {
        fadingElement.classList.add('show');
    }
});