'use strict';

/* ---------- Materias ---------- */

const SUBJECT_TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'practicos', label: 'Tareas a realizar' },
  { id: 'notas', label: 'Notas' },
  { id: 'apariencia', label: 'Apariencia' },
];
const practicoUI = { onlyPrio: false, mode: 'estado' };

function hoursBar(s, { mark = true } = {}) {
  const p = subjectPace(s);
  const pct = p.goal ? Math.min(100, (p.done / p.goal) * 100) : 0;
  const expPct = p.goal ? Math.min(100, (p.expected / p.goal) * 100) : 0;
  return `<div class="bar" style="--c:${s.color}"><span style="width:${pct}%"></span>${mark && p.goal ? `<i class="mark" style="left:${expPct}%" title="Donde deberías estar hoy"></i>` : ''}</div>
    <div class="bar-legend">${p.goal ? `${fmtHM(p.done)} de ${fmtHM(p.goal)}` : 'Sin créditos cargados'}</div>`;
}

function renderSubjects() {
  const subs = Store.data.subjects;
  const groups = {};
  subs.forEach((s) => { const k = `${s.year}|${s.semester}`; (groups[k] = groups[k] || []).push(s); });
  const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const now = new Date();

  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head">
        <div><h1>Materias</h1><p class="sub">Tu info, tus documentos y tus horas, todo por materia.</p></div>
        <button class="btn" id="add-subj">+ Nueva materia</button>
      </div>
      ${subs.length ? keys.map((k) => {
        const [y, sem] = k.split('|');
        return `<h2 class="group-title">${semLabel(sem)} · ${y}</h2>
          <div class="subj-cards">${groups[k].map((s) => {
            const next = Store.data.events.filter((e) => e.subjectId === s.id && eventDate(e) >= now).sort(byEventDate)[0];
            const p = subjectPace(s);
            return `<a class="card subj-card" href="#materia/${s.id}" style="--c:${s.color}">
              <div class="subj-card-top"><h3>${esc(s.name)}</h3><span class="badge">${Number(s.credits) || 0} cr.</span></div>
              <div class="chip-row">${s.tag ? `<span class="badge tag">${esc(s.tag)}</span>` : ''}${p.behind ? '<span class="badge warn">Atrasada</span>' : ''}</div>
              ${hoursBar(s)}
              <p class="next">${next ? `${esc(typeLabel(next))} · <span class="num" data-countdown="${eventDate(next).getTime()}">${countdown(eventDate(next)).text}</span>` : '<span class="muted">Sin pruebas próximas</span>'}</p>
            </a>`;
          }).join('')}</div>`;
      }).join('') : `
        <div class="card empty">
          
          <h2>Todavía no hay materias</h2>
          <p>Creá tu primera materia, o cargá las del semestre.</p>
          <div class="btn-row"><button class="btn" id="add-subj-2">+ Crear materia</button>
          <button class="btn ghost" id="seed">Cargar mis materias del 2º semestre</button></div>
        </div>`}
    </section>`;
  Sloth.paint($('#view'));
  $('#add-subj').onclick = () => openSubjectForm();
  const b2 = $('#add-subj-2'); if (b2) b2.onclick = () => openSubjectForm();
  const seed = $('#seed'); if (seed) seed.onclick = () => { seedInitialData(Store.data, { onlyMissing: true }); Store.save(); toast('Listo, cargué tus materias '); rerender(); };
}

function professorRow(p = { name: '', emails: [] }) {
  return `<div class="row prof-row">
    <label>Nombre<input data-pname value="${esc(p.name)}" placeholder="Ej: Dra. Ana Pérez"></label>
    <label>Mails<input data-pmails value="${esc((p.emails || []).join(', '))}" placeholder="ana@um.edu.uy, otro@gmail.com"></label>
  </div>`;
}

function openSubjectForm(s) {
  const isNew = !s;
  const data = s ? JSON.parse(JSON.stringify(s)) : newSubject();
  const y = new Date().getFullYear();
  Modal.open(isNew ? 'Nueva materia' : 'Editar materia', `
    <form class="form" id="subj-form">
      <label>Nombre de la materia<input name="name" required value="${esc(data.name)}" placeholder="Ej: Física"></label>
      <div class="row-3">
        <label>Semestre<select name="semester">
          <option value="1" ${data.semester === '1' ? 'selected' : ''}>1er semestre</option>
          <option value="2" ${data.semester === '2' ? 'selected' : ''}>2do semestre</option>
          <option value="anual" ${data.semester === 'anual' ? 'selected' : ''}>Anual</option>
        </select></label>
        <label>Año<input type="number" name="year" min="2000" max="2100" value="${data.year || y}" required></label>
        <label>Etiqueta <span class="opt">(opcional)</span><input name="tag" value="${esc(data.tag)}" placeholder="Ej: Recursando"></label>
      </div>
      <fieldset><legend>Profesores</legend>
        <p class="hint">Si tiene más de un mail, separalos con coma.</p>
        <div id="profs">${(data.professors.length ? data.professors : [{ name: '', emails: [] }]).map(professorRow).join('')}</div>
        <button type="button" class="btn ghost sm" id="add-prof">+ Otro profesor</button>
      </fieldset>
      <div class="row">
        <label>Inicio de clases<input type="date" name="courseStart" value="${data.courseStart || Store.data.settings.semesterStart}"></label>
        <label>Fin de clases<input type="date" name="courseEnd" value="${data.courseEnd || Store.data.settings.semesterEnd}"></label>
      </div>
      <label>Bibliografía principal <span class="opt">(opcional)</span><input name="bibliography" value="${esc(data.bibliography)}" placeholder="Ej: Serway, vol. 2"></label>
      <div class="row">
        <label>Créditos<input type="number" name="credits" min="0" step="0.5" value="${data.credits || 0}"></label>
        <label>Color de la materia<input type="color" name="color" value="${data.color}"></label>
      </div>
      <p class="hint">1 crédito = ${hoursPerCredit()} horas de esfuerzo en el semestre → <strong id="hours-preview">${(Number(data.credits) || 0) * hoursPerCredit()} h</strong> (se cambia en Ajustes).</p>
      <div class="form-actions"><span class="grow"></span>
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button class="btn">${isNew ? 'Crear materia' : 'Guardar'}</button></div>
    </form>`, (body) => {
    const f = $('#subj-form', body);
    const el = f.elements;
    el.credits.oninput = () => { $('#hours-preview', f).textContent = `${(Number(el.credits.value) || 0) * hoursPerCredit()} h`; };
    $('#add-prof', f).onclick = () => $('#profs', f).insertAdjacentHTML('beforeend', professorRow());
    f.onsubmit = (e) => {
      e.preventDefault();
      const professors = [];
      for (const row of $$('.prof-row', f)) {
        const name = $('[data-pname]', row).value.trim();
        const emails = $('[data-pmails]', row).value.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
        const bad = emails.find((m) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m));
        if (bad) { toast(`“${bad}” no parece un mail válido.`); return; }
        if (name || emails.length) professors.push({ name, emails });
      }
      Object.assign(data, {
        name: el.name.value.trim(), semester: el.semester.value, year: +el.year.value, tag: el.tag.value.trim(),
        professors, bibliography: el.bibliography.value.trim(), courseStart: el.courseStart.value, courseEnd: el.courseEnd.value, credits: Number(el.credits.value) || 0, color: el.color.value,
      });
      if (isNew) Store.data.subjects.push(data);
      else Object.assign(s, data);
      Store.save();
      Modal.close();
      if (isNew) { toast('¡Materia creada! '); location.hash = `#materia/${data.id}`; }
      else { toast('Materia actualizada'); rerender(); }
    };
  });
}

