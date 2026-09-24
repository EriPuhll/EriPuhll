'use strict';

/* ---------- El perezoso: dibujo por capas, ropa, ánimo y apariciones ----------
 * Acostado sobre una rama, con la cara crema, las manchas oscuras de lado y los
 * brazos colgando con garras largas. La cabeza se dibuja en su propio marco
 * (centro 100,92) y se ubica sobre la rama con una transformación; así los
 * accesorios de cabeza sirven igual para la vista completa y para la cara sola.
 */

const FUR_PRESETS = [
  { id: 'marron', label: 'Marrón clásico', color: '#c39b76' },
  { id: 'gris', label: 'Gris', color: '#a3a0a6' },
  { id: 'caramelo', label: 'Caramelo', color: '#cf9255' },
  { id: 'lavanda', label: 'Lavanda', color: '#a075ea' },
  { id: 'menta', label: 'Menta', color: '#7cc4a4' },
  { id: 'rosa', label: 'Rosa', color: '#f0a3c0' },
];
const DEFAULT_FUR = '#c39b76';

const MOODS = {
  feliz: 'Feliz', dormido: 'Dormido', preocupado: 'Preocupado', orgulloso: 'Orgulloso', estirandose: 'Estirándose',
};

const ACCENT = 'var(--accent, #a075ea)';
const MOSS = 'var(--moss, #6f8f5a)';
const LEAF = '#7cbf45';
const LEAF_LIGHT = '#a3d86a';
const BARK = '#a5652c';
const BARK_LIGHT = '#c5843f';
const BARK_DARK = '#7a4a1f';
const CLAW = '#f1e6cc';
const CLAW_EDGE = '#cdb88f';

// Dónde va la cabeza sobre la rama (vista completa)
const HEAD_TF = 'translate(104 110) rotate(-10) scale(1.1) translate(-100 -92)';
// Dónde cuelga lo que "abraza" (de la garra delantera) y el reloj (en el brazo)
const HAND_TF = 'translate(150 220) scale(0.74) translate(-100 -176)';
const ARM_TF = 'translate(12 88)';
const BACK_TF = 'translate(205 96) scale(0.78) translate(-100 -160)';
const BODY_PATH = 'M120 128 C 110 90, 150 62, 205 64 C 255 66, 285 92, 280 122 C 276 140, 250 146, 205 142 L 140 140 Z';

let svgSerial = 0;

function sparkle(x, y, s, color) {
  const k = s * 0.3;
  return `<path d="M${x} ${y - s} L${x + k} ${y - k} L${x + s} ${y} L${x + k} ${y + k} L${x} ${y + s} L${x - k} ${y + k} L${x - s} ${y} L${x - k} ${y - k}Z" fill="${color}"/>`;
}
function heart(x, y, s, fill, stroke = 'none') {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M0 9 C-14 0 -10 -12 0 -5 C10 -12 14 0 0 9 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}
function skull(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><circle r="9" fill="#fff" stroke="#2a2238" stroke-width="1.5"/>
    <rect x="-5" y="5" width="10" height="7" rx="2" fill="#fff" stroke="#2a2238" stroke-width="1.5"/>
    <circle cx="-3.5" cy="-1" r="2.4" fill="#2a2238"/><circle cx="3.5" cy="-1" r="2.4" fill="#2a2238"/>
    <path d="M-2 8 L-2 12 M2 8 L2 12" stroke="#2a2238" stroke-width="1"/></g>`;
}
function butterfly(x, y, rot, a, b) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <ellipse cx="-6" cy="-4" rx="7" ry="6" fill="${a}"/><ellipse cx="6" cy="-4" rx="7" ry="6" fill="${a}"/>
    <ellipse cx="-5" cy="5" rx="4.5" ry="4" fill="${b}"/><ellipse cx="5" cy="5" rx="4.5" ry="4" fill="${b}"/>
    <rect x="-1.2" y="-9" width="2.4" height="17" rx="1.2" fill="#2a2238"/></g>`;
}
function flower(x, y, color, r = 4.2) {
  const petals = [0, 72, 144, 216, 288].map((a) => {
    const rad = (a * Math.PI) / 180;
    return `<circle cx="${(x + Math.sin(rad) * r).toFixed(1)}" cy="${(y - Math.cos(rad) * r).toFixed(1)}" r="${r}" fill="${color}"/>`;
  }).join('');
  return `${petals}<circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="#f2a65a"/>`;
}
function snowflake(x, y, s) {
  return `<path d="M${x - s} ${y} L${x + s} ${y} M${x} ${y - s} L${x} ${y + s} M${x - s * 0.7} ${y - s * 0.7} L${x + s * 0.7} ${y + s * 0.7} M${x - s * 0.7} ${y + s * 0.7} L${x + s * 0.7} ${y - s * 0.7}" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
}
function leaf(x, y, rot, s = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C -10 -10 -9 -28 0 -36 C 9 -28 10 -10 0 0 Z" fill="${LEAF}"/><path d="M0 -2 L0 -30" stroke="${LEAF_LIGHT}" stroke-width="1.6"/></g>`;
}

