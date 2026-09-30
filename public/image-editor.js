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
    try { sessionStorage.setItem("bpmImageEditorWatermarkSettings", JSON.stringify(watermarkSettings())); } catch {}
  };
  const persistImage = async (key, legacyKey, options) => {
    const blob = await window.bpmExportEditorBlob?.(options);
    if (!blob) throw Error("无法导出图片，请重新选择图片后重试");
    try {
      if (!window.bpmImageHandoff) throw Error("IndexedDB unavailable");
      await window.bpmImageHandoff.set(key, blob);
      sessionStorage.removeItem(legacyKey);
      return;
    } catch {
      // Older/private browsing modes may disable IndexedDB. Keep a smaller
      // JPEG fallback for browsers that still support sessionStorage.
      const fallback = window.bpmExportEditorImage?.({
        maxEdge: Math.min(Number(options.maxEdge) || 1600, 1600),
        type: "image/jpeg",
        quality: 0.78
      });
      if (!fallback) throw Error("当前浏览器无法暂存图片，请改用较小的图片后重试");
      sessionStorage.setItem(legacyKey, fallback);
    }
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
      // A Blob avoids base64's size overhead and the small sessionStorage
      // quota that used to keep large phone photos from opening the editor.
      try { sessionStorage.removeItem("bpmImageEditorSource"); } catch {}
      await window.bpmImageHandoff?.remove("source").catch(() => {});
      try { sessionStorage.setItem("bpmImageEditorReturn", location.href); } catch {}
      saveWatermarkSettings();
      await persistImage("source", "bpmImageEditorSource", { maxEdge: 2400, type: "image/jpeg", quality: 0.92 });
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
        let returnTo = "submit.html";
        try { returnTo = sessionStorage.getItem("bpmImageEditorReturn") || returnTo; } catch {}
        saveWatermarkSettings();
        try { sessionStorage.removeItem("bpmImageEditorResult"); } catch {}
        await window.bpmImageHandoff?.remove("result").catch(() => {});
        await persistImage("result", "bpmImageEditorResult", { maxEdge: 2600, type: "image/jpeg", quality: 0.94 });
        try { sessionStorage.removeItem("bpmImageEditorReturn"); } catch {}
        location.replace(returnTo);
      } catch (error) {
        notify(error.message);
        button.disabled = false;
      }
    });
  }
})();
