'use strict';

/* ---------- Arranque, navegación y reloj global ---------- */

const Views = {
  calendario: renderCalendar,
  materias: renderSubjects,
  materia: renderSubject,
  estudio: renderStudy,
  pomodoro: renderPomodoro,
  ajustes: renderSettings,
};

function currentRoute() {
  const [name, arg] = (location.hash.slice(1) || 'calendario').split('/');
  return { name: Views[name] ? name : 'calendario', arg };
}

function rerender() {
  const { name, arg } = currentRoute();
  const tab = name === 'materia' ? 'materias' : name;
  $$('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
  if (name !== 'materia') applyTheme(globalTheme());
  Views[name](arg);
  updateLive();
}

function route() {
  Modal.close();
  rerender();
  window.scrollTo(0, 0);
}

// Se ejecuta cada segundo: cronómetros, pomodoro, cuentas regresivas.
function updateLive() {
  const now = Date.now();
  const a = Store.data.activeSession;

  const clock = $('#study-clock');
  if (clock && a) clock.textContent = fmtClock(now - a.start);

  paintPomodoro();

  const pill = $('#live-pill');
  if (a) {
    pill.hidden = false;
    pill.href = '#estudio';
    pill.innerHTML = `<span class="dot" style="--c:${subjectColor(a.subjectId)}"></span>${esc(subjectName(a.subjectId))} · ${fmtClock(now - a.start)}`;
  } else if (Pomo.running) {
    const s = Math.ceil(Pomo.left() / 1000);
    pill.hidden = false;
    pill.href = '#pomodoro';
    pill.textContent = `${PHASES[Pomo.phase].emoji} ${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  } else pill.hidden = true;

  document.title = Pomo.running
    ? `${pill.textContent} · Perezoso`
    : a ? `⏱ ${fmtClock(now - a.start)} · Perezoso` : 'Perezoso · Organizador semestral';

  $$('[data-countdown]').forEach((n) => {
    const cd = countdown(new Date(+n.dataset.countdown));
    if (n.textContent !== cd.text) n.textContent = cd.text;
    if (n.dataset.level !== undefined && n.dataset.level !== cd.level) n.dataset.level = cd.level;
  });
}

function init() {
  Store.load();
  Sloth.init();
  Install.init();
  AutoSave.init();

  const modal = $('#modal');
  modal.addEventListener('click', (e) => { if (e.target === modal) Modal.close(); });
  modal.addEventListener('close', () => {
    const cb = Modal.onClose;
    Modal.onClose = null;
    if (cb) cb();
  });

  window.addEventListener('hashchange', route);
  setInterval(() => { Pomo.tick(); updateLive(); }, 1000);
  route();
}

document.addEventListener('DOMContentLoaded', init);
