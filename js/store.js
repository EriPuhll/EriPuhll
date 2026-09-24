'use strict';

/* ---------- Capa de datos ----------
 * Todo lo liviano va en localStorage (un solo objeto JSON) y los archivos
 * (documentos, imágenes de fondo) en IndexedDB. El resto de la app solo usa
 * Store.data, Store.save() y las consultas de abajo, así más adelante se
 * puede cambiar por un backend sin tocar las pantallas.
 */

const STORE_KEY = 'perezoso-data-v1';
const DATA_VERSION = 2;

const Store = {
  data: null,
  isFirstRun: false,

  defaults() {
    const y = new Date().getFullYear();
    return {
      version: DATA_VERSION,
      subjects: [],
      events: [],
      classes: [],
      sessions: [],
      simulacros: [],
      projects: [],
      activeSession: null,
      activeSim: null,
      remindersSent: {},
      pomodoro: { work: 25, short: 5, long: 15, cycles: 4, subjectId: '', autoNext: true },
      sloth: {
        name: 'Paco', fur: '#c39b76', personality: 'dramatico', frequency: 'a_veces', sound: true,
        equipped: {}, unlockedSeen: null, proudUntil: 0,
      },
      settings: {
        userName: 'Erika',
        hoursPerCredit: 10,
        semesterStart: `${y}-08-03`,
        semesterEnd: `${y}-12-19`,
        reminderDays: [7, 2, 1],
        calMode: 'pruebas',
        showFreeTime: true,
        bullet: '•',
        layout: { hidden: { 'materia.faltas': true }, collapsed: {} },
        subjectTabsHidden: [],
        seedDismissed: false,
        theme: defaultGlobalTheme(),
      },
    };
  },

  load() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { saved = null; }
    this.isFirstRun = !saved;
    this.data = this.merge(this.defaults(), saved || {});
    if (this.isFirstRun) {
      seedInitialData(this.data);
      this.data.settings.seedNotice = true;
      this.save();
    }
  },

  merge(def, saved) {
    const d = Object.assign(def, saved);
    const fresh = this.defaults();
    d.pomodoro = Object.assign(fresh.pomodoro, saved.pomodoro || {});
    d.sloth = Object.assign(fresh.sloth, saved.sloth || {});
    d.sloth.equipped = Object.assign({}, (saved.sloth || {}).equipped || {});
    if (d.sloth.fur === '#a88a6d') d.sloth.fur = '#c39b76'; // color del dibujo anterior
    const sset = saved.settings || {};
    d.settings = Object.assign(fresh.settings, sset);
    d.settings.theme = migrateGlobalTheme(sset.theme);
    ['subjects', 'events', 'classes', 'sessions', 'simulacros', 'projects'].forEach((k) => { if (!Array.isArray(d[k])) d[k] = []; });
    if (!d.remindersSent || typeof d.remindersSent !== 'object') d.remindersSent = {};
    d.subjects.forEach(migrateSubject);
    d.projects.forEach((p) => { p.members = p.members || []; p.links = p.links || []; p.tasks = p.tasks || []; });
    d.version = DATA_VERSION;
    return d;
  },

  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
    } catch (e) {
      toast('No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado.');
    }
    if (typeof AutoSave !== 'undefined') AutoSave.schedule();
  },
};

function defaultGlobalTheme() {
  return {
    accent: DEFAULT_ACCENT, bg: DEFAULT_BG, surface: '#fffdf8', ink: '#2a2238', moss: '#6f8f5a', hl: '#f5d76e',
    font: 'bricolage', radius: 18, dark: 'light', glass: false,
    bgType: 'none', pattern: 'dots', patternColor: DEFAULT_ACCENT, bgColor: '#efe7fb', bgImageId: '',
  };
}

function migrateGlobalTheme(t) {
  const def = defaultGlobalTheme();
  if (!t) return def;
  const out = Object.assign(def, t);
  // Formato viejo: {accent, bgColor, bgMode, bgImageId, bgUrl}
  if ('bgMode' in t || 'bgUrl' in t) {
    out.bg = t.bgColor || DEFAULT_BG;
    out.bgType = t.bgImageId ? 'image' : t.bgUrl ? 'pattern' : 'none';
    delete out.bgMode; delete out.bgUrl;
    if (out.bgType !== 'image') out.bgColor = def.bgColor;
  }
  return out;
}

