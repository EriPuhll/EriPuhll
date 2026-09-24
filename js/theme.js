'use strict';

/* ---------- Temas: colores, tipografía y fondos estilo Tumblr ---------- */

const FONTS = {
  bricolage: { label: 'Bricolage Grotesque', css: "'Bricolage Grotesque', system-ui, sans-serif" },
  nunito: { label: 'Nunito (redondita)', css: "'Nunito', system-ui, sans-serif" },
  quicksand: { label: 'Quicksand (fina)', css: "'Quicksand', system-ui, sans-serif" },
  fredoka: { label: 'Fredoka (burbuja)', css: "'Fredoka', system-ui, sans-serif" },
  gaegu: { label: 'Gaegu (a mano)', css: "'Gaegu', 'Comic Sans MS', cursive" },
  system: { label: 'La del sistema', css: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
};

const PATTERNS = [
  { id: 'dots', label: 'Puntos' }, { id: 'grid', label: 'Cuadros' }, { id: 'stripes', label: 'Rayas' },
  { id: 'zigzag', label: 'Zigzag' }, { id: 'stars', label: 'Estrellitas' }, { id: 'hearts', label: 'Corazones' },
  { id: 'leaves', label: 'Hojitas' },
];

function patternUrl(kind, color) {
  const c = color || DEFAULT_ACCENT;
  const svgs = {
    dots: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="6" cy="6" r="2.2" fill="${c}" opacity=".38"/><circle cx="18" cy="18" r="2.2" fill="${c}" opacity=".38"/></svg>`,
    grid: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M28 0H0V28" fill="none" stroke="${c}" stroke-opacity=".3" stroke-width="1.2"/></svg>`,
    stripes: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M-5 5 L5 -5 M0 20 L20 0 M15 25 L25 15" stroke="${c}" stroke-opacity=".22" stroke-width="4"/></svg>`,
    zigzag: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><polyline points="0,15 10,5 20,15 30,5 40,15" fill="none" stroke="${c}" stroke-opacity=".35" stroke-width="2.5"/></svg>`,
    stars: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><path d="M15 8l2 5 5 .5-4 3.5 1.3 5L15 19l-4.3 3 1.3-5-4-3.5 5-.5z" fill="${c}" opacity=".35"/><path d="M45 38l1.4 3.4 3.6.3-2.8 2.4.9 3.5-3.1-2-3.1 2 .9-3.5-2.8-2.4 3.6-.3z" fill="${c}" opacity=".25"/></svg>`,
    hearts: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M12 18c-3-4-9-1-6 4l6 5 6-5c3-5-3-8-6-4z" fill="${c}" opacity=".32"/><path d="M36 42c-2-3-7-1-5 3l5 4 5-4c2-4-3-6-5-3z" fill="${c}" opacity=".22"/></svg>`,
    leaves: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M12 30c6-12 18-12 22-10-4 10-14 16-22 10z" fill="${c}" opacity=".3"/><path d="M40 54c4-8 12-8 15-7-3 7-9 11-15 7z" fill="${c}" opacity=".22"/></svg>`,
  };
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgs[kind] || svgs.dots)}`;
}

const THEME_PRESETS = [
  { id: 'lavanda', label: 'Lavanda original', t: {} },
  { id: 'frutilla', label: 'Frutilla', t: { accent: '#ff5f8f', bg: '#fff0f3', surface: '#fffafb', ink: '#3a1f2b', bgType: 'pattern', pattern: 'hearts', patternColor: '#ff5f8f' } },
  { id: 'muneca', label: 'Muñeca rosa', t: { accent: '#ff4fa3', bg: '#ffe3f1', surface: '#fff7fb', ink: '#4a1235', hl: '#ffe066', font: 'fredoka', radius: 24, bgType: 'pattern', pattern: 'stars', patternColor: '#ff4fa3' } },
  { id: 'monstruito', label: 'Monstruito chic', t: { accent: '#e05ab6', bg: '#2a1f35', surface: '#34283f', ink: '#f6ecff', moss: '#8e44ad', hl: '#c7f464', dark: 'dark', bgType: 'pattern', pattern: 'stripes', patternColor: '#8e44ad' } },
  { id: 'dino', label: 'Dino', t: { accent: '#4e9a54', bg: '#eef5e4', surface: '#fbfff7', ink: '#1f3322', moss: '#4e9a54', bgType: 'pattern', pattern: 'leaves', patternColor: '#4e9a54' } },
  { id: 'alien', label: 'Héroe alien', t: { accent: '#2fbf4a', bg: '#e9f7ec', surface: '#fbfffb', ink: '#10261a', hl: '#c7f464', font: 'system', radius: 10, bgType: 'pattern', pattern: 'grid', patternColor: '#2fbf4a' } },
  { id: 'y2k', label: 'Y2K', t: { accent: '#5b8def', bg: '#eaf2ff', surface: '#fbfdff', ink: '#1d2a4a', font: 'quicksand', bgType: 'pattern', pattern: 'stars', patternColor: '#c78bd9' } },
  { id: 'noche', label: 'Noche', t: { dark: 'dark' } },
];

let themeToken = 0;

function isDarkTheme(t) {
  return t.dark === 'dark' || (t.dark === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

async function applyTheme(t) {
  const tok = ++themeToken;
  const dark = isDarkTheme(t);
  const accent = t.accent || DEFAULT_ACCENT;
  const bg = dark ? mixHex(t.bg || DEFAULT_BG, '#14111c', 0.9) : (t.bg || DEFAULT_BG);
  const surface = dark ? mixHex(t.surface || '#fffdf8', '#221c2e', 0.9) : (t.surface || '#fffdf8');
  const ink = dark ? '#efe9f7' : (t.ink || '#2a2238');
  const r = document.documentElement;
  const set = (k, v) => r.style.setProperty(k, v);
  set('--accent', accent);
  set('--accent-ink', dark ? mixHex(accent, '#ffffff', 0.35) : mixHex(accent, '#000000', 0.32));
  set('--accent-soft', mixHex(accent, surface, 0.84));
  set('--on-accent', isLight(accent) ? '#2a2238' : '#ffffff');
  set('--bg', bg);
  set('--surface', surface);
  set('--ink', ink);
  set('--muted', mixHex(ink, surface, 0.45));
  set('--line', mixHex(surface, ink, dark ? 0.2 : 0.12));
  set('--moss', t.moss || '#6f8f5a');
  set('--hl', t.hl || '#f5d76e');
  set('--hl-soft', mixHex(t.hl || '#f5d76e', surface, 0.55));
  set('--radius', `${Number(t.radius) || 18}px`);
  set('--font', (FONTS[t.font] || FONTS.bricolage).css);
  r.dataset.theme = dark ? 'dark' : 'light';
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = accent;

  let img = 'none', mode = 'tile', color = bg;
  if (t.bgType === 'color') color = dark ? mixHex(t.bgColor, '#14111c', 0.8) : t.bgColor;
  else if (t.bgType === 'pattern') img = `url("${patternUrl(t.pattern, t.patternColor || accent)}")`;
  else if (t.bgType === 'image') {
    let url = t.previewUrl || '';
    if (!url && t.bgImageId) url = await Files.url(t.bgImageId).catch(() => '');
    if (url) { img = `url("${url.replace(/"/g, '%22')}")`; mode = 'cover'; }
  }
  if (tok !== themeToken) return; // otra navegación ganó la carrera
  document.body.style.backgroundColor = color;
  document.body.style.backgroundImage = img;
  document.body.dataset.bgmode = mode;
  document.body.classList.toggle('glass', (t.bgType && t.bgType !== 'none') || !!t.glass);
}

