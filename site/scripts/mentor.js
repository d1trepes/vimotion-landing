/* Блок 12. «Трасса с табло»: когда трасса доезжает до экрана, Артём едет от старта к своей отметке,
   за ним прорисовывается сплошная линия, затем поднимается табло и цифры зажигаются по очереди.
   Без IntersectionObserver, при prefers-reduced-motion или если блок уже выше экрана всё стоит на месте. */
(function(){
  'use strict';
  var sec=document.querySelector('.mn');if(!sec||!('IntersectionObserver' in window))return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var track=sec.querySelector('.mn-track');if(!track)return;
  if(track.getBoundingClientRect().bottom<0)return;
  sec.classList.add('is-wait');
  var io=new IntersectionObserver(function(es){
    if(!es[0].isIntersecting)return;
    io.disconnect();
    sec.classList.add('is-go');
    requestAnimationFrame(function(){requestAnimationFrame(function(){sec.classList.remove('is-wait')})});
  },{rootMargin:'0px 0px -22% 0px'});
  io.observe(track);
})();
