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