async function deleteSubject(s) {
  if (!confirm(`¿Eliminar “${s.name}”? Se borran también sus eventos, clases, horas registradas, tareas, notas y documentos.`)) return;
  const d = Store.data;
  d.subjects = d.subjects.filter((x) => x.id !== s.id);
  d.events = d.events.filter((x) => x.subjectId !== s.id);
  d.classes = d.classes.filter((x) => x.subjectId !== s.id);
  d.sessions = d.sessions.filter((x) => x.subjectId !== s.id);
  d.simulacros = d.simulacros.filter((x) => x.subjectId !== s.id);
  d.projects.forEach((p) => { if (p.subjectId === s.id) p.subjectId = ''; });
  if (d.activeSession && d.activeSession.subjectId === s.id) d.activeSession = null;
  if (d.pomodoro.subjectId === s.id) d.pomodoro.subjectId = '';
  Store.save();
  for (const doc of s.docs) if (doc.kind === 'file') await Files.del(doc.id);
  if (s.theme && s.theme.bgImageId) await Files.del(s.theme.bgImageId);
  toast('Materia eliminada');
  location.hash = '#materias';
}

/* ===== Página de una materia ===== */

function renderSubject(id, tab = 'resumen') {
  const s = subjectById(id);
  if (!s) { location.hash = '#materias'; return; }
  const tabs = SUBJECT_TABS.filter((t) => t.id === 'resumen' || !(Store.data.settings.subjectTabsHidden || []).includes(t.id));
  if (!tabs.some((t) => t.id === tab)) tab = 'resumen';
  applyTheme(subjectTheme(s));

  $('#view').innerHTML = `
    <section class="page subject-page" style="--c:${s.color}">
      <a href="#materias" class="back">← Materias</a>
      <header class="card subj-hero">
        <div>
          <div class="chip-row"><span class="badge">${semLabel(s.semester)} · ${s.year}</span>${s.tag ? `<span class="badge tag">${esc(s.tag)}</span>` : ''}</div>
          <h1>${esc(s.name)}</h1>
          <p class="muted">${s.credits ? `${s.credits} créditos` : 'Sin créditos cargados'}${s.professors.length ? ' · ' + esc(s.professors.map((p) => p.name).filter(Boolean).join(', ')) : ''}</p>
        </div>
        <div class="hero-actions">
          <button class="btn ghost" id="s-edit">✎ Editar</button>
          <button class="icon-btn danger" id="s-del" title="Eliminar materia" aria-label="Eliminar materia"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button>
        </div>
      </header>
      <div class="tabs-scroll"><nav class="tabs-row" aria-label="Secciones de la materia">
        ${tabs.map((t) => `<a href="#materia/${s.id}/${t.id}" class="${t.id === tab ? 'on' : ''}">${t.label}</a>`).join('')}
      </nav></div>
      <div id="subj-tab"></div>
    </section>`;
  $('#s-edit').onclick = () => openSubjectForm(s);
  $('#s-del').onclick = () => deleteSubject(s);
  const box = $('#subj-tab');
  ({ resumen: tabResumen, documentos: tabDocumentos, practicos: tabPracticos, notas: tabNotas, apariencia: tabApariencia })[tab](s, box);
}

/* --- Resumen --- */

const RESUMEN_BLOCKS = [
  ['materia.info', 'Info de la materia'], ['materia.creditos', 'Créditos y horas'], ['materia.pruebas', 'Próximas pruebas'],
  ['materia.apuntes', 'Apuntes pendientes'], ['materia.horario', 'Horario'], ['materia.faltas', 'Faltas'],
];

