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
        <div class="btn-row"><label class="btn ghost">Importar proyecto<input type="file" id="imp-proj" accept="application/json,.json" hidden></label><button class="btn" id="add-proj">+ Nuevo proyecto</button></div>
      </div>
      ${list.length ? `<div class="grid-3">${list.map((p) => {
        const done = p.tasks.filter((t) => t.done).length;
        const next = projectEvents(p).find((e) => eventDate(e) >= new Date());
        const col = p.subjectId ? subjectColor(p.subjectId) : 'var(--accent)';
        return `<a class="card subj-card" href="#proyecto/${p.id}" style="--c:${col}">
          <div class="subj-card-top"><h3>${esc(p.name)}</h3></div>
          <p class="muted">${p.subjectId ? esc(subjectName(p.subjectId)) : 'Sin materia'} · ${p.members.length} integrantes</p>
          <div class="bar" style="--c:${col}"><span style="width:${p.tasks.length ? (done / p.tasks.length) * 100 : 0}%"></span></div>
          <div class="bar-legend">${done}/${p.tasks.length} tareas hechas</div>
          <p class="next">${next ? `${esc(next.title || typeLabel(next))} · <span class="num" data-countdown="${eventDate(next).getTime()}">${countdown(eventDate(next)).text}</span>` : '<span class="muted">Sin entregas cargadas</span>'}</p>
        </a>`;
      }).join('')}</div>` : `<div class="card empty"><h2>No hay proyectos</h2><p>Creá uno para repartir tareas con tu grupo.</p></div>`}
    </section>`;
  Sloth.paint($('#view'));
  $('#add-proj').onclick = () => openProjectForm();
  $('#imp-proj').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { importProjectPayload(JSON.parse(await f.text())); } catch (err) { toast('Ese archivo no parece un proyecto de Perezoso.'); }
  };
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
          <h1>${esc(p.name)}</h1>
          <p class="muted">${p.subjectId ? `<a href="#materia/${p.subjectId}">${esc(subjectName(p.subjectId))}</a>` : 'Sin materia'} · ${done}/${p.tasks.length} tareas hechas</p>
        </div>
        <div class="hero-actions"><button class="btn" id="p-share">Compartir</button><button class="btn ghost" id="p-edit">✎ Editar</button></div>
      </header>
      <div class="grid-2">
        <section class="card">
          <h2>Integrantes</h2>
          <div class="members">${p.members.map((m) => `<span class="pill">${esc(m)}</span>`).join('') || '<span class="muted">Sin integrantes</span>'}</div>
          <h2 style="margin-top:1.2rem">Links</h2>
          <ul class="plain">${p.links.map((l, i) => `<li><a href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener">${esc(l.title || l.url)}</a> <button class="icon-btn sm danger" data-rmlink="${i}" aria-label="Quitar link">✕</button></li>`).join('') || '<li class="muted">Sin links</li>'}</ul>
          <form class="add-row" id="link-form">
            <input name="title" placeholder="Nombre (ej: Repositorio)" aria-label="Nombre del link">
            <input name="url" placeholder="https://…" required aria-label="Link">
            <button class="btn sm">Agregar</button>
          </form>
        </section>
        <section class="card">
          <div class="list-head"><h2>Entregas</h2><button class="btn sm" id="p-add-ev">+ Entrega</button></div>
          <div id="p-events" class="ev-list"></div>
        </section>
      </div>
      <section class="card">
        <h2>Tareas</h2>
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
  $('#p-share').onclick = () => openShareProject(p);
  $('#p-add-ev').onclick = () => openEventForm(null, { projectId: p.id, subjectId: p.subjectId, type: 'entregable' });
  $('#link-form').onsubmit = (e) => { e.preventDefault(); const x = e.target.elements; p.links.push({ title: x.title.value.trim(), url: safeUrl(x.url.value) }); Store.save(); rerender(); };
  $$('[data-rmlink]', v).forEach((b) => (b.onclick = () => { p.links.splice(+b.dataset.rmlink, 1); Store.save(); rerender(); }));
  $('#task-form').onsubmit = (e) => { e.preventDefault(); const x = e.target.elements; p.tasks.push({ id: uid(), text: x.text.value.trim(), owner: x.owner.value, done: false }); Store.save(); rerender(); };
  $$('[data-tdone]', v).forEach((c) => (c.onchange = () => { p.tasks.find((t) => t.id === c.dataset.tdone).done = c.checked; Store.save(); rerender(); }));
  $$('[data-towner]', v).forEach((s) => (s.onchange = () => { p.tasks.find((t) => t.id === s.dataset.towner).owner = s.value; Store.save(); }));
  $$('[data-trm]', v).forEach((b) => (b.onclick = () => { p.tasks = p.tasks.filter((t) => t.id !== b.dataset.trm); Store.save(); rerender(); }));
}

/* ---------- Compartir e importar proyectos ----------
 * No hay servidor: se comparte una copia (integrantes, tareas, links y entregas)
 * por link, WhatsApp, mail o archivo, y cada persona la importa en su Perezoso.
 */

