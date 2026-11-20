/* Мобильное меню (до 1000 px): бургер открывает тёмную шторку с пунктами меню.
   Закрывается повторным нажатием, переходом по пункту или клавишей Esc. Пока шторка открыта, страница не прокручивается. */
(function(){
  'use strict';
  var hdr=document.querySelector('.hdr'),btn=hdr&&hdr.querySelector('.burger'),nav=document.getElementById('nav');
  if(!btn||!nav)return;
  var root=document.documentElement;
  function set(on){
    hdr.classList.toggle('is-menu',on);
    btn.setAttribute('aria-expanded',on?'true':'false');
    btn.setAttribute('aria-label',on?'Закрыть меню':'Меню');
    root.style.overflow=on?'hidden':'';
  }
  btn.addEventListener('click',function(){set(!hdr.classList.contains('is-menu'))});
  nav.addEventListener('click',function(e){if(e.target.closest('a'))set(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&hdr.classList.contains('is-menu')){set(false);btn.focus()}});
  matchMedia('(min-width:1001px)').addEventListener('change',function(m){if(m.matches)set(false)});
})();
