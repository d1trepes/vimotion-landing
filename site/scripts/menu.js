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
  /* тап по затемнению (псевдоэлемент шапки) закрывает меню */
  hdr.addEventListener('click',function(e){if(e.target===hdr&&hdr.classList.contains('is-menu'))set(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&hdr.classList.contains('is-menu')){set(false);btn.focus()}});
  matchMedia('(min-width:1001px)').addEventListener('change',function(m){if(m.matches)set(false)});
})();

/* Закреплённая шапка (21.11): после прокрутки получает плашку; пункт меню того блока, который сейчас на экране, подчёркнут */
(function(){
  'use strict';
  var hdr=document.querySelector('.hdr');if(!hdr)return;
  var on=null,dk=null,t=0,darks=[].slice.call(document.querySelectorAll('[data-hdr="dark"]')),bar=document.querySelector('.cx-bar');
  /* над тёмными блоками (асфальт, подвал) шапка тоже тёмная: смотрим, какой блок начинается сразу под шапкой
     (на страницах кейсов под шапкой ещё полоса с именами, она меняет цвет вместе с шапкой) */
  function upd(){
    t=0;var s=(window.scrollY||0)>8;if(s!==on){on=s;hdr.classList.toggle('is-stuck',s)}
    var y=hdr.offsetHeight+(bar?bar.offsetHeight:0)+1,d=false;
    for(var i=0;i<darks.length;i++){var r=darks[i].getBoundingClientRect();if(r.top<=y&&r.bottom>y){d=true;break}}
    if(d!==dk){dk=d;hdr.classList.toggle('is-dark',d);tone(d)}
    bottom();
  }
  /* 20.11: панели браузера.
     theme-color (по нему красит панели Telegram и старый Safari) идёт за шапкой.
     Safari на iPhone (iOS 26) красит нижнюю панель в цвет фона body: ставим body и html цвет блока у нижнего края окна,
     тёмный или кремовый. Так панель тёмная над тёмными блоками, светлая над светлыми и никогда не красная */
  var meta=document.querySelector('meta[name="theme-color"]'),bd=null,html=document.documentElement;
  function tone(dark){if(meta)meta.setAttribute('content',dark?'#0e0e0e':'#EFE6DE')}
  function bottom(){
    var y=(window.innerHeight||html.clientHeight)-3,d=false;
    for(var i=0;i<darks.length;i++){var r=darks[i].getBoundingClientRect();if(r.top<=y&&r.bottom>y){d=true;break}}
    /* за подвалом (оттягивание в самом конце) тоже тёмное */
    if(!d&&darks.length){var last=darks[darks.length-1].getBoundingClientRect();if(last.bottom<=y&&last.bottom>0)d=true}
    if(d!==bd){bd=d;var c=d?'#0e0e0e':'#EFE6DE';document.body.style.backgroundColor=c;html.style.backgroundColor=c;if(edge)edge.style.backgroundColor=c}
  }
  /* полоса у нижнего края для Safari на iPhone/iPad (см. .vm-edge в tokens.css) */
  /* только Safari и окна браузера внутри приложений (Telegram), где панель плавает поверх страницы: у Chrome, Google, Firefox, Edge, Яндекса на iPhone панель
     непрозрачная и не перекрывает страницу, там полоса была бы видна внизу экрана */
  var ua=navigator.userAgent,edge=null;
  var ios=/iP(hone|ad|od)/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var safari=ios&&!/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|GSA\/|DuckDuckGo|Mercury|Brave|Instagram|FBAN|FBAV|VKClient/.test(ua);
  if(safari){edge=document.createElement('div');edge.className='vm-edge';edge.setAttribute('aria-hidden','true');document.body.appendChild(edge)}
  addEventListener('scroll',function(){if(!t)t=requestAnimationFrame(upd)},{passive:true});addEventListener('resize',upd);upd();

  var links=[].slice.call(document.querySelectorAll('#nav a[href^="#"]'));
  if(!links.length||!('IntersectionObserver' in window))return;
  var map={};links.forEach(function(a){var el=document.getElementById(a.getAttribute('href').slice(1));if(el)map[el.id]=a});
  var vis={};
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){vis[e.target.id]=e.isIntersecting});
    var cur=null;Object.keys(map).forEach(function(id){if(vis[id])cur=id});
    links.forEach(function(a){a.classList.toggle('is-cur',!!cur&&map[cur]===a)});
  },{rootMargin:'-45% 0px -50% 0px'});
  Object.keys(map).forEach(function(id){io.observe(document.getElementById(id))});
})();

/* Переходы по якорям внутри страницы плавные (кроме prefers-reduced-motion), шапку учитывает scroll-padding-top */
(function(){
  'use strict';
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#"]');
    if(!a||e.defaultPrevented||e.button>0||e.metaKey||e.ctrlKey||e.shiftKey)return;
    var id=a.getAttribute('href').slice(1),el=id&&document.getElementById(id);
    if(!el)return;
    e.preventDefault();
    el.scrollIntoView({behavior:'smooth',block:'start'});
    if(history.pushState)history.pushState(null,'','#'+id);
  });
})();
