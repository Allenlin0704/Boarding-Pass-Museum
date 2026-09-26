(() => {
  const page = document.querySelector('.bpm-rule-text');
  if (!page || !['en', 'zh-TW'].includes(window.BPM_LANGUAGE)) return;
  const en = `

    <h2>General</h2>
    <p>These rules describe the levels and achievement features of BoardingPassMuseum (the “Museum”). Contact the site owner through the contact details on the site if you have questions. The super administrator has final authority to interpret these rules.</p>
    <h2>Levels</h2>
    <p>There are three roles: user, administrator, and super administrator. Profiles show level-count submissions, lifetime submissions, and (for administrators) reviews handled. Level-count submissions reset each December 31. If a user has more than 50 level-count submissions that year, 50 carry over. Administrator review counts do not reset.</p>
    <p>New accounts start as users. Users may apply for administrator status from the account menu. Administrators review submissions assigned to them; see the Submission and Review Rules. Super administrator access is reserved for the site owner to maintain the service.</p>
    <p>User levels are based on approved submissions:</p>
    <ul><li>Lv0: visitor or newly registered user</li><li>Lv1: has submitted an exhibit, whether approved or not</li><li>Lv2–Lv9: 2, 5, 10, 20, 40, 60, 80, or 100 approved submissions, respectively</li></ul>
    <p>Administrator levels are based on the number of distinct submissions handled, whether approved or rejected:</p>
    <ul><li>Lv90: administrator</li><li>Lv91–Lv98: administrator who has handled 2, 5, 10, 20, 30, 40, 50, or 100 submissions, respectively</li><li>Lv99: super administrator (site owner)</li></ul>
    <p>Users at Lv5–Lv9 and Lv96–Lv99 may receive priority in review; approved exhibits from these levels may also receive display priority.</p>
    <h2>Achievements</h2>
    <p>Achievements are shown on public profiles. They are permanent and do not reset with levels.</p>
    <ul><li>Rising Star: one approved submission.</li><li>Resilience: first approval after three rejections.</li><li>Keep Going, Heights, and Frequent Flyer: 15, 30, and 50 approved submissions.</li><li>King of Streaks: at least three submissions in each month of a six-month period, with no rejected submissions during that period.</li><li>Pillar of the Museum: become an administrator.</li><li>Powering the Museum and Review Expert: handle 50 and 100 submissions as an administrator.</li><li>Night Shift: handle a submission between 00:00 and 05:59 Beijing time.</li><li>World Traveler: exhibits from all Five Eyes countries, or more than five submissions from outside mainland China, including Hong Kong, Macao, and Taiwan.</li><li>Gateway Collector: exhibits from Beijing Capital (PEK), Shanghai Pudong (PVG), and Guangzhou Baiyun (CAN).</li><li>Big Three: exhibits from Air China, China Eastern, and China Southern.</li><li>Time Capsule: an approved submission for a journey at least ten years before its submission date.</li><li>Arctic Explorer: an exhibit involving a country with territory in the Arctic Circle.</li><li>Intercontinental: submissions covering at least three continents.</li><li>Airport Regular: at least five exhibits from one airport.</li><li>Grand Slam: earn all other achievements.</li></ul>
    <h2>Community</h2>
    <p>The community is for boarding-pass collecting, air travel, airport experiences, and civil aviation culture. These rules apply to posts, comments, and interactions.</p>
    <h3>Posting</h3><ol><li>Posts must relate to aviation. Pure advertising, politically sensitive material, and unrelated spam are prohibited.</li><li>When sharing boarding-pass images, conceal names and ticket numbers. You are responsible for protecting your own private information.</li><li>Credit the source when reposting and respect copyright.</li><li>No repeated spam (including the same content three or more times in a short period), automated posting, personal attacks, regional discrimination, or cyberbullying.</li></ol>
    <h3>Reports</h3><ol><li>Any registered user may report a post or comment.</li><li>Report categories include sexual or political content, false or misleading information, privacy or copyright violations, and spam or harassment.</li><li>Select a category and briefly explain the report. Three confirmed malicious reports suspend reporting access for 30 days.</li></ol>
    <h3>Moderation</h3><ol><li>Administrators may temporarily hide clearly inappropriate posts and refer them to the super administrator.</li><li>The super administrator makes final decisions, including permanent removal or restoration, and may suspend accounts or reduce levels.</li><li>The author is notified of a removal and its reason.</li></ol>
    <h3>Enforcement</h3><ol><li>Minor: a friendly reminder, with no penalty.</li><li>Moderate: remove the content and issue a warning. Three warnings restrict posting for seven days.</li><li>Serious: remove the content, suspend the account for 7–30 days, and deduct up to 50 level-count submissions (down to zero).</li><li>Critical, including severe illegal content or infringement: permanent suspension and removal of level and achievement data. The Museum may contact law enforcement where appropriate.</li></ol>
    <h3>Appeals</h3><p>Appeal a removal or penalty to the super administrator through the site or contact email within seven business days of the notice. A review decision is due within 14 business days. The original action remains in effect during the appeal.</p>
    <p>These rules supplement the Submission and Review Rules. Community violations may affect level assessments and eligibility for achievements.</p>
    <h2>Additional terms</h2><p>The Museum may interpret, revise, and set the effective date and notification method for these rules. Updates will be announced on the site and in the official user group.</p>
    <p><strong>Implementation notes confirmed by the site owner (2026-09-11):</strong> the review-queue status is <code>screening</code>; administrator level counts are based on distinct submissions handled, whether approved or rejected; Gateway Collector requires PEK, PVG, and CAN. Business days are Monday–Friday in Beijing time.</p>`;
  const tw = `

    <h2>總則</h2>
    <p>本規則說明 BoardingPassMuseum（以下稱本站）的等級與成就功能。如有疑問，請透過本站聯絡方式洽詢站主。本規則由超級管理員作最終解釋。</p>
    <h2>等級</h2>
    <p>本站分為使用者、管理員與超級管理員三種角色。個人頁面會顯示等級計數投稿、累計投稿，以及管理員專用的經手審核數。等級計數投稿於每年 12 月 31 日重置；當年度超過 50 件者保留 50 件。管理員經手審核數不參與年度重置。</p>
    <p>新註冊帳戶為一般使用者，可由帳戶選單提出管理員申請。管理員審核系統分派給自己的投稿，詳情請參閱《投稿與審核規則》。超級管理員權限僅供站主維護網站使用。</p>
    <p>一般使用者等級依通過審核的投稿數計算：</p>
    <ul><li>Lv0：訪客或新註冊使用者</li><li>Lv1：曾投稿，無論是否通過審核</li><li>Lv2–Lv9：分別累計通過 2、5、10、20、40、60、80 或 100 件</li></ul>
    <p>管理員等級依經手的不同投稿件數計算，批准與拒絕都會計入：</p>
    <ul><li>Lv90：管理員</li><li>Lv91–Lv98：管理員經手 2、5、10、20、30、40、50 或 100 件投稿</li><li>Lv99：超級管理員（站主）</li></ul>
    <p>Lv5–Lv9 及 Lv96–Lv99 的使用者投稿可獲審核優先；通過後也可獲展出優先。</p>
    <h2>成就</h2>
    <p>成就會公開顯示於個人頁面，永久保存，不隨等級年度重置。</p>
    <ul><li>新星：一件投稿通過審核。</li><li>百折不撓：遭拒三件後首次通過。</li><li>再接再厲、高處不勝寒、雲端常客：分別有 15、30、50 件投稿通過審核。</li><li>連擊之王：連續六個月每月至少投稿三件，且期間沒有稿件遭拒。</li><li>中流砥柱：成為管理員。</li><li>為站發電、審核聖手：管理員分別經手 50、100 件投稿。</li><li>深夜加班：於北京時間 00:00 至 05:59 經手審核投稿。</li><li>寰宇行者：集齊五眼國家館藏，或在中國大陸以外（含港澳台）投稿超過五次。</li><li>國門常客：集齊北京首都 PEK、上海浦東 PVG、廣州白雲 CAN 的展品。</li><li>三航元勳：集齊中國國際航空、中國東方航空與中國南方航空的展品。</li><li>真古收藏：通過審核的投稿所記錄行程，距投稿日期至少十年。</li><li>極地探險家：展品涉及在北極圈內擁有領土的國家。</li><li>洲際飛人：投稿涵蓋至少三個大洲。</li><li>時光荏苒：同一機場累計至少五件展品。</li><li>大滿貫：獲得其他所有成就。</li></ul>
    <h2>社群</h2>
    <p>社群供使用者交流登機牌收藏、航空旅行、機場體驗與民航文化。本章適用於所有貼文、留言及互動。</p>
    <h3>發文規範</h3><ol><li>內容須與航空相關；禁止純廣告、政治敏感內容及無關洗版。</li><li>分享登機牌圖片時請遮蔽姓名與票號，使用者須自行保護個人隱私。</li><li>轉載須註明來源並尊重著作權。</li><li>禁止惡意刷屏（短時間內重複相同內容三次以上）、外掛自動發文、人身攻擊、地域歧視與網路霸凌。</li></ol>
    <h3>檢舉</h3><ol><li>所有註冊使用者均可檢舉違規貼文或留言。</li><li>檢舉類別包括色情或政治內容、虛假誤導、侵犯隱私或著作權，以及洗版或騷擾。</li><li>請選擇類別並簡述理由。經查證惡意誣告累計三次者，將停用檢舉權限 30 天。</li></ol>
    <h3>內容管理</h3><ol><li>一般管理員可暫時隱藏明顯違規貼文，並交由超級管理員複核。</li><li>超級管理員擁有最終處置權，包括永久移除或恢復內容，也可停權或調降等級。</li><li>內容下架時，作者會收到下架原因通知。</li></ol>
    <h3>違規處置</h3><ol><li>輕微：友善提醒，不予處罰。</li><li>中度：移除違規內容並警告；累計三次警告者，停用發文權限七天。</li><li>嚴重：移除內容、停權 7 至 30 天，並扣除最多 50 件等級計數投稿（最低歸零）。</li><li>重大違規，包括嚴重違法內容或侵權：永久停權並清除等級與成就資料；必要時本站可通報執法機關。</li></ol>
    <h3>申訴</h3><p>對下架或處分有異議者，可於通知後七個工作日內透過站內管道或聯絡電子郵件向超級管理員提出申訴。本站應於 14 個工作日內完成複核；申訴期間原處分仍有效。</p>
    <p>本規則補充《投稿與審核規則》。社群違規行為亦可能影響等級評定與成就資格。</p>
    <h2>附則</h2><p>本站保留規則解釋、修訂、生效日期與通知方式的決定權。更新將公告於網站及官方使用者群組。</p>
    <p><strong>站主確認的實施口徑（2026-09-11）：</strong>待審狀態為 <code>screening</code>；管理員等級按經手的不同投稿件數計算，批准與拒絕均計入；國門常客須集齊 PEK、PVG、CAN。工作日為北京時間週一至週五。</p>`;
  page.innerHTML = window.BPM_LANGUAGE === 'en' ? en : tw;
  document.title = window.BPM_LANGUAGE === 'en'
    ? 'Levels, Achievements & Community Rules · BoardingPassMuseum'
    : '等級、成就與社群規則 · BoardingPassMuseum';
})();
