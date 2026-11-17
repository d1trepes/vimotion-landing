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
    /* фактические рамки строк заголовка, абзаца и кнопки относительно колонки (без пустоты справа) */
    var boxes=[];copy.querySelectorAll('.ln,.sub,.btn').forEach(function(e){
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
