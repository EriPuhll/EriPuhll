'use strict';

/* ---------- El perezoso: dibujo por capas, ropa, ánimo y apariciones ---------- */

const FUR_PRESETS = [
  { id: 'marron', label: 'Marrón clásico', color: '#a88a6d' },
  { id: 'gris', label: 'Gris', color: '#9a9aa3' },
  { id: 'caramelo', label: 'Caramelo', color: '#c98a4b' },
  { id: 'lavanda', label: 'Lavanda', color: '#a075ea' },
  { id: 'menta', label: 'Menta', color: '#7cc4a4' },
  { id: 'rosa', label: 'Rosa', color: '#f0a3c0' },
];

const MOODS = {
  feliz: 'Feliz', dormido: 'Dormido', preocupado: 'Preocupado', orgulloso: 'Orgulloso', estirandose: 'Estirándose',
};

const ACCENT = 'var(--accent, #a075ea)';
const MOSS = 'var(--moss, #6f8f5a)';

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
function princessDress(top, skirt, trim, deco) {
  return `<circle cx="68" cy="132" r="11" fill="${top}"/><circle cx="132" cy="132" r="11" fill="${top}"/>
    <path d="M70 128 Q100 120 130 128 L126 168 Q100 174 74 168 Z" fill="${top}"/>
    <path d="M74 166 Q100 174 126 166 Q156 196 164 232 Q100 248 36 232 Q44 196 74 166 Z" fill="${skirt}"/>
    <path d="M36 232 Q48 222 60 233 Q72 222 84 234 Q96 222 108 234 Q120 222 132 234 Q144 222 164 232" fill="none" stroke="${trim}" stroke-width="3"/>
    <path d="M74 166 Q100 176 126 166" stroke="${trim}" stroke-width="4" fill="none"/>${deco}`;
}
function snowflake(x, y, s) {
  return `<path d="M${x - s} ${y} L${x + s} ${y} M${x} ${y - s} L${x} ${y + s} M${x - s * 0.7} ${y - s * 0.7} L${x + s * 0.7} ${y + s * 0.7} M${x - s * 0.7} ${y + s * 0.7} L${x + s * 0.7} ${y - s * 0.7}" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`;
}

/* Ropero. hours = horas de estudio del semestre para desbloquear. */
const WARDROBE_CATS = [
  { id: 'cabeza', label: 'Cabeza', icon: '👒' },
  { id: 'ojos', label: 'Ojos', icon: '👓' },
  { id: 'cara', label: 'Cara', icon: '🧔' },
  { id: 'cuello', label: 'Cuello', icon: '🧣' },
  { id: 'cuerpo', label: 'Ropa', icon: '👗' },
  { id: 'abrazando', label: 'Abrazando', icon: '🤲' },
  { id: 'extra', label: 'Extras', icon: '✨' },
];

