'use strict';

/* ---------- Utilidades generales ---------- */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const DAY_MS = 864e5;

const DEFAULT_ACCENT = '#a075ea';
const DEFAULT_BG = '#f4f0e6';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const EVENT_TYPES = [
  { id: 'control', label: 'Control', icon: '' },
  { id: 'laboratorio', label: 'Entrega de laboratorio', icon: '' },
  { id: 'entregable', label: 'Entregable', icon: '' },
  { id: 'parcial', label: 'Parcial', icon: '' },
  { id: 'examen', label: 'Examen', icon: '' },
  { id: 'practico', label: 'Práctico', icon: '' },
  { id: 'charla', label: 'Charla', icon: '' },
  { id: 'otro', label: 'Otro', icon: '' },
];
// Tipos que cuentan como "prueba" para marcar semanas críticas
const EXAM_TYPES = ['control', 'laboratorio', 'entregable', 'parcial', 'examen', 'practico'];

const SUBJECT_COLORS = ['#a075ea', '#f28bb3', '#5fb3a1', '#f2a65a', '#6c9eeb', '#e46a6a', '#6f8f5a', '#c78bd9', '#e0b43a', '#4bb3c9'];

function eventType(ev) {
  return EVENT_TYPES.find((t) => t.id === ev.type) || EVENT_TYPES[EVENT_TYPES.length - 1];
}
function typeLabel(ev) {
  return ev.type === 'otro' && ev.customType ? ev.customType : eventType(ev).label;
}

/* ---------- Fechas ---------- */

