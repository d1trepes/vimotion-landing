/* Блок 8. Три кита: прожектор
   Десктоп (сцена влезает в окно): секция получает класс pin, сцена закреплена, прогресс скролла по .wh-run
   по очереди переводит свет с кита на кита, с паузой на каждом.
   Телефон или низкое окно: закреплена только картинка, активен пункт, ближайший к линии чуть ниже картинки.
   Свет переезжает плавно (инерция). При prefers-reduced-motion скрипт не запускается: всё освещено. */
(function(){
  'use strict';
  var sec=document.getElementById('how');
  if(!sec||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var img=sec.querySelector('.wh-img'),run=sec.querySelector('.wh-run'),stage=sec.querySelector('.wh-stage'),pic=sec.querySelector('.wh-pic');
  var tags=[].slice.call(sec.querySelectorAll('.wh-tag')),items=[].slice.call(sec.querySelectorAll('.wh-it'));
  if(!run||items.length!==3)return;

  var C=[15.5,48,80];            /* центры китов в % ширины картинки, как --c1..--c3 в CSS */
  function cl(v,a,b){return v<a?a:v>b?b:v}
  function sm(t){t=cl(t,0,1);return t*t*(3-2*t)}
  function vh(){return window.vmVH||innerHeight}

  var pin=false;
  function layout(){
    /* закрепляем всю сцену только на широком экране и если она целиком влезает в окно */
    sec.classList.remove('pin');
    var can=innerWidth>900&&sec.querySelector('.wh-in').offsetHeight+80<=vh();
    pin=can;sec.classList.toggle('pin',pin);
  }

  /* цель: дробный индекс кита 0..2 */
  function target(){
    if(pin){
      var r=run.getBoundingClientRect(),len=r.height-vh();
      var p=len>0?cl(-r.top/len,0,1):0;
      var s=cl(p/.86,0,1)*2,i=Math.floor(s),f=s-i;
      if(i>=2)return 2;
      return i+sm((f-.5)/.5);   /* полшага пауза на ките, полшага переезд */
    }
    /* поток (телефон): прогресс от момента, когда список подъехал под закреплённую картинку,
       до момента, когда низ секции дошёл до низа окна */
    var list=items[0].parentNode,lt=list.getBoundingClientRect().top,pb=innerWidth<=900&&pic?pic.getBoundingClientRect().bottom:vh()*.35;
    var sb=sec.getBoundingClientRect().bottom,a=lt-pb,b=sb-vh();
    if(b<=a)return a>0?0:2;
    var u=cl(-a/(b-a),0,1)*2,j=Math.floor(u),g=u-j;
    return j>=2?2:j+sm((g-.35)/.3);
  }
  var q=1,goal=1,raf=0,last=0,act=-1;
  function draw(){
    var i=Math.floor(q),f=q-i,x=i>=2?C[2]:C[i]+(C[i+1]-C[i])*f;
    img.style.setProperty('--sx',x.toFixed(2));
    var a=Math.round(q);
    if(a!==act){
      act=a;
      tags.forEach(function(t,k){t.classList.toggle('on',k===a)});
      items.forEach(function(t,k){t.classList.toggle('on',k===a)});
    }
  }
  function tick(now){
    var dt=Math.min(64,now-(last||now));last=now;
    var k=1-Math.pow(1-.1,dt/16.7);
    q+=(goal-q)*k;
    if(Math.abs(goal-q)<.002)q=goal;
    draw();
    raf=q===goal?(last=0,0):requestAnimationFrame(tick);
  }
  function kick(){goal=target();if(!raf){last=0;raf=requestAnimationFrame(tick)}}

  sec.classList.add('js');
  layout();q=goal=target();draw();
  var near=true;
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){near=es[0].isIntersecting;if(near)kick()},{rootMargin:'50% 0px'}).observe(sec);
  addEventListener('scroll',function(){if(near)kick()},{passive:true});
  var w=innerWidth;
  addEventListener('resize',function(){if(innerWidth!==w||!matchMedia('(pointer:coarse)').matches){w=innerWidth;layout();kick()}});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){layout();kick()});
  addEventListener('load',function(){layout();kick()});
})();
