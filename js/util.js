'use strict';

/* ---------- Utilidades generales ---------- */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');

const DEFAULT_ACCENT = '#a075ea';
const DEFAULT_BG = '#f7f3ea';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const EVENT_TYPES = [
  { id: 'control', label: 'Control', icon: '✏️' },
  { id: 'laboratorio', label: 'Entrega de laboratorio', icon: '🧪' },
  { id: 'entregable', label: 'Entregable', icon: '📦' },
  { id: 'parcial', label: 'Parcial', icon: '📝' },
  { id: 'examen', label: 'Examen', icon: '🎓' },
  { id: 'practico', label: 'Práctico', icon: '📐' },
  { id: 'charla', label: 'Charla', icon: '🎤' },
  { id: 'otro', label: 'Otro', icon: '✨' },
];

const SUBJECT_COLORS = ['#a075ea', '#f28bb3', '#5fb3a1', '#f2a65a', '#6c9eeb', '#e46a6a', '#9bbf5a', '#c78bd9'];

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
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toMin(hhmm) {
  const [h, m] = (hhmm || '0:0').split(':').map(Number);
  return h * 60 + m;
}
function eventDate(ev) {
  const d = parseDate(ev.date);
  if (ev.time) { const [h, m] = ev.time.split(':').map(Number); d.setHours(h, m); }
  return d;
}
function byEventDate(a, b) { return eventDate(a) - eventDate(b); }
function fmtDateShort(d) {
  return `${DAYS_SHORT[(d.getDay() + 6) % 7].toLowerCase()} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()}`;
}
function fmtTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function startOfWeek(d) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
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
function countdown(target, now = new Date()) {
  let diff = target - now;
  const past = diff < 0;
  diff = Math.abs(diff);
  const days = Math.floor(diff / 864e5);
  const hours = Math.floor((diff % 864e5) / 36e5);
  const mins = Math.floor((diff % 36e5) / 6e4);
  let txt;
  if (days > 0) txt = `${days} ${days === 1 ? 'día' : 'días'} y ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  else if (hours > 0) txt = `${hours} h ${mins} min`;
  else txt = `${mins} min`;
  const level = past ? 'past' : diff < 2 * 864e5 ? 'urgent' : diff < 7 * 864e5 ? 'soon' : 'ok';
  return { text: past ? `Hace ${txt}` : `Faltan ${txt}`, past, level };
}

/* ---------- Colores ---------- */

function hexToRgb(hex) {
  let h = (hex || DEFAULT_ACCENT).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function isLight([r, g, b]) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

/* ---------- UI: toast, modal, preguntas ---------- */

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2800);
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

function askText(title, label, value = '') {
  return new Promise((resolve) => {
    let answered = false;
    Modal.open(title, `
      <form class="form" id="ask-form">
        <label>${esc(label)}<input name="v" value="${esc(value)}" required autofocus></label>
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
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return '📕';
  if (['doc', 'docx', 'odt', 'txt', 'md'].includes(ext)) return '📄';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return '📊';
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext)) return '📽️';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'].includes(ext)) return '🖼️';
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️';
  if (['py', 'js', 'c', 'cpp', 'java', 'm', 'r', 'ipynb', 'html'].includes(ext)) return '💻';
  return '📎';
}
