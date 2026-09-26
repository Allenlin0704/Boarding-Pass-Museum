(() => {
  const heroes=document.querySelectorAll('.auth-photo-hero, .welcome');
  if(!heroes.length)return;

  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date());
  const datePart=key=>Number(parts.find(part=>part.type===key)?.value);
  const day=Math.floor(Date.UTC(datePart('year'),datePart('month')-1,datePart('day'))/86400000);
  const photo=String(((day%7)+7)%7+1).padStart(2,'0');
  const cover=`url("/assets/auth-covers/${photo}.jpg")`;
  const date=`${datePart('year')}-${String(datePart('month')).padStart(2,'0')}-${String(datePart('day')).padStart(2,'0')}`;
  heroes.forEach(hero=>{
    hero.style.setProperty('--auth-cover',cover);
    hero.dataset.photoDay=date;
  });
  document.documentElement.style.setProperty('--auth-cover',cover);
  if(document.querySelector('.auth-page')) document.body.classList.add('auth-photo-background');
})();
