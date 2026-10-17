// =================================
// BoardingPassMuseum
// My Submissions V5.3
// =================================

const API = "https://api.bpmuseum.org.cn";


const submissions =
  document.getElementById("mySubmissions");

const welcome =
  document.getElementById("welcome");
let currentFlights = [];

if (!currentUser) {
  showToast("请登录后查看");
  location.href = "login.html";
  throw new Error("not login");
}

if (welcome) {
  const username=String(currentUser.username||"").replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  welcome.innerHTML = `${window.bpmLocaleText("你好，")}<span data-user-content>${username}</span>`;
}


// =================================
// 加载我的投稿
// =================================

async function loadMySubmissions() {

  try {

    const res = await fetch(
      `${API}/api/my-flights?user_id=${currentUser.id}`,
      { credentials: "include", cache: "no-store" }
    );

    const flights = await res.json();

    if (!res.ok) throw new Error("投稿加载失败");

    renderSubmissions(flights);

  } catch (e) {

    console.error(e);

    submissions.innerHTML = `
      <p class="my-error">
        投稿加载失败，请稍后再试。
      </p>
    `;

  }

}


// =================================
// 状态
// =================================

function getStatus(flight) {
  if (flight.status === "hidden") {
    return { text: "已下架", className: "status-hidden", icon: "xCircle" };
  }


  if (flight.status === "approved") {

    return {
      text: "已通过",
      className: "status-approved",
      icon: "check"
    };

  }

  if (flight.status === "rejected") {

    return {
      text: "未通过",
      className: "status-rejected",
      icon: "xCircle"
    };

  }

  return {
    text: "审核中",
    className: "status-pending",
    icon: "alert"
  };

}


// =================================
// 投稿卡片
// =================================

function renderSubmissions(flights) {

  if (
    !Array.isArray(flights) ||
    flights.length === 0
  ) {

    submissions.innerHTML = `
      <p class="my-empty">
        暂无投稿
      </p>
    `;

    return;

  }

  currentFlights = flights.map(flight => bpmSafeRecord(flight));
  submissions.innerHTML = `
    <div class="my-bulk-toolbar" role="region" aria-label="批量管理展品">
      <label><input type="checkbox" id="mySelectAll"> 全选</label>
      <span id="mySelectionCount" aria-live="polite">已选择 0 件</span>
      <button type="button" class="my-bulk-action" data-action="withdraw" disabled>批量下架</button>
      <button type="button" class="my-bulk-action" data-action="restore" disabled>批量恢复</button>
      <button type="button" class="my-bulk-action danger" data-action="delete_hidden" disabled>删除已下架展品</button>
    </div>
  `;

  currentFlights.forEach(flight => {

    const status = getStatus(flight);

    const rejectReason =
      flight.status === "rejected" &&
      flight.reject_reason
        ? `
          <div class="reject-reason">
            <strong>拒绝原因</strong>
            <p>${flight.reject_reason}</p>
          </div>
        `
        : "";



    const appealStatus =
      flight.appeal_status
        ?
        `
        <div class="appeal-status">

          ${
            flight.appeal_status === "pending"
            ?
            `${window.bpmIcon("alert")} 申诉处理中`
            :
            flight.appeal_status === "approved"
            ?
            `${window.bpmIcon("check")} 申诉已通过`
            :
            `${window.bpmIcon("xCircle")} 申诉未通过`
          }

        </div>
        `
        :
        "";


    const appeal =
      flight.status === "rejected"
        ? `
          <button
            type="button"
            class="appeal-btn"
            data-id="${flight.id}"
          >
            提交申诉
          </button>
        `
        : "";

    const shareAllowed=Number(flight.social_share_consent)===1;
    const shareConsentControl=(flight.status==="approved"||shareAllowed)?`
      <button type="button" class="social-share-toggle" onclick="changeSocialShareConsent(${Number(flight.id)},${shareAllowed?"false":"true"})">
        ${shareAllowed?"撤回社交媒体分享授权":"允许社交媒体分享"}
      </button>
    `:"";


    const card =
      document.createElement("article");


    card.className =
      "card submission-card";


    card.innerHTML = `

      <div class="submission-image-wrap">

        ${
          flight.image
          ?
          `
          <img
            src="${flight.image}"
            class="ticket-image"
            alt="登机牌"
            loading="lazy"
            data-preview="${flight.image}"
          >

          <div class="image-zoom-hint">
            点击查看大图
          </div>
          `
          :
          `
          <div class="submission-image-empty">
            暂无图片
          </div>
          `
        }

      </div>



      <div class="submission-content">

        <label class="submission-select">
          <input type="checkbox" data-flight-select value="${Number(flight.id)}" aria-label="选择展品 ${Number(flight.id)}">
          选择
        </label>


        <p class="submission-id">
          🆔 展品 ID: #${flight.id}
        </p>


        <h3>
          ${flight.airline || "未知航空公司"}
        </h3>


        <p class="submission-flight">
          ${window.bpmIcon("plane")} ${flight.flight || ""}
        </p>


        <p>
          ${window.bpmIcon("pin")} ${flight.airport || "未知机场"}
        </p>


        <p>
          ${window.bpmIcon("calendar")} ${flight.date || ""}
        </p>



        <div class="submission-status ${status.className}">

          <span class="status-icon">
            ${window.bpmIcon(status.icon)}
          </span>

          <span>
            ${status.text}
          </span>

        </div>



        ${rejectReason}


        ${appealStatus}


        <div class="submission-actions">

          <button
            type="button"
            class="detail-btn"
            onclick="location.href='detail.html?id=${flight.id}'"
          >
            查看详情
          </button>


          ${flight.status === "hidden" ? `
            <button type="button" class="restore-btn" onclick="restoreFlight(${flight.id})">
              ${window.bpmIcon("rotateLeft")} 恢复展品
            </button>
            <button type="button" class="delete-hidden-btn" onclick="deleteHiddenFlight(${flight.id})">
              ${window.bpmIcon("trash")} 永久删除
            </button>
          ` : `
            <button type="button" class="withdraw-btn" onclick="withdrawFlight(${flight.id})">
              ${window.bpmIcon("trash")} 下架展品
            </button>
          `}

          ${appeal}
          ${shareConsentControl}

        </div>


      </div>

    `;



    submissions.appendChild(card);

  });
  updateBulkToolbar();

}

