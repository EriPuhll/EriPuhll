'use strict';

/* ---------- Pomodoro y simulacro de parcial ---------- */

const PHASES = {
  work: { label: 'Foco', emoji: '🍅' },
  short: { label: 'Descanso corto', emoji: '☕' },
  long: { label: 'Descanso largo', emoji: '🌿' },
};
let pomoTab = 'pomodoro';
let simResultId = null;

const Pomo = {
  phase: 'work',
  running: false,
  endAt: 0,
  remaining: null,
  done: 0,

  duration(phase = this.phase) {
    const p = Store.data.pomodoro;
    return (phase === 'work' ? p.work : phase === 'short' ? p.short : p.long) * 60000;
  },
  left() {
    if (this.remaining === null) this.remaining = this.duration();
    return this.running ? Math.max(0, this.endAt - Date.now()) : this.remaining;
  },
  start() { this.endAt = Date.now() + this.left(); this.running = true; Sloth.paint(); },
  pause() { this.remaining = this.left(); this.running = false; Sloth.paint(); },
  reset() { this.running = false; this.remaining = this.duration(); Sloth.paint(); },
  setPhase(phase) { this.phase = phase; this.running = false; this.remaining = this.duration(); },
  next(completed) {
    let next;
    if (this.phase === 'work') {
      if (completed) this.done++;
      next = completed && this.done % Store.data.pomodoro.cycles === 0 ? 'long' : 'short';
    } else next = 'work';
    this.setPhase(next);
  },
  tick() { if (this.running && Date.now() >= this.endAt) this.finish(); },
  finish() {
    const was = this.phase;
    beep();
    if (was === 'work') this.logFocus();
    this.next(true);
    if (Store.data.pomodoro.autoNext) this.start();
    if (was === 'work') {
      notify('¡Pomodoro terminado! Hora de descansar.');
      Sloth.react('pomodoro', {}, { proud: true, mood: 'estirandose' });
    } else {
      notify('Se terminó el descanso.');
      Sloth.react('descanso');
    }
    if (location.hash.startsWith('#pomodoro')) renderPomodoro();
  },
  logFocus() {
    const subjectId = Store.data.pomodoro.subjectId;
    if (!subjectId || !subjectById(subjectId)) return;
    if (Store.data.activeSession) { toast('Tenés el cronómetro corriendo; no sumé el pomodoro para no contarlo dos veces.'); return; }
    const end = Date.now();
    addSession(subjectId, end - this.duration('work'), end, 'pomodoro');
  },
};

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.3, 0.6].forEach((t, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = i === 2 ? 784 : 587;
      o.connect(g); g.connect(ctx.destination);
      const t0 = ctx.currentTime + t;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      o.start(t0); o.stop(t0 + 0.55);
    });
    setTimeout(() => ctx.close(), 1800);
  } catch (e) { /* sin audio */ }
}

const RING_C = 2 * Math.PI * 104;

