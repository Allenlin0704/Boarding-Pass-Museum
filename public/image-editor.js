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

  openButton?.addEventListener("click", async () => {
    if (!window.bpmImageEditorReady?.()) {
      notify("请先应用或取消当前裁剪框");
      return;
    }
    openButton.disabled = true;
    try {
      const source = window.bpmGetEditorSource?.();
      if (!source) throw Error("请先选择一张图片");
      // Flatten at a phone-friendly resolution before serializing. Exporting
      // a full-size PNG first can exceed iOS Safari's memory/storage limits.
      const image = window.bpmExportEditorImage?.({ maxEdge: 2200, type: "image/jpeg", quality: 0.92 });
      if (!image) throw Error("读取图片失败");
      sessionStorage.removeItem("bpmImageEditorSource");
      sessionStorage.setItem("bpmImageEditorSource", image);
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
        const image = window.bpmExportEditorImage({ maxEdge: 2600, type: "image/jpeg", quality: 0.94 });
        const returnTo = sessionStorage.getItem("bpmImageEditorReturn") || "submit.html";
        saveWatermarkSettings();
        sessionStorage.removeItem("bpmImageEditorReturn");
        sessionStorage.removeItem("bpmImageEditorResult");
        sessionStorage.setItem("bpmImageEditorResult", image);
        location.replace(returnTo);
      } catch (error) {
        notify(error.message);
        button.disabled = false;
      }
    });
  }
})();
