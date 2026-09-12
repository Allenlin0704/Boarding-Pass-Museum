window.bpmAskRejectReason=()=>new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='bpm-dialog';
  dialog.innerHTML='<form method="dialog"><h2>拒绝展品</h2><p>请引用《投稿及审核条例》并说明具体问题。</p><label>条例章节<select name="clause"><option>投稿基本要求</option><option>隐私守护规范</option><option>审核流程</option></select></label><label>具体条款及问题<textarea name="reason" rows="4" maxlength="1800" required placeholder="例如：姓名必须遮挡；图片中的姓名仍然可见。"></textarea></label><p><a href="rules.html" target="_blank" rel="noopener">查阅完整条例</a></p><button value="cancel" formnovalidate>取消</button><button value="reject">确认拒绝</button></form>';
  document.body.appendChild(dialog);dialog.showModal();
  dialog.addEventListener('close',()=>{const values=new FormData(dialog.querySelector('form'));resolve(dialog.returnValue==='reject'?`【${values.get('clause')}】${String(values.get('reason')).trim()}`:null);dialog.remove();});
});
