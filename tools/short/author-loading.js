/* Start loading the author cards as the reader approaches the section. */
(function(){
  'use strict';
  var author=document.getElementById('author');
  if(!author||!('IntersectionObserver' in window))return;
  var lowData=document.documentElement.classList.contains('vm-low-data');
  var images=author.querySelectorAll('.au-card img');
  var observer=new IntersectionObserver(function(entries){
    if(!entries[0].isIntersecting)return;
    observer.disconnect();
    var count=lowData?Math.min(1,images.length):images.length;
    for(var i=0;i<count;i++){
      if(i>0)images[i].setAttribute('fetchpriority','low');
      images[i].loading='eager';
    }
  },{rootMargin:lowData?'0px 0px 320px':'0px 0px 1000px'});
  observer.observe(author);
})();