/* Ropa del cuerpo: se pinta sobre el cuerpo acostado (recortada a su forma) */
const DECO_SPOTS = [[160, 92, 5], [198, 80, 4], [238, 94, 5], [215, 120, 3.6], [176, 120, 4], [258, 112, 3.6]];
function outfitSVG(o) {
  const id = `sl-body-${++svgSerial}`;
  let deco = '';
  let skirtDeco = '';
  switch (o.deco) {
    case 'sparkle':
      deco = DECO_SPOTS.map(([x, y, s]) => sparkle(x, y, s, '#fff')).join('');
      skirtDeco = sparkle(180, 158, 3.5, '#fff') + sparkle(236, 156, 3.5, '#fff');
      break;
    case 'snow':
      deco = DECO_SPOTS.map(([x, y, s]) => snowflake(x, y, s)).join('');
      skirtDeco = snowflake(180, 157, 4) + snowflake(236, 155, 4);
      break;
    case 'roses':
      deco = DECO_SPOTS.slice(0, 4).map(([x, y]) => flower(x, y, '#e46a6a', 3.4)).join('');
      skirtDeco = flower(200, 158, '#e46a6a', 3.4);
      break;
    case 'heart':
      deco = `<rect x="100" y="112" width="200" height="8" fill="${o.trim}"/>${heart(205, 88, 1, '#fff')}${sparkle(170, 96, 4, '#fff')}${sparkle(245, 100, 4, '#fff')}`;
      break;
    case 'stitch':
      deco = `<path d="M150 82 L262 126" stroke="${o.trim}" stroke-width="2.5" stroke-dasharray="6 4"/><path d="M168 84 l6 10 M190 93 l6 10 M212 102 l6 10 M234 111 l6 10" stroke="${o.trim}" stroke-width="2"/>${skull(240, 86, 0.8)}`;
      break;
    case 'dino':
      deco = `<ellipse cx="205" cy="146" rx="80" ry="30" fill="${o.belly}"/><path d="M160 126 Q205 136 250 124 M170 136 Q205 144 242 134" stroke="#a7d99a" stroke-width="3" fill="none"/>`;
      break;
    case 'stripe':
      deco = `<rect x="192" y="40" width="20" height="120" fill="#1d1d1d"/><rect x="198" y="40" width="8" height="120" fill="#f4f4f4"/>`;
      break;
    case 'hoodie':
      deco = `<path d="M182 110 L234 110 L228 134 L188 134 Z" fill="${o.trim}"/><path d="M146 88 l4 24 M154 84 l8 24" stroke="#fff" stroke-width="3" stroke-linecap="round"/>${sparkle(212, 88, 6, '#fff')}`;
      break;
    case 'sash':
      deco = `<rect x="198" y="40" width="14" height="120" fill="#2a2238"/><path d="M138 80 L198 108 L146 136" fill="none" stroke="${o.trim}" stroke-width="5"/>`;
      break;
    default: break;
  }
  const front = `<defs><clipPath id="${id}"><path d="${BODY_PATH}"/></clipPath></defs>
    <g clip-path="url(#${id})"><rect x="100" y="40" width="200" height="130" fill="${o.top}"/>${deco}</g>
    <path d="M137 84 Q127 108 139 134" stroke="${o.trim}" stroke-width="4" fill="none" stroke-linecap="round"/>
    ${o.skirt ? `<path d="M138 132 Q205 152 276 126 L284 160 Q272 170 260 162 Q248 172 236 164 Q224 174 212 165 Q200 174 188 165 Q176 173 164 164 Q150 170 136 160 Z" fill="${o.skirt}"/>
      <path d="M136 160 Q150 170 164 164 Q176 173 188 165 Q200 174 212 165 Q224 174 236 164 Q248 172 260 162 Q272 170 284 160" fill="none" stroke="${o.trim}" stroke-width="3"/>${skirtDeco}` : ''}`;
  const back = o.deco === 'dino'
    ? `<path d="M272 112 Q306 114 318 136 Q296 134 276 128Z" fill="${o.top}"/>` + [[150, 80], [172, 70], [196, 65], [220, 65], [244, 72], [266, 86]].map(([x, y]) => `<path d="M${x - 9} ${y + 8} L${x} ${y - 12} L${x + 9} ${y + 8} Z" fill="#4e9a54"/>`).join('')
    : '';
  return { back, front };
}

/* Ropero. hours = horas de estudio del semestre para desbloquear. */
const WARDROBE_CATS = [
  { id: 'cabeza', label: 'Cabeza' },
  { id: 'ojos', label: 'Ojos' },
  { id: 'cara', label: 'Cara' },
  { id: 'cuello', label: 'Cuello' },
  { id: 'cuerpo', label: 'Ropa' },
  { id: 'abrazando', label: 'En la garra' },
  { id: 'extra', label: 'Extras' },
];