function migrateSubject(s) {
  if (!Array.isArray(s.professors)) {
    s.professors = (s.professor || (s.emails && s.emails.length)) ? [{ name: s.professor || '', emails: s.emails || [] }] : [];
  }
  delete s.professor; delete s.emails;
  s.tag = s.tag || '';
  s.bibliography = s.bibliography || '';
  s.rule = s.rule || '';
  s.absences = Number(s.absences) || 0;
  s.maxAbsences = s.maxAbsences === '' || s.maxAbsences == null ? null : Number(s.maxAbsences);
  s.pendingNotes = s.pendingNotes || [];
  s.practicos = s.practicos || [];
  if (!s.grading) {
    s.grading = {
      scale: 12, pass: 6, target: null,
      components: (s.evaluations || []).map((e) => ({
        id: e.id || uid(), name: e.name || 'Evaluación', weight: Number(e.weight) || 0, max: Number(e.max) || 12,
        kind: 'single', count: 1, best: 1, grades: [e.grade === '' || e.grade == null ? '' : Number(e.grade)],
      })),
    };
  }
  delete s.evaluations; delete s.targetGrade;
  s.sections = s.sections || [];
  s.docs = (s.docs || []).map((d, i) => ({ kind: 'file', title: d.name, order: i, ...d }));
  const t = s.theme || {};
  if (!t.bgType) {
    s.theme = {
      bgType: t.bgImageId ? 'image' : t.bgUrl ? 'pattern' : t.bgColor ? 'color' : 'none',
      bgColor: t.bgColor || '#efe7fb', pattern: 'dots', bgImageId: t.bgImageId || '',
    };
  }
}

function newSubject(fields = {}) {
  const n = Store.data ? Store.data.subjects.length : 0;
  const now = new Date();
  const s = {
    id: uid(), name: '', semester: now.getMonth() < 6 ? '1' : '2', year: now.getFullYear(), tag: '',
    professors: [], bibliography: '', credits: 0, rule: '', absences: 0, maxAbsences: null, pendingNotes: [],
    color: SUBJECT_COLORS[n % SUBJECT_COLORS.length],
    theme: { bgType: 'none', bgColor: '#efe7fb', pattern: 'dots', bgImageId: '' },
    sections: ['Prácticos', 'Teórico', 'Exámenes anteriores'].map((name) => ({ id: uid(), name })),
    docs: [], practicos: [], grading: { scale: 12, pass: 6, target: null, components: [] },
  };
  if (fields.sections) fields.sections = fields.sections.map((name) => ({ id: uid(), name }));
  return Object.assign(s, fields);
}

/* ---------- Datos iniciales (2º semestre 2026) ---------- */

function seedInitialData(d, { onlyMissing = false } = {}) {
  const has = (name) => d.subjects.some((s) => s.name.toLowerCase() === name.toLowerCase());
  const add = (fields) => {
    if (onlyMissing && has(fields.name)) return d.subjects.find((s) => s.name.toLowerCase() === fields.name.toLowerCase());
    const s = newSubject({ semester: '2', year: 2026, ...fields });
    s.color = fields.color;
    d.subjects.push(s);
    return s;
  };
  const fisica = add({
    name: 'Física', color: '#6c9eeb',
    bibliography: 'Serway, vol. 2 (electromagnetismo)',
    sections: ['Prácticos', 'Teórico', 'Exámenes anteriores', 'Hoja de fórmulas'],
    rule: 'Examen de 16 ejercicios, cada uno bien vale 1, tope 12. Para aprobar necesito 6 bien.',
    pendingNotes: [{ id: uid(), text: 'Hacer del Práctico 4 en adelante, solo los ejercicios marcados en amarillo.', done: false }],
  });
  add({ name: 'Análisis Matemático II', tag: 'Recursando', color: '#a075ea' });
  add({ name: 'Teoría de Circuitos', bibliography: 'Oppenheim, Señales y Sistemas', color: '#f2a65a' });
  const bd = add({ name: 'Base de Datos', color: '#5fb3a1' });
  const lab = add({ name: 'Laboratorio TIC', color: '#f28bb3', rule: 'Clases los lunes.' });

  const addEvent = (subjectId, type, title, date) => {
    if (onlyMissing && d.events.some((e) => e.subjectId === subjectId && e.date === date)) return;
    d.events.push({ id: uid(), type, customType: '', subjectId, title, date, time: '', notes: 'Hora a confirmar', projectId: '' });
  };
  addEvent(fisica.id, 'examen', 'Examen de Física', '2026-12-04');
  addEvent(bd.id, 'examen', 'Examen de Base de Datos', '2026-12-18');

  const addProject = (p) => {
    if (onlyMissing && d.projects.some((x) => x.name === p.name)) return;
    d.projects.push({ id: uid(), tasks: [], links: [], ...p });
  };
  addProject({ name: 'Mulita Software', subjectId: lab.id, members: ['Erika Puhl', 'Jue Yin Wu'], links: [{ title: 'Repositorio', url: 'https://github.com/JueYin-Wu/MulitaSoftware' }] });
  addProject({ name: 'PrimerPaso', subjectId: '', members: ['Santiago Onandi', 'Erika Puhl', 'Aymeric Tonnel', 'Beatriz Alcalá', 'Juan Ignacio Pandolfi'] });

  d.settings.userName = d.settings.userName || 'Erika';
  d.settings.semesterStart = '2026-08-03';
  d.settings.semesterEnd = '2026-12-19';
}