function tabResumen(s, box) {
  const p = subjectPace(s);
  const pct = p.goal ? Math.min(100, (p.done / p.goal) * 100) : 0;
  const now = new Date();
  const upcoming = Store.data.events.filter((e) => e.subjectId === s.id && (eventDate(e) >= now || daysUntil(e.date) === 0)).sort(byEventDate);
  const classes = Store.data.classes.filter((c) => c.subjectId === s.id).sort((a, b) => a.day - b.day || toMin(a.start) - toMin(b.start));
  const studying = Store.data.activeSession && Store.data.activeSession.subjectId === s.id;
  const absWarn = s.maxAbsences != null && s.absences >= s.maxAbsences - 1;

  const info = `<dl class="info-list">
      <div><dt>Profesores</dt><dd>${s.professors.length ? s.professors.map((pr) => `<div><strong>${esc(pr.name || 'Sin nombre')}</strong>
        <div class="mails">${pr.emails.map((m) => `<a class="pill" href="mailto:${esc(m)}">${esc(m)}</a><button class="icon-btn sm" data-copy="${esc(m)}" title="Copiar mail" aria-label="Copiar ${esc(m)}">⧉</button>`).join('')}</div></div>`).join('') : '<span class="muted">Sin cargar (✎ Editar)</span>'}</dd></div>
      <div><dt>Bibliografía</dt><dd>${s.bibliography ? esc(s.bibliography) : '<span class="muted">Sin cargar</span>'}</dd></div>
      <div><dt>Regla de aprobación</dt><dd>${s.rule ? `<div class="rule-box">${esc(s.rule)}</div>` : '<span class="muted">Se carga en la pestaña Notas</span>'}</dd></div>
    </dl>`;

  const creditos = `<div class="credits-card">${p.goal ? `
      <div class="credits-math"><span><strong>${s.credits}</strong> créditos</span><span>×</span><span>${hoursPerCredit()} h</span><span>=</span><span><strong>${fmtHM(p.goal)}</strong> totales</span></div>
      <div class="counter">
        <span class="counter-label">${p.left > 0 ? 'Te quedan' : '¡Meta cumplida!'}</span>
        ${p.left > 0 ? `<span class="counter-num">${fmtHM(p.left)}</span>` : ''}
        ${p.over > 0 ? `<span class="counter-label">Superaste la meta por ${fmtHM(p.over)}</span>` : ''}
      </div>
      <div class="bar big" style="--c:${s.color}"><span style="width:${pct}%"></span></div>
      <div class="bar-legend">${fmtHM(p.done)} dedicadas · ${pct.toFixed(0)}% · esta semana ${fmtHM(p.weekDone)}</div>
      ${paceHTML(p)}`
    : '<p class="muted">Cargá los créditos (✎ Editar) para calcular las horas de esfuerzo.</p>'}
      <button class="btn ${studying ? 'danger' : ''}" id="s-study">${studying ? '■ Terminar sesión' : '▶ Estudiar ahora'}</button></div>`;

  const faltas = `<div class="absences">
      <button class="icon-btn sm" id="abs-minus" aria-label="Restar falta">−</button>
      <span class="abs-num" aria-live="polite">${s.absences}</span>
      <button class="icon-btn sm" id="abs-plus" aria-label="Sumar falta">+</button>
      <label class="inline small">de máximo <input type="number" min="0" id="abs-max" value="${s.maxAbsences ?? ''}" placeholder="—" style="width:64px;padding:.3rem .4rem"></label>
    </div>
    ${absWarn ? `<p class="small" style="color:var(--danger);font-weight:700;margin-top:.4rem">${s.absences >= s.maxAbsences ? 'Llegaste al máximo de faltas.' : 'Te queda 1 falta antes del máximo.'}</p>` : ''}`;

  const apuntes = `<p class="hint">Clases que faltaste o apuntes que tenés que conseguir o completar.</p>
    <ul class="plain check-list" style="margin-top:.5rem">
      ${s.pendingNotes.map((n) => `<li class="${n.done ? 'done' : ''}"><input type="checkbox" data-note="${n.id}" ${n.done ? 'checked' : ''} aria-label="Marcar como hecho"><span>${esc(n.text)}</span><button class="icon-btn sm danger" data-rmnote="${n.id}" aria-label="Borrar">✕</button></li>`).join('') || '<li class="muted">Nada pendiente.</li>'}
    </ul>
    <form class="add-row" id="note-form"><input name="t" placeholder="Ej: Clase del lunes 14/9" required aria-label="Nuevo apunte pendiente"><button class="btn sm">Agregar</button></form>`;

  const horario = classes.length
    ? `<ul class="plain">${classes.map((c) => `<li><span><button class="link" data-cl="${c.id}">${DAYS[c.day - 1]} ${c.start}–${c.end}</button> · ${esc(c.kind)}${c.room ? ' · ' + esc(c.room) : ''}</span></li>`).join('')}</ul>`
    : '<p class="muted">Sin clases cargadas.</p>';

  box.innerHTML = `
    <div class="grid-2">
      ${block('materia.info', 'Info de la materia', info)}
      ${block('materia.creditos', 'Créditos y horas', creditos)}
      ${block('materia.pruebas', 'Próximas pruebas', '<div id="s-events" class="ev-list"></div>', { actions: '<button class="btn sm" id="s-add-ev">+ Evento</button>' })}
      ${block('materia.apuntes', 'Apuntes pendientes', apuntes)}
      ${block('materia.horario', 'Horario', horario, { actions: '<button class="btn sm" id="s-add-cl">+ Clase</button>' })}
      ${block('materia.faltas', 'Faltas', faltas, { cls: 'compact' })}
    </div>
    ${hiddenBar(RESUMEN_BLOCKS)}`;

  bindBlocks(box);
  const evBox = $('#s-events', box);
  if (evBox) renderEventList(evBox, upcoming.slice(0, 5), 'Nada a la vista.');
  on(box, '#s-study', 'onclick', () => {
    if (studying) { stopStudy(); rerender(); } else if (startStudy(s.id)) location.hash = '#estudio';
  });
  on(box, '#s-add-ev', 'onclick', () => openEventForm(null, { subjectId: s.id }));
  on(box, '#s-add-cl', 'onclick', () => openClassForm(null, { subjectId: s.id }));
  $$('[data-cl]', box).forEach((b) => (b.onclick = () => openClassForm(Store.data.classes.find((c) => c.id === b.dataset.cl))));
  $$('[data-copy]', box).forEach((b) => (b.onclick = () => navigator.clipboard.writeText(b.dataset.copy).then(() => toast('Mail copiado'), () => toast(b.dataset.copy))));
  on(box, '#abs-minus', 'onclick', () => { s.absences = Math.max(0, s.absences - 1); Store.save(); rerender(); });
  on(box, '#abs-plus', 'onclick', () => { s.absences++; Store.save(); rerender(); });
  on(box, '#abs-max', 'onchange', (e) => { s.maxAbsences = e.target.value === '' ? null : Math.max(0, +e.target.value); Store.save(); rerender(); });
  $$('[data-note]', box).forEach((c) => (c.onchange = () => { const n = s.pendingNotes.find((x) => x.id === c.dataset.note); n.done = c.checked; Store.save(); rerender(); }));
  $$('[data-rmnote]', box).forEach((b) => (b.onclick = () => { s.pendingNotes = s.pendingNotes.filter((x) => x.id !== b.dataset.rmnote); Store.save(); rerender(); }));
  on(box, '#note-form', 'onsubmit', (e) => { e.preventDefault(); const t = e.target.elements.t.value.trim(); if (!t) return; s.pendingNotes.push({ id: uid(), text: t, done: false }); Store.save(); rerender(); });
}

