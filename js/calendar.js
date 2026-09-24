'use strict';

/* ---------- Calendario: horario de facultad + calendario de pruebas ---------- */

let calCursor = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
const listFilter = { subject: '', type: '', past: false };

const CLASS_KINDS = ['Teórico', 'Práctico', 'Laboratorio', 'Consulta', 'Taller', 'Otro'];

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
          <button role="tab" data-mode="horario" class="${mode === 'horario' ? 'on' : ''}">🏫 Horario de facultad</button>
          <button role="tab" data-mode="pruebas" class="${mode === 'pruebas' ? 'on' : ''}">📝 Calendario de pruebas</button>
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
  return `<button class="chip" data-ev="${ev.id}" style="--c:${subjectColor(ev.subjectId)}"
      title="${esc(`${typeLabel(ev)}${subj ? ' · ' + subj : ''}${ev.time ? ' · ' + ev.time : ''}`)}">
      <span class="chip-ic">${t.icon}</span><span class="chip-t">${esc(typeLabel(ev))}${subj ? ` <small>${esc(subj)}</small>` : ''}</span>
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

  let cells = '';
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(y, m, 1 - offset + i);
    const iso = toISODate(d);
    const evs = byDate[iso] || [];
    cells += `
      <div class="day ${d.getMonth() !== m ? 'out' : ''} ${iso === today ? 'today' : ''}" data-date="${iso}">
        <span class="num">${d.getDate()}</span>
        <div class="chips">${evs.map(chipHtml).join('')}</div>
      </div>`;
  }

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
        <button class="btn ghost" id="pdf">⬇ Descargar PDF</button>
      </div>
    </div>
    <div class="card month">
      <div class="dow">${DAYS_SHORT.map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="grid" style="--weeks:${weeks}">${cells}</div>
    </div>
    <p class="hint">Tocá un día para agregar un evento ese día.</p>
    <section class="card">
      <div class="list-head">
        <h2>Lo que se viene</h2>
        <div class="filters">
          <select id="f-subj" aria-label="Filtrar por materia"><option value="">Todas las materias</option>${subjectOptions(listFilter.subject)}</select>
          <select id="f-type" aria-label="Filtrar por tipo"><option value="">Todos los tipos</option>
            ${EVENT_TYPES.map((t) => `<option value="${t.id}" ${t.id === listFilter.type ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}</select>
          <label class="check"><input type="checkbox" id="f-past" ${listFilter.past ? 'checked' : ''}> Mostrar pasados</label>
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
  $('#add-ev', el).onclick = () => openEventForm(null, { date: m === new Date().getMonth() && y === new Date().getFullYear() ? today : toISODate(first) });
  $('#pdf', el).onclick = downloadMonthPDF;
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
        && (listFilter.past || eventDate(ev) >= now))
      .sort(byEventDate);
    renderEventList($('#ev-list', el), evs, listFilter.past
      ? 'No hay eventos con esos filtros.'
      : 'No tenés nada pendiente. Disfrutá (como un perezoso). 🦥');
  }
  paintList();
}

function renderEventList(container, evs, emptyMsg) {
  if (!evs.length) {
    container.innerHTML = `<div class="empty small"><span class="empty-sloth" data-sloth="face"></span><p>${esc(emptyMsg)}</p></div>`;
    Sloth.paint(container);
    return;
  }
  container.innerHTML = evs.map((ev) => {
    const d = eventDate(ev);
    const cd = countdown(d);
    const t = eventType(ev);
    return `
      <article class="ev-row" data-ev="${ev.id}" data-level="${cd.level}" style="--c:${subjectColor(ev.subjectId)}" tabindex="0">
        <div class="ev-date"><strong>${d.getDate()}</strong><span>${MONTHS[d.getMonth()].slice(0, 3)}</span></div>
        <div class="ev-main">
          <div class="ev-type">${t.icon} ${esc(typeLabel(ev))}</div>
          <div class="ev-subj"><span class="dot"></span>${esc(subjectName(ev.subjectId))}</div>
          ${ev.title ? `<div class="ev-title">${esc(ev.title)}</div>` : ''}
          <div class="ev-when">${fmtDateShort(d)} · ${ev.time || 'sin hora'}</div>
        </div>
        <div class="countdown" data-countdown="${d.getTime()}" data-level="${cd.level}">${cd.text}</div>
      </article>`;
  }).join('');
  $$('.ev-row', container).forEach((r) => {
    const open = () => openEventForm(Store.data.events.find((x) => x.id === r.dataset.ev));
    r.onclick = open;
    r.onkeydown = (e) => { if (e.key === 'Enter') open(); };
  });
}

