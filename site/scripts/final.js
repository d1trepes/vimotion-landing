/* Блок 19. Финал и подвал.
   Блок 19: когда ряд полос доезжает до экрана, полосы въезжают по очереди (снимается is-pre),
   затем раз в 5 с цвет пробегает по всем лицам и останавливается на «?» (is-sweep).
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
      setTimeout(function(){sec.classList.add('is-in')},1700);/* въезд закончился: наведение без задержки */
      if(run)run();
    },{rootMargin:margin});
    io.observe(target);
  }
  var fn=document.getElementById('final');
  // пробег цвета по лицам: первый после въезда, дальше раз в 5 с, пока блок на экране
  var row=fn&&fn.querySelector('.fn-row'),timer=null,vis=false;
  function sweep(){
    row.classList.remove('is-sweep');void row.offsetWidth;row.classList.add('is-sweep');
    clearTimeout(timer);timer=setTimeout(function(){if(vis)sweep()},5000);
  }
  if(row){
    new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(!vis)clearTimeout(timer);else if(fn.classList.contains('is-run'))sweep()}).observe(row);
  }
  reveal(fn,row,function(){setTimeout(function(){fn.classList.add('is-run');sweep()},1500)},'0px 0px -25% 0px');
  var ft=document.getElementById('siteFoot');
  reveal(ft,ft&&ft.querySelector('.ft-wm'),false,'0px 0px -5% 0px');
})();