function paceHTML(p) {
  if (!p.goal) return '';
  if (p.finished) return `<div class="pace">Terminó el cursado (${fmtDateShort(p.end)}).</div>`;
  if (!p.started) return `<div class="pace">Empieza el ${fmtDateShort(p.start)}. Vas a necesitar unas <strong>${fmtHM(p.base)} por semana</strong>.</div>`;
  if (p.left <= 0) return '';
  return `<div class="pace ${p.behind ? 'behind' : ''}">Meta de esta semana: <strong>${fmtHM(p.perWeek)}</strong>
    ${p.debt >= 1 ? `<span class="small">(${fmtHM(p.base)} de la semana + ${fmtHM(p.debt)} que quedaron de semanas anteriores)</span>` : `<span class="small">(${p.weeksLeft} semanas de cursado por delante)</span>`}
    <div class="small" style="margin-top:.2rem">Llevás ${fmtHM(p.weekDone)} esta semana.</div></div>`;
}

/* --- Documentos --- */

function sortedDocs(s, sectionId) {
  return s.docs.filter((d) => d.sectionId === sectionId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.added - b.added);
}

function tabDocumentos(s, box) {
  box.innerHTML = `
    <section class="card">
      <div class="list-head"><h2>Documentos</h2><button class="btn sm" id="add-sec">+ Nueva sección</button></div>
      <p class="hint">Creá las secciones que quieras (Prácticos, Teórico, Hoja de fórmulas…). Subí archivos, arrastralos, o guardá links de Drive o de la plataforma de la facultad.</p>
      <div class="sections" style="margin-top:.8rem">
        ${s.sections.map((sec, i) => sectionHtml(s, sec, i)).join('') || '<p class="muted">No hay secciones.</p>'}
      </div>
    </section>`;
  $('#add-sec', box).onclick = async () => {
    const name = await askText('Nueva sección', 'Nombre de la sección', '', { placeholder: 'Ej: Hoja de fórmulas' });
    if (!name) return;
    s.sections.push({ id: uid(), name });
    Store.save();
    rerender();
  };
  bindSections(s, box);
}

function sectionHtml(s, sec, i) {
  const docs = sortedDocs(s, sec.id);
  const last = s.sections.length - 1;
  return `
    <div class="section" data-sec="${sec.id}">
      <div class="sec-head">
        <h3>${esc(sec.name)} <span class="count">${docs.length}</span></h3>
        <div>
          <button class="icon-btn sm" data-secmove="${sec.id}|-1" ${i === 0 ? 'disabled' : ''} title="Mover antes" aria-label="Mover sección antes">↑</button>
          <button class="icon-btn sm" data-secmove="${sec.id}|1" ${i === last ? 'disabled' : ''} title="Mover después" aria-label="Mover sección después">↓</button>
          <button class="icon-btn sm" data-rename="${sec.id}" title="Renombrar" aria-label="Renombrar sección">✎</button>
          <button class="icon-btn sm danger" data-rmsec="${sec.id}" title="Eliminar sección" aria-label="Eliminar sección"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button>
        </div>
      </div>
      <div class="dropzone">
        <label class="btn ghost sm">⬆ Subir archivos<input type="file" multiple data-upload="${sec.id}" hidden></label>
        <button class="btn ghost sm" data-addlink="${sec.id}">Guardar link</button>
        <span class="muted small">o arrastralos acá</span>
      </div>
      ${docs.length ? `<ul class="files">${docs.map((d, k) => `
        <li>
          <span class="f-ic">${d.kind === 'link' ? '' : fileIcon(d.name)}</span>
          <span class="f-main">
            ${d.kind === 'link' ? `<a class="f-name" href="${esc(safeUrl(d.url))}" target="_blank" rel="noopener">${esc(d.title)}</a>` : `<button class="link f-name" data-open="${d.id}" title="Abrir">${esc(d.title || d.name)}</button>`}
            <span class="f-meta">${d.kind === 'link' ? esc(d.url) : `${fmtBytes(d.size)} · ${fmtDateShort(new Date(d.added))}`}</span>
          </span>
          <span class="f-actions">
            <button class="icon-btn sm" data-docmove="${d.id}|-1" ${k === 0 ? 'disabled' : ''} aria-label="Subir">↑</button>
            <button class="icon-btn sm" data-docmove="${d.id}|1" ${k === docs.length - 1 ? 'disabled' : ''} aria-label="Bajar">↓</button>
            <button class="icon-btn sm" data-docren="${d.id}" aria-label="Renombrar">✎</button>
            ${d.kind === 'file' ? `<button class="icon-btn sm" data-dl="${d.id}" aria-label="Descargar">⬇</button>` : ''}
            <button class="icon-btn sm danger" data-rmdoc="${d.id}" aria-label="Eliminar">✕</button>
          </span>
        </li>`).join('')}</ul>` : ''}
    </div>`;
}

async function addFiles(s, sectionId, fileList) {
  const files = [...fileList];
  if (!files.length) return;
  let ok = 0;
  const base = sortedDocs(s, sectionId).length;
  for (const file of files) {
    const id = uid();
    try {
      await Files.put(id, file);
      s.docs.push({ id, sectionId, kind: 'file', title: file.name, name: file.name, size: file.size, type: file.type, added: Date.now(), order: base + ok });
      ok++;
    } catch (e) {
      toast(`No se pudo guardar ${file.name}`);
    }
  }
  Store.save();
  if (ok) toast(ok === 1 ? 'Archivo guardado ' : `${ok} archivos guardados `);
  rerender();
}

