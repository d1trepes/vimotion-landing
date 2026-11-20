/* scripts/menu.js */
try{
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
  var ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),edge=null;
  if(ios){edge=document.createElement('div');edge.className='vm-edge';edge.setAttribute('aria-hidden','true');document.body.appendChild(edge)}
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

}catch(e){window.console&&console.error("scripts/menu.js",e)}
/* scripts/live-photo.js */
try{
/* Живое фото: MP4, где верхняя половина кадра цвет, нижняя альфа. Рисуется в WebGL поверх постера.
   Пока видео не готово или WebGL недоступен, виден постер. Запуск: window.vmLive.start() после прелоадера. */
(function(){
  'use strict';
  var noop={video:null,start:function(){}};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pt=document.getElementById('pt'),cv=document.getElementById('live'),hero=document.getElementById('hero');
  if(reduce||!pt||!cv){window.vmLive=noop;return}

  /* ---------- WebGL ---------- */
  var gl,hLoc,glOK=false;
  try{
    gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true});
    if(gl){
      var vs='attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0,1);}';
      /* clamp от края половинок, чтобы не подмешивать соседнюю половину; smoothstep по альфе убирает ореол.
         Край волос подстраивается под фон страницы (light wrap): там, где под ним красная надпись, край краснеет,
         где кремовый фон, светлеет. Фон считается из текстуры вордмарка и его положения относительно портрета. */
      var fs=[
        'precision mediump float;varying vec2 uv;uniform sampler2D t,w;uniform float h,on;uniform vec2 px;uniform vec4 wr;',
        'const vec3 cream=vec3(.937,.902,.871);',
        'float A(vec2 p){p=clamp(p,0.,1.);return smoothstep(.04,.96,texture2D(t,vec2(p.x,clamp(p.y*.5,h,.5-h)+.5)).r);}',
        'vec3 B(vec2 p){vec2 q=(p-wr.xy)/(wr.zw-wr.xy);vec4 m=texture2D(w,clamp(q,0.,1.));',
        '  float k=step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);return mix(cream,m.rgb,m.a*k);}',
        'void main(){vec3 c=texture2D(t,vec2(uv.x,clamp(uv.y*.5,h,.5-h))).rgb;float a=A(uv);',
        '  if(on>.5&&a>.003){',
        '    vec2 r=px*5.;',
        /* дешёвая проверка: 4 выборки по диагонали; внутри сплошного силуэта (почти весь кадр) дальше не считаем */
        '    float q=A(uv+r)+A(uv-r)+A(uv+vec2(r.x,-r.y))+A(uv+vec2(-r.x,r.y));',
        '    if(q<3.99){',
        '      float b=(q+A(uv+vec2(r.x,0.))+A(uv-vec2(r.x,0.))+A(uv+vec2(0.,r.y))+A(uv-vec2(0.,r.y)))/8.;',
        '      float e=clamp(a*(1.-b)*1.8,0.,1.);',
        '      vec3 bg=(B(uv)+B(uv+vec2(r.x*1.4,0.))+B(uv-vec2(r.x*1.4,0.)))/3.;',
        '      c*=1.-.16*e;',            /* светлый «студийный» ободок прядей приглушается */
        '      c=mix(c,bg,.42*e);',      /* и подхватывает цвет фона под ним */
        '    }',
        '  }',
        '  gl_FragColor=vec4(c*a,a);}'
      ].join('\n');
      var sh=function(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s};
      var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
      var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      var loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      hLoc=gl.getUniformLocation(pr,'h');
      var pxLoc=gl.getUniformLocation(pr,'px'),wrLoc=gl.getUniformLocation(pr,'wr'),onLoc=gl.getUniformLocation(pr,'on');
      gl.uniform1i(gl.getUniformLocation(pr,'t'),0);gl.uniform1i(gl.getUniformLocation(pr,'w'),1);gl.uniform1f(onLoc,0);
      /* текстура вордмарка для подстройки края под фон */
      var wmImg=document.querySelector('.wm img'),wtex=gl.createTexture(),wOK=false;
      var upW=function(){if(wOK||!wmImg||!wmImg.complete||!wmImg.naturalWidth)return;
        gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,wtex);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,wmImg);wOK=true}catch(e){}
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1f(onLoc,wOK?1:0)};
      if(wmImg){wmImg.complete?upW():wmImg.addEventListener('load',upW)}
      glOK=!!gl.getProgramParameter(pr,gl.LINK_STATUS);
    }
  }catch(e){glOK=false}
  /* 21.11 скорость: без видеокарты (программный WebGL: SwiftShader, llvmpipe — слабые ноутбуки, виртуалки, PageSpeed)
     загрузка кадра видео в текстуру идёт на процессоре и блокирует страницу на сотни миллисекунд. Там оставляем постер */
  if(glOK){try{
    var dbg=gl.getExtension('WEBGL_debug_renderer_info'),rn=String(dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));
    if(/swiftshader|llvmpipe|softpipe|software|basic render/i.test(rn))glOK=false;
  }catch(e){}}
  if(!glOK){window.vmLive=noop;return}

  /* ---------- видео ---------- */
  var video=document.createElement('video');
  video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');
  video.playsInline=true;video.setAttribute('playsinline','');
  /* на компьютере ролик качается сразу, чтобы к концу прелоадера человек уже был живым (без «подмены» постера на видео);
     на телефоне после прелоадера, чтобы не отбирать мобильный интернет у первого экрана */
  video.loop=true;video.preload=matchMedia('(pointer:fine)').matches?'auto':'metadata';

  var mq=matchMedia('(max-width:720px)'),cur='';
  function setSrc(){
    /* версия в адресе: при замене файла браузер не возьмёт старое видео из кеша */
    var s=(mq.matches?'media/valentin-live-m.mp4':'media/valentin-live.mp4')+'?v=20261117j';
    if(s===cur)return;
    cur=s;video.src=s;video.load();sync();
  }

  function draw(){
    if(video.readyState<2||!video.videoWidth)return;
    /* холст в размере показа (с учётом плотности экрана), но не больше самого видео */
    var vw=video.videoWidth,vh=video.videoHeight/2;
    if(rectDirty||!cw){var P0=cv.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,3);
      cw=Math.min(vw,Math.max(64,Math.round(P0.width*d)));ch=Math.round(cw*vh/vw)}
    if(cv.width!==cw||cv.height!==ch){cv.width=cw;cv.height=ch}
    gl.viewport(0,0,cv.width,cv.height);
    gl.uniform1f(hLoc,1.5/video.videoHeight);
    gl.uniform2f(pxLoc,1/vw,1/vh);
    /* положение вордмарка относительно портрета: пересчёт только при изменении раскладки и во время анимации появления */
    if(wOK&&(rectDirty||performance.now()<rectUntil)){var P=cv.getBoundingClientRect(),M=wmImg.getBoundingClientRect();
      if(P.width&&P.height){gl.uniform4f(wrLoc,(M.left-P.left)/P.width,(M.top-P.top)/P.height,(M.right-P.left)/P.width,(M.bottom-P.top)/P.height);rectDirty=false}}
    var t0=performance.now();
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    pt.classList.add('live');
    /* страховка: если кадр стабильно рисуется дольше 14 мс (слабое устройство), останавливаем видео, остаётся последний кадр */
    var dt=performance.now()-t0;slow=dt>14?slow+1:Math.max(0,slow-1);
    if(slow>12){dead=true;video.pause();video.removeAttribute('src');video.load()}
  }
  var slow=0,dead=false;
  var rectDirty=true,rectUntil=0,cw=0,ch=0;
  addEventListener('resize',function(){rectDirty=true});
  /* рисуем только когда видео выдало новый кадр (requestVideoFrameCallback), а не на каждом обновлении экрана */
  var raf=0,vfc=0,hasVFC='requestVideoFrameCallback' in HTMLVideoElement.prototype;
  function onFrame(){vfc=0;draw();if(!video.paused&&!video.ended)vfc=video.requestVideoFrameCallback(onFrame)}
  function loop(){draw();raf=(!video.paused&&!video.ended)?requestAnimationFrame(loop):0}
  video.addEventListener('play',function(){
    if(hasVFC){if(vfc)video.cancelVideoFrameCallback(vfc);vfc=video.requestVideoFrameCallback(onFrame)}
    else{cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
  });
  video.addEventListener('seeked',draw);

  /* ---------- играет только после прелоадера, на видимой вкладке и пока hero на экране ---------- */
  var started=false,inView=true,visible=!document.hidden,covered=false;
  function sync(){
    if(dead)return;
    if(started&&inView&&visible&&!covered){var p=video.play();if(p&&p.catch)p.catch(function(){})}
    else if(!video.paused)video.pause();
  }
  document.addEventListener('visibilitychange',function(){visible=!document.hidden;sync()});
  if('IntersectionObserver' in window&&hero){
    new IntersectionObserver(function(es){inView=es[es.length-1].isIntersecting;sync()}).observe(hero);
  }
  if(mq.addEventListener)mq.addEventListener('change',setSrc);else if(mq.addListener)mq.addListener(setSrc);

  setSrc();
  window.vmLive={
    video:video,
    start:function(){if(started)return;started=true;video.preload='auto';rectUntil=performance.now()+2500;sync()},
    relayout:function(){rectDirty=true;if(video.paused)draw()},
    /* hero sticky: когда блок 2 закрыл его целиком, он всё ещё «на экране» для IntersectionObserver */
    cover:function(c){if(covered!==c){covered=c;sync()}}
  };
})();

}catch(e){window.console&&console.error("scripts/live-photo.js",e)}
/* scripts/nowidow.js */
try{
/* Без висячих слов: в абзацах, пунктах списков и заголовках последнее слово склеивается с предыдущим
   неразрывным пробелом, чтобы одно слово («же», «YouTube») не уходило на отдельную строку.
   Текст не меняется, только пробел. Пара склеивается, если вместе не длиннее 24 знаков (иначе может не влезть в телефон).
   Если склеенная пара не влезает в ширину блока (крупный заголовок на телефоне), пробел остаётся обычным.
   Запускается первым из скриптов, до вёрстки первого экрана. */
(function(){
  'use strict';
  var NB=' ';
  function texts(el){
    var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null),a=[],n;
    while((n=w.nextNode()))if(!n.parentNode.closest('script,style,svg,[aria-hidden="true"]'))a.push(n);
    return a;
  }
  /* склейка не должна выталкивать строку за край блока: после замены меряем, при вылезании возвращаем пробел */
  function fits(el){
    /* меряем по родителю: сам элемент в сетке может расшириться вместе с текстом */
    var r=document.createRange();r.selectNodeContents(el);
    var a=r.getBoundingClientRect(),p=el.parentElement,b=p.getBoundingClientRect(),cs=getComputedStyle(p);
    var L=b.left+parseFloat(cs.paddingLeft),R=Math.min(b.right-parseFloat(cs.paddingRight),document.documentElement.clientWidth);
    return a.right<=R+1&&a.left>=L-1;
  }
  function bind(node,s){var old=node.nodeValue;node.nodeValue=s;return old}
  /* прямой замер пары слов той же гарнитурой: склеиваем, только если пара целиком уже ширины блока.
     Проверка по раскладке (fits) в Safari ошибалась, и «миллионы подписчиков» вылезали за экран */
  function pairOK(el,pair){
    if(innerWidth>900)return true; /* на компьютере как раньше (раскладка утверждена) */
    var sp=document.createElement('span');sp.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;left:0;top:0';
    sp.textContent=pair;el.appendChild(sp);var w=sp.getBoundingClientRect().width;el.removeChild(sp);
    var p=el.parentElement,cs=getComputedStyle(p),avail=Math.min(el.clientWidth||1e9,p.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight));
    return w<=avail*.96;
  }
  function fix(el){
    var t=texts(el);
    for(var i=t.length-1;i>=0;i--){
      var s=t[i].nodeValue,trim=s.replace(/\s+$/,'');
      if(!trim)continue;
      var k=trim.lastIndexOf(' ');
      if(k>0){
        var last=trim.slice(k+1),prev=trim.slice(0,k).split(' ').pop();
        if((prev+last).length<=24&&pairOK(el,prev+' '+last)){var o=bind(t[i],s.slice(0,k)+NB+s.slice(k+1));if(!fits(el)){t[i].nodeValue=o;skip.push(el)}}
        return;
      }
      /* последнее слово целиком в своём узле (например, в выделении): склеиваем с пробелом перед ним */
      for(var j=i-1;j>=0;j--){
        var p=t[j].nodeValue;
        if(/ $/.test(p)){
          var pw=p.replace(/ $/,'').split(' ').pop();
          if((pw+trim).length<=24&&pairOK(el,pw+' '+trim)){var o2=bind(t[j],p.replace(/ $/,NB));if(!fits(el)){t[j].nodeValue=o2;skip.push(el)}}
          return;
        }
        if(p.trim())return;
      }
      return;
    }
  }
  var skip=[];
  document.querySelectorAll('main h1,main h2,main h3,main p,main li,main blockquote,main figcaption').forEach(function(el){
    if(!el.querySelector('p,li,h2,h3'))fix(el);
  });
  /* после загрузки шрифтов (они уже, чем запасные) пробуем ещё раз там, где не влезло */
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){
    var again=skip;skip=[];again.forEach(fix);
    if(again.length&&window.vmFit)window.vmFit();
  });
})();

}catch(e){window.console&&console.error("scripts/nowidow.js",e)}
/* scripts/perf.js */
try{
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

}catch(e){window.console&&console.error("scripts/perf.js",e)}
/* scripts/hero-fit.js */
try{
/* Блок 1: первый экран всегда помещается в окно.
   Отступ снизу равен отступу по бокам (--m). Если по высоте не хватает места,
   сначала чуть уменьшается колонка текста и цифр, затем вордмарк и портрет вместе.
   Без JS работает прежняя CSS-вёрстка. */
(function(){
  'use strict';
  var root=document.documentElement,hero=document.getElementById('hero');
  if(!hero)return;
  var inn=hero.querySelector('.hero-in'),wm=hero.querySelector('.wm'),pt=document.getElementById('pt'),
      copy=hero.querySelector('.copy'),stats=hero.querySelector('.stats'),hdr=document.querySelector('.hdr');
  var WM=471/1600,PT=690/744;
  /* силуэт человека по всей петле: левый и правый край в долях ширины кадра, 32 полосы сверху вниз */
  var SL=[1,.467,.402,.366,.344,.33,.319,.312,.308,.304,.301,.301,.301,.304,.319,.33,.377,.377,.366,.304,.239,.174,.134,.116,.101,.087,.076,.065,.058,.054,.047,.04],
      SR=[0,.529,.612,.652,.667,.681,.699,.707,.707,.717,.721,.717,.707,.692,.699,.681,.656,.645,.641,.699,.764,.826,.877,.895,.906,.92,.931,.938,.942,.949,.957,.96];
  /* параметры композиции десктопа (вариант B, утверждён 17.11): текст растёт с шириной экрана до 116%,
     вордмарк ради этого сужается не больше чем до 90%, голова заходит на вордмарк на 12% его высоты */
  var P={grow:1.16,wmMin:.9,head:.12};
  /* те же границы, что в 01-hero.css */
  var mqT=matchMedia('(max-width:1180px)'),mqP=matchMedia('(max-width:720px), (max-width:1180px) and (orientation:portrait)');

  /* высота окна без панелей браузера: --vhl из <head> (на телефонах фиксируется при загрузке), иначе svh */
  var probe=document.createElement('div');
  probe.style.cssText='position:fixed;left:0;top:0;width:0;height:var(--vhl,100svh);visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);

  function px(v){return Math.round(v*100)/100+'px'}
  function reset(){
    root.classList.remove('vm-fit');
    [hero,wm,pt,copy,stats].forEach(function(e){e.removeAttribute('style')});
  }
  function place(e,l,t,w,s){
    var st=e.style;st.left=px(l);st.top=px(t);
    if(w!=null)st.width=px(w);
    if(s!=null){st.transform=s!==1?'scale('+s.toFixed(4)+')':'';st.transformOrigin='0 0'}
  }

  function fit(){
    fitInner();
    if(window.vmLive&&window.vmLive.relayout)window.vmLive.relayout();
  }
  function fitInner(){
    reset();
    /* старые стили из кеша: ничего не трогаем, работает CSS-вёрстка */
    if(getComputedStyle(root).getPropertyValue('--hero-fit').trim()!=='1')return;
    var W=inn.clientWidth,H=probe.getBoundingClientRect().height||innerHeight;
    var m=parseFloat(getComputedStyle(root).getPropertyValue('--m'))||56;
    root.classList.toggle('hero-compact',mqP.matches&&W<=720&&H<760);
    var hh=hdr?hdr.offsetHeight:76;
    var cr=copy.getBoundingClientRect(),sr=stats.getBoundingClientRect();
    var Cw=cr.width,Ch=cr.height,Sw=sr.width,Sh=sr.height;
    /* фактические рамки строк заголовка, абзаца относительно колонки (без пустоты справа) */
    var boxes=[];copy.querySelectorAll('.ln,.sub').forEach(function(e){
      var r=e.getBoundingClientRect(),right=r.right;
      if(!e.classList.contains('btn')){var rg=document.createRange();rg.selectNodeContents(e);right=rg.getBoundingClientRect().right}
      boxes.push({t:r.top-cr.top,b:r.bottom-cr.top,r:right-cr.left})});
    var phone=mqP.matches,desk=!mqT.matches;
    var wmFull=W-2*m,s=1,wmW=wmFull,heroH,pw,ph,pl,ptop,wmTop=hh,col,gap;

    if(!phone){
      /* десктоп: текст слева и цифры справа прижаты к низу; планшет: цифры строкой под текстом */
      gap=desk?6:28;
      var sg=desk?0:26;
      col=desk?Math.max(Ch,Sh):Ch+sg+Sh;
      /* на больших экранах текст и цифры крупнее: от 1440 растут вместе с шириной */
      var ds=desk?Math.min(P.grow,Math.max(1,W/1440)):1;
      var room=function(w){return H-hh-gap-m-w*WM};
      s=Math.min(ds,room(wmFull)/col);
      if(s<ds){
        /* ради крупного текста вордмарк можно немного сузить */
        wmW=Math.max(wmFull*P.wmMin,(room(0)-col*ds)/WM);
        s=Math.min(ds,room(wmW)/col);
      }
      if(s<.82){s=.82;wmW=Math.max(wmFull*.5,(room(0)-col*s)/WM)}
      var wmH=wmW*WM;
      heroH=Math.max(H,hh+wmH+gap+col*s+m);
      var wmL=(W-wmW)/2;
      /* портрет: голова заходит на вордмарк, низ по краю экрана; крупнее за счёт всей свободной высоты */
      var kc=desk?.5787:.756,cx=wmL+kc*wmW;
      ph=heroH-(wmTop+P.head*wmH);pw=ph/PT;
      /* куртка и плечи не наезжают на текст слева и на цифры справа: проверка по силуэту, построчно */
      var cTop=heroH-m-(desk?Ch:(Sh+sg+Ch))*s,sTop=heroH-m-Sh*s,sLeft=desk?W-m-Sw*s:m,pad=desk?20:16,cx0=cx;
      var lefts=boxes.map(function(bx){return {t:cTop+bx.t*s,b:cTop+bx.b*s,r:m+bx.r*s}});
      if(!desk)lefts.push({t:sTop,b:heroH-m,r:m+Sw*s});
      for(var it=0;it<60;it++){
        var top=heroH-ph,lo=-1e9,hi=desk?1e9:W-pw/2;
        for(var k=1;k<32;k++){
          var y0=top+k*ph/32,y1=y0+ph/32;
          lefts.forEach(function(bx){if(bx.b>y0&&bx.t<y1)lo=Math.max(lo,bx.r+pad-(SL[k]-.5)*pw)});
          if(desk&&sTop<y1)hi=Math.min(hi,sLeft-pad-(SR[k]-.5)*pw);
        }
        if(lo<=hi){cx=Math.max(lo,Math.min(cx0,hi));break}
        ph*=.97;pw=ph/PT;
      }
      ptop=heroH-ph;pl=Math.min(W-pw,cx-pw/2);
      root.classList.add('vm-fit');
      hero.style.height=px(heroH);
      place(wm,wmL,wmTop,wmW);
      place(pt,pl,ptop,pw);pt.style.height=px(ph);
      if(desk){
        place(copy,m,heroH-m-Ch*s,Cw,s);
        place(stats,W-m-Sw*s,heroH-m-Sh*s,Sw,s);
      }else{
        place(stats,m,heroH-m-Sh*s,Sw,s);
        place(copy,m,heroH-m-(Sh+sg+Ch)*s,Cw,s);
      }
    }else{
      /* телефон и вертикальный планшет: портрет сверху на вордмарке, текст и цифры внизу */
      wmTop=hh+(m<20?4:0);
      var ptTop=wmTop+.04*wmFull*WM,g1=12,sg2=20;
      col=Ch+(root.classList.contains("hero-compact")?12:sg2)+Sh;
      var phFull=W*PT;
      /* человек в приоритете: текст сначала чуть уменьшается (до 86%), чтобы портрет был не меньше 78% ширины экрана */
      s=Math.max(.84,Math.min(1,(H-ptTop-g1-.78*phFull-m)/col));
      ph=Math.min(phFull,H-ptTop-g1-col*s-m);
      if(ph<phFull*.56){
        ph=phFull*.56;
        s=Math.max(.8,Math.min(1,(H-ptTop-g1-ph-m)/col));
      }
      heroH=Math.max(H,ptTop+ph+g1+col*s+m);
      pw=ph/PT;
      root.classList.add('vm-fit');
      hero.style.height=px(heroH);
      place(wm,m,wmTop,wmFull);
      place(pt,(W-pw)/2,ptTop,pw);pt.style.height=px(ph);
      /* колонка на всю ширину между полями и после уменьшения */
      var sg3=root.classList.contains('hero-compact')?12:sg2;
      place(stats,m,heroH-m-Sh*s,(W-2*m)/s,s);
      place(copy,m,heroH-m-(Sh+sg3+Ch)*s,(W-2*m)/s,s);
    }
  }

  var raf=0,lastW=0,lastH=0,coarse=matchMedia('(pointer:coarse)').matches;
  function schedule(){
    var W=inn.clientWidth,H=probe.getBoundingClientRect().height;
    if(W===lastW&&(H===lastH||coarse))return; /* на телефоне смена одной высоты (панели браузера) не пересобирает экран */
    lastW=W;lastH=H;cancelAnimationFrame(raf);raf=requestAnimationFrame(fit);
  }
  function force(){lastW=lastH=0;schedule()}
  /* window.vmFit вызывается из <head>, когда в первые секунды меняется высота окна (шторка Telegram) */
  addEventListener('resize',schedule);
  addEventListener('load',force);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(force);
  fit();lastW=inn.clientWidth;lastH=probe.getBoundingClientRect().height;
  window.vmFit=force;
})();

}catch(e){window.console&&console.error("scripts/hero-fit.js",e)}
/* scripts/hero.js */
try{
/* Блок 1: запуск анимаций после прелоадера и счётчики цифр.
   Без анимаций (prefers-reduced-motion) цифры остаются финальными из разметки. */
(function(){
  'use strict';
  var root=document.documentElement;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  function countUp(){
    var els=document.querySelectorAll('.stat-num');
    Array.prototype.forEach.call(els,function(el,i){
      var to=+el.dataset.to,dec=+(el.dataset.dec||0),suf=el.dataset.suffix||'',unit=el.dataset.unit;
      var t0=performance.now()+600+i*100,dur=1300;
      (function step(now){
        var k=Math.max(0,Math.min(1,(now-t0)/dur)),e=1-Math.pow(1-k,4);
        var v=(to*e).toFixed(dec).replace('.',',');
        el.innerHTML=v+suf+(unit?'<small>'+unit+'</small>':'');
        if(k<1)requestAnimationFrame(step);
      })(performance.now());
    });
  }

  function open(){
    root.classList.remove('is-loading');
    void root.offsetWidth;
    root.classList.add('is-go');
    countUp();
    setTimeout(function(){if(window.vmLive)window.vmLive.start()},700);
  }
  document.addEventListener('vm:open',open,{once:true});
})();

}catch(e){window.console&&console.error("scripts/hero.js",e)}
/* scripts/preloader.js */
try{
/* Прелоадер-спидометр, привязан к реальной загрузке: шрифты, постер, вордмарк, canplaythrough видео.
   Стрелка 0→320 не быстрее 1,7 с, плавно встаёт на 320, через 0,25 с шторка вверх.
   Если загрузка дольше 4 с, сайт открывается всё равно. По окончании шлёт событие vm:open. */
(function(){
  'use strict';
  var root=document.documentElement;
  if(!root.classList.contains('is-loading'))return;
  var svg=document.getElementById('gsvg');
  if(!svg){open();return}

  /* ---------- шкала ---------- */
  var CX=200,CY=200,R=150,MAX=320,A0=225,SWEEP=270;
  function ang(v){return (A0-v/MAX*SWEEP)*Math.PI/180}
  function pt(v,r){return [CX+r*Math.cos(ang(v)),CY-r*Math.sin(ang(v))]}
  function arc(v1,v2,r){var a=pt(v1,r),c=pt(v2,r),large=(v2-v1)/MAX*SWEEP>180?1:0;
    return 'M'+a[0].toFixed(2)+' '+a[1].toFixed(2)+'A'+r+' '+r+' 0 '+large+' 1 '+c[0].toFixed(2)+' '+c[1].toFixed(2)}
  var g='<path d="'+arc(0,MAX,R+6)+'" fill="none" stroke="#DCD2C8" stroke-width="16" stroke-linecap="butt"/>';
  g+='<path d="'+arc(0,MAX,R)+'" fill="none" stroke="#111" stroke-width="6"/>';
  g+='<path id="redzone" d="'+arc(240,MAX,R+6)+'" fill="none" stroke="#9A0002" stroke-width="15"/>';
  for(var v=0;v<=MAX;v+=20){
    var major=v%40===0,a=pt(v,R-3),c=pt(v,R-(major?22:13));
    g+='<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+c[0]+'" y2="'+c[1]+'" stroke="#111" stroke-width="'+(major?4:2)+'" stroke-linecap="round"/>';
    if(major){var t=pt(v,R-42);g+='<text x="'+t[0]+'" y="'+t[1]+'" text-anchor="middle" dominant-baseline="central" font-family="Inter Tight,Arial" font-weight="700" font-size="15" fill="#111">'+v+'</text>'}
  }
  g+='<g id="needle"><path d="M'+(CX-5)+' '+CY+' L'+CX+' '+(CY-2.2)+' L'+(CX+R-14)+' '+CY+' L'+CX+' '+(CY+2.2)+'Z" fill="#9A0002"/></g>';
  g+='<text id="gnum" x="'+CX+'" y="'+(CY+78)+'" text-anchor="middle" font-family="Inter Tight,Arial" font-weight="900" font-size="68" letter-spacing="-2.5" fill="#111">000</text>';
  g+='<text x="'+CX+'" y="'+(CY+104)+'" text-anchor="middle" font-family="Inter Tight,Arial" font-weight="700" font-size="12" letter-spacing="2.6" fill="#9A0002">KM/H</text>';
  g+='<circle cx="'+CX+'" cy="'+CY+'" r="13" fill="none" stroke="#111" stroke-width="1.5"/><circle cx="'+CX+'" cy="'+CY+'" r="8.5" fill="#111"/>';
  svg.innerHTML=g;
  var gnum=document.getElementById('gnum'),needle=document.getElementById('needle'),red=document.getElementById('redzone');
  var redLen=red.getTotalLength();red.style.strokeDasharray=redLen;
  function setGauge(val){
    needle.setAttribute('transform','rotate('+(-(A0-val/MAX*SWEEP))+' '+CX+' '+CY+')');
    gnum.textContent=String(Math.round(val)).padStart(3,'0');
    var p=Math.max(0,Math.min(1,(val-240)/80));red.style.strokeDashoffset=redLen*(1-p);
  }
  setGauge(0);

  /* ---------- реальная загрузка ---------- */
  function imgReady(img){
    return new Promise(function(res){
      if(!img||(img.complete&&img.naturalWidth))return res();
      img.addEventListener('load',function(){res()},{once:true});
      img.addEventListener('error',function(){res()},{once:true});
    });
  }
  function fontsReady(){
    if(!document.fonts)return Promise.resolve();
    return Promise.all([
      document.fonts.load('900 1em "Fira XC"'),
      document.fonts.load('700 1em "Inter Tight"'),
      document.fonts.load('400 1em "Inter"')
    ]).catch(function(){}).then(function(){return document.fonts.ready});
  }
  /* на компьютере ждём первый кадр живого фото (общий предел тот же, 2,5 с), чтобы человек выезжал уже живым */
  function firstFrame(){
    var v=window.vmLive&&window.vmLive.video;
    if(!v||!matchMedia('(pointer:fine)').matches)return Promise.resolve();
    return new Promise(function(res){
      if(v.readyState>=2)return res();
      v.addEventListener('loadeddata',function(){res()},{once:true});
      v.addEventListener('error',function(){res()},{once:true});
    });
  }
  var tasks=[
    fontsReady(),
    imgReady(document.querySelector('.pt img')),
    imgReady(document.querySelector('.wm img')),
    firstFrame()
    /* на телефоне видео не ждём: пока оно грузится, виден постер, живое фото включается само, когда готово
       (раньше ждали полной загрузки ролика, и в Telegram на мобильном интернете прелоадер висел до 4 с) */
  ];
  var done=0,ready=false;
  tasks.forEach(function(p){p.then(function(){done++})});
  Promise.all(tasks).then(function(){ready=true});
  setTimeout(function(){ready=true},2500);

  /* ---------- стрелка ---------- */
  var T=1700,t0=null,last=0,p=0,settled=null;
  function ease(k){return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2}
  function tick(now){
    if(t0===null){t0=now+250;last=now}
    var dt=Math.min(.05,(now-last)/1000);last=now;
    var k=Math.max(0,Math.min(1,(now-t0)/T));
    var target=ease(k);                                   // не быстрее 1,7 с
    if(!ready)target=Math.min(target,.12+.7*done/tasks.length); // пока грузится, не доходит до красной зоны
    if(target>p)p+=(target-p)*Math.min(1,dt*9);           // плавное догоняние, без перелёта
    if(ready&&k>=1&&1-p<.002)p=1;
    setGauge(p*MAX);
    if(p===1){
      if(settled===null)settled=now;
      if(now-settled>=250){open();return}
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function open(){
    root.classList.add('is-leaving');
    document.dispatchEvent(new Event('vm:open'));
    setTimeout(function(){root.classList.remove('is-leaving')},1100);
  }
})();

}catch(e){window.console&&console.error("scripts/preloader.js",e)}
/* scripts/people.js */
try{
/* Блок 2. Это сделали люди без опыта
   1) Наезд на hero: пока блок едет поверх липкого hero, hero темнеет (--cover на самом hero: на <html> он пересчитывал стили всей страницы каждый кадр);
      когда закрыт целиком, прячется и живое видео ставится на паузу.
   2) Вау-момент: рамка видоискателя с REC переезжает с человека на человека,
      тот, на ком рамка, цветной. Сама идёт по кругу, пока блок на экране;
      на наведение или фокус встаёт на выбранного человека.
   На телефоне рамка встаёт на человека по касанию.
   Без JS и при prefers-reduced-motion все фото цветные, рамки нет. */
(function(){
  'use strict';
  var root=document.documentElement,sec=document.getElementById('people'),hero=document.getElementById('hero');
  if(!sec)return;

  /* ---------- наезд ---------- */
  var cov=-1,hidden=false,tick=0;
  function cover(){
    tick=0;
    var top=sec.getBoundingClientRect().top,vh=window.vmVH||innerHeight||1;
    var p=Math.max(0,Math.min(1,1-top/vh));
    p=Math.round(p*100)/100;
    if(p!==cov){cov=p;(hero||root).style.setProperty('--cover',p)}
    var h=top<=0;
    if(h!==hidden){
      hidden=h;root.classList.toggle('hero-covered',h);
      if(window.vmLive&&window.vmLive.cover)window.vmLive.cover(h);
    }
  }
  function onScroll(){if(!tick)tick=requestAnimationFrame(cover)}
  if(hero){addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);cover()}

  /* ---------- видоискатель ---------- */
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var row=sec.querySelector('.ppl-row'),cards=[].slice.call(sec.querySelectorAll('.pc'));
  if(!row||!cards.length)return;
  var vf=document.createElement('span');vf.className='vf';vf.setAttribute('aria-hidden','true');
  row.appendChild(vf);
  sec.classList.add('is-vf');

  var cur=-1,timer=0,inView=false,hover=false,resume=0,STEP=2400;

  /* прямоугольник фото карточки относительно ряда (у двойной: обе фотографии) */
  /* по offset-координатам (без учёта transform): карточка под курсором приподнимается, рамка едет вместе с ней на LIFT */
  var LIFT=8,lifted=-1;
  function box(i){
    /* li не сдвигается, a внутри приподнимается: смещение картинок считаем от a, положение от li */
    var li=cards[i],a=li.querySelector('a'),imgs=li.querySelectorAll('.ph img'),
        r=row.getBoundingClientRect(),lr=li.getBoundingClientRect(),ar=a.getBoundingClientRect(),
        L=1e9,T=1e9,R=-1e9,B=-1e9;
    for(var k=0;k<imgs.length;k++){
      var b=imgs[k].getBoundingClientRect(),x=lr.left-r.left+b.left-ar.left,y=lr.top-r.top+b.top-ar.top;
      L=Math.min(L,x);T=Math.min(T,y);R=Math.max(R,x+b.width);B=Math.max(B,y+b.height);
    }
    return {x:L,y:T-(i===lifted?LIFT:0),w:R-L,h:B-T};
  }
  function place(jump){
    if(cur<0)return;
    var b=box(cur);
    vf.classList.toggle('jump',!!jump);
    vf.style.transform='translate('+b.x.toFixed(1)+'px,'+b.y.toFixed(1)+'px)';
    vf.style.width=b.w.toFixed(1)+'px';vf.style.height=b.h.toFixed(1)+'px';
    if(jump){void vf.offsetWidth;vf.classList.remove('jump')}
  }
  function go(i,jump){
    i=(i+cards.length)%cards.length;
    if(i===cur)return;
    if(cur>=0)cards[cur].classList.remove('on');
    var first=cur<0;cur=i;cards[cur].classList.add('on');
    place(jump||first);
    if(first)requestAnimationFrame(function(){vf.classList.add('ready')});
  }

  function stop(){clearTimeout(timer);timer=0}
  function run(){
    stop();
    if(!inView||hover||document.hidden)return;
    timer=setTimeout(function(){go(cur+1);run()},STEP);
  }

  /* наведение мышью и фокус с клавиатуры: рамка встаёт на человека */
  var fine=matchMedia('(hover:hover) and (pointer:fine)');
  cards.forEach(function(c,i){
    c.addEventListener('mouseenter',function(){if(!fine.matches)return;hover=true;lifted=i;clearTimeout(resume);stop();if(cur===i)place();else go(i)});
    c.addEventListener('mouseleave',function(){if(lifted!==i)return;lifted=-1;place()});
    c.addEventListener('focusin',function(){hover=true;clearTimeout(resume);stop();go(i)});
    c.addEventListener('focusout',function(){hover=false;resume=setTimeout(run,1200)});
  });
  /* телефон: по касанию рамка сразу встаёт на человека, автосмена ждёт 4 с */
  cards.forEach(function(c,i){
    function tap(e){if(e.pointerType==='mouse')return;clearTimeout(resume);stop();go(i);resume=setTimeout(run,4000)}
    c.addEventListener('pointerdown',tap,{passive:true});
  });
  row.addEventListener('mouseleave',function(){if(!fine.matches)return;hover=false;clearTimeout(resume);resume=setTimeout(run,1200)});

  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      inView=es[es.length-1].isIntersecting;
      if(inView&&cur<0)go(0,true);
      run();
    },{threshold:.35}).observe(row);
  }else{inView=true;go(0,true);run()}
  document.addEventListener('visibilitychange',run);

  /* раскладка изменилась (окно, шрифты, картинки): рамку на место без анимации */
  var rz=0;
  function relayout(){cancelAnimationFrame(rz);rz=requestAnimationFrame(function(){place(true)})}
  addEventListener('resize',relayout);
  if(window.ResizeObserver)new ResizeObserver(relayout).observe(row);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(relayout);
})();

}catch(e){window.console&&console.error("scripts/people.js",e)}
/* scripts/lesson.js */
try{
/* Блок 3. Видео + бегущая строка
   1) Вау-момент: обложка при прокрутке вырастает с 88% до 100% (--p от 0 до 1).
      0, когда верх рамки у низа окна; 1, когда карточка поднялась на 45% высоты окна.
   2) Плеер: видео грузится только по клику на play, обложка меняется на <video> с controls.
   При prefers-reduced-motion карточка сразу в полном размере. */
(function(){
  'use strict';
  var card=document.getElementById('les-card');
  if(!card)return;

  /* ---------- плеер ---------- */
  var btn=card.querySelector('.les-play');
  function play(){
    if(card.classList.contains('is-on'))return;
    var v=document.createElement('video');
    v.src=card.getAttribute('data-src');
    v.controls=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';
    v.poster=card.getAttribute('data-poster')||'';
    card.appendChild(v);card.classList.add('is-on');
    var p=v.play();if(p&&p.catch)p.catch(function(){});
    v.focus({preventScroll:true});
  }
  if(btn)btn.addEventListener('click',play);
  card.addEventListener('click',function(e){if(e.target===card)play()});

  /* ---------- обложка (фон карточки) подгружается, когда блок подъезжает к экрану ---------- */
  if('IntersectionObserver' in window){
    var bgIO=new IntersectionObserver(function(es){if(es[0].isIntersecting){card.classList.add('bg');bgIO.disconnect()}},{rootMargin:'100% 0px'});
    bgIO.observe(card);
  }else card.classList.add('bg');

  /* ---------- рост обложки ---------- */
  var frame=card.parentNode;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var tick=0,last=-1;
  function upd(){
    tick=0;
    var r=frame.getBoundingClientRect(),vh=window.vmVH||innerHeight||1;
    if(r.top>vh*1.2||r.bottom<-vh*.2)return;
    var p=(vh-r.top)/(vh*.45);
    p=Math.max(0,Math.min(1,p));
    p=1-Math.pow(1-p,2);
    p=Math.round(p*1000)/1000;
    if(p!==last){last=p;frame.style.setProperty('--p',p)}
  }
  function on(){if(!tick)tick=requestAnimationFrame(upd)}
  addEventListener('scroll',on,{passive:true});addEventListener('resize',on);
  frame.style.setProperty('--p',0);upd();
})();

}catch(e){window.console&&console.error("scripts/lesson.js",e)}
/* scripts/pain.js */
try{
/* Блок 4. Боль + мысль Валентина
   Вау-момент: карточки чуть приподняты (.is-sk), когда альбом заметно вошёл в экран,
   маркер проводит по фразе мамы и фото по очереди «прижимаются» к булавке (.is-on). Фото сразу цветные, без набросков. Задержки и переходы в 04-pain.css.
   Без JS и при prefers-reduced-motion сразу финальное состояние. */
/* Подписи на полароидах никогда не выходят за карточку: если строка шире белого поля (видимая карточка внутри PNG минус поля по 6%),
   кегль уменьшается ровно настолько, чтобы влезть. Пересчёт при смене ширины и когда догрузился рукописный шрифт */
(function(){
  'use strict';
  var caps=[].slice.call(document.querySelectorAll('#pain .pin figcaption'));
  if(!caps.length)return;
  function fit(){
    caps.forEach(function(c){
      c.style.fontSize='';
      /* доля ширины картинки, которую занимает сама карточка (по краям поля с вшитой тенью): mom, pc, me */
      var pin=c.parentNode,k=pin.classList.contains('pin-1')?.668:pin.classList.contains('pin-2')?.643:.619,avail=pin.offsetWidth*k*.88;
      var rg=document.createRange();rg.selectNodeContents(c);
      var w=rg.getBoundingClientRect().width; /* у повёрнутой карточки рамка чуть шире текста: запас в нашу пользу */
      if(w>avail&&w>0){var fs=parseFloat(getComputedStyle(c).fontSize);c.style.fontSize=(fs*avail/w).toFixed(2)+'px'}
    });
  }
  fit();
  if(document.fonts){if(document.fonts.ready)document.fonts.ready.then(fit);if(document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',fit)}
  if(window.ResizeObserver){var b=document.querySelector('#pain .board');if(b)new ResizeObserver(fit).observe(b)}
  else addEventListener('resize',fit);
})();

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

}catch(e){window.console&&console.error("scripts/pain.js",e)}
/* scripts/nobloger.js */
try{
/* Блок 5. Без блогерства
   Карточки ложатся стопкой через position:sticky (CSS). Скрипт только уменьшает нижние карточки,
   пока на них заезжает следующая: −4% за каждую карточку сверху.
   При prefers-reduced-motion ничего не делает (стопка в CSS тоже выключена). */
(function(){
  'use strict';
  var sec=document.getElementById('nobl');
  if(!sec||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var cards=[].slice.call(sec.querySelectorAll('.nob-c'));
  if(cards.length<2)return;
  var on=false,raf=0;

  function update(){
    raf=0;
    var cs=getComputedStyle(sec),ch=parseFloat(cs.getPropertyValue('--ch'))||400;
    /* насколько каждая карточка уже «легла»: 0 далеко внизу, 1 прилипла */
    var p=cards.map(function(c){
      var stuck=parseFloat(getComputedStyle(c).top)||0,d=c.getBoundingClientRect().top-stuck;
      return Math.max(0,Math.min(1,1-d/ch));
    });
    cards.forEach(function(c,i){
      var k=0;for(var j=i+1;j<cards.length;j++)k+=p[j];
      c.style.transform=k?'scale('+(1-.04*k).toFixed(4)+')':'';
    });
  }
  function req(){if(on&&!raf)raf=requestAnimationFrame(update)}

  new IntersectionObserver(function(es){on=es[0].isIntersecting;if(on)req()}).observe(sec);
  addEventListener('scroll',req,{passive:true});
  addEventListener('resize',req);
})();

}catch(e){window.console&&console.error("scripts/nobloger.js",e)}
/* scripts/gears.js */
try{
/* Блок 6. Коробка передач
   Сцена закреплена (sticky), прогресс скролла по .gb-run ведёт ручку: пауза на каждой передаче, переход между ними.
   Плавность (21.11):
   - путь прямыми отрезками; ручка движется в «пространстве передач» g = 0..4, на каждом прямом куске разгон и торможение (smoothstep),
     поэтому в передачах и углах скорость ручки нулевая: развороты и повороты без рывка даже при быстром скролле;
   - при перетаскивании ручка идёт за курсором с ограниченной скоростью (1,1 передачи в секунду);
   - g догоняет цель по критически демпфированной пружине: ни скачков скорости, ни «упора» в предел скорости;
   - путь заранее разбит на таблицу точек, на кадре нет замеров раскладки; ручка двигается одним transform;
   - подсветка без SVG-размытия (фильтр перерисовывался на каждом кадре).
   Ручку можно перетащить по прорезям: отпущенная встаёт в ближайшую передачу, и страница плавно докручивается
   до места этой передачи. Подписи передач кликаются так же.
   При prefers-reduced-motion скрипт не запускается: в разметке финальное состояние. */
(function(){
  'use strict';
  var sec=document.getElementById('ladder');
  if(!sec||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var run=sec.querySelector('.gb-run'),knob=sec.querySelector('.gb-knob'),
      lines=[].slice.call(sec.querySelectorAll('.gb-trail path')),items=[].slice.call(sec.querySelectorAll('.gb-l'));
  if(!run||!knob||!lines.length)return;

  var W=1672,H=941,X1=303.5,X3=828,X5=1351,T=234,N=461,B=684;
  /* путь 1→2→3→4→5 прямыми отрезками через нейтраль (21.11: клиент попросил только прямые линии).
     Участок между передачами g..g+1 состоит из прямых кусков; на каждом куске ручка разгоняется и тормозит (smoothstep),
     поэтому в углах и в передачах скорость нулевая и поворот на 90° не дёргается */
  var SEG=[
    [[X1,T],[X1,B]],
    [[X1,B],[X1,N],[X3,N],[X3,T]],
    [[X3,T],[X3,B]],
    [[X3,B],[X3,N],[X5,N],[X5,T]]
  ];
  var PCS=[],GEAR=[0],TOTAL=0;/* куски: {g,a,b,len,s0,u0,u1} */
  SEG.forEach(function(pts,g){
    var L=0,i,list=[];
    for(i=1;i<pts.length;i++){var l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);list.push({g:g,a:pts[i-1],b:pts[i],len:l});L+=l}
    var u=0;list.forEach(function(p){p.s0=TOTAL;p.u0=u;u+=p.len/L;p.u1=u;TOTAL+=p.len;PCS.push(p)});
    GEAR.push(TOTAL);
  });
  lines.forEach(function(l){l.style.strokeDasharray=TOTAL+' '+(TOTAL+10);l.style.strokeDashoffset=TOTAL});
  function ss(t){t=t<0?0:t>1?1:t;return t*t*(3-2*t)}
  function iss(f){var lo=0,hi=1;for(var k=0;k<22;k++){var m=(lo+hi)/2;if(ss(m)<f)lo=m;else hi=m}return (lo+hi)/2}
  /* g (0..4) → кусок, точка и длина пройденного пути */
  function state(g){
    g=g<0?0:g>4?4:g;var i=Math.min(3,Math.floor(g)),u=g-i,p=null;
    for(var k=0;k<PCS.length;k++){var q=PCS[k];if(q.g===i&&u<=q.u1+1e-9){p=q;break}}
    if(!p)p=PCS[PCS.length-1];
    var t=ss((u-p.u0)/((p.u1-p.u0)||1));
    return {x:p.a[0]+(p.b[0]-p.a[0])*t,y:p.a[1]+(p.b[1]-p.a[1])*t,s:p.s0+p.len*t};
  }
  /* ближайшая к курсору точка пути → g; из совпадающих кусков (прорезь проходится туда и обратно) берём ближний к текущему g */
  function gAt(x,y,cur){
    var best=null;
    PCS.forEach(function(p){
      var dx=p.b[0]-p.a[0],dy=p.b[1]-p.a[1],L2=dx*dx+dy*dy||1,t=((x-p.a[0])*dx+(y-p.a[1])*dy)/L2;t=t<0?0:t>1?1:t;
      var d=Math.hypot(x-(p.a[0]+dx*t),y-(p.a[1]+dy*t)),g=p.g+p.u0+(p.u1-p.u0)*iss(t);
      if(!best||d<best.d-2||(Math.abs(d-best.d)<=2&&Math.abs(g-cur)<Math.abs(best.g-cur)))best={d:d,g:g};
    });
    return best.g;
  }

  var bw=0,bh=0;
  function size(){var box=knob.parentNode;bw=box.clientWidth;bh=box.clientHeight}
  var lastS=-1;
  function place(g){
    var st=state(g);if(!bw)size();
    knob.style.transform='translate3d('+(st.x/W*bw).toFixed(2)+'px,'+(st.y/H*bh).toFixed(2)+'px,0) translate(-50%,-50%)';
    if(Math.abs(st.s-lastS)>.25){lastS=st.s;var o=(TOTAL-st.s).toFixed(1);lines.forEach(function(l){l.style.strokeDashoffset=o})}
    mark(g);
  }
  var shown=-1;
  function mark(g){
    var reached=Math.min(4,Math.floor(g+.12));
    if(reached===shown)return;shown=reached;
    items.forEach(function(it,i){it.classList.toggle('on',i<=reached);it.classList.toggle('cur',i===reached)});
  }

  /* скролл задаёт цель: у каждой передачи пауза (DWELL), между ними равномерный переход */
  var DWELL=.34;
  function target(){
    var r=run.getBoundingClientRect(),len=r.height-(window.vmVH||innerHeight);
    var p=len>0?Math.max(0,Math.min(1,-r.top/len)):1,u=p*4,i=Math.min(3,Math.floor(u)),f=u-i;
    if(p>=1)return 4;
    return i+Math.max(0,Math.min(1,(f-DWELL/2)/(1-DWELL)));
  }
  /* критически демпфированная пружина: плавный разгон и торможение без перерегулирования */
  var g=target(),v=0,goal=g,raf=0,last=0,OMEGA=7.5,VMAX=0;
  function tick(now){
    var dt=Math.min(.05,(now-(last||now))/1000);last=now;
    var steps=Math.max(1,Math.ceil(dt/.008)),h=dt/steps;
    for(var k=0;k<steps;k++){
      var a=OMEGA*OMEGA*(goal-g)-2*OMEGA*v;
      v+=a*h;
      /* при перетаскивании скорость ограничена: курсор можно увести с 4-й сразу ко 2-й, ручка пройдёт путь спокойно */
      if(VMAX){if(v>VMAX)v=VMAX;else if(v<-VMAX)v=-VMAX}
      g+=v*h;
    }
    if(Math.abs(goal-g)<.0008&&Math.abs(v)<.003){g=goal;v=0}
    place(g);
    raf=(g!==goal||v!==0)?requestAnimationFrame(tick):(last=0,0);
  }
  function go(t){goal=t;if(!raf){last=0;raf=requestAnimationFrame(tick)}}

  /* ручное управление. Источник правды один: прокрутка страницы */
  var drag=false,lock=null,lockY=0,lockT=0;
  function unlock(){lock=null}
  function kick(){
    if(drag)return;
    if(lock!==null){
      if(Math.abs(scrollY-lockY)>2&&performance.now()-lockT<1600)return;
      lock=null;
    }
    go(target());
  }
  addEventListener('wheel',unlock,{passive:true});addEventListener('touchstart',function(e){if(e.target!==knob)unlock()},{passive:true});
  addEventListener('keydown',unlock);
  function project(cx,cy){
    var r=knob.parentNode.getBoundingClientRect();
    return gAt((cx-r.left)/r.width*W,(cy-r.top)/r.height*H,g);
  }
  function scrollFor(gr){
    var r=run.getBoundingClientRect(),len=r.height-(window.vmVH||innerHeight);
    return Math.round(scrollY+r.top+Math.max(0,len)*(gr/4));
  }
  function shift(gr){
    go(gr);
    var y=scrollFor(gr);
    if(Math.abs(y-scrollY)>2){lock=gr;lockY=y;lockT=performance.now();window.scrollTo({top:y,behavior:'smooth'})}
  }
  var pid=null,dragGoal=0;
  knob.addEventListener('pointerdown',function(e){
    if(e.button>0)return;
    e.preventDefault();drag=true;pid=e.pointerId;sec.classList.add('is-grab');
    try{knob.setPointerCapture(pid)}catch(_){}
  });
  /* за пальцем: цель ставим сразу, пружина с высокой жёсткостью сглаживает дрожание руки */
  knob.addEventListener('pointermove',function(e){
    if(!drag||e.pointerId!==pid)return;
    dragGoal=project(e.clientX,e.clientY);
    OMEGA=10;VMAX=1.1;go(dragGoal);
  });
  function release(e){
    if(!drag||(e&&e.pointerId!==pid))return;
    drag=false;pid=null;sec.classList.remove('is-grab');OMEGA=7.5;VMAX=0;
    shift(Math.round(Math.max(0,Math.min(4,goal))));
  }
  knob.addEventListener('pointerup',release);knob.addEventListener('pointercancel',release);
  knob.addEventListener('lostpointercapture',release);
  knob.addEventListener('dragstart',function(e){e.preventDefault()});
  items.forEach(function(it,i){it.addEventListener('click',function(){shift(i)})});

  sec.classList.add('js');
  place(g);
  addEventListener('scroll',kick,{passive:true});
  addEventListener('resize',function(){size();place(g);kick()});
  if(window.ResizeObserver)new ResizeObserver(function(){size();place(g)}).observe(knob.parentNode);
})();

}catch(e){window.console&&console.error("scripts/gears.js",e)}
/* scripts/vacancies.js */
try{
/* Блок 7. Вакансии: круговой веер
   Сцена закреплена (sticky). Прогресс скролла по .vc-run плавно (инерция + предел скорости) раскрывает веер:
   сначала проявляется центральная вакансия, потом из колоды за ней по кругу (по часовой, от верха)
   разъезжаются остальные карточки с лёгким «доездом», на месте каждая встаёт в свой наклон. Дальше пауза.
   На десктопе доска мягко наклоняется за курсором (объём за счёт разных слоёв глубины карточек).
   При prefers-reduced-motion скрипт не запускается: веер раскрыт в разметке. */
(function(){
  'use strict';
  var sec=document.getElementById('vacancies');
  if(!sec||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var run=sec.querySelector('.vc-run'),stage=sec.querySelector('.vc-stage'),board=sec.querySelector('.vc-board');
  var cards=[].slice.call(sec.querySelectorAll('.vc-c'));
  if(!run||!board)return;
  var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

  function cl(v){return v<0?0:v>1?1:v}
  function ease(t){return 1-Math.pow(1-t,3)}
  function back(t){var c=.9;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}

  var list=[],main=null;
  function measure(){
    var bw=board.clientWidth,bh=board.clientHeight;
    var vis=cards.filter(function(c){return c.offsetParent!==null});
    main=vis.filter(function(c){return c.classList.contains('vc-main')})[0];
    var cx=main?main.offsetLeft:bw/2,cy=main?main.offsetTop:bh/2;
    list=vis.filter(function(c){return c!==main}).map(function(c){
      var ox=cx-c.offsetLeft,oy=cy-c.offsetTop;
      /* угол от верха по часовой: в таком порядке карточки выезжают */
      var a=Math.atan2(-ox,oy);if(a<0)a+=2*Math.PI;
      return {el:c,ox:ox,oy:oy,a:a};
    }).sort(function(p,q){return p.a-q.a});
  }

  function setv(el,k,v){el.style.setProperty(k,v)}
  function draw(p){
    if(main){
      var m=ease(cl(p/.16));
      setv(main,'--e',(.73+.27*m).toFixed(3));setv(main,'--o',Math.min(1,.15+m*1.6).toFixed(3));
      setv(main,'--dy',((1-m)*30).toFixed(1)+'px');
    }
    var n=list.length;
    list.forEach(function(c,i){
      var t=cl((p-.1-i*(.3/n))/.34),pos=back(t),e=ease(t);
      setv(c.el,'--dx',(c.ox*(1-pos)).toFixed(1)+'px');setv(c.el,'--dy',(c.oy*(1-pos)).toFixed(1)+'px');
      setv(c.el,'--e',e.toFixed(3));setv(c.el,'--o',cl(t*4).toFixed(3));
    });
  }

  function target(){
    var r=run.getBoundingClientRect(),vh=window.vmVH||innerHeight,a=vh*.85,len=a+r.height-vh;
    return len>0?cl((a-r.top)/len/.8):1; /* веер раскрыт к 80% пути, дальше пауза */
  }

  /* наклон за курсором */
  var tx=0,ty=0,gx=0,gy=0;
  if(fine&&stage){
    stage.addEventListener('pointermove',function(ev){
      var r=board.getBoundingClientRect();
      gx=cl((ev.clientX-r.left)/r.width)-.5;gy=cl((ev.clientY-r.top)/r.height)-.5;kick();
    });
    stage.addEventListener('pointerleave',function(){gx=gy=0;kick()});
  }

  var q=0,goal=0,raf=0,last=0;
  function tick(now){
    var dt=Math.min(64,now-(last||now));last=now;
    var k=1-Math.pow(1-.09,dt/16.7),step=(goal-q)*k,vmax=.8*dt/1000;
    q+=Math.max(-vmax,Math.min(vmax,step));
    if(Math.abs(goal-q)<.0005)q=goal;
    var kt=1-Math.pow(1-.07,dt/16.7);
    tx+=(gy*-5-tx)*kt;ty+=(gx*7-ty)*kt;
    var still=q===goal&&Math.abs(gy*-5-tx)<.01&&Math.abs(gx*7-ty)<.01;
    board.style.setProperty('--tx',tx.toFixed(2)+'deg');board.style.setProperty('--ty',ty.toFixed(2)+'deg');
    draw(q);
    raf=still?(last=0,0):requestAnimationFrame(tick);
  }
  function kick(){goal=target();if(!raf){last=0;raf=requestAnimationFrame(tick)}}

  sec.classList.add('js');
  measure();q=goal=target();draw(q);
  addEventListener('scroll',kick,{passive:true});
  addEventListener('resize',function(){measure();draw(q);kick()});
})();

}catch(e){window.console&&console.error("scripts/vacancies.js",e)}
/* scripts/whales.js */
try{
/* Блок 8. Три кита: прожектор и один пункт под картинкой.
   Если сцена влезает в окно, секция получает класс pin: сцена закреплена, прогресс скролла по .wh-run
   по очереди переводит свет с кита на кита (с паузой на каждом), под картинкой меняется пункт.
   Клик или тап по киту переводит свет к нему; пока посетитель сам выбрал кита, скролл его не перебивает,
   пока заметно не уйдёт дальше. Если сцена не влезает, свет сам переходит каждые 4,5 с, пока блок на экране.
   При prefers-reduced-motion скрипт не запускается: всё освещено, пункты списком. */
(function(){
  'use strict';
  var sec=document.getElementById('how');
  if(!sec||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var img=sec.querySelector('.wh-img'),run=sec.querySelector('.wh-run'),items=[].slice.call(sec.querySelectorAll('.wh-it'));
  var hits=[].slice.call(sec.querySelectorAll('.wh-hit i'));
  if(!run||items.length!==3)return;

  var C=[15.5,48,80];            /* центры китов в % ширины картинки */
  function cl(v,a,b){return v<a?a:v>b?b:v}
  function sm(t){t=cl(t,0,1);return t*t*(3-2*t)}
  function vh(){return window.vmVH||innerHeight}

  /* 20.11 мобильная (вторая правка): кнопка остаётся в сцене сразу под пунктом. Если сцена не влезает в окно
     (низкое окно, Telegram), картинка уменьшается, но не меньше чем до 50% ширины. Так киты на телефоне листаются
     скроллом, автосмена остаётся только для совсем низких окон */
  var win=sec.querySelector('.wh-in'),pic=sec.querySelector('.wh-pic');
  var mqM=matchMedia('(max-width:720px)');
  var pin=false;
  function layout(){
    sec.classList.remove('pin');pic.style.removeProperty('--whk');
    var hb=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hb'))||0;
    var room=vh()-hb-(mqM.matches?24:64),h=win.offsetHeight;
    pin=h<=room;
    if(!pin&&mqM.matches){
      var ph=pic.offsetHeight,k=(ph-(h-room))/ph;
      if(k>=.5){pin=true;pic.style.setProperty('--whk',k.toFixed(3))}
    }
    sec.classList.toggle('pin',pin);
  }
  function scrollTarget(){
    var r=run.getBoundingClientRect(),len=r.height-vh();
    var p=len>0?cl(-r.top/len,0,1):0;
    var s=cl(p/.86,0,1)*2,i=Math.floor(s),f=s-i;
    if(i>=2)return 2;
    return i+sm((f-.5)/.5);
  }

  var q=0,goal=0,raf=0,last=0,act=-1,manual=false,anchor=0;
  function draw(){
    var i=Math.floor(q),f=q-i,x=i>=2?C[2]:C[i]+(C[i+1]-C[i])*f;
    img.style.setProperty('--sx',x.toFixed(2));
    var a=Math.round(q);
    if(a!==act){act=a;items.forEach(function(t,k){t.classList.toggle('on',k===a)})}
  }
  function tick(now){
    var dt=Math.min(64,now-(last||now));last=now;
    q+=(goal-q)*(1-Math.pow(1-.1,dt/16.7));
    if(Math.abs(goal-q)<.002)q=goal;
    draw();
    raf=q===goal?(last=0,0):requestAnimationFrame(tick);
  }
  function go(v){goal=v;if(!raf){last=0;raf=requestAnimationFrame(tick)}}
  function kick(){
    if(!pin)return;
    var t=scrollTarget();
    if(manual){if(Math.abs(t-anchor)<.6)return;manual=false}
    go(t);
  }

  /* автосмена, если сцена не закреплена */
  var auto=null,near=false;
  function autoRun(){
    clearInterval(auto);auto=null;
    if(pin||!near)return;
    auto=setInterval(function(){if(!document.hidden)go((Math.round(goal)+1)%3)},4500);
  }

  hits.forEach(function(h,k){
    h.addEventListener('click',function(){
      manual=true;anchor=pin?scrollTarget():0;go(k);
      if(!pin)autoRun();   /* после выбора отсчёт начинается заново */
    });
  });

  sec.classList.add('js');
  layout();q=goal=pin?scrollTarget():0;draw();
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){near=es[0].isIntersecting;if(near)kick();autoRun()},{rootMargin:'0px 0px -20% 0px'}).observe(sec);
  addEventListener('scroll',kick,{passive:true});
  var w=innerWidth;
  function re(){layout();kick();autoRun()}
  addEventListener('resize',function(){if(innerWidth!==w||!matchMedia('(pointer:coarse)').matches){w=innerWidth;re()}});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(re);
  addEventListener('load',re);
})();

}catch(e){window.console&&console.error("scripts/whales.js",e)}
/* scripts/route.js */
try{
/* Блок 9. Маршрут заезда: серпантин и болид
   1) По фактическим позициям этапов строится дорога: изгиб у каждого этапа (на стороне, противоположной карточке),
      старт сверху по центру, финиш с шашечным флагом внизу. На телефоне узкая змейка у левого края.
   2) Болид держится на высоте ~55% окна: позиция на дороге = точка, где дорога пересекает эту линию.
      Едет с инерцией. В поворотах уходит в занос: угол кузова = направление дороги + снос,
      снос растёт со скоростью и кривизной и догоняет с запаздыванием (зад «выносит»). При заносе лёгкий дымок.
   3) Пройденная разметка краснеет, отметка этапа загорается, карточка выезжает, когда болид доезжает до этапа.
   При prefers-reduced-motion дорога рисуется, болид стоит на старте, все этапы открыты. */
(function(){
  'use strict';
  var sec=document.getElementById('route');
  if(!sec)return;
  var trk=sec.querySelector('.rt-trk'),svg=sec.querySelector('.rt-road'),car=sec.querySelector('.rt-car'),fx=sec.querySelector('.rt-fx');
  var asph=svg.querySelector('.rt-asph'),dash=svg.querySelector('.rt-dash'),done=svg.querySelector('.rt-done');
  var cr=svg.querySelector('.rt-cr'),pinsG=svg.querySelector('.rt-pins'),marksG=svg.querySelector('.rt-marks');
  var st=[].slice.call(sec.querySelectorAll('.rt-st'));
  var NS='http://www.w3.org/2000/svg';
  var still=matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cl(v,a,b){return v<a?a:v>b?b:v}
  function vh(){return window.vmVH||innerHeight}
  function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);return e}

  var W=0,H=0,mob=false,total=0,X=[],Y=[],A=[],STEP=3,pinL=[],stY=[],cw=44,ch=92,pins=[];

  function build(){
    W=trk.clientWidth;H=trk.clientHeight;mob=innerWidth<=900;
    if(!W||!H)return false;
    var tr=trk.getBoundingClientRect();
    var cs=getComputedStyle(trk),pad=parseFloat(cs.paddingBottom)||0;
    var cx=mob?11:W/2,amp=mob?7:Math.min(W*.15,215);
    var pts=[[cx,0]];stY=[];
    st.forEach(function(s,i){
      var r=s.getBoundingClientRect(),top=r.top-tr.top,h=r.height;
      stY.push(top+h*(mob?.08:.12));
      /* изгиб уходит от карточки: карточка справа (нечётные по счёту) — изгиб влево */
      var side=mob?(i%2?1:-1):(i%2?1:-1);
      pts.push([cx+side*amp,top+h*(mob?.5:.7)]);
    });
    var fs=mob?12:18;
    /* 20.11: на телефоне трасса кончается вровень с последней карточкой: низ финишного флага = низ «Недели 7-8» */
    var lr=st[st.length-1].getBoundingClientRect();
    var endY=mob?lr.bottom-tr.top-fs*2:H-pad*.3;
    /* последний поворот возвращает на центр, дальше прямая к финишу */
    var lastY=pts[pts.length-1][1],midY=lastY+(endY-lastY)*.6;
    pts.push([cx,midY]);pts.push([cx,endY]);
    var d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
    for(var i=1;i<pts.length;i++){
      var p=pts[i-1],q=pts[i],k=(q[1]-p[1])*.55;
      d+=' C'+p[0].toFixed(1)+' '+(p[1]+k).toFixed(1)+' '+q[0].toFixed(1)+' '+(q[1]-k).toFixed(1)+' '+q[0].toFixed(1)+' '+q[1].toFixed(1);
    }
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
    asph.setAttribute('d',d);dash.setAttribute('d',d);done.setAttribute('d',d);
    /* таблица точек по длине */
    total=asph.getTotalLength();X=[];Y=[];A=[];
    for(var s=0;s<=total;s+=STEP){var pt=asph.getPointAtLength(s);X.push(pt.x);Y.push(pt.y)}
    for(var j=0;j<X.length;j++){var a=Math.max(0,j-1),b=Math.min(X.length-1,j+1);A.push(Math.atan2(Y[b]-Y[a],X[b]-X[a]))}
    /* отметки этапов, старт и финиш */
    var rw=mob?24:56;
    pinsG.textContent='';marksG.textContent='';pins=[];pinL=[];
    marksG.appendChild(el('rect',{x:cx-rw/2,y:-3,width:rw,height:mob?6:8,fill:'url(#rt-chk)'}));
    var fin=el('rect',{'class':'rt-fin',x:cx-rw*.7,y:endY,width:rw*1.4,height:fs*2,fill:'url(#rt-chk)'});
    marksG.appendChild(fin);
    pts.slice(1,-2).forEach(function(p){
      var g=el('g',{'class':'rt-pin'}),r=mob?11:19;
      g.appendChild(el('circle',{'class':'g',cx:p[0],cy:p[1],r:r}));
      g.appendChild(el('circle',{'class':'o',cx:p[0],cy:p[1],r:r}));
      g.appendChild(el('circle',{'class':'i',cx:p[0],cy:p[1],r:r*.5}));
      pinsG.appendChild(g);pins.push(g);pinL.push(lenAtY(p[1]));
    });
    cw=car.offsetWidth;ch=car.offsetHeight;
    return true;
  }

  function lenAtY(y){
    var lo=0,hi=Y.length-1;
    if(y<=Y[0])return 0;if(y>=Y[hi])return hi*STEP;
    while(hi-lo>1){var m=(lo+hi)>>1;if(Y[m]<y)lo=m;else hi=m}
    var f=(y-Y[lo])/((Y[hi]-Y[lo])||1);return (lo+f)*STEP;
  }
  function at(L){
    var i=cl(L/STEP,0,X.length-1),a=Math.floor(i),b=Math.min(X.length-1,a+1),f=i-a;
    var da=A[b]-A[a];if(da>Math.PI)da-=2*Math.PI;if(da<-Math.PI)da+=2*Math.PI;
    return {x:X[a]+(X[b]-X[a])*f,y:Y[a]+(Y[b]-Y[a])*f,a:A[a]+da*f};
  }
  function maxL(){return Math.max(0,total-ch*.5)}
  function target(){
    var r=trk.getBoundingClientRect(),h=vh();
    /* у конца страницы линия болида опускается, чтобы он успел доехать до финиша */
    var rem=document.documentElement.scrollHeight-(window.scrollY||pageYOffset)-h;
    return cl(lenAtY(h*.55+Math.max(0,h*.42-rem)-r.top),0,maxL());
  }

  /* дым */
  var lastPuff=0;
  function puff(x,y,ang){
    if(fx.childElementCount>26)return;
    var s=document.createElement('span');s.className='rt-puff';
    var back=ang+Math.PI,spread=(Math.random()-.5)*1.2,dist=(mob?14:30)+Math.random()*(mob?10:24);
    s.style.left=x.toFixed(1)+'px';s.style.top=y.toFixed(1)+'px';
    s.style.setProperty('--dx',(Math.cos(back+spread)*dist).toFixed(1)+'px');
    s.style.setProperty('--dy',(Math.sin(back+spread)*dist).toFixed(1)+'px');
    s.addEventListener('animationend',function(){s.remove()});
    fx.appendChild(s);
  }

  var clipY=-1e9,L=0,goal=0,slip=0,raf=0,last=0,stIdx=-1,pinIdx=-1,finished=false;
  function place(now,v){
    var p=at(L),deg=p.a*180/Math.PI+90;
    /* кривизна дороги под болидом */
    var p1=at(L-8),p2=at(L+8),dk=p2.a-p1.a;if(dk>Math.PI)dk-=2*Math.PI;if(dk<-Math.PI)dk+=2*Math.PI;
    var kap=dk/16;
    var gain=mob?5200:2600,lim=mob?26:34;
    var sT=still?0:cl(kap*v*gain*(v<0?.5:1),-lim,lim);
    slip+=(sT-slip)*.09;
    var rot=deg+slip,rr=rot*Math.PI/180;
    car.style.transform='translate('+(p.x-cw/2).toFixed(1)+'px,'+(p.y-ch/2).toFixed(1)+'px) rotate('+rot.toFixed(2)+'deg)';
    /* красная разметка: обновляем клип, только когда болид сдвинулся заметно (меньше перерисовок дороги) */
    if(Math.abs(p.y-clipY)>2.5||now===0){clipY=p.y;cr.setAttribute('height',(p.y+200).toFixed(1))}
    /* дымок в заносе */
    var sx=Math.sin(rr),sy=-Math.cos(rr),rx=p.x-sx*ch*.36,ry=p.y-sy*ch*.36,px=-sy*cw*.38,py=sx*cw*.38;
    if(!still&&Math.abs(slip)>9&&Math.abs(v)>.18){
      if(now-lastPuff>(mob?70:45)){lastPuff=now;puff(rx+(slip>0?-px:px),ry+(slip>0?-py:py),p.a)}
    }
    /* этапы и отметки */
    var cy=p.y+ch*.4,n=-1;stY.forEach(function(y,i){if(cy>=y)n=i});
    if(still)n=st.length-1;
    if(n!==stIdx){stIdx=n;st.forEach(function(s,i){s.classList.toggle('on',i<=n)})}
    var m=-1;pinL.forEach(function(l,i){if(L>=l-2)m=i});if(still)m=-1;
    if(m!==pinIdx){pinIdx=m;pins.forEach(function(g,i){g.classList.toggle('on',i<=m)})}
    var f=L>=maxL()-4;
    if(f!==finished){finished=f;trk.classList.toggle('fin',f)}
  }
  function tick(now){
    var dt=Math.min(64,now-(last||now))||16.7;last=now;
    var k=1-Math.pow(1-.085,dt/16.7),step=(goal-L)*k,vmax=2.4*dt;
    var prev=L;L+=cl(step,-vmax,vmax);
    if(Math.abs(goal-L)<.3)L=goal;
    var v=(L-prev)/dt;
    place(now,v);
    var settled=L===goal&&Math.abs(slip)<.15;
    raf=settled?(last=0,0):requestAnimationFrame(tick);
  }
  function kick(){if(still||!total)return;goal=target();if(!raf){last=0;raf=requestAnimationFrame(tick)}}

  function rebuild(){
    var frac=total?L/total:0;
    if(!build())return;
    if(still){L=0;slip=0;place(0,0);return}
    L=goal=target();if(!isFinite(L))L=goal=frac*total;
    slip=0;clipY=-1e9;place(performance.now(),0);
  }

  sec.classList.add('js');
  rebuild();
  /* скролл обрабатываем, только когда блок рядом с экраном */
  var near=true;
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){near=es[0].isIntersecting;if(near)kick()},{rootMargin:'50% 0px'}).observe(sec);
  addEventListener('scroll',function(){if(near)kick()},{passive:true});
  var lw=W,lh=H;
  if(window.ResizeObserver){
    new ResizeObserver(function(){
      if(Math.abs(trk.clientWidth-lw)>.5||Math.abs(trk.clientHeight-lh)>1){lw=trk.clientWidth;lh=trk.clientHeight;rebuild()}
    }).observe(trk);
  }else addEventListener('resize',rebuild);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(rebuild);
})();

}catch(e){window.console&&console.error("scripts/route.js",e)}
/* scripts/results.js */
try{
/* Блок 11. Перчатки «ложатся» на край плашки, пункты проявляются по очереди, когда блок входит в экран.
   Без IntersectionObserver или при prefers-reduced-motion всё видно сразу. */
(function(){
  'use strict';
  var sec=document.querySelector('.rc');if(!sec||!('IntersectionObserver' in window))return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(sec.getBoundingClientRect().bottom<0)return; // блок уже выше экрана: показываем как есть
  sec.classList.add('is-wait');
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting)return;
      io.disconnect();
      sec.classList.add('is-in');
      requestAnimationFrame(function(){requestAnimationFrame(function(){sec.classList.remove('is-wait')})});
    });
  },{rootMargin:'0px 0px -25% 0px'});
  io.observe(sec.querySelector('.rc-card'));
})();

}catch(e){window.console&&console.error("scripts/results.js",e)}
/* scripts/mentor.js */
try{
/* Блок 12. «Трасса с табло»: когда трасса доезжает до экрана, Артём едет от старта к своей отметке,
   за ним прорисовывается сплошная линия, затем поднимается табло и цифры зажигаются по очереди.
   Без IntersectionObserver, при prefers-reduced-motion или если блок уже выше экрана всё стоит на месте. */
(function(){
  'use strict';
  var sec=document.querySelector('.mn');if(!sec||!('IntersectionObserver' in window))return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var track=sec.querySelector('.mn-track');if(!track)return;
  if(track.getBoundingClientRect().bottom<0)return;
  sec.classList.add('is-wait');
  var io=new IntersectionObserver(function(es){
    if(!es[0].isIntersecting)return;
    io.disconnect();
    sec.classList.add('is-go');
    requestAnimationFrame(function(){requestAnimationFrame(function(){sec.classList.remove('is-wait')})});
  },{rootMargin:'0px 0px -22% 0px'});
  io.observe(track);
})();

}catch(e){window.console&&console.error("scripts/mentor.js",e)}
/* scripts/stories.js */
try{
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

}catch(e){window.console&&console.error("scripts/stories.js",e)}
/* scripts/author.js */
try{
/* Блок 15. Колода сторис: автосмена каждые 4 с (пока блок на экране и курсор не держит карточку),
   тап по левой трети назад, по остальному вперёд, свайп и клавиши ←/→ (кнопки-стрелки убраны 20.11).
   На компьютере колода наклоняется за курсором (блик убран 20.11 по просьбе клиента). prefers-reduced-motion: без автосмены и наклона. */
(function(){
  'use strict';
  var deck=document.querySelector('.au-deck');if(!deck)return;
  var tilt=deck.querySelector('.au-tilt');
  var cards=[].slice.call(deck.querySelectorAll('.au-card'));
  var bars=[].slice.call(deck.querySelectorAll('.au-bars i'));
  var n=cards.length,cur=0,busy=false,timer=null,inView=false,hold=false;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches;
  var DUR=4000;

  function place(){
    cards.forEach(function(c,i){c.setAttribute('data-pos',(i-cur+n)%n)});
    bars.forEach(function(b,i){
      b.classList.toggle('is-done',i<cur);
      b.classList.remove('is-now');
      if(i===cur){void b.offsetWidth;b.classList.add('is-now')}
    });
  }
  function go(dir){
    if(busy)return;
    var leaving=cards[cur];
    if(dir>0&&!reduce){
      busy=true;leaving.classList.add('is-out');
      cur=(cur+1)%n;
      setTimeout(function(){leaving.classList.remove('is-out');place();busy=false},820);
      place();
    }else if(dir<0&&!reduce){
      busy=true;cur=(cur-1+n)%n;var back=cards[cur];
      back.classList.add('is-back');void back.offsetWidth;back.classList.remove('is-back');
      place();setTimeout(function(){busy=false},900);
    }else{cur=(cur+dir+n)%n;place()}
    restart();
  }
  function restart(){
    clearTimeout(timer);timer=null;
    if(reduce||!inView||hold)return;
    timer=setTimeout(function(){go(1)},DUR);
  }
  deck.style.setProperty('--dur',DUR/1000+'s');

  // тап и свайп
  var sx=null,sy=0,moved=false;
  tilt.addEventListener('pointerdown',function(e){sx=e.clientX;sy=e.clientY;moved=false;hold=true;deck.classList.add('is-paused');clearTimeout(timer)});
  tilt.addEventListener('pointermove',function(e){if(sx!==null&&Math.abs(e.clientX-sx)>10)moved=true});
  function up(e){
    if(sx===null)return;
    var dx=e.clientX-sx,dy=e.clientY-sy;sx=null;hold=false;deck.classList.remove('is-paused');
    if(moved&&Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))go(dx<0?1:-1);
    else if(!moved){var r=tilt.getBoundingClientRect();go(e.clientX-r.left<r.width/3?-1:1)}
    else{place();restart()}
  }
  tilt.addEventListener('pointerup',up);
  /* 20.11: удержание (пауза) снимается при любой прокрутке и при отпускании пальца. Во встроенном браузере Telegram
     касание, с которого начинается прокрутка, иногда не присылает ни pointerup, ни pointercancel, и колода
     оставалась на паузе, пока по ней не тапнут */
  function release(){if(sx===null&&!hold)return;sx=null;hold=false;deck.classList.remove('is-paused');restart()}
  tilt.addEventListener('pointercancel',release);
  tilt.addEventListener('touchend',function(){setTimeout(function(){if(sx!==null||hold)release()},60)},{passive:true});
  tilt.addEventListener('touchcancel',release,{passive:true});
  deck.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){go(1)}else if(e.key==='ArrowLeft'){go(-1)}});

  // наклон за курсором
  if(fine&&!reduce){
    var raf=0;
    deck.addEventListener('pointermove',function(e){
      var r=tilt.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){
        tilt.style.setProperty('--ry',(x*22-4).toFixed(2)+'deg');
        tilt.style.setProperty('--rx',(-y*14+2).toFixed(2)+'deg');
      });
    });
    deck.addEventListener('pointerleave',function(){
      tilt.style.removeProperty('--ry');tilt.style.removeProperty('--rx');
    });
  }

  place();
  /* видимость считаем сами по прокрутке (надёжно и в Telegram): колода видна хотя бы на треть. Когда она появляется,
     первая полоска запускается с нуля вместе с таймером, карточка сразу «идёт», как Reels, без касания */
  function vis(){
    var r=tilt.getBoundingClientRect(),h=window.innerHeight||document.documentElement.clientHeight;
    var seen=Math.min(r.bottom,h)-Math.max(r.top,0),v=seen>r.height*.33;
    if(v!==inView){inView=v;if(v){place();restart()}else{clearTimeout(timer);timer=null}}
  }
  var vt=0;
  addEventListener('scroll',function(){if(hold&&sx!==null&&!moved)release();if(!vt)vt=requestAnimationFrame(function(){vt=0;vis()})},{passive:true});
  addEventListener('resize',vis);addEventListener('load',vis);vis();
  document.addEventListener('visibilitychange',function(){if(document.hidden){clearTimeout(timer);timer=null}else restart()});
})();

}catch(e){window.console&&console.error("scripts/author.js",e)}
/* scripts/formats.js */
try{
/* Блок 16. Форматы участия: билеты въезжают по очереди, когда блок доезжает до экрана;
   на компьютере блик на VIP-билете идёт за курсором (без курсора он ездит сам, анимация в CSS).
   При prefers-reduced-motion ничего не делаем: билеты на месте, блика нет. */
(function(){
  'use strict';
  var sec=document.getElementById('formats');if(!sec)return;
  // выемки: высота пунктира внутри билета для маски (--cy), пересчёт при изменении размеров
  var tickets=[].slice.call(sec.querySelectorAll('.fm-t'));
  function cut(){tickets.forEach(function(t){var st=t.querySelector('.fm-stub');if(st){t.style.setProperty('--cy',st.offsetTop+'px');t.classList.add('is-cut')}})}
  cut();
  if('ResizeObserver' in window){var ro=new ResizeObserver(cut);tickets.forEach(function(t){ro.observe(t)})}else{addEventListener('resize',cut)}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if('IntersectionObserver' in window){
    sec.classList.add('is-pre');
    var io=new IntersectionObserver(function(es){
      if(!es[0].isIntersecting)return;
      io.disconnect();sec.classList.remove('is-pre');
    },{rootMargin:'0px 0px -25% 0px'});
    io.observe(sec.querySelector('.fm-row'));
  }
  if(!matchMedia('(hover: hover)').matches)return;
  [].forEach.call(sec.querySelectorAll('.fm-v'),function(t){
    var foil=t.querySelector('.fm-foil');if(!foil)return;
    t.addEventListener('pointermove',function(e){
      var r=t.getBoundingClientRect();
      t.classList.add('is-hx');
      foil.style.setProperty('--fm-hx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
    });
    t.addEventListener('pointerleave',function(){t.classList.remove('is-hx');foil.style.removeProperty('--fm-hx')});
  });
})();

}catch(e){window.console&&console.error("scripts/formats.js",e)}
/* scripts/fears.js */
try{
/* Блок 17. Страхи: карточки-перевёртыши.
   На компьютере карточка переворачивается только наведением и возвращается, как только курсор ушёл (клик не залипает).
   На телефоне переворот по тапу (aria-pressed). Когда блок доезжает до экрана, карточки въезжают по очереди,
   вторая на мгновение переворачивается и сама возвращается, чтобы было видно, что их можно крутить.
   При reduced-motion без въезда и автопереворота. */
(function(){
  'use strict';
  var sec=document.getElementById('fears');if(!sec)return;
  var cards=[].slice.call(sec.querySelectorAll('.fr-c'));
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  var demo=null;
  function stopDemo(){if(demo){clearTimeout(demo);demo=null}cards.forEach(function(c){if(fine)c.setAttribute('aria-pressed','false')})}
  cards.forEach(function(c){
    c.addEventListener('click',function(){
      if(fine)return; // на компьютере работает наведение
      c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')==='true'?'false':'true');
    });
    if(fine){
      c.addEventListener('pointerenter',stopDemo);
      c.addEventListener('pointerleave',function(){c.setAttribute('aria-pressed','false');c.blur()});
    }
  });
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
  sec.classList.add('is-pre');
  var io=new IntersectionObserver(function(es){
    if(!es[0].isIntersecting)return;
    io.disconnect();
    sec.classList.remove('is-pre');
    /* 20.11: на телефоне подсказкой переворачивается первая карточка «Рынок забит», на компьютере вторая */
    var c=cards[fine?1:0];if(!c)return;
    demo=setTimeout(function(){
      if(sec.querySelector('.fr-c[aria-pressed="true"]')||c.matches(':hover'))return;
      c.setAttribute('aria-pressed','true');
      demo=setTimeout(function(){if(!c.matches(':hover'))c.setAttribute('aria-pressed','false');demo=null},1900);
    },1100);
  },{rootMargin:'0px 0px -30% 0px'});
  io.observe(sec.querySelector('.fr-g'));
})();

}catch(e){window.console&&console.error("scripts/fears.js",e)}
/* scripts/faq.js */
try{
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

}catch(e){window.console&&console.error("scripts/faq.js",e)}
/* scripts/final.js */
try{
/* Блок 19. Финал и подвал.
   Блок 19: когда ряд полос доезжает до экрана, полосы въезжают по очереди (снимается is-pre),
   затем раз в 5 с цвет пробегает по всем лицам и останавливается на «?» (is-sweep).
   Подвал: огромный вордмарк выезжает снизу. При reduced-motion ничего не двигается. */
(function(){
  'use strict';
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
  function reveal(sec,target,run,margin){
    if(!sec||!target)return;
    sec.classList.add('is-pre');
    var io=new IntersectionObserver(function(es){
      if(!es[0].isIntersecting)return;
      io.disconnect();
      sec.classList.remove('is-pre');
      setTimeout(function(){sec.classList.add('is-in')},1700);/* въезд закончился: наведение без задержки */
      if(run)run();
    },{rootMargin:margin});
    io.observe(target);
  }
  var fn=document.getElementById('final');
  // пробег цвета по лицам: первый после въезда, дальше раз в 5 с, пока блок на экране
  var row=fn&&fn.querySelector('.fn-row'),timer=null,vis=false;
  function sweep(){
    row.classList.remove('is-sweep');void row.offsetWidth;row.classList.add('is-sweep');
    clearTimeout(timer);timer=setTimeout(function(){if(vis)sweep()},5000);
  }
  if(row){
    new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(!vis)clearTimeout(timer);else if(fn.classList.contains('is-run'))sweep()}).observe(row);
  }
  reveal(fn,row,function(){setTimeout(function(){fn.classList.add('is-run');sweep()},1500)},'0px 0px -25% 0px');
  var ft=document.getElementById('siteFoot');
  reveal(ft,ft&&ft.querySelector('.ft-wm'),false,'0px 0px -5% 0px');
})();

}catch(e){window.console&&console.error("scripts/final.js",e)}
