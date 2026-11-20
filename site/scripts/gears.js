/* Блок 6. Коробка передач
   Сцена закреплена (sticky), прогресс скролла по .gb-run ведёт ручку: пауза на каждой передаче, переход между ними.
   Плавность (21.11):
   - путь ручки со скруглёнными поворотами (радиус 56 в координатах фото 1672×941), подсветка рисуется по тому же пути;
   - ручка движется в «пространстве передач» g = 0..4, а позиция на пути считается через smoothstep внутри участка,
     поэтому в каждой передаче скорость ручки нулевая: развороты в прорезях (1→2, 3→4) без рывка даже при быстром скролле;
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

  var W=1672,H=941,X1=303.5,X3=828,X5=1351,T=234,N=461,B=684,R=56;
  /* путь 1→2→3→4→5 через нейтраль: отрезки и скругления (q: квадратичная кривая с вершиной в углу) */
  var segs=[
    ['l',X1,T,X1,B],                              /* 1 → 2 */
    ['l',X1,B,X1,N+R],['q',X1,N+R,X1,N,X1+R,N],['l',X1+R,N,X3-R,N],['q',X3-R,N,X3,N,X3,N-R],['l',X3,N-R,X3,T], /* 2 → 3 */
    ['l',X3,T,X3,B],                              /* 3 → 4 */
    ['l',X3,B,X3,N+R],['q',X3,N+R,X3,N,X3+R,N],['l',X3+R,N,X5-R,N],['q',X5-R,N,X5,N,X5,N-R],['l',X5,N-R,X5,T]  /* 4 → 5 */
  ];
  var GEND=[0,1,6,7,12];/* передача g стоит в конце segs[GEND[g]-1] */
  var px=[],py=[],acc=[],GEAR=[0];
  (function(){
    var L=0,x0=X1,y0=T;px.push(x0);py.push(y0);acc.push(0);
    segs.forEach(function(sg,si){
      var n=sg[0]==='l'?Math.max(2,Math.ceil(Math.hypot(sg[3]-sg[1],sg[4]-sg[2])/6)):24;
      for(var k=1;k<=n;k++){
        var t=k/n,x,y;
        if(sg[0]==='l'){x=sg[1]+(sg[3]-sg[1])*t;y=sg[2]+(sg[4]-sg[2])*t}
        else{var u=1-t;x=u*u*sg[1]+2*u*t*sg[3]+t*t*sg[5];y=u*u*sg[2]+2*u*t*sg[4]+t*t*sg[6]}
        L+=Math.hypot(x-x0,y-y0);px.push(x);py.push(y);acc.push(L);x0=x;y0=y;
      }
      if(GEND.indexOf(si+1)>0)GEAR.push(L);
    });
  })();
  var TOTAL=acc[acc.length-1];
  lines.forEach(function(l){l.style.strokeDasharray=TOTAL+' '+(TOTAL+10);l.style.strokeDashoffset=TOTAL});
  /* точка на пути по длине s: двоичный поиск по таблице */
  function at(s){
    var lo=0,hi=acc.length-1;
    if(s<=0)return [px[0],py[0]];if(s>=TOTAL)return [px[hi],py[hi]];
    while(hi-lo>1){var m=(lo+hi)>>1;if(acc[m]<s)lo=m;else hi=m}
    var k=(s-acc[lo])/((acc[hi]-acc[lo])||1);
    return [px[lo]+(px[hi]-px[lo])*k,py[lo]+(py[hi]-py[lo])*k];
  }
  function ss(t){return t*t*(3-2*t)}
  /* g (0..4) → длина пути: внутри участка smoothstep, у передачи скорость ноль */
  function lenOf(g){
    g=Math.max(0,Math.min(4,g));var i=Math.min(3,Math.floor(g));
    return GEAR[i]+(GEAR[i+1]-GEAR[i])*ss(g-i);
  }
  /* длина пути → g (обратный smoothstep бисекцией), нужно для перетаскивания */
  function gOf(s){
    var i=0;while(i<3&&s>GEAR[i+1])i++;
    var f=(s-GEAR[i])/((GEAR[i+1]-GEAR[i])||1),lo=0,hi=1;f=Math.max(0,Math.min(1,f));
    for(var k=0;k<22;k++){var m=(lo+hi)/2;if(ss(m)<f)lo=m;else hi=m}
    return i+(lo+hi)/2;
  }

  var bw=0,bh=0;
  function size(){var box=knob.parentNode;bw=box.clientWidth;bh=box.clientHeight}
  var lastS=-1;
  function place(g){
    var s=lenOf(g);if(!bw)size();
    var p=at(s);
    knob.style.transform='translate3d('+(p[0]/W*bw).toFixed(2)+'px,'+(p[1]/H*bh).toFixed(2)+'px,0) translate(-50%,-50%)';
    if(Math.abs(s-lastS)>.25){lastS=s;var o=(TOTAL-s).toFixed(1);lines.forEach(function(l){l.style.strokeDashoffset=o})}
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
  var g=target(),v=0,goal=g,raf=0,last=0,OMEGA=7.5;
  function tick(now){
    var dt=Math.min(.05,(now-(last||now))/1000);last=now;
    var steps=Math.max(1,Math.ceil(dt/.008)),h=dt/steps;
    for(var k=0;k<steps;k++){
      var a=OMEGA*OMEGA*(goal-g)-2*OMEGA*v;
      v+=a*h;g+=v*h;
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
  /* ближайшая к курсору точка пути (по таблице), из близких берём ту, что ближе к текущему положению */
  function project(cx,cy){
    var r=knob.parentNode.getBoundingClientRect(),x=(cx-r.left)/r.width*W,y=(cy-r.top)/r.height*H,
        cur=lenOf(g),best=-1,bd=1e9;
    for(var i=0;i<px.length;i++){
      var d=Math.hypot(x-px[i],y-py[i]);
      if(d<bd-2||(Math.abs(d-bd)<=2&&Math.abs(acc[i]-cur)<Math.abs(acc[best]-cur))){bd=Math.min(bd,d);best=i}
    }
    return acc[best];
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
    dragGoal=gOf(project(e.clientX,e.clientY));
    OMEGA=22;go(dragGoal);
  });
  function release(e){
    if(!drag||(e&&e.pointerId!==pid))return;
    drag=false;pid=null;sec.classList.remove('is-grab');OMEGA=7.5;
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