function bindSections(s, root) {
  const move = (arr, i, dir) => { const j = i + dir; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };
  $$('[data-upload]', root).forEach((inp) => (inp.onchange = () => addFiles(s, inp.dataset.upload, inp.files)));
  $$('.section', root).forEach((sec) => {
    const zone = $('.dropzone', sec);
    ['dragenter', 'dragover'].forEach((ev) => sec.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => sec.addEventListener(ev, (e) => { e.preventDefault(); if (ev === 'drop' || !sec.contains(e.relatedTarget)) zone.classList.remove('over'); }));
    sec.addEventListener('drop', (e) => addFiles(s, sec.dataset.sec, e.dataTransfer.files));
  });
  $$('[data-addlink]', root).forEach((b) => (b.onclick = () => {
    Modal.open('Guardar link', `
      <form class="form" id="link-form">
        <label>Título<input name="title" required placeholder="Ej: Práctico 4 en Drive"></label>
        <label>Link<input name="url" required placeholder="https://drive.google.com/…"></label>
        <div class="form-actions"><span class="grow"></span><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn">Guardar</button></div>
      </form>`, (body) => {
      $('#link-form', body).onsubmit = (e) => {
        e.preventDefault();
        const el = e.target.elements;
        s.docs.push({ id: uid(), sectionId: b.dataset.addlink, kind: 'link', title: el.title.value.trim(), url: safeUrl(el.url.value), added: Date.now(), order: sortedDocs(s, b.dataset.addlink).length });
        Store.save();
        Modal.close();
        rerender();
      };
    });
  }));
  $$('[data-secmove]', root).forEach((b) => (b.onclick = () => {
    const [id, dir] = b.dataset.secmove.split('|');
    move(s.sections, s.sections.findIndex((x) => x.id === id), +dir);
    Store.save(); rerender();
  }));
  $$('[data-docmove]', root).forEach((b) => (b.onclick = () => {
    const [id, dir] = b.dataset.docmove.split('|');
    const d = s.docs.find((x) => x.id === id);
    const list = sortedDocs(s, d.sectionId);
    move(list, list.indexOf(d), +dir);
    list.forEach((x, i) => { x.order = i; });
    Store.save(); rerender();
  }));
  $$('[data-docren]', root).forEach((b) => (b.onclick = async () => {
    const d = s.docs.find((x) => x.id === b.dataset.docren);
    const t = await askText('Renombrar', 'Nombre', d.title || d.name);
    if (!t) return;
    d.title = t; Store.save(); rerender();
  }));
  $$('[data-rename]', root).forEach((b) => (b.onclick = async () => {
    const sec = s.sections.find((x) => x.id === b.dataset.rename);
    const name = await askText('Renombrar sección', 'Nombre', sec.name);
    if (!name) return;
    sec.name = name; Store.save(); rerender();
  }));
  $$('[data-rmsec]', root).forEach((b) => (b.onclick = async () => {
    const sec = s.sections.find((x) => x.id === b.dataset.rmsec);
    const docs = s.docs.filter((d) => d.sectionId === sec.id);
    if (!confirm(`¿Eliminar la sección “${sec.name}”${docs.length ? ` y sus ${docs.length} elemento(s)` : ''}?`)) return;
    for (const d of docs) if (d.kind === 'file') await Files.del(d.id);
    s.docs = s.docs.filter((d) => d.sectionId !== sec.id);
    s.sections = s.sections.filter((x) => x.id !== sec.id);
    Store.save(); rerender();
  }));
  $$('[data-open]', root).forEach((b) => (b.onclick = async () => {
    try { window.open(await Files.url(b.dataset.open), '_blank'); } catch (e) { toast('No encontré el archivo.'); }
  }));
  $$('[data-dl]', root).forEach((b) => (b.onclick = async () => {
    const meta = s.docs.find((d) => d.id === b.dataset.dl);
    const blob = await Files.get(meta.id).catch(() => null);
    if (!blob) { toast('No encontré el archivo.'); return; }
    downloadBlob(blob, meta.name);
  }));
  $$('[data-rmdoc]', root).forEach((b) => (b.onclick = async () => {
    const meta = s.docs.find((d) => d.id === b.dataset.rmdoc);
    if (!confirm(`¿Eliminar “${meta.title || meta.name}”?`)) return;
    if (meta.kind === 'file') await Files.del(meta.id);
    s.docs = s.docs.filter((d) => d.id !== meta.id);
    Store.save(); rerender();
  }));
}

/* --- Prácticos (seguimiento de ejercicios) --- */

const EX_STATES = ['pendiente', 'en_proceso', 'resuelto'];
const EX_LABEL = { pendiente: 'Pendiente', en_proceso: 'En proceso', resuelto: 'Resuelto' };

function practicoStats(list) {
  const ex = list.flatMap((p) => p.exercises);
  const prio = ex.filter((e) => e.priority);
  return {
    total: ex.length, done: ex.filter((e) => e.state === 'resuelto').length,
    prio: prio.length, prioDone: prio.filter((e) => e.state === 'resuelto').length,
  };
}

