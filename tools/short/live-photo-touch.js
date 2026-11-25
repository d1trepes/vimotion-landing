  var wordmark=document.querySelector('.wm img');
  function warmVideo(){
    // Fetch only after the two visible hero images. WebGL and playback still start after the speedometer.
    if(!('WebGLRenderingContext' in window)||root.classList.contains('vm-low-data')||swiping||!inView||!visible||covered)return;
    if(!poster||!poster.complete||!poster.naturalWidth||(wordmark&&!wordmark.complete))return;
    setSrc();
  }

  // Pause frame uploads while a swipe or scroll is in progress. Keep the last portrait frame visible.
  var resumeTimer=0;
  function pauseForScroll(){
    if(!swiping&&(!inView||covered))return;
    if(!swiping){swiping=true;sync()}
    clearTimeout(resumeTimer);
    resumeTimer=setTimeout(function(){swiping=false;sync();queue()},150);
  }
  if(mobile){
    if(wordmark&&!wordmark.complete)wordmark.addEventListener('load',queue,{once:true});
    addEventListener('touchstart',pauseForScroll,{passive:true});
    addEventListener('touchmove',pauseForScroll,{passive:true});
    addEventListener('scroll',pauseForScroll,{passive:true});
    document.addEventListener('vm:open',function(){requestAnimationFrame(queue)},{once:true});
  }
