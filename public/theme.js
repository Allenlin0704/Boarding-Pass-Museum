(function () {

    const lucidePaths={
        plane:'<path d="m17.8 19.2-1.8-8.2 3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.6.7l2.3 5.5-1.8 1.8a2 2 0 0 0-.5 2.1l.6 1.3 2-2 2.1 2.1-2 2 1.3.6a2 2 0 0 0 2.1-.5l1.8-1.8 5.5 2.3a.5.5 0 0 0 .7-.6Z"/>',
        train:'<rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16M12 3v8m-4-4h.01M16 7h.01M8 19l-2 3m10-3 2 3M8 15h.01M16 15h.01"/>',
        repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
        armchair:'<path d="M7 13V5a2 2 0 0 1 4 0v6h6a3 3 0 0 1 3 3v2H9a2 2 0 0 1-2-2Z"/><path d="M5 16v3a2 2 0 0 0 2 2h13"/>',
        file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
        phone:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
        image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
        circle:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/>',
        globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>',
        pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
        calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
        heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
        message:'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
        trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
        check:'<path d="m5 12 4 4L19 6"/>',
        xCircle:'<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6m0-6 6 6"/>',
        rotateLeft:'<path d="M3 7v6h6M3.5 13a9 9 0 1 0 2.2-6L3 13"/>',
        rotateRight:'<path d="M21 7v6h-6m5.5 0a9 9 0 1 1-2.2-6L21 13"/>',
        lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        users:'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.9M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-8a4 4 0 0 1 0 8"/>',
        megaphone:'<path d="m3 11 18-5v12L3 13v-2Zm0 2 2 7h5l-2-6m13-8v12"/>',
        alert:'<path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01"/>',
        eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        eyeOff:'<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10 10 0 0 1 12 5c6.4 0 10 7 10 7a16.7 16.7 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 4-.8"/>',
        arrowLeft:'<path d="m15 18-6-6 6-6M20 12H9"/>',
        sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        moon:'<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
        menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
        close:'<path d="m18 6-12 12M6 6l12 12"/>'
    };
    window.bpmIcon=(name)=>lucidePaths[name]?`<svg class="bpm-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${lucidePaths[name]}</svg>`:"";

    const translations={
        en:{
            "nav.gallery":"Gallery","nav.submit":"Submit","nav.community":"Community","nav.my":"My submissions","nav.favorites":"Favorites","nav.admin":"Admin","nav.login":"Log in","nav.register":"Sign up","nav.account":"Account settings","nav.notifications":"Notifications & appeals","nav.manager":"Management center","nav.logout":"Log out","nav.update":"Check for updates",
            "home.title":"Boarding Pass Museum","home.tagline":"Boarding passes and flight notes shared by travelers.","home.enter":"Browse the collection","home.latest":"Latest exhibits","home.search":"Search flights, operators, stations or airports…","home.sort.latest":"Latest uploads","home.sort.favorite":"Most saved","home.sort.hot":"Popular today","home.airline":"All airlines and operators","home.category":"All submission types","home.category.boarding":"Boarding pass","home.category.rail":"Rail ticket","home.baggageTags":"All baggage markers","home.baggageTag.transfer":"Transfer baggage","home.baggageTag.twoCabin":"Two-cabin baggage","home.format":"All boarding pass formats","home.format.paper":"Paper","home.format.digital":"Electronic","home.airport":"All departure airports or stations","home.year":"All years","home.reset":"Clear filters","home.description":"Find exhibits by flight, operator, station or airport, submission type, baggage marker, or year.",
            "authHero.title":"Boarding Pass Museum","authHero.subtitle":"Boarding passes, routes and collections from travelers.",
            "community.title":"Community","community.tagline":"A place for aviation enthusiasts.","community.publish":"Create a post","community.sort":"Sort","community.latest":"Latest","community.hot":"Popular","community.notice":"Please use the posting feature responsibly. Administrators may hide content that violates the rules.",
            "footer.tagline":"A digital collection of journeys preserved on boarding passes.","footer.about":"About","footer.privacy":"Privacy","footer.rules":"Submission rules","footer.communityRules":"Community rules",
            "submit.back":"Back to community","submit.title":"Create a community post","submit.intro":"Share boarding-pass collections, aviation travel and airport stories.","submit.postTitle":"Title","submit.content":"Post","submit.image":"Image (optional)","submit.publish":"Read the rules and publish"
            ,"login.title":"Log in","login.email":"Email","login.password":"Password","login.forgot":"Forgot password?","login.button":"Log in","register.title":"Create an account","register.intro":"Join BoardingPassMuseum and preserve your flight memories.","register.username":"Username","register.email":"Email","register.code":"Email code","register.sendCode":"Send code","register.password":"Password","register.confirm":"Confirm password","register.button":"Create account","submit.baggageTags":"Special baggage markers (optional)","submit.baggageTagsHint":"Transfer baggage and two-cabin baggage are both baggage markers, not submission types.","submit.transferBaggage":"Transfer baggage","submit.twoCabinBaggage":"Two-cabin baggage"
        },
        zh:{}
    };
    const queryLanguage=new URLSearchParams(location.search).get("lang");
    const savedLanguage=queryLanguage||localStorage.getItem("bpm-language")||"zh";
    const language=savedLanguage==="en"?"en":"zh";
    window.BPM_LANGUAGE=language;
    window.bpmT=(key,fallback)=>translations[language]?.[key]||fallback;
    function renderIcons(){document.querySelectorAll("[data-bpm-icon]").forEach(node=>{const icon=window.bpmIcon(node.dataset.bpmIcon);if(icon)node.innerHTML=icon;});}
    function applyLanguage(){
        document.documentElement.lang=language==="en"?"en":"zh-CN";
        document.querySelectorAll("[data-i18n]").forEach(element=>{element.textContent=window.bpmT(element.dataset.i18n,element.textContent);});
        document.querySelectorAll("[data-i18n-placeholder]").forEach(element=>{element.placeholder=window.bpmT(element.dataset.i18nPlaceholder,element.placeholder);});
        renderIcons();
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

            button.innerHTML=window.bpmIcon(light?"sun":"moon");

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
