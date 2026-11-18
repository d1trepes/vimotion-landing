/* Блок 11. Перчатки «ложатся» на край плашки, пункты проявляются по очереди, когда блок входит в экран.
   Без IntersectionObserver или при prefers-reduced-motion всё видно сразу. */
(function(){
  'use strict';
  var sec=document.querySelector('.rc');if(!sec||!('IntersectionObserver' in window))return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(sec.getBoundingClientRect().bottom<0)return; // блок уже выше экрана: показываем как есть
  sec.classList.add('is-wait');
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      io.disconnect();
      sec.classList.add('is-in');
      requestAnimationFrame(function(){requestAnimationFrame(function(){sec.classList.remove('is-wait')})});
    });
  },{rootMargin:'0px 0px -25% 0px'});
  io.observe(sec.querySelector('.rc-card'));
})();
