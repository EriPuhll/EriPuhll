'use strict';

/* ---------- Ajustes ---------- */

const COLOR_TOKENS = [
  ['accent', 'Color principal'], ['bg', 'Fondo'], ['surface', 'Tarjetas'],
  ['ink', 'Texto'], ['moss', 'Detalles (hojas, éxito)'], ['hl', 'Resaltado (amarillo)'],
];

function renderSettings() {
  const st = Store.data.settings;
  const t = st.theme;
  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head"><div><h1>Ajustes</h1><p class="sub">Hacé la app tuya.</p></div></div>

      <div class="grid-2">
        <form class="card form" id="me-form">
          <h2>Vos y tu semestre</h2>
          <label>Tu nombre <span class="opt">(para que el perezoso te salude)</span><input name="userName" value="${esc(st.userName)}"></label>
          <div class="row">
            <label>Inicio del semestre<input type="date" name="semesterStart" value="${st.semesterStart}"></label>
            <label>Fin del semestre<input type="date" name="semesterEnd" value="${st.semesterEnd}"></label>
          </div>
          <div class="row">
            <label>Horas por crédito<input type="number" name="hoursPerCredit" min="1" max="60" value="${st.hoursPerCredit}"></label>
            <label>Avisarme antes de cada prueba <span class="opt">(días)</span><input name="reminderDays" value="${(st.reminderDays || []).join(', ')}" placeholder="7, 2, 1"></label>
          </div>
          <p class="hint">Las fechas del semestre se usan para calcular el ritmo (horas por semana) de cada materia.</p>
        </form>

        <div class="card" id="autosave-card"></div>
      </div>

      <section class="card form">
        <h2>Qué querés ver</h2>
        <p class="hint">Cualquier bloque se puede minimizar (–) u ocultar (✕) desde su esquina. Acá elegís además qué pestañas tienen las materias.</p>
        <div class="chip-row">
          ${SUBJECT_TABS.filter((t) => t.id !== 'resumen').map((t) => `<label class="check chip-check"><input type="checkbox" data-subtab="${t.id}" ${(st.subjectTabsHidden || []).includes(t.id) ? '' : 'checked'}> ${esc(t.label)}</label>`).join('')}
        </div>
        <div class="btn-row"><button type="button" class="btn ghost sm" id="show-all">Volver a mostrar todo lo que oculté (${Object.keys(layoutState().hidden).length})</button></div>
      </section>

      <section class="card" id="theme-card">
        <div class="list-head"><h2>Apariencia</h2><button class="btn ghost sm" id="theme-reset">Volver al lila original</button></div>
        <p class="hint">Cambiá lo que quieras: se guarda solo y lo ves en vivo. Cada materia además puede tener su propio color y fondo (pestaña Apariencia).</p>
        <h3 style="margin-top:1rem">Temas listos</h3>
        <div class="presets" style="margin-top:.5rem">
          ${THEME_PRESETS.map((p) => { const x = { ...defaultGlobalTheme(), ...p.t }; return `<button class="preset" data-preset="${p.id}" style="background-color:${x.bg};${x.bgType === 'pattern' ? `background-image:url('${patternUrl(x.pattern, x.patternColor)}');` : ''}color:${x.dark === 'dark' ? '#fff' : x.ink};border-color:${x.accent}"><span style="background:${x.accent};color:#fff;padding:1px 8px;border-radius:999px">${p.label}</span></button>`; }).join('')}
        </div>
        <div class="grid-2" style="margin-top:1rem">
          <div class="form">
            <h3>Colores</h3>
            <div class="grid-2" style="gap:.6rem">
              ${COLOR_TOKENS.map(([k, l]) => `<label class="inline"><input type="color" data-token="${k}" value="${t[k]}"> ${l}</label>`).join('')}
            </div>
            <h3>Letra y forma</h3>
            <label>Tipografía<select id="font">${Object.keys(FONTS).map((k) => `<option value="${k}" ${k === t.font ? 'selected' : ''}>${FONTS[k].label}</option>`).join('')}</select></label>
            <label>Bordes redondeados <input type="range" id="radius" min="4" max="30" value="${t.radius}"></label>
            <div class="field"><strong>Modo</strong>
              <div class="chip-row" style="margin-top:.4rem">${[['light', 'Claro'], ['dark', 'Oscuro'], ['auto', 'Automático']].map(([v, l]) => `<button type="button" class="chip-opt ${t.dark === v ? 'on' : ''}" data-dark="${v}">${l}</button>`).join('')}</div>
            </div>
            <label class="check"><input type="checkbox" id="glass" ${t.glass ? 'checked' : ''}> Tarjetas transparentes con desenfoque</label>
            <div class="field"><strong>Símbolo de las listas</strong>
              <div class="chip-row" style="margin-top:.4rem">${BULLETS.map((b) => `<button type="button" class="chip-opt ${b === st.bullet ? 'on' : ''}" data-bullet="${esc(b)}" aria-label="Usar ${esc(b)}">${esc(b)}</button>`).join('')}
                <label class="inline">Otro <input id="bullet-custom" maxlength="3" value="${BULLETS.includes(st.bullet) ? '' : esc(st.bullet)}" placeholder="✎" style="width:70px"></label>
              </div>
              <ul class="plain small" style="margin-top:.5rem"><li>Así se ven las listas</li><li>con el símbolo que elijas</li></ul>
            </div>
          </div>
          <div class="form">
            <h3>Fondo de la página</h3>
            <label class="inline"><input type="color" id="pattern-color" value="${t.patternColor || t.accent}"> Color del patrón</label>
            ${bgEditorHTML(t, t.patternColor || t.accent)}
          </div>
        </div>
      </section>

      <div class="grid-3">
        <div class="card" id="install-card">
          <h2>En el escritorio</h2>
          ${Install.installed()
            ? '<p class="muted">Ya la estás usando como app instalada. ✓</p>'
            : Install.prompt
              ? '<p class="muted">Instalala y se abre como un programa, con su ícono y sin internet.</p><button class="btn" id="install" style="margin-top:.6rem">Instalar Perezoso</button>'
              : location.protocol === 'file:'
                ? '<p class="muted">Para instalarla como app, abrila desde su página web (GitHub Pages).</p>'
                : '<p class="muted">Buscá el ícono de instalar a la derecha de la barra de direcciones, o en el menú del navegador → <strong>Instalar Perezoso</strong>.</p>'}
        </div>
        <div class="card">
          <h2>Notificaciones</h2>
          <p class="muted">Para avisarte de pruebas y del pomodoro aunque estés en otra pestaña.</p>
          <button class="btn ghost" id="notif" style="margin-top:.6rem">${'Notification' in window && Notification.permission === 'granted' ? 'Activadas ✓' : 'Activar'}</button>
        </div>
        <div class="card">
          <h2>Respaldo completo</h2>
          <p class="muted">Un archivo con todo: datos, documentos e imágenes. Sirve para pasarlo a otra compu.</p>
          <div class="btn-row" style="margin-top:.6rem">
            <button class="btn ghost" id="export">⬇ Descargar</button>
            <label class="btn ghost">⬆ Restaurar<input type="file" id="import" accept="application/json,.json" hidden></label>
          </div>
        </div>
        <div class="card">
          <h2>Datos iniciales</h2>
          <p class="muted">Vuelve a cargar tus materias, exámenes y proyectos del 2º semestre 2026 (no borra nada, solo agrega lo que falta).</p>
          <button class="btn ghost" id="seed" style="margin-top:.6rem">Cargar</button>
        </div>
        <div class="card">
          <h2>Borrar todo</h2>
          <p class="muted">Elimina materias, eventos, horas y documentos de este navegador.</p>
          <button class="btn danger" id="wipe" style="margin-top:.6rem">Borrar todos los datos</button>
        </div>
      </div>
    </section>`;

  const v = $('#view');

  // Vos y tu semestre
  const me = $('#me-form', v);
  me.onchange = () => {
    const x = me.elements;
    st.userName = x.userName.value.trim();
    st.hoursPerCredit = clamp(parseFloat(x.hoursPerCredit.value) || 10, 1, 60);
    if (x.semesterStart.value) st.semesterStart = x.semesterStart.value;
    if (x.semesterEnd.value) st.semesterEnd = x.semesterEnd.value;
    st.reminderDays = [...new Set(x.reminderDays.value.split(/[,;\s]+/).map((n) => parseInt(n, 10)).filter((n) => n >= 0 && n <= 60))].sort((a, b) => b - a);
    Store.save();
    toast('Guardado ✓');
    Sloth.refresh();
  };
  me.onsubmit = (e) => e.preventDefault();

  // Apariencia (en vivo)
  const setTheme = (patch, { live } = {}) => {
    Object.assign(st.theme, patch);
    applyTheme(globalTheme());
    if (!live) { Store.save(); renderSettings(); }
  };
  $$('[data-token]', v).forEach((inp) => {
    inp.oninput = () => setTheme({ [inp.dataset.token]: inp.value }, { live: true });
    inp.onchange = () => setTheme({ [inp.dataset.token]: inp.value });
  });
  $('#font', v).onchange = (e) => setTheme({ font: e.target.value });
  const rad = $('#radius', v);
  rad.oninput = () => setTheme({ radius: +rad.value }, { live: true });
  rad.onchange = () => setTheme({ radius: +rad.value });
  $$('[data-dark]', v).forEach((b) => (b.onclick = () => setTheme({ dark: b.dataset.dark })));
  $('#glass', v).onchange = (e) => setTheme({ glass: e.target.checked });
  const setBullet = (b) => { if (!b) return; st.bullet = b; applyBullet(); Store.save(); renderSettings(); };
  $$('[data-bullet]', v).forEach((b) => (b.onclick = () => setBullet(b.dataset.bullet)));
  $('#bullet-custom', v).onchange = (e) => setBullet(e.target.value.trim());
  const pc = $('#pattern-color', v);
  pc.oninput = () => setTheme({ patternColor: pc.value }, { live: true });
  pc.onchange = () => setTheme({ patternColor: pc.value });
  bindBgEditor($('#theme-card', v), st.theme, setTheme);
  $$('[data-preset]', v).forEach((b) => (b.onclick = () => {
    const p = THEME_PRESETS.find((x) => x.id === b.dataset.preset);
    const keepImg = st.theme.bgImageId;
    st.theme = { ...defaultGlobalTheme(), ...p.t, bgImageId: keepImg };
    applyTheme(globalTheme()); Store.save(); renderSettings();
    toast(`Tema “${p.label}” aplicado`);
  }));
  $('#theme-reset', v).onclick = () => { st.theme = { ...defaultGlobalTheme(), bgImageId: st.theme.bgImageId }; applyTheme(globalTheme()); Store.save(); renderSettings(); };

  $$('[data-subtab]', v).forEach((c) => (c.onchange = () => {
    const set = new Set(st.subjectTabsHidden || []);
    if (c.checked) set.delete(c.dataset.subtab); else set.add(c.dataset.subtab);
    st.subjectTabsHidden = [...set];
    Store.save();
  }));
  $('#show-all', v).onclick = () => { st.layout = { hidden: {}, collapsed: {} }; Store.save(); toast('Listo, se ve todo de nuevo'); renderSettings(); };
  paintAutosaveCard();
  const inst = $('#install', v); if (inst) inst.onclick = () => Install.run();
  $('#notif', v).onclick = async () => {
    if (!('Notification' in window)) { toast('Este navegador no soporta notificaciones.'); return; }
    const r = await Notification.requestPermission();
    toast(r === 'granted' ? 'Notificaciones activadas ' : 'No se activaron las notificaciones.');
    renderSettings();
  };
  $('#export', v).onclick = exportBackup;
  $('#import', v).onchange = (e) => importBackup(e.target.files[0]);
  $('#seed', v).onclick = () => { seedInitialData(Store.data, { onlyMissing: true }); Store.save(); toast('Listo, cargué lo que faltaba '); };
  $('#wipe', v).onclick = async () => {
    if (!confirm('¿Segura? Se borra TODO y no se puede deshacer.')) return;
    Store.data = Store.defaults();
    Store.data.settings.seedDismissed = true;
    Store.save();
    await Files.clear().catch(() => {});
    AutoSave.handle = null;
    AutoSave.status = AutoSave.supported ? 'off' : 'unsupported';
    Pomo.reset();
    applyTheme(globalTheme());
    Sloth.refresh();
    toast('Datos borrados. Empezamos de cero ');
    location.hash = '#inicio';
  };
}

/* ---------- Respaldo completo (con archivos) ---------- */

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsDataURL(blob); });
}

async function exportBackup() {
  toast('Preparando el respaldo…');
  const files = {};
  try {
    for (const key of await Files.keys()) {
      if (String(key).startsWith('meta:')) continue;
      const blob = await Files.get(key);
      if (blob instanceof Blob) files[key] = await blobToDataUrl(blob);
    }
  } catch (e) { toast('No pude leer algunos archivos; el respaldo va sin ellos.'); }
  const payload = { app: 'perezoso', version: DATA_VERSION, exportedAt: new Date().toISOString(), data: Store.data, files };
  downloadBlob(new Blob([JSON.stringify(payload)], { type: 'application/json' }), `perezoso-respaldo-${toISODate(new Date())}.json`);
}

async function importBackup(file) {
  if (!file) return;
  let raw;
  try { raw = JSON.parse(await file.text()); } catch (e) { toast('Ese archivo no parece un respaldo de Perezoso.'); return; }
  const data = parseBackup(JSON.stringify(raw));
  if (!data) { toast('Ese archivo no parece un respaldo de Perezoso.'); return; }
  if (!confirm('Esto reemplaza tus datos actuales por los del respaldo. ¿Seguimos?')) return;
  if (raw.files && typeof raw.files === 'object') {
    for (const [id, url] of Object.entries(raw.files)) {
      try { await Files.put(id, await (await fetch(url)).blob()); } catch (e) { /* sigue con el resto */ }
    }
  }
  Store.data = Store.merge(Store.defaults(), data);
  Store.save();
  applyTheme(globalTheme());
  applyBullet();
  Sloth.refresh();
  toast('Respaldo restaurado ✓');
  rerender();
}

function paintAutosaveCard() {
  const card = $('#autosave-card');
  if (!card) return;
  const st = AutoSave.status;
  let body;
  if (st === 'unsupported') {
    body = `<p class="muted">Tus datos ya quedan guardados en este navegador. Este navegador no deja además guardarlos solos en un archivo (eso funciona en <strong>Chrome, Edge u Opera</strong> de computadora). Hacé un respaldo de vez en cuando.</p>`;
  } else if (st === 'off') {
    body = `<p class="muted">Tus datos ya quedan en el navegador. Para más seguridad, elegí un archivo en tu compu y cada cambio se guarda ahí <strong>solo</strong>.</p>
      <p class="muted" style="margin-top:.4rem">Si lo guardás en tu carpeta de <strong>Google Drive</strong> (o OneDrive), también queda en la nube.</p>
      <div class="btn-row" style="margin-top:.6rem"><button class="btn" id="as-choose">Elegir dónde guardar</button>
      <button class="btn ghost" id="as-open">Abrir un archivo que ya tengo</button></div>`;
  } else if (st === 'ok') {
    body = `<p style="color:var(--moss);font-weight:700">✓ Guardando solo en <strong>${esc(AutoSave.fileName())}</strong>${AutoSave.lastSaved ? ` · último guardado ${fmtTime(new Date(AutoSave.lastSaved))}` : ''}</p>
      <div class="btn-row" style="margin-top:.6rem"><button class="btn ghost sm" id="as-choose">Cambiar archivo</button>
      <button class="btn ghost sm" id="as-off">Dejar de guardar en archivo</button></div>`;
  } else {
    body = `<p class="muted">El navegador pide permiso otra vez para escribir en <strong>${esc(AutoSave.fileName())}</strong>.</p>
      <div class="btn-row" style="margin-top:.6rem"><button class="btn" id="as-reconnect">Permitir</button>
      <button class="btn ghost sm" id="as-off">Dejar de guardar en archivo</button></div>`;
  }
  card.innerHTML = `<h2>Guardado automático</h2>${body}`;
  const on = (id, fn) => { const b = $(id, card); if (b) b.onclick = fn; };
  on('#as-choose', () => AutoSave.choose());
  on('#as-open', () => AutoSave.openExisting());
  on('#as-reconnect', () => AutoSave.reconnect());
  on('#as-off', () => { if (confirm('¿Dejar de guardar en el archivo? Tus datos siguen en el navegador.')) AutoSave.disconnect(); });
}
