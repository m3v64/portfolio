function boot() {
    const logLines = [
        { text: "[nix-shell:~]$ bootctl", type: "command" },
        { text: "[ OK ] Boot sequence initialized..." },
        { text: "[0.000001] macOS Subsystem for Linux v26.4 build 521", type: "delay" },
        { text: "[0.000312] Kernel: Darwin-x64 hybrid core detected", type: "delay" },
        { text: "[0.000913] Mounting volumes...", type: "delay" },
        { text: "[0.002101] /mnt/macroot mounted as extHFS+", type: "delay" },
        { text: "[0.002559] /dev/sda1 → /Volumes/LINUX_SYS", type: "delay" },
        { text: "[ OK ] Filesystem check complete" },
        { text: "[WARN ] Network adapter eno not responding, retrying..." },
        { text: "[ OK ] Connected: 195.169.153.147" },
        { text: "[INFO] User profile loaded: m3v" },
        { text: "[0.004833] Initializing GUI subsystem...", type: "delay" },
        { text: "[0.005012] Launching Aqua compositor (compat mode)", type: "delay" },
        { text: "[ OK ] Display environment: pseudo-X11 mode" },
        { text: "[0.006204] Injecting Apple frameworks into Linux runtime", type: "delay" },
        { text: "[INFO] Starting shell instance for guest@m3v.terminal" },
        { text: "[ OK ] Environment variables loaded (PATH, SHELL)" },
        { text: "[guest@m3v.terminal:~]$ uname -a", type: "command" },
        { text: "subsystem m3v.local 26.4.52-applelinux" },
        { text: "[guest@m3v.terminal:~]$ whoami", type: "command" },
        { text: "guest" },
        { text: "[guest@m3v.terminal:~]$ echo \"Welcome to macOS Subsystem for Linux\"", type: "command" },
        { text: "Welcome to macOS Subsystem for Linux" },
        { text: "[guest@m3v.terminal:~]$ ", type: "typing" }
    ];

    const screen = document.getElementById("boot-screen");

    function printLine(line) {
        const tty = screen.getElementById("tty");
        return new Promise(resolve => {
            let modifier = line.type;
            switch(modifier) {
                case "command":
                    let div = document.createElement("div");
                    screen.appendChild(div);
                    let i = 0;
                    function typeCommandAnimetion() {
                        if (i < line.text.length) {
                            div.textContent += line.text[i];
                            i++;
                            setTimeout(typeCommandAnimetion, 35);
                        } else {
                            resolve();
                        }
                    }
                    typeCommandAnimetion();
                    break;
                case "delay":
                    break;
                case "typing":
                    function dotDotDot() {
                        
                    }
                    dotDotDot();
                    break;
                default:
                    tty.innerHTML += line.text + "\n";
                    break;
            }
        });
    }

    async function startBoot() {
        screen.appendChild(tty);

        for (let line of logLines) {
            await printLine(line);
            await new Promise(r => setTimeout(r, 150));
        }
    }
    startBoot();
}

document.addEventListener("DOMContentLoaded", boot);