/* Блок 16. Форматы участия: билеты въезжают по очереди, когда блок доезжает до экрана;
   на компьютере блик на VIP-билете идёт за курсором (без курсора он ездит сам, анимация в CSS).
   При prefers-reduced-motion ничего не делаем: билеты на месте, блика нет. */
(function(){
  'use strict';
  var sec=document.getElementById('formats');if(!sec)return;
  // выемки: высота пунктира внутри билета для маски (--cy), пересчёт при изменении размеров
  var tickets=[].slice.call(sec.querySelectorAll('.fm-t'));
  function cut(){tickets.forEach(function(t){var st=t.querySelector('.fm-stub');if(st){t.style.setProperty('--cy',st.offsetTop+'px');t.classList.add('is-cut')}})}
  cut();
  if('ResizeObserver' in window){var ro=new ResizeObserver(cut);tickets.forEach(function(t){ro.observe(t)})}else{addEventListener('resize',cut)}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if('IntersectionObserver' in window){
    sec.classList.add('is-pre');
    var io=new IntersectionObserver(function(es){
      if(!es[0].isIntersecting)return;
      io.disconnect();sec.classList.remove('is-pre');
    },{rootMargin:'0px 0px -25% 0px'});
    io.observe(sec.querySelector('.fm-row'));
  }
  if(!matchMedia('(hover: hover)').matches)return;
  [].forEach.call(sec.querySelectorAll('.fm-v'),function(t){
    var foil=t.querySelector('.fm-foil');if(!foil)return;
    t.addEventListener('pointermove',function(e){
      var r=t.getBoundingClientRect();
      t.classList.add('is-hx');
      foil.style.setProperty('--fm-hx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
    });
    t.addEventListener('pointerleave',function(){t.classList.remove('is-hx');foil.style.removeProperty('--fm-hx')});
  });
})();
