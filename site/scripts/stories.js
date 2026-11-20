/* Блок 14. Истории учеников: косой аккордеон.
   21.11: каждая полоса — ссылка на кейс (cases.html#имя). На компьютере наведение раскрывает, клик открывает кейс;
   на телефоне первое касание раскрывает полосу, второе по раскрытой открывает кейс; с клавиатуры фокус раскрывает, Enter открывает.
   Наведение (с задержкой 170 мс, чтобы не дёргалось), клик, касание или клавиатура раскрывают человека. Пока посетитель ничего не трогал
   и блок на экране, истории сменяются сами каждые 4,5 с. Ссылки #alena, #ivan и т. п. (из блока 2)
   раскрывают нужного человека. При prefers-reduced-motion без въезда и автосмены. */
(function(){
  'use strict';
  var sec=document.querySelector('.st');if(!sec)return;
  var items=[].slice.call(sec.querySelectorAll('.st-it'));if(!items.length)return;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches;
  var cur=Math.max(0,items.findIndex(function(li){return li.classList.contains('is-on')}));
  var touched=false,timer=null,inView=false;

  function open(i){
    if(i===cur||i<0||i>=items.length)return;
    items[cur].classList.remove('is-on');
    cur=i;
    items[cur].classList.add('is-on');
  }
  function stop(){touched=true;clearInterval(timer);timer=null}
  function run(){
    if(reduce||touched||timer||!inView)return;
    timer=setInterval(function(){if(document.hidden)return;open((cur+1)%items.length)},4500);
  }

  items.forEach(function(li,i){
    var b=li.querySelector('.st-b');
    b.addEventListener('click',function(e){
      if(fine||i===cur){stop();return}  /* переход по ссылке на кейс */
      e.preventDefault();stop();open(i);
    });
    b.addEventListener('focus',function(){if(!fine||b.matches(':focus-visible')){stop();open(i)}});
    /* на компьютере раскрытие по наведению, но с небольшой задержкой: при проведении мышью через ряд полосы не дёргаются */
    if(fine){
      var t=null;
      li.addEventListener('mouseenter',function(){clearTimeout(t);t=setTimeout(function(){stop();open(i)},170)});
      li.addEventListener('mouseleave',function(){clearTimeout(t)});
    }
  });

  function fromHash(){
    var id=location.hash.slice(1),i=items.findIndex(function(li){return li.id===id});
    if(i>-1){stop();open(i)}
  }
  window.addEventListener('hashchange',fromHash);fromHash();

  if(!('IntersectionObserver' in window))return;
  var first=!reduce&&sec.getBoundingClientRect().top>innerHeight;
  if(first)sec.classList.add('is-wait');
  new IntersectionObserver(function(es){
    es.forEach(function(e){
      inView=e.isIntersecting;
      if(inView&&first){
        first=false;
        sec.classList.add('is-in','is-fresh');sec.classList.remove('is-wait');
        setTimeout(function(){sec.classList.remove('is-fresh')},900);
      }
      if(inView)run();else{clearInterval(timer);timer=null}
    });
  },{rootMargin:'0px 0px -25% 0px'}).observe(sec);
})();
