/* Блок 3. Видео + бегущая строка
   1) Вау-момент: обложка при прокрутке вырастает с 88% до 100% (--p от 0 до 1).
      0, когда верх рамки у низа окна; 1, когда карточка поднялась на 45% высоты окна.
   2) Плеер: видео грузится только по клику на play, обложка меняется на <video> с controls.
   При prefers-reduced-motion карточка сразу в полном размере. */
(function(){
  'use strict';
  var card=document.getElementById('les-card');
  if(!card)return;

  /* ---------- плеер ---------- */
  var btn=card.querySelector('.les-play');
  function play(){
    if(card.classList.contains('is-on'))return;
    var v=document.createElement('video');
    v.src=card.getAttribute('data-src');
    v.controls=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';
    v.poster=card.getAttribute('data-poster')||'';
    card.appendChild(v);card.classList.add('is-on');
    var p=v.play();if(p&&p.catch)p.catch(function(){});
    v.focus({preventScroll:true});
  }
  if(btn)btn.addEventListener('click',play);
  card.addEventListener('click',function(e){if(e.target===card)play()});

  /* ---------- обложка (фон карточки) подгружается, когда блок подъезжает к экрану ---------- */
  if('IntersectionObserver' in window){
    var bgIO=new IntersectionObserver(function(es){if(es[0].isIntersecting){card.classList.add('bg');bgIO.disconnect()}},{rootMargin:'100% 0px'});
    bgIO.observe(card);
  }else card.classList.add('bg');

  /* ---------- рост обложки ---------- */
  var frame=card.parentNode;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var tick=0,last=-1;
  function upd(){
    tick=0;
    var r=frame.getBoundingClientRect(),vh=window.vmVH||innerHeight||1;
    if(r.top>vh*1.2||r.bottom<-vh*.2)return;
    var p=(vh-r.top)/(vh*.45);
    p=Math.max(0,Math.min(1,p));
    p=1-Math.pow(1-p,2);
    p=Math.round(p*1000)/1000;
    if(p!==last){last=p;frame.style.setProperty('--p',p)}
  }
  function on(){if(!tick)tick=requestAnimationFrame(upd)}
  addEventListener('scroll',on,{passive:true});addEventListener('vmviewport',on);
  frame.style.setProperty('--p',0);upd();
})();
