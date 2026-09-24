'use strict';

/* ---------- Pomodoro ---------- */

const PHASES = {
  work: { label: 'Foco', emoji: '🍅' },
  short: { label: 'Descanso corto', emoji: '☕' },
  long: { label: 'Descanso largo', emoji: '🌿' },
};

const Pomo = {
  phase: 'work',
  running: false,
  endAt: 0,
  remaining: null,
  done: 0, // pomodoros de foco completados hoy

  duration(phase = this.phase) {
    const p = Store.data.pomodoro;
    return (phase === 'work' ? p.work : phase === 'short' ? p.short : p.long) * 60000;
  },
  left() {
    if (this.remaining === null) this.remaining = this.duration();
    return this.running ? Math.max(0, this.endAt - Date.now()) : this.remaining;
  },
  start() {
    this.endAt = Date.now() + this.left();
    this.running = true;
  },
  pause() {
    this.remaining = this.left();
    this.running = false;
  },
  reset() {
    this.running = false;
    this.remaining = this.duration();
  },
  setPhase(phase) {
    this.phase = phase;
    this.running = false;
    this.remaining = this.duration();
  },
  next(completed) {
    let next;
    if (this.phase === 'work') {
      if (completed) this.done++;
      next = completed && this.done % Store.data.pomodoro.cycles === 0 ? 'long' : 'short';
    } else next = 'work';
    this.setPhase(next);
  },
  tick() {
    if (this.running && Date.now() >= this.endAt) this.finish();
  },
  finish() {
    const was = this.phase;
    beep();
    if (was === 'work') this.logFocus();
    this.next(true);
    const msg = was === 'work'
      ? (this.phase === 'long' ? '¡Terminaste un ciclo! Descanso largo, colgate un rato como yo. 🌿' : '¡Pomodoro terminado! Hora de un descansito. ☕')
      : '¡Se terminó el descanso! A seguir, despacito. 🍅';
    notify(msg);
    if (Store.data.settings.slothEnabled) Sloth.show(msg, 8000);
    if (Store.data.pomodoro.autoNext) this.start();
    if (location.hash === '#pomodoro') renderPomodoro();
  },
  logFocus() {
    const subjectId = Store.data.pomodoro.subjectId;
    if (!subjectId || !subjectById(subjectId)) return;
    if (Store.data.activeSession) { toast('Tenés una sesión de estudio abierta; no sumé el pomodoro para no contarlo dos veces.'); return; }
    const end = Date.now();
    Store.data.sessions.push({ id: uid(), subjectId, start: end - this.duration('work'), end, source: 'pomodoro' });
    Store.save();
  },
};

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.28, 0.56].forEach((t, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = i === 2 ? 880 : 660;
      o.connect(g); g.connect(ctx.destination);
      const t0 = ctx.currentTime + t;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
      o.start(t0); o.stop(t0 + 0.26);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (e) { /* sin audio, no pasa nada */ }
}

function notify(msg) {
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification('Perezoso', { body: msg, icon: 'img/perezoso.svg' });
  } catch (e) { /* algunos navegadores no permiten notificaciones acá */ }
}

const RING_C = 2 * Math.PI * 104;

function renderPomodoro() {
  const p = Store.data.pomodoro;
  const ph = PHASES[Pomo.phase];
  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head"><div><h1>Pomodoro</h1><p class="sub">Bloques de foco y descansos. Lento pero constante.</p></div></div>
      <div class="pomo-wrap">
        <div class="card pomo phase-${Pomo.phase}">
          <div class="phase-tabs">
            ${Object.keys(PHASES).map((k) => `<button data-phase="${k}" class="${k === Pomo.phase ? 'on' : ''}">${PHASES[k].emoji} ${PHASES[k].label}</button>`).join('')}
          </div>
          <div class="ring">
            <svg viewBox="0 0 240 240" aria-hidden="true">
              <circle cx="120" cy="120" r="104" class="ring-bg"/>
              <circle cx="120" cy="120" r="104" class="ring-fg" id="ring-fg" stroke-dasharray="${RING_C}" stroke-dashoffset="0" transform="rotate(-90 120 120)"/>
            </svg>
            <div class="ring-center">
              <span class="ring-phase">${ph.emoji} ${ph.label}</span>
              <span id="pomo-time" class="pomo-time">--:--</span>
              <span class="muted">${'🍅'.repeat(Pomo.done % p.cycles)}${'○'.repeat(p.cycles - (Pomo.done % p.cycles))}</span>
            </div>
          </div>
          <div class="pomo-controls">
            <button class="btn ghost" id="pomo-reset" title="Reiniciar">↺</button>
            <button class="btn big" id="pomo-toggle">${Pomo.running ? '❚❚ Pausar' : '▶ Empezar'}</button>
            <button class="btn ghost" id="pomo-skip" title="Saltar a la siguiente fase">⏭</button>
          </div>
          <p class="muted center">Pomodoros completados en esta sesión: <strong>${Pomo.done}</strong></p>
        </div>

        <form class="card form pomo-settings" id="pomo-form">
          <h2>Ajustes</h2>
          <div class="row">
            <label>Foco (min)<input type="number" name="work" min="1" max="180" value="${p.work}"></label>
            <label>Descanso corto<input type="number" name="short" min="1" max="60" value="${p.short}"></label>
          </div>
          <div class="row">
            <label>Descanso largo<input type="number" name="long" min="1" max="120" value="${p.long}"></label>
            <label>Pomodoros por ciclo<input type="number" name="cycles" min="1" max="12" value="${p.cycles}"></label>
          </div>
          <label>Sumar el tiempo de foco a las horas de
            <select name="subjectId">${subjectOptions(p.subjectId, { allowEmpty: true, emptyLabel: '— No sumar a ninguna materia —' })}</select>
          </label>
          <label class="check"><input type="checkbox" name="autoNext" ${p.autoNext ? 'checked' : ''}> Arrancar la siguiente fase automáticamente</label>
          <p class="hint">Si elegís una materia, cada pomodoro completo se descuenta de las horas que le faltan.</p>
        </form>
      </div>
    </section>`;

  $$('[data-phase]').forEach((b) => (b.onclick = () => { Pomo.setPhase(b.dataset.phase); renderPomodoro(); }));
  $('#pomo-toggle').onclick = () => {
    if (Pomo.running) Pomo.pause();
    else {
      Pomo.start();
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    }
    renderPomodoro();
  };
  $('#pomo-reset').onclick = () => { Pomo.reset(); renderPomodoro(); };
  $('#pomo-skip').onclick = () => { Pomo.next(false); renderPomodoro(); };
  const f = $('#pomo-form');
  f.onchange = () => {
    const el = f.elements;
    const num = (n, min, max, def) => Math.min(max, Math.max(min, parseInt(el[n].value, 10) || def));
    Object.assign(p, {
      work: num('work', 1, 180, 25), short: num('short', 1, 60, 5), long: num('long', 1, 120, 15), cycles: num('cycles', 1, 12, 4),
      subjectId: el.subjectId.value, autoNext: el.autoNext.checked,
    });
    Store.save();
    if (!Pomo.running) Pomo.remaining = Pomo.duration();
    renderPomodoro();
  };
  paintPomodoro();
}

function paintPomodoro() {
  const t = $('#pomo-time');
  if (!t) return;
  const left = Pomo.left();
  const s = Math.ceil(left / 1000);
  t.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const fg = $('#ring-fg');
  if (fg) fg.setAttribute('stroke-dashoffset', String(RING_C * (1 - left / Pomo.duration())));
}
