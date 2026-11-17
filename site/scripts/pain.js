/* Блок 4. Боль + мысль Валентина
   Вау-момент: карточки чуть приподняты (.is-sk), когда альбом заметно вошёл в экран,
   маркер проводит по фразе мамы и фото по очереди «прижимаются» к булавке (.is-on). Фото сразу цветные, без набросков. Задержки и переходы в 04-pain.css.
   Без JS и при prefers-reduced-motion сразу финальное состояние. */
/* Подписи на полароидах никогда не выходят за карточку: если строка шире белого поля (видимая карточка внутри PNG минус поля по 6%),
   кегль уменьшается ровно настолько, чтобы влезть. Пересчёт при смене ширины и когда догрузился рукописный шрифт */
(function(){
  'use strict';
  var caps=[].slice.call(document.querySelectorAll('#pain .pin figcaption'));
  if(!caps.length)return;
  function fit(){
    caps.forEach(function(c){
      c.style.fontSize='';
      /* доля ширины картинки, которую занимает сама карточка (по краям поля с вшитой тенью): mom, pc, me */
      var pin=c.parentNode,k=pin.classList.contains('pin-1')?.668:pin.classList.contains('pin-2')?.643:.619,avail=pin.offsetWidth*k*.88;
      var rg=document.createRange();rg.selectNodeContents(c);
      var w=rg.getBoundingClientRect().width; /* у повёрнутой карточки рамка чуть шире текста: запас в нашу пользу */
      if(w>avail&&w>0){var fs=parseFloat(getComputedStyle(c).fontSize);c.style.fontSize=(fs*avail/w).toFixed(2)+'px'}
    });
  }
  fit();
  if(document.fonts){if(document.fonts.ready)document.fonts.ready.then(fit);if(document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',fit)}
  if(window.ResizeObserver){var b=document.querySelector('#pain .board');if(b)new ResizeObserver(fit).observe(b)}
  else addEventListener('resize',fit);
})();

(function(){
  'use strict';
  var sec=document.getElementById('pain');
  if(!sec||!('IntersectionObserver' in window))return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var story=sec.querySelector('.story');if(!story)return;
  /* если блок уже на экране (перезагрузка посреди страницы), не прячем фото */
  var r=story.getBoundingClientRect();
  if(r.top<innerHeight*.75&&r.bottom>0)return;
  sec.classList.add('is-sk');
  /* наброски подгружаем заранее, когда до альбома остаётся пара экранов */
  var pre=new IntersectionObserver(function(es){
    if(es[0].isIntersecting){[].forEach.call(sec.querySelectorAll('.pin img'),function(i){i.loading='eager'});pre.disconnect()}
  },{rootMargin:'1600px 0px'});
  pre.observe(story);
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      io.disconnect();
      /* ждём наброски (они lazy), но не дольше секунды */
      var sk=[].filter.call(sec.querySelectorAll('.pin-sk'),function(i){return !i.complete}),left=sk.length,done=false;
      function go(){if(!done){done=true;sec.classList.add('is-on')}}
      if(!left)return go();
      sk.forEach(function(i){i.addEventListener('load',function(){if(!--left)go()});i.addEventListener('error',go)});
      setTimeout(go,1000);
    });
  },{threshold:.35});
  io.observe(story);
})();
