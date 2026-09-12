(function () {

    const pwaScript = document.createElement("script");
    pwaScript.src = "pwa.js?v=3";
    pwaScript.defer = true;
    document.head.appendChild(pwaScript);

    const saved =
        localStorage.getItem("bpm-theme");

    function applyTheme(theme) {

        document.documentElement.classList.toggle(
            "light-theme",
            theme === "light"
        );

    }

    if (saved === "light" || saved === "dark") {

        applyTheme(saved);

    } else {

        applyTheme(
            window.matchMedia(
                "(prefers-color-scheme: light)"
            ).matches
                ? "light"
                : "dark"
        );

    }


    function addToggle() {

        const nav =
            document.querySelector(
                ".menubar nav"
            );

        if (
            !nav ||
            document.getElementById("themeToggle")
        ) {
            return;
        }


        const button =
            document.createElement("button");

        button.id = "themeToggle";
        button.className = "theme-toggle";
        button.type = "button";


        function update() {

            const light =
                document.documentElement
                    .classList
                    .contains("light-theme");

            button.textContent =
                light ? "☀️" : "🌙";

            button.title =
                light
                    ? "切换深色模式"
                    : "切换浅色模式";

            button.setAttribute(
                "aria-label",
                button.title
            );

        }


        button.onclick = function () {

            const light =
                document.documentElement
                    .classList
                    .contains("light-theme");

            const next =
                light ? "dark" : "light";

            applyTheme(next);

            localStorage.setItem(
                "bpm-theme",
                next
            );

            update();

        };


        nav.appendChild(button);

        update();

    }

    function addFooter() {

        if (document.querySelector(".bpm-footer")) return;

        const footer = document.createElement("footer");
        footer.className = "bpm-footer bpm-auto-footer";
        footer.innerHTML = `<h3>BoardingPassMuseum</h3><p>记录每一次旅程的登机牌博物馆</p><p><a href="about.html">关于我们</a>　<a href="privacy.html">隐私说明</a>　<a href="rules.html">投稿及审核条例</a>　<a href="community-rules.html">社区条例</a></p><p>联系邮箱：<a href="mailto:allenlin_developer@outlook.com">allenlin_developer@outlook.com</a></p><div class="copyright">© 2026 BoardingPassMuseum. All Rights Reserved.</div>`;
        document.body.appendChild(footer);

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => { addToggle(); addFooter(); }
        );

    } else {

        addToggle();
        addFooter();

    }

})();
