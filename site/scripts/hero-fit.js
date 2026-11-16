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
  /* те же границы, что в 01-hero.css */
  var mqT=matchMedia('(max-width:1180px)'),mqP=matchMedia('(max-width:720px), (max-width:1180px) and (orientation:portrait)');

  /* высота окна без панелей браузера (svh) */
  var probe=document.createElement('div');
  probe.style.cssText='position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);

  function px(v){return Math.round(v*100)/100+'px'}
  function reset(){
    root.classList.remove('vm-fit');
    [hero,wm,pt,copy,stats].forEach(function(e){e.removeAttribute('style')});
  }
  function place(e,l,t,w,s){
    var st=e.style;st.left=px(l);st.top=px(t);
    if(w!=null)st.width=px(w);
    if(s!=null){st.transform=s<1?'scale('+s.toFixed(4)+')':'';st.transformOrigin='0 0'}
  }

  function fit(){
    reset();
    /* старые стили из кеша: ничего не трогаем, работает CSS-вёрстка */
    if(getComputedStyle(root).getPropertyValue('--hero-fit').trim()!=='1')return;
    var W=inn.clientWidth,H=probe.getBoundingClientRect().height||innerHeight;
    var m=parseFloat(getComputedStyle(root).getPropertyValue('--m'))||56;
    var hh=hdr?hdr.offsetHeight:76;
    var cr=copy.getBoundingClientRect(),sr=stats.getBoundingClientRect();
    var Cw=cr.width,Ch=cr.height,Sw=sr.width,Sh=sr.height;
    var phone=mqP.matches,desk=!mqT.matches;
    var wmFull=W-2*m,s=1,wmW=wmFull,heroH,pw,ph,pl,ptop,wmTop=hh,col,gap;

    if(!phone){
      /* десктоп: текст слева и цифры справа прижаты к низу; планшет: цифры строкой под текстом */
      gap=desk?6:28;
      var sg=desk?0:26;
      col=desk?Math.max(Ch,Sh):Ch+sg+Sh;
      var free=H-hh-gap-m-wmFull*WM;
      s=Math.min(1,free/col);
      if(s<.82){s=.82;wmW=Math.max(wmFull*.5,(H-hh-gap-m-col*s)/WM)}
      var wmH=wmW*WM;
      heroH=Math.max(H,hh+wmH+gap+col*s+m);
      var wmL=(W-wmW)/2;
      /* портрет привязан к вордмарку в тех же пропорциях, что на макете 1440 */
      var kw=desk?.5196:.554,kc=desk?.5787:.756;
      pw=kw*wmW;ph=pw*PT;
      var minTop=wmTop+.36*wmH;
      if(heroH-ph<minTop){ph=heroH-minTop;pw=ph/PT}
      ptop=heroH-ph;pl=Math.min(W-pw,wmL+kc*wmW-pw/2);
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
      var ptTop=wmTop+.17*wmFull*WM,g1=16,sg2=20;
      col=Ch+sg2+Sh;
      var phFull=Math.min(.96*W,W-2*m+48)*PT;
      ph=Math.min(phFull,H-ptTop-g1-col-m);
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
      place(stats,m,heroH-m-Sh*s,(W-2*m)/s,s);
      place(copy,m,heroH-m-(Sh+sg2+Ch)*s,(W-2*m)/s,s);
    }
  }

  var raf=0,lastW=0,lastH=0;
  function schedule(){
    var W=inn.clientWidth,H=probe.getBoundingClientRect().height;
    if(W===lastW&&H===lastH)return;
    lastW=W;lastH=H;cancelAnimationFrame(raf);raf=requestAnimationFrame(fit);
  }
  function force(){lastW=lastH=0;schedule()}
  addEventListener('resize',schedule);
  addEventListener('load',force);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(force);
  fit();lastW=inn.clientWidth;lastH=probe.getBoundingClientRect().height;
  window.vmFit=force;
})();
