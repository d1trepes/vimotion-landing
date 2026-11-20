/* Блок 17. Страхи: карточки-перевёртыши.
   Тап или клик переворачивает карточку (aria-pressed). Когда блок доезжает до экрана, карточки въезжают по очереди
   и вторая сама переворачивается, чтобы было видно, что их можно крутить. При reduced-motion без въезда и автопереворота. */
(function(){
  'use strict';
  var sec=document.getElementById('fears');if(!sec)return;
  var cards=[].slice.call(sec.querySelectorAll('.fr-c'));
  cards.forEach(function(c){
    c.addEventListener('click',function(){c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')==='true'?'false':'true')});
  });
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
  sec.classList.add('is-pre');
  var io=new IntersectionObserver(function(es){
    if(!es[0].isIntersecting)return;
    io.disconnect();
    sec.classList.remove('is-pre');
    setTimeout(function(){if(cards[1]&&!sec.querySelector('.fr-c[aria-pressed="true"]'))cards[1].setAttribute('aria-pressed','true')},1100);
  },{rootMargin:'0px 0px -30% 0px'});
  io.observe(sec.querySelector('.fr-g'));
})();
