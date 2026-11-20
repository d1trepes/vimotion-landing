/* Блок 18. Вопросы: аккордеон и выход Валентина из плашки.
   Открыт один вопрос за раз (первый открыт сразу), повторный клик закрывает. aria-expanded на кнопке.
   Когда плашка доезжает до экрана, Валентин поднимается из неё (снимается is-pre). При reduced-motion без подъёма. */
(function(){
  'use strict';
  var sec=document.getElementById('faq');if(!sec)return;
  var list=sec.querySelector('.faq-list');
  list.addEventListener('click',function(e){
    var b=e.target.closest('.faq-b');if(!b)return;
    var it=b.parentElement,open=it.classList.contains('is-open');
    [].forEach.call(list.querySelectorAll('.faq-it.is-open'),function(o){o.classList.remove('is-open');o.querySelector('.faq-b').setAttribute('aria-expanded','false')});
    if(!open){it.classList.add('is-open');b.setAttribute('aria-expanded','true')}
  });
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
  var card=sec.querySelector('.faq-card');
  sec.classList.add('is-pre');
  var io=new IntersectionObserver(function(es){
    if(!es[0].isIntersecting)return;
    io.disconnect();
    sec.classList.remove('is-pre');
  },{rootMargin:'0px 0px -30% 0px'});
  io.observe(card);
})();