function renderPomodoro() {
  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head">
        <div><h1>Pomodoro</h1><p class="sub">Bloques de foco y descansos. Lento pero constante.</p></div>
        <div class="switch" role="tablist">
          <button role="tab" data-ptab="pomodoro" class="${pomoTab === 'pomodoro' ? 'on' : ''}">🍅 Pomodoro</button>
          <button role="tab" data-ptab="simulacro" class="${pomoTab === 'simulacro' ? 'on' : ''}">📝 Simulacro de parcial</button>
        </div>
      </div>
      <div id="pomo-content"></div>
    </section>`;
  $$('[data-ptab]').forEach((b) => (b.onclick = () => { pomoTab = b.dataset.ptab; renderPomodoro(); }));
  if (pomoTab === 'simulacro') renderSimulacro($('#pomo-content'));
  else renderPomoTimer($('#pomo-content'));
}

function renderPomoTimer(el) {
  const p = Store.data.pomodoro;
  const ph = PHASES[Pomo.phase];
  el.innerHTML = `
    <div class="pomo-wrap">
      <div class="card pomo phase-${Pomo.phase}">
        <label class="field">Materia
          <select id="pomo-subj">${subjectOptions(p.subjectId, { allowEmpty: true, emptyLabel: '— No sumar a ninguna materia —' })}</select>
        </label>
        <div class="chip-row" style="justify-content:center">
          ${Object.keys(PHASES).map((k) => `<button class="chip-opt ${k === Pomo.phase ? 'on' : ''}" data-phase="${k}">${PHASES[k].emoji} ${PHASES[k].label}</button>`).join('')}
        </div>
        <div class="ring">
          <svg viewBox="0 0 240 240" aria-hidden="true">
            <circle cx="120" cy="120" r="104" class="ring-bg"/>
            <circle cx="120" cy="120" r="104" class="ring-fg" id="ring-fg" stroke-dasharray="${RING_C}" stroke-dashoffset="0" transform="rotate(-90 120 120)"/>
          </svg>
          <div class="ring-center">
            <span class="ring-phase">${ph.emoji} ${ph.label}</span>
            <span id="pomo-time" class="pomo-time" role="timer">--:--</span>
            <span class="muted" aria-label="Pomodoros del ciclo">${'🍅'.repeat(Pomo.done % p.cycles)}${'○'.repeat(p.cycles - (Pomo.done % p.cycles))}</span>
          </div>
        </div>
        <div class="pomo-controls">
          <button class="btn ghost" id="pomo-reset" title="Reiniciar" aria-label="Reiniciar">↺</button>
          <button class="btn big" id="pomo-toggle">${Pomo.running ? '❚❚ Pausar' : '▶ Empezar'}</button>
          <button class="btn ghost" id="pomo-skip" title="Saltar a la siguiente fase" aria-label="Saltar fase">⏭</button>
        </div>
        <p class="muted center">${p.subjectId ? `Cada bloque de foco terminado suma ${p.work} min a <strong>${esc(subjectName(p.subjectId))}</strong>.` : 'Elegí una materia para que los bloques se sumen a tus horas.'}</p>
      </div>

      <form class="card form" id="pomo-form">
        <h2>Tiempos</h2>
        <div class="row">
          <label>Foco (min)<input type="number" name="work" min="1" max="180" value="${p.work}"></label>
          <label>Descanso corto<input type="number" name="short" min="1" max="60" value="${p.short}"></label>
        </div>
        <div class="row">
          <label>Descanso largo<input type="number" name="long" min="1" max="120" value="${p.long}"></label>
          <label>Largo cada (ciclos)<input type="number" name="cycles" min="1" max="12" value="${p.cycles}"></label>
        </div>
        <label class="check"><input type="checkbox" name="autoNext" ${p.autoNext ? 'checked' : ''}> Arrancar la siguiente fase sola</label>
        <p class="hint">Pomodoros completados en esta sesión: <strong>${Pomo.done}</strong></p>
      </form>
    </div>`;

  $('#pomo-subj', el).onchange = (e) => { p.subjectId = e.target.value; Store.save(); renderPomoTimer(el); };
  $$('[data-phase]', el).forEach((b) => (b.onclick = () => { Pomo.setPhase(b.dataset.phase); renderPomoTimer(el); }));
  $('#pomo-toggle', el).onclick = () => {
    if (Pomo.running) Pomo.pause();
    else {
      Pomo.start();
      if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    }
    renderPomoTimer(el);
  };
  $('#pomo-reset', el).onclick = () => { Pomo.reset(); renderPomoTimer(el); };
  $('#pomo-skip', el).onclick = () => { Pomo.next(false); Sloth.paint(); renderPomoTimer(el); };
  const f = $('#pomo-form', el);
  f.onchange = () => {
    const x = f.elements;
    const num = (n, min, max, def) => clamp(parseInt(x[n].value, 10) || def, min, max);
    Object.assign(p, { work: num('work', 1, 180, 25), short: num('short', 1, 60, 5), long: num('long', 1, 120, 15), cycles: num('cycles', 1, 12, 4), autoNext: x.autoNext.checked });
    Store.save();
    if (!Pomo.running) Pomo.remaining = Pomo.duration();
    renderPomoTimer(el);
  };
  paintPomodoro();
}

function paintPomodoro() {
  const t = $('#pomo-time');
  if (t) {
    const left = Pomo.left();
    t.textContent = fmtMS(Math.ceil(left / 1000) * 1000);
    const fg = $('#ring-fg');
    if (fg) fg.setAttribute('stroke-dashoffset', String(RING_C * (1 - left / Pomo.duration())));
  }
  paintSimulacro();
}

/* ===== Simulacro de parcial ===== */

function simStats(sim) {
  const secs = sim.secsPerExercise;
  const total = secs.reduce((a, b) => a + b, 0);
  const avail = (sim.totalMin * 60) / sim.count;
  return { total, avail, avg: secs.length ? total / secs.length : 0, over: secs.filter((x) => x > avail).length };
}

function renderSimulacro(el) {
  const act = Store.data.activeSim;
  if (act) {
    el.innerHTML = `
      <div class="card sim-run">
        <span class="badge" style="--c:${subjectColor(act.subjectId)}">${esc(subjectName(act.subjectId))}</span>
        <div class="muted">Tiempo total restante</div>
        <div class="big-clock" id="sim-total">--:--</div>
        <div class="sim-ex" id="sim-ex"></div>
        <div class="muted">En este ejercicio: <strong class="num" id="sim-cur">00:00</strong> · promedio disponible <strong class="num">${fmtMS((act.totalMin * 60000) / act.count)}</strong></div>
        <div class="btn-row">
          <button class="btn big" id="sim-next">${act.marks.length + 1 >= act.count ? '🏁 Terminar' : 'Siguiente ejercicio →'}</button>
        </div>
        <button class="btn ghost sm danger" id="sim-quit">Abandonar simulacro</button>
      </div>`;
    $('#sim-next', el).onclick = () => {
      act.marks.push(Date.now());
      if (act.marks.length >= act.count) finishSim();
      else Store.save();
      renderSimulacro(el);
    };
    $('#sim-quit', el).onclick = () => {
      if (!confirm('¿Abandonar el simulacro? No se guarda.')) return;
      Store.data.activeSim = null; Store.save(); renderSimulacro(el);
    };
    paintSimulacro();
    return;
  }

  const res = simResultId && Store.data.simulacros.find((x) => x.id === simResultId);
  const history = Store.data.simulacros.slice().sort((a, b) => b.start - a.start);
  el.innerHTML = `
    <div class="grid-2">
      <form class="card form" id="sim-form">
        <h2>📝 Nuevo simulacro</h2>
        <p class="hint">Practicá con tiempo real: elegís cuántos ejercicios y cuánto dura la prueba, y vas tocando “Siguiente” al terminar cada uno. El tiempo cuenta como horas de estudio.</p>
        <label>Materia<select name="subjectId" required>${subjectOptions(Store.data.lastStudySubject)}</select></label>
        <div class="row">
          <label>Cantidad de ejercicios<input type="number" name="count" min="1" max="60" value="16" required></label>
          <label>Tiempo total (min)<input type="number" name="totalMin" min="5" max="600" value="180" required></label>
        </div>
        <button class="btn big" ${Store.data.subjects.length ? '' : 'disabled'}>▶ Empezar simulacro</button>
      </form>
      ${res ? simResultHTML(res) : `<div class="card"><h2>Historial</h2>${history.length ? simHistoryHTML(history) : '<p class="muted">Todavía no hiciste simulacros.</p>'}</div>`}
    </div>
    ${res && history.length > 1 ? `<div class="card"><h2>Historial</h2>${simHistoryHTML(history)}</div>` : ''}`;

  $('#sim-form', el).onsubmit = (e) => {
    e.preventDefault();
    const x = e.target.elements;
    Store.data.activeSim = { subjectId: x.subjectId.value, count: clamp(+x.count.value, 1, 60), totalMin: clamp(+x.totalMin.value, 5, 600), start: Date.now(), marks: [] };
    Store.data.lastStudySubject = x.subjectId.value;
    simResultId = null;
    Store.save();
    renderSimulacro(el);
  };
  const close = $('#sim-close', el);
  if (close) close.onclick = () => { simResultId = null; renderSimulacro(el); };
  $$('[data-simopen]', el).forEach((b) => (b.onclick = () => { simResultId = b.dataset.simopen; renderSimulacro(el); }));
}

function simHistoryHTML(list) {
  return `<ul class="plain">${list.slice(0, 12).map((s) => {
    const st = simStats(s);
    return `<li><button class="link" data-simopen="${s.id}">${fmtDateShort(new Date(s.start))} · ${esc(subjectName(s.subjectId))}</button>
      <span class="muted small"> — ${s.count} ej. en ${fmtHM(st.total / 60)} · ${st.over} pasados de tiempo</span></li>`;
  }).join('')}</ul>`;
}

function simResultHTML(sim) {
  const st = simStats(sim);
  const prev = Store.data.simulacros.filter((x) => x.subjectId === sim.subjectId && x.start < sim.start).sort((a, b) => b.start - a.start);
  const p = prev[0] && simStats(prev[0]);
  const diff = p ? st.avg - p.avg : 0;
  return `<div class="card">
    <div class="list-head"><h2>🏁 Resultado</h2><button class="btn ghost sm" id="sim-close">Cerrar</button></div>
    <p><strong>${esc(subjectName(sim.subjectId))}</strong> · ${fmtDateShort(new Date(sim.start))}</p>
    <p class="muted">${sim.count} ejercicios en ${fmtHM(st.total / 60)} de ${fmtHM(sim.totalMin)} disponibles. Promedio por ejercicio: <strong>${fmtMS(st.avg * 1000)}</strong> (disponible ${fmtMS(st.avail * 1000)}).</p>
    ${p ? `<div class="alert ${diff <= 0 ? 'ok' : 'warn'}" style="margin:.6rem 0">${diff <= 0 ? '⚡ Más rápida' : '🐢 Más lenta'} que tu simulacro anterior de esta materia: ${fmtMS(Math.abs(diff) * 1000)} ${diff <= 0 ? 'menos' : 'más'} por ejercicio (antes ${fmtMS(p.avg * 1000)}; ${p.over} pasados de tiempo, ahora ${st.over}).</div>` : '<p class="hint">Es tu primer simulacro de esta materia: el próximo lo vas a poder comparar.</p>'}
    <div class="table-scroll"><table class="sim-table">
      <thead><tr><th>Ejercicio</th><th>Tiempo</th><th></th></tr></thead>
      <tbody>${sim.secsPerExercise.map((x, i) => `<tr class="${x > st.avail ? 'over' : ''}"><td>${i + 1}</td><td>${fmtMS(x * 1000)}</td><td>${x > st.avail ? '⏰ se pasó del promedio' : '✓'}</td></tr>`).join('')}</tbody>
    </table></div>
  </div>`;
}

function finishSim() {
  const act = Store.data.activeSim;
  const points = [act.start, ...act.marks];
  const secs = act.marks.map((t, i) => Math.round((t - points[i]) / 1000));
  const sim = { id: uid(), subjectId: act.subjectId, start: act.start, date: toISODate(new Date(act.start)), totalMin: act.totalMin, count: act.count, secsPerExercise: secs };
  Store.data.simulacros.push(sim);
  Store.data.activeSim = null;
  const end = act.marks[act.marks.length - 1];
  simResultId = sim.id;
  if (end - act.start >= 60000) {
    addSession(act.subjectId, act.start, end, 'simulacro');
    Sloth.react('sesion', { tiempo: fmtHM((end - act.start) / 60000), materia: subjectName(act.subjectId) }, { proud: true });
  } else Store.save();
}

function paintSimulacro() {
  const act = Store.data.activeSim;
  const tot = $('#sim-total');
  if (!act || !tot) return;
  const now = Date.now();
  const left = act.start + act.totalMin * 60000 - now;
  tot.textContent = left >= 0 ? fmtClock(left) : `-${fmtClock(-left)}`;
  tot.style.color = left < 0 ? 'var(--danger)' : '';
  const last = act.marks.length ? act.marks[act.marks.length - 1] : act.start;
  const cur = now - last;
  const curEl = $('#sim-cur');
  curEl.textContent = fmtMS(cur);
  curEl.style.color = cur > (act.totalMin * 60000) / act.count ? 'var(--danger)' : '';
  $('#sim-ex').textContent = `Ejercicio ${act.marks.length + 1} de ${act.count}`;
}
