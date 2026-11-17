/* Прелоадер-спидометр, привязан к реальной загрузке: шрифты, постер, вордмарк, canplaythrough видео.
   Стрелка 0→320 не быстрее 1,7 с, плавно встаёт на 320, через 0,25 с шторка вверх.
   Если загрузка дольше 4 с, сайт открывается всё равно. По окончании шлёт событие vm:open. */
(function(){
  'use strict';
  var root=document.documentElement;
  if(!root.classList.contains('is-loading'))return;
  var svg=document.getElementById('gsvg');
  if(!svg){open();return}

  /* ---------- шкала ---------- */
  var CX=200,CY=200,R=150,MAX=320,A0=225,SWEEP=270;
  function ang(v){return (A0-v/MAX*SWEEP)*Math.PI/180}
  function pt(v,r){return [CX+r*Math.cos(ang(v)),CY-r*Math.sin(ang(v))]}
  function arc(v1,v2,r){var a=pt(v1,r),c=pt(v2,r),large=(v2-v1)/MAX*SWEEP>180?1:0;
    return 'M'+a[0].toFixed(2)+' '+a[1].toFixed(2)+'A'+r+' '+r+' 0 '+large+' 1 '+c[0].toFixed(2)+' '+c[1].toFixed(2)}
  var g='<path d="'+arc(0,MAX,R+6)+'" fill="none" stroke="#DCD2C8" stroke-width="16" stroke-linecap="butt"/>';
  g+='<path d="'+arc(0,MAX,R)+'" fill="none" stroke="#111" stroke-width="6"/>';
  g+='<path id="redzone" d="'+arc(240,MAX,R+6)+'" fill="none" stroke="#9A0002" stroke-width="15"/>';
  for(var v=0;v<=MAX;v+=20){
    var major=v%40===0,a=pt(v,R-3),c=pt(v,R-(major?22:13));
    g+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+c[0]+'" y2="'+c[1]+'" stroke="#111" stroke-width="'+(major?4:2)+'" stroke-linecap="round"/>';
    if(major){var t=pt(v,R-42);g+='<text x="'+t[0]+'" y="'+t[1]+'" text-anchor="middle" dominant-baseline="central" font-family="Inter Tight,Arial" font-weight="700" font-size="15" fill="#111">'+v+'</text>'}
  }
  g+='<g id="needle"><path d="M'+(CX-5)+' '+CY+' L'+CX+' '+(CY-2.2)+' L'+(CX+R-14)+' '+CY+' L'+CX+' '+(CY+2.2)+'Z" fill="#9A0002"/></g>';
  g+='<text id="gnum" x="'+CX+'" y="'+(CY+78)+'" text-anchor="middle" font-family="Inter Tight,Arial" font-weight="900" font-size="68" letter-spacing="-2.5" fill="#111">000</text>';
  g+='<text x="'+CX+'" y="'+(CY+104)+'" text-anchor="middle" font-family="Inter Tight,Arial" font-weight="700" font-size="12" letter-spacing="2.6" fill="#9A0002">KM/H</text>';
  g+='<circle cx="'+CX+'" cy="'+CY+'" r="13" fill="none" stroke="#111" stroke-width="1.5"/><circle cx="'+CX+'" cy="'+CY+'" r="8.5" fill="#111"/>';
  svg.innerHTML=g;
  var gnum=document.getElementById('gnum'),needle=document.getElementById('needle'),red=document.getElementById('redzone');
  var redLen=red.getTotalLength();red.style.strokeDasharray=redLen;
  function setGauge(val){
    needle.setAttribute('transform','rotate('+(-(A0-val/MAX*SWEEP))+' '+CX+' '+CY+')');
    gnum.textContent=String(Math.round(val)).padStart(3,'0');
    var p=Math.max(0,Math.min(1,(val-240)/80));red.style.strokeDashoffset=redLen*(1-p);
  }
  setGauge(0);

  /* ---------- реальная загрузка ---------- */
  function imgReady(img){
    return new Promise(function(res){
      if(!img||(img.complete&&img.naturalWidth))return res();
      img.addEventListener('load',function(){res()},{once:true});
      img.addEventListener('error',function(){res()},{once:true});
    });
  }
  function fontsReady(){
    if(!document.fonts)return Promise.resolve();
    return Promise.all([
      document.fonts.load('900 1em "Fira XC"'),
      document.fonts.load('700 1em "Inter Tight"'),
      document.fonts.load('400 1em "Inter"')
    ]).catch(function(){}).then(function(){return document.fonts.ready});
  }
  var tasks=[
    fontsReady(),
    imgReady(document.querySelector('.pt img')),
    imgReady(document.querySelector('.wm img'))
    /* видео не ждём: пока оно грузится, виден постер, живое фото включается само, когда готово.
       Раньше ждали полной загрузки ролика, и в Telegram на мобильном интернете прелоадер висел до 4 с */
  ];
  var done=0,ready=false;
  tasks.forEach(function(p){p.then(function(){done++})});
  Promise.all(tasks).then(function(){ready=true});
  setTimeout(function(){ready=true},2500);

  /* ---------- стрелка ---------- */
  var T=1700,t0=null,last=0,p=0,settled=null;
  function ease(k){return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2}
  function tick(now){
    if(t0===null){t0=now+250;last=now}
    var dt=Math.min(.05,(now-last)/1000);last=now;
    var k=Math.max(0,Math.min(1,(now-t0)/T));
    var target=ease(k);                                   // не быстрее 1,7 с
    if(!ready)target=Math.min(target,.12+.7*done/tasks.length); // пока грузится, не доходит до красной зоны
    if(target>p)p+=(target-p)*Math.min(1,dt*9);           // плавное догоняние, без перелёта
    if(ready&&k>=1&&1-p<.002)p=1;
    setGauge(p*MAX);
    if(p===1){
      if(settled===null)settled=now;
      if(now-settled>=250){open();return}
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function open(){
    root.classList.add('is-leaving');
    document.dispatchEvent(new Event('vm:open'));
    setTimeout(function(){root.classList.remove('is-leaving')},1100);
  }
})();