const WARDROBE = [
  // --- 0 h
  { id: 'mono', cat: 'cabeza', name: 'Moño', hours: 0, style: 'Clásico', svg: () => `<g transform="translate(130 54) rotate(18)"><path d="M0 0 L-17 -11 Q-21 0 -17 11 Z" fill="#f28bb3"/><path d="M0 0 L17 -11 Q21 0 17 11 Z" fill="#f28bb3"/><circle r="5.5" fill="#e0679a"/></g>` },
  { id: 'lentes', cat: 'ojos', name: 'Lentes redondos', hours: 0, style: 'Clásico', svg: () => `<g fill="rgba(255,255,255,.2)" stroke="#2a2238" stroke-width="3"><circle cx="79" cy="95" r="13"/><circle cx="121" cy="95" r="13"/></g><path d="M92 95 Q100 90 108 95" stroke="#2a2238" stroke-width="3" fill="none"/><path d="M66 92 L52 88 M134 92 L148 88" stroke="#2a2238" stroke-width="3"/>` },
  { id: 'bufanda', cat: 'cuello', name: 'Bufanda', hours: 0, style: 'Clásico', svg: () => `<path d="M62 124 Q100 140 138 124 L138 138 Q100 154 62 138 Z" fill="#e46a6a"/><path d="M116 140 L124 172 L110 172 L106 144 Z" fill="#e46a6a"/><path d="M110 164 L124 164 M109 169 L125 169" stroke="#fff" stroke-width="2"/><path d="M78 130 L79 142 M100 136 L100 148 M122 130 L121 142" stroke="#f7c9c9" stroke-width="3"/>` },
  { id: 'hojita', cat: 'abrazando', name: 'Hojita', hours: 0, style: 'Clásico', svg: () => `<path d="M84 190 Q92 150 126 156 Q120 190 84 190 Z" fill="${LEAF}"/><path d="M88 186 Q104 172 122 160" stroke="${LEAF_LIGHT}" stroke-width="2" fill="none"/>` },
  // --- progreso
  { id: 'gorro', cat: 'cabeza', name: 'Gorro de lana con pompón', hours: 2, style: 'Clásico', svg: () => `<path d="M54 78 Q54 32 100 30 Q146 32 146 78 Z" fill="#6c9eeb"/><path d="M70 42 L70 76 M85 34 L85 76 M100 31 L100 76 M115 34 L115 76 M130 42 L130 76" stroke="#5a8ad6" stroke-width="3"/><rect x="50" y="70" width="100" height="15" rx="7.5" fill="#4a7fd4"/><circle cx="100" cy="26" r="11" fill="#fff" stroke="#dfe7f5" stroke-width="2"/>` },
  { id: 'mariposas', cat: 'cabeza', name: 'Clips de mariposa', hours: 3, style: 'Gen Z', svg: () => butterfly(68, 60, -20, '#c78bd9', '#f28bb3') + butterfly(132, 56, 18, '#8fd3ff', '#7cc4a4') },
  { id: 'auriculares', cat: 'cabeza', name: 'Auriculares', hours: 5, style: 'Clásico', svg: () => `<path d="M50 98 Q50 34 100 34 Q150 34 150 98" stroke="#2a2238" stroke-width="7" fill="none"/><rect x="38" y="84" width="18" height="30" rx="8" fill="${ACCENT}"/><rect x="144" y="84" width="18" height="30" rx="8" fill="${ACCENT}"/>` },
  { id: 'taza', cat: 'abrazando', name: 'Taza de café', hours: 5, style: 'Clásico', svg: () => `<rect x="86" y="160" width="28" height="30" rx="5" fill="#fff" stroke="#d8d0c0" stroke-width="2"/><path d="M114 166 q12 0 12 9 q0 9 -12 9" stroke="#d8d0c0" stroke-width="4" fill="none"/><ellipse cx="100" cy="162" rx="12" ry="3" fill="#7a4a2a"/><path d="M92 152 q-4 -6 0 -12 M100 150 q-4 -6 0 -12 M108 152 q-4 -6 0 -12" stroke="#b9aec9" stroke-width="2" fill="none"/>${heart(100, 174, 0.45, '#f28bb3')}` },
  { id: 'brillitos', cat: 'extra', anchor: 'head', name: 'Brillitos en la cara', hours: 6, style: 'Gen Z', svg: () => sparkle(56, 70, 6, '#f5d76e') + sparkle(146, 112, 5, '#f28bb3') + sparkle(52, 116, 4, '#c9b6f2') + sparkle(150, 60, 4.5, '#fff') + `<circle cx="68" cy="106" r="1.4" fill="#f5d76e"/><circle cx="72" cy="110" r="1.2" fill="#fff"/><circle cx="132" cy="106" r="1.4" fill="#f5d76e"/><circle cx="128" cy="110" r="1.2" fill="#fff"/>` },
  { id: 'tiara', cat: 'cabeza', name: 'Tiara de princesa', hours: 7, style: 'Princesa', svg: () => `<path d="M76 56 L84 38 L92 50 L100 30 L108 50 L116 38 L124 56 Z" fill="#f5d76e" stroke="#e0b93f" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="44" r="3.5" fill="#f28bb3"/><circle cx="84" cy="48" r="2.5" fill="#6c9eeb"/><circle cx="116" cy="48" r="2.5" fill="#6c9eeb"/>` },
  { id: 'perlas', cat: 'cuello', name: 'Collar de perlas', hours: 7, style: 'Princesa', svg: () => [70, 77.5, 85, 92.5, 100, 107.5, 115, 122.5, 130].map((x) => `<circle cx="${x}" cy="${(128 + 9 * (1 - ((x - 100) / 32) ** 2)).toFixed(1)}" r="3.3" fill="#fff" stroke="#e5ddcf" stroke-width="1"/>`).join('') },
  { id: 'vaso', cat: 'abrazando', name: 'Vaso térmico XL', hours: 8, style: 'Gen Z', svg: () => `<path d="M86 148 L114 148 L110 204 L90 204 Z" fill="#9fd8c8"/><rect x="84" y="140" width="32" height="10" rx="4" fill="#7cc4b0"/><path d="M104 140 L110 120" stroke="#f28bb3" stroke-width="4" stroke-linecap="round"/><path d="M114 156 q14 2 12 18 q-2 12 -14 12" stroke="#7cc4b0" stroke-width="5" fill="none"/><rect x="88" y="190" width="24" height="3" fill="#7cc4b0"/>` },
  { id: 'lentes_sol', cat: 'ojos', name: 'Lentes de sol', hours: 10, style: 'Clásico', svg: () => `<rect x="64" y="86" width="29" height="19" rx="8" fill="#1d1512"/><rect x="107" y="86" width="29" height="19" rx="8" fill="#1d1512"/><path d="M93 93 L107 93 M64 91 L50 87 M136 91 L150 87" stroke="#1d1512" stroke-width="3"/><path d="M69 90 L78 90 M112 90 L121 90" stroke="#fff" stroke-width="2" opacity=".5"/>` },
  { id: 'libro', cat: 'abrazando', name: 'Libro', hours: 10, style: 'Clásico', svg: () => `<g transform="rotate(-8 100 176)"><rect x="80" y="158" width="42" height="32" rx="3" fill="${ACCENT}"/><rect x="84" y="161" width="36" height="26" fill="#fffdf8"/><rect x="80" y="158" width="8" height="32" rx="2" fill="#2a2238" opacity=".35"/><path d="M92 168 L114 168 M92 174 L114 174 M92 180 L108 180" stroke="#cfc6dc" stroke-width="2"/></g>` },
  { id: 'vestido_rosa', cat: 'cuerpo', name: 'Vestido de princesa rosa', hours: 12, style: 'Princesa', outfit: { top: '#f7b8d2', skirt: '#f28bb3', trim: '#fff', deco: 'sparkle' } },
  { id: 'varita', cat: 'abrazando', name: 'Varita con estrella', hours: 12, style: 'Princesa', svg: () => `<path d="M100 214 L112 158" stroke="#f5d76e" stroke-width="5" stroke-linecap="round"/><path d="M112 136 l5 11 l12 1 l-9 8 l3 12 l-11 -6 l-11 6 l3 -12 l-9 -8 l12 -1z" fill="#f5d76e" stroke="#e0b43a" stroke-width="1.5"/>${sparkle(134, 134, 4, '#fff')}` },
  { id: 'matcha', cat: 'abrazando', name: 'Matcha latte', hours: 14, style: 'Gen Z', svg: () => `<path d="M88 158 L112 158 L109 196 L91 196 Z" fill="rgba(255,255,255,.8)" stroke="#d8d0c0" stroke-width="2"/><path d="M89.5 172 L110.5 172 L109 196 L91 196 Z" fill="#9bc36b"/><path d="M89 172 Q100 167 111 172" stroke="#f4f0e6" stroke-width="3" fill="none"/><path d="M104 158 L112 136" stroke="${MOSS}" stroke-width="5" stroke-linecap="round"/><ellipse cx="100" cy="158" rx="13" ry="3" fill="#fff" stroke="#d8d0c0"/>` },
  { id: 'cinta', cat: 'cabeza', name: 'Cinta de guerrero', hours: 15, style: 'Maestro', svg: () => `<path d="M52 74 Q100 60 148 74 L148 86 Q100 72 52 86 Z" fill="#d9546e"/><path d="M146 78 L170 86 L164 94 L144 86 Z" fill="#c43d58"/><path d="M146 82 L166 100 L158 104 L142 86 Z" fill="#d9546e"/><circle cx="100" cy="72" r="5" fill="#fff"/><circle cx="100" cy="72" r="2.4" fill="#d9546e"/>` },
  { id: 'capucha_dino', cat: 'cabeza', name: 'Capucha de dino', hours: 15, style: 'Dino', svg: () => `<path d="M70 42 L76 22 L86 34 L94 14 L100 28 L106 14 L114 34 L124 22 L130 42 Z" fill="#4e9a54"/><path d="M56 112 Q42 36 100 34 Q158 36 144 112" stroke="#7bc47f" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="72" cy="50" r="5" fill="#fff"/><circle cx="73" cy="50" r="2.4" fill="#1d1512"/><circle cx="128" cy="50" r="5" fill="#fff"/><circle cx="127" cy="50" r="2.4" fill="#1d1512"/>` },
  { id: 'celular', cat: 'abrazando', name: 'Celu con funda cute', hours: 16, style: 'Gen Z', svg: () => `<rect x="86" y="150" width="28" height="48" rx="6" fill="#c9b6f2"/><rect x="90" y="155" width="20" height="36" rx="3" fill="#2a2238"/><circle cx="100" cy="194" r="2" fill="#fff"/><path d="M114 156 q10 4 8 16" stroke="#f28bb3" stroke-width="2" fill="none"/><circle cx="122" cy="174" r="4" fill="#f5d76e"/>${sparkle(100, 170, 6, '#f28bb3')}` },
  { id: 'pijama_dino', cat: 'cuerpo', name: 'Pijama de dino', hours: 18, style: 'Dino', outfit: { top: '#7bc47f', belly: '#c9ecb8', trim: '#4e9a54', deco: 'dino' } },
  { id: 'choker', cat: 'cuello', name: 'Choker con corazón', hours: 18, style: 'Gen Z', svg: () => `<path d="M66 126 Q100 138 134 126" stroke="#2a2238" stroke-width="5" fill="none"/>${heart(100, 140, 0.55, '#ff5fa2')}` },
  { id: 'corona_flores', cat: 'cabeza', name: 'Corona de flores', hours: 20, style: 'Clásico', svg: () => {
    const pts = [[58, 70], [68, 56], [83, 48], [100, 45], [117, 48], [132, 56], [142, 70]];
    const cols = ['#f28bb3', '#f5d76e', '#c9b6f2', '#fff', '#f28bb3', '#f5d76e', '#c9b6f2'];
    return `<path d="M54 74 Q100 32 146 74" stroke="${LEAF}" stroke-width="5" fill="none"/>` + pts.map(([x, y], i) => flower(x, y, cols[i])).join('');
  } },
  { id: 'monito', cat: 'cuello', name: 'Moñito', hours: 20, style: 'Clásico', svg: () => `<path d="M100 134 L84 124 L84 144 Z" fill="${ACCENT}"/><path d="M100 134 L116 124 L116 144 Z" fill="${ACCENT}"/><circle cx="100" cy="134" r="4.5" fill="#2a2238" opacity=".45"/>` },
  { id: 'dino_peluche', cat: 'abrazando', name: 'Dino de peluche', hours: 20, style: 'Dino', svg: () => `<path d="M90 168 l3 -7 l3 7 M98 166 l3 -7 l3 7 M106 168 l3 -7 l3 7" fill="#4e9a54"/><ellipse cx="100" cy="180" rx="18" ry="14" fill="#7bc47f"/><circle cx="116" cy="164" r="10" fill="#7bc47f"/><circle cx="119" cy="162" r="2" fill="#1d1512"/><path d="M84 184 Q72 188 70 178 Q78 180 84 176Z" fill="#7bc47f"/><ellipse cx="92" cy="192" rx="4" ry="3" fill="#4e9a54"/><ellipse cx="108" cy="192" rx="4" ry="3" fill="#4e9a54"/>` },
  { id: 'bucket', cat: 'cabeza', name: 'Bucket hat', hours: 22, style: 'Gen Z', svg: () => `<path d="M62 70 Q62 34 100 34 Q138 34 138 70 Z" fill="#f2c94c"/><path d="M42 74 Q100 58 158 74 Q152 86 100 82 Q48 86 42 74 Z" fill="#e0b43a"/>${flower(82, 52, '#fff', 3)}${flower(106, 44, '#fff', 3)}${flower(122, 60, '#fff', 3)}` },
  { id: 'buzo', cat: 'cuerpo', name: 'Buzo oversize', hours: 22, style: 'Gen Z', outfit: { top: '#c9b6f2', trim: '#b8a2ea', deco: 'hoodie' } },
  { id: 'y2k', cat: 'ojos', name: 'Gafas Y2K', hours: 22, style: 'Gen Z', svg: () => `<ellipse cx="79" cy="95" rx="14" ry="7.5" fill="#8fd3ff" opacity=".75" stroke="#b8c4d6" stroke-width="2"/><ellipse cx="121" cy="95" rx="14" ry="7.5" fill="#8fd3ff" opacity=".75" stroke="#b8c4d6" stroke-width="2"/><path d="M93 95 L107 95 M65 94 L50 90 M135 94 L150 90" stroke="#b8c4d6" stroke-width="2.5"/>` },
  { id: 'barba', cat: 'cara', name: 'Barba de maestro', hours: 25, style: 'Maestro', svg: () => `<path d="M84 118 Q100 128 116 118 Q114 154 100 176 Q86 154 84 118 Z" fill="#f4f1ea" stroke="#d8d2c4" stroke-width="1.5"/><path d="M86 114 Q94 106 100 112 Q106 106 114 114 Q106 112 100 116 Q94 112 86 114Z" fill="#f4f1ea" stroke="#d8d2c4"/><path d="M94 132 Q100 152 98 164 M106 132 Q102 152 104 162" stroke="#e2dccf" stroke-width="1.5" fill="none"/>` },
  { id: 'fashionista', cat: 'cuerpo', name: 'Look fashionista rosa', hours: 27, style: 'Muñeca fashion', outfit: { top: '#ff5fa2', trim: '#fff', deco: 'heart' } },
  { id: 'gafas_corazon', cat: 'ojos', name: 'Gafas de corazón', hours: 27, style: 'Muñeca fashion', svg: () => `${heart(79, 94, 1.25, '#ff5fa2', '#e0428a')}${heart(121, 94, 1.25, '#ff5fa2', '#e0428a')}<path d="M93 93 L107 93 M64 90 L50 86 M136 90 L150 86" stroke="#e0428a" stroke-width="2.5"/>` },
  { id: 'mono_gigante', cat: 'cabeza', name: 'Moño gigante rosa chicle', hours: 27, style: 'Muñeca fashion', svg: () => `<g transform="translate(100 40)"><path d="M0 0 L-30 -18 Q-38 0 -30 18 Z" fill="#ff5fa2"/><path d="M0 0 L30 -18 Q38 0 30 18 Z" fill="#ff5fa2"/><path d="M-4 4 L-14 26 L-8 26 L0 8 Z M4 4 L14 26 L8 26 L0 8 Z" fill="#ff85b8"/><rect x="-7" y="-7" width="14" height="14" rx="4" fill="#e0428a"/></g>` },
  { id: 'tunica', cat: 'cuerpo', name: 'Túnica de maestro', hours: 28, style: 'Maestro', outfit: { top: '#c8733a', trim: '#f5d76e', deco: 'sash' } },
  { id: 'boina', cat: 'cabeza', name: 'Boina', hours: 30, style: 'Clásico', svg: () => `<ellipse cx="96" cy="54" rx="46" ry="15" fill="#c0392b" transform="rotate(-8 96 54)"/><ellipse cx="96" cy="59" rx="40" ry="6" fill="#a93226" transform="rotate(-8 96 59)"/><circle cx="92" cy="38" r="4" fill="#c0392b"/>` },
  { id: 'lapiz', cat: 'abrazando', name: 'Lápiz', hours: 30, style: 'Clásico', svg: () => `<g transform="rotate(-70 100 176)"><rect x="74" y="170" width="46" height="12" fill="#f5c542"/><rect x="66" y="170" width="9" height="12" rx="2" fill="#f28bb3"/><rect x="74" y="170" width="4" height="12" fill="#c0c0c0"/><path d="M120 170 L134 176 L120 182 Z" fill="#f1d7b0"/><path d="M130 174.3 L134 176 L130 177.7 Z" fill="#2a2238"/></g>` },
  { id: 'monstruito', cat: 'cuerpo', name: 'Vestido gótico con costuras', hours: 32, style: 'Monstruito chic', outfit: { top: '#2a2238', skirt: '#8e44ad', trim: '#f28bb3', deco: 'stitch' } },
  { id: 'calavera', cat: 'cabeza', name: 'Mechón rosa y clip calavera', hours: 32, style: 'Monstruito chic', svg: () => `<path d="M78 56 Q86 34 108 40 Q100 56 84 66 Z" fill="#f28bb3"/><path d="M88 48 Q98 40 106 42" stroke="#2a2238" stroke-width="3" fill="none"/>${skull(132, 58)}<circle cx="144" cy="52" r="3" fill="#f28bb3"/>` },
  { id: 'baston', cat: 'abrazando', name: 'Bastón de bambú', hours: 35, style: 'Maestro', svg: () => `<path d="M104 90 L96 262" stroke="#9bbf5a" stroke-width="9" stroke-linecap="round"/><path d="M94 120 l12 1 M93 160 l12 1 M91 200 l12 1 M90 240 l12 1" stroke="#6f8f5a" stroke-width="3"/><path d="M104 90 q12 -10 18 -4 q-8 6 -18 4z" fill="${LEAF}"/>` },
  { id: 'reloj_alien', cat: 'extra', anchor: 'arm', name: 'Reloj alien verde', hours: 38, style: 'Héroe alien', svg: () => `<g transform="translate(138 80)"><rect x="-15" y="-7" width="30" height="14" rx="4" fill="#1d1d1d"/><circle r="10" fill="#39d353" stroke="#1d1d1d" stroke-width="3"/><path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5Z" fill="#dfffe6"/></g>` },
  { id: 'campera_alien', cat: 'cuerpo', name: 'Campera de héroe alien', hours: 38, style: 'Héroe alien', outfit: { top: '#3f9b4a', trim: '#2f7a38', deco: 'stripe' } },
  { id: 'birrete', cat: 'cabeza', name: 'Birrete de graduación', hours: 40, style: 'Clásico', svg: () => `<rect x="72" y="48" width="56" height="18" rx="3" fill="#2a2238"/><path d="M100 22 L156 42 L100 62 L44 42 Z" fill="#3a3050"/><path d="M152 43 L156 74" stroke="#f5d76e" stroke-width="3"/><circle cx="156" cy="77" r="5" fill="#f5d76e"/><circle cx="100" cy="42" r="3" fill="#f5d76e"/>` },
  { id: 'vestido_hielo', cat: 'cuerpo', name: 'Vestido de princesa de hielo', hours: 45, style: 'Princesa', outfit: { top: '#cdeeff', skirt: '#9fd8f7', trim: '#fff', deco: 'snow' } },
  { id: 'alas', cat: 'extra', anchor: 'back', name: 'Alas de hada', hours: 45, style: 'Princesa', svg: () => `<g opacity=".9"><path d="M92 150 Q40 60 30 120 Q28 170 90 168 Z" fill="#d6ecff" stroke="#9fd0f5" stroke-width="2"/><path d="M110 150 Q160 56 176 112 Q182 166 112 168 Z" fill="#d6ecff" stroke="#9fd0f5" stroke-width="2"/><path d="M92 160 Q50 150 52 190 Q76 200 94 170 Z" fill="#f7d6ff" stroke="#e0b0f0"/><path d="M110 160 Q156 146 158 188 Q134 200 108 170 Z" fill="#f7d6ff" stroke="#e0b0f0"/></g>` },
  { id: 'corona', cat: 'cabeza', name: 'Corona dorada', hours: 50, style: 'Princesa', svg: () => `<path d="M64 60 L64 30 L82 46 L100 22 L118 46 L136 30 L136 60 Z" fill="#f5c542" stroke="#c99a1a" stroke-width="2" stroke-linejoin="round"/><rect x="64" y="54" width="72" height="8" fill="#e0ad2e"/><circle cx="100" cy="44" r="4.5" fill="#d9546e"/><circle cx="80" cy="52" r="3" fill="#6c9eeb"/><circle cx="120" cy="52" r="3" fill="#5fb3a1"/>` },
  { id: 'vestido_dorado', cat: 'cuerpo', name: 'Vestido de gala dorado', hours: 50, style: 'Princesa', outfit: { top: '#f7e08a', skirt: '#f5c542', trim: '#fff7d6', deco: 'roses' } },
];

