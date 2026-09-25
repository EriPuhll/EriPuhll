'use strict';

/* ---------- Frases del perezoso ----------
 * Tiernas, en voseo y dirigidas a la usuaria en femenino. El tono depende de
 * cómo viene la semana de estudio:
 *   contento → vas bien o muy bien
 *   normal   → sin novedad
 *   enojado  → pocas horas: pasivo-agresivo, pero con cariño
 * Variables: {nombre}, {materia}, {dias}, {tiempo}, {accesorio}.
 */

const PHRASES = {
  saludo: {
    contento: [
      '¡Hola, {nombre}! Esta semana venís re bien, estoy orgulloso.',
      '¡Volviste! Con vos da gusto estudiar.',
      'Hola, genia. Así, despacito y sin parar.',
    ],
    normal: [
      'Hola, {nombre}. ¿Hacemos un ratito de estudio hoy?',
      '¡Qué lindo verte! Te guardé un lugarcito en la rama.',
      'Hola, hola. Un poquito hoy y mañana otro poquito.',
    ],
    enojado: [
      'Ah, hola. Pensé que te habías olvidado de mí… y de estudiar.',
      'Hola, {nombre}. Los apuntes también te extrañan, eh.',
      'Mirá quién apareció. Yo acá, esperando. Colgado. Solito.',
    ],
  },
  aleatoria: {
    contento: [
      'Sos una genia, ¿te lo dije hoy?',
      'Me encanta cuando estudiamos juntas.',
      'Vas tan bien que me dan ganas de hacer una siesta de festejo.',
      'Mirá todo lo que avanzaste. Yo tardaría un año.',
    ],
    normal: [
      '¿Tomaste agua? Yo te cuido.',
      'Un pomodoro y después un mimo.',
      'Despacito también se llega.',
      'Si te cansás, descansá un ratito. Yo soy experto en eso.',
    ],
    enojado: [
      'No te digo nada… pero esta semana estudiaste casi nada.',
      'Yo soy el perezoso, ¿no? Porque últimamente no parece.',
      'Está bien, no estudies. Yo me quedo acá mirando el calendario. Tranqui.',
      'Qué lindo día para abrir un práctico… digo, nada, nada.',
      'Las horas no se estudian solas. Lo averigüé.',
    ],
  },
  prueba: {
    contento: [
      '{materia} en {dias} días. Con lo que venís estudiando, va a salir hermoso.',
      'Faltan {dias} días para {materia} y vos estás preparadísima.',
    ],
    normal: [
      'Faltan {dias} días para {materia}. Vamos de a poquito, juntas.',
      '{materia} en {dias} días. ¿Arrancamos con un pomodoro?',
    ],
    enojado: [
      '{materia} es en {dias} días. Solo digo. Nada más. Solo eso.',
      'Faltan {dias} días para {materia} y el práctico sigue cerradito… qué raro.',
    ],
  },
  manana: {
    contento: ['Mañana es {materia}. Ya hiciste todo: ahora a dormir temprano.', 'Mañana brillás en {materia}. Te mando un abrazo lento.'],
    normal: ['Mañana es {materia}. Repaso suave y a descansar, que vos podés.', 'Mañana es {materia}. Respirá hondo, vamos bien.'],
    enojado: ['Mañana es {materia}. Ah, ¿no te acordabas? Yo sí.', 'Mañana {materia}. Hoy sería un buen día para repasar… digo, ¿no?'],
  },
  atrasada: {
    contento: ['{materia} quedó un poquito atrás. Le damos un ratito y listo.'],
    normal: ['{materia} te extraña un poquito. ¿Le damos un ratito hoy?'],
    enojado: ['{materia} está atrasada. No es que me importe… bueno, sí me importa.', '¿Te acordás de {materia}? Ella sí se acuerda de vos.'],
  },
  sesion: ['¡{tiempo}! Qué orgullo me das.', 'Registré {tiempo}. Te merecés un abrazo lento.', '¡Bien ahí! {tiempo} más cerca de la meta.'],
  pomodoro: ['¡Terminaste un pomodoro! Estirate conmigo.', 'Bloque terminado. Descansá un ratito, te lo ganaste.'],
  descanso: ['Se terminó el descanso. ¿Vamos por otro?', '¡Arriba! Un bloque más y te dejo tranquila.'],
  desbloqueo: ['¡Me regalaste {accesorio}! Gracias por estudiar tanto.', '¡{accesorio}! ¿Cómo me queda? Decime que bien.'],
  racha: ['¡{dias} días seguidos! Estoy re orgulloso.', '{dias} días de racha. No la cortes, ¿sí?'],
  noche: ['Zzz… ¿qué hacés despierta? Mañana seguimos.', 'Ya es tarde. Hasta los perezosos duermen… bueno, sobre todo los perezosos.'],
  prioritario: ['¡Un ejercicio amarillo menos! Qué genia.', '¡Resolviste un prioritario! Aplausos lentos.'],
};

function phrase(context, vars = {}, tone) {
  const t = tone || (typeof Sloth !== 'undefined' ? Sloth.tone() : 'normal');
  const entry = PHRASES[context] || PHRASES.aleatoria;
  const bank = Array.isArray(entry) ? entry : (entry[t] || entry.normal);
  const all = { nombre: Store.data.settings.userName || 'vos', ...vars };
  const txt = bank[Math.floor(Math.random() * bank.length)];
  return txt.replace(/\{(\w+)\}/g, (m, k) => (all[k] !== undefined ? all[k] : m));
}
