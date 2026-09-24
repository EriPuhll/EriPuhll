'use strict';

/* ---------- Proyectos grupales ---------- */

function projectEvents(p) {
  return Store.data.events.filter((e) => e.projectId === p.id).sort(byEventDate);
}

function renderProjects() {
  const list = Store.data.projects;
  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head">
        <div><h1>Proyectos grupales</h1><p class="sub">Integrantes, tareas, links y entregas en un solo lugar.</p></div>
        <button class="btn" id="add-proj">+ Nuevo proyecto</button>
      </div>
      ${list.length ? `<div class="grid-3">${list.map((p) => {
        const done = p.tasks.filter((t) => t.done).length;
        const next = projectEvents(p).find((e) => eventDate(e) >= new Date());
        const col = p.subjectId ? subjectColor(p.subjectId) : 'var(--accent)';
        return `<a class="card subj-card" href="#proyecto/${p.id}" style="--c:${col}">
          <div class="subj-card-top"><h3>🤝 ${esc(p.name)}</h3></div>
          <p class="muted">${p.subjectId ? esc(subjectName(p.subjectId)) : 'Sin materia'} · ${p.members.length} integrantes</p>
          <div class="bar" style="--c:${col}"><span style="width:${p.tasks.length ? (done / p.tasks.length) * 100 : 0}%"></span></div>
          <div class="bar-legend">${done}/${p.tasks.length} tareas hechas</div>
          <p class="next">${next ? `📦 ${esc(next.title || typeLabel(next))} · <span class="num" data-countdown="${eventDate(next).getTime()}">${countdown(eventDate(next)).text}</span>` : '<span class="muted">Sin entregas cargadas</span>'}</p>
        </a>`;
      }).join('')}</div>` : `<div class="card empty"><span class="empty-sloth big" data-sloth="head"></span><h2>No hay proyectos</h2><p>Creá uno para repartir tareas con tu grupo.</p></div>`}
    </section>`;
  Sloth.paint($('#view'));
  $('#add-proj').onclick = () => openProjectForm();
}

function openProjectForm(p) {
  const isNew = !p;
  Modal.open(isNew ? 'Nuevo proyecto' : 'Editar proyecto', `
    <form class="form" id="proj-form">
      <label>Nombre<input name="name" required value="${esc(p ? p.name : '')}" placeholder="Ej: Mulita Software"></label>
      <label>Materia <span class="opt">(opcional)</span><select name="subjectId">${subjectOptions(p ? p.subjectId : '', { allowEmpty: true })}</select></label>
      <label>Integrantes <span class="opt">(separados por coma)</span><input name="members" value="${esc(p ? p.members.join(', ') : Store.data.settings.userName)}"></label>
      <div class="form-actions">
        ${isNew ? '' : '<button type="button" class="btn danger ghost" id="proj-del">Eliminar</button>'}
        <span class="grow"></span><button type="button" class="btn ghost" data-close>Cancelar</button><button class="btn">Guardar</button>
      </div>
    </form>`, (body) => {
    const f = $('#proj-form', body);
    f.onsubmit = (e) => {
      e.preventDefault();
      const x = f.elements;
      const fields = { name: x.name.value.trim(), subjectId: x.subjectId.value, members: x.members.value.split(',').map((m) => m.trim()).filter(Boolean) };
      if (isNew) {
        const np = { id: uid(), links: [], tasks: [], ...fields };
        Store.data.projects.push(np);
        Store.save(); Modal.close();
        location.hash = `#proyecto/${np.id}`;
      } else {
        Object.assign(p, fields);
        Store.save(); Modal.close(); rerender();
      }
    };
    const del = $('#proj-del', f);
    if (del) del.onclick = () => {
      if (!confirm(`¿Eliminar “${p.name}”? Sus entregas quedan en el calendario, sin proyecto.`)) return;
      Store.data.projects = Store.data.projects.filter((x) => x.id !== p.id);
      Store.data.events.forEach((e) => { if (e.projectId === p.id) e.projectId = ''; });
      Store.save(); Modal.close(); location.hash = '#proyectos';
    };
  });
}

