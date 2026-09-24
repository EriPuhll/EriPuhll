'use strict';

/* ---------- Frases del perezoso ----------
 * Por personalidad y contexto. Variables: {nombre}, {materia}, {dias}, {tiempo}, {accesorio}.
 * Voseo y dirigidas a la usuaria en femenino.
 */

const PERSONALITIES = [
  { id: 'dramatico', label: 'Maestro dramático', icon: '🥋', desc: 'Solemne, épico y teatral. Cada parcial es una batalla legendaria.' },
  { id: 'tierno', label: 'Tierno', icon: '🥰', desc: 'Cariñoso, celebra todo.' },
  { id: 'entrenador', label: 'Entrenador', icon: '📣', desc: 'Enérgico, habla de metas y rachas.' },
  { id: 'sarcastico', label: 'Sarcástico', icon: '😏', desc: 'Humor seco, pero en el fondo te banca.' },
  { id: 'zen', label: 'Zen', icon: '🧘', desc: 'Calma, respiración, un paso a la vez.' },
  { id: 'profe', label: 'Profe exigente', icon: '🧑‍🏫', desc: 'Directo, te recuerda lo que falta.' },
];

const PHRASES = {
  dramatico: {
    saludo: [
      'Has regresado, {nombre}. La rama sabía que vendrías.',
      'Ah... la discípula despierta. El sendero de hoy te espera.',
      'El amanecer trae un nuevo pergamino, {nombre}. Desenróllalo... con calma.',
    ],
    aleatoria: [
      'El perezoso no es lento, {nombre}. El perezoso es... paciente. (Y también un poco lento.)',
      'Una hoja no cae de golpe. Cae de a poco. Así se aprende también.',
      'El bambú no crece en un día, guerrera. Pero tampoco se queda mirando el celular.',
      'La sabiduría ancestral dice... que tomes agua. Sí. Eso dice.',
    ],
    prueba: [
      'Faltan {dias} días para {materia}... El gong de la batalla ya se oye a lo lejos.',
      '{materia} se acerca, guerrera. {dias} amaneceres. Afila tu lápiz... y tu mente.',
      'Tres amaneceres, cuatro, los que sean... {dias}, exactamente, separan tu destino de la gran batalla de {materia}.',
    ],
    manana: [
      'Mañana... mañana es el día. Duerme, guerrera. Hasta los grandes maestros necesitan su siesta.',
      'No hay secretos, {nombre}. Solo horas de práctica. Y vos... ya las hiciste.',
      'La batalla de {materia} es mañana. Repasá lo marcado en amarillo... y después, a la rama. A dormir.',
    ],
    atrasada: [
      'El pergamino de {materia} llora en silencio. Hace tiempo que no lo abrís.',
      'Una gran guerrera no huye de {materia}. La mira a los ojos... y abre el práctico.',
      '{materia} se aleja en el horizonte... ¡Alcanzala, discípula! Despacito, pero alcanzala.',
    ],
    sesion: [
      '{tiempo} de entrenamiento. Siento cómo tu poder crece. O quizás es hambre. Sigamos.',
      'Hoy diste un paso más en el sendero. Pequeño, sí. Pero los pasos pequeños también llegan.',
      '{tiempo}... El viento lo anotará en el libro de las leyendas. Yo también, por las dudas.',
    ],
    pomodoro: [
      'El bloque ha terminado. Descansa, discípula. Incluso el bambú se detiene a mirar el cielo.',
      '¡Gong! Un bloque más para la leyenda. Estirá las garras... digo, los brazos.',
      'Resististe el bloque entero. Los antiguos maestros estarían orgullosos. Yo me dormí dos veces, pero estoy orgulloso.',
    ],
    descanso: [
      'El descanso termina... El gong vuelve a sonar. ¡A la batalla!',
      'Suficiente contemplación del cielo, guerrera. El pergamino te llama.',
      'La hoja descansó sobre el agua. Ahora... sigue su camino.',
    ],
    dormido: [
      'Zzz... la maestría... zzz... ¿eh? ¡Yo no estaba dormido! Estaba... meditando. Vos tampoco estudiaste, así que estamos a mano.',
      'Hace {dias} días que el sendero está vacío... Hasta las hojas preguntan por vos, {nombre}.',
      'Los grandes maestros descansan. Pero no tanto, discípula. No tanto.',
    ],
    racha: [
      '{dias} días seguidos. Las leyendas se escriben así: un día a la vez, sin soltar la rama.',
      '{dias} amaneceres de entrenamiento sin pausa. El bambú te envidia.',
      'Racha de {dias} días... Si seguís así, voy a tener que buscarme una discípula menos talentosa para sentirme útil.',
    ],
    desbloqueo: [
      'Has ganado... ¡{accesorio}! Solo los más dedicados lo portan. Me queda precioso, ¿no?',
      'El cofre ancestral se abre... ¡{accesorio}! Tu esfuerzo tiene recompensa, guerrera.',
      '¡{accesorio}! Lo usaré con honor. Y con estilo. Sobre todo con estilo.',
    ],
    prioritario: [
      '¡Un pergamino dorado ha caído! Quedan menos entre vos y la victoria.',
      'Un ejercicio amarillo vencido. El sol brilla un poco más hoy.',
      'Otro prioritario... derrotado. La leyenda crece, {nombre}.',
    ],
  },

  tierno: {
    saludo: ['¡Hola, {nombre}! Qué lindo verte por acá. 💜', '¡Volviste! Te estaba esperando colgadito.', 'Buen día, {nombre}. Hoy va a salir todo bien, ya vas a ver.'],
    aleatoria: ['¿Tomaste agua? Yo te cuido. 💧', 'Estoy orgulloso de vos, aunque sea un día tranqui.', 'Si te cansás, descansá. Yo soy experto en eso.'],
    prueba: ['Faltan {dias} días para {materia}. Vos podés, y yo te acompaño.', '{materia} en {dias} días. Vamos de a poquito, juntas.', 'Se viene {materia} en {dias} días. ¡Ya estás más preparada de lo que creés!'],
    manana: ['Mañana es {materia}. Dormí bien, que ya hiciste todo lo que podías. 💜', '¡Mañana brillás en {materia}! Te mando un abrazo lento.'],
    atrasada: ['{materia} te extraña un poquito. ¿Le damos un ratito hoy?', 'No pasa nada si {materia} quedó atrás. Arrancamos con 20 minutos y listo.'],
    sesion: ['¡{tiempo}! Sos una genia. 🌿', 'Qué lindo verte estudiar. {tiempo} que suman un montón.', '¡Bien ahí! {tiempo} más cerca de tus metas.'],
    pomodoro: ['¡Terminaste un pomodoro! Te ganaste un mimo.', '¡Bravo! Ahora descansá un poquito, te lo merecés.'],
    descanso: ['¿Lista para otro ratito? Yo te acompaño.', 'Se terminó el descanso. ¡Vamos que vos podés!'],
    dormido: ['Te extrañé estos {dias} días. ¿Volvemos de a poquito?', 'Zzz... ¡ah, hola! Estaba soñando que estudiábamos juntas.'],
    racha: ['¡{dias} días seguidos! Estoy re orgulloso. 💜', '{dias} días de racha. ¡Sos increíble!'],
    desbloqueo: ['¡Mirá, me regalaste {accesorio}! Gracias por estudiar tanto. 💜', '¡{accesorio}! ¿Cómo me queda? Decime que bien.'],
    prioritario: ['¡Un ejercicio amarillo menos! Qué genia.', '¡Resolviste un prioritario! Aplausos lentos para vos.'],
  },

  entrenador: {
    saludo: ['¡Arriba, {nombre}! Hoy se entrena.', '¡Buenas, campeona! ¿Cuál es la meta de hoy?', '¡Volviste! Calentamos con un pomodoro y arrancamos.'],
    aleatoria: ['Constancia le gana a talento. ¡Dale!', 'Un pomodoro más y cerramos el día fuerte.', 'Metas chiquitas, todos los días. Así se gana el semestre.'],
    prueba: ['{dias} días para {materia}. Hoy dos pomodoros y cerramos un práctico.', '{materia} en {dias} días. Plan: prioritarios primero, después repaso.', 'Cuenta regresiva: {dias} días para {materia}. ¡A sumar horas!'],
    manana: ['Mañana es {materia}. Repaso liviano, cena rica y a dormir temprano. ¡Vas a romperla!', 'Último día antes de {materia}. Nada nuevo: repasá lo que ya sabés.'],
    atrasada: ['{materia} viene atrasada. Hoy le metemos 45 minutos sin excusas.', 'Ojo con {materia}: estás abajo del ritmo. ¡A recuperar terreno!'],
    sesion: ['¡{tiempo} al registro! Así se hace.', '{tiempo} sumados. ¡Otra así mañana!', '¡Sesión cerrada! {tiempo} más cerca de la meta.'],
    pomodoro: ['¡Pomodoro completado! Descanso activo: estirá y tomá agua.', '¡Uno menos! Respirá y preparate para el próximo.'],
    descanso: ['¡Fin del descanso! Volvemos al ruedo.', '¡Arriba! Otro bloque y sumás racha.'],
    dormido: ['{dias} días sin entrenar. Hoy volvemos, aunque sean 15 minutos.', 'El equipo te necesita. ¡Volvé a la cancha!'],
    racha: ['¡Racha de {dias} días! No la cortes hoy.', '{dias} días seguidos. ¡Eso es disciplina!'],
    desbloqueo: ['¡Desbloqueaste {accesorio}! Premio al esfuerzo.', '{accesorio} ganado en la cancha. ¡Seguimos!'],
    prioritario: ['¡Prioritario resuelto! Siguiente.', 'Uno amarillo menos. ¡Vamos por el próximo!'],
  },

  sarcastico: {
    saludo: ['Ah, sos vos. Pensé que era alguien con ganas de estudiar. Chiste. Bienvenida, {nombre}.', 'Mirá quién apareció. Los apuntes no se leen solos, eh.', 'Hola, {nombre}. Yo acá, colgado, como siempre. ¿Vos?'],
    aleatoria: ['Yo duermo 15 horas por día y aun así tengo más constancia que algunos.', 'Dato: mirar el temario no cuenta como estudiar.', 'Podés procrastinar, obvio. Yo soy el experto, y mirame.'],
    prueba: ['{materia} en {dias} días. Yo me muevo lento, pero vos no tenés esa excusa.', '{dias} días para {materia}. Buen momento para abrir el práctico, digo yo.', 'Faltan {dias} días para {materia}. Ah, ¿no sabías? Por eso estoy yo.'],
    manana: ['{materia} es mañana. Sorpresa para nadie. Dormí, que ya fue.', 'Mañana {materia}. Tranqui, que en el fondo estás más preparada de lo que te hacés.'],
    atrasada: ['{materia} sigue esperándote. Con paciencia. Como yo. Pero no tanta.', '¿Te acordás de {materia}? Ella sí se acuerda de vos.'],
    sesion: ['{tiempo}. Mirá vos, qué productiva. Estoy casi impresionado.', '{tiempo} estudiando. Ok, te banco. Un poquito.', 'Registré {tiempo}. No se lo cuento a nadie, pero estuvo bien.'],
    pomodoro: ['Pomodoro terminado. Sobreviviste. Andá a mirar el techo 5 minutos.', 'Mirá, terminaste uno. Descansá antes de que te acostumbres.'],
    descanso: ['Se terminó el descanso. Sí, ya. No me mires así.', 'Volvemos. El celular no se va a ningún lado, te lo prometo.'],
    dormido: ['{dias} días sin estudiar. Hasta yo me estoy preocupando, y eso que soy un perezoso.', 'Zzz... ah, perdón, me contagiaste.'],
    racha: ['{dias} días seguidos. ¿Quién sos y qué hiciste con {nombre}?', 'Racha de {dias} días. Ok, lo admito: estoy orgulloso.'],
    desbloqueo: ['{accesorio}. Me queda mejor que a vos. Gracias igual.', 'Desbloqueaste {accesorio}. Ya era hora, ¿no?'],
    prioritario: ['Un prioritario menos. Faltan los otros, pero bueno, celebremos.', 'Mirá vos, resolviste un amarillo. Anotado.'],
  },

  zen: {
    saludo: ['Hola, {nombre}. Respirá hondo. Empezamos cuando quieras.', 'Bienvenida. Hoy, un paso a la vez.', 'El día está abierto, {nombre}. Sin apuro.'],
    aleatoria: ['Inhalá... exhalá... ahora sí, un ejercicio.', 'No hace falta hacer todo. Solo lo siguiente.', 'La calma también es productiva.'],
    prueba: ['{materia} en {dias} días. Un ejercicio a la vez.', 'Faltan {dias} días para {materia}. Respirá, ordená, avanzá.', '{dias} días. Tiempo suficiente si vas con calma y constancia.'],
    manana: ['Mañana es {materia}. Hoy repaso suave y descanso profundo.', 'Lo que sabés ya está en vos. Dormí tranquila.'],
    atrasada: ['{materia} quedó un poco atrás. Sin culpa: un rato hoy alcanza para retomar.', 'Volvé a {materia} con curiosidad, no con apuro.'],
    sesion: ['{tiempo} de presencia. Bien hecho.', 'Terminaste. Notá cómo avanzaste: {tiempo}.', '{tiempo}. Un paso más en el camino.'],
    pomodoro: ['Bloque terminado. Soltá los hombros, mirá lejos.', 'Pausa. Estirá, respirá, volvé cuando estés lista.'],
    descanso: ['El descanso terminó. Volvemos con calma.', 'Retomamos. Solo el próximo paso.'],
    dormido: ['Pasaron {dias} días. Está bien. Hoy es buen día para volver.', 'Zzz... la pausa fue larga. Despertemos despacio.'],
    racha: ['{dias} días de práctica constante. Así crece el bambú.', '{dias} días seguidos. Constancia serena.'],
    desbloqueo: ['Recibiste {accesorio}. Disfrutalo con calma.', '{accesorio}: un pequeño regalo del camino.'],
    prioritario: ['Un prioritario resuelto. Uno menos, sin apuro.', 'Bien. El siguiente, cuando estés lista.'],
  },

  profe: {
    saludo: ['Buen día, {nombre}. Vamos a lo importante.', 'Llegaste. ¿Qué tenés pendiente hoy?', 'Hola. Revisemos qué falta.'],
    aleatoria: ['Los prácticos no se resuelven mirándolos.', 'Si no lo podés explicar, no lo entendiste. Repasá.', 'Primero los prioritarios. Después lo demás.'],
    prueba: ['{materia} en {dias} días. ¿Cuántos prioritarios te faltan?', 'Faltan {dias} días para {materia}. Revisá los exámenes anteriores.', '{dias} días para {materia}. Cronograma y a trabajar.'],
    manana: ['Mañana {materia}. Llevá cédula, calculadora y lápiz. Dormí.', 'Mañana rendís {materia}. Nada nuevo hoy: repaso y descanso.'],
    atrasada: ['{materia} está atrasada respecto al ritmo. Corregilo esta semana.', 'Estás debiendo horas de {materia}. Organizá un bloque hoy.'],
    sesion: ['{tiempo} registrados. Correcto. Continuá mañana.', 'Sesión de {tiempo}. Aceptable. Se puede más.', '{tiempo}. Bien. ¿Qué ejercicio sigue?'],
    pomodoro: ['Bloque terminado. Cinco minutos de descanso, no más.', 'Un pomodoro cumplido. Anotá en qué quedaste.'],
    descanso: ['Se terminó el descanso. A trabajar.', 'Volvemos. Retomá donde dejaste.'],
    dormido: ['{dias} días sin registrar estudio. Hoy retomás.', 'Hace {dias} días que no estudiás. El parcial no espera.'],
    racha: ['{dias} días de racha. Así se aprueba.', 'Racha de {dias} días. Mantenela.'],
    desbloqueo: ['Desbloqueaste {accesorio}. Merecido.', '{accesorio}. Premio por constancia. Seguí así.'],
    prioritario: ['Prioritario resuelto. Siguiente.', 'Bien. Quedan otros prioritarios.'],
  },
};

function phrase(context, vars = {}, personality) {
  const p = personality || Store.data.sloth.personality || 'dramatico';
  const bank = (PHRASES[p] && PHRASES[p][context]) || PHRASES.dramatico[context] || PHRASES.dramatico.aleatoria;
  const all = { nombre: Store.data.settings.userName || 'discípula', ...vars };
  const txt = bank[Math.floor(Math.random() * bank.length)];
  return txt.replace(/\{(\w+)\}/g, (m, k) => (all[k] !== undefined ? all[k] : m));
}
