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