/* ---------- Archivos: IndexedDB para documentos e imágenes ---------- */

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
  keys() { return this.tx('readonly', (s) => s.getAllKeys()); },
  async del(id) {
    if (!id) return;
    if (this.urls.has(id)) { URL.revokeObjectURL(this.urls.get(id)); this.urls.delete(id); }
    await this.tx('readwrite', (s) => s.delete(id)).catch(() => {});
  },
  clear() { this.urls.clear(); return this.tx('readwrite', (s) => s.clear()); },

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
function projectById(id) { return Store.data.projects.find((p) => p.id === id); }
function sessionMinutes(se) { return (se.end - se.start) / 60000; }
function studiedMinutes(subjectId, from = 0, to = Infinity) {
  return Store.data.sessions
    .filter((se) => (!subjectId || se.subjectId === subjectId) && se.start >= from && se.start < to)
    .reduce((a, se) => a + sessionMinutes(se), 0);
}
function hoursPerCredit() { return Number(Store.data.settings.hoursPerCredit) || 10; }
function goalMinutes(s) { return (Number(s.credits) || 0) * hoursPerCredit() * 60; }
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

function semesterBounds() {
  const st = Store.data.settings;
  const start = parseDate(st.semesterStart);
  const end = parseDate(st.semesterEnd);
  end.setHours(23, 59, 59);
  return { start, end };
}

/** Ritmo de una materia: cuánto falta, cuánto por semana y si va atrasada. */
function subjectPace(s, now = Date.now()) {
  const goal = goalMinutes(s);
  const done = studiedMinutes(s.id);
  const left = Math.max(0, goal - done);
  const { start, end } = semesterBounds();
  const span = Math.max(1, end - start);
  const elapsed = clamp((now - start) / span, 0, 1);
  const weeksLeft = now < end ? Math.max(1, Math.ceil((end - now) / (7 * DAY_MS))) : 0;
  const perWeek = weeksLeft ? left / weeksLeft : left;
  const expected = goal * elapsed;
  const behind = goal > 0 && elapsed > 0.04 && done < expected * 0.85;
  const weekDone = studiedMinutes(s.id, startOfWeek(new Date(now)).getTime());
  return { goal, done, left, weeksLeft, perWeek, expected, behind, weekDone, over: done - goal };
}

function lastStudyTime() {
  return Store.data.sessions.reduce((m, se) => Math.max(m, se.end), 0);
}

// Días seguidos con al menos una sesión (si hoy todavía no hay, cuenta hasta ayer)
function streakDays(now = new Date()) {
  const days = new Set(Store.data.sessions.map((se) => toISODate(new Date(se.start))));
  const d = startOfDay(now);
  if (!days.has(toISODate(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(toISODate(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function semesterMinutes() {
  const { start } = semesterBounds();
  return studiedMinutes('', start.getTime());
}

// Semanas (lunes ISO) con 3 o más pruebas
function criticalWeeks() {
  const count = {};
  Store.data.events.filter((e) => EXAM_TYPES.includes(e.type)).forEach((e) => {
    const k = toISODate(startOfWeek(parseDate(e.date)));
    count[k] = (count[k] || 0) + 1;
  });
  return Object.keys(count).filter((k) => count[k] >= 3).reduce((o, k) => { o[k] = count[k]; return o; }, {});
}

function addSession(subjectId, start, end, source) {
  const se = { id: uid(), subjectId, start, end, source };
  Store.data.sessions.push(se);
  Store.save();
  if (typeof Sloth !== 'undefined') Sloth.checkUnlocks();
  return se;
}
