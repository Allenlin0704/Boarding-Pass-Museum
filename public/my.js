// =================================
// BoardingPassMuseum
// My Submissions V5.3
// =================================

const API = "https://api.bpmuseum.org.cn";

let currentUser = null;

try {
  currentUser = JSON.parse(
    localStorage.getItem("currentUser")
  );
} catch (e) {
  currentUser = null;
}

const submissions =
  document.getElementById("mySubmissions");

const welcome =
  document.getElementById("welcome");

if (!currentUser) {
  alert("请登录后查看");
  location.href = "login.html";
  throw new Error("not login");
}

if (welcome) {
  welcome.innerHTML = `
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

  if (flight.status === "approved") {

    return {
      text: "已通过",
      className: "status-approved",
      icon: "✓"
    };

  }

  if (flight.status === "rejected") {

    return {
      text: "未通过",
      className: "status-rejected",
      icon: "!"
    };

  }

  return {
    text: "审核中",
    className: "status-pending",
    icon: "•"
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

    const status = getStatus(flight);

    const imageHTML = flight.image
      ? `
        <div class="submission-image-wrap">
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
        </div>
      `
      : `
        <div class="submission-image-empty">
          暂无图片
        </div>
      `;


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

    card.className = "card submission-card";


    card.innerHTML = `

      ${imageHTML}

      <div class="submission-content">

        <h3>
          ${flight.airline || ""}
        </h3>

        <p class="submission-flight">
          ${flight.flight || ""}
        </p>

        <p>
          ${flight.airport || ""}
        </p>

        <p>
          ${flight.date || ""}
        </p>

        <div class="submission-status ${status.className}">
          <span class="status-icon">
            ${status.icon}
          </span>

          <span>
            ${status.text}
          </span>
        </div>

        ${rejectReason}

        ${appeal}

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
        alert("请输入申诉理由");
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

          alert("申诉提交成功");

          appealBox.remove();

        } else {

          alert(
            data.error ||
            "提交失败"
          );

          appealSubmit.disabled = false;
          appealCancel.disabled = false;
        }

      } catch (error) {

        console.error(error);

        alert(
          "网络错误，请稍后再试"
        );

        appealSubmit.disabled = false;
        appealCancel.disabled = false;
      }
    };

    return;


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

        alert(
          "申诉提交成功"
        );

      } else {

        alert(
          data.error ||
          "提交失败"
        );

      }


    } catch (error) {

      console.error(error);

      alert(
        "网络错误，请稍后再试"
      );

    } finally {

      appealButton.disabled = false;

    }

  }
);


// =================================
// 启动
// =================================

loadMySubmissions();
