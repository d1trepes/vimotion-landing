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
        '    vec2 r=px*3.5,r2=px*7.;',
        '    float b=(A(uv+vec2(r.x,0.))+A(uv-vec2(r.x,0.))+A(uv+vec2(0.,r.y))+A(uv-vec2(0.,r.y))',
        '      +A(uv+r)+A(uv-r)+A(uv+vec2(r.x,-r.y))+A(uv+vec2(-r.x,r.y))',
        '      +A(uv+vec2(r2.x,0.))+A(uv-vec2(r2.x,0.))+A(uv+vec2(0.,r2.y))+A(uv-vec2(0.,r2.y)))/12.;',
        '    float e=clamp(a*(1.-b)*1.8,0.,1.);',
        '    if(e>.001){',
        '      vec3 bg=(B(uv)*2.+B(uv+vec2(r2.x,0.))+B(uv-vec2(r2.x,0.))+B(uv+vec2(0.,r2.y))+B(uv-vec2(0.,r2.y)))/6.;',
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
  if(!glOK){window.vmLive=noop;return}

  /* ---------- видео ---------- */
  var video=document.createElement('video');
  video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');
  video.playsInline=true;video.setAttribute('playsinline','');
  video.loop=true;video.preload='auto';

  var mq=matchMedia('(max-width:720px)'),cur='';
  function setSrc(){
    /* версия в адресе: при замене файла браузер не возьмёт старое видео из кеша */
    var s=(mq.matches?'media/valentin-live-m.mp4':'media/valentin-live.mp4')+'?v=20261117e';
    if(s===cur)return;
    cur=s;video.src=s;video.load();sync();
  }

  function draw(){
    if(video.readyState<2||!video.videoWidth)return;
    if(cv.width!==video.videoWidth||cv.height!==video.videoHeight/2){cv.width=video.videoWidth;cv.height=video.videoHeight/2}
    gl.viewport(0,0,cv.width,cv.height);
    gl.uniform1f(hLoc,1.5/video.videoHeight);
    gl.uniform2f(pxLoc,1/cv.width,1/cv.height);
    if(wOK){var P=cv.getBoundingClientRect(),M=wmImg.getBoundingClientRect();
      if(P.width&&P.height)gl.uniform4f(wrLoc,(M.left-P.left)/P.width,(M.top-P.top)/P.height,(M.right-P.left)/P.width,(M.bottom-P.top)/P.height)}
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    pt.classList.add('live');
  }
  var raf=0;
  function loop(){draw();raf=(!video.paused&&!video.ended)?requestAnimationFrame(loop):0}
  video.addEventListener('play',function(){cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)});
  video.addEventListener('seeked',draw);

  /* ---------- играет только после прелоадера, на видимой вкладке и пока hero на экране ---------- */
  var started=false,inView=true,visible=!document.hidden;
  function sync(){
    if(started&&inView&&visible){var p=video.play();if(p&&p.catch)p.catch(function(){})}
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
    start:function(){if(started)return;started=true;sync()}
  };
})();
