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

/* Шапка скрывается при прокрутке вниз и возвращается при движении вверх. */
(function(){
  'use strict';
  var hdr=document.querySelector('.hdr');if(!hdr)return;
  var on=null,dk=null,t=0,darks=[].slice.call(document.querySelectorAll('[data-hdr="dark"]')),bar=document.querySelector('.cx-bar');
  var lastY=Math.max(0,window.scrollY||0),turnY=lastY,direction=0;
  function visibility(y){
    var next=y===lastY?direction:(y>lastY?1:-1);
    if(next!==direction){turnY=lastY;direction=next}
    lastY=y;
    if(y<=8||hdr.classList.contains('is-menu')||turnY-y>=8)hdr.classList.remove('is-away');
    else if(y-turnY>=14)hdr.classList.add('is-away');
  }
  function revealOnFocus(e){if(e.target.matches(':focus-visible'))hdr.classList.remove('is-away')}
  hdr.addEventListener('focusin',revealOnFocus);
  if(bar)bar.addEventListener('focusin',revealOnFocus);
  /* над тёмными блоками (асфальт, подвал) шапка тоже тёмная: смотрим, какой блок начинается сразу под шапкой
     (на страницах кейсов под шапкой ещё полоса с именами, она меняет цвет вместе с шапкой) */
  function upd(){
    t=0;var position=Math.max(0,window.scrollY||0),s=position>8;
    var y=hdr.offsetHeight+(bar?bar.offsetHeight:0)+1,d=false;
    for(var i=0;i<darks.length;i++){var r=darks[i].getBoundingClientRect();if(r.top<=y&&r.bottom>y){d=true;break}}
    visibility(position);
    if(s!==on){on=s;hdr.classList.toggle('is-stuck',s)}
    if(d!==dk){dk=d;hdr.classList.toggle('is-dark',d);tone(d)}
  }
  /* Шапка, фон страницы и браузерная тема используют один цвет. */
  var meta=document.querySelector('meta[name="theme-color"]'),html=document.documentElement,lastWidth=0;
  function tone(dark){
    var color=dark?'#0e0e0e':'#EFE6DE';
    if(meta&&!html.classList.contains('is-loading'))meta.setAttribute('content',color);
    html.style.setProperty('--vm-chrome',color);
  }
  function resize(){
    var width=html.clientWidth;
    if(width===lastWidth&&html.classList.contains('vm-touch'))return;
    lastWidth=width;
    turnY=lastY=Math.max(0,window.scrollY||0);direction=0;
    hdr.classList.toggle('has-inset',parseFloat(getComputedStyle(hdr).paddingTop)>0);schedule();
  }
  function schedule(){if(!t)t=requestAnimationFrame(upd)}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);resize();

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
   Сначала виден постер. На телефоне видео готовится после его показа, на десктопе — во время заставки. */
(function(){
  'use strict';
  var noop={video:null,start:function(){}};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pt=document.getElementById('pt'),cv=document.getElementById('live'),hero=document.getElementById('hero');
  var root=document.documentElement;
  if(reduce||!pt||!cv||(navigator.connection&&navigator.connection.saveData)){
    window.vmLive=noop;return;
  }
  var mobile=root.classList.contains('vm-touch'),deferred=mobile||!root.classList.contains('is-loading');

  /* ---------- WebGL ---------- */
  var gl,hLoc,pxLoc,wrLoc,tex,wmImg,wOK=false,glOK=false;
  function prepareRenderer(){
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
        tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        hLoc=gl.getUniformLocation(pr,'h');
        pxLoc=gl.getUniformLocation(pr,'px');wrLoc=gl.getUniformLocation(pr,'wr');
        var onLoc=gl.getUniformLocation(pr,'on');
        gl.uniform1i(gl.getUniformLocation(pr,'t'),0);gl.uniform1i(gl.getUniformLocation(pr,'w'),1);gl.uniform1f(onLoc,0);
        /* текстура вордмарка для подстройки края под фон */
        wmImg=document.querySelector('.wm img');
        var wtex=gl.createTexture();
        var upW=function(){if(wOK||!wmImg||!wmImg.complete||!wmImg.naturalWidth)return;
          gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,wtex);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
          try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,wmImg);wOK=true;rectDirty=true}catch(e){}
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
    return glOK;
  }

  /* ---------- видео ---------- */
  var video=document.createElement('video');
  video.className='live-source';video.setAttribute('aria-hidden','true');
  video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');
  video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
  video.loop=true;video.preload='auto';

  var mq=matchMedia('(max-width:720px)'),cur='';
  function setSrc(){
    /* версия в адресе: при замене файла браузер не возьмёт старое видео из кеша */
    var s=(mobile||mq.matches?'../media/valentin-live-m.mp4':'../media/valentin-live.mp4')+'?v=20261117j';
    if(s===cur)return;
    if(!video.parentNode)pt.appendChild(video);
    cur=s;video.src=s;video.load();
  }

  function draw(){
    if(swiping)return;
    if(video.readyState<2||!video.videoWidth)return;
    /* холст в размере показа (с учётом плотности экрана), но не больше самого видео */
    var vw=video.videoWidth,vh=video.videoHeight/2;
    if(rectDirty||!cw){var P0=cv.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,mobile?1.5:3);
      cw=Math.min(vw,Math.max(64,Math.round(P0.width*d)));ch=Math.round(cw*vh/vw)}
    if(cv.width!==cw||cv.height!==ch){cv.width=cw;cv.height=ch}
    gl.viewport(0,0,cv.width,cv.height);
    gl.uniform1f(hLoc,1.5/video.videoHeight);
    gl.uniform2f(pxLoc,1/vw,1/vh);
    /* положение вордмарка относительно портрета: пересчёт только при изменении раскладки и во время анимации появления */
    if(wOK&&(rectDirty||performance.now()<rectUntil)){var P=cv.getBoundingClientRect(),M=wmImg.getBoundingClientRect();
      if(P.width&&P.height)gl.uniform4f(wrLoc,(M.left-P.left)/P.width,(M.top-P.top)/P.height,(M.right-P.left)/P.width,(M.bottom-P.top)/P.height)}
    rectDirty=false;
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
  addEventListener('vmviewport',function(){rectDirty=true});
  /* рисуем только когда видео выдало новый кадр (requestVideoFrameCallback), а не на каждом обновлении экрана */
  var raf=0,vfc=0,hasVFC='requestVideoFrameCallback' in HTMLVideoElement.prototype;
  function onFrame(){vfc=0;draw();if(!video.paused&&!video.ended)vfc=video.requestVideoFrameCallback(onFrame)}
  function loop(){draw();raf=(!video.paused&&!video.ended)?requestAnimationFrame(loop):0}
  video.addEventListener('play',function(){
    if(hasVFC){if(vfc)video.cancelVideoFrameCallback(vfc);vfc=video.requestVideoFrameCallback(onFrame)}
    else{cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
  });
  video.addEventListener('seeked',draw);

  /* ---------- воспроизведение только на видимом первом экране ---------- */
  var observe=window.IntersectionObserver;
  var started=false,inView=!deferred||!observe,visible=!document.hidden,covered=root.classList.contains('hero-covered');
  var swiping=false,timer=0,blocked=false,poster=pt.querySelector('img');
  function sync(){
    if(dead)return;
    if(started&&inView&&visible&&!covered&&!swiping){
      if(!blocked&&video.paused){
        var p=video.play();
        if(p&&p.catch)p.catch(function(e){
          if(e.name==='NotAllowedError'){blocked=true;pt.addEventListener('click',retry,{once:true})}
        });
      }
    }else if(!video.paused)video.pause();
  }
  function retry(){blocked=false;sync()}
  function start(){
    if(mobile&&(swiping||root.classList.contains('is-loading')))return;
    if(started||dead)return;
    if(!glOK&&!prepareRenderer()){dead=true;return}
    started=true;
    rectUntil=deferred?0:performance.now()+2500;
    setSrc();sync();
  }
  function queue(){
    if(mobile&&(swiping||root.classList.contains('is-loading')))return;
    if(!deferred||started||dead||timer||!inView||!visible||covered||(poster&&!poster.complete))return;
    timer=setTimeout(function(){
      timer=0;if(inView&&visible&&!covered)start();
    },root.classList.contains('vm-low-data')?1200:240);
  }
  // Pause frame uploads while a swipe or scroll is in progress. Keep the last portrait frame visible.
  var resumeTimer=0;
  function pauseForScroll(){
    if(!swiping&&(!inView||covered))return;
    if(!swiping){swiping=true;sync()}
    clearTimeout(resumeTimer);
    resumeTimer=setTimeout(function(){swiping=false;sync();queue()},150);
  }
  if(mobile){
    addEventListener('touchstart',pauseForScroll,{passive:true});
    addEventListener('touchmove',pauseForScroll,{passive:true});
    addEventListener('scroll',pauseForScroll,{passive:true});
    document.addEventListener('vm:open',function(){requestAnimationFrame(queue)},{once:true});
  }
  document.addEventListener('visibilitychange',function(){visible=!document.hidden;sync();queue()});
  if(observe&&hero){
    new observe(function(es){inView=es[es.length-1].isIntersecting;sync();queue()}).observe(pt);
  }
  function resizeSource(){if(!dead&&cur){setSrc();sync()}}
  if(mq.addEventListener)mq.addEventListener('change',resizeSource);else if(mq.addListener)mq.addListener(resizeSource);

  if(deferred){
    if(poster){poster.addEventListener('load',queue,{once:true});poster.addEventListener('error',queue,{once:true})}
    queue();
  }else if(prepareRenderer())setSrc();else dead=true;
  window.vmLive={
    video:video,
    start:start,
    relayout:function(){rectDirty=true;if(video.paused)draw()},
    /* hero sticky: когда блок 2 закрыл его целиком, он всё ещё «на экране» для IntersectionObserver */
    cover:function(c){if(covered!==c){covered=c;sync();queue()}}
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
}catch(e){console.error("scripts/perf.js",e)}
/* scripts/hero-fit.js */
try{
/* Блок 1: первый экран подстраивается под окно и растёт по высоте на низких экранах.
   Отступ снизу равен боковым полям. Без JS работает CSS-вёрстка. */
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
  /* те же границы, что в 01-hero.css */
  var mqT=matchMedia('(max-width:1480px)'),mqP=matchMedia('(max-width:679px)');

  /* высота окна без панелей браузера: --vhl из <head> (на телефонах фиксируется при загрузке), иначе svh */
  var probe=document.createElement('div');
  probe.style.cssText='position:fixed;left:0;top:0;width:0;height:var(--vhl,100svh);visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);

  function px(v){return Math.round(v*100)/100+'px'}
  function reset(){
    root.classList.remove('vm-fit');
    hero.style.removeProperty('--hero-height');
    [wm,pt,copy,stats].forEach(function(e){e.removeAttribute('style')});
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
    root.classList.toggle('hero-compact',mqP.matches&&W<=360);
    var hh=hdr?hdr.offsetHeight:76;
    var cr=copy.getBoundingClientRect(),sr=stats.getBoundingClientRect();
    var Cw=cr.width,Ch=cr.height,Sw=sr.width,Sh=sr.height;
    /* фактические рамки строк заголовка, абзаца относительно колонки (без пустоты справа) */
    var boxes=[];copy.querySelectorAll('.ln,.sub').forEach(function(e){
      var r=e.getBoundingClientRect(),right=r.right;
      if(!e.classList.contains('btn')){var rg=document.createRange();rg.selectNodeContents(e);right=rg.getBoundingClientRect().right}
      boxes.push({t:r.top-cr.top,b:r.bottom-cr.top,r:right-cr.left})});
    var phone=mqP.matches,desk=!mqT.matches;
    var wmFull=W-2*m,heroH,pw,ph,col;

    if(desk){
      /* На широком экране портрет между текстом и цифрами. */
      col=Math.max(Ch,Sh);
      var room=H-hh-6-m,maxWordmark=Math.min(wmFull,1440);
      var wmW=Math.max(maxWordmark*.74,Math.min(maxWordmark,(room-col)/WM));
      var wmH=wmW*WM;
      var s=Math.max(.9,Math.min(1,(room-wmH)/col));
      heroH=Math.max(H,hh+wmH+6+col*s+m);
      var wmL=(W-wmW)/2;
      var cx=wmL+.579*wmW;
      ph=Math.min(W*PT,heroH-(hh+.12*wmH));pw=ph/PT;
      var cTop=heroH-m-Ch*s,sTop=heroH-m-Sh*s,sLeft=W-m-Sw*s,cx0=cx;
      var lefts=boxes.map(function(bx){return {t:cTop+bx.t*s,b:cTop+bx.b*s,r:m+bx.r*s}});
      for(var it=0;it<60;it++){
        var top=heroH-ph,lo=pw/2,hi=W-pw/2;
        for(var k=1;k<32;k++){
          var y0=top+k*ph/32,y1=y0+ph/32;
          lefts.forEach(function(bx){if(bx.b>y0&&bx.t<y1)lo=Math.max(lo,bx.r+20-(SL[k]-.5)*pw)});
          if(sTop<y1)hi=Math.min(hi,sLeft-20-(SR[k]-.5)*pw);
        }
        if(lo<=hi){cx=Math.max(lo,Math.min(cx0,hi));break}
        ph*=.97;pw=ph/PT;
      }
      place(wm,wmL,hh,wmW);
      place(pt,cx-pw/2,heroH-ph,pw);pt.style.height=px(ph);
      place(copy,m,cTop,Cw,s);
      place(stats,sLeft,sTop,Sw,s);
    }else if(!phone){
      /* Две колонки: размер портрета задаёт правая колонка, независимо от длины текста. */
      var textGap=H<600?16:24,brandBottom=hh+wmFull*WM;
      col=Ch+textGap+Sh;
      pw=Math.min(W*.66,680,Math.max(W*.47,(H-brandBottom+20)/PT));ph=pw*PT;
      heroH=Math.max(H,brandBottom+16+col+m);
      var portraitLeft=Math.max(m+Math.max(Cw,Sw)+12,W-m*.4-pw);
      place(wm,m,hh,wmFull);
      place(pt,portraitLeft,heroH-ph,pw);pt.style.height=px(ph);
      place(copy,m,heroH-m-col,Cw);
      place(stats,m,heroH-m-Sh,Sw);
    }else{
      /* Телефоны: крупный портрет перед текстом. */
      var wmTop=hh+4;
      var ptTop=wmTop+.04*wmFull*WM,g1=12,statsGap=root.classList.contains('hero-compact')?12:20;
      col=Ch+statsGap+Sh;
      pw=Math.min(W*.9,530);ph=pw*PT;
      var copyTop=ptTop+ph+g1;
      var minimum=parseFloat(root.style.getPropertyValue('--vm-hero-min'))||H;
      heroH=Math.max(minimum,copyTop+col+m);
      place(wm,m,wmTop,wmFull);
      place(pt,(W-pw)/2,ptTop,pw);pt.style.height=px(ph);
      place(stats,m,copyTop+Ch+statsGap,W-2*m);
      place(copy,m,copyTop,W-2*m);
    }
    hero.style.setProperty('--hero-height',px(heroH));
    root.classList.add('vm-fit');
  }

  var raf=0,lastW=0,lastH=0;
  function schedule(){
    var W=inn.clientWidth,H=probe.getBoundingClientRect().height;
    if(W===lastW&&H===lastH)return;
    lastW=W;lastH=H;cancelAnimationFrame(raf);raf=requestAnimationFrame(fit);
  }
  function force(){lastW=lastH=0;schedule()}
  addEventListener('vmviewport',schedule);
  addEventListener('load',force);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(force);
  fit();lastW=inn.clientWidth;lastH=probe.getBoundingClientRect().height;
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
    if(root.classList.contains('vm-touch'))return;
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
    if(!v||!v.getAttribute('src')||root.classList.contains('vm-touch')||!matchMedia('(pointer:fine)').matches)return Promise.resolve();
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
    if(!root.classList.contains('is-loading'))return;
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
    setTimeout(function(){root.classList.remove('is-leaving')},330);
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
  var root=document.documentElement,sec=document.getElementById('lesson'),hero=document.getElementById('hero');
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
})();
}catch(e){console.error("scripts/people.js",e)}
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
    v.controls=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='none';
    var poster=card.getAttribute('data-poster')||'';
    v.poster=matchMedia('(max-width:720px)').matches
      ? poster.replace('cover-1200.webp','cover-800.webp') : poster;
    card.appendChild(v);card.classList.add('is-on');
    var p=v.play();if(p&&p.catch)p.catch(function(){});
    v.focus({preventScroll:true});
    var playback;
    if('IntersectionObserver' in window){
      playback=new IntersectionObserver(function(entries){
        if(!entries[0].isIntersecting&&!document.fullscreenElement&&!v.webkitDisplayingFullscreen)v.pause();
      });
      playback.observe(card);
    }
    v.addEventListener('error',function(){
      if(playback)playback.disconnect();
      v.remove();card.classList.remove('is-on');
    },{once:true});
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
  addEventListener('scroll',on,{passive:true});addEventListener('vmviewport',on);
  frame.style.setProperty('--p',0);upd();
})();

}catch(e){window.console&&console.error("scripts/lesson.js",e)}
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
/* scripts/final.js */
try{
/* Финал короткой версии и подвал */
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
  reveal(fn,fn&&fn.querySelector('.fn-photo'),false,'0px 0px -12% 0px');
  var ft=document.getElementById('siteFoot');
  reveal(ft,ft&&ft.querySelector('.ft-wm'),false,'0px 0px -5% 0px');
})();

}catch(e){window.console&&console.error("scripts/final.js",e)}
