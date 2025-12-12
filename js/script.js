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
        login();
    }
    startBoot();
}

function login() {
    showScreen("login-screen", true, 800);

    async function startClock() {
        const templateCache = {};
        let currentDigits = { h1: null, h2: null, m1: null, m2: null, colon: null };

        for (let i = 0; i <= 10; i++) {
            const templateElement = document.getElementById(`svg-digit-${i}`);
            if (templateElement && templateElement.content) {
                templateCache[i] = templateElement.content.cloneNode(true);
            } else if (templateElement) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = templateElement.innerHTML;
                templateCache[i] = wrapper.firstElementChild;
            }
        }

        function setDigit(id, digit) {
            if (currentDigits[id] === digit) return;
            
            const clockElement = document.getElementById(id);
            if (!clockElement) {
                console.warn(`setDigit: target element '${id}' not found`);
                return;
            }

            const template = templateCache[digit];
            if (!template) {
                console.warn(`setDigit: template for digit '${digit}' not found in cache`);
                return;
            }

            requestAnimationFrame(() => {
                clockElement.innerHTML = '';
                const clone = template.cloneNode ? template.cloneNode(true) : template;
                if (clone instanceof DocumentFragment) {
                    clockElement.appendChild(clone);
                } else {
                    clockElement.appendChild(clone.cloneNode(true));
                }
                
                const svgPath = `url('../assets/svg/Vector-${digit}.svg')`;
                clockElement.style.setProperty('--digit-mask', svgPath);
                
                const img = clockElement.querySelector('img');
                if (img) {
                    if (img.complete && img.naturalWidth) {
                        clockElement.style.setProperty('--digit-aspect', img.naturalWidth / img.naturalHeight);
                    } else {
                        img.onload = () => {
                            clockElement.style.setProperty('--digit-aspect', img.naturalWidth / img.naturalHeight);
                        };
                    }
                }
                
                currentDigits[id] = digit;
            });
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
        
        const now = new Date();
        const msUntilNextSecond = 1000 - now.getMilliseconds();
        
        setTimeout(() => {
            update();
            setInterval(update, 1000);
        }, msUntilNextSecond);
    }
    startClock();
}

function showScreen(screenId, fade, delay) {
    delay = (typeof delay === 'number') ? delay : 300;

    function setInert(el, set) {
        if (!el) return;
        if (set) el.setAttribute('inert', "");
        else el.removeAttribute('inert');
    }

    const screens = Array.from(document.querySelectorAll('.screen'));
    const target = screenId ? document.getElementById(screenId) : null;

    if (fade) {
        if (target) {
            target.classList.remove('hidden');
            setInert(target, false);
            if (target.classList.contains('fade-in')) {
                void target.offsetWidth;
                target.classList.add('show');
            } else if (target.classList.contains('fade-out')) {
                void target.offsetWidth;
                target.classList.add('hide');
            }
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
                setInert(s, false);
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

                    const cleanup = (e) => {
                        if (e && e.propertyName && e.propertyName !== 'opacity') return;
                        s.removeEventListener('transitionend', cleanup);
                        s.classList.add('hidden');
                        setInert(s, true);
                        s.classList.remove('show', 'hide', 'fade-out');
                    };

                    s.addEventListener('transitionend', cleanup, { once: true });

                    setTimeout(() => {
                        if (!s.classList.contains('hidden')) cleanup();
                    }, 900);
                } else {
                    s.classList.add('hidden');
                    setInert(s, true);
                    s.classList.remove('show', 'hide');
                }
            }
        });
    }, delay);
}

window.addEventListener('load', () => {
    showScreen("boot-screen", true);

    const fadingElement = document.querySelector('.fade-in');
    if (fadingElement) {
        void fadingElement.offsetWidth;
        fadingElement.classList.add('show');

        const onFinished = (e) => {
            if (e.propertyName !== 'opacity') return;
            fadingElement.removeEventListener('transitionend', onFinished);
            setTimeout(boot, 300);
        };
        fadingElement.addEventListener('transitionend', onFinished);
    } else {
        setTimeout(boot, 300);
    }
});

document.getElementById("guest-button").addEventListener("click", () => {
    showScreen("home-screen-guest", true)
});

document.getElementById("admin-button").addEventListener("click", () => {
    const adminLogin = document.getElementById("admin-login");
    adminLogin.style.display = "block";
    adminLogin.removeAttribute("inert");

    setTimeout(() => {
        adminLogin.style.opacity = "1";
    }, 10);
    
    const userSelector = document.querySelector(".user-selector");
    userSelector.style.transform = "translateY(2vh)";
    userSelector.style.opacity = "0.6";
});