function tabPracticos(s, box) {
  const st = practicoStats(s.practicos);
  box.innerHTML = `
    <section class="card">
      <div class="list-head">
        <h2>Tareas a realizar</h2>
        <button class="btn sm" id="add-prac">+ Nueva tarea</button>
      </div>
      ${s.practicos.length ? `
        <div class="grid-2" style="margin-bottom:.8rem">
          <div><strong>Total de la materia:</strong> ${st.done} / ${st.total} resueltos
            <div class="bar" style="--c:var(--moss);margin-top:.3rem"><span style="width:${st.total ? (st.done / st.total) * 100 : 0}%"></span></div></div>
          <div><strong>Prioritarios:</strong> ${st.prioDone} / ${st.prio} resueltos
            <div class="bar" style="--c:var(--hl);margin-top:.3rem"><span style="width:${st.prio ? (st.prioDone / st.prio) * 100 : 0}%"></span></div></div>
        </div>
        <div class="filters" style="margin-bottom:.6rem">
          <div class="switch" role="radiogroup" aria-label="Qué hace tocar un ejercicio">
            <button data-mode="estado" class="${practicoUI.mode === 'estado' ? 'on' : ''}">Tocar = cambiar estado</button>
            <button data-mode="prio" class="${practicoUI.mode === 'prio' ? 'on' : ''}">Tocar = marcar ★ prioritario</button>
          </div>
          <label class="check"><input type="checkbox" id="only-prio" ${practicoUI.onlyPrio ? 'checked' : ''}> Solo prioritarios</label>
        </div>
        <div class="legend"><span><i></i>Pendiente</span><span><i style="background:linear-gradient(135deg,var(--accent-soft) 50%,var(--surface) 50%);border-color:var(--accent)"></i>En proceso</span><span><i style="background:var(--moss);border-color:var(--moss)"></i>Resuelto</span><span><i style="background:var(--hl-soft);box-shadow:0 0 0 2px var(--hl)"></i>Prioritario (amarillo)</span></div>
        <div class="grid-2" style="margin-top:.8rem">
          ${s.practicos.map((p) => {
            const ps = practicoStats([p]);
            const exs = p.exercises.filter((e) => !practicoUI.onlyPrio || e.priority);
            return `<div class="practico" data-prac="${p.id}">
              <div class="sec-head"><h3>${esc(p.name)}</h3>
                <div><button class="icon-btn sm" data-pren="${p.id}" aria-label="Renombrar">✎</button>
                <button class="icon-btn sm" data-pcount="${p.id}" aria-label="Cambiar cantidad de ejercicios">#</button>
                <button class="icon-btn sm danger" data-prm="${p.id}" aria-label="Eliminar tarea"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button></div></div>
              <div class="muted small">${ps.done}/${ps.total} resueltos · ★ ${ps.prioDone}/${ps.prio} prioritarios</div>
              <div class="bar" style="--c:var(--moss)"><span style="width:${ps.total ? (ps.done / ps.total) * 100 : 0}%"></span></div>
              <div class="ex-grid">${exs.map((e) => `<button class="ex ${e.priority ? 'prio' : ''}" data-ex="${p.id}|${e.n}" data-state="${e.state}" title="Ejercicio ${e.n}: ${EX_LABEL[e.state]}${e.priority ? ' · prioritario' : ''}" aria-label="Ejercicio ${e.n}, ${EX_LABEL[e.state]}${e.priority ? ', prioritario' : ''}">${e.n}</button>`).join('') || '<span class="muted small">No hay prioritarios acá.</span>'}</div>
            </div>`;
          }).join('')}
        </div>` : `<div class="empty small"><p>Agregá una tarea (por ejemplo, un práctico) con su cantidad de ejercicios y andá marcando cómo vas.</p></div>`}
    </section>`;
  Sloth.paint(box);

  $('#add-prac', box).onclick = () => openPracticoForm(s);
  $$('[data-mode]', box).forEach((b) => (b.onclick = () => { practicoUI.mode = b.dataset.mode; rerender(); }));
  const op = $('#only-prio', box); if (op) op.onchange = () => { practicoUI.onlyPrio = op.checked; rerender(); };
  $$('[data-ex]', box).forEach((b) => (b.onclick = () => {
    const [pid, n] = b.dataset.ex.split('|');
    const e = s.practicos.find((p) => p.id === pid).exercises.find((x) => x.n === +n);
    if (practicoUI.mode === 'prio') e.priority = !e.priority;
    else {
      e.state = EX_STATES[(EX_STATES.indexOf(e.state) + 1) % 3];
      if (e.state === 'resuelto' && e.priority) Sloth.react('prioritario', {}, { proud: true });
    }
    Store.save();
    rerender();
  }));
  $$('[data-pren]', box).forEach((b) => (b.onclick = async () => {
    const p = s.practicos.find((x) => x.id === b.dataset.pren);
    const t = await askText('Renombrar tarea', 'Nombre', p.name);
    if (t) { p.name = t; Store.save(); rerender(); }
  }));
  $$('[data-pcount]', box).forEach((b) => (b.onclick = async () => {
    const p = s.practicos.find((x) => x.id === b.dataset.pcount);
    const t = await askText('Cantidad de ejercicios', 'Cantidad', String(p.exercises.length), { type: 'number' });
    const n = parseInt(t, 10);
    if (!n || n < 1 || n > 300) return;
    if (n > p.exercises.length) for (let i = p.exercises.length + 1; i <= n; i++) p.exercises.push({ n: i, priority: false, state: 'pendiente' });
    else p.exercises = p.exercises.slice(0, n);
    Store.save(); rerender();
  }));
  $$('[data-prm]', box).forEach((b) => (b.onclick = () => {
    const p = s.practicos.find((x) => x.id === b.dataset.prm);
    if (!confirm(`¿Eliminar “${p.name}”?`)) return;
    s.practicos = s.practicos.filter((x) => x.id !== p.id);
    Store.save(); rerender();
  }));
}

function openPracticoForm(s) {
  Modal.open('Nueva tarea', `
    <form class="form" id="prac-form">
      <label>Nombre<input name="name" required placeholder="Ej: Práctico 4" value="Práctico ${s.practicos.length + 1}"></label>
      <label>Cantidad de ejercicios<input type="number" name="count" min="1" max="300" value="10" required></label>
      <label>Prioritarios <span class="opt">(opcional, números separados por coma)</span><input name="prio" placeholder="Ej: 1, 3, 7"></label>
      <div class="form-actions"><span class="grow"></span><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn">Crear</button></div>
    </form>`, (body) => {
    $('#prac-form', body).onsubmit = (e) => {
      e.preventDefault();
      const el = e.target.elements;
      const count = clamp(parseInt(el.count.value, 10) || 1, 1, 300);
      const prio = el.prio.value.split(/[,;\s]+/).map((x) => parseInt(x, 10)).filter(Boolean);
      s.practicos.push({ id: uid(), name: el.name.value.trim(), exercises: Array.from({ length: count }, (_, i) => ({ n: i + 1, priority: prio.includes(i + 1), state: 'pendiente' })) });
      Store.save();
      Modal.close();
      rerender();
    };
  });
}

/* --- Notas y aprobación ---
 * Cada evaluación vale un porcentaje de la nota final (sobre 12). A medida que
 * cargás notas, se va sumando la nota acumulada: un 9 en un parcial que vale
 * 40% suma 9 × 0,40 = 3,6 puntos. Una evaluación puede ser una sola nota o
 * varias, de las que cuentan las mejores N en promedio (por ejemplo, los 3
 * controles más altos).
 */

const GRADE_PRESETS = [
  { id: 'p40', label: 'Parcial 40%', make: (n) => ({ name: `Parcial ${n}`, weight: 40, kind: 'single', count: 1, best: 1 }) },
  { id: 'p20', label: 'Parcial 20%', make: (n) => ({ name: `Parcial ${n}`, weight: 20, kind: 'single', count: 1, best: 1 }) },
  { id: 'ctrl', label: 'Controles (3 mejores de 4) 20%', make: () => ({ name: 'Controles', weight: 20, kind: 'group', count: 4, best: 3 }) },
  { id: 'otra', label: 'Otra', make: () => ({ name: 'Evaluación', weight: 10, kind: 'single', count: 1, best: 1 }) },
];

