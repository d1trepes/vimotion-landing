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
