'use strict';

/* ---------- Temas: colores y fondos estilo Tumblr ---------- */

const svgPattern = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const BG_PRESETS = [
  { id: 'none', label: 'Liso', url: '' },
  { id: 'dots', label: 'Puntitos', url: svgPattern('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="4" cy="4" r="2" fill="#a075ea" opacity=".22"/><circle cx="16" cy="16" r="2" fill="#a075ea" opacity=".22"/></svg>') },
  { id: 'grid', label: 'Cuadrillé', url: svgPattern('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M28 0H0V28" fill="none" stroke="#6c9eeb" stroke-opacity=".18"/></svg>') },
  { id: 'stars', label: 'Estrellitas', url: svgPattern('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><path d="M15 8l2 5 5 .5-4 3.5 1.3 5L15 19l-4.3 3 1.3-5-4-3.5 5-.5z" fill="#f2a65a" opacity=".3"/><path d="M45 38l1.4 3.4 3.6.3-2.8 2.4.9 3.5-3.1-2-3.1 2 .9-3.5-2.8-2.4 3.6-.3z" fill="#a075ea" opacity=".3"/></svg>') },
  { id: 'leaves', label: 'Hojitas', url: svgPattern('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M12 30c6-12 18-12 22-10-4 10-14 16-22 10z" fill="#8cc084" opacity=".28"/><path d="M40 54c4-8 12-8 15-7-3 7-9 11-15 7z" fill="#5fb3a1" opacity=".28"/></svg>') },
  { id: 'hearts', label: 'Corazones', url: svgPattern('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M12 18c-3-4-9-1-6 4l6 5 6-5c3-5-3-8-6-4z" fill="#f28bb3" opacity=".3"/><path d="M36 42c-2-3-7-1-5 3l5 4 5-4c2-4-3-6-5-3z" fill="#a075ea" opacity=".25"/></svg>') },
];

let themeToken = 0;

async function applyTheme(t) {
  const tok = ++themeToken;
  const root = document.documentElement.style;
  root.setProperty('--accent', t.accent || DEFAULT_ACCENT);
  root.setProperty('--bg', t.bgColor || DEFAULT_BG);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = t.accent || DEFAULT_ACCENT;

  let url = t.previewUrl || '';
  if (!url && t.bgImageId) url = await Files.url(t.bgImageId).catch(() => '');
  if (!url && t.bgUrl) url = t.bgUrl;
  if (tok !== themeToken) return; // otra navegación ganó la carrera
  document.body.style.backgroundImage = url ? `url("${url.replace(/"/g, '%22')}")` : 'none';
  document.body.dataset.bgmode = t.bgMode || 'tile';
}

function globalTheme() { return { ...Store.data.settings.theme }; }

function subjectTheme(s) {
  const g = globalTheme();
  const t = s.theme || {};
  const ownBg = t.bgImageId || t.bgUrl;
  return {
    accent: s.color || g.accent,
    bgColor: t.bgColor || g.bgColor,
    bgImageId: ownBg ? t.bgImageId : g.bgImageId,
    bgUrl: ownBg ? t.bgUrl : g.bgUrl,
    bgMode: t.bgMode || g.bgMode,
  };
}

/**
 * Editor de apariencia (sirve para la app entera y para cada materia).
 * current: {accent, bgColor, bgMode, bgImageId, bgUrl}
 * onSave(draft) recibe el resultado final ya con la imagen guardada.
 */
