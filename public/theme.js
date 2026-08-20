(function () {
    const saved = localStorage.getItem("bpm-theme");

    if (saved === "light") {
        document.documentElement.classList.add("light-theme");
    }

    function addToggle() {
        const nav = document.querySelector(".menubar nav");

        if (!nav || document.getElementById("themeToggle")) return;

        const button = document.createElement("button");
        button.id = "themeToggle";
        button.className = "theme-toggle";

        function update() {
            const light =
                document.documentElement.classList.contains("light-theme");

            button.textContent = light ? "☀️" : "🌙";
            button.title = light ? "切换深色模式" : "切换浅色模式";
        }

        button.onclick = function () {
            const light =
                document.documentElement.classList.contains("light-theme");

            document.documentElement.classList.toggle("light-theme");

            localStorage.setItem(
                "bpm-theme",
                light ? "dark" : "light"
            );

            update();
        };

        nav.appendChild(button);
        update();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addToggle);
    } else {
        addToggle();
    }
})();