function openEventForm(ev, preset = {}) {
  const isNew = !ev;
  const data = ev ? { ...ev } : {
    id: uid(), type: 'parcial', customType: '', subjectId: preset.subjectId || '',
    title: '', date: preset.date || toISODate(new Date()), time: '', notes: '',
  };
  Modal.open(isNew ? 'Nuevo evento' : 'Editar evento', `
    <form class="form" id="ev-form">
      <label>Tipo de evento
        <select name="type">${EVENT_TYPES.map((t) => `<option value="${t.id}" ${t.id === data.type ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}</select>
      </label>
      <label class="custom-type" ${data.type === 'otro' ? '' : 'hidden'}>¿Qué es?
        <input name="customType" value="${esc(data.customType)}" placeholder="Ej: Defensa oral, tutoría, feria…">
      </label>
      <label>Materia
        <select name="subjectId">${subjectOptions(data.subjectId, { allowEmpty: true })}</select>
      </label>
      <label>Título o detalle <span class="opt">(opcional)</span>
        <input name="title" value="${esc(data.title)}" placeholder="Ej: Parcial 1 — unidades 1 a 3">
      </label>
      <div class="row">
        <label>Fecha<input type="date" name="date" required value="${data.date}"></label>
        <label>Hora<input type="time" name="time" value="${data.time}"></label>
      </div>
      <label>Notas <span class="opt">(opcional)</span>
        <textarea name="notes" rows="3" placeholder="Salón, qué entra, qué llevar…">${esc(data.notes)}</textarea>
      </label>
      <div class="form-actions">
        ${isNew ? '' : '<button type="button" class="btn danger ghost" id="ev-del">Eliminar</button>'}
        <span class="grow"></span>
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button class="btn">Guardar</button>
      </div>
    </form>`, (body) => {
    const f = $('#ev-form', body);
    const el = f.elements;
    el.type.onchange = () => { $('.custom-type', f).hidden = el.type.value !== 'otro'; };
    f.onsubmit = (e) => {
      e.preventDefault();
      if (el.type.value === 'otro' && !el.customType.value.trim()) { toast('Contá qué tipo de evento es 🙂'); el.customType.focus(); return; }
      Object.assign(data, {
        type: el.type.value,
        customType: el.type.value === 'otro' ? el.customType.value.trim() : '',
        subjectId: el.subjectId.value,
        title: el.title.value.trim(),
        date: el.date.value,
        time: el.time.value,
        notes: el.notes.value.trim(),
      });
      if (isNew) Store.data.events.push(data);
      else Object.assign(ev, data);
      Store.save();
      Modal.close();
      toast(isNew ? 'Evento agregado 🦥' : 'Evento actualizado');
      rerender();
    };
    const del = $('#ev-del', f);
    if (del) del.onclick = () => {
      if (!confirm('¿Eliminar este evento?')) return;
      Store.data.events = Store.data.events.filter((x) => x.id !== ev.id);
      Store.save();
      Modal.close();
      toast('Evento eliminado');
      rerender();
    };
  });
}

/* ===== PDF del mes ===== */

function fitText(doc, txt, w) {
  if (doc.getTextWidth(txt) <= w) return txt;
  while (txt.length > 1 && doc.getTextWidth(txt + '...') > w) txt = txt.slice(0, -1);
  return txt + '...';
}

function downloadMonthPDF() {
  const J = window.jspdf && window.jspdf.jsPDF;
  if (!J) {
    toast('No pude cargar el generador de PDF (¿sin internet?). Abro la impresión: elegí "Guardar como PDF".');
    setTimeout(() => window.print(), 600);
    return;
  }
  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  const doc = new J({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210, M = 10;
  const acc = hexToRgb(Store.data.settings.theme.accent || DEFAULT_ACCENT);

  const header = (title) => {
    doc.setFillColor(...acc);
    doc.rect(0, 0, W, 16, 'F');
    doc.setTextColor(...(isLight(acc) ? [40, 30, 50] : [255, 255, 255]));
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text(title, M, 10.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Perezoso - organizador semestral', W - M, 10.5, { align: 'right' });
  };

  // Página 1: grilla del mes
  header(`Calendario de pruebas - ${MONTHS[m]} ${y}`);
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const weeks = Math.ceil((offset + dim) / 7);
  const top = 21, headH = 6, cw = (W - 2 * M) / 7, ch = (H - top - M - headH) / weeks;
  const byDate = groupEventsByDate();

  doc.setTextColor(90, 80, 100); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  DAYS.forEach((d, i) => doc.text(d, M + i * cw + cw / 2, top + 4, { align: 'center' }));
  doc.setDrawColor(220, 212, 196); doc.setLineWidth(0.2);

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(y, m, 1 - offset + i);
    const x = M + (i % 7) * cw, yy = top + headH + Math.floor(i / 7) * ch;
    const out = d.getMonth() !== m;
    doc.setFillColor(...(out ? [245, 242, 236] : [255, 255, 255]));
    doc.rect(x, yy, cw, ch, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.setTextColor(...(out ? [180, 172, 160] : [60, 55, 70]));
    doc.text(String(d.getDate()), x + 1.8, yy + 4);

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

  // Página 2+: lista de eventos del mes con cuenta regresiva
  const list = Store.data.events
    .filter((e) => { const d = parseDate(e.date); return d.getFullYear() === y && d.getMonth() === m; })
    .sort(byEventDate);
  doc.addPage();
  header(`Eventos de ${MONTHS[m]} ${y}`);
  const cols = [
    { t: 'Fecha', w: 34 }, { t: 'Hora', w: 16 }, { t: 'Tipo', w: 46 },
    { t: 'Materia', w: 60 }, { t: 'Detalle', w: 76 }, { t: 'Cuánto falta', w: 45 },
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
    if (cy > H - M - 4) { doc.addPage(); header(`Eventos de ${MONTHS[m]} ${y} (cont.)`); cy = 26; drawHead(); }
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
  toast('PDF descargado 📄');
}

/* ===== Horario de facultad ===== */

function renderTimetable(el) {
  const classes = Store.data.classes;
  if (!Store.data.subjects.length) {
    el.innerHTML = `<div class="card empty"><span class="empty-sloth" data-sloth="face"></span>
      <h2>Primero creá una materia</h2><p>Después vas a poder cargar tus horarios de clase acá.</p>
      <a class="btn" href="#materias">Ir a Materias</a></div>`;
    Sloth.paint(el);
    return;
  }
  const nDays = classes.some((c) => +c.day === 7) ? 7 : 6;
  let minH = 8, maxH = 20;
  classes.forEach((c) => { minH = Math.min(minH, Math.floor(toMin(c.start) / 60)); maxH = Math.max(maxH, Math.ceil(toMin(c.end) / 60)); });
  const PX = 52;
  const now = new Date();
  const todayIdx = ((now.getDay() + 6) % 7) + 1;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  let hours = '';
  for (let h = minH; h < maxH; h++) hours += `<span style="top:${(h - minH) * PX}px">${pad(h)}:00</span>`;

  let cols = '';
  for (let d = 1; d <= nDays; d++) {
    const blocks = classes.filter((c) => +c.day === d).map((c) => {
      const top = ((toMin(c.start) - minH * 60) / 60) * PX;
      const h = Math.max(22, ((toMin(c.end) - toMin(c.start)) / 60) * PX);
      return `<button class="block" data-cl="${c.id}" style="top:${top}px;height:${h}px;--c:${subjectColor(c.subjectId)}">
          <strong>${esc(subjectName(c.subjectId))}</strong>
          <span>${c.start}–${c.end}</span>
          <span>${esc(c.kind)}${c.room ? ' · ' + esc(c.room) : ''}</span>
        </button>`;
    }).join('');
    const nowLine = d === todayIdx && nowMin >= minH * 60 && nowMin <= maxH * 60
      ? `<div class="now-line" style="top:${((nowMin - minH * 60) / 60) * PX}px"></div>` : '';
    cols += `<div class="tt-col ${d === todayIdx ? 'today' : ''}"><div class="tt-day">${DAYS[d - 1]}</div>
      <div class="tt-body" style="height:${(maxH - minH) * PX}px;--px:${PX}px">${blocks}${nowLine}</div></div>`;
  }

  const todays = classes.filter((c) => +c.day === todayIdx).sort((a, b) => toMin(a.start) - toMin(b.start));

  el.innerHTML = `
    <div class="card toolbar">
      <div class="month-nav"><h2>Semana tipo</h2></div>
      <div class="actions"><button class="btn" id="add-cl">+ Agregar clase</button></div>
    </div>
    <div class="card today-strip">
      <strong>Hoy, ${DAYS[todayIdx - 1].toLowerCase()}:</strong>
      ${todays.length ? todays.map((c) => `<span class="pill" style="--c:${subjectColor(c.subjectId)}">${c.start} ${esc(subjectName(c.subjectId))}${c.room ? ' · ' + esc(c.room) : ''}</span>`).join('') : '<span class="muted">no tenés clases. 🌿</span>'}
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
  $$('.block', el).forEach((b) => (b.onclick = () => openClassForm(Store.data.classes.find((c) => c.id === b.dataset.cl))));
}

function openClassForm(cl, preset = {}) {
  const isNew = !cl;
  const data = cl ? { ...cl } : { id: uid(), subjectId: preset.subjectId || (Store.data.subjects[0] || {}).id, day: 1, start: '08:00', end: '10:00', kind: 'Teórico', room: '' };
  Modal.open(isNew ? 'Nueva clase' : 'Editar clase', `
    <form class="form" id="cl-form">
      <label>Materia<select name="subjectId" required>${subjectOptions(data.subjectId)}</select></label>
      <label>Día<select name="day">${DAYS.map((d, i) => `<option value="${i + 1}" ${+data.day === i + 1 ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
      <div class="row">
        <label>Desde<input type="time" name="start" required value="${data.start}"></label>
        <label>Hasta<input type="time" name="end" required value="${data.end}"></label>
      </div>
      <div class="row">
        <label>Tipo<select name="kind">${CLASS_KINDS.map((k) => `<option ${k === data.kind ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
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
    f.onsubmit = (e) => {
      e.preventDefault();
      if (toMin(el.end.value) <= toMin(el.start.value)) { toast('La hora de fin tiene que ser después del inicio.'); return; }
      Object.assign(data, { subjectId: el.subjectId.value, day: +el.day.value, start: el.start.value, end: el.end.value, kind: el.kind.value, room: el.room.value.trim() });
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
