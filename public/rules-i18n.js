(() => {
  const page = document.querySelector('.bpm-rule-text');
  if (!page || !['en', 'zh-TW'].includes(window.BPM_LANGUAGE)) return;

  const en = `
    <p><strong>Rules version: 2026.10.06</strong> · Effective date: 2026-10-06</p>
    <p>These rules apply to all submissions and reviews on BoardingPassMuseum. We value authentic records, lawful content, respect for copyright, and protection of personal information. Past rule updates remain available in site announcements.</p>
    <h2>Submission categories</h2>
    <ul>
      <li><strong>Boarding passes:</strong> Paper and electronic civil-aviation boarding passes from routes worldwide are accepted. Select the format and domestic, international, or regional route scope shown, then enter the airline, flight number, departure airport, and date. An arrival airport is not required.</li>
      <li><strong>Rail tickets:</strong> Authentic railway tickets are accepted. Enter the operator, train number, departure and arrival stations, and the country or region at each end. For international trips, select both countries separately.</li>
      <li><strong>Cabin, membership, and service markers:</strong> Choose business class, premium economy, first class, silver, gold, platinum, special assistance, transfer, or other when supported by the ticket or baggage tag. These are exhibit filters, not submission categories. A baggage-claim receipt attached to a boarding pass is part of the ticket image, not a baggage marker. Every selected marker must match the image.</li>
    </ul>
    <p>Do not submit the same ticket more than once, forged tickets, another person’s ticket without permission, or an image that does not match the selected category. The operator, flight or train number, location, and date must agree with the ticket.</p>
    <p>Do not submit unlawful or confidential material, content that violates public standards, or another person’s ticket without authorization. Only registered users may submit exhibits.</p>
    <h2>Image quality and privacy</h2>
    <ul>
      <li>Images must be clear and complete enough to identify the ticket and its airline or rail operator. A submission may be declined if thermal printing has faded extensively, key details are unclear, or the ticket itself has been cropped out.</li>
      <li>Keep the boarding pass intact; do not deliberately tear away most of it. Special commemorative passes are an exception, but the main boarding-pass section must remain complete. A pass may include an inseparable baggage-claim receipt, but the airline name must remain visible.</li>
      <li>Before uploading, fully cover names, ticket numbers, booking references, PNRs, frequent-flyer numbers, and every QR code and barcode. On rail tickets, also cover names, identity-document details, order numbers, and codes that could be used to verify identity or travel.</li>
      <li>Use fully opaque solid black or white blocks. Translucent shapes, stickers, mosaics, blur, or partially cropped numbers may leave the original information readable and do not meet the privacy requirement.</li>
      <li>You may choose whether to cover seat numbers, gates, boarding sequence numbers, boarding times, destinations, and dates. Do not cover the airline or operator, flight or train number, or departure location needed to identify the ticket.</li>
      <li>Submit only content you are authorized to share. Obtain permission and credit the source when reposting or submitting for someone else. Infringing, confidential, or unlawful material will be declined or removed.</li>
      <li>AI image recognition is optional. Only after you edit and redact the image and actively consent is the edited canvas sent to Cloudflare Workers AI. BoardingPassMuseum does not store the recognition image. AI results can be wrong; verify each field against the ticket.</li>
    </ul>
    <h2>Review, appeals, and status notices</h2>
    <p>After submission, an exhibit enters the review queue and is assigned according to the schedule set by the super administrator. The schedule may include regular administrators and the super administrator. Approved exhibits appear in the gallery. Administrators must follow these rules and avoid conflicts of interest or misuse of their authority.</p>
    <p>A rejection must cite the applicable rule and explain the specific issue. You may appeal a rejected submission once from My Submissions. The super administrator reviews the appeal; an accepted appeal returns the exhibit to the review queue.</p>
    <p>We send an email when a submission is received, restored, hidden, reviewed, or has an appeal decision. Check that your account email is current and check your spam folder. Email notices do not change the final status shown on the site.</p>
    <p>You can hide your own exhibit from My Submissions. You may also report an error in a public exhibit to the site. The super administrator handles corrections and makes the final management decision.</p>
    <h2>Rights and responsibilities</h2>
    <p>You are responsible for ensuring that your submission is lawful, authentic, and yours to share. By submitting, you allow BoardingPassMuseum to display it on the site for non-commercial purposes. You may request removal through the site or by contacting support.</p>
    <p>The site is free to use. Administrators must never ask users for money. Keep evidence and contact support if this happens. Check that a public image does not reveal your own or another person’s private information.</p>
    <p>We may decline submissions that do not meet these rules and handle unlawful, infringing, confidential, or abusive content under site policy. Changes to these rules will be announced on the site.</p>`;

  const tw = `
    <p><strong>規則版本：2026.10.06</strong> · 生效日期：2026-10-06</p>
    <p>本規則適用於 BoardingPassMuseum 的所有投稿與審核作業。本站重視資料真實、內容合法、尊重著作權及保護個人隱私。歷次規則更新會保留於網站公告。</p>
    <h2>投稿類別</h2>
    <ul>
      <li><strong>登機牌：</strong>接受全球航線的民航紙本及電子登機牌。請依票面選擇形式及國內、國際或地區航線，並填寫航空公司、航班、出發機場及日期；不必填寫抵達機場。</li>
      <li><strong>火車票：</strong>接受真實鐵路客票。請填寫營運公司、車次、出發與抵達車站，以及兩端的國家或地區。跨國行程請分別選擇兩端國家。</li>
      <li><strong>艙等、會員與服務標記：</strong>依票面或行李牌實際資訊選擇商務艙、超級經濟艙、頭等艙、銀卡、金卡、白金卡、特殊保障、轉機或其他。這些是展品篩選標記，不是投稿類別。登機牌上連在一起的行李提領憑證屬於票面內容，不是行李標記。所選標記須與圖片相符。</li>
    </ul>
    <p>請勿重複投稿同一張票據、偽造票據、未經許可投稿他人票據，或上傳與所選類別不符的圖片。營運公司、航班或車次、地點及日期應與票面一致。</p>
    <p>禁止投稿違法或涉密內容、違反公序良俗的內容，以及未經授權的他人票據。僅限已註冊使用者投稿展品。</p>
    <h2>圖片品質與隱私</h2>
    <ul>
      <li>圖片須清晰、完整，足以辨認票據類別及航空公司或鐵路營運公司。熱感紙大幅褪色、重要資訊模糊或票據主體遭裁切者，可能無法通過審核。</li>
      <li>登機牌應保持完整，不得刻意「撕大留小」；特殊紀念登機牌除外，但登機牌主聯仍須完整。登機牌可附帶無法分離的行李提領憑證，但不得完全遮住航空公司名稱。</li>
      <li>上傳前必須完整遮蔽姓名、票號、訂位代碼、PNR、常客卡號，以及所有 QR Code 與條碼。鐵路票也須遮蔽姓名、身分證件資訊、訂單編號，以及可用於驗證身分或乘車的代碼。</li>
      <li>遮蔽須使用完全不透明的純黑或純白色塊。半透明色塊、貼紙、馬賽克、模糊處理，或只裁掉部分號碼，都可能讓原始資訊仍可辨識，不符合隱私要求。</li>
      <li>座位、登機門、登機序號、登機時間、目的地與日期可自行決定是否遮蔽。不得遮住辨識票據所需的航空公司／營運公司、航班或車次，以及出發地點。</li>
      <li>僅上傳你有權分享的內容。轉載或代他人投稿須取得授權並註明來源；侵權、涉密或違法內容將遭拒絕或下架。</li>
      <li>AI 圖片辨識為選用功能。只有在你先完成編輯、遮蔽個人資料並主動同意後，目前編輯畫布才會傳送至 Cloudflare Workers AI。BoardingPassMuseum 不會儲存識別圖片。AI 結果可能有誤，請逐項核對票面資料。</li>
    </ul>
    <h2>審核、申訴與狀態通知</h2>
    <p>投稿送出後會進入審核佇列，並依超級管理員設定的排班分派處理；排班可包含一般管理員及超級管理員。通過審核的展品會公開展示。管理員須依本規則審核，保持公正並避免利益衝突或濫用權限。</p>
    <p>拒絕投稿時，審核人員必須引用適用條款並說明具體問題。你可以在「我的投稿」中對遭拒稿件提出一次申訴，由超級管理員複核；申訴獲接受後，展品會重新進入審核佇列。</p>
    <p>投稿送出、恢復、下架、審核結果及申訴處理等狀態更新會寄至帳戶電子郵件。請確認帳戶信箱正確，並檢查垃圾郵件匣。電子郵件通知不會改變網站顯示的最終狀態。</p>
    <p>你可在「我的投稿」中下架自己的展品；公開展品如有錯誤，也可向本站提出更正。超級管理員負責處理更正並作最終管理決定。</p>
    <h2>權利與責任</h2>
    <p>投稿者須確保內容合法、真實，並有權提交。投稿即表示允許 BoardingPassMuseum 為非商業用途於本站展示內容。如需下架，可使用站內功能或聯絡技術支援信箱。</p>
    <p>本站免費提供服務。任何管理員均不得向使用者索取金錢；如遇此情形，請保留證據並聯絡技術支援信箱。請自行確認公開圖片不會洩露自己或他人的隱私。</p>
    <p>本站可拒絕不符合規則的稿件，並依站內規範處理違法、侵權、涉密或惡意內容。本規則如有更新，將於網站公告。</p>`;

  page.innerHTML = window.BPM_LANGUAGE === 'en' ? en : tw;
  document.title = window.BPM_LANGUAGE === 'en'
    ? 'Submission and Review Rules · BoardingPassMuseum'
    : '投稿與審核規則 · BoardingPassMuseum';
})();
