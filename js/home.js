'use strict';

/* ---------- Inicio: resumen del día ---------- */

function greetingWord() {
  const h = new Date().getHours();
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

// Frases del día: datos curiosos sobre estudiar y sobre perezosos
const DAILY_FACTS = [
  'Estudiar en sesiones cortas repartidas en varios días hace que te acuerdes más que estudiar todo junto la noche anterior. Se llama efecto de espaciado.',
  'Intentar recordar algo sin mirar (hacerte preguntas a vos misma) fija más la memoria que releer los apuntes.',
  'La técnica Pomodoro la inventó Francesco Cirillo a fines de los 80, con un reloj de cocina con forma de tomate.',
  'Mientras dormís, el cerebro repasa y ordena lo que aprendiste en el día. Dormir bien también es estudiar.',
  'Los perezosos bajan del árbol más o menos una vez por semana, y es solo para ir al baño.',
  'En el pelo de los perezosos crecen algas: por eso a veces se ven verdosos, y les sirve de camuflaje.',
  'Explicarle un tema a otra persona es una de las mejores formas de descubrir qué parte todavía no entendiste.',
  'Mezclar distintos tipos de ejercicios en una misma sesión ayuda a reconocer qué método usar en el examen.',
  'Los perezosos pueden aguantar la respiración hasta unos 40 minutos, y nadan mejor de lo que caminan.',
  'Hacer una pausa corta cada tanto ayuda a sostener la concentración por más tiempo.',
  'Resumir con tus propias palabras sirve más que copiar el texto tal cual.',
  'Un perezoso se mueve a unos 0,24 km por hora. Lento, pero llega.',
  'Los perezosos en la naturaleza duermen unas 9 o 10 horas; la fama de dormir 20 viene de los que viven en zoológicos.',
  'Hacer ejercicios de exámenes anteriores con el tiempo real de la prueba te prepara mejor que solo leer las soluciones.',
  'Estudiar sin el celular cerca (no solo en silencio, sino en otra habitación) ayuda a concentrarte más.',
];
function dailyFact(now = new Date()) {
  const day = Math.floor((startOfDay(now) - new Date(now.getFullYear(), 0, 0)) / DAY_MS);
  return DAILY_FACTS[day % DAILY_FACTS.length];
}

function homeAlerts() {
  const out = [];
  const now = new Date();
  const maxRem = Math.max(0, ...(Store.data.settings.reminderDays || [0]));
  Store.data.events.filter((e) => { const d = daysUntil(e.date, now); return !e.done && d >= 0 && d <= maxRem; }).sort(byEventDate).forEach((e) => {
    const d = daysUntil(e.date, now);
    const when = d === 0 ? '¡hoy!' : d === 1 ? 'mañana' : `en ${d} días`;
    out.push({ cls: d <= 2 ? 'warn' : '', icon: eventType(e).icon, html: `<strong>${esc(typeLabel(e))}</strong> de ${esc(subjectName(e.subjectId))} ${when}.` });
  });
  Store.data.subjects.forEach((s) => {
    const p = subjectPace(s);
    if (p.behind) out.push({ cls: 'warn', icon: '', html: `<a href="#materia/${s.id}">${esc(s.name)}</a> va atrasada: necesitás <strong>${fmtHM(p.perWeek)}</strong> por semana.` });
    if (s.maxAbsences != null && s.absences >= s.maxAbsences - 1) out.push({ cls: 'warn', icon: '', html: `<a href="#materia/${s.id}">${esc(s.name)}</a>: ${s.absences} de ${s.maxAbsences} faltas.` });
    const pend = s.pendingNotes.filter((n) => !n.done).length;
    if (pend) out.push({ cls: '', icon: '', html: `<a href="#materia/${s.id}">${esc(s.name)}</a>: ${pend} ${pend === 1 ? 'apunte pendiente' : 'apuntes pendientes'}.` });
  });
  const crit = criticalWeeks();
  Object.keys(crit).filter((k) => { const d = parseDate(k); const end = new Date(d); end.setDate(end.getDate() + 7); return end > now && d - now < 28 * DAY_MS; })
    .forEach((k) => out.push({ cls: 'warn', icon: '', html: `Semana crítica del <strong>${fmtDateShort(parseDate(k))}</strong>: ${crit[k]} pruebas juntas.` }));
  return out;
}

function renderHome() {
  const st = Store.data.settings;
  const now = new Date();
  const todayIdx = ((now.getDay() + 6) % 7) + 1;
  const classes = activeClasses().filter((c) => +c.day === todayIdx).sort((a, b) => toMin(a.start) - toMin(b.start));
  const upcoming = Store.data.events.filter((e) => !e.done && (eventDate(e) >= now || daysUntil(e.date) === 0)).sort(byEventDate).slice(0, 5);
  const alerts = homeAlerts();
  const a = Store.data.activeSession;
  const seedMissing = !st.seedDismissed && !Store.data.subjects.some((s) => s.name === 'Física');

  $('#view').innerHTML = `
    <section class="page">
      ${st.seedNotice ? `<div class="card notice"><span>Precargué tus materias, exámenes y proyectos del 2º semestre 2026. Podés editarlos o borrarlos cuando quieras. Los créditos, profes y horarios quedaron para completar.</span><button class="btn sm" id="seed-ok">Entendido</button></div>` : ''}
      ${seedMissing ? `<div class="card notice"><span>¿Cargo tus materias del 2º semestre (Física, Análisis II, Circuitos, Base de Datos, Lab TIC), los exámenes y los proyectos?</span><span class="btn-row"><button class="btn sm" id="seed-yes">Sí, cargarlas</button><button class="btn ghost sm" id="seed-no">No, gracias</button></span></div>` : ''}

      <div class="card hero">
        <h1>${greetingWord()}, ${esc(st.userName || '')}</h1>
        <p class="muted">${fmtDateLong(now)}</p>
        <p class="day-fact"><span class="muted small">¿Sabías que…?</span>${esc(dailyFact(now))}</p>
        ${a ? `<p style="margin-top:.6rem"><a class="btn sm" href="#estudio">Estás estudiando ${esc(subjectName(a.subjectId))}</a></p>` : ''}
      </div>

      ${alerts.length ? block('inicio.alertas', 'Para tener en cuenta', `<div class="alert-list">${alerts.map((x) => `<div class="alert ${x.cls}"><span>${x.html}</span></div>`).join('')}</div>`) : ''}

      <div class="grid-2">
        ${block('inicio.pruebas', 'Próximas pruebas', '<div id="home-events" class="ev-list"></div>', { actions: '<a class="btn ghost sm" href="#calendario">Ver calendario</a>' })}
        <div class="page" style="gap:1rem">
          ${block('inicio.clases', 'Clases de hoy', classes.length ? `<ul class="plain">${classes.map((c) => `<li class="pill" style="--c:${subjectColor(c.subjectId)}">${c.start}–${c.end} · <strong>${esc(subjectName(c.subjectId))}</strong>${c.room ? ' · ' + esc(c.room) : ''}</li>`).join('')}</ul>` : '<p class="muted">Hoy no tenés clases.</p>')}
          ${block('inicio.semana', 'Esta semana', `${(() => {
            const w = weekSummary();
            return w.target ? `<div class="week-total"><span class="big-stat">${w.pct}%</span><span>Llevás <strong>${fmtHM(w.done)}</strong> de <strong>${fmtHM(w.target)}</strong> que deberías estudiar esta semana.</span></div>
              <div class="bar big"><span style="width:${Math.min(100, w.pct)}%"></span></div>` : `<p class="muted">Llevás <strong>${fmtHM(w.done)}</strong> esta semana. Cargá los créditos de las materias para ver cuánto te toca.</p>`;
          })()}
          <div class="progress-list" style="margin-top:.9rem">
            ${Store.data.subjects.map((s) => {
              const p = subjectPace(s);
              const pct = p.perWeek ? Math.min(100, (p.weekDone / p.perWeek) * 100) : 0;
              return `<div><div class="pi-head"><a href="#materia/${s.id}"><span class="dot" style="--c:${s.color}"></span>${esc(s.name)}</a>
                <span class="muted small">${fmtHM(p.weekDone)}${p.perWeek ? ` / ${fmtHM(p.perWeek)}` : ''} ${p.perWeek && p.weekDone >= p.perWeek ? '✓' : ''}</span></div>
                <div class="bar" style="--c:${s.color}"><span style="width:${pct}%"></span></div></div>`;
            }).join('') || '<p class="muted">Todavía no hay materias.</p>'}
          </div>
          <p class="hint" style="margin-top:.6rem">La meta de cada semana reparte las horas de la materia entre sus semanas de cursado, y suma lo que quedó pendiente de semanas anteriores.</p>`)}
        </div>
      </div>
      ${hiddenBar([['inicio.alertas', 'Para tener en cuenta'], ['inicio.pruebas', 'Próximas pruebas'], ['inicio.clases', 'Clases de hoy'], ['inicio.semana', 'Esta semana']])}
    </section>`;

  const v = $('#view');
  Sloth.paint(v);
  bindBlocks(v);
  const evBox = $('#home-events', v);
  if (evBox) renderEventList(evBox, upcoming, 'Nada a la vista. Disfrutá.');
  const ok = $('#seed-ok'); if (ok) ok.onclick = () => { st.seedNotice = false; Store.save(); renderHome(); };
  const yes = $('#seed-yes'); if (yes) yes.onclick = () => { seedInitialData(Store.data, { onlyMissing: true }); st.seedDismissed = true; st.seedNotice = true; Store.save(); renderHome(); };
  const no = $('#seed-no'); if (no) no.onclick = () => { st.seedDismissed = true; Store.save(); renderHome(); };
}
