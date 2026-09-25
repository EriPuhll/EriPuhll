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


const ACCENT = 'var(--accent, #a075ea)';
const MOSS = 'var(--moss, #6f8f5a)';
const LEAF = '#7cbf45';
const LEAF_LIGHT = '#a3d86a';
const BARK = '#a5652c';
const BARK_LIGHT = '#c5843f';
const BARK_DARK = '#7a4a1f';
const CLAW = '#f1e6cc';
const CLAW_EDGE = '#cdb88f';


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
  { id: 'lentes', cat: 'ojos', name: 'Lentes redondos', hours: 0, style: 'Clásico', svg: () => `<g fill="rgba(255,255,255,.2)" stroke="#2a2238" stroke-width="3"><circle cx="84" cy="94" r="12"/><circle cx="116" cy="94" r="12"/></g><path d="M96 94 Q100 90 104 94" stroke="#2a2238" stroke-width="3" fill="none"/><path d="M72 92 L54 88 M128 92 L146 88" stroke="#2a2238" stroke-width="3"/>` },
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
  { id: 'lentes_sol', cat: 'ojos', name: 'Lentes de sol', hours: 10, style: 'Clásico', svg: () => `<rect x="70" y="85" width="27" height="18" rx="8" fill="#1d1512"/><rect x="103" y="85" width="27" height="18" rx="8" fill="#1d1512"/><path d="M97 92 L103 92 M70 90 L54 86 M130 90 L146 86" stroke="#1d1512" stroke-width="3"/><path d="M75 89 L83 89 M108 89 L116 89" stroke="#fff" stroke-width="2" opacity=".5"/>` },
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
  { id: 'y2k', cat: 'ojos', name: 'Gafas Y2K', hours: 22, style: 'Gen Z', svg: () => `<ellipse cx="84" cy="94" rx="13" ry="7.5" fill="#8fd3ff" opacity=".75" stroke="#b8c4d6" stroke-width="2"/><ellipse cx="116" cy="94" rx="13" ry="7.5" fill="#8fd3ff" opacity=".75" stroke="#b8c4d6" stroke-width="2"/><path d="M97 94 L103 94 M71 93 L54 89 M129 93 L146 89" stroke="#b8c4d6" stroke-width="2.5"/>` },
  { id: 'barba', cat: 'cara', name: 'Barba de maestro', hours: 25, style: 'Maestro', svg: () => `<path d="M84 118 Q100 128 116 118 Q114 154 100 176 Q86 154 84 118 Z" fill="#f4f1ea" stroke="#d8d2c4" stroke-width="1.5"/><path d="M86 114 Q94 106 100 112 Q106 106 114 114 Q106 112 100 116 Q94 112 86 114Z" fill="#f4f1ea" stroke="#d8d2c4"/><path d="M94 132 Q100 152 98 164 M106 132 Q102 152 104 162" stroke="#e2dccf" stroke-width="1.5" fill="none"/>` },
  { id: 'fashionista', cat: 'cuerpo', name: 'Look fashionista rosa', hours: 27, style: 'Muñeca fashion', outfit: { top: '#ff5fa2', trim: '#fff', deco: 'heart' } },
  { id: 'gafas_corazon', cat: 'ojos', name: 'Gafas de corazón', hours: 27, style: 'Muñeca fashion', svg: () => `${heart(84, 94, 1.15, '#ff5fa2', '#e0428a')}${heart(116, 94, 1.15, '#ff5fa2', '#e0428a')}<path d="M98 93 L102 93 M70 90 L54 86 M130 90 L146 86" stroke="#e0428a" stroke-width="2.5"/>` },
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

/* ---------- Dibujo ----------
 * La cara (estilo "guiño") se dibuja en el marco de cabeza de siempre
 * (centro 100,92, radio ~48), así los accesorios de cabeza sirven igual en
 * todas las poses. Cada pose dibuja su cuerpo y dice dónde van la cabeza,
 * la ropa, lo que sostiene en la garra y en qué borde de la pantalla aparece.
 */

const MOODS = {
  feliz: 'Guiño', orgulloso: 'Contento', enojado: 'Enojado', preocupado: 'Preocupado', dormido: 'Dormido', estirandose: 'Estirándose',
};

function slothColors(fur) {
  return {
    fur,
    furDark: mixHex(fur, '#3b2616', 0.22),
    belly: mixHex(fur, '#ffffff', 0.35),
    mask: mixHex(fur, '#ffffff', 0.78),
    stripe: mixHex(fur, '#1d1209', 0.66),
    nose: '#2b1a12',
  };
}

