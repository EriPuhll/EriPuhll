'use strict';

/* ---------- Arranque, navegación y reloj global ---------- */

const Views = {
  inicio: renderHome,
  calendario: renderCalendar,
  materias: renderSubjects,
  materia: renderSubject,
  estudio: renderStudy,
  pomodoro: renderPomodoro,
  proyectos: renderProjects,
  proyecto: renderProject,
  perezoso: renderSlothPage,
  ajustes: renderSettings,
};
const PARENT_TAB = { materia: 'materias', proyecto: 'proyectos' };

function currentRoute() {
  const [name, ...args] = (location.hash.slice(1) || 'inicio').split('/');
  return { name: Views[name] ? name : 'inicio', args };
}

function rerender() {
  const { name, args } = currentRoute();
  const tab = PARENT_TAB[name] || name;
  $$('[data-tab]').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
  const more = ['pomodoro', 'proyectos', 'perezoso', 'ajustes'].includes(tab);
  $('#more-btn').classList.toggle('on', more);
  if (name !== 'materia') applyTheme(globalTheme());
  Views[name](...args);
  updateLive();
}

function route() {
  Modal.close();
  $('#more-sheet').hidden = true;
  $('#more-btn').setAttribute('aria-expanded', 'false');
  rerender();
  window.scrollTo(0, 0);
}

// Cada segundo: cronómetros, pomodoro, simulacro y cuentas regresivas
function updateLive() {
  const now = Date.now();
  const a = Store.data.activeSession;

  const clock = $('#study-clock');
  if (clock && a) clock.textContent = fmtClock(now - a.start);
  paintPomodoro();

  let pillHtml = '', href = '#estudio';
  if (a) pillHtml = `<span class="dot" style="--c:${subjectColor(a.subjectId)}"></span>${esc(subjectName(a.subjectId))} · ${fmtClock(now - a.start)}`;
  else if (Store.data.activeSim) { pillHtml = 'Simulacro en curso'; href = '#pomodoro'; }
  else if (Pomo.running) { pillHtml = `${PHASES[Pomo.phase].label} · ${fmtMS(Math.ceil(Pomo.left() / 1000) * 1000)}`; href = '#pomodoro'; }
  $$('.live-pill').forEach((p) => {
    p.hidden = !pillHtml;
    if (pillHtml && p.innerHTML !== pillHtml) p.innerHTML = pillHtml;
    p.href = href;
  });

  document.title = Pomo.running
    ? `${PHASES[Pomo.phase].label} ${fmtMS(Math.ceil(Pomo.left() / 1000) * 1000)} · Perezoso`
    : a ? `${fmtClock(now - a.start)} · Perezoso` : 'Perezoso · Organizador semestral';

  $$('[data-countdown]').forEach((n) => {
    const cd = countdown(new Date(+n.dataset.countdown));
    if (n.textContent !== cd.text) n.textContent = cd.text;
    if (n.dataset.level !== undefined && n.dataset.level !== cd.level) n.dataset.level = cd.level;
  });
}

function init() {
  Store.load();
  applyTheme(globalTheme());
  applyBullet();
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

  const moreBtn = $('#more-btn');
  moreBtn.onclick = () => {
    const sheet = $('#more-sheet');
    sheet.hidden = !sheet.hidden;
    moreBtn.setAttribute('aria-expanded', String(!sheet.hidden));
  };
  document.addEventListener('click', (e) => {
    const sheet = $('#more-sheet');
    if (!sheet.hidden && !sheet.contains(e.target) && !moreBtn.contains(e.target)) { sheet.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); }
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => rerender());

  window.addEventListener('hashchange', route);
  setInterval(() => { Pomo.tick(); updateLive(); }, 1000);
  route();
}

document.addEventListener('DOMContentLoaded', init);
