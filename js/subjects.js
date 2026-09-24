'use strict';

/* ---------- Materias ---------- */

function newSubject() {
  const n = Store.data.subjects.length;
  const now = new Date();
  return {
    id: uid(),
    name: '',
    semester: now.getMonth() < 6 ? '1' : '2',
    year: now.getFullYear(),
    professor: '',
    emails: [],
    credits: 0,
    color: SUBJECT_COLORS[n % SUBJECT_COLORS.length],
    theme: { bgColor: '', bgImageId: '', bgUrl: '', bgMode: '' },
    sections: [
      { id: uid(), name: 'Prácticos' },
      { id: uid(), name: 'Teóricos' },
      { id: uid(), name: 'Parciales y exámenes anteriores' },
    ],
    docs: [],
  };
}

function hoursBar(s) {
  const goal = goalMinutes(s);
  const done = studiedMinutes(s.id);
  const pct = goal ? Math.min(100, (done / goal) * 100) : 0;
  return `<div class="bar" style="--c:${s.color}"><span style="width:${pct}%"></span></div>
    <div class="bar-legend">${goal ? `${fmtHM(done)} de ${fmtHM(goal)}` : 'Sin créditos cargados'}</div>`;
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
            return `<a class="card subj-card" href="#materia/${s.id}" style="--c:${s.color}">
              <div class="subj-card-top"><h3>${esc(s.name)}</h3><span class="credits-badge">${Number(s.credits) || 0} cr.</span></div>
              <p class="muted">${s.professor ? '👩‍🏫 ' + esc(s.professor) : 'Sin docente cargado'}</p>
              ${hoursBar(s)}
              <p class="next">${next ? `${eventType(next).icon} ${esc(typeLabel(next))} · <span data-countdown="${eventDate(next).getTime()}">${countdown(eventDate(next)).text}</span>` : '<span class="muted">Sin pruebas próximas</span>'}</p>
            </a>`;
          }).join('')}</div>`;
      }).join('') : `
        <div class="card empty">
          <span class="empty-sloth big" data-sloth="face"></span>
          <h2>Todavía no hay materias</h2>
          <p>Creá tu primera materia para empezar a organizar el semestre.</p>
          <div class="empty-actions"><button class="btn" id="add-subj-2">+ Crear materia</button>
          <button class="btn ghost" id="demo">Probar con datos de ejemplo</button></div>
        </div>`}
    </section>`;
  Sloth.paint($('#view'));
  $('#add-subj').onclick = () => openSubjectForm();
  const b2 = $('#add-subj-2'); if (b2) b2.onclick = () => openSubjectForm();
  const demo = $('#demo'); if (demo) demo.onclick = loadDemoData;
}

function openSubjectForm(s) {
  const isNew = !s;
  const data = s ? { ...s } : newSubject();
  const y = new Date().getFullYear();
  Modal.open(isNew ? 'Nueva materia' : 'Editar materia', `
    <form class="form" id="subj-form">
      <label>Nombre de la materia<input name="name" required value="${esc(data.name)}" placeholder="Ej: Cálculo II"></label>
      <div class="row">
        <label>Semestre<select name="semester">
          <option value="1" ${data.semester === '1' ? 'selected' : ''}>1er semestre</option>
          <option value="2" ${data.semester === '2' ? 'selected' : ''}>2do semestre</option>
          <option value="anual" ${data.semester === 'anual' ? 'selected' : ''}>Anual</option>
        </select></label>
        <label>Año<input type="number" name="year" min="2000" max="2100" value="${data.year || y}" required></label>
      </div>
      <label>Profesor/a<input name="professor" value="${esc(data.professor)}" placeholder="Ej: Dra. Ana Pérez"></label>
      <label>Mails del profesor/a <span class="opt">(separados por coma)</span>
        <input name="emails" value="${esc((data.emails || []).join(', '))}" placeholder="ana.perez@facultad.edu, ana@gmail.com"></label>
      <div class="row">
        <label>Créditos<input type="number" name="credits" min="0" step="0.5" value="${data.credits || 0}"></label>
        <label>Color de la materia<input type="color" name="color" value="${data.color}"></label>
      </div>
      <p class="hint credits-hint">1 crédito = 10 horas de esfuerzo en el semestre → <strong id="hours-preview">${(Number(data.credits) || 0) * 10} h</strong></p>
      ${isNew ? '<p class="hint">Después vas a poder ponerle fondo y colores propios con 🎨 Personalizar.</p>' : ''}
      <div class="form-actions"><span class="grow"></span>
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button class="btn">${isNew ? 'Crear materia' : 'Guardar'}</button></div>
    </form>`, (body) => {
    const f = $('#subj-form', body);
    const el = f.elements;
    el.credits.oninput = () => { $('#hours-preview', f).textContent = `${(Number(el.credits.value) || 0) * 10} h`; };
    f.onsubmit = (e) => {
      e.preventDefault();
      const emails = el.emails.value.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
      const bad = emails.find((m) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m));
      if (bad) { toast(`“${bad}” no parece un mail válido.`); return; }
      Object.assign(data, {
        name: el.name.value.trim(), semester: el.semester.value, year: +el.year.value,
        professor: el.professor.value.trim(), emails, credits: Number(el.credits.value) || 0, color: el.color.value,
      });
      if (isNew) Store.data.subjects.push(data);
      else Object.assign(s, data);
      Store.save();
      Modal.close();
      if (isNew) { toast('¡Materia creada! 🦥'); location.hash = `#materia/${data.id}`; }
      else { toast('Materia actualizada'); rerender(); }
    };
  });
}