function wardrobeItem(id) { return WARDROBE.find((w) => w.id === id); }
function itemAnchor(w) { return w.anchor || ({ abrazando: 'hand', cuerpo: 'body' })[w.cat] || 'head'; }

/* ---------- Dibujo ---------- */

function slothColors(fur) {
  return {
    fur,
    furDark: mixHex(fur, '#3b2616', 0.22),
    mask: mixHex(fur, '#ffffff', 0.72),
    stripe: mixHex(fur, '#1d1209', 0.66),
    nose: '#2b1a12',
  };
}

function slothEyes(mood, c, sage) {
  const L = [79, 95], R = [121, 95];
  const lid = mixHex(c.mask, '#ffffff', 0.4);
  const arcs = (d) => `<path d="M${L[0] - 7} ${L[1] + d} Q${L[0]} ${L[1] - d} ${L[0] + 7} ${L[1] + d} M${R[0] - 7} ${R[1] + d} Q${R[0]} ${R[1] - d} ${R[0] + 7} ${R[1] + d}" stroke="${lid}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const open = (ry = 4.4) => [L, R].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="${ry}" fill="${lid}"/><circle cx="${x + 0.6}" cy="${y + 0.4}" r="2.5" fill="#1d1209"/><circle cx="${x + 1.4}" cy="${y - 0.8}" r=".9" fill="#fff"/>`).join('');
  switch (mood) {
    case 'orgulloso': return arcs(3.5);
    case 'dormido':
    case 'estirandose': return arcs(-2.5);
    case 'preocupado': return open() + `<path d="M66 84 L86 79 M114 79 L134 84" stroke="${c.stripe}" stroke-width="2.6" stroke-linecap="round"/>`;
    default:
      return sage
        ? open(3) + `<path d="M73 93 L85 93 M115 93 L127 93" stroke="${c.stripe}" stroke-width="2.4" stroke-linecap="round"/>`
        : arcs(2.5); // feliz: ojitos cerrados contentos, como en los dibujos
  }
}

