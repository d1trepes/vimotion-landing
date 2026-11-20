/* Кейсы (21.11, вторая версия).
   Хаб: полосы с лицами въезжают по очереди, карточки кейсов проявляются при прокрутке, сомнение в карточке зачёркивается.
   Страница человека: первый экран (фото выезжает, сомнение зачёркивается, результат считается от нуля),
   переключатель людей сразу показывает текущего (на телефоне подкручен к нему без анимации),
   скрины-доказательства открываются на весь экран.
   При prefers-reduced-motion всё в финальном виде (класс anim на <html> не ставится). */
(function(){
  'use strict';
  var root=document.documentElement,anim=root.classList.contains('anim');

  /* переключатель людей: текущий в видимой части, сразу */
  var bar=document.querySelector('.cx-bar-in'),cur=bar&&bar.querySelector('.is-cur');
  if(bar&&cur&&bar.scrollWidth>bar.clientWidth)bar.scrollLeft=cur.offsetLeft-bar.clientWidth/2+cur.offsetWidth/2;

  /* хаб: лица */
  var top=document.querySelector('.cs-top');
  if(top)requestAnimationFrame(function(){top.classList.add('is-in')});

  /* появление при прокрутке: карточки хаба */
  var cards=[].slice.call(document.querySelectorAll('.cc'));
  if(anim&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}});
    },{rootMargin:'0px 0px -12% 0px'});
    cards.forEach(function(c){io.observe(c)});
  }else cards.forEach(function(c){c.classList.add('is-in')});

  /* первый экран кейса: счётчик результата */
  var hero=document.querySelector('.cx-hero');
  if(hero){
    var b=hero.querySelector('[data-count]');
    var go=function(){
      hero.classList.add('is-in');
      if(!anim||!b)return;
      var txt=b.textContent,m=txt.match(/\d[\d\s ]*/);
      if(!m)return;
      var to=parseInt(m[0].replace(/[\s ]/g,''),10),pre=txt.slice(0,m.index),post=txt.slice(m.index+m[0].replace(/[\s ]+$/,'').length);
      if(!to)return;
      var t0=performance.now()+900,dur=1300;
      var fmt=function(v){var s=String(v);return to>=1000?s.replace(/\B(?=(\d{3})+(?!\d))/g,' '):s};
      b.style.minWidth=b.offsetWidth+'px';
      (function step(now){
        var k=Math.max(0,Math.min(1,(now-t0)/dur)),e=1-Math.pow(1-k,4);
        b.textContent=pre+fmt(Math.round(to*e))+post;
        if(k<1)requestAnimationFrame(step);else{b.textContent=txt;b.style.minWidth=''}
      })(performance.now());
    };
    if(anim)requestAnimationFrame(function(){requestAnimationFrame(go)});else hero.classList.add('is-in');
  }

  /* просмотр доказательств */
  var lb=document.getElementById('cs-lb');
  if(lb){
    var big=lb.querySelector('img'),from=null;
    var close=function(){
      lb.classList.remove('is-on');root.style.overflow='';
      setTimeout(function(){lb.hidden=true;big.removeAttribute('src')},anim?300:0);
      if(from)from.focus();
    };
    [].forEach.call(document.querySelectorAll('.cx-z'),function(z){
      z.addEventListener('click',function(){
        var im=z.querySelector('img');from=z;
        big.src=im.currentSrc||im.src;big.alt=im.alt;
        lb.hidden=false;root.style.overflow='hidden';
        requestAnimationFrame(function(){lb.classList.add('is-on')});
        lb.querySelector('.cs-lb-x').focus();
      });
    });
    lb.addEventListener('click',close);
    addEventListener('keydown',function(e){if(e.key==='Escape'&&!lb.hidden)close()});
  }
})();