function selectedFlightIds() {
  return Array.from(submissions.querySelectorAll?.("[data-flight-select]:checked") || [])
    .map(input => Number(input.value)).filter(id => Number.isSafeInteger(id) && id > 0);
}

function updateBulkToolbar() {
  const selected = selectedFlightIds();
  const count = submissions.querySelector?.("#mySelectionCount");
  if (count) count.textContent = `已选择 ${selected.length} 件（每次最多 50 件）`;
  const statuses = new Map(currentFlights.map(flight => [Number(flight.id),flight.status]));
  for (const button of submissions.querySelectorAll?.(".my-bulk-action") || []) {
    const action = button.dataset.action;
    button.disabled = !selected.some(id => action === "withdraw" ? statuses.get(id) !== "hidden" : statuses.get(id) === "hidden");
  }
  const selectAll = submissions.querySelector?.("#mySelectAll");
  if (selectAll) {
    const total = submissions.querySelectorAll?.("[data-flight-select]").length || 0;
    selectAll.checked = total > 0 && selected.length === total;
    selectAll.indeterminate = selected.length > 0 && selected.length < total;
  }
}

async function performBulkAction(action, flightIds) {
  const labels = {withdraw:"下架", restore:"恢复并重新送审", delete_hidden:"永久删除已下架"};
  if (!labels[action] || !Array.isArray(flightIds) || !flightIds.length) return;
  if (!confirm(`确定对选中的展品执行“${labels[action]}”吗？${action === "delete_hidden" ? "删除后无法恢复。" : ""}`)) return;
  try {
    const res = await fetch(`${API}/api/my/bulk`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      credentials:"include",
      body:JSON.stringify({action,flight_ids:flightIds,user_id:currentUser.id})
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "批量操作失败");
    const changed = action === "delete_hidden" ? data.deleted : data.updated;
    showToast(`已处理 ${changed || 0} 件${data.skipped ? `，跳过 ${data.skipped} 件状态不符合的展品` : ""}`);
    await loadMySubmissions();
  } catch (error) {
    showToast(error.message || "网络错误，请稍后再试");
  }
}

document.addEventListener("change", e => {
  if (e.target?.id === "mySelectAll") {
    const inputs = Array.from(submissions.querySelectorAll?.("[data-flight-select]") || []);
    for (const [index,input] of inputs.entries()) input.checked = e.target.checked && index < 50;
    if (e.target.checked && inputs.length > 50) showToast("每次最多批量处理 50 件，已先选中前 50 件");
    updateBulkToolbar();
  } else if (e.target?.matches?.("[data-flight-select]")) {
    if (e.target.checked && selectedFlightIds().length > 50) {
      e.target.checked = false;
      showToast("每次最多批量处理 50 件");
    }
    updateBulkToolbar();
  }
});

document.addEventListener("click", e => {
  const button = e.target.closest?.(".my-bulk-action");
  if (button) performBulkAction(button.dataset.action, selectedFlightIds());
});


// =================================
// 图片大图预览
// =================================

