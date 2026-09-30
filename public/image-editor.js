(() => {
  const path = location.pathname;
  const openButton = document.getElementById("openImageEditor");
  const notify = message => {
    let node = document.getElementById("imageEditorMessage");
    if (!node) {
      node = document.createElement("p");
      node.id = "imageEditorMessage";
      node.setAttribute("role", "status");
      document.body.prepend(node);
    }
    node.textContent = message;
  };
  const watermarkSettings = () => ({
    font: document.getElementById("watermarkFont")?.value || "inter",
    size: document.getElementById("watermarkSize")?.value || "40",
    position: document.getElementById("watermarkPosition")?.value || "bottom-right"
  });
  const saveWatermarkSettings = () => {
    sessionStorage.setItem("bpmImageEditorWatermarkSettings", JSON.stringify(watermarkSettings()));
  };

  // iOS Safari has a small per-tab storage quota. The editor exports PNGs that
  // can exceed it and make navigation appear to do nothing. Resize a flattened
  // (privacy masks already burned in) copy before passing it between pages.
  const compactForMobileStorage = dataUrl => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxEdge = 2200;
      const ratio = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      canvas.getContext("2d", { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
      try { resolve(canvas.toDataURL("image/jpeg", 0.94)); } catch (error) { reject(error); }
    };
    image.onerror = () => reject(Error("图片读取失败，请重新选择图片"));
    image.src = dataUrl;
  });

  openButton?.addEventListener("click", async () => {
    if (!window.bpmImageEditorReady?.()) {
      notify("请先应用或取消当前裁剪框");
      return;
    }
    openButton.disabled = true;
    try {
      const source = window.bpmGetEditorSource?.();
      if (!source) throw Error("请先选择一张图片");
      const image = window.bpmExportEditorImage?.();
      if (!image) throw Error("读取图片失败");
      sessionStorage.setItem("bpmImageEditorSource", await compactForMobileStorage(image));
      sessionStorage.setItem("bpmImageEditorReturn", location.href);
      saveWatermarkSettings();
      location.href = "image-editor.html";
    } catch (error) {
      notify(error.name === "QuotaExceededError" ? "图片仍过大，请先缩小图片后再打开编辑器" : error.message);
      openButton.disabled = false;
    }
  });

  if (path.endsWith("/image-editor.html")) {
    document.getElementById("applyImageEditorResult")?.addEventListener("click", async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        if (!window.bpmGetEditorSource?.()) throw Error("没有收到投稿图片，请返回投稿页重新打开编辑器");
        if (!window.bpmImageEditorReady?.()) throw Error("请先应用或取消裁剪框");
        const image = await compactForMobileStorage(window.bpmExportEditorImage());
        const returnTo = sessionStorage.getItem("bpmImageEditorReturn") || "submit.html";
        saveWatermarkSettings();
        sessionStorage.removeItem("bpmImageEditorReturn");
        sessionStorage.setItem("bpmImageEditorResult", image);
        location.replace(returnTo);
      } catch (error) {
        notify(error.message);
        button.disabled = false;
      }
    });
  }
})();
