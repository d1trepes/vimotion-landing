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
  var mqT=matchMedia('(max-width:1320px)'),mqP=matchMedia('(max-width:559px), (max-width:759px) and (min-height:541px)');

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
      pw=Math.min(W*.49,640);ph=pw*PT;
      heroH=Math.max(brandBottom+16+col+m,Math.min(H,brandBottom+ph+32));
      place(wm,m,hh,wmFull);
      place(pt,W-m*.4-pw,heroH-ph,pw);pt.style.height=px(ph);
      place(copy,m,heroH-m-col,Cw);
      place(stats,m,heroH-m-Sh,Sw);
    }else{
      /* Телефоны: крупный портрет перед текстом. */
      var wmTop=hh+4;
      var ptTop=wmTop+.04*wmFull*WM,g1=12,statsGap=root.classList.contains('hero-compact')?12:20;
      col=Ch+statsGap+Sh;
      var phFull=Math.min(W*.96,530)*PT;
      ph=Math.max(phFull*.82,Math.min(phFull,H-ptTop-g1-col-m));
      heroH=Math.max(H,ptTop+ph+g1+col+m);
      pw=ph/PT;
      place(wm,m,wmTop,wmFull);
      place(pt,(W-pw)/2,ptTop,pw);pt.style.height=px(ph);
      place(stats,m,heroH-m-Sh,W-2*m);
      place(copy,m,heroH-m-col,W-2*m);
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
  addEventListener('resize',schedule);
  addEventListener('load',force);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(force);
  fit();lastW=inn.clientWidth;lastH=probe.getBoundingClientRect().height;
})();