const WARDROBE = [
  // --- 0 h
  { id: 'mono', cat: 'cabeza', name: 'Moño', hours: 0, style: 'Clásico', svg: () => `<g transform="translate(132 56) rotate(18)"><path d="M0 0 L-17 -11 Q-21 0 -17 11 Z" fill="#f28bb3"/><path d="M0 0 L17 -11 Q21 0 17 11 Z" fill="#f28bb3"/><circle r="5.5" fill="#e0679a"/></g>` },
  { id: 'lentes', cat: 'ojos', name: 'Lentes redondos', hours: 0, style: 'Clásico', svg: () => `<g fill="rgba(255,255,255,.18)" stroke="#2a2238" stroke-width="3"><circle cx="86" cy="94" r="12"/><circle cx="114" cy="94" r="12"/></g><path d="M98 94 Q100 90 102 94" stroke="#2a2238" stroke-width="3" fill="none"/><path d="M74 92 L56 88 M126 92 L144 88" stroke="#2a2238" stroke-width="3"/>` },
  { id: 'bufanda', cat: 'cuello', name: 'Bufanda', hours: 0, style: 'Clásico', svg: () => `<path d="M62 128 Q100 144 138 128 L138 142 Q100 158 62 142 Z" fill="#e46a6a"/><path d="M116 144 L124 178 L110 178 L106 148 Z" fill="#e46a6a"/><path d="M110 170 L124 170 M109 175 L125 175" stroke="#fff" stroke-width="2"/><path d="M78 134 L79 146 M100 140 L100 152 M122 134 L121 146" stroke="#f7c9c9" stroke-width="3"/>` },
  { id: 'hojita', cat: 'abrazando', name: 'Hojita', hours: 0, style: 'Clásico', svg: () => `<path d="M84 190 Q92 150 126 156 Q120 190 84 190 Z" fill="${MOSS}"/><path d="M88 186 Q104 172 122 160" stroke="#dcebd0" stroke-width="2" fill="none"/>` },
  // --- progreso
  { id: 'gorro', cat: 'cabeza', name: 'Gorro de lana con pompón', hours: 2, style: 'Clásico', svg: () => `<path d="M54 80 Q54 34 100 32 Q146 34 146 80 Z" fill="#6c9eeb"/><path d="M70 44 L70 78 M85 36 L85 78 M100 33 L100 78 M115 36 L115 78 M130 44 L130 78" stroke="#5a8ad6" stroke-width="3"/><rect x="50" y="72" width="100" height="15" rx="7.5" fill="#4a7fd4"/><circle cx="100" cy="28" r="11" fill="#fff" stroke="#dfe7f5" stroke-width="2"/>` },
  { id: 'mariposas', cat: 'cabeza', name: 'Clips de mariposa', hours: 3, style: 'Gen Z', svg: () => butterfly(70, 60, -20, '#c78bd9', '#f28bb3') + butterfly(130, 56, 18, '#8fd3ff', '#7cc4a4') },
  { id: 'auriculares', cat: 'cabeza', name: 'Auriculares', hours: 5, style: 'Clásico', svg: () => `<path d="M50 98 Q50 36 100 36 Q150 36 150 98" stroke="#2a2238" stroke-width="7" fill="none"/><rect x="38" y="84" width="18" height="30" rx="8" fill="${ACCENT}"/><rect x="144" y="84" width="18" height="30" rx="8" fill="${ACCENT}"/>` },
  { id: 'taza', cat: 'abrazando', name: 'Taza de café', hours: 5, style: 'Clásico', svg: () => `<rect x="86" y="160" width="28" height="30" rx="5" fill="#fff" stroke="#d8d0c0" stroke-width="2"/><path d="M114 166 q12 0 12 9 q0 9 -12 9" stroke="#d8d0c0" stroke-width="4" fill="none"/><ellipse cx="100" cy="162" rx="12" ry="3" fill="#7a4a2a"/><path d="M92 152 q-4 -6 0 -12 M100 150 q-4 -6 0 -12 M108 152 q-4 -6 0 -12" stroke="#b9aec9" stroke-width="2" fill="none"/>${heart(100, 174, 0.45, '#f28bb3')}` },
  { id: 'brillitos', cat: 'extra', name: 'Brillitos en la cara', hours: 6, style: 'Gen Z', svg: () => sparkle(58, 72, 6, '#f5d76e') + sparkle(146, 110, 5, '#f28bb3') + sparkle(52, 116, 4, '#c9b6f2') + sparkle(150, 62, 4.5, '#fff') + `<circle cx="74" cy="104" r="1.4" fill="#f5d76e"/><circle cx="78" cy="108" r="1.2" fill="#fff"/><circle cx="124" cy="104" r="1.4" fill="#f5d76e"/><circle cx="121" cy="108" r="1.2" fill="#fff"/>` },
  { id: 'tiara', cat: 'cabeza', name: 'Tiara de princesa', hours: 7, style: 'Princesa', svg: () => `<path d="M76 58 L84 40 L92 52 L100 32 L108 52 L116 40 L124 58 Z" fill="#f5d76e" stroke="#e0b93f" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="46" r="3.5" fill="#f28bb3"/><circle cx="84" cy="50" r="2.5" fill="#6c9eeb"/><circle cx="116" cy="50" r="2.5" fill="#6c9eeb"/>` },
  { id: 'perlas', cat: 'cuello', name: 'Collar de perlas', hours: 7, style: 'Princesa', svg: () => [70, 77.5, 85, 92.5, 100, 107.5, 115, 122.5, 130].map((x) => `<circle cx="${x}" cy="${(132 + 9 * (1 - ((x - 100) / 32) ** 2)).toFixed(1)}" r="3.3" fill="#fff" stroke="#e5ddcf" stroke-width="1"/>`).join('') },
  { id: 'vaso', cat: 'abrazando', name: 'Vaso térmico XL', hours: 8, style: 'Gen Z', svg: () => `<path d="M86 148 L114 148 L110 204 L90 204 Z" fill="#9fd8c8"/><rect x="84" y="140" width="32" height="10" rx="4" fill="#7cc4b0"/><path d="M104 140 L110 120" stroke="#f28bb3" stroke-width="4" stroke-linecap="round"/><path d="M114 156 q14 2 12 18 q-2 12 -14 12" stroke="#7cc4b0" stroke-width="5" fill="none"/><rect x="88" y="190" width="24" height="3" fill="#7cc4b0"/>` },
  { id: 'lentes_sol', cat: 'ojos', name: 'Lentes de sol', hours: 10, style: 'Clásico', svg: () => `<rect x="72" y="85" width="26" height="18" rx="7" fill="#1d1512"/><rect x="102" y="85" width="26" height="18" rx="7" fill="#1d1512"/><path d="M98 92 L102 92 M72 90 L56 86 M128 90 L144 86" stroke="#1d1512" stroke-width="3"/><path d="M76 89 L84 89 M106 89 L114 89" stroke="#fff" stroke-width="2" opacity=".5"/>` },
  { id: 'libro', cat: 'abrazando', name: 'Libro', hours: 10, style: 'Clásico', svg: () => `<g transform="rotate(-8 100 176)"><rect x="80" y="158" width="42" height="32" rx="3" fill="${ACCENT}"/><rect x="84" y="161" width="36" height="26" fill="#fffdf8"/><rect x="80" y="158" width="8" height="32" rx="2" fill="#2a2238" opacity=".35"/><path d="M92 168 L114 168 M92 174 L114 174 M92 180 L108 180" stroke="#cfc6dc" stroke-width="2"/></g>` },
  { id: 'vestido_rosa', cat: 'cuerpo', name: 'Vestido de princesa rosa', hours: 12, style: 'Princesa', svg: () => princessDress('#f7b8d2', '#f28bb3', '#fff', sparkle(60, 212, 4, '#fff') + sparkle(140, 206, 4, '#fff') + sparkle(100, 218, 3.5, '#fff') + sparkle(84, 194, 3, '#fff') + sparkle(120, 190, 3, '#fff')) },
  { id: 'varita', cat: 'abrazando', name: 'Varita con estrella', hours: 12, style: 'Princesa', svg: () => `<path d="M84 204 L114 154" stroke="#f5d76e" stroke-width="4" stroke-linecap="round"/><path d="M116 136 l4 9 l10 1 l-7 7 l2 10 l-9 -5 l-9 5 l2 -10 l-7 -7 l10 -1z" fill="#f5d76e" stroke="#e0b43a" stroke-width="1.5"/>${sparkle(134, 134, 3, '#fff')}` },
  { id: 'matcha', cat: 'abrazando', name: 'Matcha latte', hours: 14, style: 'Gen Z', svg: () => `<path d="M88 158 L112 158 L109 196 L91 196 Z" fill="rgba(255,255,255,.75)" stroke="#d8d0c0" stroke-width="2"/><path d="M89.5 172 L110.5 172 L109 196 L91 196 Z" fill="#9bc36b"/><path d="M89 172 Q100 167 111 172" stroke="#f4f0e6" stroke-width="3" fill="none"/><path d="M104 158 L112 136" stroke="${MOSS}" stroke-width="5" stroke-linecap="round"/><ellipse cx="100" cy="158" rx="13" ry="3" fill="#fff" stroke="#d8d0c0"/>` },
  { id: 'cinta', cat: 'cabeza', name: 'Cinta de guerrero', hours: 15, style: 'Maestro', svg: () => `<path d="M52 78 Q100 64 148 78 L148 90 Q100 76 52 90 Z" fill="#d9546e"/><path d="M54 82 L30 90 L36 98 L56 90 Z" fill="#c43d58"/><path d="M54 86 L34 104 L42 108 L58 90 Z" fill="#d9546e"/><circle cx="100" cy="76" r="5" fill="#fff"/><circle cx="100" cy="76" r="2.4" fill="#d9546e"/>` },
  { id: 'capucha_dino', cat: 'cabeza', name: 'Capucha de dino', hours: 15, style: 'Dino', svg: () => `<path d="M70 44 L76 24 L86 36 L94 16 L100 30 L106 16 L114 36 L124 24 L130 44 Z" fill="#4e9a54"/><path d="M56 112 Q42 38 100 36 Q158 38 144 112" stroke="#7bc47f" stroke-width="16" fill="none" stroke-linecap="round"/><circle cx="72" cy="52" r="5" fill="#fff"/><circle cx="73" cy="52" r="2.4" fill="#1d1512"/><circle cx="128" cy="52" r="5" fill="#fff"/><circle cx="127" cy="52" r="2.4" fill="#1d1512"/>` },
  { id: 'celular', cat: 'abrazando', name: 'Celu con funda cute', hours: 16, style: 'Gen Z', svg: () => `<rect x="86" y="150" width="28" height="48" rx="6" fill="#c9b6f2"/><rect x="90" y="155" width="20" height="36" rx="3" fill="#2a2238"/><circle cx="100" cy="194" r="2" fill="#fff"/><path d="M114 156 q10 4 8 16" stroke="#f28bb3" stroke-width="2" fill="none"/><circle cx="122" cy="174" r="4" fill="#f5d76e"/>${sparkle(100, 170, 6, '#f28bb3')}` },
  { id: 'pijama_dino', cat: 'cuerpo', name: 'Pijama de dino', hours: 18, style: 'Dino', svg: () => `<path d="M146 196 Q178 204 188 232 Q162 220 142 212 Z" fill="#7bc47f"/><path d="M160 204 l4 -8 l4 9 M172 212 l5 -7 l3 10" fill="#4e9a54"/><ellipse cx="100" cy="166" rx="51" ry="57" fill="#7bc47f"/><ellipse cx="100" cy="178" rx="30" ry="38" fill="#c9ecb8"/><path d="M80 160 Q100 166 120 160 M78 176 Q100 182 122 176 M80 192 Q100 198 120 192" stroke="#a7d99a" stroke-width="3" fill="none"/><ellipse cx="72" cy="218" rx="18" ry="12" fill="#7bc47f"/><ellipse cx="128" cy="218" rx="18" ry="12" fill="#7bc47f"/>` },
  { id: 'choker', cat: 'cuello', name: 'Choker con corazón', hours: 18, style: 'Gen Z', svg: () => `<path d="M68 130 Q100 142 132 130" stroke="#2a2238" stroke-width="5" fill="none"/>${heart(100, 144, 0.55, '#ff5fa2')}` },
  { id: 'corona_flores', cat: 'cabeza', name: 'Corona de flores', hours: 20, style: 'Clásico', svg: () => {
    const pts = [[60, 70], [70, 57], [84, 49], [100, 46], [116, 49], [130, 57], [140, 70]];
    const cols = ['#f28bb3', '#f5d76e', '#c9b6f2', '#fff', '#f28bb3', '#f5d76e', '#c9b6f2'];
    return `<path d="M56 74 Q100 34 144 74" stroke="${MOSS}" stroke-width="5" fill="none"/>` + pts.map(([x, y], i) => flower(x, y, cols[i])).join('');
  } },
  { id: 'monito', cat: 'cuello', name: 'Moñito', hours: 20, style: 'Clásico', svg: () => `<path d="M100 138 L84 128 L84 148 Z" fill="${ACCENT}"/><path d="M100 138 L116 128 L116 148 Z" fill="${ACCENT}"/><circle cx="100" cy="138" r="4.5" fill="#2a2238" opacity=".45"/>` },
  { id: 'dino_peluche', cat: 'abrazando', name: 'Dino de peluche', hours: 20, style: 'Dino', svg: () => `<path d="M90 168 l3 -7 l3 7 M98 166 l3 -7 l3 7 M106 168 l3 -7 l3 7" fill="#4e9a54"/><ellipse cx="100" cy="180" rx="18" ry="14" fill="#7bc47f"/><circle cx="116" cy="164" r="10" fill="#7bc47f"/><circle cx="119" cy="162" r="2" fill="#1d1512"/><path d="M84 184 Q72 188 70 178 Q78 180 84 176Z" fill="#7bc47f"/><ellipse cx="92" cy="192" rx="4" ry="3" fill="#4e9a54"/><ellipse cx="108" cy="192" rx="4" ry="3" fill="#4e9a54"/>` },
  { id: 'bucket', cat: 'cabeza', name: 'Bucket hat', hours: 22, style: 'Gen Z', svg: () => `<path d="M62 72 Q62 36 100 36 Q138 36 138 72 Z" fill="#f2c94c"/><path d="M42 76 Q100 60 158 76 Q152 88 100 84 Q48 88 42 76 Z" fill="#e0b43a"/>${flower(82, 54, '#fff', 3)}${flower(106, 46, '#fff', 3)}${flower(122, 62, '#fff', 3)}` },
  { id: 'buzo', cat: 'cuerpo', name: 'Buzo oversize', hours: 22, style: 'Gen Z', svg: () => `<path d="M52 132 Q100 116 148 132 L152 208 Q100 218 48 208 Z" fill="#c9b6f2"/><path d="M76 178 L124 178 L118 200 L82 200 Z" fill="#b8a2ea"/><path d="M92 134 L90 160 M108 134 L110 160" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M50 203 L150 203" stroke="#b8a2ea" stroke-width="8"/>${sparkle(100, 158, 6, '#fff')}` },
  { id: 'y2k', cat: 'ojos', name: 'Gafas Y2K', hours: 22, style: 'Gen Z', svg: () => `<ellipse cx="86" cy="94" rx="13" ry="7" fill="#8fd3ff" opacity=".75" stroke="#b8c4d6" stroke-width="2"/><ellipse cx="114" cy="94" rx="13" ry="7" fill="#8fd3ff" opacity=".75" stroke="#b8c4d6" stroke-width="2"/><path d="M99 94 L101 94 M73 93 L56 89 M127 93 L144 89" stroke="#b8c4d6" stroke-width="2.5"/>` },
  { id: 'barba', cat: 'cara', name: 'Barba de maestro', hours: 25, style: 'Maestro', svg: () => `<path d="M84 116 Q100 126 116 116 Q114 152 100 174 Q86 152 84 116 Z" fill="#f4f1ea" stroke="#d8d2c4" stroke-width="1.5"/><path d="M86 112 Q94 104 100 110 Q106 104 114 112 Q106 110 100 114 Q94 110 86 112Z" fill="#f4f1ea" stroke="#d8d2c4"/><path d="M94 130 Q100 150 98 162 M106 130 Q102 150 104 160" stroke="#e2dccf" stroke-width="1.5" fill="none"/>` },
  { id: 'fashionista', cat: 'cuerpo', name: 'Look fashionista rosa', hours: 27, style: 'Muñeca fashion', svg: () => `<path d="M64 126 Q100 118 136 126 L146 206 Q100 216 54 206 Z" fill="#ff5fa2"/><path d="M64 126 Q100 118 136 126 L132 138 Q100 130 68 138 Z" fill="#fff"/><rect x="62" y="160" width="76" height="8" rx="4" fill="#fff"/>${heart(100, 150, 0.6, '#fff')}${sparkle(76, 190, 3.5, '#fff')}${sparkle(126, 184, 3.5, '#fff')}` },
  { id: 'gafas_corazon', cat: 'ojos', name: 'Gafas de corazón', hours: 27, style: 'Muñeca fashion', svg: () => `${heart(86, 94, 1.15, '#ff5fa2', '#e0428a')}${heart(114, 94, 1.15, '#ff5fa2', '#e0428a')}<path d="M98 92 L102 92 M72 90 L56 86 M128 90 L144 86" stroke="#e0428a" stroke-width="2.5"/>` },
  { id: 'mono_gigante', cat: 'cabeza', name: 'Moño gigante rosa chicle', hours: 27, style: 'Muñeca fashion', svg: () => `<g transform="translate(100 42)"><path d="M0 0 L-30 -18 Q-38 0 -30 18 Z" fill="#ff5fa2"/><path d="M0 0 L30 -18 Q38 0 30 18 Z" fill="#ff5fa2"/><path d="M-4 4 L-14 26 L-8 26 L0 8 Z M4 4 L14 26 L8 26 L0 8 Z" fill="#ff85b8"/><rect x="-7" y="-7" width="14" height="14" rx="4" fill="#e0428a"/></g>` },
  { id: 'tunica', cat: 'cuerpo', name: 'Túnica de maestro', hours: 28, style: 'Maestro', svg: () => `<path d="M54 128 Q100 116 146 128 L152 214 Q100 226 48 214 Z" fill="#c8733a"/><path d="M76 124 L100 172 L124 124" fill="none" stroke="#f5d76e" stroke-width="5"/><rect x="52" y="172" width="96" height="11" fill="#2a2238"/><path d="M60 214 Q100 224 140 214" stroke="#f5d76e" stroke-width="4" fill="none"/>` },
  { id: 'boina', cat: 'cabeza', name: 'Boina', hours: 30, style: 'Clásico', svg: () => `<ellipse cx="96" cy="56" rx="46" ry="15" fill="#c0392b" transform="rotate(-8 96 56)"/><ellipse cx="96" cy="61" rx="40" ry="6" fill="#a93226" transform="rotate(-8 96 61)"/><circle cx="92" cy="40" r="4" fill="#c0392b"/>` },
  { id: 'lapiz', cat: 'abrazando', name: 'Lápiz', hours: 30, style: 'Clásico', svg: () => `<g transform="rotate(-35 100 176)"><rect x="74" y="170" width="46" height="12" fill="#f5c542"/><rect x="66" y="170" width="9" height="12" rx="2" fill="#f28bb3"/><rect x="74" y="170" width="4" height="12" fill="#c0c0c0"/><path d="M120 170 L134 176 L120 182 Z" fill="#f1d7b0"/><path d="M130 174.3 L134 176 L130 177.7 Z" fill="#2a2238"/></g>` },
  { id: 'monstruito', cat: 'cuerpo', name: 'Vestido gótico con costuras', hours: 32, style: 'Monstruito chic', svg: () => `<path d="M64 126 Q100 118 136 126 L150 210 Q100 222 50 210 Z" fill="#2a2238"/><path d="M50 210 L58 200 L66 212 L74 200 L82 213 L90 200 L98 214 L106 200 L114 213 L122 200 L130 212 L138 200 L146 211 L150 210 Q100 222 50 210Z" fill="#8e44ad"/><path d="M78 140 L118 196" stroke="#f28bb3" stroke-width="2.5" stroke-dasharray="5 4"/><path d="M84 146 l8 -4 M92 158 l8 -4 M100 170 l8 -4 M108 182 l8 -4" stroke="#f28bb3" stroke-width="2"/>${skull(124, 150, 0.7)}` },
  { id: 'calavera', cat: 'cabeza', name: 'Mechón rosa y clip calavera', hours: 32, style: 'Monstruito chic', svg: () => `<path d="M80 56 Q88 36 108 42 Q100 58 86 66 Z" fill="#f28bb3"/><path d="M90 50 Q98 42 106 44" stroke="#2a2238" stroke-width="3" fill="none"/>${skull(130, 58)}<circle cx="142" cy="52" r="3" fill="#f28bb3"/>` },
  { id: 'baston', cat: 'abrazando', name: 'Bastón de bambú', hours: 35, style: 'Maestro', svg: () => `<path d="M150 104 L58 238" stroke="#9bbf5a" stroke-width="8" stroke-linecap="round"/><path d="M137 123 l8 5 M118 151 l8 5 M99 179 l8 5 M80 207 l8 5" stroke="#6f8f5a" stroke-width="3"/><path d="M150 104 q12 -8 16 -2 q-8 4 -16 2z" fill="${MOSS}"/>` },
  { id: 'reloj_alien', cat: 'extra', name: 'Reloj alien verde', hours: 38, style: 'Héroe alien', svg: () => `<g transform="translate(138 80) rotate(-10)"><rect x="-13" y="-7" width="26" height="14" rx="4" fill="#1d1d1d"/><circle r="9.5" fill="#39d353" stroke="#1d1d1d" stroke-width="3"/><path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5Z" fill="#dfffe6"/></g>` },
  { id: 'campera_alien', cat: 'cuerpo', name: 'Campera de héroe alien', hours: 38, style: 'Héroe alien', svg: () => `<path d="M58 128 Q100 118 142 128 L148 206 Q100 216 52 206 Z" fill="#3f9b4a"/><rect x="93" y="122" width="14" height="92" fill="#1d1d1d"/><rect x="97" y="122" width="6" height="92" fill="#f4f4f4"/><path d="M70 126 L86 142 M130 126 L114 142" stroke="#2f7a38" stroke-width="5"/>` },
  { id: 'birrete', cat: 'cabeza', name: 'Birrete de graduación', hours: 40, style: 'Clásico', svg: () => `<rect x="72" y="50" width="56" height="18" rx="3" fill="#2a2238"/><path d="M100 24 L156 44 L100 64 L44 44 Z" fill="#3a3050"/><path d="M152 45 L156 76" stroke="#f5d76e" stroke-width="3"/><circle cx="156" cy="79" r="5" fill="#f5d76e"/><circle cx="100" cy="44" r="3" fill="#f5d76e"/>` },
  { id: 'vestido_hielo', cat: 'cuerpo', name: 'Vestido de princesa de hielo', hours: 45, style: 'Princesa', svg: () => princessDress('#cdeeff', '#9fd8f7', '#fff', snowflake(62, 212, 5) + snowflake(138, 206, 5) + snowflake(100, 222, 4) + snowflake(86, 192, 3.5) + snowflake(118, 188, 3.5)) },
  { id: 'alas', cat: 'extra', name: 'Alas de hada', hours: 45, style: 'Princesa', back: true, svg: () => `<g opacity=".88"><path d="M60 150 Q10 90 16 150 Q20 196 64 176 Z" fill="#d6ecff" stroke="#9fd0f5" stroke-width="2"/><path d="M140 150 Q190 90 184 150 Q180 196 136 176 Z" fill="#d6ecff" stroke="#9fd0f5" stroke-width="2"/><path d="M60 170 Q26 190 36 212 Q54 214 66 186 Z" fill="#f7d6ff" stroke="#e0b0f0"/><path d="M140 170 Q174 190 164 212 Q146 214 134 186 Z" fill="#f7d6ff" stroke="#e0b0f0"/></g>` },
  { id: 'corona', cat: 'cabeza', name: 'Corona dorada', hours: 50, style: 'Princesa', svg: () => `<path d="M64 62 L64 32 L82 48 L100 24 L118 48 L136 32 L136 62 Z" fill="#f5c542" stroke="#c99a1a" stroke-width="2" stroke-linejoin="round"/><rect x="64" y="56" width="72" height="8" fill="#e0ad2e"/><circle cx="100" cy="46" r="4.5" fill="#d9546e"/><circle cx="80" cy="54" r="3" fill="#6c9eeb"/><circle cx="120" cy="54" r="3" fill="#5fb3a1"/>` },
  { id: 'vestido_dorado', cat: 'cuerpo', name: 'Vestido de gala dorado', hours: 50, style: 'Princesa', svg: () => princessDress('#f7e08a', '#f5c542', '#fff7d6', flower(62, 210, '#e46a6a', 3.5) + flower(138, 206, '#e46a6a', 3.5) + flower(100, 220, '#e46a6a', 3.5) + sparkle(84, 192, 3, '#fff') + sparkle(118, 190, 3, '#fff')) },
];

