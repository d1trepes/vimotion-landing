/* Блок 4. Боль + мысль Валентина
   Вау-момент: карточки стартуют карандашными набросками (.is-sk), когда альбом заметно вошёл в экран,
   маркер проводит по фразе мамы и фото по очереди проявляются (.is-on). Задержки и переходы в 04-pain.css.
   Без JS и при prefers-reduced-motion сразу финальное состояние. */
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
