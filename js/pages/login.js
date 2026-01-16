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
