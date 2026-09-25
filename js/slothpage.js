'use strict';

/* ---------- Sección Perezoso: personalizar, vestir y ver sus poses ---------- */

let wardrobeCat = 'todo';
let previewMood = null;
let previewPose = 1;

function renderSlothPage() {
  const sl = Store.data.sloth;
  const hours = Sloth.semesterHours();
  const next = WARDROBE.filter((w) => w.hours > hours).sort((a, b) => a.hours - b.hours)[0];
  const prevStep = WARDROBE.filter((w) => w.hours <= hours).reduce((m, w) => Math.max(m, w.hours), 0);
  const unlockedCount = WARDROBE.filter((w) => w.hours <= hours).length;
  const items = WARDROBE.filter((w) => wardrobeCat === 'todo' || w.cat === wardrobeCat).sort((a, b) => a.hours - b.hours);
  const mood = Sloth.mood();
  const ratio = Sloth.studyRatio();
  const w = weekSummary();
  const moodWhy = {
    orgulloso: 'Está contento: venís al día con las horas de esta semana.',
    enojado: Sloth.daysSinceStudy() >= 3 ? `Está enojado: hace ${Sloth.daysSinceStudy()} días que no registrás estudio.` : 'Está enojado: esta semana vas con menos de la mitad de las horas que te tocan hasta hoy.',
    preocupado: 'Está preocupado: tenés una prueba cerca y esa materia va atrasada.',
    dormido: 'Está dormido: ya es de noche.',
    estirandose: 'Se está estirando: estás en un descanso del pomodoro.',
    feliz: 'Está tranqui: venís bien, aunque todavía podés sumar un poquito más.',
  }[mood];

  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head"><div><h1>${esc(sl.name)}, tu perezoso</h1><p class="sub">Vestilo y cambiale el color. Cuanto más estudiás, más ropa desbloqueás y más contento está.</p></div></div>
      <div class="sloth-studio">
        <div class="card studio-preview">
          <button class="big-sloth" id="studio-sloth" aria-label="Tocalo para que hable"></button>
          <div class="speech" id="studio-speech" style="font-size:1.15rem">${esc(Sloth.contextPhrase())}</div>
          <div class="moods" role="group" aria-label="Ver expresiones">
            ${Object.keys(MOODS).map((m) => `<button class="chip-opt ${previewMood === m ? 'on' : ''}" data-mood="${m}">${MOODS[m]}</button>`).join('')}
          </div>
          <div class="field" style="width:100%"><strong class="small">Poses</strong>
            <div class="pose-row">${SLOTH_POSES.map((p) => `<button type="button" class="pose-opt ${previewPose === p.id ? 'on' : ''}" data-pose="${p.id}" title="${esc(p.name)}" aria-label="${esc(p.name)}">${p.id}</button>`).join('')}</div>
            <span class="muted small">${esc(SLOTH_POSES[previewPose - 1].name)}</span></div>
          <div class="unlock-bar">
            <p><strong>${hours.toFixed(1)} h</strong> estudiadas este semestre · ${unlockedCount}/${WARDROBE.length} prendas</p>
            ${next ? `<div class="bar" style="margin:.4rem 0"><span style="width:${((hours - prevStep) / (next.hours - prevStep)) * 100}%"></span></div>
              <p class="hint">Próximo: <strong>${esc(next.name)}</strong> a las ${next.hours} h (faltan ${fmtHM((next.hours - hours) * 60)})</p>` : '<p class="hint">¡Desbloqueaste todo el ropero! </p>'}
          </div>
        </div>

        <div class="page" style="gap:1rem">
          <section class="card">
            <div class="list-head">
              <h2>Ropero</h2>
              <button class="btn ghost sm" id="undress">Sacarle todo</button>
            </div>
            <div class="chip-row" style="margin-bottom:.8rem">
              <button class="chip-opt ${wardrobeCat === 'todo' ? 'on' : ''}" data-wcat="todo">Todo</button>
              ${WARDROBE_CATS.map((c) => `<button class="chip-opt ${wardrobeCat === c.id ? 'on' : ''}" data-wcat="${c.id}">${c.label}</button>`).join('')}
            </div>
            <div class="wardrobe">
              ${items.map((w) => {
                const locked = w.hours > hours;
                const on = sl.equipped[w.cat] === w.id;
                const view = ['cabeza', 'ojos', 'cara', 'cuello'].includes(w.cat) ? 'head' : 'full';
                return `<button class="item ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-item="${w.id}" ${locked ? 'aria-disabled="true"' : ''}
                    aria-pressed="${on}" aria-label="${esc(w.name)}${locked ? `, se desbloquea a las ${w.hours} horas` : ''}">
                  <span class="thumb">${slothSVG({ view, mood: 'feliz', sloth: { ...sl, equipped: { [w.cat]: w.id } } })}</span>
                  ${locked ? `<span class="lock">${w.hours} h</span>` : ''}
                  <span class="i-name">${esc(w.name)}</span>
                  <span class="i-style">${esc(w.style)}${locked ? ` · faltan ${fmtHM((w.hours - hours) * 60)}` : ''}</span>
                </button>`;
              }).join('')}
            </div>
          </section>

          <section class="card form">
            <h2>Cómo es</h2>
            <label>Nombre<input id="sl-name" value="${esc(sl.name)}" maxlength="24"></label>
            <div class="field"><strong>Color de pelo</strong>
              <div class="swatches" style="margin-top:.4rem">
                ${FUR_PRESETS.map((f) => `<button type="button" class="swatch-btn ${f.color === sl.fur ? 'on' : ''}" style="background:${f.color}" data-fur="${f.color}" title="${f.label}" aria-label="${f.label}"></button>`).join('')}
                <label class="inline">Otro <input type="color" id="sl-fur" value="${sl.fur}"></label>
              </div>
            </div>
          </section>

          <section class="card">
            <h2>Cómo está hoy</h2>
            <p style="margin-top:.4rem">${moodWhy}</p>
            ${w.target ? `<p class="hint" style="margin-top:.4rem">Esta semana llevás ${fmtHM(w.done)} de ${fmtHM(w.target)}${ratio != null ? ` (${Math.round(ratio * 100)}% de lo que te tocaba hasta hoy)` : ''}.</p>` : ''}
            <p class="hint" style="margin-top:.4rem">Con muchas horas se pone contento y te felicita; con pocas, se enoja y se pone un poquito pasivo-agresivo.</p>
          </section>

          <section class="card form">
            <h2>Apariciones</h2>
            <div class="chip-row" role="radiogroup" aria-label="Frecuencia">
              ${[['nunca', 'Nunca'], ['a_veces', 'A veces'], ['seguido', 'Seguido']].map(([v, l]) => `<button class="chip-opt ${sl.frequency === v ? 'on' : ''}" data-freq="${v}">${l}</button>`).join('')}
            </div>
            <div class="btn-row"><button class="btn ghost" id="sl-call">Llamarlo ahora</button></div>
          </section>
        </div>
      </div>
    </section>`;

  const v = $('#view');
  const big = $('#studio-sloth', v);
  const paintBig = () => { big.innerHTML = slothSVG({ view: `pose-${previewPose}`, mood: previewMood || Sloth.mood() }); };
  paintBig();
  big.onclick = () => { $('#studio-speech', v).textContent = Sloth.contextPhrase(); };
  const save = (reRender = true) => { Store.save(); Sloth.refresh(); if (reRender) renderSlothPage(); else paintBig(); };

  $$('[data-mood]', v).forEach((b) => (b.onclick = () => { previewMood = previewMood === b.dataset.mood ? null : b.dataset.mood; renderSlothPage(); }));
  $$('[data-wcat]', v).forEach((b) => (b.onclick = () => { wardrobeCat = b.dataset.wcat; renderSlothPage(); }));
  $$('[data-item]', v).forEach((b) => (b.onclick = () => {
    const w = wardrobeItem(b.dataset.item);
    if (w.hours > hours) { toast(`Se desbloquea con ${w.hours} h de estudio en el semestre. ¡Te faltan ${fmtHM((w.hours - hours) * 60)}!`); return; }
    if (sl.equipped[w.cat] === w.id) delete sl.equipped[w.cat];
    else sl.equipped[w.cat] = w.id;
    save();
  }));
  $('#undress', v).onclick = () => { sl.equipped = {}; save(); };
  $('#sl-name', v).onchange = (e) => { sl.name = e.target.value.trim() || 'Paco'; save(); };
  $$('[data-fur]', v).forEach((b) => (b.onclick = () => { sl.fur = b.dataset.fur; save(); }));
  const fur = $('#sl-fur', v);
  fur.oninput = () => { sl.fur = fur.value; paintBig(); };
  fur.onchange = () => { sl.fur = fur.value; save(); };
  $$('[data-pose]', v).forEach((b) => (b.onclick = () => { previewPose = +b.dataset.pose; renderSlothPage(); }));
  $$('[data-freq]', v).forEach((b) => (b.onclick = () => { sl.frequency = b.dataset.freq; Sloth.schedule(); save(); }));
  $('#sl-call', v).onclick = () => Sloth.show(Sloth.contextPhrase(), { force: true });
}