// Cara estilo guiño, en su propio marco (centro 100,104, radio 78)
function gFace(c, mood) {
  const eyeOpen = (x, y, r = 10) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#140c08"/><circle cx="${x + 4}" cy="${y - 5}" r="${(r * 0.4).toFixed(1)}" fill="#fff"/>`;
  const arc = (x, y, up = true) => `<path d="M${x - 10} ${y + 2} Q${x} ${up ? y - 8 : y + 8} ${x + 10} ${y + 2}" stroke="${c.mask}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  const blushR = `<ellipse cx="144" cy="134" rx="10" ry="6" fill="#f3a3b5" opacity=".55"/>`;
  const blushL = `<ellipse cx="56" cy="134" rx="10" ry="6" fill="#f3a3b5" opacity=".55"/>`;
  let eyes; let mouth; let extra = ''; let blush = blushR;
  switch (mood) {
    case 'orgulloso':
      eyes = arc(74, 108) + arc(126, 108);
      mouth = `<path d="M84 136 Q100 160 116 136 Z" fill="#8a3444"/><path d="M92 146 Q100 152 108 146 Q100 143 92 146Z" fill="#e57a8f"/>`;
      blush = blushR + blushL;
      break;
    case 'enojado':
      eyes = [74, 126].map((x) => `<circle cx="${x}" cy="${110}" r="8" fill="#140c08"/><path d="M${x - 11} ${100} L${x + 11} ${100} L${x + 11} ${106} L${x - 11} ${106}Z" fill="${c.stripe}"/>`).join('')
        + `<path d="M56 90 L88 100 M144 90 L112 100" stroke="${c.nose}" stroke-width="4.5" stroke-linecap="round"/>`;
      mouth = `<path d="M88 146 Q100 136 112 146" stroke="${c.nose}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
      extra = `<g transform="translate(150 52)" stroke="#e0485f" stroke-width="3.2" stroke-linecap="round"><path d="M-8 -3 Q-3 -3 -3 -8 M8 -3 Q3 -3 3 -8 M-8 3 Q-3 3 -3 8 M8 3 Q3 3 3 8"/></g>`;
      blush = `<ellipse cx="56" cy="134" rx="11" ry="6" fill="#ef8d8d" opacity=".6"/><ellipse cx="144" cy="134" rx="11" ry="6" fill="#ef8d8d" opacity=".6"/>`;
      break;
    case 'preocupado':
      eyes = eyeOpen(74, 108, 9) + eyeOpen(126, 108, 9) + `<path d="M58 92 L86 84 M142 92 L114 84" stroke="${c.nose}" stroke-width="3" stroke-linecap="round"/>`;
      mouth = `<path d="M88 142 Q94 137 100 142 Q106 147 112 142" stroke="${c.nose}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      extra = `<path d="M152 70 q7 10 0 15 q-7 -5 0 -15z" fill="#8fd0f5"/>`;
      break;
    case 'dormido':
      eyes = arc(74, 104, false) + arc(126, 104, false);
      mouth = `<ellipse cx="100" cy="142" rx="4" ry="3.5" fill="${c.nose}"/>`;
      extra = `<g class="sl-zzz" fill="var(--moss, #6f8f5a)" font-family="Gaegu, cursive" font-weight="700"><text x="150" y="58" font-size="30">Z</text><text x="136" y="76" font-size="20">z</text></g>`;
      break;
    case 'estirandose':
      eyes = arc(74, 104, false) + arc(126, 104, false);
      mouth = `<ellipse cx="100" cy="144" rx="9" ry="12" fill="#8a3444"/>`;
      break;
    default: // guiño
      eyes = `<g class="sl-blink">${eyeOpen(74, 106)}</g><path d="M116 108 Q126 100 136 108" stroke="${c.mask}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M114 88 Q126 82 138 88" stroke="${c.furDark}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      mouth = `<path d="M88 140 Q104 150 116 136" stroke="${c.nose}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }
  return `<path d="M78 34 q10 -16 22 -4 q10 -14 22 2" fill="${c.fur}"/>
    <circle cx="100" cy="104" r="78" fill="${c.fur}"/>
    <ellipse cx="100" cy="114" rx="64" ry="54" fill="${c.mask}"/>
    <ellipse cx="72" cy="106" rx="23" ry="16" fill="${c.stripe}" transform="rotate(-18 72 106)"/>
    <ellipse cx="128" cy="106" rx="23" ry="16" fill="${c.stripe}" transform="rotate(18 128 106)"/>
    ${eyes}
    <path d="M92 124 Q100 119 108 124 Q106 132 100 133 Q94 132 92 124Z" fill="${c.nose}"/>
    ${mouth}${blush}${extra}`;
}

