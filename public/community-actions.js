(() => {
  const api='https://api.bpmuseum.org.cn';
  document.addEventListener('click',async event=>{
    const report=event.target.closest('[data-report-id]'),hide=event.target.closest('[data-hide-id]');
    if(!report&&!hide)return;
    try {
      const session=await fetch(`${api}/api/session`);if(!session.ok){location.href='login.html';return;}
      const actor=await session.json();
      const dialog=document.createElement('dialog');dialog.className='bpm-dialog';
      dialog.innerHTML=`<form method="dialog"><h2>${report?'举报内容':'临时下架内容'}</h2>${report?'<label>举报分类<select name="category"><option>涉黄涉政</option><option>虚假误导</option><option>侵犯隐私/版权</option><option>恶意灌水或骚扰</option></select></label>':'<label>违反条款<input name="clause" required placeholder="例如：社区条例三、2（4）"></label>'}<label>理由<textarea name="reason" rows="4" maxlength="1000" required></textarea></label><p role="status"></p><button value="cancel" formnovalidate>取消</button><button value="submit">提交</button></form>`;
      document.body.appendChild(dialog);dialog.showModal();
      dialog.querySelector('form').addEventListener('submit',async e=>{
        if(e.submitter.value==='cancel')return;e.preventDefault();e.submitter.disabled=true;
        const values=new FormData(e.target);
        const body={target_type:report?report.dataset.reportType:hide.dataset.hideType,target_id:Number(report?report.dataset.reportId:hide.dataset.hideId),reason:values.get('reason'),category:values.get('category'),clause:values.get('clause'),severity:'temporary',status:'hidden'};
        const path=report?'/api/community/report':actor.role==='superadministrator'?'/api/sa/community/moderate':'/api/admin/community/hide';
        try {const res=await fetch(api+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw Error(data.error);dialog.close();if(hide)location.reload();else alert('举报已提交，等待 SA 核查');}
        catch(error){dialog.querySelector('[role=status]').textContent=error.message;e.submitter.disabled=false;}
      });
      dialog.addEventListener('close',()=>dialog.remove());
    }catch{alert('操作失败，请稍后再试');}
  });
})();
