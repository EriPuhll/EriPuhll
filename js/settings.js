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

      ${appearanceHTML(st)}

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
  bindAppearance(v, st);

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

/* ---------- Apariencia (Ajustes) ---------- */

let apTab = 'temas';
const AP_TABS = [['temas', 'Temas'], ['colores', 'Colores'], ['letra', 'Letra y forma'], ['fondo', 'Fondo'], ['listas', 'Listas']];

function themeMatches(a, b) {
  return ['accent', 'bg', 'surface', 'ink', 'dark', 'bgType', 'pattern'].every((k) => String(a[k] || '').toLowerCase() === String(b[k] || '').toLowerCase());
}

function themeThumb(x) {
  const c = themeColors(x);
  const bgImg = x.bgType === 'pattern' ? `background-image:url('${patternUrl(x.pattern, x.patternColor || x.accent)}');` : '';
  return `<span class="tt-thumb" style="background-color:${c.bg};${bgImg}">
    <span class="tt-bar" style="background:${c.surface};border-color:${c.line}"><i style="background:${x.accent}"></i><i style="background:${c.line}"></i><i style="background:${c.line}"></i></span>
    <span class="tt-card" style="background:${c.surface};border-color:${c.line}">
      <b style="background:${c.ink}"></b><b style="background:${c.muted};width:55%"></b>
      <span class="tt-pill" style="background:${x.accent}"></span>
    </span>
  </span>`;
}

function appearancePanel(st) {
  const t = st.theme;
  switch (apTab) {
    case 'temas':
      return `<p class="hint">Tocá un tema para usarlo. Después podés cambiarle lo que quieras.</p>
        <div class="theme-grid">${THEME_PRESETS.map((p) => {
          const x = { ...defaultGlobalTheme(), ...p.t };
          const on = themeMatches(x, t);
          return `<button type="button" class="theme-opt ${on ? 'on' : ''}" data-preset="${p.id}" aria-pressed="${on}">${themeThumb(x)}<span class="tt-name">${esc(p.label)}${on ? ' ✓' : ''}</span></button>`;
        }).join('')}</div>`;
    case 'colores':
      return `<div class="color-grid">${COLOR_TOKENS.map(([k, l]) => `
          <label class="color-row"><span class="color-dot" style="background:${t[k]}"><input type="color" data-token="${k}" value="${t[k]}" aria-label="${esc(l)}"></span>
            <span><strong>${esc(l)}</strong><span class="muted small hex">${t[k]}</span></span></label>`).join('')}
        </div>
        <p class="hint" style="margin-top:.8rem">Sugeridos para el color principal:</p>
        <div class="swatches">${SUBJECT_COLORS.map((c) => `<button type="button" class="swatch-btn ${c === t.accent ? 'on' : ''}" style="background:${c}" data-accent="${c}" aria-label="Usar ${c}"></button>`).join('')}</div>`;
    case 'letra':
      return `<div class="field"><strong>Tipografía</strong>
          <div class="font-grid">${Object.keys(FONTS).map((k) => `<button type="button" class="font-opt ${k === t.font ? 'on' : ''}" data-font="${k}" style="font-family:${FONTS[k].css}"><span class="aa">Aa</span><span class="small">${esc(FONTS[k].label)}</span></button>`).join('')}</div></div>
        <div class="field" style="margin-top:1rem"><strong>Bordes</strong>
          <div class="range-row"><span class="small muted">Rectos</span><input type="range" id="radius" min="4" max="30" value="${t.radius}" aria-label="Qué tan redondeados"><span class="small muted">Redondos</span></div></div>
        <div class="field" style="margin-top:1rem"><strong>Modo</strong>
          <div class="switch sm" style="margin-top:.4rem">${[['light', 'Claro'], ['dark', 'Oscuro'], ['auto', 'Automático']].map(([v, l]) => `<button type="button" class="${t.dark === v ? 'on' : ''}" data-dark="${v}">${l}</button>`).join('')}</div></div>
        <label class="check" style="margin-top:1rem"><input type="checkbox" id="glass" ${t.glass ? 'checked' : ''}> Tarjetas transparentes con desenfoque</label>`;
    case 'fondo':
      return `${bgEditorHTML(t, t.patternColor || t.accent)}
        ${t.bgType === 'pattern' ? `<label class="color-row" style="margin-top:.8rem;max-width:320px"><span class="color-dot" style="background:${t.patternColor || t.accent}"><input type="color" id="pattern-color" value="${t.patternColor || t.accent}" aria-label="Color del patrón"></span><span><strong>Color del patrón</strong></span></label>` : ''}`;
    case 'listas':
      return `<p class="hint">El símbolo que aparece adelante de cada ítem en las listas.</p>
        <div class="bullet-grid">${BULLETS.map((b) => `<button type="button" class="bullet-opt ${b === st.bullet ? 'on' : ''}" data-bullet="${esc(b)}" aria-label="Usar ${esc(b)}">${esc(b)}</button>`).join('')}</div>
        <label class="inline" style="margin-top:.8rem">Otro símbolo <input id="bullet-custom" maxlength="3" value="${BULLETS.includes(st.bullet) ? '' : esc(st.bullet)}" placeholder="✎" style="width:80px;text-align:center"></label>`;
    default: return '';
  }
}

