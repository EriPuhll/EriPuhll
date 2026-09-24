'use strict';

/* ---------- Horas de estudio ---------- */

const studyFilter = { subject: '' };

function startStudy(subjectId) {
  if (!subjectId) { toast('Elegí qué materia vas a estudiar.'); return false; }
  Store.data.activeSession = { subjectId, start: Date.now() };
  Store.data.lastStudySubject = subjectId;
  Store.save();
  toast(`¡A estudiar ${subjectName(subjectId)}! 📚`);
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
  Store.data.sessions.push({ id: uid(), subjectId: a.subjectId, start: a.start, end, source: 'manual' });
  Store.save();
  const s = subjectById(a.subjectId);
  const left = s ? goalMinutes(s) - studiedMinutes(s.id) : 0;
  toast(`Registré ${fmtHM((end - a.start) / 60000)} de ${subjectName(a.subjectId)}${s && goalMinutes(s) ? ` · quedan ${fmtHM(Math.max(0, left))}` : ''}`);
  if (Store.data.settings.slothEnabled) Sloth.show('¡Bien ahí! Cada minuto cuenta. 🌿', 5000);
}

function renderStudy() {
  const subs = Store.data.subjects;
  if (!subs.length) {
    $('#view').innerHTML = `<section class="page"><div class="page-head"><div><h1>Horas de estudio</h1></div></div>
      <div class="card empty"><span class="empty-sloth big" data-sloth="face"></span>
      <h2>Primero creá una materia</h2><p>Así sabemos a qué le estás dedicando tiempo.</p>
      <a class="btn" href="#materias">Ir a Materias</a></div></section>`;
    Sloth.paint($('#view'));
    return;
  }
  const a = Store.data.activeSession;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = startOfWeek(now).getTime();
  const sum = (from) => Store.data.sessions.filter((se) => se.start >= from).reduce((acc, se) => acc + sessionMinutes(se), 0);
  const selected = (a && a.subjectId) || Store.data.lastStudySubject || subs[0].id;

  // Registro agrupado por día
  const sessions = Store.data.sessions
    .filter((se) => !studyFilter.subject || se.subjectId === studyFilter.subject)
    .sort((x, y) => y.start - x.start);
  const byDay = {};
  sessions.forEach((se) => { const k = toISODate(new Date(se.start)); (byDay[k] = byDay[k] || []).push(se); });

  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head"><div><h1>Horas de estudio</h1><p class="sub">Dale a comenzar, estudiá, y al terminar se descuenta de las horas de la materia.</p></div></div>

      <div class="study-top">
        <div class="card study-timer ${a ? 'running' : ''}">
          <span class="timer-sloth" data-sloth="face"></span>
          <label>¿Qué vas a estudiar?
            <select id="study-subj" ${a ? 'disabled' : ''}>${subjectOptions(selected)}</select>
          </label>
          <div id="study-clock" class="big-clock">${a ? fmtClock(Date.now() - a.start) : '00:00:00'}</div>
          <p class="muted">${a ? `Empezaste a las ${fmtTime(new Date(a.start))}` : 'Listo cuando vos digas.'}</p>
          <button class="btn big ${a ? 'danger' : ''}" id="study-toggle">${a ? '■ Terminar' : '▶ Comenzar'}</button>
        </div>
        <div class="stats">
          <div class="card stat"><span>Hoy</span><strong>${fmtHM(sum(todayStart))}</strong></div>
          <div class="card stat"><span>Esta semana</span><strong>${fmtHM(sum(weekStart))}</strong></div>
          <div class="card stat"><span>En total</span><strong>${fmtHM(sum(0))}</strong></div>
        </div>
      </div>

      <section class="card">
        <h2>Horas por materia</h2>
        <div class="progress-list">
          ${subs.map((s) => {
            const goal = goalMinutes(s), done = studiedMinutes(s.id), left = goal - done;
            return `<div class="progress-item">
              <div class="pi-head"><a href="#materia/${s.id}"><span class="dot" style="--c:${s.color}"></span>${esc(s.name)}</a>
                <span class="muted">${goal ? (left > 0 ? `quedan <strong>${fmtHM(left)}</strong>` : '¡meta cumplida! 🎉') : 'sin créditos'}</span></div>
              ${hoursBar(s)}
            </div>`;
          }).join('')}
        </div>
      </section>

      <section class="card">
        <div class="list-head">
          <h2>Registro</h2>
          <div class="filters">
            <select id="log-subj" aria-label="Filtrar por materia"><option value="">Todas las materias</option>${subjectOptions(studyFilter.subject)}</select>
            <button class="btn sm ghost" id="add-manual">+ Registrar a mano</button>
          </div>
        </div>
        ${sessions.length ? Object.keys(byDay).map((k) => {
          const list = byDay[k];
          const total = list.reduce((acc, se) => acc + sessionMinutes(se), 0);
          return `<div class="log-day">
            <div class="log-day-head"><strong>${fmtDateShort(parseDate(k))} ${parseDate(k).getFullYear() !== now.getFullYear() ? parseDate(k).getFullYear() : ''}</strong><span>${fmtHM(total)}</span></div>
            ${list.map((se) => `<div class="log-row">
              <span class="dot" style="--c:${subjectColor(se.subjectId)}"></span>
              <span class="log-subj">${esc(subjectName(se.subjectId))}</span>
              <span class="muted">${se.source === 'pomodoro' ? '🍅 ' : ''}${fmtTime(new Date(se.start))}–${fmtTime(new Date(se.end))}</span>
              <strong>${fmtHM(sessionMinutes(se))}</strong>
              <button class="icon-btn sm danger" data-rmses="${se.id}" title="Borrar registro" aria-label="Borrar registro">✕</button>
            </div>`).join('')}
          </div>`;
        }).join('') : '<p class="muted">Todavía no hay registros. ¡El primer paso es el más lento! 🦥</p>'}
      </section>
    </section>`;

  const v = $('#view');
  Sloth.paint(v);
  $('#study-toggle').onclick = () => {
    if (Store.data.activeSession) stopStudy();
    else startStudy($('#study-subj').value);
    renderStudy();
  };
  $('#log-subj').onchange = (e) => { studyFilter.subject = e.target.value; renderStudy(); };
  $('#add-manual').onclick = openManualSession;
  $$('[data-rmses]', v).forEach((b) => (b.onclick = () => {
    if (!confirm('¿Borrar este registro? Las horas vuelven a sumarse a lo que falta.')) return;
    Store.data.sessions = Store.data.sessions.filter((se) => se.id !== b.dataset.rmses);
    Store.save();
    renderStudy();
  }));
}

function openManualSession() {
  const now = new Date();
  Modal.open('Registrar horas a mano', `
    <form class="form" id="man-form">
      <label>Materia<select name="subjectId">${subjectOptions(Store.data.lastStudySubject)}</select></label>
      <label>Fecha<input type="date" name="date" required value="${toISODate(now)}" max="${toISODate(now)}"></label>
      <div class="row">
        <label>Desde<input type="time" name="start" required value="${pad(Math.max(0, now.getHours() - 1))}:00"></label>
        <label>Hasta<input type="time" name="end" required value="${pad(now.getHours())}:00"></label>
      </div>
      <div class="form-actions"><span class="grow"></span>
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button class="btn">Guardar</button></div>
    </form>`, (body) => {
    const f = $('#man-form', body);
    const el = f.elements;
    f.onsubmit = (e) => {
      e.preventDefault();
      const day = parseDate(el.date.value).getTime();
      const start = day + toMin(el.start.value) * 60000;
      const end = day + toMin(el.end.value) * 60000;
      if (end <= start) { toast('La hora de fin tiene que ser después del inicio.'); return; }
      Store.data.sessions.push({ id: uid(), subjectId: el.subjectId.value, start, end, source: 'manual' });
      Store.save();
      Modal.close();
      toast(`Registré ${fmtHM((end - start) / 60000)} 📚`);
      renderStudy();
    };
  });
}