function wardrobeItem(id) { return WARDROBE.find((w) => w.id === id); }

/* ---------- Dibujo ---------- */

function slothColors(fur) {
  return { fur, mask: mixHex(fur, '#ffffff', 0.74), belly: mixHex(fur, '#ffffff', 0.34), patch: mixHex(fur, '#1d1512', 0.5), dark: '#3a2a20' };
}

function slothEyes(mood, c, sage) {
  const open = (r = 4.6) => `<circle cx="86" cy="94" r="${r}" fill="#1d1512"/><circle cx="87.6" cy="92.4" r="1.6" fill="#fff"/><circle cx="114" cy="94" r="${r}" fill="#1d1512"/><circle cx="115.6" cy="92.4" r="1.6" fill="#fff"/>`;
  const arcs = (d) => `<path d="M80 ${94 - d} Q86 ${94 + d} 92 ${94 - d} M108 ${94 - d} Q114 ${94 + d} 120 ${94 - d}" stroke="#1d1512" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  switch (mood) {
    case 'orgulloso': return arcs(-4);
    case 'dormido':
    case 'estirandose': return arcs(3);
    case 'preocupado': return open(3.8) + `<path d="M78 84 L92 79 M108 79 L122 84" stroke="${c.dark}" stroke-width="2.6" stroke-linecap="round"/>`;
    default:
      // Mirada entrecerrada de maestro sabio
      return sage
        ? open() + `<path d="M80.4 94 A5.6 5.6 0 0 1 91.6 94 Z M108.4 94 A5.6 5.6 0 0 1 119.6 94 Z" fill="${c.patch}"/><path d="M80 94 L92 94 M108 94 L120 94" stroke="#1d1512" stroke-width="1.6"/>`
        : `<g class="sl-blink">${open()}</g>`;
  }
}

function slothMouth(mood, c) {
  switch (mood) {
    case 'orgulloso': return `<path d="M89 113 Q100 128 111 113 Z" fill="#6b2f3a"/><path d="M95 120 Q100 124 105 120" fill="#e57a8f"/>`;
    case 'preocupado': return `<path d="M92 118 Q96 114 100 118 Q104 122 108 118" stroke="${c.dark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case 'dormido': return `<circle cx="100" cy="117" r="2.6" fill="${c.dark}"/>`;
    case 'estirandose': return `<ellipse cx="100" cy="118" rx="5.5" ry="7.5" fill="#6b2f3a"/>`;
    default: return `<path d="M91 114 Q100 122 109 114" stroke="${c.dark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
}

function slothMoodExtras(mood) {
  switch (mood) {
    case 'dormido': return `<g class="sl-zzz" fill="${MOSS}" font-family="Gaegu, cursive" font-weight="700"><text x="140" y="64" font-size="18">z</text><text x="152" y="46" font-size="24">Z</text></g>`;
    case 'preocupado': return `<path d="M144 76 q6 9 0 13 q-6 -4 0 -13z" fill="#8fd0f5"/>`;
    case 'orgulloso': return sparkle(46, 72, 7, '#f5d76e') + sparkle(156, 70, 6, '#f5d76e') + sparkle(160, 104, 4, '#f5d76e');
    case 'estirandose': return `<path d="M40 70 q-6 -6 -2 -14 M160 70 q6 -6 2 -14" stroke="#b9aec9" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    default: return '';
  }
}

