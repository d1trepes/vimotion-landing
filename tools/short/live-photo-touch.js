  // Pause frame uploads while a swipe or scroll is in progress. Keep the last portrait frame visible.
  var resumeTimer=0;
  function pauseForScroll(){
    if(!swiping&&(!inView||covered))return;
    if(!swiping){swiping=true;sync()}
    clearTimeout(resumeTimer);
    resumeTimer=setTimeout(function(){swiping=false;sync();queue()},150);
  }
  if(mobile){
    addEventListener('touchstart',pauseForScroll,{passive:true});
    addEventListener('touchmove',pauseForScroll,{passive:true});
    addEventListener('scroll',pauseForScroll,{passive:true});
    document.addEventListener('vm:open',function(){requestAnimationFrame(queue)},{once:true});
  }
