/* Блок 8. Три кита: прожектор и один пункт под картинкой.
   Если сцена влезает в окно, секция получает класс pin: сцена закреплена, прогресс скролла по .wh-run
   по очереди переводит свет с кита на кита (с паузой на каждом), под картинкой меняется пункт.
   Клик или тап по киту переводит свет к нему; пока посетитель сам выбрал кита, скролл его не перебивает,
   пока заметно не уйдёт дальше. Если сцена не влезает, прогресс задаёт положение картинки в окне.
   При prefers-reduced-motion скрипт не запускается: всё освещено, пункты списком. */
(function(){
  'use strict';
  var sec=document.getElementById('how');
  if(!sec||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var img=sec.querySelector('.wh-img'),run=sec.querySelector('.wh-run'),items=[].slice.call(sec.querySelectorAll('.wh-it'));
  var hits=[].slice.call(sec.querySelectorAll('.wh-hit button'));
  if(!run||items.length!==3||hits.length!==items.length)return;

  var C=[15.5,48,80];            /* центры китов в % ширины картинки */
  function cl(v,a,b){return v<a?a:v>b?b:v}
  function sm(t){t=cl(t,0,1);return t*t*(3-2*t)}
  function vh(){return window.vmVH||innerHeight}

  var win=sec.querySelector('.wh-in'),pic=sec.querySelector('.wh-pic'),header=document.querySelector('.hdr');
  var compact=matchMedia('(max-width:720px), (min-width:560px) and (max-height:660px)');
  var pin=false,hb=0;
  function layout(){
    pic.style.removeProperty('--wh-width');
    hb=header?header.offsetHeight:0;
    var available=vh()-hb-(compact.matches?24:64)-2;
    var picture=pic.getBoundingClientRect(),maxWidth=(available-win.offsetHeight+picture.height)*1100/585;
    pin=maxWidth>=picture.width*.55;
    if(pin&&maxWidth<picture.width)pic.style.setProperty('--wh-width',Math.floor(maxWidth)+'px');
    pin=pin&&win.offsetHeight<=available;
    if(!pin)pic.style.removeProperty('--wh-width');
    sec.classList.toggle('pin',pin);
  }
  function progress(){
    var available=vh()-hb;
    if(pin){
      var r=run.getBoundingClientRect();
      return cl((hb-r.top)/Math.max(1,r.height-available),0,1);
    }
    var box=pic.getBoundingClientRect(),center=box.top+box.height/2;
    return cl((hb+available*.86-center)/Math.max(1,available*.7),0,1);
  }
  function scrollTarget(p){
    var s=cl(p/.86,0,1)*2,i=Math.floor(s),f=s-i;
    if(i>=2)return 2;
    return i+sm((f-.5)/.5);
  }

  var q=0,goal=0,raf=0,last=0,act=-1,manual=false,anchor=0;
  function draw(){
    var i=Math.floor(q),f=q-i,x=i>=2?C[2]:C[i]+(C[i+1]-C[i])*f;
    img.style.setProperty('--sx',x.toFixed(2));
    var a=Math.round(q);
    if(a!==act){
      act=a;items.forEach(function(t,k){
        t.classList.toggle('on',k===a);
        hits[k].setAttribute('aria-pressed',k===a?'true':'false');
      });
    }
  }
  function tick(now){
    var dt=Math.min(64,now-(last||now));last=now;
    q+=(goal-q)*(1-Math.pow(1-.1,dt/16.7));
    if(Math.abs(goal-q)<.002)q=goal;
    draw();
    raf=q===goal?(last=0,0):requestAnimationFrame(tick);
  }
  function go(v){if(v===goal)return;goal=v;if(!raf){last=0;raf=requestAnimationFrame(tick)}}
  var scrollFrame=0;
  function kick(){
    scrollFrame=0;
    var p=progress();
    if(manual){if(Math.abs(p-anchor)<.16)return;manual=false}
    go(scrollTarget(p));
  }

  hits.forEach(function(h,k){
    h.addEventListener('click',function(){
      manual=true;anchor=progress();go(k);
    });
  });

  sec.classList.add('js');
  layout();q=goal=scrollTarget(progress());draw();
  function schedule(){if(!scrollFrame)scrollFrame=requestAnimationFrame(kick)}
  addEventListener('scroll',schedule,{passive:true});
  var w=innerWidth,h=vh();
  function re(){w=innerWidth;h=vh();layout();schedule()}
  function resize(){if(innerWidth!==w||vh()!==h)re()}
  addEventListener('resize',resize);
  addEventListener('vmviewport',resize);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(re);
  addEventListener('load',re);
})();
