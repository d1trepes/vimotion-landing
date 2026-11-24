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
      stage=sec.querySelector('.gb-stage'),board=sec.querySelector('.gb-board'),header=document.querySelector('.hdr'),
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
  function size(){
    var box=knob.parentNode;
    bw=box.getBoundingClientRect().width;bh=box.clientHeight;
    knob.style.width=Math.min(84,bw*.084)+'px';
  }
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
  var DWELL=.34,pin=false,hb=0,narrow=matchMedia('(max-width:760px)');
  function layout(){
    hb=header?header.offsetHeight:0;
    sec.classList.add('pin');
    pin=(narrow.matches||board.offsetWidth>=600)&&board.offsetHeight<=stage.offsetHeight;
    sec.classList.toggle('pin',pin);
  }
  layout();
  function target(){
    var r=run.getBoundingClientRect(),available=(window.vmVH||innerHeight)-hb;
    var progress=pin?(hb-r.top)/Math.max(1,r.height-available):(hb+available*.85-r.top)/(r.height+available*.7);
    var p=Math.max(0,Math.min(1,progress)),u=p*4,i=Math.min(3,Math.floor(u)),f=u-i;
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
  function go(t){if(t===goal)return;goal=t;if(!raf){last=0;raf=requestAnimationFrame(tick)}}

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
    var r=run.getBoundingClientRect(),len=r.height-(window.vmVH||innerHeight)+hb;
    return Math.round(scrollY+r.top-hb+Math.max(0,len)*(gr/4));
  }
  function shift(gr){
    go(gr);
    if(!pin)return;
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
  function resize(){layout();size();place(g);kick()}
  addEventListener('resize',resize);
  addEventListener('vmviewport',resize);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(resize);
  if(window.ResizeObserver)new ResizeObserver(function(){size();place(g)}).observe(knob.parentNode);
})();