function openThemeEditor({ title, current, accentLabel = 'Color principal', onSave, onCancel }) {
  const draft = { ...current, previewUrl: '', newFile: null, removeImage: false };
  const presetOf = () => (BG_PRESETS.find((p) => p.url && p.url === draft.bgUrl) || {}).id;
  let saved = false;

  const preview = () => applyTheme({ ...draft, bgImageId: draft.removeImage ? '' : draft.bgImageId });

  Modal.open(title, `
    <form class="form theme-form" id="theme-form">
      <div class="row">
        <label>${esc(accentLabel)}<input type="color" name="accent" value="${draft.accent || DEFAULT_ACCENT}"></label>
        <label>Color de fondo<input type="color" name="bgColor" value="${draft.bgColor || DEFAULT_BG}"></label>
      </div>
      <fieldset>
        <legend>Fondo de la página</legend>
        <div class="presets">
          ${BG_PRESETS.map((p) => `<button type="button" class="preset" data-preset="${p.id}" style="${p.url ? `background-image:url('${p.url}')` : ''}">${p.label}</button>`).join('')}
        </div>
        <div class="row">
          <label>Subir imagen<input type="file" name="file" accept="image/*"></label>
          <label>…o pegar un link de imagen<input type="url" name="bgUrl" placeholder="https://…" value="${esc(draft.bgUrl && !draft.bgUrl.startsWith('data:') ? draft.bgUrl : '')}"></label>
        </div>
        <label>Cómo se ve
          <select name="bgMode">
            <option value="tile">Mosaico (como Tumblr)</option>
            <option value="cover">Cubrir toda la página</option>
            <option value="center">Centrada, sin repetir</option>
          </select>
        </label>
        <button type="button" class="btn ghost sm" id="rm-img">Quitar imagen de fondo</button>
      </fieldset>
      <div class="form-actions">
        <button type="button" class="btn ghost" id="reset-theme">Volver al lila original</button>
        <span class="grow"></span>
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button class="btn">Guardar</button>
      </div>
    </form>`, (body) => {
    const f = $('#theme-form', body);
    const el = f.elements;
    el.bgMode.value = draft.bgMode || 'tile';
    const markPreset = () => $$('.preset', f).forEach((b) => b.classList.toggle('on', b.dataset.preset === (presetOf() || (!draft.bgUrl && !draft.bgImageId && !draft.previewUrl ? 'none' : ''))));
    markPreset();

    el.accent.oninput = () => { draft.accent = el.accent.value; preview(); };
    el.bgColor.oninput = () => { draft.bgColor = el.bgColor.value; preview(); };
    el.bgMode.onchange = () => { draft.bgMode = el.bgMode.value; preview(); };
    el.bgUrl.onchange = () => {
      draft.bgUrl = el.bgUrl.value.trim();
      if (draft.bgUrl) { draft.removeImage = true; draft.previewUrl = ''; draft.newFile = null; }
      preview(); markPreset();
    };
    el.file.onchange = () => {
      const file = el.file.files[0];
      if (!file) return;
      draft.newFile = file;
      draft.previewUrl = URL.createObjectURL(file);
      draft.bgUrl = '';
      el.bgUrl.value = '';
      if (draft.bgMode === 'tile' && file.size > 150 * 1024) { draft.bgMode = 'cover'; el.bgMode.value = 'cover'; }
      preview(); markPreset();
    };
    $$('.preset', f).forEach((b) => (b.onclick = () => {
      const p = BG_PRESETS.find((x) => x.id === b.dataset.preset);
      draft.bgUrl = p.url;
      draft.previewUrl = ''; draft.newFile = null; draft.removeImage = true;
      draft.bgMode = 'tile'; el.bgMode.value = 'tile'; el.bgUrl.value = ''; el.file.value = '';
      preview(); markPreset();
    }));
    $('#rm-img', f).onclick = () => {
      draft.previewUrl = ''; draft.newFile = null; draft.bgUrl = ''; draft.removeImage = true;
      el.bgUrl.value = ''; el.file.value = '';
      preview(); markPreset();
    };
    $('#reset-theme', f).onclick = () => {
      Object.assign(draft, { accent: DEFAULT_ACCENT, bgColor: DEFAULT_BG, bgMode: 'tile', bgUrl: BG_PRESETS[1].url, previewUrl: '', newFile: null, removeImage: true });
      el.accent.value = DEFAULT_ACCENT; el.bgColor.value = DEFAULT_BG; el.bgMode.value = 'tile'; el.bgUrl.value = ''; el.file.value = '';
      preview(); markPreset();
    };

    f.onsubmit = async (e) => {
      e.preventDefault();
      const out = { accent: draft.accent, bgColor: draft.bgColor, bgMode: draft.bgMode, bgUrl: draft.bgUrl, bgImageId: draft.bgImageId };
      if (draft.newFile) {
        const id = uid();
        try { await Files.put(id, draft.newFile); } catch (err) { toast('No se pudo guardar la imagen.'); return; }
        if (current.bgImageId) await Files.del(current.bgImageId);
        out.bgImageId = id;
        out.bgUrl = '';
      } else if (draft.removeImage && current.bgImageId) {
        await Files.del(current.bgImageId);
        out.bgImageId = '';
      }
      saved = true;
      onSave(out);
      Modal.close();
    };
  }, () => { if (!saved && onCancel) onCancel(); });
}
