const r = createRenderer(document.getElementById('bg'), document.getElementById('text'), document.getElementById('black'));
window.easy.onState((s) => r.render(s));
window.addEventListener('resize', () => r.fit());
