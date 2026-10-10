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
    try { sessionStorage.setItem("bpmImageEditorWatermarkSettings", JSON.stringify({...watermarkSettings(), maxImageMB: document.getElementById("imageCompressionLimit")?.value || "4"})); } catch {}
  };
  const persistImage = async (key, legacyKey, options) => {
    const blob = await window.bpmExportEditorBlob?.(options);
    if (!blob) throw Error("无法导出图片，请重新选择图片后重试");
    // Keep a small, independently readable fallback before navigating. Some
    // mobile browsers evict or block IndexedDB between page loads.
    const fallbackBlob = await window.bpmExportEditorBlob?.({ maxEdge: 1200, maxBytes: 900 * 1024, type: "image/jpeg", quality: 0.68 });
    if (!fallbackBlob) throw Error("无法准备图片暂存副本，请重新选择图片后重试");
    const fallback = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("图片暂存失败")); reader.readAsDataURL(fallbackBlob);
    });
    try { sessionStorage.setItem(legacyKey, fallback); }
    catch { throw Error("浏览器暂存空间不足，请先压缩或缩小图片后重试"); }
    try {
      if (!window.bpmImageHandoff) throw Error("IndexedDB unavailable");
      await window.bpmImageHandoff.set(key, blob);
      return;
    } catch {
      // The small sessionStorage copy is already ready for the next page.
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
    const sourceStatus=document.getElementById("imageEditorSourceStatus"),sourcePicker=document.getElementById("ticketImage");
    const showPicker=()=>{if(sourceStatus)sourceStatus.hidden=false;};
    window.addEventListener("bpm-image-source-ready",()=>{if(sourceStatus)sourceStatus.hidden=true;});
    document.getElementById("reselectEditorImage")?.addEventListener("click",()=>sourcePicker?.click());
    window.setTimeout(()=>{if(!window.bpmGetEditorSource?.())showPicker();},1200);
    const limitInput=document.getElementById("imageCompressionLimit"),compressionStatus=document.getElementById("imageCompressionStatus");
    try{const saved=JSON.parse(sessionStorage.getItem("bpmImageEditorWatermarkSettings")||"{}");if(["2","3","4"].includes(saved.maxImageMB))limitInput.value=saved.maxImageMB;}catch{}
    limitInput?.addEventListener("change",saveWatermarkSettings);
    document.getElementById("previewImageCompression")?.addEventListener("click",async event=>{
      const button=event.currentTarget;button.disabled=true;
      try{const maxBytes=Number(limitInput?.value||4)*1024*1024,blob=await window.bpmExportEditorBlob?.({maxEdge:2600,type:"image/jpeg",quality:.9,maxBytes});if(!blob)throw Error("请先选择图片");compressionStatus.textContent=`压缩预览：${(blob.size/1024/1024).toFixed(2)} MB，符合 ${limitInput.value} MB 上限。`;}
      catch(error){compressionStatus.textContent=error.message;}
      finally{button.disabled=false;}
    });
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
        await persistImage("result", "bpmImageEditorResult", { maxEdge: 2600, type: "image/jpeg", quality: 0.9, maxBytes: Number(limitInput?.value||4)*1024*1024 });
        try { sessionStorage.removeItem("bpmImageEditorReturn"); } catch {}
        location.replace(returnTo);
      } catch (error) {
        notify(error.message);
        button.disabled = false;
      }
    });
  }
})();
