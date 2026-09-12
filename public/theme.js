(function () {

    const pwaScript = document.createElement("script");
    pwaScript.src = "pwa.js?v=1";
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


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            addToggle
        );

    } else {

        addToggle();

    }

})();
