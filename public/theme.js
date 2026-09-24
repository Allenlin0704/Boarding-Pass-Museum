(function () {

    const translations={
        en:{
            "nav.gallery":"Gallery","nav.submit":"Submit","nav.community":"Community","nav.my":"My submissions","nav.favorites":"Favorites","nav.admin":"Admin","nav.login":"Log in","nav.register":"Sign up","nav.account":"Account settings","nav.notifications":"Notifications & appeals","nav.manager":"Management center","nav.logout":"Log out","nav.update":"Check for updates",
            "home.title":"Boarding Pass Museum","home.tagline":"Boarding passes and flight notes shared by travelers.","home.enter":"Browse the collection","home.latest":"Latest exhibits","home.search":"Search flights, airlines or airports…","home.sort.latest":"Latest uploads","home.sort.favorite":"Most saved","home.sort.hot":"Popular today","home.airline":"All airlines","home.airport":"All airports","home.year":"All years","home.reset":"Clear filters","home.description":"Find exhibits by flight, airline, airport or year.",
            "community.title":"Community","community.tagline":"A place for aviation enthusiasts.","community.publish":"Create a post","community.sort":"Sort","community.latest":"Latest","community.hot":"Popular","community.notice":"Please use the posting feature responsibly. Administrators may hide content that violates the rules.",
            "footer.tagline":"A digital collection of journeys preserved on boarding passes.","footer.about":"About","footer.privacy":"Privacy","footer.rules":"Submission rules","footer.communityRules":"Community rules",
            "submit.back":"Back to community","submit.title":"Create a community post","submit.intro":"Share boarding-pass collections, aviation travel and airport stories.","submit.postTitle":"Title","submit.content":"Post","submit.image":"Image (optional)","submit.publish":"Read the rules and publish"
            ,"login.title":"Log in","login.email":"Email","login.password":"Password","login.forgot":"Forgot password?","login.button":"Log in","register.title":"Create an account","register.intro":"Join BoardingPassMuseum and preserve your flight memories.","register.username":"Username","register.email":"Email","register.code":"Email code","register.sendCode":"Send code","register.password":"Password","register.confirm":"Confirm password","register.button":"Create account"
        },
        zh:{}
    };
    const queryLanguage=new URLSearchParams(location.search).get("lang");
    const savedLanguage=queryLanguage||localStorage.getItem("bpm-language")||"zh";
    const language=savedLanguage==="en"?"en":"zh";
    window.BPM_LANGUAGE=language;
    window.bpmT=(key,fallback)=>translations[language]?.[key]||fallback;
    function applyLanguage(){
        document.documentElement.lang=language==="en"?"en":"zh-CN";
        document.querySelectorAll("[data-i18n]").forEach(element=>{element.textContent=window.bpmT(element.dataset.i18n,element.textContent);});
        document.querySelectorAll("[data-i18n-placeholder]").forEach(element=>{element.placeholder=window.bpmT(element.dataset.i18nPlaceholder,element.placeholder);});
    }

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

    function addLanguageToggle(){
        const nav=document.querySelector(".menubar nav");
        if(!nav||document.getElementById("languageToggle"))return;
        const button=document.createElement("button");
        button.id="languageToggle";
        button.className="theme-toggle language-toggle";
        button.type="button";
        button.textContent=language==="en"?"中文":"EN";
        button.title=language==="en"?"切换至中文":"Switch to English";
        button.setAttribute("aria-label",button.title);
        button.onclick=()=>{localStorage.setItem("bpm-language",language==="en"?"zh":"en");location.reload();};
        nav.appendChild(button);
    }

    function addFooter() {

        if (document.querySelector(".bpm-footer")) return;

        const footer = document.createElement("footer");
        footer.className = "bpm-footer bpm-auto-footer";
        footer.innerHTML = `<h3>BoardingPassMuseum</h3><p>收录登机牌、航线信息与旅客投稿。</p><p><a href="about.html">关于我们</a>　<a href="privacy.html">隐私说明</a>　<a href="rules.html">投稿及审核条例</a>　<a href="community-rules.html">社区条例</a></p><p>联系邮箱：<a href="mailto:allenlin_developer@outlook.com">allenlin_developer@outlook.com</a></p><div class="copyright">© 2026 BoardingPassMuseum. All Rights Reserved.</div>`;
        document.body.appendChild(footer);

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => { applyLanguage(); addToggle(); addLanguageToggle(); addFooter(); }
        );

    } else {

        applyLanguage();
        addToggle();
        addLanguageToggle();
        addFooter();

    }

})();
