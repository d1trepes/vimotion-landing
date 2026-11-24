/* Блок 5. Без блогерства
   Карточки ложатся стопкой через position:sticky (CSS). Скрипт только уменьшает нижние карточки,
   пока на них заезжает следующая: −4% за каждую карточку сверху.
   При prefers-reduced-motion ничего не делает (стопка в CSS тоже выключена). */
(function(){
  'use strict';
  var sec=document.getElementById('nobl');
  if(!sec||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var cards=[].slice.call(sec.querySelectorAll('.nob-c'));
  if(cards.length<2)return;
  var on=false,raf=0;

  function update(){
    raf=0;
    if(getComputedStyle(cards[0]).position!=='sticky')return;
    var cs=getComputedStyle(sec),ch=parseFloat(cs.getPropertyValue('--ch'))||400;
    /* насколько каждая карточка уже «легла»: 0 далеко внизу, 1 прилипла */
    var p=cards.map(function(c){
      var stuck=parseFloat(getComputedStyle(c).top)||0,d=c.getBoundingClientRect().top-stuck;
      return Math.max(0,Math.min(1,1-d/ch));
    });
    cards.forEach(function(c,i){
      var k=0;for(var j=i+1;j<cards.length;j++)k+=p[j];
      c.style.transform=k?'scale('+(1-.04*k).toFixed(4)+')':'';
    });
  }
  function req(){if(on&&!raf)raf=requestAnimationFrame(update)}

  new IntersectionObserver(function(es){on=es[0].isIntersecting;if(on)req()}).observe(sec);
  addEventListener('scroll',req,{passive:true});
  addEventListener('resize',req);
})();