// Cabeza completa en el marco de siempre (centro 100,92) con sus accesorios
function headInner(c, mood, items) {
  const pick = (fn) => items.filter(fn).map((w) => w.svg(c)).join('');
  return `<g transform="translate(100 92) scale(0.615) translate(-100 -104)">${gFace(c, mood)}</g>
    ${pick((w) => w.cat === 'cara')}${pick((w) => w.cat === 'cuello')}${pick((w) => w.cat === 'ojos')}
    ${pick((w) => w.cat === 'cabeza')}${pick((w) => w.cat === 'extra' && itemAnchor(w) === 'head')}`;
}

const ellipsePath = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;

// Ropa del cuerpo, recortada a la forma del cuerpo de cada pose
function outfitFor(o, P) {
  const id = `sl-body-${++svgSerial}`;
  const [cx, cy] = P.center;
  const spots = [[-40, -12, 5], [-2, -24, 4], [38, -10, 5], [15, 16, 3.6], [-24, 16, 4], [46, 8, 3.6]].map(([dx, dy, s]) => [cx + dx, cy + dy, s]);
  let deco = '';
  switch (o.deco) {
    case 'sparkle': deco = spots.map(([x, y, s]) => sparkle(x, y, s, '#fff')).join(''); break;
    case 'snow': deco = spots.map(([x, y, s]) => snowflake(x, y, s)).join(''); break;
    case 'roses': deco = spots.slice(0, 4).map(([x, y]) => flower(x, y, '#e46a6a', 3.4)).join(''); break;
    case 'heart': deco = `<rect x="${cx - 150}" y="${cy + 10}" width="300" height="8" fill="${o.trim}"/>${heart(cx, cy - 14, 1, '#fff')}${sparkle(cx - 34, cy - 6, 4, '#fff')}${sparkle(cx + 36, cy - 2, 4, '#fff')}`; break;
    case 'stitch': deco = `<path d="M${cx - 50} ${cy - 22} L${cx + 50} ${cy + 22}" stroke="${o.trim}" stroke-width="2.5" stroke-dasharray="6 4"/><path d="M${cx - 32} ${cy - 20} l6 10 M${cx - 8} ${cy - 10} l6 10 M${cx + 16} ${cy} l6 10" stroke="${o.trim}" stroke-width="2"/>${skull(cx + 30, cy - 16, 0.8)}`; break;
    case 'dino': deco = `<ellipse cx="${cx}" cy="${cy + 26}" rx="${P.rx * 0.8}" ry="${P.ry * 0.5}" fill="${o.belly}"/><path d="M${cx - 30} ${cy + 10} Q${cx} ${cy + 18} ${cx + 30} ${cy + 10} M${cx - 26} ${cy + 22} Q${cx} ${cy + 30} ${cx + 26} ${cy + 22}" stroke="#a7d99a" stroke-width="3" fill="none"/>`; break;
    case 'stripe': deco = `<rect x="${cx - 10}" y="${cy - 150}" width="20" height="300" fill="#1d1d1d"/><rect x="${cx - 4}" y="${cy - 150}" width="8" height="300" fill="#f4f4f4"/>`; break;
    case 'hoodie': deco = `<path d="M${cx - 26} ${cy + 8} L${cx + 26} ${cy + 8} L${cx + 20} ${cy + 30} L${cx - 20} ${cy + 30} Z" fill="${o.trim}"/>${sparkle(cx, cy - 16, 6, '#fff')}`; break;
    case 'sash': deco = `<rect x="${cx - 150}" y="${cy + 4}" width="300" height="12" fill="#2a2238"/><path d="M${cx - 34} ${cy - 40} L${cx} ${cy + 2} L${cx + 34} ${cy - 40}" fill="none" stroke="${o.trim}" stroke-width="5"/>`; break;
    default: break;
  }
  let front = `<defs><clipPath id="${id}"><path d="${P.body}"/></clipPath></defs>
    <g clip-path="url(#${id})"><rect x="-60" y="-60" width="460" height="400" fill="${o.top}"/>${deco}</g>`;
  if (o.skirt && P.skirt) {
    front += `<path d="${P.skirt}" fill="${o.skirt}"/>`;
    if (P.hem) front += `<path d="${P.hem}" fill="none" stroke="${o.trim}" stroke-width="3"/>`;
  }
  const back = o.deco === 'dino' && P.spine
    ? P.spine.map(([x, y, r = 0]) => `<path transform="rotate(${r} ${x} ${y})" d="M${x - 9} ${y + 8} L${x} ${y - 12} L${x + 9} ${y + 8} Z" fill="#4e9a54"/>`).join('')
    : '';
  return { back, front };
}

