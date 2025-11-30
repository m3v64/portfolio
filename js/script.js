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
        function setDigit(id, digit) {
            const key = "svg-digit-" + digit;
            const templateElement = document.getElementById(key);
            const clockElement = document.getElementById(id);

            if (!clockElement) {
                console.warn(`setDigit: target element '${id}' not found`);
                return;
            }
            if (!templateElement) {
                console.warn(`setDigit: template '${key}' not found`);
                return;
            }

            clockElement.innerHTML = templateElement.innerHTML;
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

        setInterval(update, 1000);
        update();
    }
    startClock();
}

function showScreen(screenId, fade, delay) {
    delay = (typeof delay === 'number') ? delay : 300;

    const screens = Array.from(document.querySelectorAll('.screen'));
    const target = screenId ? document.getElementById(screenId) : null;

    if (fade) {
        if (target) {
            target.classList.remove('hidden');
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
                        s.classList.remove('show', 'hide', 'fade-out');
                    };

                    s.addEventListener('transitionend', cleanup, { once: true });

                    setTimeout(() => {
                        if (!s.classList.contains('hidden')) cleanup();
                    }, 900);
                } else {
                    s.classList.add('hidden');
                    s.classList.remove('show', 'hide');
                }
            }
        });
    }, delay);
}

window.addEventListener('load', () => {
    showScreen("boot-screen", true, 300);

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