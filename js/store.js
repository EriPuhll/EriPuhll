'use strict';

/* ---------- Datos: localStorage para todo lo liviano ---------- */

const STORE_KEY = 'perezoso-data-v1';

const Store = {
  data: null,

  defaults() {
    return {
      subjects: [],
      events: [],
      classes: [],
      sessions: [],
      activeSession: null,
      pomodoro: { work: 25, short: 5, long: 15, cycles: 4, subjectId: '', autoNext: true },
      settings: {
        calMode: 'pruebas',
        slothEnabled: true,
        theme: { accent: DEFAULT_ACCENT, bgColor: DEFAULT_BG, bgMode: 'tile', bgImageId: '', bgUrl: '' },
      },
    };
  },

  load() {
    const def = this.defaults();
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { saved = {}; }
    this.data = this.merge(def, saved);
  },

  merge(def, saved) {
    const d = Object.assign(def, saved);
    d.pomodoro = Object.assign(this.defaults().pomodoro, saved.pomodoro || {});
    const sset = saved.settings || {};
    d.settings = Object.assign(this.defaults().settings, sset);
    d.settings.theme = Object.assign(this.defaults().settings.theme, sset.theme || {});
    return d;
  },

  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
    } catch (e) {
      toast('No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado.');
    }
  },
};

/* ---------- Archivos: IndexedDB para documentos e imágenes de fondo ---------- */

const Files = {
  db: null,
  urls: new Map(),

  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('perezoso-files', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('blobs');
      req.onsuccess = () => { this.db = req.result; resolve(this.db); };
      req.onerror = () => reject(req.error);
    });
  },

  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const t = db.transaction('blobs', mode);
      const r = fn(t.objectStore('blobs'));
      t.oncomplete = () => resolve(r && r.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  },

  put(id, blob) { return this.tx('readwrite', (s) => s.put(blob, id)); },
  get(id) { return this.tx('readonly', (s) => s.get(id)); },
  async del(id) {
    if (!id) return;
    if (this.urls.has(id)) { URL.revokeObjectURL(this.urls.get(id)); this.urls.delete(id); }
    await this.tx('readwrite', (s) => s.delete(id)).catch(() => {});
  },
  clear() { return this.tx('readwrite', (s) => s.clear()); },

  async url(id) {
    if (this.urls.has(id)) return this.urls.get(id);
    const blob = await this.get(id);
    if (!blob) throw new Error('Archivo no encontrado');
    const u = URL.createObjectURL(blob);
    this.urls.set(id, u);
    return u;
  },
};

/* ---------- Consultas comunes ---------- */

function subjectById(id) { return Store.data.subjects.find((s) => s.id === id); }
function subjectColor(id) { const s = subjectById(id); return s ? s.color : '#b9aec9'; }
function subjectName(id) { const s = subjectById(id); return s ? s.name : 'Sin materia'; }
function sessionMinutes(se) { return (se.end - se.start) / 60000; }
function studiedMinutes(subjectId) {
  return Store.data.sessions.filter((se) => se.subjectId === subjectId).reduce((a, se) => a + sessionMinutes(se), 0);
}
function goalMinutes(s) { return (Number(s.credits) || 0) * 10 * 60; } // 1 crédito = 10 horas
function semLabel(s) { return s === '1' ? '1er semestre' : s === '2' ? '2do semestre' : s === 'anual' ? 'Anual' : 'Semestre'; }
function subjectOptions(selected, { allowEmpty = false, emptyLabel = '— Sin materia —' } = {}) {
  const opts = Store.data.subjects.map((s) => `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  return (allowEmpty ? `<option value="">${esc(emptyLabel)}</option>` : '') + opts;
}
function groupEventsByDate() {
  const map = {};
  Store.data.events.slice().sort(byEventDate).forEach((ev) => { (map[ev.date] = map[ev.date] || []).push(ev); });
  return map;
}
