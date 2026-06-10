(function () {
  var field = document.getElementById('runeField');
  if (!field) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

  var GLYPHS = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'.split('');
  var COUNT = window.innerWidth < 640 ? 18 : 34;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawn() {
    var s = document.createElement('span');
    s.className = 'rune-mote';
    s.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    var size = rand(11, 26);
    var dur = rand(9, 20);
    var drift = rand(-40, 40);
    s.style.left = rand(0, 100) + 'vw';
    s.style.fontSize = size + 'px';
    s.style.setProperty('--dur', dur + 's');
    s.style.setProperty('--drift', drift + 'px');
    s.style.setProperty('--spin', rand(-40, 40) + 'deg');
    s.style.setProperty('--peak', rand(0.18, 0.5).toFixed(2));
    s.style.animationDelay = '-' + rand(0, dur) + 's';
    field.appendChild(s);
  }

  for (var i = 0; i < COUNT; i++) spawn();
})();
