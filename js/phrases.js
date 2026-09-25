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
      '¡{nombre}! Te estaba esperando con la rama calentita.',
      'Llegó mi estudiante favorita. Bueno, la única, pero igual.',
      'Hola, hola. Hoy tengo el pelo lindo y vos venís al día. Día perfecto.',
      '¡Qué alegría verte! Traje hojitas para festejar.',
    ],
    normal: [
      'Hola, {nombre}. ¿Hacemos un ratito de estudio hoy?',
      '¡Qué lindo verte! Te guardé un lugarcito en la rama.',
      'Hola, hola. Un poquito hoy y mañana otro poquito.',
      'Buenas, {nombre}. ¿Mate y un pomodoro?',
      'Hola. Yo recién me despierto… de la siesta de la siesta.',
      '¡Holi! ¿Arrancamos por lo más fácil o por lo más urgente?',
      'Hola, {nombre}. Hoy vamos a nuestro ritmo, que es lento pero seguro.',
    ],
    enojado: [
      'Ah, hola. Pensé que te habías olvidado de mí… y de estudiar.',
      'Hola, {nombre}. Los apuntes también te extrañan, eh.',
      'Mirá quién apareció. Yo acá, esperando. Colgado. Solito.',
      'Uy, una visita. Pensé que era el viento.',
      'Hola. No, no estoy enojado. Estoy… perezosamente decepcionado.',
      'Qué sorpresa. Justo estaba contando las horas que no estudiamos. Me cansé de contar.',
      'Hola, {nombre}. Te hice un lugar en la rama hace días. Se enfrió.',
    ],
  },
  aleatoria: {
    contento: [
      'Sos una genia, ¿te lo dije hoy?',
      'Me encanta cuando estudiamos juntas.',
      'Vas tan bien que me dan ganas de hacer una siesta de festejo.',
      'Mirá todo lo que avanzaste. Yo tardaría un año.',
      'Estoy tan orgulloso que me puse a moverme rápido. Bueno, casi.',
      'Si seguís así, me voy a tener que comprar ropa nueva para festejar.',
      'Tu yo del futuro te manda un abrazo gigante.',
      'Esta semana sos mi ídola. Lo digo en serio, lentamente pero en serio.',
      'Guardé esta hojita para vos. Te la ganaste.',
      'Qué bien que venís. Hasta la rama está contenta.',
      'Estudiar con vos es mi parte favorita del día. Después de dormir.',
    ],
    normal: [
      '¿Tomaste agua? Yo te cuido.',
      'Un pomodoro y después un mimo.',
      'Despacito también se llega.',
      'Si te cansás, descansá un ratito. Yo soy experto en eso.',
      'Enderezá la espalda, que yo ya tengo la mía curva por las dos.',
      'Un tema a la vez. Así hago todo yo, y mirá qué bien me va.',
      '¿Y si hacemos solo 25 minutos? Solo 25. Después vemos.',
      'Los ejercicios difíciles también se cansan si los mirás fijo.',
      'Acordate de comer algo rico. El cerebro funciona con galletitas.',
      'Hoy no hace falta ser perfecta, alcanza con hacer un poquito.',
      'Estoy acá colgado por si me necesitás.',
      'Respirá hondo. Yo lo hago cada tres minutos y vivo tranquilo.',
    ],
    enojado: [
      'No te digo nada… pero esta semana estudiaste casi nada.',
      'Yo soy el perezoso, ¿no? Porque últimamente no parece.',
      'Está bien, no estudies. Yo me quedo acá mirando el calendario. Tranqui.',
      'Qué lindo día para abrir un práctico… digo, nada, nada.',
      'Las horas no se estudian solas. Lo averigüé.',
      'Te guardé el cronómetro en cero. Sigue en cero. Qué raro.',
      'Mis horas de siesta esta semana: muchas. Las tuyas de estudio: bueno.',
      'No es por nada, pero la materia te mandó saludos. Preocupada.',
      'Estoy practicando mi cara de "no pasa nada". ¿Se nota?',
      'Me dijeron que los apuntes se leen abriéndolos. Rumores.',
      'Si estudiar fuera dormir, estaríamos re bien. Pero no.',
      'Tranqui, yo espero. Soy perezoso, esperar es lo mío. Pero igual.',
    ],
  },
  prueba: {
    contento: [
      '{materia} en {dias} días. Con lo que venís estudiando, va a salir hermoso.',
      'Faltan {dias} días para {materia} y vos estás preparadísima.',
      '{materia} en {dias} días. Yo ya estoy practicando el festejo.',
    ],
    normal: [
      'Faltan {dias} días para {materia}. Vamos de a poquito, juntas.',
      '{materia} en {dias} días. ¿Arrancamos con un pomodoro?',
      '{dias} días para {materia}. Si repasamos un ratito por día, llegamos bárbaro.',
    ],
    enojado: [
      '{materia} es en {dias} días. Solo digo. Nada más. Solo eso.',
      'Faltan {dias} días para {materia} y el práctico sigue cerradito… qué raro.',
      '{dias} días para {materia}. Yo no me pongo nervioso. Vos quizás deberías.',
    ],
  },
  manana: {
    contento: ['Mañana es {materia}. Ya hiciste todo: ahora a dormir temprano.', 'Mañana brillás en {materia}. Te mando un abrazo lento.', 'Mañana {materia}. Estás lista, yo lo sé.'],
    normal: ['Mañana es {materia}. Repaso suave y a descansar, que vos podés.', 'Mañana es {materia}. Respirá hondo, vamos bien.', 'Mañana {materia}. Un repasito liviano y a la cama.'],
    enojado: ['Mañana es {materia}. Ah, ¿no te acordabas? Yo sí.', 'Mañana {materia}. Hoy sería un buen día para repasar… digo, ¿no?', 'Mañana {materia}. Yo que vos no miraba series hoy. Pero bueno, yo no soy vos.'],
  },
  atrasada: {
    contento: ['{materia} quedó un poquito atrás. Le damos un ratito y listo.', 'Vas bárbaro, solo {materia} pide un poquito de amor.'],
    normal: ['{materia} te extraña un poquito. ¿Le damos un ratito hoy?', '¿Y si hoy le dedicamos un pomodoro a {materia}?'],
    enojado: ['{materia} está atrasada. No es que me importe… bueno, sí me importa.', '¿Te acordás de {materia}? Ella sí se acuerda de vos.', '{materia} me preguntó por vos. Le dije que estabas ocupada. Mentí.'],
  },
  sesion: ['¡{tiempo}! Qué orgullo me das.', 'Registré {tiempo}. Te merecés un abrazo lento.', '¡Bien ahí! {tiempo} más cerca de la meta.', '{tiempo} de estudio. Yo en ese tiempo pestañeé dos veces.', 'Anotado: {tiempo}. Sos una máquina (una tierna).', '¡{tiempo}! Me pongo una hojita de medalla en tu honor.'],
  pomodoro: ['¡Terminaste un pomodoro! Estirate conmigo.', 'Bloque terminado. Descansá un ratito, te lo ganaste.', '¡Pomodoro listo! Agua, estirar, y mirar por la ventana.', 'Uno más. Así se construyen las cosas lindas: de a pedacitos.'],
  descanso: ['Se terminó el descanso. ¿Vamos por otro?', '¡Arriba! Un bloque más y te dejo tranquila.', 'Fin del recreo. Yo me quedo durmiendo, vos dale.', 'Volvemos. Despacito, pero volvemos.'],
  desbloqueo: ['¡Me regalaste {accesorio}! Gracias por estudiar tanto.', '¡{accesorio}! ¿Cómo me queda? Decime que bien.', '¡Ropa nueva! {accesorio}. Me siento el más lindo de la selva.', 'Mirá: {accesorio}. Todo gracias a tus horas de estudio.'],
  racha: ['¡{dias} días seguidos! Estoy re orgulloso.', '{dias} días de racha. No la cortes, ¿sí?', '¡{dias} días al hilo! Eso es más constancia que la mía para dormir.'],
  noche: ['Zzz… ¿qué hacés despierta? Mañana seguimos.', 'Ya es tarde. Hasta los perezosos duermen… bueno, sobre todo los perezosos.', 'Zzz… soñé que aprobabas todo. Ahora andá a dormir vos.', 'Es de noche. Cerrá la compu, que el cerebro también guarda lo que estudiaste mientras dormís.'],
  prioritario: ['¡Un ejercicio amarillo menos! Qué genia.', '¡Resolviste un prioritario! Aplausos lentos.', '¡Prioritario resuelto! Esa sí que costaba.'],
};

function phrase(context, vars = {}, tone) {
  const t = tone || (typeof Sloth !== 'undefined' ? Sloth.tone() : 'normal');
  const entry = PHRASES[context] || PHRASES.aleatoria;
  const bank = Array.isArray(entry) ? entry : (entry[t] || entry.normal);
  const all = { nombre: Store.data.settings.userName || 'vos', ...vars };
  const txt = bank[Math.floor(Math.random() * bank.length)];
  return txt.replace(/\{(\w+)\}/g, (m, k) => (all[k] !== undefined ? all[k] : m));
}
