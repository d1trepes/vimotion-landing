/* Блок 17. Страхи: карточки-перевёртыши.
   На компьютере карточка переворачивается только наведением и возвращается, как только курсор ушёл (клик не залипает).
   На телефоне переворот по тапу (aria-pressed). Когда блок доезжает до экрана, карточки въезжают по очереди,
   вторая на мгновение переворачивается и сама возвращается, чтобы было видно, что их можно крутить.
   При reduced-motion без въезда и автопереворота. */
(function(){
  'use strict';
  var sec=document.getElementById('fears');if(!sec)return;
  var cards=[].slice.call(sec.querySelectorAll('.fr-c'));
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  var demo=null;
  function stopDemo(){if(demo){clearTimeout(demo);demo=null}cards.forEach(function(c){if(fine)c.setAttribute('aria-pressed','false')})}
  cards.forEach(function(c){
    c.addEventListener('click',function(){
      if(fine)return; // на компьютере работает наведение
      c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')==='true'?'false':'true');
    });
    if(fine){
      c.addEventListener('pointerenter',stopDemo);
      c.addEventListener('pointerleave',function(){c.setAttribute('aria-pressed','false');c.blur()});
    }
  });
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
  sec.classList.add('is-pre');
  var io=new IntersectionObserver(function(es){
    if(!es[0].isIntersecting)return;
    io.disconnect();
    sec.classList.remove('is-pre');
    var c=cards[1];if(!c)return;
    demo=setTimeout(function(){
      if(sec.querySelector('.fr-c[aria-pressed="true"]')||c.matches(':hover'))return;
      c.setAttribute('aria-pressed','true');
      demo=setTimeout(function(){if(!c.matches(':hover'))c.setAttribute('aria-pressed','false');demo=null},1900);
    },1100);
  },{rootMargin:'0px 0px -30% 0px'});
  io.observe(sec.querySelector('.fr-g'));
})();
