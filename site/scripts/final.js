/* Блок 19. Финал и подвал.
   Блок 19: когда ряд полос доезжает до экрана, полосы въезжают по очереди (снимается is-pre),
   затем по лицам один раз проходит волна цвета и на «?» запускается блик (is-run).
   Подвал: огромный вордмарк выезжает снизу. При reduced-motion ничего не двигается. */
(function(){
  'use strict';
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
  function reveal(sec,target,run,margin){
    if(!sec||!target)return;
    sec.classList.add('is-pre');
    var io=new IntersectionObserver(function(es){
      if(!es[0].isIntersecting)return;
      io.disconnect();
      sec.classList.remove('is-pre');
      if(run)sec.classList.add('is-run');
    },{rootMargin:margin});
    io.observe(target);
  }
  var fn=document.getElementById('final');
  reveal(fn,fn&&fn.querySelector('.fn-row'),true,'0px 0px -25% 0px');
  var ft=document.getElementById('siteFoot');
  reveal(ft,ft&&ft.querySelector('.ft-wm'),false,'0px 0px -5% 0px');
})();
