/* Экономия ресурсов: секции дальше экрана получают класс is-off,
   в tokens.css он ставит на паузу их бесконечные CSS-анимации (REC, пульс play, бегущая строка). */
(function(){
  'use strict';
  if(!('IntersectionObserver' in window))return;
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){e.target.classList.toggle('is-off',!e.isIntersecting)});
  },{rootMargin:'200px 0px'});
  [].forEach.call(document.querySelectorAll('.hero,main>section'),function(s){io.observe(s)});
})();

/* Фоновая догрузка картинок. Встроенный браузер Telegram начинает грузить loading="lazy" только у самого края экрана,
   поэтому фото появлялись с задержкой уже на глазах. После загрузки первого экрана снимаем lazy по порядку страницы,
   по 3 картинки за раз, чтобы к моменту прокрутки всё было в кеше. Обложка урока (фон) подключается так же. */
(function(){
  'use strict';
  function start(){
    var list=[].slice.call(document.querySelectorAll('img[loading="lazy"]'));
    var les=document.getElementById('les-card');if(les)les.classList.add('bg');
    document.documentElement.classList.add('cav');
    var i=0,active=0;
    function next(){
      while(active<3&&i<list.length){
        var img=list[i++];
        if(img.complete&&img.naturalWidth)continue;
        active++;
        var done=function(){active--;next()};
        img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});
        img.loading='eager';
      }
    }
    next();
  }
  function later(){(window.requestIdleCallback||function(f){setTimeout(f,300)})(start,{timeout:1500})}
  if(document.readyState==='complete')later();else addEventListener('load',later);
})();
