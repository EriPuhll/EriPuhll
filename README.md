# 🦥 Perezoso · organizador semestral

*Despacito, pero al día.*

Una app web para organizar el semestre de facultad: calendario de pruebas, horario de clases, materias con documentos y créditos, registro de horas de estudio y pomodoro. Todo con un perezoso que aparece de vez en cuando para darte ánimo.

## Cómo usarla

**La forma más fácil:** descargá **`Perezoso.html`** y abrilo con doble clic. Es la app entera en un solo archivo, funciona sin internet y sin instalar nada.

También podés abrir `index.html`, pero solo si está junto a las carpetas `css`, `js` e `img` (si lo abrís desde adentro del ZIP sin descomprimir, se ve sin estilos).

Si preferís servirla localmente:

```bash
python3 -m http.server 8000
# y abrí http://localhost:8000
```

### Tus datos
- Todo se guarda **solo, en el navegador**, aunque cierres la app o apagues la compu.
- **Guardado automático en un archivo** (Chrome, Edge u Opera de computadora): en **Ajustes → 💾 Guardado automático** elegí dónde guardar `perezoso-datos.json` y cada cambio se escribe ahí. Si lo ponés en tu carpeta de **Google Drive** u OneDrive, queda también en la nube. En otra compu, usá **“Abrir un archivo que ya tengo”**.
- **Instalar en el escritorio**: abrila desde su página web (GitHub Pages) y en **Ajustes → 📲 Tenerla en el escritorio** tocá **Instalar**. Se abre como un programa y funciona sin internet.

## Qué tiene

### 📅 Calendario
Un botón para cambiar entre:
- **Horario de facultad**: la semana tipo con tus clases (teórico, práctico, laboratorio…), el salón, una línea roja con la hora actual y la lista de clases de hoy.
- **Calendario de pruebas**: vista mensual con controles, entregas de laboratorio, entregables, parciales, exámenes, prácticos, charlas y **Otro** (escribís lo que quieras).
  - Debajo, la lista **“Lo que se viene”** con tipo, materia y **cuántos días y horas faltan** (se actualiza sola y cambia de color cuando se acerca).
  - **⬇ Descargar PDF**: genera el mes en una grilla + la lista de eventos con su cuenta regresiva.

### 📚 Materias
- Nombre, semestre, año, profesor/a y sus mails (con botón para copiar o escribir).
- **Créditos**: 1 crédito = 10 horas de esfuerzo. Muestra el total de horas y un **contador de cuántas quedan**.
- **Documentos por secciones** que vos nombrás (vienen “Prácticos”, “Teóricos” y “Parciales y exámenes anteriores”, y podés crear, renombrar o borrar). Subí archivos o arrastralos.
- **🎨 Personalizar**: color propio y **fondo de página estilo Tumblr** (imagen propia, link o patrones: puntitos, cuadrillé, estrellitas, hojitas, corazones; en mosaico, cubriendo todo o centrado).

### ⏱️ Horas de estudio
Elegís la materia, **Comenzar** y al terminar **Terminar**: ese tiempo se descuenta de las horas que le faltan a la materia. Hay un registro por fecha con cuánto dedicaste, totales de hoy, de la semana y en total, y se puede cargar horas a mano.

### 🍅 Pomodoro
Foco, descanso corto y descanso largo configurables, con sonido y notificación al terminar. Opcionalmente cada pomodoro completo **suma horas de estudio** a una materia.

### 🦥 El perezoso
Es el logo y aparece colgado de una rama cada tanto, con frases de ánimo o recordatorios de lo que se viene en las próximas 48 h. Se puede apagar en Ajustes.

## Colores
- Principal: `#a075ea`
- Fondo: blanco hueso `#f7f3ea`

## Estructura

```
index.html
css/styles.css
img/perezoso.svg          ícono
js/util.js                utilidades, fechas, modal
js/store.js               datos (localStorage) y archivos (IndexedDB)
js/sloth.js               el perezoso 🦥
js/theme.js               colores y fondos
js/calendar.js            horario + calendario de pruebas + PDF
js/subjects.js            materias y documentos
js/study.js               horas de estudio
js/pomodoro.js            pomodoro
js/settings.js            ajustes, respaldo y datos de ejemplo
js/autosave.js            guardado automático en archivo + instalar como app
js/app.js                 navegación y reloj
manifest.webmanifest, sw.js  para instalarla y usarla sin internet
js/vendor/jspdf.umd.min.js  generador de PDF (jsPDF, licencia MIT)
Perezoso.html             versión en un solo archivo (se genera)
tools/build-standalone.py genera Perezoso.html
```

Después de cambiar el código, regenerá la versión de un solo archivo con `python3 tools/build-standalone.py`.

¿Querés probarla rápido? En **Materias** o **Ajustes** tocá **“Datos de ejemplo”**.
