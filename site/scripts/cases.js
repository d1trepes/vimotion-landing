/* Страница кейсов.
   1) Полосы с лицами въезжают по очереди; каждый кейс при появлении проявляет фото в цвет и зажигает цифры табло.
   2) Закреплённая полоса с именами подсвечивает кейс, который сейчас на экране, и подкручивает его имя в видимую часть (телефон).
   3) Переход по имени или лицу плавный; при открытии страницы со ссылкой cases.html#имя сразу встаём на нужный кейс.
   4) Скрины-доказательства открываются на весь экран (Esc, клик или крестик закрывают).
   При prefers-reduced-motion без въездов и плавной прокрутки. */
(function(){
  'use strict';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cases=[].slice.call(document.querySelectorAll('.cs-case'));
  var bar=document.querySelector('.cs-bar-in'),links=bar?[].slice.call(bar.querySelectorAll('a')):[];
  var top=document.querySelector('.cs-top');

  /* ссылка с якорем: браузер может не доскроллить, пока грузятся картинки, поэтому встаём на кейс ещё раз после загрузки */
  if(location.hash){
    var tgt=document.getElementById(location.hash.slice(1));
    if(tgt&&tgt.classList.contains('cs-case')){
      tgt.classList.remove('is-pre');
      var fix=function(){tgt.scrollIntoView({block:'start'})};
      requestAnimationFrame(fix);addEventListener('load',fix);
    }
  }

  /* въезды */
  if(!reduce&&'IntersectionObserver' in window){
    if(top){
      requestAnimationFrame(function(){top.classList.add('is-in')});
    }
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.remove('is-pre');io.unobserve(e.target)}});
    },{rootMargin:'0px 0px -20% 0px'});
    cases.forEach(function(c){
      if(c.getBoundingClientRect().top>innerHeight*.8&&!(location.hash&&c.id===location.hash.slice(1))){c.classList.add('is-pre');io.observe(c)}
    });
  }

  if(top&&!reduce)setTimeout(function(){top.classList.add('is-in')},60);

  /* текущий кейс в полосе имён */
  if(links.length&&'IntersectionObserver' in window){
    var cur=null;
    var spy=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting)cur=e.target.id});
      links.forEach(function(a){
        var on=a.getAttribute('href')==='#'+cur;
        if(on&&!a.classList.contains('is-cur')){
          var l=a.offsetLeft-bar.clientWidth/2+a.offsetWidth/2;
          bar.scrollTo({left:l,behavior:reduce?'auto':'smooth'});
        }
        a.classList.toggle('is-cur',on);
        if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
      });
    },{rootMargin:'-40% 0px -55% 0px'});
    cases.forEach(function(c){spy.observe(c)});
  }

  /* просмотр доказательств */
  var lb=document.getElementById('cs-lb');
  if(lb){
    var big=lb.querySelector('img'),from=null;
    function close(){
      lb.classList.remove('is-on');document.documentElement.style.overflow='';
      setTimeout(function(){lb.hidden=true;big.removeAttribute('src')},reduce?0:300);
      if(from)from.focus();
    }
    [].forEach.call(document.querySelectorAll('.cs-z'),function(b){
      b.addEventListener('click',function(){
        var im=b.querySelector('img');from=b;
        big.src=im.currentSrc||im.src;big.alt=im.alt;
        lb.hidden=false;document.documentElement.style.overflow='hidden';
        requestAnimationFrame(function(){lb.classList.add('is-on')});
        lb.querySelector('.cs-lb-x').focus();
      });
    });
    lb.addEventListener('click',close);
    addEventListener('keydown',function(e){if(e.key==='Escape'&&!lb.hidden)close()});
  }
})();
