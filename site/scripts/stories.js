/* Блок 14. Истории учеников: косой аккордеон.
   20.11 (правка клиента): полосы больше не ссылки, это просто раскрывающиеся карточки. По умолчанию ничего не раскрыто,
   сами не листаются. На компьютере наведение раскрывает (с задержкой 170 мс, чтобы ряд не дёргался), курсор ушёл
   с ряда — всё снова закрыто. На телефоне тап раскрывает, повторный тап закрывает, тап по другой полосе переключает.
   С клавиатуры Enter/пробел раскрывают и закрывают. Ссылки #alena и т. п. раскрывают нужного человека.
   Переход ко всем историям — кнопкой «Читать истории полностью». При prefers-reduced-motion без въезда. */
(function(){
  'use strict';
  var sec=document.querySelector('.st');if(!sec)return;
  var list=sec.querySelector('.st-list');
  var items=[].slice.call(sec.querySelectorAll('.st-it'));if(!items.length)return;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches;
  var cur=-1;
  items.forEach(function(li){li.classList.remove('is-on')});

  function set(i){
    if(i===cur)return;
    if(cur>-1){items[cur].classList.remove('is-on');items[cur].querySelector('.st-b').setAttribute('aria-expanded','false')}
    cur=i;
    if(cur>-1){items[cur].classList.add('is-on');items[cur].querySelector('.st-b').setAttribute('aria-expanded','true')}
  }

  var t=null;
  items.forEach(function(li,i){
    var b=li.querySelector('.st-b');
    b.addEventListener('click',function(){
      if(fine&&cur===i&&li.matches(':hover'))return;   /* мышью: наведение уже раскрыло, клик ничего не делает */
      set(cur===i?-1:i);
    });
    if(fine){
      li.addEventListener('mouseenter',function(){clearTimeout(t);t=setTimeout(function(){set(i)},170)});
    }
  });
  if(fine)list.addEventListener('mouseleave',function(){clearTimeout(t);t=setTimeout(function(){set(-1)},120)});

  function fromHash(){
    var id=location.hash.slice(1),i=items.findIndex(function(li){return li.id===id});
    if(i>-1)set(i);
  }
  window.addEventListener('hashchange',fromHash);fromHash();

  if(reduce||!('IntersectionObserver' in window))return;
  var first=sec.getBoundingClientRect().top>innerHeight;
  if(!first)return;
  sec.classList.add('is-wait');
  var io=new IntersectionObserver(function(es){
    if(!es[0].isIntersecting)return;
    io.disconnect();
    sec.classList.add('is-in');sec.classList.remove('is-wait');
  },{rootMargin:'0px 0px -25% 0px'});
  io.observe(sec);
})();
