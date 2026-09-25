# 🦥 Perezoso · organizador semestral

*Despacito, pero al día.*

App web personal para organizar el semestre de facultad, con un perezoso que te acompaña, se viste con lo que vas desbloqueando al estudiar y te habla según cómo viene tu semana de estudio.

## Cómo abrirla

- **La más fácil:** descargá **`Perezoso.html`** y abrilo con doble clic. Es la app entera en un solo archivo y funciona sin internet.
- **Con link (y para instalarla en el escritorio o el celular):** activá GitHub Pages (Settings → Pages → rama de esta app, carpeta `/ (root)`) y entrá a `https://eripuhll.github.io/EriPuhll/`.
- `index.html` también sirve, pero solo si está junto a las carpetas `css`, `js` e `img`.

## Tus datos

- Todo se guarda **solo** en el navegador (localStorage + IndexedDB para archivos), aunque cierres la app.
- **Guardado automático en un archivo** (Chrome, Edge u Opera de computadora): Ajustes → 💾. Si el archivo está en tu carpeta de Google Drive, queda también en la nube.
- **Respaldo completo** (datos + documentos + imágenes) para pasar a otra compu: Ajustes → 📦.
- En el primer uso se precargan las materias, exámenes y proyectos del 2º semestre 2026 (se pueden editar o borrar).

## Secciones

| Sección | Qué tiene |
|---|---|
| 🏡 **Inicio** | Saludo del perezoso, alertas (pruebas cerca, materias atrasadas, semanas críticas, faltas, apuntes), próximas 5 pruebas, clases de hoy y horas de la semana vs. el ritmo necesario. |
| 📅 **Calendario** | Botón entre **calendario de pruebas** (mes, lista con cuenta regresiva “12 d 4 h”, eventos a < 3 días destacados, semanas críticas, PDF y exportar `.ics` para Google Calendar) y **horario de facultad** (lunes a sábado, 7 a 23 h, huecos libres para estudiar, PDF). |
| 📚 **Materias** | Pestañas **Resumen** (profes con mails, bibliografía, créditos × horas, contador de horas restantes, meta de la semana (reparte las horas entre las semanas de cursado y suma lo que quedó pendiente), faltas, apuntes pendientes, regla de aprobación), **Documentos** (secciones propias con archivos o links, reordenables), **Tareas a realizar** (ejercicios pendiente → en proceso → resuelto, prioritarios en amarillo, filtro y progreso), **Notas** (nota acumulada sobre 12: cada evaluación con su porcentaje, grupos donde cuentan las mejores N, y cuánto necesitás en lo que falta) y **Apariencia** (color y fondo estilo Tumblr: color, patrón o imagen). |
| ⏱️ **Horas de estudio** | Cronómetro que sobrevive a cerrar la app, registro editable con origen, carga manual, últimos 14 días, semana por materia, total del semestre y racha. |
| 🍅 **Pomodoro** | Tiempos configurables; cada bloque terminado se suma a la materia. **Simulacro de parcial** con tiempo por ejercicio y comparación con simulacros anteriores. |
| 🤝 **Proyectos** | Integrantes, links, tareas con responsable y entregas que aparecen también en el calendario. Se pueden **compartir** (link, WhatsApp, mail o archivo) e importar. |
| 🦥 **Perezoso** | Nombre, color de pelo, **9 poses**, frecuencia, y un **ropero de 45 prendas** que se desbloquean con horas de estudio. Su humor depende de tus horas: si vas bien está contento y te dice cosas tiernas; si estudiás poco se enoja y se pone pasivo-agresivo. Aparece de vez en cuando en un lugar que va con la pose (colgado arriba, sentado abajo, en su rama desde un costado); también lo podés llamar con el botoncito de abajo a la derecha. |
| ⚙️ **Ajustes** | Nombre, horas por crédito, fechas del semestre, recordatorios, **apariencia completa** (6 colores, tipografía, bordes, modo oscuro, fondo, temas listos y el símbolo de las listas), guardado automático, instalar, respaldo. |

### El ropero del perezoso
Prendas originales en estilos **clásico, princesa, muñeca fashion, monstruito chic, dino, héroe alien, Gen Z y maestro**: vestidos de princesa (rosa, de hielo, dorado), tiara, corona, alas de hada, look fashionista rosa, vestido gótico con costuras, pijama y capucha de dino, reloj alien, bucket hat, gafas Y2K, vaso térmico XL, matcha, y más. Se desbloquean entre 0 y 50 horas de estudio en el semestre.

Su cara cambia según cómo vas: **feliz**, **dormido** (3+ días sin estudiar), **preocupado** (prueba cerca y materia atrasada), **orgulloso** (después de estudiar o si cumplís el ritmo) y **estirándose** (en los descansos del pomodoro).

## Para desarrollar

Sin dependencias ni compilación: HTML + CSS + JavaScript. La capa de datos está en `js/store.js` para poder migrar a un backend más adelante.

```
index.html               estructura (menú arriba / navegación inferior en celular)
css/styles.css           estilos (todo con variables de color)
js/util.js               utilidades, fechas, modal
js/store.js              datos, migraciones, datos iniciales y consultas
js/phrases.js            frases del perezoso según contexto y humor (contento / normal / enojado)
js/sloth.js              dibujo por capas, ropero, ánimo y apariciones
js/theme.js              temas, patrones y fondos
js/home.js               Inicio
js/calendar.js           calendario de pruebas, horario, PDF e .ics
js/subjects.js           materias y sus pestañas
js/study.js              horas de estudio
js/pomodoro.js           pomodoro y simulacro
js/projects.js           proyectos grupales
js/slothpage.js          sección Perezoso
js/settings.js           ajustes y respaldo
js/autosave.js           guardado automático en archivo + instalar como app
js/app.js                navegación y reloj
manifest.webmanifest, sw.js   instalar y usar sin internet
js/vendor/jspdf.umd.min.js    generador de PDF (jsPDF, licencia MIT)
tools/build-standalone.py     genera Perezoso.html
```

Después de cambiar el código: `python3 tools/build-standalone.py` y subí el número de `CACHE` en `sw.js`.