function projectPayload(p) {
  return {
    v: 1, type: 'perezoso-proyecto', from: Store.data.settings.userName || '',
    project: { name: p.name, members: p.members, links: p.links, tasks: p.tasks.map((t) => ({ text: t.text, owner: t.owner, done: t.done })) },
    subjectName: p.subjectId ? subjectName(p.subjectId) : '',
    events: projectEvents(p).map((e) => ({ type: e.type, customType: e.customType, title: e.title, date: e.date, time: e.time, notes: e.notes })),
  };
}
const toB64 = (str) => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (b64) => decodeURIComponent(escape(atob(b64.replace(/-/g, '+').replace(/_/g, '/'))));

function projectSummary(p) {
  const evs = projectEvents(p);
  return [
    `Proyecto: ${p.name}`,
    p.members.length ? `Integrantes: ${p.members.join(', ')}` : '',
    p.tasks.length ? `Tareas:\n${p.tasks.map((t) => `${t.done ? '[x]' : '[ ]'} ${t.text}${t.owner ? ` (${t.owner})` : ''}`).join('\n')}` : '',
    evs.length ? `Entregas:\n${evs.map((e) => `${fmtDateShort(eventDate(e))}${e.time ? ' ' + e.time : ''} - ${e.title || typeLabel(e)}`).join('\n')}` : '',
    p.links.length ? `Links:\n${p.links.map((l) => `${l.title || ''} ${l.url}`.trim()).join('\n')}` : '',
  ].filter(Boolean).join('\n\n');
}

function openShareProject(p) {
  const web = location.protocol.startsWith('http');
  const link = `${location.origin}${location.pathname}#importar=${toB64(JSON.stringify(projectPayload(p)))}`;
  const text = projectSummary(p);
  Modal.open(`Compartir “${p.name}”`, `
    <div class="form">
      <p class="muted">Mandales una copia del proyecto con integrantes, tareas, links y entregas. Cada persona la guarda en su Perezoso. Ojo: es una copia, los cambios no se sincronizan solos.</p>
      <div class="share-grid">
        ${web ? '<button type="button" class="btn" id="sh-link">Copiar link para importar</button>' : ''}
        ${navigator.share ? '<button type="button" class="btn ghost" id="sh-native">Compartir…</button>' : ''}
        <a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text + (web ? `\n\nPara importarlo en Perezoso: ${link}` : ''))}">WhatsApp</a>
        <a class="btn ghost" href="mailto:?subject=${encodeURIComponent('Proyecto ' + p.name)}&body=${encodeURIComponent(text + (web ? `\n\nPara importarlo en Perezoso: ${link}` : ''))}">Mail</a>
        <button type="button" class="btn ghost" id="sh-file">Descargar archivo</button>
      </div>
      ${web ? '' : '<p class="hint">El link para importar funciona cuando usás Perezoso desde su página web (GitHub Pages). Mientras tanto, podés mandar el archivo: la otra persona lo carga con “Importar proyecto”.</p>'}
    </div>`, (body) => {
    on(body, '#sh-link', 'onclick', () => navigator.clipboard.writeText(link).then(() => toast('Link copiado'), () => toast('No pude copiar el link')));
    on(body, '#sh-native', 'onclick', () => navigator.share({ title: `Proyecto ${p.name}`, text, url: web ? link : undefined }).catch(() => {}));
    on(body, '#sh-file', 'onclick', () => downloadBlob(new Blob([JSON.stringify(projectPayload(p), null, 1)], { type: 'application/json' }), `proyecto-${p.name.replace(/[^\w-]+/g, '-').toLowerCase()}.json`));
  });
}

function importProjectPayload(data) {
  if (!data || data.type !== 'perezoso-proyecto' || !data.project) { toast('Eso no parece un proyecto de Perezoso.'); return; }
  const pr = data.project;
  Modal.open('Importar proyecto', `
    <div class="form">
      <p>${data.from ? `<strong>${esc(data.from)}</strong> te compartió` : 'Te compartieron'} el proyecto <strong>${esc(pr.name)}</strong>: ${(pr.members || []).length} integrantes, ${(pr.tasks || []).length} tareas y ${(data.events || []).length} entregas.</p>
      <div class="form-actions"><span class="grow"></span><button type="button" class="btn ghost" data-close>Cancelar</button><button type="button" class="btn" id="imp-ok">Importar</button></div>
    </div>`, (body) => {
    $('#imp-ok', body).onclick = () => {
      const subj = data.subjectName && Store.data.subjects.find((s) => s.name.toLowerCase() === data.subjectName.toLowerCase());
      const np = {
        id: uid(), name: pr.name, subjectId: subj ? subj.id : '', members: pr.members || [], links: pr.links || [],
        tasks: (pr.tasks || []).map((t) => ({ id: uid(), text: t.text, owner: t.owner || '', done: !!t.done })),
      };
      Store.data.projects.push(np);
      (data.events || []).forEach((e) => Store.data.events.push({ id: uid(), type: e.type || 'entregable', customType: e.customType || '', subjectId: np.subjectId, projectId: np.id, title: e.title || '', date: e.date, time: e.time || '', notes: e.notes || '' }));
      Store.save();
      Modal.close();
      location.hash = `#proyecto/${np.id}`;
    };
  });
}

function checkImportLink() {
  if (!location.hash.startsWith('#importar=')) return false;
  let data = null;
  try { data = JSON.parse(fromB64(location.hash.slice('#importar='.length))); } catch (e) { data = null; }
  history.replaceState(null, '', `${location.pathname}#proyectos`);
  rerender();
  if (data) importProjectPayload(data); else toast('El link del proyecto está incompleto.');
  return true;
}
