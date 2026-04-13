(() => {
  try {
    const pref = localStorage.getItem('atlas_theme_pref') || localStorage.getItem('atlas_theme') || 'dark';
    const resolved = pref === 'auto'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : (pref === 'light' ? 'light' : 'dark');
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
  } catch (error) {
    document.documentElement.classList.add('dark');
  }
})();