function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function toMin(hhmm) {
  const [h, m] = (hhmm || '0:0').split(':').map(Number);
  return h * 60 + m;
}
function minToHHMM(min) { return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`; }
function eventDate(ev) {
  const d = parseDate(ev.date);
  if (ev.time) { const [h, m] = ev.time.split(':').map(Number); d.setHours(h, m); }
  return d;
}
function byEventDate(a, b) { return eventDate(a) - eventDate(b); }
// Días de calendario entre hoy y la fecha del evento (0 = hoy, 1 = mañana)
function daysUntil(dateIso, now = new Date()) {
  return Math.round((parseDate(dateIso) - startOfDay(now)) / DAY_MS);
}
function fmtDateShort(d) {
  return `${DAYS_SHORT[(d.getDay() + 6) % 7].toLowerCase()} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()}`;
}
function fmtDateLong(d) {
  return `${DAYS[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()}`;
}
function fmtTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function startOfWeek(d) {
  const r = startOfDay(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}

/* ---------- Duraciones ---------- */

function fmtHM(mins) {
  const total = Math.round(Math.abs(mins));
  const h = Math.floor(total / 60), m = total % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}
function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}
function fmtMS(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
// "12 d 4 h" o, si falta menos de un día, "5 h 20 min"
function countdown(target, now = new Date()) {
  let diff = target - now;
  const past = diff < 0;
  diff = Math.abs(diff);
  const days = Math.floor(diff / DAY_MS);
  const hours = Math.floor((diff % DAY_MS) / 36e5);
  const mins = Math.floor((diff % 36e5) / 6e4);
  let txt;
  if (days > 0) txt = `${days} d ${hours} h`;
  else if (hours > 0) txt = `${hours} h ${mins} min`;
  else txt = `${mins} min`;
  const level = past ? 'past' : diff < 3 * DAY_MS ? 'urgent' : diff < 7 * DAY_MS ? 'soon' : 'ok';
  return { text: past ? `hace ${txt}` : txt, past, level, days };
}

/* ---------- Colores ---------- */

function hexToRgb(hex) {
  let h = String(hex || DEFAULT_ACCENT).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => pad(Math.round(clamp(v, 0, 255)).toString(16))).join('');
}
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
}
function isLight(rgb) {
  const [r, g, b] = Array.isArray(rgb) ? rgb : hexToRgb(rgb);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

/* ---------- UI: toast, modal, preguntas ---------- */

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 3000);
}

const Modal = {
  onClose: null,
  open(title, html, onMount, onClose) {
    const d = $('#modal');
    $('#modal-body').innerHTML = `
      <div class="modal-head"><h2>${esc(title)}</h2>
        <button type="button" class="icon-btn" data-close aria-label="Cerrar">✕</button></div>
      ${html}`;
    this.onClose = onClose || null;
    $$('[data-close]', d).forEach((b) => (b.onclick = () => Modal.close()));
    if (!d.open) d.showModal();
    if (onMount) onMount($('#modal-body'));
  },
  close() {
    const d = $('#modal');
    if (d.open) d.close();
  },
};

function askText(title, label, value = '', { placeholder = '', type = 'text' } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    Modal.open(title, `
      <form class="form" id="ask-form">
        <label>${esc(label)}<input name="v" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" required autofocus></label>
        <div class="form-actions"><span class="grow"></span>
          <button type="button" class="btn ghost" data-close>Cancelar</button>
          <button class="btn">Aceptar</button></div>
      </form>`, (body) => {
      const f = $('#ask-form', body);
      f.onsubmit = (e) => {
        e.preventDefault();
        answered = true;
        resolve(f.elements.v.value.trim());
        Modal.close();
      };
    }, () => { if (!answered) resolve(null); });
  });
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(name) {
  const ext = (String(name).split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return '';
  if (['doc', 'docx', 'odt', 'txt', 'md'].includes(ext)) return '';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return '';
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext)) return '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'].includes(ext)) return '';
  if (['zip', 'rar', '7z'].includes(ext)) return '';
  if (['py', 'js', 'c', 'cpp', 'java', 'm', 'r', 'ipynb', 'html', 'sql'].includes(ext)) return '';
  return '';
}

function safeUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  return /^(https?:|mailto:)/i.test(s) ? s : `https://${s}`;
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Bloques que se pueden minimizar u ocultar ----------
 * Lo que la usuaria oculta o minimiza queda guardado en Ajustes (settings.layout)
 * y vale para todas las materias.
 */

function layoutState() {
  const st = Store.data.settings;
  st.layout = st.layout || {};
  st.layout.hidden = st.layout.hidden || {};
  st.layout.collapsed = st.layout.collapsed || {};
  return st.layout;
}
function isHidden(key) { return !!layoutState().hidden[key]; }

function block(key, title, body, { actions = '', cls = '' } = {}) {
  const L = layoutState();
  if (L.hidden[key]) return '';
  const col = !!L.collapsed[key];
  return `<section class="card blk ${cls} ${col ? 'collapsed' : ''}" data-block="${key}">
    <div class="block-head"><h2>${esc(title)}</h2>
      <div class="block-tools">${col ? '' : actions}
        <button type="button" class="icon-btn sm ghosty" data-collapse="${key}" aria-expanded="${!col}" title="${col ? 'Mostrar' : 'Minimizar'}" aria-label="${col ? 'Mostrar' : 'Minimizar'} ${esc(title)}">${col ? '+' : '–'}</button>
        <button type="button" class="icon-btn sm ghosty" data-hideblock="${key}" title="Ocultar" aria-label="Ocultar ${esc(title)}">✕</button>
      </div></div>
    ${col ? '' : `<div class="block-body">${body}</div>`}
  </section>`;
}

// Menú discreto para volver a mostrar lo oculto. blocks: [[key, título], ...]
function hiddenBar(blocks) {
  const hidden = blocks.filter(([k]) => isHidden(k));
  if (!hidden.length) return '';
  return `<details class="hidden-menu">
    <summary>${hidden.length === 1 ? '1 sección oculta' : `${hidden.length} secciones ocultas`}</summary>
    <div class="hidden-list">${hidden.map(([k, t]) => `<button type="button" data-showblock="${k}"><span>${esc(t)}</span><span class="muted small">Mostrar</span></button>`).join('')}</div>
  </details>`;
}

function bindBlocks(root) {
  const L = layoutState();
  $$('[data-collapse]', root).forEach((b) => (b.onclick = () => { const k = b.dataset.collapse; if (L.collapsed[k]) delete L.collapsed[k]; else L.collapsed[k] = true; Store.save(); rerender(); }));
  $$('[data-hideblock]', root).forEach((b) => (b.onclick = () => { L.hidden[b.dataset.hideblock] = true; Store.save(); toast('Sección oculta'); rerender(); }));
  $$('[data-showblock]', root).forEach((b) => (b.onclick = () => { delete L.hidden[b.dataset.showblock]; Store.save(); rerender(); }));
}

// Asigna un evento solo si el elemento existe (puede estar oculto o minimizado)
function on(root, sel, ev, fn) { const el = $(sel, root); if (el) el[ev] = fn; return el; }
