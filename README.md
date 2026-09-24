# 🦥 Perezoso · organizador semestral

*Despacito, pero al día.*

Una app web para organizar el semestre de facultad: calendario de pruebas, horario de clases, materias con documentos y créditos, registro de horas de estudio y pomodoro. Todo con un perezoso que aparece de vez en cuando para darte ánimo.

## Cómo usarla

No hace falta instalar nada: abrí `index.html` en el navegador (Chrome, Firefox, Edge o Safari).

Si preferís servirla localmente:

```bash
python3 -m http.server 8000
# y abrí http://localhost:8000
```

> Los datos se guardan **en tu navegador** (localStorage + IndexedDB para los archivos). Desde **Ajustes → Respaldo** podés descargar un respaldo y cargarlo en otra compu.

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
js/app.js                 navegación y reloj
js/vendor/jspdf.umd.min.js  generador de PDF (jsPDF, licencia MIT)
```

¿Querés probarla rápido? En **Materias** o **Ajustes** tocá **“Datos de ejemplo”**.