/* ---------- Poses ---------- */

const SLOTH_POSES = [
  { id: 1, name: 'Acostado en la rama', place: 'left' },
  { id: 2, name: 'Colgado boca arriba', place: 'top-right' },
  { id: 3, name: 'Abrazado al tronco', place: 'bottom-right' },
  { id: 4, name: 'Sentado leyendo', place: 'bottom' },
  { id: 5, name: 'Durmiendo hecho bolita', place: 'left' },
  { id: 6, name: 'Saludando', place: 'top-left' },
  { id: 7, name: 'Estirándose', place: 'right' },
  { id: 8, name: 'Estudiando en la compu', place: 'bottom' },
  { id: 9, name: 'Asomándose', place: 'bottom' },
];

function drawPose(id, c, mood, items) {
  const limb = (d, col = c.fur, w = 28) => `<path d="${d}" stroke="${mixHex(col, '#3b2616', 0.25)}" stroke-width="${w + 4}" fill="none" stroke-linecap="round" opacity=".35"/><path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  const claw = (x, y, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-10 0 q-5 20 5 34 M0 2 q-3 21 6 35 M10 0 q0 19 8 31" stroke="#f1e6cc" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M-10 0 q-5 20 5 34 M0 2 q-3 21 6 35 M10 0 q0 19 8 31" stroke="#cdb88f" stroke-width="1.2" fill="none" transform="translate(2 0)"/></g>`;
  const branch = (y, x1, x2) => `<path d="M${x1} ${y} C ${x1 + 100} ${y - 6}, ${x2 - 100} ${y + 6}, ${x2} ${y}" stroke="#a5652c" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M${x1} ${y - 6} C ${x1 + 100} ${y - 12}, ${x2 - 100} ${y}, ${x2} ${y - 6}" stroke="#c5843f" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>
    <path d="M${x1 + 40} ${y + 4} q20 -2 36 -1 M${x2 - 120} ${y + 3} q16 -2 30 -1" stroke="#7a4a1f" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const head = (x, y, rot = 0, s = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${(s * 1.07).toFixed(3)}) translate(-100 -92)">${headInner(c, mood, items)}</g>`;
  const at = (anchor) => items.filter((w) => w.svg && itemAnchor(w) === anchor).map((w) => w.svg(c)).join('');
  const hand = (x, y, s = 0.6) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-100 -176)">${at('hand')}</g>`;
  const arm = (x, y) => `<g transform="translate(${x - 138} ${y - 80})">${at('arm')}</g>`;
  const back = (x, y, s = 0.78) => `<g transform="translate(${x} ${y}) scale(${s}) translate(-100 -160)">${at('back')}</g>`;
  const outfitItem = items.find((w) => w.outfit);
  const dress = (P) => (outfitItem ? outfitFor(outfitItem.outfit, P) : { back: '', front: '' });
  const belly = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c.belly}"/>`;
  const hair = (d) => (outfitItem ? '' : `<path d="${d}" stroke="${c.furDark}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>`);

  switch (id) {
    case 2: { // colgado boca arriba (rama arriba, sale del borde derecho)
      const P = { body: ellipsePath(175, 118, 88, 40), center: [178, 120], rx: 88, ry: 40, spine: [[120, 150, 180], [150, 158, 180], [180, 160, 180], [210, 158, 180], [240, 150, 180]] };
      const o = dress(P);
      return `${branch(46, 30, 420)}${leaf(40, 40, -30)}
        ${limb('M108 104 C 100 80, 104 60, 108 50')}${limb('M138 100 C 136 78, 140 60, 142 50')}
        ${limb('M206 100 C 210 78, 208 60, 206 50', c.furDark)}${limb('M236 104 C 244 82, 242 62, 238 50', c.furDark)}
        ${claw(108, 50, 180)}${claw(142, 50, 180)}${claw(206, 50, 180)}${claw(238, 50, 180)}
        ${back(178, 112)}${o.back}
        <path d="${P.body}" fill="${c.fur}"/>${belly(180, 128, 58, 22)}${o.front}
        ${arm(120, 84)}${hand(180, 136, 0.5)}
        ${head(90, 146, 12, 0.95)}`;
    }
    case 3: { // abrazado al tronco (el tronco sale del borde de abajo)
      const P = { body: ellipsePath(166, 158, 46, 64), center: [166, 162], rx: 46, ry: 64, skirt: 'M126 190 Q166 204 206 190 L222 236 Q166 250 110 236 Z', hem: 'M110 236 Q124 228 138 238 Q152 228 166 240 Q180 228 194 238 Q208 228 222 236', spine: [[122, 120, -60], [118, 150, -80], [120, 180, -100]] };
      const o = dress(P);
      return `<path d="M138 300 L138 26 Q138 12 152 12 L180 12 Q194 12 194 26 L194 300 Z" fill="#a5652c"/><rect x="148" y="14" width="12" height="290" fill="#c5843f" opacity=".7"/>
        <path d="M150 50 q6 4 0 10 M178 220 q-6 4 0 10" stroke="#7a4a1f" stroke-width="2" fill="none"/>
        <circle cx="146" cy="28" r="20" fill="${LEAF}"/><circle cx="174" cy="21" r="19" fill="${LEAF_LIGHT}"/><circle cx="198" cy="32" r="16" fill="${LEAF}"/><circle cx="162" cy="40" r="14" fill="${LEAF_LIGHT}" opacity=".8"/>
        ${back(166, 150)}${o.back}
        <path d="${P.body}" fill="${c.fur}"/>${belly(166, 172, 28, 40)}${o.front}
        ${limb('M132 128 C 116 118, 116 100, 130 88')}${limb('M200 128 C 216 118, 216 100, 202 88')}
        ${claw(132, 86, 150)}${claw(200, 86, 210)}
        ${limb('M138 206 C 120 214, 118 232, 132 242', c.furDark)}${limb('M194 206 C 212 214, 214 232, 200 242', c.furDark)}
        ${claw(132, 242, 40)}${claw(200, 242, -40)}
        ${arm(134, 110)}${hand(166, 196, 0.5)}
        ${head(166, 86, -6, 0.92)}`;
    }
    case 4: { // sentado leyendo (en el piso, abajo)
      const P = { body: ellipsePath(165, 170, 58, 64), center: [165, 168], rx: 58, ry: 64, skirt: 'M112 196 Q165 212 218 196 L238 240 Q165 256 92 240 Z', hem: 'M92 240 Q106 232 120 242 Q134 232 148 244 Q162 232 176 244 Q190 232 204 242 Q218 232 238 240', spine: [[112, 130, -60], [106, 160, -85], [110, 190, -105]] };
      const o = dress(P);
      return `<ellipse cx="165" cy="252" rx="150" ry="18" fill="#8cc084" opacity=".45"/>
        ${back(165, 160)}${o.back}
        <path d="${P.body}" fill="${c.fur}"/>${belly(165, 182, 36, 44)}${o.front}
        ${limb('M126 224 C 116 232, 112 236, 104 236', c.furDark)}${limb('M204 224 C 214 232, 218 236, 226 236', c.furDark)}
        ${claw(102, 234, 90)}${claw(228, 234, -90)}
        <path d="M118 176 L165 188 L212 176 L212 214 L165 226 L118 214 Z" fill="#fffdf8" stroke="${ACCENT}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M165 188 L165 226" stroke="${ACCENT}" stroke-width="3"/>
        <path d="M128 190 l28 6 M128 198 l28 6 M128 206 l22 5 M174 196 l28 -6 M174 204 l28 -6" stroke="#cfc6dc" stroke-width="2"/>
        ${limb('M124 142 C 108 160, 108 180, 118 196')}${limb('M206 142 C 222 160, 222 180, 212 196')}
        ${claw(118, 196, 20)}${claw(212, 196, -20)}
        ${arm(114, 172)}${hand(236, 200, 0.5)}
        ${head(165, 98, 4, 0.95)}`;
    }
    case 5: { // durmiendo hecho bolita (rama que sale del borde izquierdo)
      const P = { body: ellipsePath(175, 140, 62, 62), center: [182, 138], rx: 62, ry: 62, spine: [[160, 82, -10], [190, 80, 10], [218, 94, 35], [234, 120, 60]] };
      const o = dress(P);
      return `${branch(200, -60, 318)}${leaf(306, 196, 30)}
        ${back(175, 130)}${o.back}
        <path d="${P.body}" fill="${c.fur}"/>${o.front}
        ${hair('M150 92 q14 -6 26 -2 M198 100 q12 2 18 12 M214 150 q4 12 -2 22')}
        ${limb('M226 170 C 230 186, 226 196, 214 204', c.furDark)}${claw(212, 204, 60)}
        ${limb('M200 186 C 196 196, 190 202, 180 206')}${claw(178, 206, 60)}
        ${hand(200, 196, 0.45)}
        ${head(130, 150, -18, 0.82)}
        ${limb('M150 190 C 162 198, 176 200, 190 198')}${claw(192, 196, -70)}
        ${arm(160, 176)}`;
    }
    case 6: { // saludando (colgado de la rama que sale del borde izquierdo)
      const P = { body: ellipsePath(166, 162, 44, 62), center: [166, 164], rx: 44, ry: 62, skirt: 'M126 184 Q166 198 206 184 L222 228 Q166 242 110 228 Z', hem: 'M110 228 Q124 220 138 230 Q152 220 166 232 Q180 220 194 230 Q208 220 222 228', spine: [[208, 120, 60], [214, 150, 85], [210, 180, 105]] };
      const o = dress(P);
      return `${branch(34, -60, 300)}${leaf(290, 30, 30)}
        ${limb('M186 112 C 190 80, 190 56, 188 40')}${claw(188, 40, 180)}
        ${back(166, 150)}${o.back}
        ${limb('M146 214 C 144 232, 142 244, 142 254', c.furDark)}${limb('M186 214 C 188 232, 190 244, 190 254', c.furDark)}
        <path d="${P.body}" fill="${c.fur}"/>${belly(166, 176, 27, 40)}${o.front}
        ${limb('M136 122 C 116 108, 100 92, 92 70')}
        <g transform="translate(90 64) rotate(160)"><path d="M-10 0 q-6 16 0 28 M0 2 q-3 18 2 30 M10 0 q3 16 8 26" stroke="#f1e6cc" stroke-width="5.5" fill="none" stroke-linecap="round"/></g>
        <path d="M70 60 q-8 -4 -10 -12 M74 44 q-4 -8 0 -14" stroke="#b9aec9" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        ${arm(112, 100)}${hand(166, 196, 0.5)}
        ${head(160, 104, -4, 0.95)}`;
    }
    case 7: { // estirándose (sentado en la rama que sale del borde derecho)
      const P = { body: ellipsePath(166, 162, 50, 58), center: [166, 164], rx: 50, ry: 58, skirt: 'M122 178 Q166 192 210 178 L226 212 Q166 226 106 212 Z', hem: 'M106 212 Q120 204 134 214 Q148 204 162 216 Q176 204 190 214 Q204 204 226 212', spine: [[114, 130, -60], [110, 160, -85], [114, 190, -105]] };
      const o = dress(P);
      return `${branch(222, 20, 420)}${leaf(34, 216, -30)}
        ${back(166, 150)}${o.back}
        <path d="${P.body}" fill="${c.fur}"/>${belly(166, 174, 30, 38)}${o.front}
        ${limb('M130 128 C 112 96, 104 64, 108 34')}${limb('M202 128 C 220 96, 228 64, 224 34')}
        ${claw(108, 34, 175)}${claw(224, 34, 185)}
        ${limb('M140 212 C 136 220, 128 224, 118 224', c.furDark)}${limb('M192 212 C 196 220, 204 224, 214 224', c.furDark)}
        ${claw(116, 224, 80)}${claw(216, 224, -80)}
        ${arm(116, 86)}${hand(108, 60, 0.45)}
        ${head(166, 104, 0, 0.95)}`;
    }
    case 8: { // estudiando en la compu (escritorio abajo)
      const P = { body: ellipsePath(165, 160, 56, 62), center: [165, 150], rx: 56, ry: 62, spine: [[112, 120, -60], [106, 150, -85]] };
      const o = dress(P);
      return `${back(165, 150)}${o.back}
        <path d="${P.body}" fill="${c.fur}"/>${o.front}
        ${head(165, 92, 0, 0.95)}
        <rect x="-60" y="196" width="460" height="14" rx="4" fill="#c5843f"/><rect x="-60" y="208" width="460" height="80" fill="#e8d6bd"/>
        <path d="M110 150 L220 150 L230 196 L100 196 Z" fill="#d4d0dc" stroke="#9e97ad" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="165" cy="172" r="7" fill="${ACCENT}" opacity=".85"/>
        ${limb('M124 150 C 108 170, 106 186, 116 196')}${limb('M206 150 C 222 170, 224 186, 214 196')}
        ${claw(116, 194, -60)}${claw(214, 194, 60)}
        ${arm(124, 172)}
        <rect x="252" y="168" width="26" height="28" rx="4" fill="#fff" stroke="#d8d0c0" stroke-width="2"/><path d="M278 174 q10 0 10 8 q0 8 -10 8" stroke="#d8d0c0" stroke-width="4" fill="none"/>
        <path d="M258 160 q-4 -6 0 -12 M266 158 q-4 -6 0 -12" stroke="#b9aec9" stroke-width="2" fill="none"/>
        ${hand(56, 190, 0.5)}`;
    }
    case 9: { // asomándose (desde el borde de abajo)
      const P = { body: ellipsePath(165, 250, 80, 60), center: [165, 236], rx: 80, ry: 60 };
      const o = dress(P);
      return `<path d="${P.body}" fill="${c.fur}"/>${o.front}
        ${head(165, 150, 0, 1.15)}
        <rect x="-60" y="212" width="460" height="80" fill="#e8e0d1"/><rect x="-60" y="208" width="460" height="8" rx="4" fill="#d5cab6"/>
        ${limb('M110 226 C 104 218, 102 210, 104 204')}${limb('M220 226 C 226 218, 228 210, 226 204')}
        ${claw(104, 204, 0)}${claw(226, 204, 0)}
        ${hand(262, 196, 0.45)}`;
    }
    default: { // 1 · acostado en la rama (sale del borde izquierdo)
      const P = {
        body: 'M112 132 C 100 88, 150 56, 208 58 C 262 60, 292 90, 286 124 C 282 146, 252 152, 206 148 L 136 146 Z', center: [205, 104], rx: 80, ry: 44,
        skirt: 'M138 138 Q205 158 282 132 L290 166 Q278 176 266 168 Q254 178 242 170 Q230 180 218 171 Q206 180 194 171 Q182 179 170 170 Q156 176 136 166 Z',
        hem: 'M136 166 Q156 176 170 170 Q182 179 194 171 Q206 180 218 171 Q230 180 242 170 Q254 178 266 168 Q278 176 290 166',
        spine: [[152, 76], [176, 64], [202, 58], [228, 60], [252, 68], [274, 84, 20]],
      };
      const o = dress(P);
      return `${limb('M262 124 C 270 158, 272 184, 268 204', c.furDark)}${claw(268, 206)}
        ${limb('M226 128 C 232 160, 234 186, 230 208', c.furDark)}${claw(230, 210)}
        ${branch(140, -60, 318)}${leaf(306, 130, 30)}
        ${back(205, 96)}${o.back}
        <path d="${P.body}" fill="${c.fur}"/>${o.front}
        ${hair('M170 80 q10 -4 20 0 M212 76 q10 -3 18 2 M232 102 q8 -3 16 1')}
        ${limb('M152 112 C 148 150, 150 180, 152 204')}${claw(152, 206)}
        ${limb('M190 114 C 194 150, 194 176, 192 198')}${claw(192, 200)}
        ${arm(150, 160)}${hand(152, 222, 0.62)}
        ${head(104, 112, -10, 1.12)}`;
    }
  }
}