function appearanceHTML(st) {
  return `<section class="card" id="theme-card">
    <div class="list-head"><h2>Apariencia</h2><button class="btn ghost sm" id="theme-reset">Volver al original</button></div>
    <div class="ap-layout">
      <div class="ap-controls">
        <div class="tabs-scroll"><div class="tabs-row sm" role="tablist">${AP_TABS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${apTab === k}" class="${apTab === k ? 'on' : ''}" data-aptab="${k}">${l}</button>`).join('')}</div></div>
        <div class="ap-panel">${appearancePanel(st)}</div>
      </div>
      <aside class="ap-preview" aria-label="Vista previa">
        <span class="muted small">Vista previa</span>
        <div class="pv">
          <div class="pv-top"><span class="pv-logo" data-sloth="head"></span><strong>Perezoso</strong><span class="pv-tab on">Inicio</span><span class="pv-tab">Materias</span></div>
          <div class="pv-body" id="pv-body">
            <div class="pv-card">
              <div class="pv-row"><strong>Parcial de Física</strong><span class="countdown" data-level="soon">3 d 4 h</span></div>
              <div class="bar"><span style="width:62%"></span></div>
              <ul class="plain small"><li>Repasar el práctico 4</li><li>Armar la hoja de fórmulas</li></ul>
              <div class="pv-row"><span class="pv-hl">Prioritario</span><button type="button" class="btn sm" tabindex="-1">Estudiar</button></div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>`;
}

function paintPreviewBg() {
  const body = $('#pv-body');
  if (!body) return;
  const t = Store.data.settings.theme;
  body.style.backgroundImage = t.bgType === 'pattern' ? `url("${patternUrl(t.pattern, t.patternColor || t.accent)}")` : 'none';
  body.style.backgroundColor = t.bgType === 'color' ? t.bgColor : '';
}

function bindAppearance(v, st) {
  const card = $('#theme-card', v);
  const redraw = () => { card.outerHTML = appearanceHTML(st); bindAppearance(v, st); };
  const setTheme = (patch, { live } = {}) => {
    Object.assign(st.theme, patch);
    applyTheme(globalTheme());
    paintPreviewBg();
    if (!live) { Store.save(); redraw(); }
  };
  Sloth.paint(card);
  paintPreviewBg();
  $$('[data-aptab]', card).forEach((b) => (b.onclick = () => { apTab = b.dataset.aptab; redraw(); }));
  $$('[data-preset]', card).forEach((b) => (b.onclick = () => {
    const p = THEME_PRESETS.find((x) => x.id === b.dataset.preset);
    st.theme = { ...defaultGlobalTheme(), ...p.t, bgImageId: st.theme.bgImageId };
    applyTheme(globalTheme()); Store.save(); redraw();
  }));
  $$('[data-token]', card).forEach((inp) => {
    inp.oninput = () => { inp.parentElement.style.background = inp.value; setTheme({ [inp.dataset.token]: inp.value }, { live: true }); };
    inp.onchange = () => setTheme({ [inp.dataset.token]: inp.value });
  });
  $$('[data-accent]', card).forEach((b) => (b.onclick = () => setTheme({ accent: b.dataset.accent })));
  $$('[data-font]', card).forEach((b) => (b.onclick = () => setTheme({ font: b.dataset.font })));
  on(card, '#radius', 'oninput', (e) => setTheme({ radius: +e.target.value }, { live: true }));
  on(card, '#radius', 'onchange', (e) => setTheme({ radius: +e.target.value }));
  $$('[data-dark]', card).forEach((b) => (b.onclick = () => setTheme({ dark: b.dataset.dark })));
  on(card, '#glass', 'onchange', (e) => setTheme({ glass: e.target.checked }));
  on(card, '#pattern-color', 'oninput', (e) => { e.target.parentElement.style.background = e.target.value; setTheme({ patternColor: e.target.value }, { live: true }); });
  on(card, '#pattern-color', 'onchange', (e) => setTheme({ patternColor: e.target.value }));
  if (apTab === 'fondo') bindBgEditor(card, st.theme, setTheme);
  const setBullet = (b) => { if (!b) return; st.bullet = b; applyBullet(); Store.save(); redraw(); };
  $$('[data-bullet]', card).forEach((b) => (b.onclick = () => setBullet(b.dataset.bullet)));
  on(card, '#bullet-custom', 'onchange', (e) => setBullet(e.target.value.trim()));
  on(card, '#theme-reset', 'onclick', () => { st.theme = { ...defaultGlobalTheme(), bgImageId: st.theme.bgImageId }; st.bullet = '•'; applyBullet(); applyTheme(globalTheme()); Store.save(); redraw(); });
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