function openImagePreview(src) {

  let overlay =
    document.getElementById(
      "imagePreviewOverlay"
    );

  if (!overlay) {

    overlay =
      document.createElement("div");

    overlay.id =
      "imagePreviewOverlay";

    overlay.className =
      "image-preview-overlay";

    overlay.innerHTML = `

      <button
        type="button"
        class="image-preview-close"
        aria-label="关闭"
      >
        ×
      </button>

      <img
        class="image-preview-large"
        alt="登机牌大图"
      >

    `;

    document.body.appendChild(overlay);


    overlay.addEventListener(
      "click",
      e => {

        if (
          e.target === overlay ||
          e.target.classList.contains(
            "image-preview-close"
          )
        ) {

          overlay.classList.remove(
            "show"
          );

        }

      }
    );

  }


  overlay.querySelector(
    ".image-preview-large"
  ).src = src;


  overlay.classList.add("show");

}


// =================================
// 点击事件
// =================================

document.addEventListener(
  "click",
  async e => {


    // 图片放大

    const image =
      e.target.closest(
        ".ticket-image"
      );

    if (image) {

      openImagePreview(
        image.dataset.preview ||
        image.src
      );

      return;

    }


    // 申诉

    const appealButton =
      e.target.closest(
        ".appeal-btn"
      );

    if (!appealButton) {
      return;
    }


    const flight_id =
      Number(
        appealButton.dataset.id
      );


    // 创建申诉输入区域
    let appealBox =
      appealButton.parentElement.querySelector(".appeal-box");

    if (appealBox) {
      appealBox.remove();
      return;
    }

    appealBox = document.createElement("div");
    appealBox.className = "appeal-box";

    appealBox.innerHTML = `
      <textarea
        class="appeal-input"
        placeholder="请输入申诉理由……"
        rows="4"
      ></textarea>

      <div class="appeal-actions">
        <button type="button" class="appeal-cancel">
          取消
        </button>

        <button type="button" class="appeal-submit">
          提交申诉
        </button>
      </div>
    `;

    appealButton.parentElement.appendChild(appealBox);

    const appealInput =
      appealBox.querySelector(".appeal-input");

    const appealSubmit =
      appealBox.querySelector(".appeal-submit");

    const appealCancel =
      appealBox.querySelector(".appeal-cancel");

    appealInput.focus();

    appealCancel.onclick = () => {
      appealBox.remove();
    };

    appealSubmit.onclick = async () => {

      const reason =
        appealInput.value.trim();

      if (!reason) {
        showToast("请输入申诉理由");
        appealInput.focus();
        return;
      }

      appealSubmit.disabled = true;
      appealCancel.disabled = true;

      try {

        const res = await fetch(
          `${API}/api/appeal`,
          {
            method: "POST",
            credentials: "include",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              user_id:
                currentUser.id,

              flight_id,

              reason
            })
          }
        );

        const data =
          await res.json();

        if (data.success) {

          showToast("申诉提交成功");

          appealBox.remove();

        } else {

          showToast(
            data.error ||
            "提交失败"
          );

          appealSubmit.disabled = false;
          appealCancel.disabled = false;
        }

      } catch (error) {

        console.error(error);

        showToast(
          "网络错误，请稍后再试"
        );

        appealSubmit.disabled = false;
        appealCancel.disabled = false;
      }
    };


  }
);


// =================================
// 启动
// =================================

loadMySubmissions();

async function changeFlightStatus(id, action) {
  const restoring = action === "restore";
  if (!confirm(restoring ? "恢复后将重新审核，确定恢复这个展品吗？" : "确定下架这个展品吗？")) return;
  try {
    const res = await fetch(`${API}/api/my/${action}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flight_id: id, user_id: currentUser.id })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "操作失败");
    showToast(restoring ? "展品已恢复，等待重新审核" : "下架成功");
    await loadMySubmissions();
  } catch (error) {
    showToast(error.message || "网络错误，请稍后再试");
  }
}

async function changeSocialShareConsent(id, enabled) {
  const prompt=enabled
    ? "允许本站使用这件已公开展品的信息制作分享内容？票面照片不会放入分享卡。"
    : "撤回这件展品的社交媒体分享授权？撤回后分享入口将关闭。";
  if(!confirm(prompt))return;
  try {
    const res=await fetch(`${API}/api/my/social-share`,{
      method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({flight_id:Number(id),enabled,user_id:currentUser.id})
    });
    const data=await res.json();
    if(!res.ok||!data.success)throw new Error(data.error||"授权设置失败");
    showToast(enabled?"已开启社交媒体分享授权":"已撤回社交媒体分享授权");
    await loadMySubmissions();
  } catch(error) {
    showToast(error.message||"网络错误，请稍后重试");
  }
}

async function withdrawFlight(id) {
  return changeFlightStatus(id, "withdraw");
}

async function restoreFlight(id) {
  return changeFlightStatus(id, "restore");
}

async function deleteHiddenFlight(id) {
  return performBulkAction("delete_hidden", [Number(id)]);
}