async function deleteSubject(s) {
  if (!confirm(`¿Eliminar “${s.name}”? Se borran también sus eventos, clases, horas registradas y documentos.`)) return;
  const d = Store.data;
  d.subjects = d.subjects.filter((x) => x.id !== s.id);
  d.events = d.events.filter((x) => x.subjectId !== s.id);
  d.classes = d.classes.filter((x) => x.subjectId !== s.id);
  d.sessions = d.sessions.filter((x) => x.subjectId !== s.id);
  if (d.activeSession && d.activeSession.subjectId === s.id) d.activeSession = null;
  if (d.pomodoro.subjectId === s.id) d.pomodoro.subjectId = '';
  Store.save();
  for (const doc of s.docs) await Files.del(doc.id);
  if (s.theme && s.theme.bgImageId) await Files.del(s.theme.bgImageId);
  toast('Materia eliminada');
  location.hash = '#materias';
}

/* ===== Página de una materia ===== */

function renderSubject(id) {
  const s = subjectById(id);
  if (!s) { location.hash = '#materias'; return; }
  applyTheme(subjectTheme(s));

  const goal = goalMinutes(s);
  const done = studiedMinutes(s.id);
  const left = goal - done;
  const pct = goal ? Math.min(100, (done / goal) * 100) : 0;
  const now = new Date();
  const upcoming = Store.data.events.filter((e) => e.subjectId === s.id && eventDate(e) >= now).sort(byEventDate);
  const classes = Store.data.classes.filter((c) => c.subjectId === s.id).sort((a, b) => a.day - b.day || toMin(a.start) - toMin(b.start));
  const studying = Store.data.activeSession && Store.data.activeSession.subjectId === s.id;

  $('#view').innerHTML = `
    <section class="page subject-page">
      <a href="#materias" class="back">← Materias</a>
      <header class="card subj-hero" style="--c:${s.color}">
        <div>
          <span class="tag">${semLabel(s.semester)} · ${s.year}</span>
          <h1>${esc(s.name)}</h1>
          <p>${s.professor ? '👩‍🏫 ' + esc(s.professor) : '<span class="muted">Sin docente cargado</span>'}</p>
          ${s.emails.length ? `<div class="mails">${s.emails.map((m) => `<a class="pill" href="mailto:${esc(m)}">✉️ ${esc(m)}</a><button class="icon-btn sm" data-copy="${esc(m)}" title="Copiar mail">⧉</button>`).join('')}</div>` : ''}
        </div>
        <div class="hero-actions">
          <button class="btn ghost" id="s-theme">🎨 Personalizar</button>
          <button class="btn ghost" id="s-edit">✎ Editar</button>
          <button class="icon-btn danger" id="s-del" title="Eliminar materia" aria-label="Eliminar materia">🗑</button>
        </div>
      </header>

      <div class="subj-grid">
        <div class="card credits-card">
          <h2>⏳ Créditos y horas</h2>
          ${goal ? `
            <div class="credits-math"><span><strong>${s.credits}</strong> créditos</span><span>×</span><span>10 h</span><span>=</span><span><strong>${goal / 60} h</strong> totales</span></div>
            <div class="counter ${left < 0 ? 'over' : ''}">
              <span class="counter-label">${left > 0 ? 'Te quedan' : '¡Meta cumplida!'}</span>
              <span class="counter-num">${left > 0 ? fmtHM(left) : '🎉'}</span>
              ${left < 0 ? `<span class="counter-label">Superaste la meta por ${fmtHM(-left)}</span>` : ''}
            </div>
            <div class="bar big" style="--c:${s.color}"><span style="width:${pct}%"></span></div>
            <div class="bar-legend">${fmtHM(done)} dedicadas · ${pct.toFixed(0)}%</div>`
          : '<p class="muted">Cargá los créditos (✎ Editar) para calcular las horas de esfuerzo.</p>'}
          <button class="btn ${studying ? 'danger' : ''}" id="s-study">${studying ? '■ Terminar sesión' : '▶ Estudiar ahora'}</button>
        </div>

        <div class="card">
          <div class="list-head"><h2>📝 Próximas pruebas</h2><button class="btn sm" id="s-add-ev">+ Evento</button></div>
          <div id="s-events" class="ev-list"></div>
        </div>

        <div class="card">
          <div class="list-head"><h2>🏫 Horario</h2><button class="btn sm" id="s-add-cl">+ Clase</button></div>
          ${classes.length ? `<ul class="plain">${classes.map((c) => `<li><button class="link" data-cl="${c.id}">${DAYS[c.day - 1]} ${c.start}–${c.end}</button> · ${esc(c.kind)}${c.room ? ' · ' + esc(c.room) : ''}</li>`).join('')}</ul>` : '<p class="muted">Sin clases cargadas.</p>'}
        </div>
      </div>

      <section class="card docs">
        <div class="list-head"><h2>📂 Documentos</h2><button class="btn sm" id="add-sec">+ Nueva sección</button></div>
        <p class="hint">Creá las secciones que quieras (Prácticos, Teóricos, Resúmenes…) y arrastrá los archivos adentro.</p>
        <div class="sections">
          ${s.sections.map((sec) => sectionHtml(s, sec)).join('') || '<p class="muted">No hay secciones.</p>'}
        </div>
      </section>
    </section>`;

  const v = $('#view');
  renderEventList($('#s-events', v), upcoming.slice(0, 5), 'Nada a la vista. 🌿');
  $('#s-edit').onclick = () => openSubjectForm(s);
  $('#s-del').onclick = () => deleteSubject(s);
  $('#s-theme').onclick = () => openThemeEditor({
    title: `Personalizar ${s.name}`,
    accentLabel: 'Color de la materia',
    current: { accent: s.color, bgColor: s.theme.bgColor || Store.data.settings.theme.bgColor, bgMode: s.theme.bgMode || 'tile', bgImageId: s.theme.bgImageId, bgUrl: s.theme.bgUrl },
    onSave: (t) => {
      s.color = t.accent;
      s.theme = { bgColor: t.bgColor, bgMode: t.bgMode, bgImageId: t.bgImageId, bgUrl: t.bgUrl };
      Store.save();
      toast('¡Quedó divina! 💜');
      rerender();
    },
    onCancel: () => applyTheme(subjectTheme(s)),
  });
  $('#s-study').onclick = () => {
    if (studying) stopStudy();
    else { startStudy(s.id); location.hash = '#estudio'; }
    if (studying) rerender();
  };
  $('#s-add-ev').onclick = () => openEventForm(null, { subjectId: s.id });
  $('#s-add-cl').onclick = () => openClassForm(null, { subjectId: s.id });
  $$('[data-cl]', v).forEach((b) => (b.onclick = () => openClassForm(Store.data.classes.find((c) => c.id === b.dataset.cl))));
  $$('[data-copy]', v).forEach((b) => (b.onclick = () => {
    navigator.clipboard.writeText(b.dataset.copy).then(() => toast('Mail copiado'), () => toast(b.dataset.copy));
  }));
  $('#add-sec').onclick = async () => {
    const name = await askText('Nueva sección', 'Nombre de la sección', '');
    if (!name) return;
    s.sections.push({ id: uid(), name });
    Store.save();
    rerender();
  };
  bindSections(s, v);
}

