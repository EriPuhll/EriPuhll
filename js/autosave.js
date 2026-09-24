'use strict';

/* ---------- Guardado automático en un archivo de la compu ----------
 * Usa la File System Access API (Chrome, Edge y Opera de escritorio).
 * La persona elige una vez dónde guardar "perezoso-datos.json" y desde ahí
 * cada cambio se escribe solo. Si el archivo está en la carpeta de Google
 * Drive u OneDrive, además queda en la nube.
 */

const AUTOSAVE_KEY = 'meta:autosave-handle';

const AutoSave = {
  supported: 'showSaveFilePicker' in window,
  handle: null,
  status: 'off', // off | ok | needs-permission | unsupported | error
  lastSaved: 0,
  timer: null,

  fileTypes: [{ description: 'Datos de Perezoso', accept: { 'application/json': ['.json'] } }],

  async init() {
    if (!this.supported) { this.status = 'unsupported'; return; }
    try { this.handle = (await Files.get(AUTOSAVE_KEY)) || null; } catch (e) { this.handle = null; }
    if (!this.handle) { this.status = 'off'; return; }
    try {
      const p = await this.handle.queryPermission({ mode: 'readwrite' });
      this.status = p === 'granted' ? 'ok' : 'needs-permission';
    } catch (e) { this.status = 'needs-permission'; }
    if (this.status === 'ok') await this.write();
    this.paint();
  },

  // Elegir dónde guardar (necesita un clic de la persona)
  async choose() {
    try {
      const h = await window.showSaveFilePicker({ suggestedName: 'perezoso-datos.json', types: this.fileTypes });
      await this.link(h);
      await this.write();
      toast('¡Listo! Desde ahora todo se guarda solo en ese archivo 💾');
    } catch (e) {
      if (e.name !== 'AbortError') toast('No se pudo elegir el archivo.');
    }
  },

  // Abrir un archivo de datos que ya existe (por ejemplo en otra compu)
  async openExisting() {
    try {
      const [h] = await window.showOpenFilePicker({ types: this.fileTypes });
      const data = parseBackup(await (await h.getFile()).text());
      if (!data) { toast('Ese archivo no parece de Perezoso.'); return; }
      if (Store.data.subjects.length && !confirm('Esto reemplaza lo que tenés ahora por lo del archivo. ¿Seguimos?')) return;
      if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') { toast('Necesito permiso para seguir guardando en ese archivo.'); return; }
      await this.link(h);
      Store.data = Store.merge(Store.defaults(), data);
      Store.save();
      toast('Datos cargados y guardado automático activado 💾');
      rerender();
    } catch (e) {
      if (e.name !== 'AbortError') toast('No se pudo abrir el archivo.');
    }
  },

  async reconnect() {
    if (!this.handle) return;
    try {
      const p = await this.handle.requestPermission({ mode: 'readwrite' });
      this.status = p === 'granted' ? 'ok' : 'needs-permission';
    } catch (e) { this.status = 'needs-permission'; }
    if (this.status === 'ok') { await this.write(); toast('Guardado automático reconectado 💾'); }
    this.paint();
  },

  async disconnect() {
    await Files.del(AUTOSAVE_KEY);
    this.handle = null;
    this.status = 'off';
    this.paint();
  },

  async link(h) {
    this.handle = h;
    this.status = 'ok';
    await Files.put(AUTOSAVE_KEY, h);
  },

  schedule() {
    if (this.status !== 'ok') return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.write(), 800);
  },

  async write() {
    if (!this.handle) return;
    try {
      const w = await this.handle.createWritable();
      await w.write(JSON.stringify({ app: 'perezoso', savedAt: new Date().toISOString(), data: Store.data }, null, 1));
      await w.close();
      this.lastSaved = Date.now();
      this.status = 'ok';
    } catch (e) {
      this.status = e.name === 'NotAllowedError' || e.name === 'SecurityError' ? 'needs-permission' : 'error';
    }
    this.paint();
  },

  fileName() { return this.handle ? this.handle.name : ''; },

  // Aviso arriba cuando hay que volver a dar permiso (el navegador lo pide al reabrir)
  paint() {
    const bar = $('#save-banner');
    if (!bar) return;
    if (this.status === 'needs-permission' || this.status === 'error') {
      bar.hidden = false;
      bar.innerHTML = `<span>💾 ${this.status === 'error' ? 'No pude escribir en' : 'Para seguir guardando solo en'} <strong>${esc(this.fileName())}</strong> tocá acá.</span>
        <button class="btn sm" id="save-reconnect">${this.status === 'error' ? 'Reintentar' : 'Permitir'}</button>`;
      $('#save-reconnect').onclick = () => (this.status === 'error' ? this.write() : this.reconnect());
    } else bar.hidden = true;
    if (location.hash === '#ajustes' && $('#autosave-card')) paintAutosaveCard();
  },
};

// Acepta tanto el archivo de guardado automático como un respaldo descargado
function parseBackup(text) {
  try {
    const raw = JSON.parse(text);
    const data = raw && raw.app === 'perezoso' && raw.data ? raw.data : raw;
    return data && Array.isArray(data.subjects) ? data : null;
  } catch (e) { return null; }
}

/* ---------- Instalar como app (PWA) ---------- */

const Install = {
  prompt: null,
  init() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.prompt = e;
      if (location.hash === '#ajustes') renderSettings();
    });
    window.addEventListener('appinstalled', () => { this.prompt = null; toast('¡Perezoso instalado! Buscalo en tu escritorio 🦥'); });
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    // Pide al navegador que no borre los datos si le falta espacio
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  },
  installed() { return window.matchMedia('(display-mode: standalone)').matches; },
  async run() {
    if (!this.prompt) return;
    this.prompt.prompt();
    await this.prompt.userChoice.catch(() => {});
    this.prompt = null;
    renderSettings();
  },
};
