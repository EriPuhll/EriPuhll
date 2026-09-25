'use strict';

/* ---------- Calendario: calendario de pruebas + horario de facultad ---------- */

let calCursor = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
const listFilter = { subject: '', type: '', past: false };

const CLASS_KINDS = ['Teórico', 'Práctico', 'Laboratorio', 'Otro'];

function renderCalendar() {
  const mode = Store.data.settings.calMode || 'pruebas';
  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head">
        <div>
          <h1>Calendario</h1>
          <p class="sub">${mode === 'pruebas' ? 'Pruebas, entregas y todo lo que se viene.' : 'Tu semana de clases en la facu.'}</p>
        </div>
        <div class="switch" role="tablist">
          <button role="tab" aria-selected="${mode === 'horario'}" data-mode="horario" class="${mode === 'horario' ? 'on' : ''}">Horario de facultad</button>
          <button role="tab" aria-selected="${mode === 'pruebas'}" data-mode="pruebas" class="${mode === 'pruebas' ? 'on' : ''}">Calendario de pruebas</button>
        </div>
      </div>
      <div id="cal-content"></div>
    </section>`;
  $$('.switch button').forEach((b) => (b.onclick = () => {
    Store.data.settings.calMode = b.dataset.mode;
    Store.save();
    renderCalendar();
  }));
  if (mode === 'pruebas') renderExams($('#cal-content'));
  else renderTimetable($('#cal-content'));
}

/* ===== Calendario de pruebas ===== */

function chipHtml(ev) {
  const t = eventType(ev);
  const subj = ev.subjectId ? subjectName(ev.subjectId) : '';
  const cd = countdown(eventDate(ev));
  return `<button class="chip ${cd.level === 'urgent' && !ev.done ? 'near' : ''} ${ev.done ? 'done' : ''}" data-ev="${ev.id}" style="--c:${subjectColor(ev.subjectId)}"
      title="${esc(`${typeLabel(ev)}${subj ? ' · ' + subj : ''}${ev.title ? ' · ' + ev.title : ''}${ev.time ? ' · ' + ev.time : ''}`)}">
      <span class="chip-t">${ev.done ? '✓ ' : ''}${esc(typeLabel(ev))}${subj ? ` <small>${esc(subj)}</small>` : ''}</span>
    </button>`;
}

function renderExams(el) {
  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  const today = toISODate(new Date());
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const weeks = Math.ceil((offset + dim) / 7);
  const byDate = groupEventsByDate();
  const crit = criticalWeeks();

  let cells = '';
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(y, m, 1 - offset + i);
    const iso = toISODate(d);
    const wk = toISODate(startOfWeek(d));
    const evs = byDate[iso] || [];
    cells += `
      <div class="day ${d.getMonth() !== m ? 'out' : ''} ${iso === today ? 'today' : ''} ${crit[wk] ? 'crit' : ''}" data-date="${iso}">
        <span class="dnum">${d.getDate()}</span>
        ${crit[wk] && i % 7 === 0 ? `<span class="crit-tag" title="${crit[wk]} pruebas esta semana">Semana crítica</span>` : ''}
        <div class="chips">${evs.map(chipHtml).join('')}</div>
      </div>`;
  }
  const monthCrit = Object.keys(crit).filter((k) => { const d = parseDate(k); const e = new Date(d); e.setDate(e.getDate() + 6); return e >= first && d <= new Date(y, m, dim); });

  el.innerHTML = `
    <div class="card toolbar">
      <div class="month-nav">
        <button class="icon-btn" data-nav="-1" aria-label="Mes anterior">‹</button>
        <h2>${MONTHS[m]} ${y}</h2>
        <button class="icon-btn" data-nav="1" aria-label="Mes siguiente">›</button>
        <button class="btn ghost sm" data-nav="0">Hoy</button>
      </div>
      <div class="actions">
        <button class="btn" id="add-ev">+ Nuevo evento</button>
        <button class="btn ghost" id="pdf">⬇ PDF</button>
        <button class="btn ghost" id="ics" title="Para importar en Google Calendar o el celular">Exportar .ics</button>
      </div>
    </div>
    ${monthCrit.length ? `<div class="alert warn"><span><strong>Semana crítica:</strong> ${monthCrit.map((k) => `semana del ${fmtDateShort(parseDate(k))} (${crit[k]} pruebas)`).join(', ')}. Organizate con tiempo.</span></div>` : ''}
    <div class="card month">
      <div class="dow">${DAYS_SHORT.map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="grid">${cells}</div>
    </div>
    <section class="card">
      <div class="list-head">
        <h2>Lo que se viene</h2>
        <div class="filters">
          <select id="f-subj" aria-label="Filtrar por materia"><option value="">Todas las materias</option>${subjectOptions(listFilter.subject)}</select>
          <select id="f-type" aria-label="Filtrar por tipo"><option value="">Todos los tipos</option>
            ${EVENT_TYPES.map((t) => `<option value="${t.id}" ${t.id === listFilter.type ? 'selected' : ''}>${t.label}</option>`).join('')}</select>
          <label class="check"><input type="checkbox" id="f-past" ${listFilter.past ? 'checked' : ''}> Ver pasados</label>
        </div>
      </div>
      <div id="ev-list" class="ev-list"></div>
    </section>`;

  $$('[data-nav]', el).forEach((b) => (b.onclick = () => {
    const n = +b.dataset.nav;
    if (n === 0) { const d = new Date(); calCursor = new Date(d.getFullYear(), d.getMonth(), 1); }
    else calCursor = new Date(y, m + n, 1);
    renderExams(el);
  }));
  const thisMonth = m === new Date().getMonth() && y === new Date().getFullYear();
  $('#add-ev', el).onclick = () => openEventForm(null, { date: thisMonth ? today : toISODate(first) });
  $('#pdf', el).onclick = downloadMonthPDF;
  $('#ics', el).onclick = exportICS;
  $$('.day', el).forEach((c) => (c.onclick = (e) => {
    const chip = e.target.closest('.chip');
    if (chip) openEventForm(Store.data.events.find((x) => x.id === chip.dataset.ev));
    else openEventForm(null, { date: c.dataset.date });
  }));
  $('#f-subj', el).onchange = (e) => { listFilter.subject = e.target.value; paintList(); };
  $('#f-type', el).onchange = (e) => { listFilter.type = e.target.value; paintList(); };
  $('#f-past', el).onchange = (e) => { listFilter.past = e.target.checked; paintList(); };

  function paintList() {
    const now = new Date();
    const evs = Store.data.events
      .filter((ev) => (!listFilter.subject || ev.subjectId === listFilter.subject)
        && (!listFilter.type || ev.type === listFilter.type)
        && (listFilter.past || eventDate(ev) >= now || daysUntil(ev.date) === 0))
      .sort(byEventDate);
    renderEventList($('#ev-list', el), evs, listFilter.past ? 'No hay eventos con esos filtros.' : 'No tenés nada pendiente. Disfrutá (como un perezoso). ');
  }
  paintList();
}

// Eventos con la lista de "cosas a hacer" abierta (se mantiene al redibujar)
const openTodoLists = new Set();
const CHECK_SVG = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function todoListHTML(ev, prefix = '') {
  const todos = ev.todos || [];
  return `<ul class="todo-list">${todos.map((t) => `
      <li class="${t.done ? 'done' : ''}">
        <label><input type="checkbox" data-${prefix}t="${t.id}" ${t.done ? 'checked' : ''}><span>${esc(t.text)}</span></label>
        <button type="button" class="icon-btn sm ghosty" data-${prefix}tdel="${t.id}" title="Borrar" aria-label="Borrar “${esc(t.text)}”">✕</button>
      </li>`).join('')}</ul>
    <div class="todo-add">
      <input data-${prefix}tadd placeholder="Agregar algo para hacer…" aria-label="Nueva cosa para hacer" maxlength="140">
      <button type="button" class="btn sm" data-${prefix}tbtn>Agregar</button>
    </div>`;
}

// Cambios en una lista de cosas a hacer (se usa en la lista y en el formulario)
function bindTodoEditor(root, list, onChange, prefix = '') {
  const input = $(`[data-${prefix}tadd]`, root);
  const add = () => {
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    list.push({ id: uid(), text, done: false });
    onChange(true);
  };
  $(`[data-${prefix}tbtn]`, root).onclick = add;
  input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } };
  $$(`[data-${prefix}t]`, root).forEach((c) => (c.onchange = () => {
    const t = list.find((x) => x.id === c.getAttribute(`data-${prefix}t`));
    if (t) t.done = c.checked;
    if (c.checked && list.length && list.every((x) => x.done)) toast('¡Lista completa!');
    onChange(false);
  }));
  $$(`[data-${prefix}tdel]`, root).forEach((b) => (b.onclick = () => {
    const i = list.findIndex((x) => x.id === b.getAttribute(`data-${prefix}tdel`));
    if (i >= 0) list.splice(i, 1);
    onChange(false);
  }));
}

function setEventDone(ev, done) {
  ev.done = done;
  Store.save();
  if (done) Sloth.react('hecho', { evento: typeLabel(ev) }, { proud: true });
  else toast('Marcado como pendiente');
  rerender();
}

function renderEventList(container, evs, emptyMsg) {
  if (!evs.length) {
    container.innerHTML = `<div class="empty small"><p>${esc(emptyMsg)}</p></div>`;
    Sloth.paint(container);
    return;
  }
  container.innerHTML = evs.map((ev) => {
    const d = eventDate(ev);
    const cd = countdown(d);
    const proj = ev.projectId && projectById(ev.projectId);
    const todos = ev.todos || [];
    const nDone = todos.filter((t) => t.done).length;
    const open = openTodoLists.has(ev.id);
    return `
      <div class="ev-item ${ev.done ? 'is-done' : ''}">
        <article class="ev-row" data-ev="${ev.id}" data-level="${ev.done ? 'done' : cd.level}" style="--c:${subjectColor(ev.subjectId)}" tabindex="0" aria-label="${esc(typeLabel(ev))}: abrir para editar">
          <button type="button" class="ev-check ${ev.done ? 'on' : ''}" data-done="${ev.id}" aria-pressed="${!!ev.done}" title="${ev.done ? 'Hecho. Tocá para marcarlo pendiente' : 'Marcar como hecho'}" aria-label="${ev.done ? 'Hecho' : 'Marcar como hecho'}">${CHECK_SVG}</button>
          <div class="ev-date"><strong>${d.getDate()}</strong><span>${MONTHS[d.getMonth()].slice(0, 3)}</span></div>
          <div class="ev-main">
            <div class="ev-type">${esc(typeLabel(ev))}</div>
            <div class="ev-subj"><span class="dot"></span>${esc(subjectName(ev.subjectId))}${proj ? ` · ${esc(proj.name)}` : ''}</div>
            ${ev.title ? `<div class="ev-title">${esc(ev.title)}</div>` : ''}
            <div class="ev-when">${fmtDateShort(d)} · ${ev.time || 'hora a confirmar'}</div>
            <button type="button" class="ev-todo-chip ${todos.length && nDone === todos.length ? 'full' : ''}" data-todos="${ev.id}" aria-expanded="${open}">
              ${todos.length ? `${nDone} de ${todos.length} cosas hechas` : '+ Cosas a hacer'} <span aria-hidden="true">${open ? '▴' : '▾'}</span></button>
          </div>
          ${ev.done
            ? '<div class="countdown" data-level="done">Hecho</div>'
            : `<div class="countdown" data-countdown="${d.getTime()}" data-level="${cd.level}" title="Cuánto falta">${cd.text}</div>`}
        </article>
        ${open ? `<div class="ev-todos" data-todo-box="${ev.id}">${todoListHTML(ev)}</div>` : ''}
      </div>`;
  }).join('');
  const redraw = () => renderEventList(container, evs, emptyMsg);
  const find = (id) => Store.data.events.find((x) => x.id === id);
  $$('.ev-row', container).forEach((r) => {
    const open = () => openEventForm(find(r.dataset.ev));
    r.onclick = (e) => { if (!e.target.closest('button')) open(); };
    r.onkeydown = (e) => { if (e.target === r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(); } };
  });
  $$('[data-done]', container).forEach((b) => (b.onclick = () => { const ev = find(b.dataset.done); if (ev) setEventDone(ev, !ev.done); }));
  $$('[data-todos]', container).forEach((b) => (b.onclick = () => {
    const id = b.dataset.todos;
    if (openTodoLists.has(id)) openTodoLists.delete(id); else openTodoLists.add(id);
    redraw();
    const inp = $(`[data-todo-box="${id}"] [data-tadd]`, container);
    if (inp && !(find(id).todos || []).length) inp.focus();
  }));
  $$('[data-todo-box]', container).forEach((box) => {
    const ev = find(box.dataset.todoBox);
    if (!ev) return;
    ev.todos = ev.todos || [];
    bindTodoEditor(box, ev.todos, (added) => {
      Store.save();
      redraw();
      if (added) { const inp = $(`[data-todo-box="${ev.id}"] [data-tadd]`, container); if (inp) inp.focus(); }
    });
  });
}

function openEventForm(ev, preset = {}) {
  const isNew = !ev;
  const data = ev ? { ...ev, todos: (ev.todos || []).map((t) => ({ ...t })) } : {
    id: uid(), type: preset.type || 'parcial', customType: '', subjectId: preset.subjectId || '', projectId: preset.projectId || '',
    title: '', date: preset.date || toISODate(new Date()), time: '', notes: '', done: false, todos: [],
  };
  const projOpts = Store.data.projects.map((p) => `<option value="${p.id}" ${p.id === data.projectId ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  Modal.open(isNew ? 'Nuevo evento' : 'Editar evento', `
    <form class="form" id="ev-form">
      <label>Tipo de evento
        <select name="type">${EVENT_TYPES.map((t) => `<option value="${t.id}" ${t.id === data.type ? 'selected' : ''}>${t.label}</option>`).join('')}</select>
      </label>
      <label class="custom-type" ${data.type === 'otro' ? '' : 'hidden'}>¿Qué es?
        <input name="customType" value="${esc(data.customType)}" placeholder="Ej: Defensa oral, tutoría, feria…">
      </label>
      <div class="row">
        <label>Materia<select name="subjectId">${subjectOptions(data.subjectId, { allowEmpty: true })}</select></label>
        <label>Proyecto <span class="opt">(opcional)</span><select name="projectId"><option value="">— Ninguno —</option>${projOpts}</select></label>
      </div>
      <label>Título <input name="title" value="${esc(data.title)}" placeholder="Ej: Parcial 1 — unidades 1 a 3"></label>
      <div class="row">
        <label>Fecha<input type="date" name="date" required value="${data.date}"></label>
        <label>Hora <span class="opt">(opcional)</span><input type="time" name="time" value="${data.time || ''}"></label>
      </div>
      <label>Notas <span class="opt">(opcional)</span>
        <textarea name="notes" rows="3" placeholder="Salón, qué entra, qué llevar…">${esc(data.notes)}</textarea>
      </label>
      <fieldset class="todo-field"><legend>Cosas a hacer <span class="opt">(opcional)</span></legend><div id="ev-todo-edit"></div></fieldset>
      <label class="check"><input type="checkbox" name="done" ${data.done ? 'checked' : ''}> Ya está hecho</label>
      <div class="form-actions">
        ${isNew ? '' : '<button type="button" class="btn danger ghost" id="ev-del">Eliminar</button>'}
        <span class="grow"></span>
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button class="btn">Guardar</button>
      </div>
    </form>`, (body) => {
    const f = $('#ev-form', body);
    const el = f.elements;
    const todoBox = $('#ev-todo-edit', f);
    const paintTodos = (focus) => {
      todoBox.innerHTML = todoListHTML(data, 'f');
      bindTodoEditor(todoBox, data.todos, paintTodos, 'f');
      if (focus) $('[data-ftadd]', todoBox).focus();
    };
    paintTodos(false);
    el.type.onchange = () => { $('.custom-type', f).hidden = el.type.value !== 'otro'; };
    el.projectId.onchange = () => {
      const p = projectById(el.projectId.value);
      if (p && p.subjectId && !el.subjectId.value) el.subjectId.value = p.subjectId;
    };
    f.onsubmit = (e) => {
      e.preventDefault();
      if (el.type.value === 'otro' && !el.customType.value.trim()) { toast('Contá qué tipo de evento es '); el.customType.focus(); return; }
      const changedDate = !isNew && (ev.date !== el.date.value);
      Object.assign(data, {
        type: el.type.value,
        customType: el.type.value === 'otro' ? el.customType.value.trim() : '',
        subjectId: el.subjectId.value,
        projectId: el.projectId.value,
        title: el.title.value.trim(),
        date: el.date.value,
        time: el.time.value,
        notes: el.notes.value.trim(),
        done: el.done.checked,
      });
      const pending = $('[data-ftadd]', f).value.trim();
      if (pending) data.todos.push({ id: uid(), text: pending, done: false });
      if (isNew) Store.data.events.push(data);
      else Object.assign(ev, data);
      if (changedDate) delete Store.data.remindersSent[data.id];
      Store.save();
      Modal.close();
      toast(isNew ? 'Evento agregado ' : 'Evento actualizado');
      rerender();
      Sloth.paint();
    };
    const del = $('#ev-del', f);
    if (del) del.onclick = () => {
      if (!confirm('¿Eliminar este evento?')) return;
      Store.data.events = Store.data.events.filter((x) => x.id !== ev.id);
      delete Store.data.remindersSent[ev.id];
      Store.save();
      Modal.close();
      toast('Evento eliminado');
      rerender();
    };
  });
}

/* ===== Exportar .ics (Google Calendar, celular) ===== */

function icsEscape(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
function icsDate(d) { return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; }
function icsDateTime(d) { return `${icsDate(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`; }

function exportICS() {
  const evs = Store.data.events.slice().sort(byEventDate);
  if (!evs.length) { toast('No hay eventos para exportar.'); return; }
  const stamp = new Date();
  const utc = `${stamp.getUTCFullYear()}${pad(stamp.getUTCMonth() + 1)}${pad(stamp.getUTCDate())}T${pad(stamp.getUTCHours())}${pad(stamp.getUTCMinutes())}00Z`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Perezoso//Organizador semestral//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Pruebas del semestre'];
  for (const ev of evs) {
    const d = eventDate(ev);
    const subj = ev.subjectId ? subjectName(ev.subjectId) : '';
    lines.push('BEGIN:VEVENT', `UID:${ev.id}@perezoso`, `DTSTAMP:${utc}`);
    if (ev.time) {
      const end = new Date(d.getTime() + 2 * 36e5);
      lines.push(`DTSTART:${icsDateTime(d)}`, `DTEND:${icsDateTime(end)}`);
    } else {
      const next = new Date(d); next.setDate(next.getDate() + 1);
      lines.push(`DTSTART;VALUE=DATE:${icsDate(d)}`, `DTEND;VALUE=DATE:${icsDate(next)}`);
    }
    lines.push(`SUMMARY:${icsEscape(`${typeLabel(ev)}${subj ? ' - ' + subj : ''}${ev.title ? ': ' + ev.title : ''}`)}`);
    if (ev.notes) lines.push(`DESCRIPTION:${icsEscape(ev.notes)}`);
    (Store.data.settings.reminderDays || []).forEach((n) => {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(typeLabel(ev))}`, `TRIGGER:-P${n}D`, 'END:VALARM');
    });
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  downloadBlob(new Blob([lines.join('\r\n')], { type: 'text/calendar' }), 'pruebas-semestre.ics');
  toast('Calendario exportado. Abrilo o importalo en Google Calendar ');
}

/* ===== PDF ===== */

function fitText(doc, txt, w) {
  if (doc.getTextWidth(txt) <= w) return txt;
  while (txt.length > 1 && doc.getTextWidth(txt + '...') > w) txt = txt.slice(0, -1);
  return txt + '...';
}

function pdfOrPrint() {
  const J = window.jspdf && window.jspdf.jsPDF;
  if (!J) {
    toast('No pude cargar el generador de PDF. Abro la impresión: elegí "Guardar como PDF".');
    setTimeout(() => window.print(), 600);
    return null;
  }
  return new J({ orientation: 'landscape', unit: 'mm', format: 'a4' });
}

function pdfHeader(doc, title) {
  const W = 297, M = 10;
  const acc = hexToRgb(Store.data.settings.theme.accent || DEFAULT_ACCENT);
  doc.setFillColor(...acc);
  doc.rect(0, 0, W, 16, 'F');
  doc.setTextColor(...(isLight(acc) ? [40, 30, 50] : [255, 255, 255]));
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(title, M, 10.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('Perezoso - organizador semestral', W - M, 10.5, { align: 'right' });
  return acc;
}

function downloadMonthPDF() {
  const doc = pdfOrPrint();
  if (!doc) return;
  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  const W = 297, H = 210, M = 10;
  const acc = pdfHeader(doc, `Calendario de pruebas - ${MONTHS[m]} ${y}`);

  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const weeks = Math.ceil((offset + dim) / 7);
  const top = 21, headH = 6, cw = (W - 2 * M) / 7, ch = (H - top - M - headH) / weeks;
  const byDate = groupEventsByDate();
  const crit = criticalWeeks();

  doc.setTextColor(90, 80, 100); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  DAYS.forEach((d, i) => doc.text(d, M + i * cw + cw / 2, top + 4, { align: 'center' }));
  doc.setDrawColor(220, 212, 196); doc.setLineWidth(0.2);

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(y, m, 1 - offset + i);
    const x = M + (i % 7) * cw, yy = top + headH + Math.floor(i / 7) * ch;
    const out = d.getMonth() !== m;
    const isCrit = crit[toISODate(startOfWeek(d))];
    doc.setFillColor(...(out ? [245, 242, 236] : isCrit ? [253, 238, 241] : [255, 255, 255]));
    doc.rect(x, yy, cw, ch, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.setTextColor(...(out ? [180, 172, 160] : [60, 55, 70]));
    doc.text(String(d.getDate()), x + 1.8, yy + 4);
    if (isCrit && i % 7 === 0) { doc.setTextColor(200, 60, 90); doc.setFontSize(6); doc.text('SEMANA CRITICA', x + cw - 1.5, yy + 3.6, { align: 'right' }); }

    const evs = byDate[toISODate(d)] || [];
    const lineH = 3.8;
    const maxLines = Math.max(1, Math.floor((ch - 6) / lineH));
    const shown = evs.length > maxLines ? evs.slice(0, maxLines - 1) : evs;
    shown.forEach((ev, k) => {
      const ly = yy + 5.5 + k * lineH;
      const c = hexToRgb(subjectColor(ev.subjectId));
      doc.setFillColor(...c);
      doc.roundedRect(x + 1.2, ly, cw - 2.4, lineH - 0.6, 0.8, 0.8, 'F');
      doc.setTextColor(...(isLight(c) ? [40, 30, 50] : [255, 255, 255]));
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.3);
      const subj = ev.subjectId ? ` - ${subjectName(ev.subjectId)}` : '';
      doc.text(fitText(doc, `${ev.time ? ev.time + ' ' : ''}${typeLabel(ev)}${subj}`, cw - 3.6), x + 2, ly + 2.3);
    });
    if (evs.length > shown.length) {
      doc.setTextColor(120, 110, 130); doc.setFontSize(6);
      doc.text(`+${evs.length - shown.length} más`, x + 2, yy + 5.5 + shown.length * lineH + 2.3);
    }
  }

  // Lista de eventos del mes con cuenta regresiva
  const list = Store.data.events
    .filter((e) => { const d = parseDate(e.date); return d.getFullYear() === y && d.getMonth() === m; })
    .sort(byEventDate);
  doc.addPage();
  pdfHeader(doc, `Eventos de ${MONTHS[m]} ${y}`);
  const cols = [
    { t: 'Fecha', w: 32 }, { t: 'Hora', w: 16 }, { t: 'Tipo', w: 46 },
    { t: 'Materia', w: 58 }, { t: 'Título', w: 80 }, { t: 'Cuánto falta', w: 45 },
  ];
  let cy = 26;
  const drawHead = () => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(90, 80, 100);
    let cx = M + 5;
    cols.forEach((c) => { doc.text(c.t, cx, cy); cx += c.w; });
    doc.setDrawColor(...acc); doc.setLineWidth(0.5); doc.line(M, cy + 2, W - M, cy + 2);
    cy += 8;
  };
  drawHead();
  if (!list.length) {
    doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 110, 130);
    doc.text('No hay eventos este mes.', M + 5, cy);
  }
  list.forEach((ev, i) => {
    if (cy > H - M - 4) { doc.addPage(); pdfHeader(doc, `Eventos de ${MONTHS[m]} ${y} (cont.)`); cy = 26; drawHead(); }
    const d = eventDate(ev);
    if (i % 2 === 0) { doc.setFillColor(248, 245, 238); doc.rect(M, cy - 5, W - 2 * M, 8, 'F'); }
    doc.setFillColor(...hexToRgb(subjectColor(ev.subjectId)));
    doc.roundedRect(M + 1, cy - 3.6, 2.4, 5, 0.8, 0.8, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(50, 45, 60);
    const cd = countdown(d);
    const vals = [fmtDateShort(d), ev.time || '-', typeLabel(ev), subjectName(ev.subjectId), ev.title || '', cd.text];
    let cx = M + 5;
    vals.forEach((v, k) => {
      if (k === 5) doc.setTextColor(...(cd.past ? [150, 140, 155] : cd.level === 'urgent' ? [200, 60, 80] : acc));
      doc.text(fitText(doc, v, cols[k].w - 3), cx, cy);
      cx += cols[k].w;
    });
    cy += 8;
  });

  doc.save(`calendario-pruebas-${y}-${pad(m + 1)}.pdf`);
  toast('PDF descargado ');
}

function downloadTimetablePDF() {
  const doc = pdfOrPrint();
  if (!doc) return;
  const W = 297, H = 210, M = 10;
  pdfHeader(doc, 'Horario de facultad');
  const { minH, maxH } = timetableRange();
  const top = 22, headH = 7, hourW = 14;
  const cw = (W - 2 * M - hourW) / 6;
  const hh = (H - top - M - headH) / (maxH - minH);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(90, 80, 100);
  DAYS.slice(0, 6).forEach((d, i) => doc.text(d, M + hourW + i * cw + cw / 2, top + 4.5, { align: 'center' }));
  doc.setDrawColor(225, 218, 205); doc.setLineWidth(0.2);
  for (let h = minH; h <= maxH; h++) {
    const yy = top + headH + (h - minH) * hh;
    doc.line(M + hourW, yy, W - M, yy);
    if (h < maxH) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(140, 130, 150); doc.text(`${pad(h)}:00`, M + hourW - 1.5, yy + 2.5, { align: 'right' }); }
  }
  for (let i = 0; i <= 6; i++) doc.line(M + hourW + i * cw, top + headH, M + hourW + i * cw, top + headH + (maxH - minH) * hh);
  activeClasses().filter((c) => +c.day <= 6).forEach((c) => {
    const x = M + hourW + (c.day - 1) * cw + 0.8;
    const y0 = top + headH + ((toMin(c.start) / 60) - minH) * hh;
    const h = ((toMin(c.end) - toMin(c.start)) / 60) * hh;
    const col = hexToRgb(subjectColor(c.subjectId));
    doc.setFillColor(...col);
    doc.roundedRect(x, y0 + 0.4, cw - 1.6, h - 0.8, 1.2, 1.2, 'F');
    doc.setTextColor(...(isLight(col) ? [40, 30, 50] : [255, 255, 255]));
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text(fitText(doc, subjectName(c.subjectId), cw - 4), x + 1.5, y0 + 4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    if (h > 7) doc.text(`${c.start}-${c.end}`, x + 1.5, y0 + 7.2);
    if (h > 10) doc.text(fitText(doc, `${c.kind}${c.room ? ' - ' + c.room : ''}`, cw - 4), x + 1.5, y0 + 10.2);
  });
  doc.save('horario-facultad.pdf');
  toast('PDF del horario descargado ');
}

/* ===== Horario de facultad ===== */

function timetableRange() {
  let minH = 7, maxH = 23;
  activeClasses().forEach((c) => { minH = Math.min(minH, Math.floor(toMin(c.start) / 60)); maxH = Math.max(maxH, Math.ceil(toMin(c.end) / 60)); });
  return { minH, maxH };
}

// Huecos de al menos 45 min entre clases del mismo día
function freeGaps(day) {
  const cls = activeClasses().filter((c) => +c.day === day).sort((a, b) => toMin(a.start) - toMin(b.start));
  const gaps = [];
  for (let i = 1; i < cls.length; i++) {
    const prevEnd = Math.max(...cls.slice(0, i).map((c) => toMin(c.end)));
    const next = toMin(cls[i].start);
    if (next - prevEnd >= 45) gaps.push([prevEnd, next]);
  }
  return gaps;
}

function renderTimetable(el) {
  const classes = activeClasses();
  if (!Store.data.subjects.length) {
    el.innerHTML = `<div class="card empty">
      <h2>Primero creá una materia</h2><p>Después vas a poder cargar tus horarios de clase acá.</p>
      <a class="btn" href="#materias">Ir a Materias</a></div>`;
    Sloth.paint(el);
    return;
  }
  const showFree = Store.data.settings.showFreeTime !== false;
  const nDays = 6;
  const { minH, maxH } = timetableRange();
  const PX = 46;
  const now = new Date();
  const todayIdx = ((now.getDay() + 6) % 7) + 1;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const pos = (min) => ((min - minH * 60) / 60) * PX;

  let hours = '';
  for (let h = minH; h < maxH; h++) hours += `<span style="top:${(h - minH) * PX}px">${pad(h)}:00</span>`;

  let cols = '';
  for (let d = 1; d <= nDays; d++) {
    const blocks = classes.filter((c) => +c.day === d).map((c) => {
      const h = Math.max(22, pos(toMin(c.end)) - pos(toMin(c.start)));
      return `<button class="block" data-cl="${c.id}" style="top:${pos(toMin(c.start))}px;height:${h}px;--c:${subjectColor(c.subjectId)}">
          <strong>${esc(subjectName(c.subjectId))}</strong>
          <span>${c.start}–${c.end}</span>
          <span>${esc(c.kind)}${c.room ? ' · ' + esc(c.room) : ''}</span>
        </button>`;
    }).join('');
    const free = showFree ? freeGaps(d).map(([a, b]) => `<div class="free" style="top:${pos(a) + 3}px;height:${pos(b) - pos(a) - 6}px" title="Tiempo libre entre clases">${fmtHM(b - a)} libres para estudiar</div>`).join('') : '';
    const nowLine = d === todayIdx && nowMin >= minH * 60 && nowMin <= maxH * 60 ? `<div class="now-line" style="top:${pos(nowMin)}px"></div>` : '';
    cols += `<div class="tt-col ${d === todayIdx ? 'today' : ''}"><div class="tt-day">${DAYS[d - 1]}</div>
      <div class="tt-body" style="height:${(maxH - minH) * PX}px;--px:${PX}px">${free}${blocks}${nowLine}</div></div>`;
  }

  const todays = classes.filter((c) => +c.day === todayIdx).sort((a, b) => toMin(a.start) - toMin(b.start));

  el.innerHTML = `
    <div class="card toolbar">
      <label class="check"><input type="checkbox" id="free-toggle" ${showFree ? 'checked' : ''}> Resaltar tiempo libre para estudiar</label>
      <div class="actions">
        <button class="btn" id="add-cl">+ Agregar clase</button>
        <button class="btn ghost" id="tt-pdf">⬇ PDF</button>
      </div>
    </div>
    <div class="card today-strip">
      <strong>Hoy, ${DAYS[todayIdx - 1].toLowerCase()}:</strong>
      ${todays.length ? todays.map((c) => `<span class="pill" style="--c:${subjectColor(c.subjectId)}">${c.start} ${esc(subjectName(c.subjectId))}${c.room ? ' · ' + esc(c.room) : ''}</span>`).join('') : '<span class="muted">no tenés clases. </span>'}
    </div>
    <div class="card timetable">
      <div class="tt-scroll">
        <div class="tt" style="--days:${nDays}">
          <div class="tt-hours"><div class="tt-day">&nbsp;</div><div class="tt-hbody" style="height:${(maxH - minH) * PX}px">${hours}</div></div>
          ${cols}
        </div>
      </div>
    </div>
    ${classes.length ? '' : '<p class="hint">Todavía no cargaste clases. Tocá “+ Agregar clase”.</p>'}`;

  $('#add-cl', el).onclick = () => openClassForm();
  $('#tt-pdf', el).onclick = downloadTimetablePDF;
  $('#free-toggle', el).onchange = (e) => { Store.data.settings.showFreeTime = e.target.checked; Store.save(); renderTimetable(el); };
  $$('.block', el).forEach((b) => (b.onclick = () => openClassForm(Store.data.classes.find((c) => c.id === b.dataset.cl))));
}

function openClassForm(cl, preset = {}) {
  if (!Store.data.subjects.length) { toast('Primero creá una materia.'); return; }
  const isNew = !cl;
  const data = cl ? { ...cl } : { id: uid(), subjectId: preset.subjectId || Store.data.subjects[0].id, day: preset.day || 1, start: '08:00', end: '10:00', kind: 'Teórico', room: '' };
  Modal.open(isNew ? 'Nueva clase' : 'Editar clase', `
    <form class="form" id="cl-form">
      <label>Materia<select name="subjectId" required>${subjectOptions(data.subjectId)}</select></label>
      <label>Día<select name="day">${DAYS.slice(0, 6).map((d, i) => `<option value="${i + 1}" ${+data.day === i + 1 ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
      <div class="row">
        <label>Desde<input type="time" name="start" required value="${data.start}"></label>
        <label>Hasta<input type="time" name="end" required value="${data.end}"></label>
      </div>
      <div class="row">
        <label>Clases desde<input type="date" name="courseStart" value="${(subjectById(data.subjectId) || {}).courseStart || Store.data.settings.semesterStart}"></label>
        <label>Hasta<input type="date" name="courseEnd" value="${(subjectById(data.subjectId) || {}).courseEnd || Store.data.settings.semesterEnd}"></label>
      </div>
      <p class="hint">Las fechas son de la materia: cuando termina el cursado, su horario deja de aparecer (la materia sigue en Materias).</p>
      <div class="row">
        <label>Tipo de clase<select name="kind">${CLASS_KINDS.map((k) => `<option ${k === data.kind ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label>Salón <span class="opt">(opcional)</span><input name="room" value="${esc(data.room)}" placeholder="Ej: 501, Anfiteatro"></label>
      </div>
      <div class="form-actions">
        ${isNew ? '' : '<button type="button" class="btn danger ghost" id="cl-del">Eliminar</button>'}
        <span class="grow"></span>
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button class="btn">Guardar</button>
      </div>
    </form>`, (body) => {
    const f = $('#cl-form', body);
    const el = f.elements;
    el.subjectId.onchange = () => {
      const subj = subjectById(el.subjectId.value) || {};
      el.courseStart.value = subj.courseStart || Store.data.settings.semesterStart;
      el.courseEnd.value = subj.courseEnd || Store.data.settings.semesterEnd;
    };
    f.onsubmit = (e) => {
      e.preventDefault();
      if (toMin(el.end.value) <= toMin(el.start.value)) { toast('La hora de fin tiene que ser después del inicio.'); return; }
      if (el.courseStart.value && el.courseEnd.value && el.courseEnd.value < el.courseStart.value) { toast('La fecha de fin tiene que ser después del inicio.'); return; }
      Object.assign(data, { subjectId: el.subjectId.value, day: +el.day.value, start: el.start.value, end: el.end.value, kind: el.kind.value, room: el.room.value.trim() });
      const subj = subjectById(data.subjectId);
      if (subj) { subj.courseStart = el.courseStart.value; subj.courseEnd = el.courseEnd.value; }
      if (isNew) Store.data.classes.push(data);
      else Object.assign(cl, data);
      Store.save();
      Modal.close();
      toast(isNew ? 'Clase agregada' : 'Clase actualizada');
      rerender();
    };
    const del = $('#cl-del', f);
    if (del) del.onclick = () => {
      if (!confirm('¿Eliminar esta clase del horario?')) return;
      Store.data.classes = Store.data.classes.filter((c) => c.id !== cl.id);
      Store.save();
      Modal.close();
      rerender();
    };
  });
}