function sectionHtml(s, sec) {
  const docs = s.docs.filter((d) => d.sectionId === sec.id).sort((a, b) => b.added - a.added);
  return `
    <div class="section" data-sec="${sec.id}">
      <div class="sec-head">
        <h3>📁 ${esc(sec.name)} <span class="count">${docs.length}</span></h3>
        <div>
          <button class="icon-btn sm" data-rename="${sec.id}" title="Renombrar sección" aria-label="Renombrar sección">✎</button>
          <button class="icon-btn sm danger" data-rmsec="${sec.id}" title="Eliminar sección" aria-label="Eliminar sección">🗑</button>
        </div>
      </div>
      <label class="dropzone">
        <input type="file" multiple data-upload="${sec.id}" hidden>
        <span>⬆ Subí archivos o arrastralos acá</span>
      </label>
      ${docs.length ? `<ul class="files">${docs.map((d) => `
        <li>
          <span class="f-ic">${fileIcon(d.name)}</span>
          <button class="link f-name" data-open="${d.id}" title="Abrir">${esc(d.name)}</button>
          <span class="f-meta">${fmtBytes(d.size)} · ${fmtDateShort(new Date(d.added))}</span>
          <button class="icon-btn sm" data-dl="${d.id}" title="Descargar" aria-label="Descargar">⬇</button>
          <button class="icon-btn sm danger" data-rmdoc="${d.id}" title="Eliminar" aria-label="Eliminar">✕</button>
        </li>`).join('')}</ul>` : ''}
    </div>`;
}

