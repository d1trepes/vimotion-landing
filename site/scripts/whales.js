/* Блок 8. Три кита: прожектор и один пункт под картинкой.
   Если сцена влезает в окно, секция получает класс pin: сцена закреплена, прогресс скролла по .wh-run
   по очереди переводит свет с кита на кита (с паузой на каждом), под картинкой меняется пункт.
   Клик или тап по киту переводит свет к нему; пока посетитель сам выбрал кита, скролл его не перебивает,
   пока заметно не уйдёт дальше. Если сцена не влезает, свет сам переходит каждые 4,5 с, пока блок на экране.
   При prefers-reduced-motion скрипт не запускается: всё освещено, пункты списком. */
(function(){
  'use strict';
  var sec=document.getElementById('how');
  if(!sec||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var img=sec.querySelector('.wh-img'),run=sec.querySelector('.wh-run'),items=[].slice.call(sec.querySelectorAll('.wh-it'));
  var hits=[].slice.call(sec.querySelectorAll('.wh-hit i'));
  if(!run||items.length!==3)return;

  var C=[15.5,48,80];            /* центры китов в % ширины картинки */
  function cl(v,a,b){return v<a?a:v>b?b:v}
  function sm(t){t=cl(t,0,1);return t*t*(3-2*t)}
  function vh(){return window.vmVH||innerHeight}

  var pin=false;
  function layout(){
    sec.classList.remove('pin');
    pin=sec.querySelector('.wh-in').offsetHeight+64<=vh();
    sec.classList.toggle('pin',pin);
  }
  function scrollTarget(){
    var r=run.getBoundingClientRect(),len=r.height-vh();
    var p=len>0?cl(-r.top/len,0,1):0;
    var s=cl(p/.86,0,1)*2,i=Math.floor(s),f=s-i;
    if(i>=2)return 2;
    return i+sm((f-.5)/.5);
  }

  var q=0,goal=0,raf=0,last=0,act=-1,manual=false,anchor=0;
  function draw(){
    var i=Math.floor(q),f=q-i,x=i>=2?C[2]:C[i]+(C[i+1]-C[i])*f;
    img.style.setProperty('--sx',x.toFixed(2));
    var a=Math.round(q);
    if(a!==act){act=a;items.forEach(function(t,k){t.classList.toggle('on',k===a)})}
  }
  function tick(now){
    var dt=Math.min(64,now-(last||now));last=now;
    q+=(goal-q)*(1-Math.pow(1-.1,dt/16.7));
    if(Math.abs(goal-q)<.002)q=goal;
    draw();
    raf=q===goal?(last=0,0):requestAnimationFrame(tick);
  }
  function go(v){goal=v;if(!raf){last=0;raf=requestAnimationFrame(tick)}}
  function kick(){
    if(!pin)return;
    var t=scrollTarget();
    if(manual){if(Math.abs(t-anchor)<.6)return;manual=false}
    go(t);
  }

  /* автосмена, если сцена не закреплена */
  var auto=null,near=false;
  function autoRun(){
    clearInterval(auto);auto=null;
    if(pin||!near)return;
    auto=setInterval(function(){if(!document.hidden)go((Math.round(goal)+1)%3)},4500);
  }

  hits.forEach(function(h,k){
    h.addEventListener('click',function(){
      manual=true;anchor=pin?scrollTarget():0;go(k);
      if(!pin)autoRun();   /* после выбора отсчёт начинается заново */
    });
  });

  sec.classList.add('js');
  layout();q=goal=pin?scrollTarget():0;draw();
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){near=es[0].isIntersecting;if(near)kick();autoRun()},{rootMargin:'0px 0px -20% 0px'}).observe(sec);
  addEventListener('scroll',kick,{passive:true});
  var w=innerWidth;
  function re(){layout();kick();autoRun()}
  addEventListener('resize',function(){if(innerWidth!==w||!matchMedia('(pointer:coarse)').matches){w=innerWidth;re()}});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(re);
  addEventListener('load',re);
})();
