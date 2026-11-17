/* Блок 6. Коробка передач
   Сцена закреплена (sticky), прогресс скролла по .gb-run выбирает передачу 1-5.
   Ручка едет по прорезям кулисы по одной ломаной (координаты прорезей сняты с фото 1672×941),
   красная подсветка раскрывается по той же ломаной. На каждой новой передаче лёгкий «щелчок».
   При prefers-reduced-motion скрипт не запускается: в разметке финальное состояние. */
(function(){
  'use strict';
  var sec=document.getElementById('ladder');
  if(!sec||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var run=sec.querySelector('.gb-run'),knob=sec.querySelector('.gb-knob'),
      lines=[].slice.call(sec.querySelectorAll('.gb-trail .rv')),items=[].slice.call(sec.querySelectorAll('.gb-l'));
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
  function place(s){
    var p=at(s);knob.style.left=(p[0]/W*100)+'%';knob.style.top=(p[1]/H*100)+'%';
    lines.forEach(function(l){l.style.strokeDashoffset=TOTAL-s});
  }

  var gear=0,s=0,anim=0;
  function mark(g){items.forEach(function(it,i){it.classList.toggle('on',i<g);it.classList.toggle('cur',i===g-1)})}
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
  function shift(g){
    if(g===gear)return;gear=g;mark(g);
    var from=s,to=GEAR[g-1],d=Math.abs(to-from),dur=Math.min(1100,320+d*.28),t0=performance.now();
    cancelAnimationFrame(anim);
    (function step(now){
      var k=Math.min(1,(now-t0)/dur);s=from+(to-from)*ease(k);place(s);
      if(k<1)anim=requestAnimationFrame(step);
      else{knob.classList.remove('clunk');void knob.offsetWidth;knob.classList.add('clunk')}
    })(t0);
  }
  function progress(){
    var r=run.getBoundingClientRect(),len=r.height-innerHeight;
    var p=len>0?Math.max(0,Math.min(1,-r.top/len)):1;
    return 1+Math.min(4,Math.floor(p*5));
  }

  sec.classList.add('js');
  /* старт: если блок уже прокручен, сразу ставим нужную передачу без анимации */
  gear=progress();s=GEAR[gear-1];place(s);mark(gear);

  var ticking=false;
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(function(){ticking=false;shift(progress())})}},{passive:true});
  addEventListener('resize',function(){shift(progress())});
})();