function renderProject(id) {
  const p = projectById(id);
  if (!p) { location.hash = '#proyectos'; return; }
  const col = p.subjectId ? subjectColor(p.subjectId) : 'var(--accent)';
  const done = p.tasks.filter((t) => t.done).length;
  $('#view').innerHTML = `
    <section class="page">
      <a href="#proyectos" class="back">← Proyectos</a>
      <header class="card subj-hero" style="--c:${col}">
        <div>
          <h1>🤝 ${esc(p.name)}</h1>
          <p class="muted">${p.subjectId ? `<a href="#materia/${p.subjectId}">${esc(subjectName(p.subjectId))}</a>` : 'Sin materia'} · ${done}/${p.tasks.length} tareas hechas</p>
        </div>
        <div class="hero-actions"><button class="btn ghost" id="p-edit">✎ Editar</button></div>
      </header>
      <div class="grid-2">
        <section class="card">
          <h2>👥 Integrantes</h2>
          <div class="members">${p.members.map((m) => `<span class="pill">${esc(m)}</span>`).join('') || '<span class="muted">Sin integrantes</span>'}</div>
          <h2 style="margin-top:1.2rem">🔗 Links</h2>
          <ul class="plain">${p.links.map((l, i) => `<li><a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.title || l.url)}</a> <button class="icon-btn sm danger" data-rmlink="${i}" aria-label="Quitar link">✕</button></li>`).join('') || '<li class="muted">Sin links</li>'}</ul>
          <form class="add-row" id="link-form">
            <input name="title" placeholder="Nombre (ej: Repositorio)" aria-label="Nombre del link">
            <input name="url" placeholder="https://…" required aria-label="Link">
            <button class="btn sm">Agregar</button>
          </form>
        </section>
        <section class="card">
          <div class="list-head"><h2>📦 Entregas</h2><button class="btn sm" id="p-add-ev">+ Entrega</button></div>
          <div id="p-events" class="ev-list"></div>
        </section>
      </div>
      <section class="card">
        <h2>✅ Tareas</h2>
        <ul class="plain task-list" style="margin-top:.6rem">
          ${p.tasks.map((t) => `<li class="${t.done ? 'done' : ''}">
            <input type="checkbox" data-tdone="${t.id}" ${t.done ? 'checked' : ''} aria-label="Hecha">
            <span class="t-text">${esc(t.text)}</span>
            <select data-towner="${t.id}" aria-label="Responsable"><option value="">— Responsable —</option>${p.members.map((m) => `<option ${m === t.owner ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>
            <button class="icon-btn sm danger" data-trm="${t.id}" aria-label="Borrar tarea">✕</button>
          </li>`).join('') || '<li class="muted">Sin tareas todavía.</li>'}
        </ul>
        <form class="add-row" id="task-form">
          <input name="text" placeholder="Nueva tarea" required aria-label="Nueva tarea">
          <select name="owner" aria-label="Responsable"><option value="">— Responsable —</option>${p.members.map((m) => `<option>${esc(m)}</option>`).join('')}</select>
          <button class="btn sm">Agregar</button>
        </form>
      </section>
    </section>`;

  const v = $('#view');
  renderEventList($('#p-events', v), projectEvents(p), 'Sin entregas. Cargalas y aparecen también en el calendario.');
  $('#p-edit').onclick = () => openProjectForm(p);
  $('#p-add-ev').onclick = () => openEventForm(null, { projectId: p.id, subjectId: p.subjectId, type: 'entregable' });
  $('#link-form').onsubmit = (e) => { e.preventDefault(); const x = e.target.elements; p.links.push({ title: x.title.value.trim(), url: safeUrl(x.url.value) }); Store.save(); rerender(); };
  $$('[data-rmlink]', v).forEach((b) => (b.onclick = () => { p.links.splice(+b.dataset.rmlink, 1); Store.save(); rerender(); }));
  $('#task-form').onsubmit = (e) => { e.preventDefault(); const x = e.target.elements; p.tasks.push({ id: uid(), text: x.text.value.trim(), owner: x.owner.value, done: false }); Store.save(); rerender(); };
  $$('[data-tdone]', v).forEach((c) => (c.onchange = () => { p.tasks.find((t) => t.id === c.dataset.tdone).done = c.checked; Store.save(); rerender(); }));
  $$('[data-towner]', v).forEach((s) => (s.onchange = () => { p.tasks.find((t) => t.id === s.dataset.towner).owner = s.value; Store.save(); }));
  $$('[data-trm]', v).forEach((b) => (b.onclick = () => { p.tasks = p.tasks.filter((t) => t.id !== b.dataset.trm); Store.save(); rerender(); }));
}