async function addFiles(s, sectionId, fileList) {
  const files = [...fileList];
  if (!files.length) return;
  let ok = 0;
  for (const file of files) {
    const id = uid();
    try {
      await Files.put(id, file);
      s.docs.push({ id, sectionId, name: file.name, size: file.size, type: file.type, added: Date.now() });
      ok++;
    } catch (e) {
      toast(`No se pudo guardar ${file.name}`);
    }
  }
  Store.save();
  if (ok) toast(ok === 1 ? 'Archivo guardado 📎' : `${ok} archivos guardados 📎`);
  rerender();
}

function bindSections(s, root) {
  $$('[data-upload]', root).forEach((inp) => (inp.onchange = () => addFiles(s, inp.dataset.upload, inp.files)));
  $$('.section', root).forEach((sec) => {
    const zone = $('.dropzone', sec);
    ['dragenter', 'dragover'].forEach((ev) => sec.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => sec.addEventListener(ev, (e) => { e.preventDefault(); if (ev === 'drop' || !sec.contains(e.relatedTarget)) zone.classList.remove('over'); }));
    sec.addEventListener('drop', (e) => addFiles(s, sec.dataset.sec, e.dataTransfer.files));
  });
  $$('[data-rename]', root).forEach((b) => (b.onclick = async () => {
    const sec = s.sections.find((x) => x.id === b.dataset.rename);
    const name = await askText('Renombrar sección', 'Nombre', sec.name);
    if (!name) return;
    sec.name = name;
    Store.save();
    rerender();
  }));
  $$('[data-rmsec]', root).forEach((b) => (b.onclick = async () => {
    const sec = s.sections.find((x) => x.id === b.dataset.rmsec);
    const docs = s.docs.filter((d) => d.sectionId === sec.id);
    if (!confirm(`¿Eliminar la sección “${sec.name}”${docs.length ? ` y sus ${docs.length} archivo(s)` : ''}?`)) return;
    for (const d of docs) await Files.del(d.id);
    s.docs = s.docs.filter((d) => d.sectionId !== sec.id);
    s.sections = s.sections.filter((x) => x.id !== sec.id);
    Store.save();
    rerender();
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
    if (!confirm(`¿Eliminar “${meta.name}”?`)) return;
    await Files.del(meta.id);
    s.docs = s.docs.filter((d) => d.id !== meta.id);
    Store.save();
    rerender();
  }));
}
