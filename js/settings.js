'use strict';

/* ---------- Ajustes ---------- */

function renderSettings() {
  const st = Store.data.settings;
  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head"><div><h1>Ajustes</h1><p class="sub">Hacé la app tuya.</p></div></div>
      <div class="settings-grid">
        <div class="card highlight" id="autosave-card"></div>
        <div class="card highlight" id="install-card">
          <h2>📲 Tenerla en el escritorio</h2>
          ${Install.installed()
            ? '<p class="muted">Ya la estás usando como app instalada. ✓</p>'
            : Install.prompt
              ? '<p class="muted">Instalala y se abre como un programa, con su ícono del perezoso y sin internet.</p><button class="btn" id="install">Instalar Perezoso</button>'
              : location.protocol === 'file:'
                ? '<p class="muted">Para instalarla como app, abrila desde su página web (GitHub Pages) y volvé a esta sección.</p>'
                : '<p class="muted">Buscá el ícono de instalar (una pantallita con una flecha ⊕) a la derecha de la barra de direcciones, o en el menú del navegador → <strong>Instalar Perezoso</strong>.</p>'}
        </div>
        <div class="card">
          <h2>🎨 Apariencia general</h2>
          <p class="muted">Color principal y fondo de toda la app. Cada materia puede tener su propio estilo desde su página.</p>
          <div class="swatch-row"><span class="swatch" style="background:${st.theme.accent}"></span><span class="swatch" style="background:${st.theme.bgColor}"></span></div>
          <button class="btn" id="g-theme">Personalizar</button>
        </div>
        <div class="card">
          <h2>🦥 El perezoso</h2>
          <label class="check"><input type="checkbox" id="sloth-on" ${st.slothEnabled ? 'checked' : ''}> Que aparezca de vez en cuando</label>
          <button class="btn ghost" id="sloth-now">Llamarlo ahora</button>
        </div>
        <div class="card">
          <h2>🔔 Notificaciones</h2>
          <p class="muted">Para avisarte cuando termina un pomodoro aunque estés en otra pestaña.</p>
          <button class="btn ghost" id="notif">${'Notification' in window && Notification.permission === 'granted' ? 'Activadas ✓' : 'Activar'}</button>
        </div>
        <div class="card">
          <h2>📦 Respaldo manual</h2>
          <p class="muted">Descargá una copia de tus datos cuando quieras (los documentos subidos no se incluyen).</p>
          <div class="btn-row">
            <button class="btn ghost" id="export">⬇ Descargar respaldo</button>
            <label class="btn ghost">⬆ Cargar respaldo<input type="file" id="import" accept="application/json,.json" hidden></label>
          </div>
        </div>
        <div class="card">
          <h2>🧪 Datos de ejemplo</h2>
          <p class="muted">Carga un par de materias, clases y pruebas para ver cómo funciona todo.</p>
          <button class="btn ghost" id="demo">Cargar ejemplo</button>
        </div>
        <div class="card danger-zone">
          <h2>⚠️ Borrar todo</h2>
          <p class="muted">Elimina materias, eventos, horas y documentos de este navegador.</p>
          <button class="btn danger" id="wipe">Borrar todos los datos</button>
        </div>
      </div>
    </section>`;

  $('#g-theme').onclick = () => openThemeEditor({
    title: 'Apariencia general',
    current: { ...st.theme },
    onSave: (t) => { st.theme = t; Store.save(); applyTheme(globalTheme()); toast('Listo 💜'); renderSettings(); },
    onCancel: () => applyTheme(globalTheme()),
  });
  $('#sloth-on').onchange = (e) => {
    st.slothEnabled = e.target.checked;
    Store.save();
    Sloth.schedule(true);
    if (!st.slothEnabled) Sloth.hide();
  };
  $('#sloth-now').onclick = () => Sloth.show();
  const inst = $('#install'); if (inst) inst.onclick = () => Install.run();
  paintAutosaveCard();
  $('#notif').onclick = async () => {
    if (!('Notification' in window)) { toast('Este navegador no soporta notificaciones.'); return; }
    const r = await Notification.requestPermission();
    toast(r === 'granted' ? 'Notificaciones activadas 🔔' : 'No se activaron las notificaciones.');
    renderSettings();
  };
  $('#export').onclick = () => {
    const blob = new Blob([JSON.stringify(Store.data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `perezoso-respaldo-${toISODate(new Date())}.json`);
  };
  $('#import').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = parseBackup(await file.text());
      if (!data) throw new Error('formato');
      if (!confirm('Esto reemplaza tus datos actuales por los del respaldo. ¿Seguimos?')) return;
      Store.data = Store.merge(Store.defaults(), data);
      Store.save();
      toast('Respaldo cargado ✓');
      applyTheme(globalTheme());
      renderSettings();
    } catch (err) {
      toast('Ese archivo no parece un respaldo de Perezoso.');
    }
  };
  $('#demo').onclick = loadDemoData;
  $('#wipe').onclick = async () => {
    if (!confirm('¿Seguro? Se borra TODO y no se puede deshacer.')) return;
    Store.data = Store.defaults();
    Store.save();
    await Files.clear().catch(() => {});
    AutoSave.handle = null;
    AutoSave.status = AutoSave.supported ? 'off' : 'unsupported';
    Pomo.reset();
    applyTheme(globalTheme());
    toast('Datos borrados. Empezamos de cero 🌱');
    location.hash = '#calendario';
  };
}

function loadDemoData() {
  const d = Store.data;
  const now = new Date();
  const y = now.getFullYear();
  const sem = now.getMonth() < 6 ? '1' : '2';
  const inDays = (n, time) => { const x = new Date(now); x.setDate(x.getDate() + n); return { date: toISODate(x), time }; };

  const calc = { ...newSubject(), name: 'Cálculo II', semester: sem, year: y, professor: 'Dra. Ana Pérez', emails: ['ana.perez@facultad.edu'], credits: 13, color: '#a075ea' };
  const fis = { ...newSubject(), name: 'Física General', semester: sem, year: y, professor: 'Ing. Martín Silva', emails: ['msilva@facultad.edu'], credits: 10, color: '#5fb3a1' };
  const prog = { ...newSubject(), name: 'Programación I', semester: sem, year: y, professor: 'Lic. Sofía Rodríguez', emails: ['srodriguez@facultad.edu', 'sofi.prog@gmail.com'], credits: 8, color: '#f28bb3' };
  d.subjects.push(calc, fis, prog);

  d.classes.push(
    { id: uid(), subjectId: calc.id, day: 1, start: '08:00', end: '10:00', kind: 'Teórico', room: '501' },
    { id: uid(), subjectId: calc.id, day: 3, start: '08:00', end: '10:00', kind: 'Teórico', room: '501' },
    { id: uid(), subjectId: calc.id, day: 4, start: '14:00', end: '16:00', kind: 'Práctico', room: '302' },
    { id: uid(), subjectId: fis.id, day: 2, start: '10:00', end: '12:00', kind: 'Teórico', room: 'Anfiteatro' },
    { id: uid(), subjectId: fis.id, day: 5, start: '10:00', end: '13:00', kind: 'Laboratorio', room: 'Lab 2' },
    { id: uid(), subjectId: prog.id, day: 2, start: '16:00', end: '18:00', kind: 'Teórico', room: '105' },
    { id: uid(), subjectId: prog.id, day: 4, start: '18:00', end: '20:00', kind: 'Práctico', room: 'Sala PC' },
  );

  d.events.push(
    { id: uid(), type: 'control', customType: '', subjectId: calc.id, title: 'Control de integrales', ...inDays(1, '10:00'), notes: '' },
    { id: uid(), type: 'laboratorio', customType: '', subjectId: fis.id, title: 'Informe de péndulo', ...inDays(4, '23:59'), notes: 'Entregar por EVA' },
    { id: uid(), type: 'parcial', customType: '', subjectId: calc.id, title: 'Primer parcial', ...inDays(12, '09:00'), notes: 'Unidades 1 a 4' },
    { id: uid(), type: 'entregable', customType: '', subjectId: prog.id, title: 'Obligatorio 1', ...inDays(8, '20:00'), notes: '' },
    { id: uid(), type: 'charla', customType: '', subjectId: '', title: 'Charla de orientación laboral', ...inDays(6, '18:30'), notes: '' },
    { id: uid(), type: 'otro', customType: 'Defensa oral', subjectId: prog.id, title: 'Defensa del obligatorio', ...inDays(15, '17:00'), notes: '' },
  );

  const past = (daysAgo, h, mins, subjectId, source = 'manual') => {
    const s = new Date(now); s.setDate(s.getDate() - daysAgo); s.setHours(h, 0, 0, 0);
    return { id: uid(), subjectId, start: s.getTime(), end: s.getTime() + mins * 60000, source };
  };
  d.sessions.push(past(0, 9, 50, calc.id), past(1, 15, 120, fis.id), past(1, 19, 25, prog.id, 'pomodoro'), past(2, 10, 95, calc.id), past(3, 17, 60, prog.id));

  Store.save();
  toast('¡Datos de ejemplo cargados! 🦥');
  location.hash = '#calendario';
  rerender();
}

function paintAutosaveCard() {
  const card = $('#autosave-card');
  if (!card) return;
  const st = AutoSave.status;
  let body;
  if (st === 'unsupported') {
    body = `<p class="muted">Este navegador no deja guardar en un archivo automáticamente (funciona en <strong>Chrome, Edge u Opera</strong> de computadora). Igual tus datos quedan guardados en el navegador; hacé un respaldo manual de vez en cuando.</p>`;
  } else if (st === 'off') {
    body = `<p class="muted">Tus datos ya quedan en el navegador. Para más seguridad, elegí un archivo en tu compu y cada cambio se va a guardar ahí <strong>solo</strong>.</p>
      <p class="muted">💡 Si lo guardás en tu carpeta de <strong>Google Drive</strong> (o OneDrive), también queda en la nube.</p>
      <div class="btn-row"><button class="btn" id="as-choose">Elegir dónde guardar</button>
      <button class="btn ghost" id="as-open">Abrir un archivo que ya tengo</button></div>`;
  } else if (st === 'ok') {
    body = `<p class="ok-line">✓ Guardando solo en <strong>${esc(AutoSave.fileName())}</strong>${AutoSave.lastSaved ? ` · último guardado ${fmtTime(new Date(AutoSave.lastSaved))}` : ''}</p>
      <div class="btn-row"><button class="btn ghost sm" id="as-choose">Cambiar archivo</button>
      <button class="btn ghost sm" id="as-off">Dejar de guardar en archivo</button></div>`;
  } else {
    body = `<p class="muted">El navegador pide permiso otra vez para escribir en <strong>${esc(AutoSave.fileName())}</strong>.</p>
      <div class="btn-row"><button class="btn" id="as-reconnect">Permitir</button>
      <button class="btn ghost sm" id="as-off">Dejar de guardar en archivo</button></div>`;
  }
  card.innerHTML = `<h2>💾 Guardado automático</h2>${body}`;
  const on = (id, fn) => { const b = $(id, card); if (b) b.onclick = fn; };
  on('#as-choose', () => AutoSave.choose());
  on('#as-open', () => AutoSave.openExisting());
  on('#as-reconnect', () => AutoSave.reconnect());
  on('#as-off', () => { if (confirm('¿Dejar de guardar en el archivo? Tus datos siguen en el navegador.')) AutoSave.disconnect(); });
}
