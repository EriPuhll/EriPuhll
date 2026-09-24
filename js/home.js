'use strict';

/* ---------- Inicio: resumen del día ---------- */

function greetingWord() {
  const h = new Date().getHours();
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

function homeAlerts() {
  const out = [];
  const now = new Date();
  const maxRem = Math.max(0, ...(Store.data.settings.reminderDays || [0]));
  Store.data.events.filter((e) => { const d = daysUntil(e.date, now); return d >= 0 && d <= maxRem; }).sort(byEventDate).forEach((e) => {
    const d = daysUntil(e.date, now);
    const when = d === 0 ? '¡hoy!' : d === 1 ? 'mañana' : `en ${d} días`;
    out.push({ cls: d <= 2 ? 'warn' : '', icon: eventType(e).icon, html: `<strong>${esc(typeLabel(e))}</strong> de ${esc(subjectName(e.subjectId))} ${when}.` });
  });
  Store.data.subjects.forEach((s) => {
    const p = subjectPace(s);
    if (p.behind) out.push({ cls: 'warn', icon: '🐢', html: `<a href="#materia/${s.id}">${esc(s.name)}</a> va atrasada: necesitás <strong>${fmtHM(p.perWeek)}</strong> por semana.` });
    if (s.maxAbsences != null && s.absences >= s.maxAbsences - 1) out.push({ cls: 'warn', icon: '🙋', html: `<a href="#materia/${s.id}">${esc(s.name)}</a>: ${s.absences} de ${s.maxAbsences} faltas.` });
    const pend = s.pendingNotes.filter((n) => !n.done).length;
    if (pend) out.push({ cls: '', icon: '📝', html: `<a href="#materia/${s.id}">${esc(s.name)}</a>: ${pend} ${pend === 1 ? 'apunte pendiente' : 'apuntes pendientes'}.` });
  });
  const crit = criticalWeeks();
  Object.keys(crit).filter((k) => { const d = parseDate(k); const end = new Date(d); end.setDate(end.getDate() + 7); return end > now && d - now < 28 * DAY_MS; })
    .forEach((k) => out.push({ cls: 'warn', icon: '🔥', html: `Semana crítica del <strong>${fmtDateShort(parseDate(k))}</strong>: ${crit[k]} pruebas juntas.` }));
  return out;
}

function renderHome() {
  const st = Store.data.settings;
  const now = new Date();
  const todayIdx = ((now.getDay() + 6) % 7) + 1;
  const classes = Store.data.classes.filter((c) => +c.day === todayIdx).sort((a, b) => toMin(a.start) - toMin(b.start));
  const upcoming = Store.data.events.filter((e) => eventDate(e) >= now || daysUntil(e.date) === 0).sort(byEventDate).slice(0, 5);
  const alerts = homeAlerts();
  const a = Store.data.activeSession;
  const seedMissing = !st.seedDismissed && !Store.data.subjects.some((s) => s.name === 'Física');

  $('#view').innerHTML = `
    <section class="page">
      ${st.seedNotice ? `<div class="card notice"><span>🦥 Precargué tus materias, exámenes y proyectos del 2º semestre 2026. Podés editarlos o borrarlos cuando quieras. Los créditos, profes y horarios quedaron para completar.</span><button class="btn sm" id="seed-ok">Entendido</button></div>` : ''}
      ${seedMissing ? `<div class="card notice"><span>¿Cargo tus materias del 2º semestre (Física, Análisis II, Circuitos, Base de Datos, Lab TIC), los exámenes y los proyectos?</span><span class="btn-row"><button class="btn sm" id="seed-yes">Sí, cargarlas</button><button class="btn ghost sm" id="seed-no">No, gracias</button></span></div>` : ''}

      <div class="card hero">
        <button class="hero-sloth" data-sloth="full" id="hero-sloth" aria-label="Tocá al perezoso para que hable"></button>
        <div>
          <h1>${greetingWord()}, ${esc(st.userName || '')} 👋</h1>
          <p class="muted" style="margin-bottom:.8rem">${fmtDateLong(now)}</p>
          <div class="speech" id="hero-speech">${esc(Sloth.daysSinceStudy() >= 3 ? phrase('dormido', { dias: Sloth.daysSinceStudy() }) : phrase('saludo'))}</div>
          ${a ? `<p style="margin-top:.8rem"><a class="btn sm" href="#estudio">⏱ Estás estudiando ${esc(subjectName(a.subjectId))}</a></p>` : ''}
        </div>
      </div>

      ${alerts.length ? `<section class="card"><h2>🔔 Para tener en cuenta</h2><div class="alert-list">${alerts.map((x) => `<div class="alert ${x.cls}"><span>${x.icon}</span><span>${x.html}</span></div>`).join('')}</div></section>` : ''}

      <div class="grid-2">
        <section class="card">
          <div class="list-head"><h2>📝 Próximas pruebas</h2><a class="btn ghost sm" href="#calendario">Ver calendario</a></div>
          <div id="home-events" class="ev-list"></div>
        </section>
        <section class="card">
          <div class="list-head"><h2>🏫 Clases de hoy</h2></div>
          ${classes.length ? `<ul class="plain">${classes.map((c) => `<li class="pill" style="--c:${subjectColor(c.subjectId)}">${c.start}–${c.end} · <strong>${esc(subjectName(c.subjectId))}</strong>${c.room ? ' · ' + esc(c.room) : ''}</li>`).join('')}</ul>` : '<p class="muted">Hoy no tenés clases. 🌿</p>'}
          <h2 style="margin-top:1.2rem">⏱ Esta semana</h2>
          <div class="progress-list" style="margin-top:.6rem">
            ${Store.data.subjects.map((s) => {
              const p = subjectPace(s);
              const pct = p.perWeek ? Math.min(100, (p.weekDone / p.perWeek) * 100) : 0;
              return `<div><div class="pi-head"><a href="#materia/${s.id}"><span class="dot" style="--c:${s.color}"></span>${esc(s.name)}</a>
                <span class="muted small">${fmtHM(p.weekDone)}${p.perWeek ? ` / ${fmtHM(p.perWeek)}` : ''} ${p.perWeek && p.weekDone >= p.perWeek ? '✓' : ''}</span></div>
                <div class="bar" style="--c:${s.color}"><span style="width:${pct}%"></span></div></div>`;
            }).join('') || '<p class="muted">Todavía no hay materias.</p>'}
          </div>
          <p class="hint" style="margin-top:.6rem">Comparado con el ritmo que necesitás para llegar a las horas de cada materia antes del ${fmtDateShort(semesterBounds().end)}.</p>
        </section>
      </div>
    </section>`;

  const v = $('#view');
  Sloth.paint(v);
  renderEventList($('#home-events', v), upcoming, 'Nada a la vista. Disfrutá. 🌿');
  $('#hero-sloth').onclick = () => { $('#hero-speech').textContent = Sloth.contextPhrase(); };
  const ok = $('#seed-ok'); if (ok) ok.onclick = () => { st.seedNotice = false; Store.save(); renderHome(); };
  const yes = $('#seed-yes'); if (yes) yes.onclick = () => { seedInitialData(Store.data, { onlyMissing: true }); st.seedDismissed = true; st.seedNotice = true; Store.save(); renderHome(); };
  const no = $('#seed-no'); if (no) no.onclick = () => { st.seedDismissed = true; Store.save(); renderHome(); };
}
