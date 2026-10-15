const $ = (id) => document.getElementById(id);
window.easy.onState((s) => {
  $('current').textContent = s.black ? '(black)' : s.text || '';
  $('next').textContent = s.next || '';
  $('title').textContent = s.title ? '· ' + s.title : '';
});
const tick = () => ($('clock').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
tick();
setInterval(tick, 1000);
