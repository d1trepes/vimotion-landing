/* Блок 2. Это сделали люди без опыта
   1) Наезд на hero: пока блок едет поверх липкого hero, hero темнеет (--cover на самом hero: на <html> он пересчитывал стили всей страницы каждый кадр);
      когда закрыт целиком, прячется и живое видео ставится на паузу.
   2) Вау-момент: рамка видоискателя с REC переезжает с человека на человека,
      тот, на ком рамка, цветной. Сама идёт по кругу, пока блок на экране;
      на наведение или фокус встаёт на выбранного человека.
   На телефоне рамка встаёт на человека по касанию.
   Без JS и при prefers-reduced-motion все фото цветные, рамки нет. */
(function(){
  'use strict';
  var root=document.documentElement,sec=document.getElementById('people'),hero=document.getElementById('hero');
  if(!sec)return;

  /* ---------- наезд ---------- */
  var cov=-1,hidden=false,tick=0;
  function cover(){
    tick=0;
    var top=sec.getBoundingClientRect().top,vh=window.vmVH||innerHeight||1;
    var p=Math.max(0,Math.min(1,1-top/vh));
    p=Math.round(p*100)/100;
    if(p!==cov){cov=p;(hero||root).style.setProperty('--cover',p)}
    var h=top<=0;
    if(h!==hidden){
      hidden=h;root.classList.toggle('hero-covered',h);
      if(window.vmLive&&window.vmLive.cover)window.vmLive.cover(h);
    }
  }
  function onScroll(){if(!tick)tick=requestAnimationFrame(cover)}
  if(hero){addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);cover()}

  /* ---------- видоискатель ---------- */
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var row=sec.querySelector('.ppl-row'),cards=[].slice.call(sec.querySelectorAll('.pc'));
  if(!row||!cards.length)return;
  var vf=document.createElement('span');vf.className='vf';vf.setAttribute('aria-hidden','true');
  row.appendChild(vf);
  sec.classList.add('is-vf');

  var cur=-1,timer=0,inView=false,hover=false,resume=0,STEP=2400;

  /* прямоугольник фото карточки относительно ряда (у двойной: обе фотографии) */
  function box(i){
    var imgs=cards[i].querySelectorAll('.ph img'),r=row.getBoundingClientRect(),
        L=1e9,T=1e9,R=-1e9,B=-1e9;
    for(var k=0;k<imgs.length;k++){
      var b=imgs[k].getBoundingClientRect();
      L=Math.min(L,b.left);T=Math.min(T,b.top);R=Math.max(R,b.right);B=Math.max(B,b.bottom);
    }
    return {x:L-r.left,y:T-r.top,w:R-L,h:B-T};
  }
  function place(jump){
    if(cur<0)return;
    var b=box(cur);
    vf.classList.toggle('jump',!!jump);
    vf.style.transform='translate('+b.x.toFixed(1)+'px,'+b.y.toFixed(1)+'px)';
    vf.style.width=b.w.toFixed(1)+'px';vf.style.height=b.h.toFixed(1)+'px';
    if(jump){void vf.offsetWidth;vf.classList.remove('jump')}
  }
  function go(i,jump){
    i=(i+cards.length)%cards.length;
    if(i===cur)return;
    if(cur>=0)cards[cur].classList.remove('on');
    var first=cur<0;cur=i;cards[cur].classList.add('on');
    place(jump||first);
    if(first)requestAnimationFrame(function(){vf.classList.add('ready')});
  }

  function stop(){clearTimeout(timer);timer=0}
  function run(){
    stop();
    if(!inView||hover||document.hidden)return;
    timer=setTimeout(function(){go(cur+1);run()},STEP);
  }

  /* наведение мышью и фокус с клавиатуры: рамка встаёт на человека */
  var fine=matchMedia('(hover:hover) and (pointer:fine)');
  cards.forEach(function(c,i){
    c.addEventListener('mouseenter',function(){if(!fine.matches)return;hover=true;clearTimeout(resume);stop();go(i)});
    c.addEventListener('focusin',function(){hover=true;clearTimeout(resume);stop();go(i)});
    c.addEventListener('focusout',function(){hover=false;resume=setTimeout(run,1200)});
  });
  /* телефон: по касанию рамка сразу встаёт на человека, автосмена ждёт 4 с */
  cards.forEach(function(c,i){
    function tap(e){if(e.pointerType==='mouse')return;clearTimeout(resume);stop();go(i);resume=setTimeout(run,4000)}
    c.addEventListener('pointerdown',tap,{passive:true});
  });
  row.addEventListener('mouseleave',function(){if(!fine.matches)return;hover=false;clearTimeout(resume);resume=setTimeout(run,1200)});

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      inView=es[es.length-1].isIntersecting;
      if(inView&&cur<0)go(0,true);
      run();
    },{threshold:.35}).observe(row);
  }else{inView=true;go(0,true);run()}
  document.addEventListener('visibilitychange',run);

  /* раскладка изменилась (окно, шрифты, картинки): рамку на место без анимации */
  var rz=0;
  function relayout(){cancelAnimationFrame(rz);rz=requestAnimationFrame(function(){place(true)})}
  addEventListener('resize',relayout);
  if(window.ResizeObserver)new ResizeObserver(relayout).observe(row);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(relayout);
})();
