/* На слабой сети, без анимации и при переходе к разделу заставка пропускается. */
(function(){
  var root=document.documentElement;
  if(location.hash||root.classList.contains('vm-low-data')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  var theme=document.querySelector('meta[name="theme-color"]'),initialColor=theme.content;
  function restoreTheme(){theme.content=root.style.getPropertyValue('--vm-chrome')||initialColor}
  function dismiss(){
    if(!root.classList.contains('is-loading'))return;
    root.classList.remove('is-loading');
    restoreTheme();
  }

  root.classList.add('is-loading');
  theme.content='#ffffff';
  document.addEventListener('vm:open',restoreTheme,{once:true});
  addEventListener('scroll',dismiss,{passive:true,once:true});
  setTimeout(dismiss,3500);
})();