/**
 * Devuelve el SVG del perezoso.
 * view: 'head' (solo la cara), 'full' (pose 1) o 'pose-N' (N de 1 a 9).
 */
function slothSVG({ view = 'full', mood, sloth, pose } = {}) {
  const sl = sloth || Store.data.sloth;
  const m = mood || Sloth.mood();
  const c = slothColors(sl.fur || DEFAULT_FUR);
  const items = Object.values(sl.equipped || {}).map(wardrobeItem).filter(Boolean);
  if (view === 'head') {
    return `<svg viewBox="34 14 132 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="sloth-svg mood-${m}">${headInner(c, m, items)}</svg>`;
  }
  const id = pose || (String(view).startsWith('pose-') ? +view.slice(5) : 1);
  return `<svg viewBox="-12 0 344 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="sloth-svg pose-${id} mood-${m}" overflow="hidden">${drawPose(id, c, m, items)}</svg>`;
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
    const base = Math.max(last, parseDate(Store.data.settings.trackingStart || toISODate(new Date())).getTime());
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

  // Cuánto estudiaste esta semana comparado con lo que te tocaba hasta hoy (1 = justo)
  studyRatio(now = Date.now()) {
    const w = weekSummary(now);
    if (!w.target) return null;
    const weekStart = startOfWeek(new Date(now)).getTime();
    const from = Math.max(weekStart, parseDate(Store.data.settings.trackingStart || toISODate(new Date())).getTime());
    const elapsedDays = (now - from) / DAY_MS;
    if (elapsedDays < 1) return null; // recién empieza la semana (o recién empezaste a usar la app)
    const expected = w.target * clamp((now - weekStart) / (7 * DAY_MS), 0.2, 1);
    return w.done / expected;
  },

  mood() {
    const now = Date.now();
    if (typeof Pomo !== 'undefined' && Pomo.running && Pomo.phase !== 'work') return 'estirandose';
    if (this.data().proudUntil > now) return 'orgulloso';
    const h = new Date().getHours();
    if (h >= 23 || h < 6) return 'dormido';
    const r = this.studyRatio(now);
    if (this.daysSinceStudy() >= 3 || (r != null && r < 0.5)) return 'enojado';
    if (this.worried()) return 'preocupado';
    if ((r != null && r >= 1) || streakDays() >= 3) return 'orgulloso';
    return 'feliz';
  },

  // Tono de las frases según el ánimo
  tone(mood = this.mood()) {
    return mood === 'enojado' ? 'enojado' : mood === 'orgulloso' ? 'contento' : 'normal';
  },

  // Dibuja (o redibuja) todos los perezosos de la página
  paint(root = document, force = false) {
    const mood = this.mood();
    $$('[data-sloth]', root).forEach((el) => {
      const peek = el.id === 'sloth-body';
      const view = peek ? `pose-${this.peekPose || 1}` : el.dataset.sloth;
      const m = peek && this.peekMood ? this.peekMood : mood;
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
    const mood = this.mood();
    if (mood === 'dormido') return phrase('noche');
    const next = Store.data.events.filter((e) => daysUntil(e.date, now) >= 0 && eventDate(e) >= now - DAY_MS).sort(byEventDate)[0];
    const r = Math.random();
    if (next) {
      const d = daysUntil(next.date, now);
      const materia = next.subjectId ? subjectName(next.subjectId) : typeLabel(next);
      if (d <= 1 && r < 0.8) return phrase('manana', { materia });
      if (d <= 7 && r < 0.5) return phrase('prueba', { materia, dias: d });
    }
    const behind = Store.data.subjects.find((s) => subjectPace(s).behind);
    if (behind && r < 0.4) return phrase('atrasada', { materia: behind.name });
    const st = streakDays();
    if (st >= 3 && r < 0.3) return phrase('racha', { dias: st });
    return phrase(r < 0.3 ? 'saludo' : 'aleatoria');
  },

  // Qué pose usar y en qué borde de la pantalla aparece
  pickPose(mood) {
    if (mood === 'dormido') return 5;
    if (mood === 'estirandose') return 7;
    if (location.hash.startsWith('#estudio')) return 8;
    const opts = [1, 2, 3, 4, 6, 9, 5, 7];
    return opts[Math.floor(Math.random() * opts.length)];
  },

  show(msg, { mood = null, ms = 8500, force = false, pose = null } = {}) {
    if (this.data().frequency === 'nunca' && !msg && !force) return;
    const peek = $('#sloth-peek');
    this.peekMood = mood;
    this.peekPose = pose || this.pickPose(mood || this.mood());
    const place = (SLOTH_POSES.find((p) => p.id === this.peekPose) || SLOTH_POSES[0]).place;
    peek.dataset.place = place;
    // Posición a lo largo del borde (arriba/abajo o a un costado)
    const rnd = (a, b) => `${Math.round(a + Math.random() * (b - a))}%`;
    peek.style.top = ['left', 'right'].includes(place) ? rnd(22, 52) : '';
    peek.style.left = place === 'bottom' ? rnd(4, 58) : '';
    this.paint(peek, true);
    $('#sloth-bubble').textContent = msg || this.contextPhrase();
    peek.classList.remove('show');
    void peek.offsetWidth; // reinicia la animación
    peek.classList.add('show');
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
      if (this.data().frequency !== 'nunca') this.show(txt, { ms: 10000 });
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

function notify(msg) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Perezoso', { body: msg, icon: 'img/icon-192.png' });
  } catch (e) { /* algunos navegadores no permiten notificaciones acá */ }
}
