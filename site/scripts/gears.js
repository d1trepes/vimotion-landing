/* Блок 6. Коробка передач
   Сцена закреплена (sticky), прогресс скролла по .gb-run плавно ведёт ручку: пауза на каждой передаче, переход между ними.
   Ручка едет по прорезям кулисы по одной ломаной (координаты прорезей сняты с фото 1672×941),
   неоновая подсветка раскрывается по той же ломаной. Ручка догоняет скролл с инерцией и мягко встаёт в передачу (без «щелчка»).
   При prefers-reduced-motion скрипт не запускается: в разметке финальное состояние. */
(function(){
  'use strict';
  var sec=document.getElementById('ladder');
  if(!sec||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var run=sec.querySelector('.gb-run'),knob=sec.querySelector('.gb-knob'),
      lines=[].slice.call(sec.querySelectorAll('.gb-trail polyline')),items=[].slice.call(sec.querySelectorAll('.gb-l'));
  if(!run||!knob||!lines.length)return;

  var W=1672,H=941,X1=303.5,X3=828,X5=1351,T=234,N=461,B=684;
  /* путь 1→2→3→4→5 через нейтраль */
  var P=[[X1,T],[X1,B],[X1,N],[X3,N],[X3,T],[X3,B],[X3,N],[X5,N],[X5,T]];
  var acc=[0];for(var i=1;i<P.length;i++)acc.push(acc[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
  var TOTAL=acc[acc.length-1];
  var GEAR=[0,acc[1],acc[4],acc[5],acc[8]];/* длина пути до передач 1..5 */
  lines.forEach(function(l){l.style.strokeDasharray=TOTAL+' '+TOTAL;l.style.strokeDashoffset=TOTAL});

  function at(s){
    for(var i=1;i<acc.length;i++)if(s<=acc[i]||i===acc.length-1){
      var k=(s-acc[i-1])/((acc[i]-acc[i-1])||1);k=Math.max(0,Math.min(1,k));
      return [P[i-1][0]+(P[i][0]-P[i-1][0])*k,P[i-1][1]+(P[i][1]-P[i-1][1])*k];
    }
  }
  /* размер кулисы меряем только при изменении окна, а не на каждом кадре (иначе браузер пересчитывает раскладку посреди анимации) */
  var bw=0,bh=0;
  function size(){var box=knob.parentNode;bw=box.clientWidth;bh=box.clientHeight}
  function place(s){
    var p=at(s);if(!bw)size();
    knob.style.setProperty('--kx',(p[0]/W*bw).toFixed(1)+'px');knob.style.setProperty('--ky',(p[1]/H*bh).toFixed(1)+'px');
    lines.forEach(function(l){l.style.strokeDashoffset=TOTAL-s});
  }

  /* скролл задаёт цель: на каждой передаче пауза, между ними плавный переход;
     ручка догоняет цель с инерцией, поэтому резкий прокрут не дёргает её */
  var DWELL=.4;
  function smooth(t){return t*t*(3-2*t)}
  function target(){
    var r=run.getBoundingClientRect(),len=r.height-(window.vmVH||innerHeight);
    var p=len>0?Math.max(0,Math.min(1,-r.top/len)):1,u=p*4,i=Math.min(3,Math.floor(u)),f=u-i;
    if(p>=1)return GEAR[4];
    var k=Math.max(0,Math.min(1,(f-DWELL/2)/(1-DWELL)));
    return GEAR[i]+(GEAR[i+1]-GEAR[i])*smooth(k);
  }
  var s=target(),goal=s,raf=0,last=0;
  function mark(){
    var reached=0;for(var j=0;j<5;j++)if(GEAR[j]<=s+40)reached=j;
    items.forEach(function(it,i){it.classList.toggle('on',i<=reached);it.classList.toggle('cur',i===reached)});
  }
  function tick(now){
    var dt=Math.min(64,now-(last||now));last=now;
    var k=1-Math.pow(1-.085,dt/16.7);
    /* инерция + предел скорости: даже при резком прокруте ручка едет ровно */
    var step=(goal-s)*k,vmax=1500*dt/1000;
    s+=Math.max(-vmax,Math.min(vmax,step));
    if(Math.abs(goal-s)<.4)s=goal;
    place(s);mark();
    raf=s!==goal?requestAnimationFrame(tick):(last=0,0);
  }
  function kick(){goal=target();if(!raf){last=0;raf=requestAnimationFrame(tick)}}

  sec.classList.add('js');
  place(s);mark();
  addEventListener('scroll',kick,{passive:true});
  addEventListener('resize',function(){size();place(s);kick()});
  if(window.ResizeObserver)new ResizeObserver(function(){size();place(s)}).observe(knob.parentNode);
})();