const BULLETS = ['•', '◆', '★', '♥', '✿', '✦', '➜', '○', '☾', '♪', '~', '—'];

// Viñeta de las listas (Ajustes → Apariencia)
function applyBullet() {
  const b = String(Store.data.settings.bullet || '•').slice(0, 3);
  document.documentElement.style.setProperty('--bullet', JSON.stringify(b));
}

function globalTheme() { return { ...Store.data.settings.theme }; }

function subjectTheme(s) {
  const g = globalTheme();
  const st = s.theme || {};
  return { ...g, accent: s.color || g.accent, bgType: st.bgType || 'none', bgColor: st.bgColor, pattern: st.pattern || 'dots', patternColor: s.color, bgImageId: st.bgImageId || '' };
}

/* ---------- Editor de fondo (se usa en Ajustes y en cada materia) ---------- */

function bgEditorHTML(t, patternColor) {
  const types = [['none', 'Ninguno'], ['color', 'Color'], ['pattern', 'Patrón'], ['image', 'Imagen']];
  return `
    <div class="chip-row" role="radiogroup" aria-label="Tipo de fondo">
      ${types.map(([v, l]) => `<button type="button" class="chip-opt ${t.bgType === v ? 'on' : ''}" data-bgtype="${v}">${l}</button>`).join('')}
    </div>
    <div class="bg-opts" data-show="color" ${t.bgType === 'color' ? '' : 'hidden'}>
      <label class="inline">Color de fondo <input type="color" data-bgcolor value="${t.bgColor || '#efe7fb'}"></label>
    </div>
    <div class="bg-opts" data-show="pattern" ${t.bgType === 'pattern' ? '' : 'hidden'}>
      <div class="presets">${PATTERNS.map((p) => `<button type="button" class="preset ${t.pattern === p.id ? 'on' : ''}" data-pattern="${p.id}" style="background-image:url('${patternUrl(p.id, patternColor)}')">${p.label}</button>`).join('')}</div>
    </div>
    <div class="bg-opts" data-show="image" ${t.bgType === 'image' ? '' : 'hidden'}>
      <label class="btn ghost sm">Elegir imagen<input type="file" accept="image/*" data-bgfile hidden></label>
      <span class="muted small">${t.bgImageId ? 'Imagen cargada ✓' : 'Todavía no elegiste ninguna.'}</span>
    </div>`;
}

/**
 * Conecta el editor de fondo. onChange(patch) recibe los cambios; si hay imagen nueva,
 * primero la guarda en IndexedDB y manda {bgImageId}.
 */
function bindBgEditor(root, current, onChange) {
  $$('[data-bgtype]', root).forEach((b) => (b.onclick = () => onChange({ bgType: b.dataset.bgtype })));
  const col = $('[data-bgcolor]', root);
  if (col) col.oninput = () => onChange({ bgColor: col.value }, { live: true });
  if (col) col.onchange = () => onChange({ bgColor: col.value });
  $$('[data-pattern]', root).forEach((b) => (b.onclick = () => onChange({ pattern: b.dataset.pattern })));
  const file = $('[data-bgfile]', root);
  if (file) file.onchange = async () => {
    const f = file.files[0];
    if (!f) return;
    const id = uid();
    try { await Files.put(id, f); } catch (e) { toast('No se pudo guardar la imagen.'); return; }
    if (current.bgImageId) await Files.del(current.bgImageId);
    onChange({ bgType: 'image', bgImageId: id });
  };
}
