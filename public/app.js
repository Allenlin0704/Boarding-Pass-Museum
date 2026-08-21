let flights = [];

// =====================
// 从 API 读取审核通过的展品
// =====================

async function loadFlights() {

  try {

    const res = await fetch(
      "https://api.bpmuseum.org.cn/api/flights"
    );

    if (!res.ok) {
      throw new Error(
        `API request failed: ${res.status}`
      );
    }

    const data = await res.json();

    flights =
      Array.isArray(data)
        ? data
        : [];

    renderMuseum();

  } catch (error) {

    console.error(
      "加载展品失败：",
      error
    );

    flights = [];

    renderMuseum();

  }

}


// =====================
// 展厅渲染
// =====================

function renderMuseum() {

  const museum =
    document.getElementById("museum");

  if (!museum)
    return;

  museum.innerHTML = "";

  if (
    !Array.isArray(flights) ||
    flights.length === 0
  ) {

    museum.innerHTML = `
      <p class="museum-empty">
        暂无展品
      </p>
    `;

    return;

  }


  flights.forEach(
    (flight, index) => {

      let card =
        document.createElement("div");

      card.className = "card";

      card.onclick = function() {

        location.href =
          `detail.html?id=${flight.id}`;

      };


      card.innerHTML = `

        <img
          src="${flight.image || ''}"
          class="ticket-image"
          alt="登机牌"
          data-preview="${flight.image || ''}"
        >

        <span class="tag">
          ${flight.airline || "Unknown Airline"}
        </span>

        <h3>
          ${flight.flight || ""}
        </h3>

        <p>
          📍 ${flight.airport || ""}
        </p>

        <p>
          📅 ${flight.date || ""}
        </p>

        <p>
          👤 上传者：${flight.username || "匿名用户"}
        </p>

        <p class="story">
          ${flight.story || ""}
        </p>

      `;

      museum.appendChild(card);

    }
  );

}


// =====================
// 启动
// =====================

loadFlights();


// =====================================
// GALLERY IMAGE PREVIEW
// =====================================

document.addEventListener(
"click",
e=>{

    const img =
        e.target.closest(
            ".ticket-image"
        );


    if(
        img &&
        img.dataset.preview
    ){

        e.stopPropagation();

        openImagePreview(
            img.dataset.preview
        );

    }

});