function grading(s) {
  if (!s.grading) s.grading = { scale: 12, pass: 6, target: null, components: [] };
  return s.grading;
}

const isNum = (g) => g !== '' && g != null && !Number.isNaN(Number(g));
const fmtN = (n) => (Math.round(n * 100) / 100).toLocaleString('es-UY', { maximumFractionDigits: 2 });

function componentStatus(c, scale) {
  const filled = c.grades.filter(isNum).map(Number);
  const counts = c.kind === 'group' ? clamp(c.best || c.count, 1, c.count) : 1;
  const used = filled.slice().sort((a, b) => b - a).slice(0, counts);
  const avg = used.length ? used.reduce((a, b) => a + b, 0) / used.length : null;
  const done = filled.length >= (c.kind === 'group' ? c.count : 1);
  const w = (Number(c.weight) || 0) / 100;
  return { avg, done, filled: filled.length, counts, w, points: avg == null ? 0 : avg * w, maxPoints: w * scale };
}

function gradeSummary(s) {
  const g = grading(s);
  const scale = Number(g.scale) || 12;
  let totalW = 0, gradedW = 0, accumulated = 0, pendingW = 0;
  for (const c of g.components) {
    const st = componentStatus(c, scale);
    totalW += st.w;
    if (st.avg != null) { gradedW += st.w; accumulated += st.points; }
    if (!st.done) pendingW += st.w;
  }
  const doneAccum = g.components.reduce((a, c) => { const st = componentStatus(c, scale); return a + (st.done ? st.points : 0); }, 0);
  return {
    scale, totalPct: totalW * 100, gradedPct: gradedW * 100, pendingPct: pendingW * 100,
    accumulated,                                   // nota acumulada hasta ahora (sobre la escala)
    average: gradedW ? accumulated / gradedW : null, // promedio en lo rendido
    maxPossible: doneAccum + pendingW * scale,     // si te va perfecto en lo que falta
    need: (target) => (pendingW > 0 ? (target - doneAccum) / pendingW : null),
  };
}

