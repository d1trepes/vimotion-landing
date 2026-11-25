/* На слабой сети, без анимации и при переходе к разделу заставка пропускается. */
(function(){
  var root=document.documentElement;
  if(location.hash||root.classList.contains('vm-low-data')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  var theme=document.querySelector('meta[name="theme-color"]'),initialColor=theme.content;
  function restoreTheme(){theme.content=root.style.getPropertyValue('--vm-chrome')||initialColor}
  function dismiss(){
    if(!root.classList.contains('is-loading'))return;
    root.classList.remove('is-loading');
    document.dispatchEvent(new Event('vm:open'));
  }

  root.classList.add('is-loading');
  theme.content='#ffffff';
  document.addEventListener('vm:open',restoreTheme,{once:true});
  if(root.classList.contains('vm-touch')){
    document.addEventListener('DOMContentLoaded',function(){
      var pre=document.getElementById('pre');
      function blockScroll(event){if(root.classList.contains('is-loading'))event.preventDefault()}
      pre.addEventListener('touchmove',blockScroll,{passive:false});
      pre.addEventListener('wheel',blockScroll,{passive:false});
    },{once:true});
  }
  setTimeout(dismiss,3500);
})();
