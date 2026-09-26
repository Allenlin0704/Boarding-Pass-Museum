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
        "zh-TW":{
            "nav.gallery":"展廳","nav.submit":"投稿","nav.community":"社群","nav.my":"我的投稿","nav.favorites":"我的收藏","nav.admin":"管理中心","nav.login":"登入","nav.register":"註冊","nav.account":"帳戶設定","nav.notifications":"通知與申訴","nav.manager":"管理中心","nav.logout":"登出","nav.update":"檢查更新",
            "home.title":"登機牌博物館","home.tagline":"看看旅客收藏的登機牌和航程紀錄。","home.enter":"瀏覽館藏","home.latest":"最新展品","home.search":"依航班、業者、車站或機場搜尋…","home.sort.latest":"最新上傳","home.sort.favorite":"收藏數最多","home.sort.hot":"今日熱門","home.airline":"全部航空公司／營運業者","home.category":"全部投稿類型","home.category.boarding":"登機牌","home.category.rail":"火車票","home.baggageTags":"全部行李標記","home.baggageTag.transfer":"轉機行李","home.baggageTag.twoCabin":"兩艙行李","home.format":"全部登機牌形式","home.format.paper":"紙本","home.format.digital":"電子","home.airport":"全部出發機場或車站","home.year":"全部年份","home.reset":"清除篩選","home.description":"依航班、航空公司、機場或年份查找館藏。",
            "authHero.title":"登機牌博物館","authHero.subtitle":"旅客收藏的登機牌、航線與旅程。","community.title":"社群","community.tagline":"航空愛好者的交流空間。","community.publish":"發布貼文","community.sort":"排序","community.latest":"最新發布","community.hot":"熱門討論","community.notice":"請合理使用發文功能；管理員可下架違規內容。","footer.tagline":"以登機牌珍藏每一段旅程。","footer.about":"關於我們","footer.privacy":"隱私說明","footer.rules":"投稿規則","footer.communityRules":"社群規則","submit.back":"返回社群","submit.title":"發布社群貼文","submit.intro":"分享登機牌收藏、航空旅行與機場見聞。","submit.postTitle":"標題","submit.content":"內文","submit.image":"圖片（選填）","submit.publish":"閱讀規則並發布","login.title":"登入","login.email":"電子郵件","login.password":"密碼","login.forgot":"忘記密碼？","login.button":"登入","register.title":"建立帳戶","register.intro":"加入 BoardingPassMuseum，收藏你的飛行回憶。","register.username":"使用者名稱","register.email":"電子郵件","register.code":"電子郵件驗證碼","register.sendCode":"取得驗證碼","register.password":"密碼","register.confirm":"確認密碼","register.button":"建立帳戶","submit.baggageTags":"特殊行李標記（選填）","submit.baggageTagsHint":"轉機行李與兩艙行李都是行李標記，不是投稿類型。","submit.transferBaggage":"轉機行李","submit.twoCabinBaggage":"兩艙行李"
        }
    };
    // Text-node catalog handles both hand-authored pages and labels inserted later by page scripts.
    const phraseRows=[
        ["展厅","Gallery","展廳"],["社区","Community","社群"],["投稿","Submit","投稿"],["我的投稿","My submissions","我的投稿"],["我的收藏","Favorites","我的收藏"],["登录","Log in","登入"],["注册","Sign up","註冊"],["退出","Log out","登出"],["账户设置","Account settings","帳戶設定"],["管理中心","Management center","管理中心"],["查看个人主页","View profile","查看個人主頁"],["检查新版本","Check for updates","檢查更新"],
        ["关于我们","About us","關於我們"],["隐私说明","Privacy","隱私說明"],["投稿及审核条例","Submission and review rules","投稿與審核規則"],["社区条例","Community rules","社群規則"],["← 返回展厅","← Back to gallery","← 返回展廳"],["← 返回社区","← Back to community","← 返回社群"],["← 返回投稿","← Back to submission","← 返回投稿"],["← 返回 SA 工作台","← Back to SA console","← 返回 SA 工作台"],
        ["登机牌博物馆","Boarding Pass Museum","登機牌博物館"],["登机牌、航线和旅客收藏。","Boarding passes, routes, and traveler collections.","登機牌、航線與旅客收藏。"],["看看旅客收藏的登机牌和航程记录。","Boarding passes and flight notes shared by travelers.","看看旅客收藏的登機牌和航程紀錄。"],["浏览馆藏","Browse the collection","瀏覽館藏"],["最新展品","Latest exhibits","最新展品"],["最新上传","Latest uploads","最新上傳"],["最高收藏量","Most saved","收藏數最多"],["今日热点","Popular today","今日熱門"],["全部航空公司 / 运营公司","All airlines and operators","全部航空公司／營運業者"],["全部投稿类别","All submission types","全部投稿類型"],["登机牌","Boarding pass","登機牌"],["火车票","Rail ticket","火車票"],["全部行李标记","All baggage markers","全部行李標記"],["转机行李","Transfer baggage","轉機行李"],["两舱行李","Two-cabin baggage","兩艙行李"],["全部登机牌形式","All boarding pass formats","全部登機牌形式"],["纸质","Paper","紙本"],["电子","Electronic","電子"],["全部出发机场或车站","All departure airports or stations","全部出發機場或車站"],["全部年份","All years","全部年份"],["清除筛选","Clear filters","清除篩選"],["按航班、航空公司、机场或年份查找馆藏。","Find exhibits by flight, airline, airport, or year.","依航班、航空公司、機場或年份查找館藏。"],
        ["社区","Community","社群"],["航空爱好者的交流空间","A place for aviation enthusiasts.","航空愛好者的交流空間"],["发布帖子","Create a post","發布貼文"],["排序","Sort","排序"],["最新发布","Latest","最新發布"],["热门讨论","Popular","熱門討論"],["正在加载帖子…","Loading posts…","正在載入貼文…"],["正在加载条例…","Loading rules…","正在載入規則…"],["正在加载…","Loading…","正在載入…"],["加载中...","Loading…","載入中…"],["加载失败","Could not load","載入失敗"],["暂无展品","No exhibits yet","目前沒有展品"],["没有符合当前筛选条件的展品。请调整关键词或清除筛选后再试。","No exhibits match these filters. Adjust your search or clear the filters.","找不到符合目前篩選條件的展品。請調整關鍵字或清除篩選後再試。"],["请您合理合法使用发帖功能，本站管理员有权对违法违规内容进行下架。","Please follow the community rules. Administrators may hide content that violates them.","請遵守社群規則；管理員得下架違規內容。"],
        ["标题","Title","標題"],["正文","Body","內文"],["内容","Content","內容"],["图片（可选）","Image (optional)","圖片（選填）"],["可选","Optional","選填"],["取消","Cancel","取消"],["确认","Confirm","確認"],["保存","Save","儲存"],["保存修改","Save changes","儲存變更"],["提交","Submit","提交"],["提交中...","Submitting…","提交中…"],["正在提交…","Submitting…","正在提交…"],["确认拒绝","Confirm rejection","確認拒絕"],["已通过","Approved","已通過"],["待审核","Pending review","待審核"],["审核中","In review","審核中"],["筛选","Filter","篩選"],["搜索","Search","搜尋"],["编辑","Edit","編輯"],["删除","Delete","刪除"],["下架","Hide","下架"],["恢复","Restore","恢復"],["恢复展示","Restore visibility","恢復顯示"],["查看","View","查看"],["查看详情","View details","查看詳情"],["重新登录","Log in again","重新登入"],["知道了","Got it","知道了"],["返回","Back","返回"],["上一页","Previous","上一頁"],["下一页","Next","下一頁"],
        ["账户设置","Account settings","帳戶設定"],["基本信息","Basic information","基本資料"],["用户名","Username","使用者名稱"],["邮箱","Email","電子郵件"],["Passkey 登录","Passkey sign-in","Passkey 登入"],["使用设备的指纹、面容或屏幕锁定方式登录。添加 Passkey 时需要当前密码确认。","Sign in with your device’s fingerprint, face, or screen lock. Confirm your current password to add a passkey.","使用裝置的指紋、臉部辨識或螢幕鎖定登入。新增 Passkey 時須確認目前密碼。"],["当前密码","Current password","目前密碼"],["添加这台设备的 Passkey","Add a passkey on this device","在此裝置新增 Passkey"],["第三方账户","Connected accounts","第三方帳戶"],["绑定后可直接使用对应账户登录。每个平台只能绑定一个账户。","Link an account to sign in with that provider. You can link one account per provider.","連結後即可使用該帳戶登入。每個平台只能連結一個帳戶。"],["绑定 GitHub","Link GitHub","連結 GitHub"],["绑定 Apple","Link Apple","連結 Apple"],["绑定 Microsoft","Link Microsoft","連結 Microsoft"],["我的数据","My data","我的資料"],["下载我的数据","Download my data","下載我的資料"],["注销账户","Delete account","註銷帳戶"],["申请说明（可选）","Reason (optional)","申請說明（選填）"],["提交注销申请","Request account deletion","提出註銷申請"],["取消注销申请","Cancel deletion request","取消註銷申請"],["修改邮箱","Change email","變更電子郵件"],["新邮箱","New email","新電子郵件"],["发送验证码","Send code","傳送驗證碼"],["验证码","Verification code","驗證碼"],["隐私设置","Privacy settings","隱私設定"],["公开我的收藏","Make my favorites public","公開我的收藏"],["头像","Avatar","頭像"],["更换头像","Change avatar","更換頭像"],["圆形","Circle","圓形"],["方形","Square","方形"],["缩放","Zoom","縮放"],["使用此裁剪","Use this crop","使用此裁切"],["个人简介","Bio","個人簡介"],["社交媒体","Social media","社群媒體"],["使用设备","Devices","使用裝置"],["喜欢的航空公司","Favorite airlines","喜愛的航空公司"],["喜欢的机场","Favorite airports","喜愛的機場"],["保存航空档案","Save aviation profile","儲存航空檔案"],["修改密码","Change password","變更密碼"],["发送验证码到当前邮箱","Send a code to your current email","傳送驗證碼至目前電子郵件"],["新密码","New password","新密碼"],["确认新密码","Confirm new password","確認新密碼"],
        ["发布社区帖子","Create a community post","發布社群貼文"],["分享登机牌收藏、航空旅行与机场见闻。","Share boarding-pass collections, air travel, and airport stories.","分享登機牌收藏、航空旅行與機場見聞。"],["图片（可选）","Image (optional)","圖片（選填）"],["上传前请遮挡姓名、票号和其他隐私信息。图片不超过 10 MB。","Cover names, ticket numbers, and other private information before uploading. Images must be 10 MB or smaller.","上傳前請遮蔽姓名、票號及其他隱私資訊。圖片大小不得超過 10 MB。"],["阅读条例并发布","Review the rules and publish","閱讀規則並發布"],["同意条例并发布","Agree to the rules and publish","同意規則並發布"],["返回修改","Go back and edit","返回修改"],["社区管理","Community moderation","社群管理"],["处理待复核内容、举报和申诉。请依据","Review flagged content, reports, and appeals. Please follow the","處理待複核內容、檢舉與申訴。請依據"],["处理工具","Moderation tools","處理工具"],["执行处理","Apply action","執行處理"],["帖子","Post","貼文"],["评论","Comment","留言"],["内容 ID","Content ID","內容 ID"],["展示状态","Visibility","顯示狀態"],["下架并处理","Hide and take action","下架並處理"],["处理等级","Severity","處理等級"],["轻度：提醒","Minor: reminder","輕度：提醒"],["中度：隐藏并警告","Moderate: hide and warn","中度：隱藏並警告"],["重度：封禁并扣减等级","Severe: suspend and reduce level","重度：停權並扣減等級"],["严重：永久封禁","Critical: permanent suspension","嚴重：永久停權"],["处理理由","Reason","處理理由"],["保存处理决定","Save decision","儲存處理決定"],["待复核内容与帖子","Items and posts for review","待複核內容與貼文"],["用户举报","User reports","使用者檢舉"],["举报队列","Reports queue","檢舉佇列"],["复审请求","Review requests","複審請求"],["申诉队列","Appeals queue","申訴佇列"],["确认处理","Confirm action","確認處理"],["处理依据或最终裁定","Basis or final decision","處理依據或最終裁定"],["确认保存","Confirm and save","確認並儲存"],
        ["管理中心","Management center","管理中心"],["正在验证权限...","Verifying permissions…","正在驗證權限…"],["审核工作台","Review desk","審核工作台"],["审核记录","Review history","審核紀錄"],["退出管理中心","Exit management center","離開管理中心"],["正在加载账户状态…","Loading account status…","正在載入帳戶狀態…"],["安全验证","Security verification","安全驗證"],["审核排班","Review schedule","審核排班"],["投稿申诉","Submission appeals","投稿申訴"],["展品纠错","Exhibit corrections","展品更正"],["管理员申请","Administrator applications","管理員申請"],["展品管理","Exhibit management","展品管理"],["公告通知","Announcements","公告通知"],["管理员管理","Administrator management","管理員管理"],["注销申请","Deletion requests","註銷申請"],["SA 二次验证","SA verification","SA 二次驗證"],["保存排班","Save schedule","儲存排班"],["保存公告","Publish announcement","發布公告"],["发布公告","Publish announcement","發布公告"],["查询展品","Find an exhibit","查詢展品"],["请输入展品 ID 查询","Enter an exhibit ID","輸入展品 ID 查詢"],["正在检查安全状态…","Checking security status…","正在檢查安全狀態…"],["当前账户密码","Current account password","目前帳戶密碼"],["6 位备用 PIN","6-digit backup PIN","6 位數備用 PIN"],["设置或更换 PIN","Set or change PIN","設定或變更 PIN"],["使用 PIN 验证","Verify with PIN","使用 PIN 驗證"],["使用 Passkey 验证","Verify with passkey","使用 Passkey 驗證"],["加载中…","Loading…","載入中…"],["暂无管理员申请","No administrator applications","目前沒有管理員申請"],["暂无注销申请","No deletion requests","目前沒有註銷申請"],["未找到该展品","Exhibit not found","找不到該展品"],["查询失败","Search failed","查詢失敗"],["站主工作台","Owner console","站主工作台"],["SA 控制台","SA console","SA 控制台"],
        ["通知与申诉","Notifications and appeals","通知與申訴"],["账户中心","Account center","帳戶中心"],["查看社区处理通知、提交申诉并追踪复审进度。","Review community moderation notices, submit an appeal, and track its progress.","查看社群處理通知、提出申訴並追蹤複審進度。"],["申诉说明","About appeals","申訴說明"],["最新动态","Latest activity","最新動態"],["通知","Notifications","通知"],["处理记录","Actions","處理紀錄"],["进度追踪","Progress","進度追蹤"],["我的申诉","My appeals","我的申訴"],["提交申诉","Submit an appeal","提出申訴"],["申诉理由","Appeal reason","申訴理由"],["暂无通知","No notifications","目前沒有通知"],["暂无处理记录","No moderation actions","目前沒有處理紀錄"],["暂无申诉","No appeals","目前沒有申訴"],["提交失败","Submission failed","提交失敗"],["提交成功","Submitted successfully","提交成功"],["找不到展品","Exhibit not found","找不到展品"],["缺少展品ID","Exhibit ID is missing","缺少展品 ID"],["已送交站主核对。","Sent to the site owner for review.","已送交站主核對。"],["查看展品","View exhibit","查看展品"],["在新窗口查看展品","Open exhibit in a new window","在新視窗查看展品"],["处理说明","Decision notes","處理說明"],["采纳","Accept","採納"],["不采纳","Decline","不採納"],
        ["图片处理","Image editor","圖片處理"],["缩放与取景","Zoom and framing","縮放與取景"],["拖动图片调整取景，或框选裁剪区域。","Drag the image to adjust framing, or select a crop area.","拖曳圖片調整取景，或框選裁切範圍。"],["框选裁剪区域","Select crop area","框選裁切範圍"],["应用裁剪","Apply crop","套用裁切"],["裁剪比例","Crop ratio","裁切比例"],["逆时针旋转","Rotate counterclockwise","逆時針旋轉"],["顺时针旋转","Rotate clockwise","順時針旋轉"],["隐私遮挡","Privacy redaction","隱私遮蔽"],["实色遮挡","Solid redaction","實色遮蔽"],["纯黑","Black","純黑"],["纯白","White","純白"],["开始遮挡","Start redacting","開始遮蔽"],["撤销上一个","Undo last","復原上一個"],["清除遮挡","Clear redactions","清除遮蔽"],["图片移动模式","Image move mode","圖片移動模式"],["水印","Watermark","浮水印"],["固定文字 · 可选字体、字号和位置","Fixed text · choose font, size, and position","固定文字 · 可選字型、字級與位置"],["字体","Font","字型"],["字体大小","Font size","字級"],["位置","Position","位置"],["右下角","Bottom right","右下角"],["左下角","Bottom left","左下角"],["右上角","Top right","右上角"],["左上角","Top left","左上角"],["完成并返回投稿","Finish and return to submission","完成並返回投稿"],
        ["关于我们","About us","關於我們"],["一个由航空爱好者维护的登机牌数字收藏馆。","A digital boarding-pass collection maintained by aviation enthusiasts.","由航空愛好者維護的登機牌數位收藏館。"],["我们在做什么","What we do","我們的工作"],["联系我们","Contact us","聯絡我們"],["隐私说明","Privacy","隱私說明"],["生效日期：2026 年 9 月 13 日","Effective date: September 13, 2026","生效日期：2026 年 9 月 13 日"],["我们收集哪些信息","Information we collect","我們蒐集哪些資訊"],["如何使用这些信息","How we use this information","我們如何使用這些資訊"],["存储与服务提供方","Storage and service providers","儲存與服務提供者"],["你的选择与权利","Your choices and rights","你的選擇與權利"],["规则更新","Policy updates","規則更新"],["联系邮箱：","Contact email:","聯絡電子郵件："],
        ["投稿及审核条例","Submission and review rules","投稿與審核規則"],["投稿基本要求","Basic submission requirements","投稿基本要求"],["允许投稿的类别","Accepted submission types","接受投稿的類型"],["隐私守护规范","Privacy protection","隱私保護規範"],["审核流程","Review process","審核流程"],["权利与责任","Rights and responsibilities","權利與責任"],["审核要求","Review requirements","審核要求"],["拒绝投稿","Reject submission","拒絕投稿"],["查看完整条例 →","Read the full rules →","閱讀完整規則 →"],["查阅完整条例","Read the full rules","查閱完整規則"],
        ["首页","Home","首頁"],["个人档案","Profile","個人檔案"],["我的空间","My space","我的空間"],["飞行足迹","Flight history","飛行足跡"],["根据公开通过审核的展品生成","Based on approved public exhibits","根據公開且通過審核的展品產生"],["社区帖子","Community posts","社群貼文"],["管理员申请","Administrator application","管理員申請"],["想成为 Admin？","Want to become an admin?","想成為管理員嗎？"],["提交申请","Submit application","提交申請"],["收藏成功","Added to favorites","已加入收藏"],["已取消收藏","Removed from favorites","已取消收藏"],["请先登录","Please log in first","請先登入"],["请登录后点赞","Please log in to like this post","請先登入再按讚"],["请登录后评论","Please log in to comment","請先登入再留言"],["请输入评论内容","Enter a comment","請輸入留言內容"],["评论失败","Could not post comment","留言失敗"],["点赞失败","Could not like this post","按讚失敗"],["网络错误","Network error","網路錯誤"],
        ["暂时离线","You’re offline","目前離線"],["请检查网络后重试。已打开过的页面仍可在网络恢复后继续浏览。","Check your connection and try again. Previously opened pages will be available when you’re back online.","請檢查網路後重試。網路恢復後仍可瀏覽已開啟過的頁面。"],["重新连接","Try again","重新連線"],["正在完成登录","Finishing sign-in","正在完成登入"],["请稍候…","Please wait…","請稍候…"],["返回登录","Back to sign-in","返回登入"],["创建账号","Create an account","建立帳戶"],["加入 BoardingPassMuseum，收藏你的飞行记忆。","Join BoardingPassMuseum and preserve your flight memories.","加入 BoardingPassMuseum，珍藏你的飛行回憶。"],["获取验证码","Get verification code","取得驗證碼"],["验证码可能进入垃圾邮件/垃圾邮箱文件夹，如果没有收到，请检查您的邮箱。","The verification email may arrive in spam. Check your inbox and spam folder if you don’t see it.","驗證信可能會進入垃圾郵件資料夾。若未收到，請檢查收件匣與垃圾郵件。"],
        ["强制中断审核","Stop review","停止審核"],["批准","Approve","核准"],["拒绝","Reject","拒絕"],["下一页","Next","下一頁"],["上一页","Previous","上一頁"],["保存成功","Saved","已儲存"],["保存失败","Could not save","儲存失敗"],["操作失败，请稍后再试","Something went wrong. Please try again.","操作失敗，請稍後再試"],["正在检查…","Checking…","正在檢查…"],["检查新版本","Check for updates","檢查更新"],["安装应用","Install app","安裝應用程式"],["添加到主屏幕","Add to Home Screen","加入主畫面"],["切换浅色模式","Switch to light mode","切換淺色模式"],["切换深色模式","Switch to dark mode","切換深色模式"],
        ["等级、成就、社区条例","Levels, achievements, and community rules","等級、成就與社群規則"],["总则","General","總則"],["等级","Levels","等級"],["成就","Achievements","成就"],["社区","Community","社群"],["等级计数投稿","Level-count submissions","等級計數投稿"],["累计投稿","Total submissions","累計投稿"],["审核数量","Reviews handled","審核數量"],["审核数量（管理员专用）","Reviews handled (administrators only)","審核數量（管理員專用）"],["等级进度","Level progress","等級進度"],["当前等级","Current level","目前等級"],["获得原因：","Why you earned it: ","獲得原因："],["获得时间：","Awarded: ","獲得時間："],["尚未获得成就","No achievements yet","尚未獲得成就"],["关闭","Close","關閉"],["查看完整等级、成就及社区条例","Read the complete levels, achievements, and community rules","閱讀完整等級、成就與社群規則"],
        ["新星","Star","新星"],["百折不挠","Resilient","百折不撓"],["再接再厉","Going Strong","再接再厲"],["高处不胜寒","High Flyer","高處不勝寒"],["云端常客","Frequent Flyer","雲端常客"],["连击之王","Streak","連擊之王"],["中流砥柱","Pillar of the Museum","中流砥柱"],["为站发电","Powering the Museum","為站發電"],["审核圣手","Review Master","審核聖手"],["深夜加班","Night Shift","深夜加班"],["寰宇行者","World Traveler","寰宇行者"],["国门常客","Gateway Collector","國門常客"],["三航元勋","Big Three","三航元勳"],["真古收藏","Vintage Collector","真古收藏"],["极地探险家","Polar Explorer","極地探險家"],["洲际飞人","Continental Flyer","洲際飛人"],["时光荏苒","Airport Regular","時光荏苒"],["大满贯","Grand Slam","大滿貫"],
        ["注册和使用服务时，我们会处理你提供的用户名、邮箱、密码验证信息、个人资料，以及你主动提交的登机牌、图片、故事、社区帖子、评论和举报内容。网站还会使用必要的登录会话与安全验证信息，以维持登录状态、防止自动化滥用和保护账户。","When you register and use the service, we process the username, email, password-verification data, and profile information you provide, along with boarding passes, images, stories, posts, comments, and reports you submit. We also use sign-in sessions and security-verification data to keep you signed in, prevent automated abuse, and protect your account.","註冊及使用服務時，我們會處理你提供的使用者名稱、電子郵件、密碼驗證資料與個人資料，以及你主動提交的登機牌、圖片、故事、社群貼文、留言與檢舉內容。網站亦會使用必要的登入工作階段與安全驗證資料，以維持登入狀態、防止自動化濫用並保護帳戶。"],
        ["这些信息只用于提供账户、投稿审核、收藏、社区互动、安全防护、处理申诉和回复你的反馈。投稿提交、下架、审核和申诉等状态更新会发送至账户邮箱。我们不会出售个人信息，也不会把密码或验证码展示给其他用户。","We use this information only to provide accounts, review submissions, manage favorites and community interactions, protect the service, handle appeals, and respond to feedback. Status updates about submissions, moderation, reviews, and appeals are sent to your account email. We do not sell personal information or show your password or verification codes to other users.","這些資料僅用於提供帳戶、審核投稿、管理收藏與社群互動、維護安全、處理申訴及回覆意見。投稿、下架、審核與申訴等狀態更新會寄至帳戶電子郵件。我們不會出售個人資料，也不會向其他使用者顯示密碼或驗證碼。"],
        ["请勿在公开投稿或社区图片中保留姓名、票号、订单号、二维码或条形码等敏感信息；公开内容可能被其他访问者看到。","Remove sensitive information such as names, ticket numbers, booking references, QR codes, and barcodes from public submissions and community images. Public content may be seen by other visitors.","公開投稿與社群圖片請勿保留姓名、票號、訂單編號、QR Code 或條碼等敏感資訊；公開內容可能會被其他訪客看見。"],
        ["本站使用 Cloudflare 的网站、接口、数据库与图片存储服务，并使用 Resend 发送账户验证邮件和投稿状态通知。为提供全球访问和安全防护，相关数据可能经由 Cloudflare 的全球网络处理。请在提交前阅读本说明，并只提交你有权提供的内容。","The site uses Cloudflare for its website, APIs, database, and image storage, and Resend for account-verification emails and submission-status notices. Data may be processed through Cloudflare’s global network to provide worldwide access and security. Please read this notice before submitting content, and submit only material you are authorized to provide.","本站使用 Cloudflare 提供網站、API、資料庫與圖片儲存服務，並使用 Resend 傳送帳戶驗證郵件及投稿狀態通知。為提供全球存取與安全防護，相關資料可能經由 Cloudflare 全球網路處理。提交前請閱讀本說明，並僅提交你有權提供的內容。"],
        ["你可以在账户设置中修改公开资料、调整收藏公开状态，或下载自己的数据副本。账户设置中提供注销申请与取消入口；申请会由 SA 审核，且不会自动立即删除数据。若希望更正信息或提出隐私问题，可通过下方邮箱联系。","You can update your public profile, change whether favorites are public, or download a copy of your data in Account settings. You can request or cancel account deletion there. The SA reviews requests; data is not deleted immediately. Contact the email below to correct information or raise a privacy question.","你可在帳戶設定中修改公開資料、調整收藏的公開狀態，或下載個人資料副本。帳戶設定提供註銷申請與取消入口；申請由 SA 審核，且不會立即自動刪除資料。如需更正資料或提出隱私問題，請透過下方電子郵件聯絡。"],
        ["功能或数据处理方式发生重要变化时，我们会更新本页面的生效日期，并在适当情况下通过站内通知说明。","If an important feature or data-processing practice changes, we will update this page’s effective date and, where appropriate, explain the change in a site notice.","功能或資料處理方式有重大變更時，我們會更新本頁生效日期，並視情況透過站內通知說明。"],
        ["BoardingPassMuseum 用来保存真实旅程留下的登机牌、航线与故事，也让收藏者交流航空旅行、机场体验和民航文化。","BoardingPassMuseum preserves boarding passes, routes, and stories from real journeys, and gives collectors a place to share air travel, airport experiences, and aviation culture.","BoardingPassMuseum 用來保存真實旅程留下的登機牌、航線與故事，也讓收藏者交流航空旅行、機場體驗與民航文化。"],["所有投稿都会经过社区规则约束与人工审核。我们希望收藏有出处、交流有分寸，照片中的个人信息得到妥善保护。","All submissions follow community rules and are reviewed by people. We aim to keep collections authentic, discussions considerate, and personal information in photos protected.","所有投稿均受社群規則規範並由人工審核。我們希望收藏來源清楚、交流有分寸，並妥善保護照片中的個人資料。"],["本站目前使用 Cloudflare 提供的网站与接口服务。我们会持续完善移动端体验，并为后续小程序接入做好接口与数据安全准备。","The site currently uses Cloudflare for its website and APIs. We continue to improve the mobile experience and prepare secure APIs and data handling for possible future mini-program support.","本站目前使用 Cloudflare 提供網站與 API 服務。我們會持續改善行動版體驗，並為未來可能接入的小程式做好 API 與資料安全準備。"],
        ["本条例适用于 BoardingPassMuseum 的全部投稿和审核工作。本站以内容真实、合法合规、尊重版权和保护隐私为原则。","These rules apply to all submissions and reviews on BoardingPassMuseum. We require accurate, lawful content, respect for copyright, and protection of privacy.","本規則適用於 BoardingPassMuseum 的所有投稿與審核工作。本網站以內容真實、合法合規、尊重著作權及保護隱私為原則。"],["接受民航纸质登机牌和电子登机牌，支持全球航线。投稿时请选择实际形式，并填写航司、航班、出发机场和日期。","Paper and electronic airline boarding passes from anywhere in the world are accepted. Select the correct format and enter the airline, flight, departure airport, and date.","接受全球航線的紙本與電子民航登機牌。投稿時請選擇實際形式，並填寫航空公司、航班、出發機場與日期。"],["接受真实铁路客票。请填写运营公司、车次、出发站、到达站、出发国家和到达国家；跨国行程请分别选择两端国家。","Authentic rail tickets are accepted. Enter the operator, train number, departure and arrival stations, and the country for each end of the journey.","接受真實鐵路車票。請填寫營運業者、車次、出發站、抵達站及兩端國家；跨國行程請分別選擇出發與抵達國家。"],["登机牌可按实际情况标记“转机行李”或“两舱行李”。它们仅描述行李信息，不是投稿类别，也不能代替登机牌类别；标记必须与图片内容相符。","A boarding pass may be tagged “Transfer baggage” or “Two-cabin baggage” when applicable. These markers describe baggage only; they are not submission types and must match the image.","登機牌可依實際情況標記「轉機行李」或「兩艙行李」。這些標記僅描述行李資訊，不是投稿類型，也不能取代登機牌類別；標記須與圖片相符。"],["请勿重复投稿同一张票据、伪造票据、提交无权公开的他人票据，或上传与所选类别不符的图片。运营公司、航班或车次、地点、日期等信息应与票面相符。","Do not submit the same ticket more than once, forge a ticket, submit someone else’s ticket without permission, or upload an image that does not match the selected type. Operator, flight or train number, location, and date must match the ticket.","請勿重複投稿同一張票據、偽造票據、未經授權提交他人票據，或上傳與所選類型不符的圖片。營運業者、航班或車次、地點及日期等資料須與票面相符。"],["禁止提交违法或涉密内容、违背公序良俗的内容，以及未经授权的他人票据。投稿只面向已注册账户的用户。","Do not submit unlawful or classified material, content that violates public standards, or another person’s ticket without authorization. Only registered users may submit.","禁止提交違法或涉密內容、違反公序良俗的內容，以及未經授權的他人票據。僅限已註冊帳戶的使用者投稿。"],
        ["图片应清楚、完整，足以辨认票据类别及相关航空公司或铁路运营公司。热敏纸信息大面积褪色、关键内容模糊或票据主体被裁掉的稿件可能无法通过审核。","Images must be clear and complete enough to identify the ticket type and airline or rail operator. Submissions may be rejected if thermal printing has faded, key details are unclear, or the ticket is cropped.","圖片須清楚且完整，足以辨識票據類型與航空公司或鐵路業者。熱感紙資訊大面積褪色、關鍵內容模糊或票券主體遭裁切，可能無法通過審核。"],["上传前必须遮挡姓名、票号、订单号、PNR 预订编码、常客卡号，以及所有二维码和条形码。铁路票也应遮挡姓名、身份证件信息、订单号和可用于核验身份或乘车的码。","Before uploading, cover names, ticket numbers, booking references, PNRs, frequent-flyer numbers, and all QR codes and barcodes. On rail tickets, also cover identity-document details and any code that could verify identity or travel.","上傳前必須遮蔽姓名、票號、訂單編號、PNR 訂位代碼、常客卡號，以及所有 QR Code 與條碼。火車票亦須遮蔽姓名、身分證件資訊、訂單編號及可用於驗證身分或乘車的代碼。"],["遮挡应使用完全不透明的纯黑或纯白色块。半透明色块、贴纸、马赛克、模糊处理或仅裁掉部分号码都可能露出原始信息，不符合隐私要求。","Use fully opaque black or white blocks to redact private information. Translucent blocks, stickers, mosaics, blur, or cropping only part of a number may expose the original information and do not meet privacy requirements.","請使用完全不透明的純黑或純白色塊遮蔽個人資訊。半透明色塊、貼紙、馬賽克、模糊處理或僅裁掉部分號碼，都可能露出原始資訊，不符合隱私要求。"],["投稿提交后进入审核队列，由超级管理员设置的排班审核人员处理；排班可以包含普通管理员和超级管理员。审核通过后，展品公开展示。管理员应依据本条例审核，公私分明，不得以权谋私。","Submissions enter a review queue and are assigned to reviewers scheduled by the SA. The schedule may include administrators and the SA. Approved exhibits become public. Reviewers must follow these rules and avoid conflicts of interest.","投稿送出後會進入審核佇列，由 SA 排定的審核人員處理；排班可包含一般管理員與 SA。通過審核後，展品會公開展示。管理員須依本規則審核、公私分明，不得以權謀私。"],["拒绝投稿时，审核人员必须引用本条例中的条款并说明具体问题。用户可以在“我的投稿”中对被拒稿件提交一次申诉，由超级管理员复核；申诉通过后稿件会重新进入审核队列。","When rejecting a submission, reviewers must cite the relevant rule and explain the issue. A user may appeal a rejected submission once from My submissions. The SA will review it; an accepted appeal returns the submission to the review queue.","拒絕投稿時，審核人員須引用本規則並說明具體問題。使用者可在「我的投稿」中對遭拒稿件提出一次申訴，由 SA 複核；申訴通過後，稿件會重新進入審核佇列。"],["投稿提交、恢复、下架、审核结论和申诉处理等状态更新会发送至账户邮箱。请检查账户邮箱地址及垃圾邮件文件夹；邮件通知不改变站内的最终状态。","Email notices are sent for submission, restoration, removal, review decisions, and appeal updates. Check your account email and spam folder. Email does not change the final status shown on the site.","投稿、恢復、下架、審核結果與申訴處理等狀態更新會寄至帳戶電子郵件。請檢查帳戶信箱與垃圾郵件資料夾；電子郵件通知不會改變站內最終狀態。"],
        ["请输入用户名","Enter a username","請輸入使用者名稱"],["请输入邮箱","Enter an email address","請輸入電子郵件"],["请输入密码","Enter a password","請輸入密碼"],["请输入验证码","Enter the verification code","請輸入驗證碼"],["发送中...","Sending…","傳送中…"],["验证码已发送，请检查邮箱（包括垃圾邮件）","Verification code sent. Check your email, including spam.","驗證碼已傳送，請檢查電子郵件（包含垃圾郵件）"],["服务器连接失败","Could not connect to the server","無法連線至伺服器"],["发送失败","Could not send","傳送失敗"],["注册中...","Creating account…","正在建立帳戶…"],["注册成功，请登录。","Account created. Please sign in.","註冊成功，請登入。"],["注册失败","Could not create account","註冊失敗"],["登录成功","Signed in successfully","登入成功"],["账号或密码错误","Incorrect email or password","電子郵件或密碼錯誤"],["登录请求未完成，请检查网络后重试","Sign-in could not be completed. Check your connection and try again.","登入未完成，請檢查網路後重試"],["使用 Passkey 登录","Sign in with a passkey","使用 Passkey 登入"],["此浏览器不支持 Passkey","This browser does not support passkeys","此瀏覽器不支援 Passkey"],["Passkey 登录失败","Passkey sign-in failed","Passkey 登入失敗"],["Passkey 已添加。","Passkey added.","Passkey 已新增。"],["Passkey 验证成功，已授权 15 分钟。","Passkey verified. Sensitive actions are authorized for 15 minutes.","Passkey 驗證成功，已授權 15 分鐘。"],["请输入当前密码确认","Enter your current password to confirm","請輸入目前密碼以確認"],["此操作不会删除账号，只会将管理员恢复为普通用户。","This does not delete the account. It only changes the user back to a regular account.","此操作不會刪除帳戶，只會將管理員身分恢復為一般使用者。"],
        ["投稿至展厅","Submit to the gallery","投稿至展廳"],["上传登机牌或火车票，补充行程信息，并在提交前处理票面隐私。","Upload a boarding pass or rail ticket, add trip details, and protect private information before submitting.","上傳登機牌或火車票，補充行程資訊，並在送出前遮蔽票面個人資料。"],["登机牌与火车票均可投稿","Boarding passes and rail tickets are accepted","登機牌與火車票皆可投稿"],["请遮挡姓名、票号和二维码","Cover names, ticket numbers, and QR codes","請遮蔽姓名、票號與 QR Code"],["票据信息","Ticket details","票據資訊"],["图片处理","Image editing","圖片處理"],["提交审核","Submit for review","送交審核"],["票据类型","Ticket type","票據類型"],["请按票面信息填写；提交后将进入人工审核。","Enter details as shown on the ticket. Submissions are reviewed by a person.","請依票面資訊填寫；送出後將由人工審核。"],["行程信息","Journey details","行程資訊"],["填写票面上的承运方、出发地点与日期。","Enter the carrier, departure location, and date shown on the ticket.","請填寫票面上的承運業者、出發地點與日期。"],["航空公司","Airline","航空公司"],["出发机场","Departure airport","出發機場"],["登机牌打印机场","Airport where pass was printed","登機牌列印機場"],["航班号","Flight number","航班號"],["飞行日期","Flight date","飛行日期"],["信息补全","Complete details","補齊資訊"],["自动补全航班信息","Autofill flight details","自動補全航班資訊"],["登机牌形式","Boarding pass format","登機牌形式"],["纸质登机牌","Paper boarding pass","紙本登機牌"],["电子登机牌","Electronic boarding pass","電子登機牌"],["特殊行李标记（可选）","Special baggage markers (optional)","特殊行李標記（選填）"],["转机行李和两舱行李都属于行李标记，不是投稿类别。","Transfer baggage and two-cabin baggage are baggage markers, not submission types.","轉機行李與兩艙行李都是行李標記，不是投稿類型。"],["火车票信息","Rail ticket details","火車票資訊"],["运营公司","Rail operator","營運業者"],["车次","Train number","車次"],["出发车站","Departure station","出發車站"],["出发国家 / 地区","Departure country or region","出發國家／地區"],["到达车站","Arrival station","抵達車站"],["到达国家 / 地区","Arrival country or region","抵達國家／地區"],["乘车日期","Travel date","乘車日期"],["车票形式","Ticket format","車票形式"],["纸质车票","Paper ticket","紙本車票"],["电子车票","Electronic ticket","電子車票"],["旅程补充","Trip notes","旅程補充"],["选填一段简短说明，帮助参观者了解这张票据。","Add a short optional note to help visitors understand this ticket.","可選填簡短說明，協助參觀者了解這張票據。"],["故事或备注","Story or note","故事或備註"],["图片与隐私","Image and privacy","圖片與隱私"],["裁剪、旋转并遮住个人信息，处理结果会用于最终投稿。","Crop, rotate, and redact private information. The edited image will be included in your submission.","裁切、旋轉並遮蔽個人資訊；處理後的圖片會用於最終投稿。"],["选择票据图片","Choose a ticket image","選擇票據圖片"],["打开图片编辑器","Open image editor","開啟圖片編輯器"],["整理图片","Edit image","編輯圖片"],["图片位置","Image position","圖片位置"],["拖动图片调整位置","Drag the image to reposition it","拖曳圖片調整位置"],["遮挡个人信息","Redact private information","遮蔽個人資訊"],["遮挡颜色","Redaction color","遮蔽顏色"],["当前为图片移动模式","Image move mode is active","目前為圖片移動模式"],["水印设置","Watermark settings","浮水印設定"],["固定文字 · 可选字体、字号和位置","Fixed text · choose font, size, and position","固定文字 · 可選字型、字級與位置"],["检查并提交","Review and submit","檢查並送出"],["确认票据信息准确，图片已处理，再提交审核。","Confirm the ticket details are accurate and the image is edited before submitting for review.","確認票據資訊正確且圖片已處理，再送交審核。"],["投稿即代表您接受本站的","Submitting means you agree to the","投稿即表示你接受本網站的"],["保存草稿","Save draft","儲存草稿"],["清除草稿","Clear draft","清除草稿"],
        ["请先输入完整航班号","Enter the full flight number first","請先輸入完整航班號"],["正在查找航班信息…","Looking up flight details…","正在查詢航班資訊…"],["已根据馆内审核记录补全，请核对后提交","Filled from reviewed museum records. Check the details before submitting.","已依據館內審核紀錄補齊，請核對後送出"],["暂无可靠记录，请手动选择航司和机场","No verified record found. Select the airline and airport manually.","目前沒有可靠紀錄，請手動選擇航空公司與機場"],["自动补全暂不可用，请手动填写","Autofill is unavailable. Please enter the details manually.","自動補全暫不可用，請手動填寫"],["请先应用或取消当前裁剪框，再提交图片","Apply or cancel the current crop before submitting the image","請先套用或取消目前的裁切框，再送出圖片"],["请选择航空公司","Select an airline","請選擇航空公司"],["请选择出发机场","Select a departure airport","請選擇出發機場"],["请输入航班号","Enter a flight number","請輸入航班號"],
        ["社区帖子 · BoardingPassMuseum","Community · BoardingPassMuseum","社群貼文 · BoardingPassMuseum"],["帖子已发布","Post published","貼文已發布"],["帖子发布失败","Could not publish post","貼文發布失敗"],["请登录后发帖","Please sign in to create a post","請先登入再發布貼文"],["写一条评论...","Write a comment…","寫下留言…"],["还没有评论。","No comments yet.","還沒有留言。"],["评论加载失败","Could not load comments","留言載入失敗"],["点赞操作失败","Could not like this post","按讚操作失敗"],["请登录后点赞","Please sign in to like this post","請先登入再按讚"],["举报已提交，等待 SA 核查","Report submitted. Waiting for SA review.","檢舉已送出，等待 SA 核查"],["举报内容","Report content","檢舉內容"],["临时下架内容","Temporarily hide content","暫時下架內容"],["举报分类","Report category","檢舉類別"],["涉黄涉政","Sexual or political content","色情或政治內容"],["虚假误导","False or misleading information","虛假或誤導資訊"],["侵犯隐私/版权","Privacy or copyright violation","侵犯隱私／著作權"],["恶意灌水或骚扰","Spam or harassment","惡意洗版或騷擾"],["违反条款","Rule violated","違反條款"],["理由","Reason","理由"],["举报成立","Report upheld","檢舉成立"],["举报不成立","Report dismissed","檢舉不成立"],["查实故意诬陷","Malicious report confirmed","查證為惡意誣告"],["处理此帖子","Moderate this post","處理此貼文"],
        ["审核通过","Approved","審核通過"],["审核已拒绝","Rejected","審核已拒絕"],["已拒绝","Rejected","已拒絕"],["审核未通过","Not approved","未通過審核"],["已下架","Hidden","已下架"],["未通过","Rejected","未通過"],["恢复后将重新审核，确定恢复这个展品吗？","Restoring this exhibit will send it for review again. Continue?","恢復後會重新送審，確定要恢復這件展品嗎？"],["确定下架这个展品吗？","Are you sure you want to hide this exhibit?","確定要下架這件展品嗎？"],["展品已恢复，等待重新审核","Exhibit restored and waiting for review","展品已恢復，等待重新審核"],["下架成功","Exhibit hidden","展品已下架"],["申诉提交成功","Appeal submitted","申訴已送出"],["请输入申诉理由","Enter a reason for your appeal","請輸入申訴理由"],["管理员申请已提交","Administrator application submitted","管理員申請已送出"],["请输入申请理由：","Enter a reason for your application:","請輸入申請理由："],["请输入社交账号（用于联系）：","Enter a social account for contact:","請輸入社群帳號（供聯絡）："],["确认通过该投稿？","Approve this submission?","確定要通過這件投稿嗎？"],["已拒绝","Rejected","已拒絕"],["图片预览","Image preview","圖片預覽"],["隐藏密码","Hide password","隱藏密碼"],["显示密码","Show password","顯示密碼"],["人机验证加载失败","Could not load bot verification","無法載入人機驗證"],["正在验证操作安全性…","Verifying this action…","正在驗證操作安全性…"],["已取消人机验证","Bot verification cancelled","已取消人機驗證"],["人机验证失败","Bot verification failed","人機驗證失敗"],["人机验证已过期","Bot verification expired","人機驗證已過期"],["登录已失效或网站已完成安全升级，请重新登录后继续。","Your session expired or the site completed a security update. Sign in again to continue.","登入已失效或網站已完成安全升級，請重新登入後繼續。"],
        ["未知航空公司","Unknown airline","未知航空公司"],["未知机场","Unknown airport","未知機場"],["未知运营公司","Unknown operator","未知營運業者"],["匿名用户","Anonymous user","匿名使用者"],["用户","User","使用者"],["管理员","Administrator","管理員"],["超级管理员","Super administrator","超級管理員"],["这个用户还没有填写简介","This user has not added a bio yet","此使用者尚未填寫簡介"],["未填写","Not provided","未填寫"],["用户不存在","User not found","找不到使用者"],["用户举报","User reports","使用者檢舉"],["账号已注销","Account deleted","帳戶已註銷"],["正在检查注销申请状态…","Checking account-deletion status…","正在檢查註銷申請狀態…"],["你尚未提交注销申请。","You have not requested account deletion.","你尚未提出註銷申請。"],["已提交，48 小时冷静期中","Request submitted. The 48-hour waiting period has started.","已送出，48 小時冷靜期已開始。"],["你已取消这项申请","You cancelled this request","你已取消此申請"],["无法读取注销申请状态","Could not load account-deletion status","無法讀取註銷申請狀態"],["注销申请已取消","Account-deletion request cancelled","註銷申請已取消"],["提交后进入 48 小时冷静期；期间可取消，到期后账户会匿名化。是否继续？","This starts a 48-hour waiting period. You can cancel during this time; afterward your account will be anonymized. Continue?","送出後會進入 48 小時冷靜期，期間可取消；期限屆滿後帳戶將匿名化。要繼續嗎？"],["确定取消注销申请吗？","Cancel the account-deletion request?","確定要取消註銷申請嗎？"],["导出失败","Export failed","匯出失敗"],["数据文件已下载，请妥善保管","Your data file has been downloaded. Store it securely.","資料檔已下載，請妥善保管。"],["正在准备文件…","Preparing your file…","正在準備檔案…"],["用户修改成功","Changes saved","變更已儲存"],["用户名修改成功","Username updated","使用者名稱已更新"],["邮箱修改成功","Email updated","電子郵件已更新"],["验证码已发送","Verification code sent","驗證碼已傳送"],["验证码已发送到当前邮箱","A verification code was sent to your current email","驗證碼已傳送至目前電子郵件"],["无法确认登录状态，请检查网络后重试。","Could not verify your sign-in. Check your connection and try again.","無法確認登入狀態，請檢查網路後重試。"],["条例加载失败，请刷新后重试。","Could not load the rules. Refresh the page and try again.","無法載入規則，請重新整理頁面後再試。"],["条例尚未加载，请稍后再试","Rules are still loading. Please try again shortly.","規則尚未載入，請稍後再試。"],["请选择10 MB以内的 PNG、JPEG 或 WebP 图片","Choose a PNG, JPEG, or WebP image no larger than 10 MB","請選擇 10 MB 以下的 PNG、JPEG 或 WebP 圖片"],["图片上传失败","Image upload failed","圖片上傳失敗"],["发布失败","Could not publish","發布失敗"],["管理员申请已提交","Administrator application submitted","管理員申請已送出"],["填写申请理由和社交账号，提交后由站主审核。","Add a reason and social account. The site owner will review your application.","請填寫申請理由與社群帳號，送出後由站主審核。"],["您尚未提交管理员申请。","You have not submitted an administrator application.","你尚未提出管理員申請。"],["服务器连接失败","Could not connect to the server","無法連線至伺服器"],["暂时无法检查更新，请稍后重试。","Could not check for updates. Please try again later.","目前無法檢查更新，請稍後再試。"],["正在加载最新版…","Loading the latest version…","正在載入最新版本…"],["展开导航","Open navigation","展開導覽"],["关闭导航","Close navigation","關閉導覽"],["账号或密码错误","Incorrect email or password","電子郵件或密碼錯誤"],["登录未完成，请重试","Sign-in could not be completed. Please try again.","登入未完成，請重試。"],["登录暂不可用","Sign-in is temporarily unavailable","登入暫時無法使用"],["立即登录","Sign in now","立即登入"],["保存中…","Saving…","儲存中…"],["排班已保存。","Schedule saved.","排班已儲存。"],["至少选择一名审核人。","Select at least one reviewer.","請至少選擇一位審核人。"],["目前没有可排班的管理员。","No administrators are available for scheduling.","目前沒有可排班的管理員。"],["暂无待处理纠错","No exhibit corrections awaiting review","目前沒有待處理的展品更正"],["暂无展品","No exhibits yet","目前沒有展品"],["暂无帖子","No posts yet","目前沒有貼文"],["暂无申诉","No appeals","目前沒有申訴"],["暂无举报","No reports","目前沒有檢舉"],["加载社区管理数据失败","Could not load community moderation data","無法載入社群管理資料"],["仅站主可访问","Only the site owner can access this page","僅限站主存取此頁面"],["无权限","Access denied","沒有存取權限"],["处理已保存","Decision saved","處理結果已儲存"],["处理失败","Could not apply action","處理失敗"],["处理申诉","Review appeal","處理申訴"],["批准申诉","Approve appeal","核准申訴"],["驳回申诉","Reject appeal","駁回申訴"],["通过申诉","Accept appeal","接受申訴"],["恢复后将重新审核，确定恢复这个展品吗？","Restoring this exhibit will send it for review again. Continue?","恢復後會重新送審，確定要恢復這件展品嗎？"],["确定要删除这条社区动态吗？删除后无法恢复。","Delete this community post? This cannot be undone.","確定要刪除此社群貼文嗎？刪除後無法復原。"],["帖子加载失败","Could not load posts","無法載入貼文"],["公告接口请求失败","Could not load announcements","無法載入公告"],["更新日志加载失败","Could not load release notes","無法載入更新紀錄"],["公告通知","Announcements","公告通知"],["每次发布都会追加保存；网站会在用户每天首次打开时展示公告。","Each announcement is saved permanently. The site shows announcements the first time a user visits each day.","每次發布都會追加保存；網站會在使用者每天首次造訪時顯示公告。"],["管理展厅中的投稿展品。","Manage exhibits submitted to the gallery.","管理投稿至展廳的展品。"],["管理社区动态。SA 可以下架不合适的内容，也可以恢复被下架的帖子。","Manage community posts. The SA can hide unsuitable content and restore hidden posts.","管理社群貼文。SA 可下架不適當內容，也可恢復已下架的貼文。"],
        ["获得你的首件审核通过的投稿。","Your first submission passed review.","你的第一件投稿已通過審核。"],["经历挫折后首次获得审核通过。","Earned your first approval after setbacks.","歷經挫折後首次獲得審核通過。"],["累计通过审核 15 件投稿。","15 submissions passed review.","累計有 15 件投稿通過審核。"],["累计通过审核 30 件投稿。","30 submissions passed review.","累計有 30 件投稿通過審核。"],["累计通过审核 50 件投稿。","50 submissions passed review.","累計有 50 件投稿通過審核。"],["连续六个完整月份每月投稿至少 3 件，且这些月份没有被拒的稿件。","Submitted at least three items in each of six consecutive full months, with no rejected submissions in those months.","連續六個完整月份每月投稿至少 3 件，且這些月份沒有遭拒的稿件。"],["成为 BoardingPassMuseum 管理员。","Became a BoardingPassMuseum administrator.","成為 BoardingPassMuseum 管理員。"],["管理员经手审核 50 件投稿。","Reviewed 50 submissions as an administrator.","管理員經手審核 50 件投稿。"],["管理员经手审核 100 件投稿。","Reviewed 100 submissions as an administrator.","管理員經手審核 100 件投稿。"],["管理员在北京时间 00:00–05:59 经手审核投稿。","Reviewed a submission between 00:00 and 05:59 Beijing time.","管理員於北京時間 00:00–05:59 經手審核投稿。"],["集齐五眼国家馆藏，或在境外（含港澳台）投稿超过 5 次。","Collected exhibits from all Five Eyes countries, or submitted more than five exhibits outside mainland China.","集齊五眼國家館藏，或在境外（含港澳台）投稿超過 5 次。"],["集齐北京首都 PEK、上海浦东 PVG、广州白云 CAN 三座机场的展品。","Collected exhibits from Beijing Capital (PEK), Shanghai Pudong (PVG), and Guangzhou Baiyun (CAN).","集齊北京首都 PEK、上海浦東 PVG、廣州白雲 CAN 三座機場的展品。"],["集齐中国国际航空、中国东方航空、中国南方航空的展品。","Collected exhibits from Air China, China Eastern, and China Southern.","集齊中國國際航空、中國東方航空與中國南方航空的展品。"],["投稿并通过审核的行程日期距投稿时间至少十年。","An approved submission documents a journey at least ten years before submission.","投稿並通過審核的行程日期距投稿時間至少十年。"],["馆藏涉及北极圈国家或地区。","Your collection includes a country or region in the Arctic Circle.","館藏涉及北極圈國家或地區。"],["馆藏覆盖三个或更多大洲。","Your collection spans at least three continents.","館藏涵蓋三個或以上大洲。"],["同一机场累计集齐至少五件展品。","Collected at least five exhibits from the same airport.","同一機場累計收藏至少五件展品。"],["获得本馆全部其他成就。","Earned every other museum achievement.","獲得本館其他全部成就。"],
        ["账户设置 - BoardingPassMuseum","Account settings - BoardingPassMuseum","帳戶設定 - BoardingPassMuseum"],["下载一份仅包含你本人资料、投稿、社区记录、等级与通知的 JSON 文件。文件不包含密码、登录凭据或验证码。","Download a JSON file containing your profile, submissions, community activity, level, and notifications. Passwords, sign-in credentials, and verification codes are excluded.","下載僅包含你本人的資料、投稿、社群紀錄、等級與通知的 JSON 檔案。檔案不包含密碼、登入憑證或驗證碼。"],["注销申请不会立刻删除任何资料。提交后有 48 小时冷静期，可随时取消；到期后账户资料和登录凭据会被匿名化，已公开展品会保留并显示“账号已注销”。提交前请先下载数据副本。","An account deletion request does not remove data immediately. You can cancel during the 48-hour waiting period. Afterward, account details and sign-in credentials are anonymized; published exhibits remain and show “Account deleted.” Download a copy of your data first.","註銷申請不會立即刪除任何資料。送出後有 48 小時冷靜期，可隨時取消；期限屆滿後，帳戶資料與登入憑證會匿名化，已公開展品會保留並顯示「帳戶已註銷」。送出前請先下載資料副本。"],["保存设置","Save settings","儲存設定"],["航空收藏家档案","Aviation profile","航空收藏家檔案"],["头像框形","Avatar shape","頭像形狀"],["支持 JPG、PNG、WEBP。拖动图片调整取景，选择缩放与圆形/方形裁剪后再保存。","JPG, PNG, and WebP are supported. Drag to position the image, choose a zoom level and a circular or square crop, then save.","支援 JPG、PNG、WebP。拖曳圖片調整取景，選擇縮放與圓形／方形裁切後再儲存。"],
        ["登录 | BoardingPassMuseum","Log in | BoardingPassMuseum","登入 | BoardingPassMuseum"],["忘记密码？","Forgot password?","忘記密碼？"],["或使用第三方账户","Or continue with","或使用第三方帳戶"],["使用 GitHub 登录","Continue with GitHub","使用 GitHub 登入"],["使用 Apple 登录","Continue with Apple","使用 Apple 登入"],["使用 Microsoft 登录","Continue with Microsoft","使用 Microsoft 登入"],["欢迎回来","Welcome back","歡迎回來"],["还没有账户？","New here?","還沒有帳戶？"],["立即注册","Create an account","立即註冊"],["注册 | BoardingPassMuseum","Sign up | BoardingPassMuseum","註冊 | BoardingPassMuseum"],["创建账户","Create an account","建立帳戶"],["已有账户？","Already have an account?","已經有帳戶？"],["返回登录","Back to sign in","返回登入"],["请先阅读并同意","Please read and accept","請先閱讀並同意"],["服务条款","Terms of service","服務條款"],["隐私政策","Privacy policy","隱私權政策"],
        ["收录登机牌、航线信息与旅客投稿。","Boarding passes, routes, and stories shared by travelers.","收藏登機牌、航線資訊與旅客投稿。"],["官方支持 QQ 群：","Official QQ support group:","官方 QQ 支援群："],["技术支持邮箱：","Technical support email:","技術支援電子郵件："],["如遇使用问题或其他疑难事项，","For help with the site or other questions,","如遇使用問題或其他疑難事項，"],["请将详细描述及相关截图发送至上述邮箱。","email a detailed description and any relevant screenshots to the address above.","請將詳細說明與相關截圖寄至上述電子郵件。"],
        ["待审核展品","Exhibits awaiting review","待審展品"],["进入 SA 控制台","Open SA console","開啟 SA 控制台"],["我的审核","My review queue","我的審核佇列"],["待审核","Awaiting review","待審核"],["审核投稿时请依据本站正式条例进行判断。","Review submissions according to the museum’s official rules.","審核投稿時請依據本站正式規則判斷。"],["二、投稿基本要求","2. Submission requirements","二、投稿基本要求"],["禁止投稿泄露国家秘密、违反国家法规、违背公序良俗、未经授权的非本人稿件。","Do not submit state secrets, unlawful or seriously harmful material, or another person’s material without permission.","禁止投稿涉及國家機密、違反法律法規或公序良俗的內容，也不得未經授權投稿他人資料。"],["隐私信息未按照条例要求遮挡的稿件不得通过审核。","Submissions that fail to conceal private information as required by the rules must not be approved.","未依規定遮蔽隱私資訊的稿件不得通過審核。"],["三、隐私守护规范","3. Privacy protection","三、隱私保護規範"],["姓名、涉及隐私的二维码及条形码、常客卡号、票号以及 PNR 预订编码必须遮挡。","Names, private QR codes and barcodes, frequent-flyer numbers, ticket numbers, and PNR booking references must be concealed.","姓名、涉及隱私的 QR Code 與條碼、常客卡號、票號及 PNR 訂位代碼必須遮蔽。"],["座位号、登机口、序列号、登机时间、目的地及日期属于建议遮挡信息。","Seat numbers, gates, sequence numbers, boarding times, destinations, and dates are recommended for concealment.","座位號、登機門、序號、登機時間、目的地及日期建議遮蔽。"],["航司名称及 Logo、航班号、出发机场不得遮挡，否则稿件将被驳回。","Do not conceal the airline name or logo, flight number, or departure airport. Otherwise, the submission will be rejected.","航空公司名稱與標誌、航班號及出發機場不得遮蔽，否則稿件將遭拒。"],["四、审核要求","4. Review requirements","四、審核要求"],
        ["投稿 | BoardingPassMuseum","Submit | BoardingPassMuseum","投稿 | BoardingPassMuseum"],["选填","Optional","選填"],["自由","Free-form","自由填寫"],["拖动选框裁剪。完成后可继续调整方向并遮挡隐私。","Drag the crop frame. You can rotate the image and conceal private details afterward.","拖曳裁切框。完成後仍可旋轉圖片並遮蔽隱私資訊。"],["选择“开始遮挡”，在图片上框出姓名、票号、二维码或条形码。遮挡会写入最终投稿图片。","Select “Start redacting,” then mark names, ticket numbers, QR codes, or barcodes on the image. Redactions are applied to the submitted image.","選擇「開始遮蔽」，再於圖片上框選姓名、票號、QR Code 或條碼。遮蔽內容會寫入最後投稿圖片。"],["《投稿及审核条例》","Submission and review rules","《投稿與審核規則》"],["提交新展品","Submit a new exhibit","投稿新展品"],["图片处理","Image editing","圖片處理"],["旋转","Rotate","旋轉"],["裁剪","Crop","裁切"],["开始遮挡","Start redacting","開始遮蔽"],["纸质登机牌","Paper boarding pass","紙本登機牌"],["电子登机牌","Electronic boarding pass","電子登機牌"],["航班号","Flight number","航班號"],["出发日期","Departure date","出發日期"],["出发机场","Departure airport","出發機場"],["到达机场","Arrival airport","抵達機場"],["到达车站","Arrival station","抵達車站"],["出发车站","Departure station","出發車站"],["选择运营公司","Select an operator","選擇營運業者"],["关联机场","Related airport","關聯機場"],["一、投稿基本要求","1. Submission requirements","一、投稿基本要求"],["【投稿基本要求】允许投稿的类别","Submission types","【投稿基本要求】可投稿類型"],["登机牌：","Boarding pass:","登機牌："],["火车票：","Rail ticket:","火車票："],["特殊行李标记：","Special baggage markers:","特殊行李標記："],["【隐私守护规范】票据质量与隐私","Privacy and image quality","【隱私保護規範】票據品質與隱私"],["审核、申诉与状态通知","Review, appeals, and status notifications","審核、申訴與狀態通知"],["用户可在“我的投稿”中下架自己的展品；公开展品也可向站方提出纠错。超级管理员可处理纠错并作最终管理决定。","You can hide your own exhibit from My Submissions or report a correction to a published exhibit. The super administrator handles corrections and makes the final decision.","使用者可在「我的投稿」下架自己的展品，也可回報公開展品的錯誤。超級管理員負責處理更正並作最終決定。"],["四、权利与责任","4. Rights and responsibilities","四、權利與責任"],
        ["个人资料","Profile","個人資料"],["社区帖子","Community posts","社群貼文"],["展品详情","Exhibit details","展品詳情"],["查看展品","View exhibit","查看展品"],["收藏","Save","收藏"],["已收藏","Saved","已收藏"],["取消收藏","Remove from favorites","取消收藏"],["分享","Share","分享"],["故事","Story","旅程故事"],["航司","Airline","航空公司"],["运营公司","Operator","營運業者"],["出发地","From","出發地"],["目的地","To","目的地"],["日期","Date","日期"],["站点暂时离线，请检查网络连接。","The site is temporarily offline. Check your internet connection.","網站目前暫時離線，請檢查網路連線。"],["离线","Offline","離線"],["正在完成登录…","Finishing sign-in…","正在完成登入…"],["登录成功，正在返回…","Signed in. Returning…","登入成功，正在返回…"],["若页面没有自动跳转，请点击下方按钮。","If you are not redirected automatically, use the button below.","如果頁面未自動跳轉，請點選下方按鈕。"],["返回首页","Return to home","返回首頁"],["重置密码","Reset password","重設密碼"],["设置新密码","Set a new password","設定新密碼"],["检查邮件","Check your email","查看電子郵件"],["发送重置链接","Send reset link","傳送重設連結"],["查找展品","Find exhibits","搜尋展品"],["我的投稿","My submissions","我的投稿"],["首页","Home","首頁"],["完成","Done","完成"],["下一步","Next","下一步"],["上一步","Previous","上一步"],["没有更多内容了","You’ve reached the end","沒有更多內容了"],["无法加载，请重试","Could not load. Try again.","無法載入，請重試。"],
        ["验证码可能进入垃圾邮件/垃圾邮箱文件夹， 如果没有收到，请检查您的邮箱。","The verification email may land in your spam or junk folder. Check there if it does not arrive.","驗證郵件可能會進入垃圾郵件匣；若未收到，請檢查垃圾郵件。"],["社区 · BoardingPassMuseum","Community · BoardingPassMuseum","社群 · BoardingPassMuseum"],["发布社区帖子 · BoardingPassMuseum","Create a community post · BoardingPassMuseum","發布社群貼文 · BoardingPassMuseum"],["阅读完整等级、成就及社区条例","Read the full levels, achievements, and community rules","閱讀完整等級、成就與社群規則"],["个人档案 - BoardingPassMuseum","Profile - BoardingPassMuseum","個人檔案 - BoardingPassMuseum"],["我的空间 - BoardingPassMuseum","My space - BoardingPassMuseum","我的空間 - BoardingPassMuseum"],["我的收藏 | BoardingPassMuseum","Favorites | BoardingPassMuseum","我的收藏 | BoardingPassMuseum"],["展品详情 | BoardingPassMuseum","Exhibit details | BoardingPassMuseum","展品詳情 | BoardingPassMuseum"],["图片处理 · BoardingPassMuseum","Image editor · BoardingPassMuseum","圖片處理 · BoardingPassMuseum"],["固定文字 · BoardingPassMuseum","Watermark · BoardingPassMuseum","固定文字 · BoardingPassMuseum"],["通知与申诉 · BoardingPassMuseum","Notifications & appeals · BoardingPassMuseum","通知與申訴 · BoardingPassMuseum"],["收到处理通知后，可在 7 个工作日内申诉。SA 会在 14 个工作日内复审；复审期间原决定继续有效。","Appeal within seven business days of a moderation notice. The SA reviews it within 14 business days; the original decision remains in effect during review.","收到處理通知後，可於七個工作日內提出申訴。SA 會在 14 個工作日內複核；複核期間原決定仍有效。"],["请清楚说明你认为原处理应当复审的原因。","Explain clearly why you believe the original action should be reviewed.","請清楚說明你認為原處置應重新審查的原因。"],
        ["本条例适用于 BoardingPassMuseum 的全部投稿和审核工作。本站以内容真实、合法合规、尊重版权和保护隐私为原则。","These rules govern all submissions and reviews at BoardingPassMuseum. We value authenticity, legal compliance, respect for copyright, and privacy protection.","本規則適用於 BoardingPassMuseum 的所有投稿與審核工作。本站以內容真實、合法合規、尊重著作權及保護隱私為原則。"],["【投稿基本要求】允许投稿的类别","Submission types","【投稿基本要求】可投稿類型"],["接受民航纸质登机牌和电子登机牌，支持全球航线。投稿时请选择实际形式，并填写航司、航班、出发机场和日期。","Paper and electronic boarding passes for routes worldwide are accepted. Select the correct format and provide the airline, flight, departure airport, and date.","接受全球航線的民航紙本與電子登機牌。請選擇實際形式，並填寫航空公司、航班、出發機場及日期。"],["接受真实铁路客票。请填写运营公司、车次、出发站、到达站、出发国家和到达国家；跨国行程请分别选择两端国家。","Authentic rail tickets are accepted. Provide the operator, train number, departure and arrival stations, and the countries at both ends. Select each country for cross-border journeys.","接受真實鐵路車票。請填寫營運業者、車次、出發站、抵達站、出發國家及抵達國家；跨國行程請分別選擇兩端國家。"],["登机牌可按实际情况标记“转机行李”或“两舱行李”。它们仅描述行李信息，不是投稿类别，也不能代替登机牌类别；标记必须与图片内容相符。","Boarding passes may be tagged “transfer baggage” or “two-cabin baggage” when applicable. These tags describe baggage only; they are not submission types and do not replace the boarding-pass category. Tags must match the image.","登機牌可依實際情況標記「轉機行李」或「兩艙行李」。這些標記僅描述行李資訊，不是投稿類型，也不能取代登機牌類別；標記須與圖片相符。"],["请勿重复投稿同一张票据、伪造票据、提交无权公开的他人票据，或上传与所选类别不符的图片。运营公司、航班或车次、地点、日期等信息应与票面相符。","Do not submit the same ticket more than once, forged tickets, another person’s ticket without permission, or an image that does not match the selected type. Operator, flight or train number, locations, and dates must match the ticket.","請勿重複投稿同一張票、偽造票據、未經授權公開他人票據，或上傳與所選類型不符的圖片。營運業者、航班或車次、地點及日期等資訊須與票面一致。"],["禁止提交违法或涉密内容、违背公序良俗的内容，以及未经授权的他人票据。投稿只面向已注册账户的用户。","Do not submit unlawful or confidential content, material contrary to public order, or another person’s ticket without permission. Submissions are limited to registered users.","禁止提交違法或涉密內容、違背公序良俗的內容，以及未經授權的他人票據。僅限已註冊帳戶投稿。"],["图片应清楚、完整，足以辨认票据类别及相关航空公司或铁路运营公司。热敏纸信息大面积褪色、关键内容模糊或票据主体被裁掉的稿件可能无法通过审核。","Images must be clear and complete enough to identify the ticket type and airline or rail operator. Faded thermal print, blurred key details, or a cropped-out ticket may result in rejection.","圖片須清晰完整，足以辨識票據類型及航空公司或鐵路業者。熱感紙大面積褪色、關鍵內容模糊或票據主體遭裁切，可能無法通過審核。"],["上传前必须遮挡姓名、票号、订单号、PNR 预订编码、常客卡号，以及所有二维码和条形码。铁路票也应遮挡姓名、身份证件信息、订单号和可用于核验身份或乘车的码。","Before uploading, conceal names, ticket and order numbers, PNR references, frequent-flyer numbers, and all QR codes and barcodes. For rail tickets, also conceal identity-document details and any code used to verify identity or travel.","上傳前必須遮蔽姓名、票號、訂單號、PNR 訂位代碼、常客卡號，以及所有 QR Code 與條碼。火車票也須遮蔽姓名、身分證件資訊、訂單號及可用於驗證身分或乘車的代碼。"],["遮挡应使用完全不透明的纯黑或纯白色块。半透明色块、贴纸、马赛克、模糊处理或仅裁掉部分号码都可能露出原始信息，不符合隐私要求。","Use fully opaque black or white blocks to redact information. Translucent shapes, stickers, mosaics, blur, or partially cropped numbers may reveal the original data and do not meet privacy requirements.","遮蔽須使用完全不透明的純黑或純白色塊。半透明色塊、貼紙、馬賽克、模糊處理或只裁掉部分號碼都可能露出原始資訊，不符合隱私要求。"],["投稿提交后进入审核队列，由超级管理员设置的排班审核人员处理；排班可以包含普通管理员和超级管理员。审核通过后，展品公开展示。管理员应依据本条例审核，公私分明，不得以权谋私。","After submission, an assigned reviewer on the schedule set by the super administrator handles the item. Schedules may include administrators and the super administrator. Approved exhibits become public. Reviewers must follow these rules and act impartially.","投稿送出後會進入審核佇列，由超級管理員排班的審核人員處理；排班可包含一般管理員及超級管理員。審核通過後展品公開展示。管理員須依本規則審核、公正處理，不得徇私。"],["拒绝投稿时，审核人员必须引用本条例中的条款并说明具体问题。用户可以在“我的投稿”中对被拒稿件提交一次申诉，由超级管理员复核；申诉通过后稿件会重新进入审核队列。","When rejecting a submission, the reviewer must cite the relevant rule and explain the issue. A user may appeal a rejected item once from My Submissions. The super administrator reviews it; an upheld appeal returns the item to the review queue.","拒絕投稿時，審核人員須引用本規則並說明具體問題。使用者可在「我的投稿」對遭拒稿件提出一次申訴，由超級管理員複核；申訴成立後稿件會重新進入審核佇列。"],["投稿提交、恢复、下架、审核结论和申诉处理等状态更新会发送至账户邮箱。请检查账户邮箱地址及垃圾邮件文件夹；邮件通知不改变站内的最终状态。","Email notifications are sent for submission, restoration, removal, review decisions, and appeal updates. Check your account email and spam folder. Email does not change the final status shown on the site.","投稿送出、恢復、下架、審核結果及申訴處理等狀態更新會寄至帳戶電子郵件。請確認信箱地址並檢查垃圾郵件；電子郵件通知不會改變站內最終狀態。"],["投稿者须确保内容合法、真实并有权提交。投稿即表示允许 BoardingPassMuseum 以非商业方式在站内展示该内容；如需下架，可通过站内功能或联系技术支持邮箱申请。","Submitters must ensure their content is lawful, authentic, and theirs to share. Submission grants BoardingPassMuseum permission to display it on the site for non-commercial purposes. Request removal using site features or the support email.","投稿者須確保內容合法、真實且有權提交。投稿即表示同意 BoardingPassMuseum 在站內以非商業方式展示；如需下架，可使用站內功能或寄信至技術支援信箱申請。"],["本网站免费提供服务。任何管理员不得向用户索要钱财；遇到此类情况，请保留证据并联系技术支持邮箱。用户应自行确认公开图片不会泄露本人或他人的隐私。","The site is free to use. Administrators must never ask users for money. Keep evidence and contact support if this happens. Users are responsible for ensuring that public images do not expose anyone’s private information.","本站免費提供服務。管理員不得向使用者索取金錢；如遇此情況，請保留證據並聯絡技術支援信箱。使用者應確認公開圖片不會洩露自己或他人的隱私。"],["本站可拒绝不符合条例的稿件，并按站内规则处理违法、侵权、涉密或恶意内容。本条例更新会通过网站公告发布。","The Museum may reject submissions that do not meet these rules and handle unlawful, infringing, confidential, or malicious content under site policies. Updates will be announced on the site.","本站可拒絕不符合規則的投稿，並依站內規範處理違法、侵權、涉密或惡意內容。本規則更新將透過網站公告發布。"],

        ["BoardingPassMuseum","BoardingPassMuseum","BoardingPassMuseum"],["关于 BoardingPassMuseum","About BoardingPassMuseum","關於 BoardingPassMuseum"],["等级、成就、社区条例 · BoardingPassMuseum","Levels, achievements & community rules · BoardingPassMuseum","等級、成就與社群規則 · BoardingPassMuseum"],["投稿及审核条例 · BoardingPassMuseum","Submission and review rules · BoardingPassMuseum","投稿與審核規則 · BoardingPassMuseum"],["重置密码 · BoardingPassMuseum","Reset password · BoardingPassMuseum","重設密碼 · BoardingPassMuseum"],["SA 控制台 · BoardingPassMuseum","SA Console · BoardingPassMuseum","SA 控制台 · BoardingPassMuseum"],["管理员中心 · BoardingPassMuseum","Admin console · BoardingPassMuseum","管理員中心 · BoardingPassMuseum"],["社区管理 · BoardingPassMuseum","Community moderation · BoardingPassMuseum","社群管理 · BoardingPassMuseum"],["关于我们 · BoardingPassMuseum","About · BoardingPassMuseum","關於我們 · BoardingPassMuseum"],["隐私说明 · BoardingPassMuseum","Privacy · BoardingPassMuseum","隱私說明 · BoardingPassMuseum"],["请在邮箱中打开重置链接，并按页面提示设置新密码。","Open the reset link in your email and follow the instructions to set a new password.","請開啟電子郵件中的重設連結，並依頁面指示設定新密碼。"],["退出登录","Sign out","登出"],["删除后不可恢复","This cannot be undone","刪除後無法復原"],["返回展厅","Back to gallery","返回展廳"],["开启个人主页","Open profile","開啟個人主頁"],["从电脑选择图片","Choose an image from your device","從裝置選擇圖片"],["固定文字","Watermark text","固定文字"],["水印","Watermark","浮水印"],["图片已处理","Image processed","圖片已處理"],["请先处理图片再提交","Edit the image before submitting","請先處理圖片再投稿"],["展开更多筛选","Show more filters","展開更多篩選"],

        ["管理员应当公私分明，不得公报私仇或以权谋私。", "Administrators must remain impartial and must not retaliate or abuse their position.", "管理員須公正處理，不得公報私仇或濫用職權。"],
        ["管理员不得审核本人提交的投稿、与本人存在直接利益关系的投稿，或其他可能影响审核公正性的投稿。", "Administrators must not review their own submissions, items involving a direct personal interest, or any item that could compromise impartiality.", "管理員不得審核自己的投稿、與自己有直接利益關係的投稿，或其他可能影響公正性的投稿。"],
        ["遇到上述情况，应主动回避并交由其他管理员处理。", "In these cases, recuse yourself and refer the item to another administrator.", "遇到上述情況，請主動迴避並交由其他管理員處理。"],
        ["驳回投稿时必须引用本站条例作为驳回依据。", "A rejection must cite the relevant site rule.", "拒絕投稿時必須引用本站規則作為依據。"],
        ["本站完全免费。任何管理员不得向用户索要钱财。", "The site is free. Administrators must never ask users for money.", "本站完全免費，任何管理員不得向使用者索取金錢。"],
        ["超级管理员负责管理员申请、管理员权限管理以及用户申诉处理，并监督管理员审核工作。", "The super administrator handles administrator applications and permissions, reviews user appeals, and oversees moderation.", "超級管理員負責管理員申請與權限、處理使用者申訴，並監督審核工作。"],
        ["超级管理员不得滥用管理权限，不得无正当理由修改或干预正常审核结果。", "The super administrator must not abuse administrative access or interfere with review results without a valid reason.", "超級管理員不得濫用權限，也不得無正當理由干預審核結果。"],
        ["已审核展品", "Reviewed exhibits", "已審核展品"],
        ["想成为 Admin？", "Want to become an administrator?", "想成為管理員嗎？"],
        ["如果您希望帮助维护 BoardingPassMuseum， 欢迎提交管理员申请。", "If you would like to help maintain BoardingPassMuseum, you are welcome to apply to become an administrator.", "如果你希望協助維護 BoardingPassMuseum，歡迎提出管理員申請。"],
        ["提交申请", "Submit an application", "提出申請"],
        ["编辑展品", "Edit exhibit", "編輯展品"],
        ["查阅投稿及审核条例", "Read the submission and review rules", "查看投稿與審核規則"],
        ["审核展品时可随时查阅本站审核规范", "Refer to the site review rules at any time while reviewing exhibits.", "審核展品時可隨時查看本站審核規範。"],
        ["BoardingPassMuseum 投稿及审核条例", "BoardingPassMuseum Submission and Review Rules", "BoardingPassMuseum 投稿與審核規則"],
        ["本站审核秉持守护国家利益、符合国家法规、确保稿件真实以及保护用户隐私的总原则。", "Reviews follow these principles: protect national interests, comply with applicable laws, ensure submissions are authentic, and protect user privacy.", "本站審核原則為維護國家利益、遵守法律、確保稿件真實並保護使用者隱私。"],
        ["本站仅接受使用个人邮箱并注册本站账户的用户进行投稿。", "Only users with a registered account and personal email address may submit exhibits.", "僅限使用個人電子郵件註冊本站帳戶的使用者投稿。"],
        ["本站仅接受民航电子登机牌及纸质登机牌投稿，支持全球数据。", "The site accepts civil-aviation electronic and paper boarding passes from routes worldwide.", "本站接受全球民航電子與紙本登機牌投稿。"],
        ["登机牌必须完整，稿件不能是“撕大留小”的产物（特殊纪念登机牌除外）。", "Boarding passes must be intact and must not be deliberately torn or cropped to hide most of the ticket, except for special commemorative designs.", "登機牌須保持完整，不得刻意撕毀或裁切成只剩局部（特殊紀念設計除外）。"],
        ["自助机打印的热敏纸登机牌，如字体消失 60% 以上或模糊不清，将被驳回。", "Thermal boarding passes with more than 60% of the text faded or too blurred to read will be rejected.", "自助機列印的熱感紙登機牌若超過 60% 文字褪色或模糊不清，將遭拒。"],
        ["泄露国家秘密、违反国家法规的稿件。", "Content that discloses state secrets or violates applicable laws.", "洩露國家機密或違反法律的稿件。"],
        ["违背公序良俗或基本道德的稿件。", "Content contrary to public order or basic standards of conduct.", "違背公序良俗或基本道德的稿件。"],
        ["非本人稿件且未经过稿件所有人合法授权的稿件。", "Another person’s content submitted without the owner’s permission.", "未經稿件所有人合法授權而投稿他人內容。"],
        ["未遮挡登机牌敏感隐私信息的稿件。", "Boarding-pass images that do not conceal sensitive personal information.", "未遮蔽登機牌敏感隱私資訊的稿件。"],
        ["使用白色或马赛克以外图层遮挡隐私信息的稿件。", "Images that use a method other than opaque white or mosaic overlays to conceal private information.", "使用不透明白色或馬賽克以外方式遮蔽隱私資訊的稿件。"],
        ["以下信息", "The following information", "以下資訊"],
        ["必须遮挡", "must be concealed", "必須遮蔽"],
        ["姓名", "Name", "姓名"],
        ["所有涉及隐私的二维码 / 条形码", "All QR codes and barcodes that contain private information", "所有涉及隱私的 QR Code／條碼"],
        ["常客卡号及票号", "Frequent-flyer and ticket numbers", "常客卡號及票號"],
        ["PNR 预定编码（外航适用）", "PNR booking reference (for international airlines)", "PNR 訂位代碼（外籍航空適用）"],
        ["以下信息建议遮挡，可以选择不遮挡：", "The following details are recommended for concealment but may be left visible:", "以下資訊建議遮蔽，也可自行選擇是否遮蔽："],
        ["序列号（登机序号）", "Sequence number", "序號（登機序號）"],
        ["以下信息", "The following information", "以下資訊"],
        ["不得遮挡", "must remain visible", "不得遮蔽"],
        ["，遮挡后稿件将被驳回：", ", concealing them will result in rejection:", "；遮蔽後稿件將遭拒："],
        ["投稿提交后进入管理员审核。", "After submission, an administrator reviews the item.", "投稿送出後由管理員審核。"],
        ["通过审核的稿件将进入主页展厅。", "Approved exhibits appear in the gallery.", "通過審核的展品會公開於展廳。"],
        ["被驳回的稿件应当给出符合本条例的拒绝理由。", "Rejections must include a reason grounded in these rules.", "拒絕稿件須提供符合本規則的理由。"],
        ["管理员应仔细审核，不放过违规内容，也不得无理由拒绝合规稿件。", "Administrators should identify rule violations and must not reject compliant submissions without cause.", "管理員須仔細審核違規內容，也不得無故拒絕合規稿件。"],
        ["本站为免费网站，如发现管理员向用户索要钱财，应保留证据并向维护邮箱举报。", "The site is free. Keep evidence and report any administrator who asks users for money to the support email.", "本站免費。如發現管理員向使用者索取金錢，請保留證據並寄信至支援信箱檢舉。"],
        ["用户可以在“我的投稿”页面查看投稿状态。", "You can check submission status on My Submissions.", "使用者可在「我的投稿」查看投稿狀態。"],
        ["对审核结果有疑问的，可以通过“我的投稿”页面提出申诉。", "If you have concerns about a review decision, submit an appeal from My Submissions.", "對審核結果有疑問，可在「我的投稿」提出申訴。"],
        ["用户投稿即授权本站以非商业用途进行展示。", "By submitting, you grant the site permission to display the content for non-commercial purposes.", "投稿即授權本站以非商業方式展示內容。"],
        ["用户可以通过官方 QQ 群或技术支持邮箱申请下架自己的投稿。", "You may request removal of your submission through the official QQ group or support email.", "使用者可透過官方 QQ 群或技術支援信箱申請下架自己的投稿。"],
        ["用户应保证上传内容合法合规，并承担因隐私泄漏或侵权产生的相应责任。", "Users are responsible for ensuring uploads are lawful and for any privacy or copyright violations.", "使用者須確保上傳內容合法，並承擔隱私洩漏或侵權的相關責任。"],
        ["用户有权向超级管理员提出成为管理员的申请。申请时必须填写社交媒体账号，以供超级管理员参考。", "Users may apply to become administrators. Include a social-media account for the super administrator’s review.", "使用者可向超級管理員申請成為管理員，並須提供社群帳號供參考。"],
        ["本条例最终解释权、修订权、生效日期及更新通知方式归本站所有。 如有更新，将同步在网站首页更新日志弹窗以及官方用户群进行通知。", "The site determines the interpretation, revisions, effective date, and update notices for these rules. Updates will be announced on the home page and in the official user group.", "本站保留本規則的解釋、修訂、生效日期及更新通知方式。更新將同步公告於首頁及官方使用者群組。"],
        ["查看完整《投稿及审核条例》 →", "Read the full Submission and Review Rules →", "查看完整《投稿與審核規則》→"],
        ["站主工作台", "Site owner console", "站主工作台"],
        ["正在加载账户状态…", "Loading account status…", "正在載入帳戶狀態…"],
        ["打开社区举报、处罚与申诉管理 →", "Open community reports, moderation, and appeals →", "開啟社群檢舉、處置與申訴管理 →"],
        ["正在检查安全状态…", "Checking security status…", "正在檢查安全狀態…"],
        ["用户提交的展品信息纠错会列在这里；点开原展品可另开窗口核对。", "Exhibit correction requests appear here. Open an exhibit in a separate window to review it.", "使用者提出的展品更正會列於此處；可另開視窗檢視原展品。"],
        ["查询展品", "Find an exhibit", "搜尋展品"],
        ["请输入展品 ID 查询", "Enter an exhibit ID", "輸入展品 ID 搜尋"],
        ["确定要移除", "Remove administrator access for", "確定要移除"],
        ["的管理员权限吗？", "?", "的管理員權限嗎？"],
        ["此操作不会删除账号，只会将管理员恢复为普通用户。", "This does not delete the account. It only returns the user to the regular-user role.", "此操作不會刪除帳戶，只會將角色恢復為一般使用者。"],
        ["以确认：", "to confirm:", "以確認："],
        ["请先选中要标红的文字。", "Select the text to mark in red first.", "請先選取要標紅的文字。"],
        ["内容类型", "Content type", "內容類型"],
        ["重度封禁天数", "Suspension length for severe violations (days)", "嚴重違規停權天數"],
        ["优先处理", "Priority", "優先處理"],
        ["做出裁定。", "to make a decision.", "作出裁定。"],
        ["联系与反馈", "Contact and feedback", "聯絡與意見回饋"],
        ["功能建议、使用问题、版权或隐私相关反馈，请发送邮件至", "For feature suggestions, help, copyright, or privacy questions, email", "功能建議、使用問題、著作權或隱私意見，請寄信至"],
        ["服务说明", "Service information", "服務說明"],
        ["阅读隐私说明", "Read the privacy notice", "閱讀隱私說明"],
        ["登录处理中 | BoardingPassMuseum", "Signing in | BoardingPassMuseum", "登入處理中 | BoardingPassMuseum"],
        ["暂时离线 · BoardingPassMuseum", "Temporarily offline · BoardingPassMuseum", "暫時離線 · BoardingPassMuseum"],
        ["账户与数据", "Your account and data", "帳戶與資料"],
        ["重置密码 - BoardingPassMuseum", "Reset password - BoardingPassMuseum", "重設密碼 - BoardingPassMuseum"],

        ["登机牌博物馆 | BoardingPassMuseum", "Boarding Pass Museum | BoardingPassMuseum", "登機牌博物館 | BoardingPassMuseum"],
        ["搜索展品", "Search exhibits", "搜尋展品"],
        ["按航空公司筛选", "Filter by airline", "依航空公司篩選"],
        ["按投稿类别筛选", "Filter by submission type", "依投稿類型篩選"],
        ["按行李标记筛选", "Filter by baggage marker", "依行李標記篩選"],
        ["按登机牌形式筛选", "Filter by boarding pass format", "依登機牌形式篩選"],
        ["按出发机场或车站筛选", "Filter by departure airport or station", "依出發機場或車站篩選"],
        ["按年份筛选", "Filter by year", "依年份篩選"],
        ["切换深色模式", "Switch to dark mode", "切換深色模式"],
        ["切换浅色模式", "Switch to light mode", "切換淺色模式"],
        ["安装 BoardingPassMuseum 应用", "Install the BoardingPassMuseum app", "安裝 BoardingPassMuseum 應用"],
        ["请检查网络后重试。已打开过的页面仍可在网络恢复后继续浏览。", "Check your connection and try again. Pages you have already opened will be available again when you are back online.", "請檢查網路後重試。已開啟過的頁面會在網路恢復後繼續提供瀏覽。"],
        ["重新连接", "Reconnect", "重新連線"],
        ["暂时离线", "Temporarily offline", "暫時離線"],
        ["关于我们 · BoardingPassMuseum", "About us · BoardingPassMuseum", "關於我們 · BoardingPassMuseum"],
        ["隐私说明 · BoardingPassMuseum", "Privacy · BoardingPassMuseum", "隱私說明 · BoardingPassMuseum"],
        ["登机牌博物馆", "Boarding Pass Museum", "登機牌博物館"],
        ["社区", "Community", "社群"],
        ["管理员中心", "Management center", "管理中心"],
        ["用户菜单", "User menu", "使用者選單"],
        ["取消筛选", "Clear filters", "清除篩選"],
        ["等级计数投稿", "Level-count submissions", "等級計數投稿"],
        ["累计投稿", "Lifetime submissions", "累計投稿"],
        ["审核数量", "Reviews handled", "經手審核數"],
        ["等级进度", "Level progress", "等級進度"],
        ["打开个人主页", "Open profile", "開啟個人主頁"],

        ["登机牌应保持完整，不得故意“撕大留小”；特殊纪念登机牌除外，登机牌主联仍须完整。自助机热敏纸文字大面积消失或模糊时可能被拒。登机牌可以附带无法分开的行李提取凭证，但不得完全遮住航空公司名称。", "Boarding passes must remain intact; do not deliberately tear or crop away most of the ticket. Special commemorative designs are exempt, but the main boarding-pass portion must remain complete. A thermal pass with extensive fading or blur may be rejected. An inseparable baggage receipt may remain attached, but it must not fully cover the airline name.", "登機牌須保持完整，不得刻意撕毀或裁切掉大部分內容；特殊紀念設計除外，但登機牌主聯仍須完整。熱感紙大面積褪色或模糊時可能遭拒。不可分離的行李提領憑證可一併保留，但不得完全遮住航空公司名稱。"],
        ["座位号、登机口、登机序号、登机时间、目的地和日期可由投稿人自行决定是否遮挡。不得遮挡识别票据所必需的航司/运营公司、航班或车次及出发地点。", "You may choose whether to conceal seat number, gate, sequence number, boarding time, destination, and date. Keep the airline or operator, flight or train number, and departure location visible so the ticket can be identified.", "座位號、登機門、序號、登機時間、目的地及日期可自行決定是否遮蔽。航空公司／營運業者、航班或車次及出發地點等辨識票據所需資訊不得遮蔽。"],
        ["请仅上传自己有权公开的内容。转载或代他人投稿须取得授权并注明来源；侵权、涉密或违法内容将被拒绝或下架。", "Upload only content you have the right to share. Obtain permission and credit the source when reposting or submitting for someone else. Infringing, confidential, or unlawful content will be rejected or removed.", "請只上傳自己有權公開的內容。轉載或代他人投稿須取得授權並註明來源；侵權、涉密或違法內容將遭拒或下架。"],
        ["【审核流程】审核、申诉与状态通知", "Review, appeals, and status notifications", "【審核流程】審核、申訴與狀態通知"],
        ["二、禁止投稿", "2. Prohibited submissions", "二、禁止投稿"],
        ["座位号", "Seat number", "座位號"],
        ["登机口", "Gate", "登機門"],
        ["登机时间", "Boarding time", "登機時間"],
        ["航司名称及 Logo", "Airline name and logo", "航空公司名稱與標誌"],
        ["四、审核流程及管理员职责", "4. Reviews and administrator responsibilities", "四、審核流程與管理員職責"],
        ["五、用户权利与义务", "5. User rights and responsibilities", "五、使用者權利與義務"],
        ["六、管理员申请", "6. Administrator applications", "六、管理員申請"],
        ["七、附则", "7. Additional terms", "七、附則"],
        ["敏感操作需先使用 Passkey 或 6 位备用 PIN 验证；授权有效期为 15 分钟。", "Verify sensitive actions with a passkey or the six-digit backup PIN. Authorization remains valid for 15 minutes.", "敏感操作須先以 Passkey 或六位數備用 PIN 驗證；授權有效期限為 15 分鐘。"],
        ["启用的管理员按待审量均衡分配；顺序用于待审量相同的排班优先级。只有 ID=1 的站主账号可加入 SA 排班。", "Enabled reviewers are balanced by their pending workload. Order breaks ties when assigning schedules. Only the site owner account with ID 1 may be scheduled as an SA.", "啟用的管理員會依待審量平均分配；待審量相同時依排序決定排班優先順序。只有 ID=1 的站主帳戶可加入 SA 排班。"],
        ["标红选中文字", "Mark selected text in red", "將選取文字標紅"],
        ["管理人员管理", "Manage staff", "管理人員"],
        ["账户注销申请", "Account deletion requests", "帳戶註銷申請"],
        ["用户注销采用 48 小时自助冷静期。这里仅用于查看记录；系统不会在此页面删除用户、展品或社区记录。", "Account deletion has a self-service 48-hour waiting period. This page is for viewing requests only; it does not delete users, exhibits, or community records.", "使用者註銷採 48 小時自助冷靜期。此頁面僅供查看申請，不會刪除使用者、展品或社群紀錄。"],
        ["移除管理员权限", "Remove administrator access", "移除管理員權限"],
        ["请输入", "Enter", "請輸入"],
        ["移除", "Remove", "移除"],
        ["确认移除", "Confirm removal", "確認移除"],
        ["SA 工作台", "SA console", "SA 工作台"],
        ["管理中心 · BoardingPassMuseum", "Management center · BoardingPassMuseum", "管理中心 · BoardingPassMuseum"],
        ["正在验证权限…", "Verifying access…", "正在驗證權限…"],
        ["等级信息暂时无法加载", "Level information is temporarily unavailable", "暫時無法載入等級資訊"],
        ["升至下一級需", "To reach the next level,", "升至下一級需"],
        ["符合條件的", "matching", "符合條件的"],
        ["依航班、航空公司、機場或年份查找館藏。", "Find exhibits by flight, airline, airport, or year.", "依航班、航空公司、機場或年份查詢館藏。"]
    ];
    const phraseTranslations=Object.create(null);
    phraseRows.forEach(([source,en,tw])=>{phraseTranslations[source]={en,"zh-TW":tw};});
    const queryLanguage=new URLSearchParams(location.search).get("lang");
    const savedLanguage=queryLanguage||localStorage.getItem("bpm-language")||"zh-CN";
    const language=["en","zh-TW","zh-CN"].includes(savedLanguage)?savedLanguage:(savedLanguage==="zh"?"zh-CN":"zh-CN");
    window.BPM_LANGUAGE=language;
    const normalizePhrase=value=>String(value).replace(/\s+/g," ").trim();
    const localePhraseRows=Object.entries(phraseTranslations).sort((a,b)=>b[0].length-a[0].length);
    window.bpmLocaleText=(value)=>{
        const original=String(value),normalized=normalizePhrase(original),exact=phraseTranslations[normalized]?.[language];
        if(exact)return exact;
        if(language==="zh-CN")return original;
        let translated=normalized;
        for(const [source,targets] of localePhraseRows){
            if([...source].filter(char=>char>="\u4e00"&&char<="\u9fff").length<5)continue;
            const target=targets[language];if(target&&translated.includes(source))translated=translated.split(source).join(target);
        }
        return translated;
    };
    window.bpmT=(key,fallback)=>translations[language]?.[key]||(language==="en"?translations.en?.[key]:null)||window.bpmLocaleText(fallback||"")||fallback;
    const nativeAlert=window.alert.bind(window),nativeConfirm=window.confirm.bind(window);
    window.alert=(message)=>nativeAlert(window.bpmLocaleText(message));
    window.confirm=(message)=>nativeConfirm(window.bpmLocaleText(message));
    function renderIcons(){document.querySelectorAll("[data-bpm-icon]").forEach(node=>{const icon=window.bpmIcon(node.dataset.bpmIcon);if(icon)node.innerHTML=icon;});}
    const protectedContent=".community-post-content,.profile-post-content,.profile-post-body,.ticket-story,.detail-story-text,[data-user-content]";
    function localizeNodeText(node){
        if(!node||node.nodeType!==Node.TEXT_NODE||!node.nodeValue.trim())return;
        const parent=node.parentElement;if(!parent||parent.closest(`script,style,noscript,${protectedContent}`))return;
        const original=node.nodeValue,trimmed=original.trim(),normalized=normalizePhrase(trimmed),translated=window.bpmLocaleText(normalized);
        if(translated!==normalized){const leading=original.match(/^\s*/)?.[0]||"",trailing=original.match(/\s*$/)?.[0]||"";node.nodeValue=leading+translated+trailing;}
    }
    function localizeAttributes(root){
        const elements=[];if(root.nodeType===Node.ELEMENT_NODE)elements.push(root);
        if(root.querySelectorAll)elements.push(...root.querySelectorAll("[placeholder],[title],[aria-label]"));
        for(const element of elements){if(element.closest?.(protectedContent))continue;for(const name of ["placeholder","title","aria-label"]){const value=element.getAttribute(name);if(value){const translated=window.bpmLocaleText(value);if(translated!==value)element.setAttribute(name,translated);}}}
    }
    function localizeTree(root){
        if(!root)return;
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))localizeNodeText(node);
        localizeAttributes(root);
    }
    function applyLanguage(){
        document.documentElement.lang=language==="en"?"en":language;
        document.querySelectorAll("[data-i18n]").forEach(element=>{element.textContent=window.bpmT(element.dataset.i18n,element.textContent);});
        document.querySelectorAll("[data-i18n-placeholder]").forEach(element=>{element.placeholder=window.bpmT(element.dataset.i18nPlaceholder,element.placeholder);});
        localizeTree(document.head);localizeTree(document.body);
        renderIcons();
    }
    const localeObserver=new MutationObserver(records=>{for(const record of records){if(record.type==="characterData")localizeNodeText(record.target);for(const node of record.addedNodes||[])if(node.nodeType===Node.ELEMENT_NODE||node.nodeType===Node.TEXT_NODE)localizeTree(node);}});
    const watchLocaleDom=()=>{if(document.body)localeObserver.observe(document.body,{subtree:true,childList:true,characterData:true});};

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

            button.title = window.bpmLocaleText(light ? "切换深色模式" : "切换浅色模式");

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
        const nextLanguage=language==="zh-CN"?"en":language==="en"?"zh-TW":"zh-CN";
        const labels={"zh-CN":["EN","Switch to English"],en:["繁體","Switch to Traditional Chinese"],"zh-TW":["简体","切换到简体中文"]};
        button.textContent=labels[language][0];
        button.title=labels[language][1];
        button.setAttribute("aria-label",button.title);
        button.onclick=()=>{localStorage.setItem("bpm-language",nextLanguage);location.reload();};
        nav.appendChild(button);
    }

    function addFooter() {

        if (document.querySelector(".bpm-footer")) return;

        const footer = document.createElement("footer");
        footer.className = "bpm-footer bpm-auto-footer";
        footer.innerHTML = `<h3>BoardingPassMuseum</h3><p>收录登机牌、航线信息与旅客投稿。</p><p><a href="about.html">关于我们</a>　<a href="privacy.html">隐私说明</a>　<a href="rules.html">投稿及审核条例</a>　<a href="community-rules.html">社区条例</a></p><p>联系邮箱：<a href="mailto:allenlin_developer@outlook.com">allenlin_developer@outlook.com</a></p><div class="copyright">© 2026 BoardingPassMuseum. All Rights Reserved.</div>`;
        localizeTree(footer);
        document.body.appendChild(footer);

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            () => { applyLanguage(); addToggle(); addLanguageToggle(); addFooter(); watchLocaleDom(); }
        );

    } else {

        applyLanguage();
        addToggle();
        addLanguageToggle();
        addFooter();
        watchLocaleDom();

    }

})();