function tabNotas(s, box) {
  const g = grading(s);
  const sum = gradeSummary(s);
  const target = Number(g.target ?? g.pass ?? 6);
  const need = sum.need(target);

  const segments = g.components.map((c) => {
    const st = componentStatus(c, sum.scale);
    return `<span class="seg" style="width:${st.w * 100}%" title="${esc(c.name)}: ${fmtN(st.points)} de ${fmtN(st.maxPoints)}"><i style="width:${st.maxPoints ? (st.points / st.maxPoints) * 100 : 0}%"></i></span>`;
  }).join('');

  let needLine = '';
  if (g.components.length) {
    if (sum.accumulated >= target) needLine = `<p class="ok-line">Ya llegaste a ${fmtN(target)} con lo que llevás acumulado.</p>`;
    else if (need == null) needLine = `<p class="warn-line">No quedan evaluaciones para llegar a ${fmtN(target)}.</p>`;
    else if (need > sum.scale) needLine = `<p class="warn-line">Para llegar a ${fmtN(target)} necesitarías más de ${sum.scale} en lo que falta. Mirá la regla de aprobación por si hay recuperatorio.</p>`;
    else needLine = `<p>Para llegar a <strong>${fmtN(target)}</strong> necesitás un promedio de <strong class="big-inline">${fmtN(Math.max(0, need))}</strong> en lo que te falta (${fmtN(sum.pendingPct)}% de la nota).</p>`;
  }

  const summary = `
    <div class="accum">
      <div><span class="muted small">Nota acumulada</span><div class="big-stat">${fmtN(sum.accumulated)}<span class="muted" style="font-size:1rem"> / ${sum.scale}</span></div></div>
      <div class="accum-facts small">
        <span>Rendiste el <strong>${fmtN(sum.gradedPct)}%</strong> de la nota</span>
        ${sum.average != null ? `<span>Promedio en lo rendido: <strong>${fmtN(sum.average)}</strong></span>` : ''}
        <span>Máximo que todavía podés sacar: <strong>${fmtN(Math.min(sum.scale, sum.maxPossible))}</strong></span>
      </div>
    </div>
    <div class="seg-bar" aria-hidden="true">${segments}</div>
    <div class="filters" style="margin-top:.8rem">
      <label class="inline small">Notas sobre <input type="number" id="g-scale" min="1" value="${sum.scale}" class="w-num"></label>
      <label class="inline small">Quiero llegar a <input type="number" id="g-target" min="0" step="any" value="${target}" class="w-num"></label>
    </div>
    ${needLine}`;

  const rows = g.components.map((c) => {
    const st = componentStatus(c, sum.scale);
    const inputs = c.grades.map((v, i) => `<input type="number" step="any" min="0" max="${sum.scale}" data-grade="${c.id}|${i}" value="${isNum(v) ? v : ''}" placeholder="—" aria-label="${esc(c.name)}, nota ${i + 1}">`).join('');
    return `<div class="ev-grade" data-comp="${c.id}">
      <div class="eg-name">
        <input data-f="name" value="${esc(c.name)}" aria-label="Nombre de la evaluación">
        <span class="small muted">${c.kind === 'group' ? `cuentan las <input type="number" data-f="best" min="1" max="${c.count}" value="${c.best}" class="w-num xs" aria-label="Cuántas cuentan"> mejores de <input type="number" data-f="count" min="2" max="20" value="${c.count}" class="w-num xs" aria-label="Cuántas notas"> · <button type="button" class="link small" data-kind="${c.id}|single">una sola nota</button>` : `<button type="button" class="link small" data-kind="${c.id}|group">son varias notas</button>`}</span>
      </div>
      <label class="eg-pct"><input type="number" data-f="weight" min="0" max="100" step="any" value="${c.weight}" class="w-num" aria-label="Porcentaje"> %</label>
      <div class="eg-grades">${inputs}</div>
      <div class="eg-sum"><strong>${st.avg == null ? '—' : `+${fmtN(st.points)}`}</strong><span class="muted small">de ${fmtN(st.maxPoints)}</span></div>
      <button type="button" class="icon-btn sm ghosty" data-rmcomp="${c.id}" aria-label="Eliminar ${esc(c.name)}">✕</button>
    </div>`;
  }).join('');

  const evalBody = `
    ${g.components.length ? `<div class="eg-head small muted"><span>Evaluación</span><span>Vale</span><span>Nota</span><span>Suma</span><span></span></div>${rows}` : '<p class="muted">Agregá cómo se evalúa la materia: cada evaluación con el porcentaje que vale.</p>'}
    <div class="add-evals"><span class="small muted">Agregar:</span>${GRADE_PRESETS.map((p) => `<button type="button" class="chip-opt" data-preset-comp="${p.id}">+ ${p.label}</button>`).join('')}</div>
    ${g.components.length && Math.round(sum.totalPct) !== 100 ? `<p class="small" style="color:var(--warn);font-weight:700;margin-top:.6rem">Los porcentajes suman ${fmtN(sum.totalPct)}%. Para que la cuenta dé bien, tienen que sumar 100%.</p>` : ''}`;

  const reglaBody = `<textarea id="rule" rows="3" placeholder="Ej: Examen de 16 ejercicios, cada uno bien vale 1…">${esc(s.rule)}</textarea><p class="hint">Se muestra también en el Resumen.</p>`;

  box.innerHTML = `
    <div class="page" style="gap:1rem">
      ${block('notas.resumen', 'Cómo vas', summary)}
      ${block('notas.eval', 'Evaluaciones', evalBody)}
      ${block('notas.regla', 'Regla de aprobación', reglaBody)}
      ${hiddenBar([['notas.resumen', 'Cómo vas'], ['notas.eval', 'Evaluaciones'], ['notas.regla', 'Regla de aprobación']])}
    </div>`;

  bindBlocks(box);
  const save = () => { Store.save(); rerender(); };
  const comp = (id) => g.components.find((c) => c.id === id);
  $$('[data-preset-comp]', box).forEach((b) => (b.onclick = () => {
    const p = GRADE_PRESETS.find((x) => x.id === b.dataset.presetComp);
    const n = g.components.filter((c) => /^Parcial/.test(c.name)).length + 1;
    const c = { id: uid(), max: sum.scale, ...p.make(n) };
    c.grades = Array(c.count).fill('');
    g.components.push(c);
    save();
  }));
  $$('[data-comp] [data-f]', box).forEach((inp) => (inp.onchange = () => {
    const c = comp(inp.closest('[data-comp]').dataset.comp);
    const f = inp.dataset.f;
    if (f === 'name') c.name = inp.value.trim() || c.name;
    else {
      const v = Number(inp.value);
      if (f === 'weight') c.weight = clamp(v || 0, 0, 100);
      if (f === 'count') { c.count = clamp(Math.round(v) || 2, 2, 20); c.grades = Array.from({ length: c.count }, (_, i) => c.grades[i] ?? ''); c.best = Math.min(c.best, c.count); }
      if (f === 'best') c.best = clamp(Math.round(v) || 1, 1, c.count);
    }
    save();
  }));
  $$('[data-kind]', box).forEach((b) => (b.onclick = () => {
    const [id, kind] = b.dataset.kind.split('|');
    const c = comp(id);
    c.kind = kind;
    if (kind === 'single') { c.count = 1; c.best = 1; c.grades = [c.grades.find(isNum) ?? '']; }
    else { c.count = Math.max(c.count, 4); c.best = 3; c.grades = Array.from({ length: c.count }, (_, i) => c.grades[i] ?? ''); }
    save();
  }));
  $$('[data-grade]', box).forEach((inp) => (inp.onchange = () => {
    const [id, i] = inp.dataset.grade.split('|');
    comp(id).grades[+i] = inp.value === '' ? '' : Number(inp.value);
    save();
  }));
  $$('[data-rmcomp]', box).forEach((b) => (b.onclick = () => {
    const c = comp(b.dataset.rmcomp);
    if (!confirm(`¿Eliminar “${c.name}”?`)) return;
    g.components = g.components.filter((x) => x !== c);
    save();
  }));
  on(box, '#g-scale', 'onchange', (e) => { g.scale = Math.max(1, Number(e.target.value) || 12); g.components.forEach((c) => { c.max = g.scale; }); save(); });
  on(box, '#g-target', 'onchange', (e) => { g.target = e.target.value === '' ? null : Number(e.target.value); save(); });
  on(box, '#rule', 'onchange', (e) => { s.rule = e.target.value.trim(); Store.save(); });
}

/* --- Apariencia (estilo Tumblr) --- */

function tabApariencia(s, box) {
  const t = s.theme;
  box.innerHTML = `
    <section class="card">
      <h2>Apariencia de ${esc(s.name)}</h2>
      <p class="hint">Se ve solo cuando estás dentro de esta materia. Los cambios se guardan solos y los ves en vivo.</p>
      <div class="form" style="margin-top:.8rem">
        <div class="field"><strong>Color de la materia</strong>
          <div class="swatches" style="margin-top:.4rem">
            ${SUBJECT_COLORS.map((c) => `<button type="button" class="swatch-btn ${c === s.color ? 'on' : ''}" style="background:${c}" data-color="${c}" aria-label="Color ${c}"></button>`).join('')}
            <label class="color-dot" title="Otro color" style="background:${s.color}"><input type="color" id="s-color" value="${s.color}" aria-label="Otro color"></label>
          </div>
        </div>
        <div class="field"><strong>Fondo de la página</strong><div style="margin-top:.4rem">${bgEditorHTML(t, s.color)}</div></div>
      </div>
    </section>`;
  const setColor = (c, live) => {
    s.color = c;
    applyTheme(subjectTheme(s));
    if (!live) { Store.save(); rerender(); }
  };
  $$('[data-color]', box).forEach((b) => (b.onclick = () => setColor(b.dataset.color)));
  const ci = $('#s-color', box);
  ci.oninput = () => { ci.parentElement.style.background = ci.value; setColor(ci.value, true); };
  ci.onchange = () => setColor(ci.value);
  bindBgEditor(box, t, (patch, { live } = {}) => {
    Object.assign(s.theme, patch);
    applyTheme(subjectTheme(s));
    if (!live) { Store.save(); rerender(); }
  });
}
