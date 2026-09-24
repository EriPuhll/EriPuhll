'use strict';

/* ---------- Horas de estudio ---------- */

const studyFilter = { subject: '' };
const SOURCE_LABEL = { cronometro: 'Cronómetro', pomodoro: 'Pomodoro', manual: 'Manual', simulacro: 'Simulacro' };

function startStudy(subjectId) {
  if (!subjectId) { toast('Elegí qué materia vas a estudiar.'); return false; }
  Store.data.activeSession = { subjectId, start: Date.now() };
  Store.data.lastStudySubject = subjectId;
  Store.save();
  toast(`¡A estudiar ${subjectName(subjectId)}! `);
  Sloth.paint();
  return true;
}

function stopStudy() {
  const a = Store.data.activeSession;
  if (!a) return;
  const end = Date.now();
  Store.data.activeSession = null;
  if (end - a.start < 60000) {
    Store.save();
    toast('Fue menos de 1 minuto, no lo registré.');
    return;
  }
  addSession(a.subjectId, a.start, end, 'cronometro');
  const mins = (end - a.start) / 60000;
  toast(`Registré ${fmtHM(mins)} de ${subjectName(a.subjectId)}`);
  const st = streakDays();
  if (st >= 3 && Math.random() < 0.35) Sloth.react('racha', { dias: st }, { proud: true });
  else Sloth.react('sesion', { tiempo: fmtHM(mins), materia: subjectName(a.subjectId) }, { proud: true });
}

