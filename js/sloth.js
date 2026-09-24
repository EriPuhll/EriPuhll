'use strict';

/* ---------- El perezoso: logo y mascota ---------- */

const SLOTH_FUR = '#a88a6d';

function slothFaceInner() {
  return `
    <path d="M18 40 Q20 20 36 22 Q42 10 54 18 Q66 10 72 22 Q86 22 84 42 Z" fill="${SLOTH_FUR}"/>
    <ellipse cx="50" cy="54" rx="42" ry="38" fill="${SLOTH_FUR}"/>
    <ellipse cx="50" cy="60" rx="31" ry="27" fill="#f1e4d0"/>
    <ellipse cx="35" cy="55" rx="12.5" ry="7.5" fill="#5a4030" transform="rotate(-22 35 55)"/>
    <ellipse cx="65" cy="55" rx="12.5" ry="7.5" fill="#5a4030" transform="rotate(22 65 55)"/>
    <g class="sloth-eyes">
      <circle cx="37" cy="54" r="4" fill="#1d1512"/><circle cx="38.4" cy="52.6" r="1.4" fill="#fff"/>
      <circle cx="63" cy="54" r="4" fill="#1d1512"/><circle cx="64.4" cy="52.6" r="1.4" fill="#fff"/>
    </g>
    <ellipse cx="50" cy="66" rx="6.5" ry="4.5" fill="#3a2a20"/>
    <path d="M42 73 Q50 80 58 73" fill="none" stroke="#3a2a20" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="26" cy="68" r="4.5" fill="#f3a3b5" opacity=".6"/>
    <circle cx="74" cy="68" r="4.5" fill="#f3a3b5" opacity=".6"/>
    <g transform="translate(76 22)">
      <circle cx="0" cy="-6" r="5" fill="var(--accent, #a075ea)"/>
      <circle cx="5.7" cy="-1.9" r="5" fill="var(--accent, #a075ea)"/>
      <circle cx="3.5" cy="4.9" r="5" fill="var(--accent, #a075ea)"/>
      <circle cx="-3.5" cy="4.9" r="5" fill="var(--accent, #a075ea)"/>
      <circle cx="-5.7" cy="-1.9" r="5" fill="var(--accent, #a075ea)"/>
      <circle cx="0" cy="0" r="3.6" fill="#ffd66b"/>
    </g>`;
}

const SLOTH_FACE = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${slothFaceInner()}</svg>`;

const SLOTH_HANG = `<svg viewBox="0 0 160 190" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M-4 16 Q80 4 164 18" stroke="#7a5a3c" stroke-width="10" fill="none" stroke-linecap="round"/>
  <ellipse cx="20" cy="8" rx="10" ry="4.5" fill="#8cc084" transform="rotate(-25 20 8)"/>
  <ellipse cx="132" cy="9" rx="10" ry="4.5" fill="#7bb274" transform="rotate(20 132 9)"/>
  <ellipse cx="146" cy="22" rx="8" ry="3.8" fill="#8cc084" transform="rotate(-30 146 22)"/>
  <path d="M58 16 Q48 52 62 96" stroke="${SLOTH_FUR}" stroke-width="18" fill="none" stroke-linecap="round"/>
  <path d="M102 16 Q112 52 98 96" stroke="${SLOTH_FUR}" stroke-width="18" fill="none" stroke-linecap="round"/>
  <path d="M52 6 l2 10 M58 5 l1 11 M64 6 l0 10 M96 6 l0 10 M102 5 l-1 11 M108 6 l-2 10" stroke="#3a2a20" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="80" cy="134" rx="40" ry="46" fill="${SLOTH_FUR}"/>
  <ellipse cx="80" cy="144" rx="24" ry="30" fill="#c4a88a"/>
  <ellipse cx="56" cy="174" rx="12" ry="9" fill="${SLOTH_FUR}"/>
  <ellipse cx="104" cy="174" rx="12" ry="9" fill="${SLOTH_FUR}"/>
  <g transform="translate(38 48) scale(.84)">${slothFaceInner()}</g>
</svg>`;

const SLOTH_PHRASES = [
  'Despacito, pero sin parar. 🌿',
  '¿Tomaste agua hoy? 💧',
  'Un pomodoro y después un mimo.',
  'Estirá la espalda, como yo colgadito.',
  '¡Vos podés con este semestre! 💜',
  'Lo importante es avanzar, aunque sea lento.',
  'Hoy es buen día para repasar un poquito.',
  'Respirá hondo. Una cosa a la vez.',
  'Yo duermo 15 horas, vos al menos dormí 8. 😴',
  '¿Ya miraste qué se viene esta semana?',
];

const Sloth = {
  timer: null,
  hideTimer: null,

  paint(root = document) {
    $$('[data-sloth="face"]', root).forEach((el) => { if (!el.firstChild) el.innerHTML = SLOTH_FACE; });
    $$('[data-sloth="hang"]', root).forEach((el) => { if (!el.firstChild) el.innerHTML = SLOTH_HANG; });
  },

  // Frase contextual: si se viene algo en menos de 48 h, avisa.
  phrase() {
    const now = new Date();
    const soon = Store.data.events
      .filter((e) => { const d = eventDate(e); return d > now && d - now < 2 * 864e5; })
      .sort(byEventDate)[0];
    if (soon && Math.random() < 0.6) {
      const subj = soon.subjectId ? ` de ${subjectName(soon.subjectId)}` : '';
      return `¡Ojo! ${typeLabel(soon)}${subj}: ${countdown(eventDate(soon)).text.toLowerCase()}. 👀`;
    }
    return SLOTH_PHRASES[Math.floor(Math.random() * SLOTH_PHRASES.length)];
  },

  show(msg, ms = 7000) {
    const peek = $('#sloth-peek');
    $('#sloth-bubble').textContent = msg || this.phrase();
    peek.classList.remove('show');
    void peek.offsetWidth; // reinicia la animación
    peek.classList.add('show');
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hide(), ms);
  },

  hide() { $('#sloth-peek').classList.remove('show'); },

  schedule(first = false) {
    clearTimeout(this.timer);
    if (!Store.data.settings.slothEnabled) return;
    // Aparece a los ~25 s de abrir y después cada 4 a 9 minutos.
    const delay = first ? 25000 : (4 + Math.random() * 5) * 60000;
    this.timer = setTimeout(() => {
      if (Store.data.settings.slothEnabled && !document.hidden) this.show();
      this.schedule();
    }, delay);
  },

  init() {
    this.paint();
    $('#sloth-body').onclick = () => this.hide();
    this.schedule(true);
  },
};
