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
