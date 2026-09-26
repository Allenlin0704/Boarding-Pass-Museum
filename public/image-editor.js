(() => {
  const path=location.pathname,button=document.getElementById('openImageEditor');
  const notify=message=>{let node=document.getElementById('imageEditorMessage');if(!node){node=document.createElement('p');node.id='imageEditorMessage';node.setAttribute('role','status');document.body.prepend(node);}node.textContent=message;};
  if(button)button.addEventListener('click',()=>{
    if(!window.bpmImageEditorReady?.()){notify('请先应用或取消当前裁剪框');return;}
    try{if(!window.bpmGetEditorSource?.())throw Error('请先选择一张图片');const source=window.bpmExportEditorImage?.();if(!source)throw Error('读取图片失败');sessionStorage.setItem('bpmImageEditorSource',source);sessionStorage.setItem('bpmImageEditorReturn',location.href);location.href='image-editor.html';}catch(error){notify(error.message);}
  });
  if(path.endsWith('/image-editor.html'))document.getElementById('applyImageEditorResult')?.addEventListener('click',()=>{
    try{if(!window.bpmGetEditorSource?.())throw Error('没有收到投稿图片，请返回投稿页重新打开编辑器');if(!window.bpmImageEditorReady?.())throw Error('请先应用或取消裁剪框');const image=window.bpmExportEditorImage();const returnTo=sessionStorage.getItem('bpmImageEditorReturn')||'submit.html';sessionStorage.removeItem('bpmImageEditorReturn');sessionStorage.setItem('bpmImageEditorResult',image);location.replace(returnTo);}catch(error){notify(error.message);}
  });
})();
