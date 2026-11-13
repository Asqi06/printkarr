// PrintKarr UI feels — pre-paint theme resolver (Grofers-inspired dark mode).
// Runs blocking in <head> so the first paint already has the right theme;
// the full toggle/haptics layer lives in design-feel.js (deferred).
(function () {
  var dark = null;
  try { dark = localStorage.getItem('pk-theme'); } catch (e) {}
  if (dark !== 'dark' && dark !== 'light') {
    dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  try {
    document.documentElement.setAttribute('data-theme', dark);
    document.documentElement.style.colorScheme = dark;
  } catch (e) {}
})();