function slothMouth(mood, c) {
  switch (mood) {
    case 'orgulloso': return `<path d="M90 115 Q100 128 110 115 Z" fill="#6b2f3a"/><path d="M95 121 Q100 125 105 121" fill="#e57a8f"/>`;
    case 'preocupado': return `<path d="M92 119 Q96 115 100 119 Q104 123 108 119" stroke="${c.nose}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case 'dormido': return `<ellipse cx="100" cy="118" rx="2.6" ry="2.2" fill="${c.nose}"/>`;
    case 'estirandose': return `<ellipse cx="100" cy="119" rx="5.5" ry="7" fill="#6b2f3a"/>`;
    default: return `<path d="M90 115 Q100 123 110 115" stroke="${c.nose}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
}

function slothMoodExtras(mood) {
  switch (mood) {
    case 'dormido': return `<g class="sl-zzz" fill="${MOSS}" font-family="Gaegu, cursive" font-weight="700"><text x="138" y="58" font-size="18">z</text><text x="150" y="40" font-size="24">Z</text></g>`;
    case 'preocupado': return `<path d="M146 74 q6 9 0 13 q-6 -4 0 -13z" fill="#8fd0f5"/>`;
    case 'orgulloso': return sparkle(46, 66, 7, '#f5d76e') + sparkle(156, 64, 6, '#f5d76e') + sparkle(160, 100, 4, '#f5d76e');
    case 'estirandose': return `<path d="M40 70 q-6 -6 -2 -14 M160 70 q6 -6 2 -14" stroke="#b9aec9" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    default: return '';
  }
}

function slothHead(c, m, sage) {
  return `
    <path d="M60 72 Q64 52 82 54 Q90 42 102 48 Q116 42 126 56 Q140 58 140 74 Z" fill="${c.fur}"/>
    <ellipse cx="100" cy="92" rx="48" ry="43" fill="${c.fur}"/>
    <path d="M57 94 Q58 64 100 62 Q142 64 143 94 Q142 126 100 130 Q58 126 57 94 Z" fill="${c.mask}"/>
    <path d="M96 91 Q82 82 61 92 Q57 101 66 104 Q83 103 97 98 Z" fill="${c.stripe}"/>
    <path d="M104 91 Q118 82 139 92 Q143 101 134 104 Q117 103 103 98 Z" fill="${c.stripe}"/>
    ${slothEyes(m, c, sage)}
    <path d="M90 103 Q100 97 110 103 Q109 112 100 113 Q91 112 90 103 Z" fill="${c.nose}"/>
    <ellipse cx="96.5" cy="102.5" rx="2.6" ry="1.3" fill="#fff" opacity=".45"/>
    ${slothMouth(m, c)}
    <circle cx="68" cy="112" r="5.5" fill="#f3a3b5" opacity="${m === 'orgulloso' ? 0.8 : 0.45}"/>
    <circle cx="132" cy="112" r="5.5" fill="#f3a3b5" opacity="${m === 'orgulloso' ? 0.8 : 0.45}"/>`;
}

function claws(x, y) {
  return `<path d="M${x - 9} ${y} q-4 16 4 28 M${x} ${y + 2} q-2 17 5 29 M${x + 9} ${y} q0 15 6 26" stroke="${CLAW}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M${x - 9} ${y} q-4 16 4 28 M${x} ${y + 2} q-2 17 5 29 M${x + 9} ${y} q0 15 6 26" stroke="${CLAW_EDGE}" stroke-width="1" fill="none" stroke-linecap="round" transform="translate(1.6 0)"/>`;
}

/**
 * Devuelve el SVG del perezoso.
 * view: 'full' (acostado en la rama), 'vine' (la rama colgando de lianas) o 'head' (solo la cara)
 */
function slothSVG({ view = 'full', mood, sloth } = {}) {
  const sl = sloth || Store.data.sloth;
  const m = mood || Sloth.mood();
  const c = slothColors(sl.fur || DEFAULT_FUR);
  const eq = sl.equipped || {};
  const sage = m === 'feliz' && sl.personality === 'dramatico';
  const items = Object.values(eq).map(wardrobeItem).filter(Boolean);
  const at = (anchor) => items.filter((w) => w.svg && itemAnchor(w) === anchor).map((w) => w.svg(c)).join('');

  const headInner = `${slothHead(c, m, sage)}${items.filter((w) => w.cat === 'cara').map((w) => w.svg(c)).join('')}
    ${items.filter((w) => w.cat === 'cuello').map((w) => w.svg(c)).join('')}
    ${items.filter((w) => w.cat === 'ojos').map((w) => w.svg(c)).join('')}
    ${items.filter((w) => w.cat === 'cabeza').map((w) => w.svg(c)).join('')}
    ${items.filter((w) => w.cat === 'extra' && itemAnchor(w) === 'head').map((w) => w.svg(c)).join('')}
    ${slothMoodExtras(m)}`;

  if (view === 'head') {
    return `<svg viewBox="34 14 132 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="sloth-svg mood-${m}">${headInner}</svg>`;
  }

  const outfitItem = items.find((w) => w.outfit);
  const outfit = outfitItem ? outfitSVG(outfitItem.outfit) : { back: '', front: '' };
  const vine = view === 'vine';

  const branch = `
    <path d="M-10 152 C 80 142, 200 128, 330 112" stroke="${BARK}" stroke-width="26" fill="none" stroke-linecap="round"/>
    <path d="M-10 145 C 80 135, 200 121, 330 105" stroke="${BARK_LIGHT}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M40 154 q22 -3 40 -3 M230 134 q18 -3 32 -5 M120 146 q14 -2 26 -2" stroke="${BARK_DARK}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M34 146 Q24 118 40 88" stroke="${BARK}" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${leaf(40, 90, 10)}${leaf(30, 110, -55, 0.8)}
    <path d="M292 114 Q300 96 318 84" stroke="${BARK}" stroke-width="6" fill="none" stroke-linecap="round"/>
    ${leaf(318, 86, 40)}${leaf(302, 100, 90, 0.75)}`;
  const vines = vine ? `<path d="M40 146 C 30 90 50 20 40 -90 M292 114 C 302 60 282 0 292 -90" stroke="${MOSS}" stroke-width="5" fill="none" stroke-linecap="round"/>` : '';

  const hair = outfitItem ? '' : `<path d="M170 84 q10 -4 20 0 M210 80 q10 -3 18 2 M186 104 q10 -4 18 0 M232 104 q8 -3 16 1 M156 100 q8 -4 14 -1" stroke="${c.furDark}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`;

  const vb = vine ? '-12 -90 344 330' : '-12 10 344 240';
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="sloth-svg mood-${m}">
    ${vines}
    <path d="M264 122 C 272 156, 274 184, 270 204" stroke="${c.furDark}" stroke-width="22" fill="none" stroke-linecap="round"/>
    ${claws(270, 206)}
    <path d="M226 128 C 232 160, 234 186, 230 208" stroke="${c.furDark}" stroke-width="22" fill="none" stroke-linecap="round"/>
    ${claws(230, 210)}
    ${branch}
    <g transform="${BACK_TF}">${at('back')}</g>
    ${outfit.back}
    <path d="${BODY_PATH}" fill="${c.fur}"/>
    ${hair}
    ${outfit.front}
    <path d="M150 112 C 146 150, 148 180, 150 206" stroke="${c.fur}" stroke-width="24" fill="none" stroke-linecap="round"/>
    <path d="M186 114 C 190 150, 190 176, 188 198" stroke="${c.fur}" stroke-width="24" fill="none" stroke-linecap="round"/>
    <path d="M144 150 q6 4 12 0 M182 150 q6 4 12 0" stroke="${c.furDark}" stroke-width="1.8" fill="none" opacity=".5"/>
    ${claws(150, 210)}${claws(188, 202)}
    <g transform="${ARM_TF}">${at('arm')}</g>
    <g transform="${HAND_TF}">${at('hand')}</g>
    <g transform="${HEAD_TF}">${headInner}</g>
  </svg>`;
}

/* ---------- Comportamiento ---------- */

const Sloth = {
  timer: null,
  hideTimer: null,
  moodCache: '',
  peekMood: null,

  data() { return Store.data.sloth; },

  daysSinceStudy() {
    const last = lastStudyTime();
    const base = last || semesterBounds().start.getTime();
    if (Date.now() < base) return 0;
    return Math.floor((Date.now() - base) / DAY_MS);
  },

  worried() {
    const now = new Date();
    return Store.data.events
      .filter((e) => { const d = daysUntil(e.date, now); return d >= 0 && d <= 3 && e.subjectId; })
      .map((e) => ({ e, s: subjectById(e.subjectId) }))
      .find(({ s }) => s && subjectPace(s).behind) || null;
  },

  weeklyPaceMet() {
    const subs = Store.data.subjects.filter((s) => goalMinutes(s) > 0);
    if (!subs.length) return false;
    return subs.every((s) => { const p = subjectPace(s); return p.weekDone >= p.perWeek; });
  },

  mood() {
    if (typeof Pomo !== 'undefined' && Pomo.running && Pomo.phase !== 'work') return 'estirandose';
    if (this.data().proudUntil > Date.now()) return 'orgulloso';
    if (this.worried()) return 'preocupado';
    if (this.daysSinceStudy() >= 3) return 'dormido';
    if (this.weeklyPaceMet()) return 'orgulloso';
    return 'feliz';
  },

  // Dibuja (o redibuja) todos los perezosos de la página
  paint(root = document, force = false) {
    const mood = this.mood();
    $$('[data-sloth]', root).forEach((el) => {
      const view = el.dataset.sloth;
      const m = el.id === 'sloth-body' && this.peekMood ? this.peekMood : mood;
      const key = `${view}|${m}|${JSON.stringify(this.data())}`;
      if (!force && el.dataset.key === key) return;
      el.dataset.key = key;
      el.innerHTML = slothSVG({ view, mood: m });
    });
  },
  refresh() { this.paint(document, true); },

  // Frase según lo que esté pasando
  contextPhrase() {
    const now = new Date();
    const dss = this.daysSinceStudy();
    if (dss >= 3) return phrase('dormido', { dias: dss });
    const next = Store.data.events.filter((e) => daysUntil(e.date, now) >= 0 && eventDate(e) >= now - DAY_MS).sort(byEventDate)[0];
    const r = Math.random();
    if (next) {
      const d = daysUntil(next.date, now);
      const materia = next.subjectId ? subjectName(next.subjectId) : typeLabel(next);
      if (d <= 1 && r < 0.8) return phrase('manana', { materia });
      if (d <= 7 && r < 0.6) return phrase('prueba', { materia, dias: d });
    }
    const behind = Store.data.subjects.find((s) => subjectPace(s).behind);
    if (behind && r < 0.45) return phrase('atrasada', { materia: behind.name });
    const st = streakDays();
    if (st >= 3 && r < 0.3) return phrase('racha', { dias: st });
    return phrase('aleatoria');
  },

  show(msg, { mood = null, ms = 8000, force = false } = {}) {
    if (this.data().frequency === 'nunca' && !msg && !force) return;
    const peek = $('#sloth-peek');
    this.peekMood = mood;
    this.paint(peek, true);
    $('#sloth-bubble').textContent = msg || this.contextPhrase();
    peek.classList.remove('show');
    void peek.offsetWidth; // reinicia la animación
    peek.classList.add('show');
    if (this.data().personality === 'dramatico' && this.data().sound) gong();
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hide(), ms);
  },

  hide() { $('#sloth-peek').classList.remove('show'); this.peekMood = null; },

  // Botoncito discreto: lo llama para que diga algo
  speak(msg) { this.show(msg || this.contextPhrase(), { force: true }); },

  // Aparición por evento (sesión, pomodoro, etc.)
  react(context, vars = {}, { mood = null, proud = false } = {}) {
    if (proud) { this.data().proudUntil = Date.now() + 30 * 60000; Store.save(); }
    const txt = phrase(context, vars);
    if (this.data().frequency !== 'nunca') this.show(txt, { mood: mood || (proud ? 'orgulloso' : null) });
    this.refresh();
    return txt;
  },

  schedule(first = false) {
    clearTimeout(this.timer);
    const f = this.data().frequency;
    if (f === 'nunca') return;
    const [a, b] = f === 'seguido' ? [2, 4] : [6, 12];
    const delay = first ? 20000 : (a + Math.random() * (b - a)) * 60000;
    this.timer = setTimeout(() => {
      if (!document.hidden) this.show(first ? phrase('saludo') : null);
      this.schedule();
    }, delay);
  },

  semesterHours() { return semesterMinutes() / 60; },

  unlocked(item) { return this.semesterHours() >= item.hours; },

  checkUnlocks() {
    const sl = this.data();
    const now = WARDROBE.filter((w) => this.unlocked(w)).map((w) => w.id);
    if (!Array.isArray(sl.unlockedSeen)) { sl.unlockedSeen = now; Store.save(); return; }
    const fresh = now.filter((id) => !sl.unlockedSeen.includes(id));
    if (!fresh.length) return;
    sl.unlockedSeen.push(...fresh);
    Store.save();
    const names = fresh.map((id) => wardrobeItem(id).name);
    toast(`Desbloqueaste: ${names.join(', ')}`);
    setTimeout(() => this.react('desbloqueo', { accesorio: names[0] }, { proud: true }), 1500);
  },

  // Recordatorios de pruebas: X días antes (Ajustes)
  checkReminders() {
    const days = Store.data.settings.reminderDays || [];
    const now = new Date();
    for (const ev of Store.data.events.slice().sort(byEventDate)) {
      const d = daysUntil(ev.date, now);
      if (d < 0 || !days.includes(d)) continue;
      const sent = Store.data.remindersSent[ev.id] || [];
      if (sent.includes(d)) continue;
      Store.data.remindersSent[ev.id] = [...sent, d];
      Store.save();
      const materia = ev.subjectId ? subjectName(ev.subjectId) : typeLabel(ev);
      const txt = phrase(d <= 1 ? 'manana' : 'prueba', { materia, dias: d });
      notify(`${typeLabel(ev)} de ${materia}: ${d === 1 ? 'mañana' : `en ${d} días`}`);
      if (this.data().frequency !== 'nunca') this.show(txt, { mood: 'preocupado', ms: 10000 });
      return; // de a una por vez
    }
  },

  init() {
    this.paint();
    $('#sloth-body').onclick = () => this.hide();
    $$('[data-sloth-talk]').forEach((b) => (b.onclick = () => this.speak()));
    this.checkUnlocks();
    this.schedule(true);
    setTimeout(() => this.checkReminders(), 4000);
    setInterval(() => this.checkReminders(), 10 * 60000);
    // El ánimo cambia con el tiempo (por ejemplo, se duerme)
    setInterval(() => this.paint(), 60000);
  },
};

function gong() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    [[98, 0.16], [196, 0.07], [294, 0.045], [415, 0.025]].forEach(([f, v]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
      o.start(t); o.stop(t + 2.7);
    });
    setTimeout(() => ctx.close(), 3000);
  } catch (e) { /* sin audio */ }
}

function notify(msg) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Perezoso', { body: msg, icon: 'img/icon-192.png' });
  } catch (e) { /* algunos navegadores no permiten notificaciones acá */ }
}
