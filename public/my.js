// =================================
// BoardingPassMuseum
// My Submissions V5.3
// =================================

const API = "https://api.bpmuseum.org.cn";


const submissions =
  document.getElementById("mySubmissions");

const welcome =
  document.getElementById("welcome");

if (!currentUser) {
  showToast("请登录后查看");
  location.href = "login.html";
  throw new Error("not login");
}

if (welcome) {
  welcome.textContent = `
    你好，${currentUser.username}
  `;
}


// =================================
// 加载我的投稿
// =================================

async function loadMySubmissions() {

  try {

    const res = await fetch(
      `${API}/api/my-flights?user_id=${currentUser.id}`
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

  submissions.innerHTML = "";

  flights.forEach(flight => {
    flight = bpmSafeRecord(flight);

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
          ` : `
            <button type="button" class="withdraw-btn" onclick="withdrawFlight(${flight.id})">
              ${window.bpmIcon("trash")} 下架展品
            </button>
          `}

          ${appeal}

        </div>


      </div>

    `;



    submissions.appendChild(card);

  });

}


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

async function withdrawFlight(id) {
  return changeFlightStatus(id, "withdraw");
}

async function restoreFlight(id) {
  return changeFlightStatus(id, "restore");
}
