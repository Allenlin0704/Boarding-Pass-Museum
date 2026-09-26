(() => {
  const hero=document.querySelector('.auth-photo-hero');
  if(!hero)return;

  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date());
  const datePart=key=>Number(parts.find(part=>part.type===key)?.value);
  const day=Math.floor(Date.UTC(datePart('year'),datePart('month')-1,datePart('day'))/86400000);
  const photo=String(((day%7)+7)%7+1).padStart(2,'0');
  hero.style.setProperty('--auth-cover',`url("/assets/auth-covers/${photo}.jpg")`);
  hero.dataset.photoDay=`${datePart('year')}-${String(datePart('month')).padStart(2,'0')}-${String(datePart('day')).padStart(2,'0')}`;
})();