// Barras de los últimos 14 días (una sola serie: horas por día)
function last14Chart() {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - 13 + i); return d; });
  const vals = days.map((d) => studiedMinutes('', d.getTime(), d.getTime() + DAY_MS) / 60);
  const max = Math.max(1, ...vals);
  const W = 560, H = 170, padL = 30, padB = 22, padT = 16;
  const bw = (W - padL) / 14;
  const yTicks = [0, max / 2, max].map((v) => Math.round(v * 10) / 10);
  const y = (v) => padT + (H - padT - padB) * (1 - v / max);
  const bars = days.map((d, i) => {
    const v = vals[i];
    const x = padL + i * bw + bw * 0.2;
    const w = bw * 0.6;
    const top = y(v);
    const h = H - padB - top;
    const label = `${fmtDateShort(d)}: ${fmtHM(v * 60)}`;
    const r = Math.min(4, w / 2, h);
    const path = h > 0.5 ? `M${x} ${H - padB} L${x} ${top + r} Q${x} ${top} ${x + r} ${top} L${x + w - r} ${top} Q${x + w} ${top} ${x + w} ${top + r} L${x + w} ${H - padB} Z` : '';
    return `<g class="bar-g" data-tip="${esc(label)}">
      <rect x="${padL + i * bw}" y="${padT}" width="${bw}" height="${H - padT - padB}" fill="transparent"/>
      ${path ? `<path class="bar-rect ${i === 13 ? 'today' : ''}" d="${path}"><title>${esc(label)}</title></path>` : ''}
      ${i % 2 === 1 || i === 13 ? `<text x="${padL + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${i === 13 ? 'hoy' : d.getDate()}</text>` : ''}
    </g>`;
  }).join('');
  const grid = yTicks.map((v) => `<line class="axis" x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke-dasharray="${v ? '3 4' : ''}"/><text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end">${v}h</text>`).join('');
  const table = `<table class="sr-only"><caption>Horas por día, últimos 14 días</caption>${days.map((d, i) => `<tr><td>${fmtDateShort(d)}</td><td>${fmtHM(vals[i] * 60)}</td></tr>`).join('')}</table>`;
  return `<div class="chart-wrap"><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Horas estudiadas por día en los últimos 14 días">${grid}${bars}</svg>
    <div class="chart-tip muted small" aria-hidden="true">Pasá el mouse o tocá una barra para ver el detalle.</div>${table}</div>`;
}

function renderStudy() {
  const subs = Store.data.subjects;
  if (!subs.length) {
    $('#view').innerHTML = `<section class="page"><div class="page-head"><div><h1>Horas de estudio</h1></div></div>
      <div class="card empty">
      <h2>Primero creá una materia</h2><p>Así sabemos a qué le estás dedicando tiempo.</p>
      <a class="btn" href="#materias">Ir a Materias</a></div></section>`;
    Sloth.paint($('#view'));
    return;
  }
  const a = Store.data.activeSession;
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const weekStart = startOfWeek(now).getTime();
  const selected = (a && a.subjectId) || Store.data.lastStudySubject || subs[0].id;

  const sessions = Store.data.sessions
    .filter((se) => !studyFilter.subject || se.subjectId === studyFilter.subject)
    .sort((x, y) => y.start - x.start);
  const byDay = {};
  sessions.forEach((se) => { const k = toISODate(new Date(se.start)); (byDay[k] = byDay[k] || []).push(se); });
  const streak = streakDays();

  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head"><div><h1>Horas de estudio</h1><p class="sub">Dale a comenzar, estudiá, y al terminar se descuenta de las horas de la materia.</p></div></div>

      <div class="study-top">
        <div class="card study-timer ${a ? 'running' : ''}">
          
          <label class="field">¿Qué vas a estudiar?
            <select id="study-subj" ${a ? 'disabled' : ''}>${subjectOptions(selected)}</select>
          </label>
          <div id="study-clock" class="big-clock">${a ? fmtClock(Date.now() - a.start) : '00:00:00'}</div>
          <p class="muted">${a ? `Empezaste a las ${fmtTime(new Date(a.start))}. Aunque cierres la app, sigue contando.` : 'Lista cuando vos digas.'}</p>
          <button class="btn big ${a ? 'danger' : ''}" id="study-toggle">${a ? '■ Terminar' : '▶ Comenzar'}</button>
        </div>
        <div class="stats">
          <div class="card stat"><span>Hoy</span><strong>${fmtHM(studiedMinutes('', todayStart))}</strong></div>
          <div class="card stat"><span>Esta semana</span><strong>${fmtHM(studiedMinutes('', weekStart))}</strong></div>
          <div class="card stat"><span>Semestre</span><strong>${fmtHM(semesterMinutes())}</strong></div>
          <div class="card stat"><span>Racha</span><strong>${streak} ${streak === 1 ? 'día' : 'días'} ${streak >= 3 ? '' : ''}</strong></div>
        </div>
      </div>

      <div class="grid-2">
        ${block('estudio.14dias', 'Últimos 14 días', last14Chart())}
        ${block('estudio.semana', 'Esta semana por materia', `<div class="progress-list">
            ${subs.map((s) => {
              const p = subjectPace(s);
              const goal = p.perWeek;
              const pct = goal ? Math.min(100, (p.weekDone / goal) * 100) : 0;
              return `<div class="progress-item">
                <div class="pi-head"><a href="#materia/${s.id}"><span class="dot" style="--c:${s.color}"></span>${esc(s.name)}</a>
                  <span class="muted small">${fmtHM(p.weekDone)}${goal ? ` de ${fmtHM(goal)} necesarias` : ''}${p.behind ? ' · <strong style="color:var(--danger)">atrasada</strong>' : ''}</span></div>
                <div class="bar" style="--c:${s.color}"><span style="width:${goal ? pct : 0}%"></span></div>
              </div>`;
            }).join('')}
          </div>`)}
      </div>

      ${block('estudio.semestre', 'Horas del semestre por materia', `<div class="progress-list">
          ${subs.map((s) => {
            const p = subjectPace(s);
            return `<div class="progress-item">
              <div class="pi-head"><a href="#materia/${s.id}"><span class="dot" style="--c:${s.color}"></span>${esc(s.name)}</a>
                <span class="muted">${p.goal ? (p.left > 0 ? `quedan <strong>${fmtHM(p.left)}</strong>` : '¡meta cumplida! ') : 'sin créditos'}</span></div>
              ${hoursBar(s)}
            </div>`;
          }).join('')}
        </div>`)}

      ${block('estudio.registro', 'Registro', `${sessions.length ? Object.keys(byDay).map((k) => {
          const list = byDay[k];
          const total = list.reduce((acc, se) => acc + sessionMinutes(se), 0);
          const d = parseDate(k);
          return `<div class="log-day">
            <div class="log-day-head"><span>${fmtDateShort(d)}${d.getFullYear() !== now.getFullYear() ? ' ' + d.getFullYear() : ''}</span><span>${fmtHM(total)}</span></div>
            ${list.map((se) => `<div class="log-row">
              <span class="dot" style="--c:${subjectColor(se.subjectId)}"></span>
              <span class="log-subj">${esc(subjectName(se.subjectId))}</span>
              <span class="src">${SOURCE_LABEL[se.source] || SOURCE_LABEL.manual}</span>
              <span class="muted">${fmtTime(new Date(se.start))}–${fmtTime(new Date(se.end))}</span>
              <strong class="num">${fmtHM(sessionMinutes(se))}</strong>
              <span><button class="icon-btn sm" data-edses="${se.id}" aria-label="Editar registro">✎</button>
              <button class="icon-btn sm danger" data-rmses="${se.id}" aria-label="Borrar registro">✕</button></span>
            </div>`).join('')}
          </div>`;
        }).join('') : '<p class="muted">Todavía no hay registros. ¡El primer paso es el más lento!</p>'}`, { actions: `<select id="log-subj" aria-label="Filtrar por materia"><option value="">Todas las materias</option>${subjectOptions(studyFilter.subject)}</select>
            <button class="btn sm ghost" id="add-manual">+ Cargar a mano</button>` })}
      ${hiddenBar([['estudio.14dias', 'Últimos 14 días'], ['estudio.semana', 'Esta semana por materia'], ['estudio.semestre', 'Horas del semestre'], ['estudio.registro', 'Registro']])}
    </section>`;

  const v = $('#view');
  Sloth.paint(v);
  bindBlocks(v);
  const tip = $('.chart-tip', v);
  $$('.bar-g', v).forEach((g) => {
    const show = () => { tip.textContent = g.dataset.tip; tip.classList.remove('muted'); };
    g.addEventListener('mouseenter', show);
    g.addEventListener('click', show);
  });
  $('#study-toggle').onclick = () => {
    if (Store.data.activeSession) stopStudy();
    else startStudy($('#study-subj').value);
    renderStudy();
  };
  on(v, '#log-subj', 'onchange', (e) => { studyFilter.subject = e.target.value; renderStudy(); });
  on(v, '#add-manual', 'onclick', () => openSessionForm());
  $$('[data-edses]', v).forEach((b) => (b.onclick = () => openSessionForm(Store.data.sessions.find((se) => se.id === b.dataset.edses))));
  $$('[data-rmses]', v).forEach((b) => (b.onclick = () => {
    if (!confirm('¿Borrar este registro? Las horas vuelven a sumarse a lo que falta.')) return;
    Store.data.sessions = Store.data.sessions.filter((se) => se.id !== b.dataset.rmses);
    Store.save();
    renderStudy();
  }));
}

function openSessionForm(se) {
  const isNew = !se;
  const now = new Date();
  const start = se ? new Date(se.start) : new Date(now.getTime() - 3600000);
  const end = se ? new Date(se.end) : now;
  Modal.open(isNew ? 'Cargar horas a mano' : 'Editar registro', `
    <form class="form" id="ses-form">
      <label>Materia<select name="subjectId">${subjectOptions(se ? se.subjectId : Store.data.lastStudySubject)}</select></label>
      <label>Fecha<input type="date" name="date" required value="${toISODate(start)}" max="${toISODate(now)}"></label>
      <div class="row">
        <label>Desde<input type="time" name="start" required value="${fmtTime(start)}"></label>
        <label>Hasta<input type="time" name="end" required value="${fmtTime(end)}"></label>
      </div>
      ${se ? `<p class="hint">Origen: ${SOURCE_LABEL[se.source] || SOURCE_LABEL.manual}</p>` : ''}
      <div class="form-actions"><span class="grow"></span>
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button class="btn">Guardar</button></div>
    </form>`, (body) => {
    const f = $('#ses-form', body);
    const el = f.elements;
    f.onsubmit = (e) => {
      e.preventDefault();
      const day = parseDate(el.date.value).getTime();
      let s0 = day + toMin(el.start.value) * 60000;
      let e0 = day + toMin(el.end.value) * 60000;
      if (e0 <= s0) e0 += DAY_MS; // pasó la medianoche
      if (e0 - s0 > 16 * 36e5) { toast('Eso es más de 16 horas seguidas, revisá las horas.'); return; }
      if (isNew) {
        addSession(el.subjectId.value, s0, e0, 'manual');
        toast(`Registré ${fmtHM((e0 - s0) / 60000)} `);
      } else {
        Object.assign(se, { subjectId: el.subjectId.value, start: s0, end: e0 });
        Store.save();
        toast('Registro actualizado');
      }
      Modal.close();
      rerender();
    };
  });
}
