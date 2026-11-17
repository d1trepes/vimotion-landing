/* Блок 9. Маршрут заезда: серпантин и болид
   1) По фактическим позициям этапов строится дорога: изгиб у каждого этапа (на стороне, противоположной карточке),
      старт сверху по центру, финиш с шашечным флагом внизу. На телефоне узкая змейка у левого края.
   2) Болид держится на высоте ~55% окна: позиция на дороге = точка, где дорога пересекает эту линию.
      Едет с инерцией. В поворотах уходит в занос: угол кузова = направление дороги + снос,
      снос растёт со скоростью и кривизной и догоняет с запаздыванием (зад «выносит»). При заносе дымок и следы шин.
   3) Пройденная разметка краснеет, отметка этапа загорается, карточка выезжает, когда болид доезжает до этапа.
   При prefers-reduced-motion дорога рисуется, болид стоит на старте, все этапы открыты. */
(function(){
  'use strict';
  var sec=document.getElementById('route');
  if(!sec)return;
  var trk=sec.querySelector('.rt-trk'),svg=sec.querySelector('.rt-road'),car=sec.querySelector('.rt-car'),fx=sec.querySelector('.rt-fx');
  var asph=svg.querySelector('.rt-asph'),dash=svg.querySelector('.rt-dash'),done=svg.querySelector('.rt-done'),skid=svg.querySelector('.rt-skid');
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
    var endY=H-pad*.3;
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
    var fs=mob?12:18;
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
    skidD='';skidOn=false;skid.setAttribute('d','');
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

  /* дым и следы */
  var lastPuff=0,skidD='',skidOn=false,skidN=0;
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
  function mark(x1,y1,x2,y2){
    if(!skidOn){skidD+=' M'+x1.toFixed(1)+' '+y1.toFixed(1)+' M'+x2.toFixed(1)+' '+y2.toFixed(1);skidOn=true;lastA=[x1,y1];lastB=[x2,y2];return}
    skidD+=' M'+lastA[0].toFixed(1)+' '+lastA[1].toFixed(1)+' L'+x1.toFixed(1)+' '+y1.toFixed(1)+
           ' M'+lastB[0].toFixed(1)+' '+lastB[1].toFixed(1)+' L'+x2.toFixed(1)+' '+y2.toFixed(1);
    lastA=[x1,y1];lastB=[x2,y2];
    if(++skidN>600){skidD=skidD.slice(skidD.length>>1);skidD=skidD.slice(skidD.indexOf(' M'));skidN=300}
    skid.setAttribute('d',skidD);
  }
  var lastA,lastB;

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
    /* дым и следы шин в заносе */
    var sx=Math.sin(rr),sy=-Math.cos(rr),rx=p.x-sx*ch*.36,ry=p.y-sy*ch*.36,px=-sy*cw*.38,py=sx*cw*.38;
    if(!still&&Math.abs(slip)>9&&Math.abs(v)>.18){
      if(now-lastPuff>(mob?70:45)){lastPuff=now;puff(rx+(slip>0?-px:px),ry+(slip>0?-py:py),p.a)}
      mark(rx+px,ry+py,rx-px,ry-py);
    }else skidOn=false;
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