/**
 * Devuelve el SVG del perezoso.
 * view: 'full' (colgado de la rama), 'vine' (bajando por la liana) o 'head' (solo la cabeza)
 */
function slothSVG({ view = 'full', mood, sloth } = {}) {
  const sl = sloth || Store.data.sloth;
  const m = mood || Sloth.mood();
  const c = slothColors(sl.fur || '#a88a6d');
  const eq = sl.equipped || {};
  const item = (cat) => { const it = eq[cat] && wardrobeItem(eq[cat]); return it ? it : null; };
  const layer = (cat, filterBack) => { const it = item(cat); if (!it || (filterBack !== undefined && !!it.back !== filterBack)) return ''; return it.svg(c); };
  const sage = m === 'feliz' && sl.personality === 'dramatico';

  const vine = view === 'vine';
  const L = vine ? [94, 24] : [68, 22];
  const R = vine ? [106, 24] : [132, 22];
  const claws = ([x, y]) => `M${x - 6} ${y - 8} l1 9 M${x} ${y - 10} l0 10 M${x + 6} ${y - 8} l-1 9`;

  const perch = vine
    ? `<path d="M100 -70 C 94 -40 106 -12 100 28" stroke="${MOSS}" stroke-width="6" fill="none" stroke-linecap="round"/>
       <ellipse cx="92" cy="-30" rx="9" ry="4" fill="${MOSS}" transform="rotate(-30 92 -30)"/><ellipse cx="108" cy="-4" rx="9" ry="4" fill="${MOSS}" transform="rotate(25 108 -4)"/>`
    : `<path d="M-20 24 Q100 6 220 26" stroke="#7a5a3c" stroke-width="12" fill="none" stroke-linecap="round"/>
       <path d="M160 18 q10 -12 24 -10" stroke="#7a5a3c" stroke-width="5" fill="none" stroke-linecap="round"/>
       <ellipse cx="22" cy="12" rx="11" ry="5" fill="${MOSS}" transform="rotate(-25 22 12)"/>
       <ellipse cx="186" cy="4" rx="10" ry="4.6" fill="${MOSS}" transform="rotate(20 186 4)"/>
       <ellipse cx="174" cy="30" rx="9" ry="4" fill="${MOSS}" opacity=".85" transform="rotate(-30 174 30)"/>`;

  const head = `
    <path d="M56 78 Q58 52 76 54 Q82 40 96 48 Q106 38 118 48 Q134 44 138 60 Q148 66 144 80 Z" fill="${c.fur}"/>
    <ellipse cx="100" cy="92" rx="48" ry="43" fill="${c.fur}"/>
    <ellipse cx="100" cy="100" rx="36" ry="30" fill="${c.mask}"/>
    <ellipse cx="84" cy="95" rx="13.5" ry="8" fill="${c.patch}" transform="rotate(-22 84 95)"/>
    <ellipse cx="116" cy="95" rx="13.5" ry="8" fill="${c.patch}" transform="rotate(22 116 95)"/>
    ${slothEyes(m, c, sage)}
    <ellipse cx="100" cy="107" rx="7" ry="5" fill="${c.dark}"/>
    ${slothMouth(m, c)}
    <circle cx="70" cy="109" r="5.5" fill="#f3a3b5" opacity="${m === 'orgulloso' ? 0.85 : 0.55}"/>
    <circle cx="130" cy="109" r="5.5" fill="#f3a3b5" opacity="${m === 'orgulloso' ? 0.85 : 0.55}"/>`;

  const headLayers = `${head}${layer('cara')}${layer('cuello')}${layer('ojos')}${layer('cabeza')}`;

  if (view === 'head') {
    return `<svg viewBox="36 18 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="sloth-svg mood-${m}">${headLayers}${slothMoodExtras(m)}</svg>`;
  }

  const body = `
    ${layer('extra', true)}
    <path d="M74 128 Q${vine ? 58 : 56} ${vine ? 80 : 76} ${L[0]} ${L[1]}" stroke="${c.fur}" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="M126 128 Q${vine ? 142 : 144} ${vine ? 80 : 76} ${R[0]} ${R[1]}" stroke="${c.fur}" stroke-width="20" fill="none" stroke-linecap="round"/>
    <path d="${claws(L)} ${claws(R)}" stroke="${c.dark}" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="100" cy="164" rx="50" ry="58" fill="${c.fur}"/>
    <ellipse cx="100" cy="176" rx="31" ry="40" fill="${c.belly}"/>
    <ellipse cx="72" cy="218" rx="17" ry="12" fill="${c.fur}"/>
    <ellipse cx="128" cy="218" rx="17" ry="12" fill="${c.fur}"/>
    <path d="M62 226 l-2 6 M70 228 l-1 6 M78 227 l0 6 M122 227 l0 6 M130 228 l1 6 M138 226 l2 6" stroke="${c.dark}" stroke-width="2.2" stroke-linecap="round"/>
    ${layer('cuerpo')}
    ${layer('abrazando')}`;

  const vb = vine ? '-12 -70 224 320' : '-12 -6 224 256';
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="sloth-svg mood-${m}">
    ${perch}${body}${headLayers}${layer('extra', false)}${slothMoodExtras(m)}</svg>`;
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
      const view = el.dataset.sloth === 'hang' ? 'full' : el.dataset.sloth;
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

  show(msg, { mood = null, ms = 8000 } = {}) {
    if (this.data().frequency === 'nunca' && !msg) return;
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

  // Habla desde la barra lateral
  speak(msg) {
    const b = $('#dock-bubble');
    if (!b || !b.offsetParent) { this.show(msg || this.contextPhrase()); return; }
    b.textContent = msg || this.contextPhrase();
    b.classList.add('show');
    clearTimeout(this.speakTimer);
    this.speakTimer = setTimeout(() => b.classList.remove('show'), 7000);
  },

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
    toast(`🎁 Desbloqueaste: ${names.join(', ')}`);
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
