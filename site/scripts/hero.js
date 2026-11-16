/* Блок 1: запуск анимаций после прелоадера и счётчики цифр.
   Без анимаций (prefers-reduced-motion) цифры остаются финальными из разметки. */
(function(){
  'use strict';
  var root=document.documentElement;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  function countUp(){
    var els=document.querySelectorAll('.stat-num');
    Array.prototype.forEach.call(els,function(el,i){
      var to=+el.dataset.to,dec=+(el.dataset.dec||0),suf=el.dataset.suffix||'',unit=el.dataset.unit;
      var t0=performance.now()+600+i*100,dur=1300;
      (function step(now){
        var k=Math.max(0,Math.min(1,(now-t0)/dur)),e=1-Math.pow(1-k,4);
        var v=(to*e).toFixed(dec).replace('.',',');
        el.innerHTML=v+suf+(unit?'<small>'+unit+'</small>':'');
        if(k<1)requestAnimationFrame(step);
      })(performance.now());
    });
  }

  function open(){
    root.classList.remove('is-loading');
    void root.offsetWidth;
    root.classList.add('is-go');
    countUp();
    setTimeout(function(){if(window.vmLive)window.vmLive.start()},700);
  }
  document.addEventListener('vm:open',open,{once:true});
})();
