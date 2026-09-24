'use strict';

/* ---------- Sección Perezoso: personalizar, vestir y elegir personalidad ---------- */

let wardrobeCat = 'todo';
let previewMood = null;

function renderSlothPage() {
  const sl = Store.data.sloth;
  const hours = Sloth.semesterHours();
  const next = WARDROBE.filter((w) => w.hours > hours).sort((a, b) => a.hours - b.hours)[0];
  const prevStep = WARDROBE.filter((w) => w.hours <= hours).reduce((m, w) => Math.max(m, w.hours), 0);
  const unlockedCount = WARDROBE.filter((w) => w.hours <= hours).length;
  const items = WARDROBE.filter((w) => wardrobeCat === 'todo' || w.cat === wardrobeCat).sort((a, b) => a.hours - b.hours);
  const pers = PERSONALITIES.find((p) => p.id === sl.personality) || PERSONALITIES[0];

  $('#view').innerHTML = `
    <section class="page">
      <div class="page-head"><div><h1>${esc(sl.name)}, tu perezoso</h1><p class="sub">Vestilo, cambiale el color y elegí cómo te habla. Cuanto más estudiás, más ropa desbloqueás.</p></div></div>
      <div class="sloth-studio">
        <div class="card studio-preview">
          <button class="big-sloth" id="studio-sloth" aria-label="Tocalo para que hable"></button>
          <div class="speech" id="studio-speech" style="font-size:1.15rem">${esc(phrase('saludo'))}</div>
          <div class="moods" role="group" aria-label="Ver expresiones">
            ${Object.keys(MOODS).map((m) => `<button class="chip-opt ${previewMood === m ? 'on' : ''}" data-mood="${m}">${MOODS[m]}</button>`).join('')}
          </div>
          <p class="hint">Ahora está <strong>${MOODS[Sloth.mood()].toLowerCase()}</strong>. Cambia según cómo va tu semestre.</p>
          <div class="unlock-bar">
            <p><strong>${hours.toFixed(1)} h</strong> estudiadas este semestre · ${unlockedCount}/${WARDROBE.length} prendas</p>
            ${next ? `<div class="bar" style="margin:.4rem 0"><span style="width:${((hours - prevStep) / (next.hours - prevStep)) * 100}%"></span></div>
              <p class="hint">Próximo: <strong>${esc(next.name)}</strong> a las ${next.hours} h (faltan ${fmtHM((next.hours - hours) * 60)})</p>` : '<p class="hint">¡Desbloqueaste todo el ropero! 👑</p>'}
          </div>
        </div>

        <div class="page" style="gap:1rem">
          <section class="card">
            <div class="list-head">
              <h2>👗 Ropero</h2>
              <button class="btn ghost sm" id="undress">Sacarle todo</button>
            </div>
            <div class="chip-row" style="margin-bottom:.8rem">
              <button class="chip-opt ${wardrobeCat === 'todo' ? 'on' : ''}" data-wcat="todo">Todo</button>
              ${WARDROBE_CATS.map((c) => `<button class="chip-opt ${wardrobeCat === c.id ? 'on' : ''}" data-wcat="${c.id}">${c.icon} ${c.label}</button>`).join('')}
            </div>
            <div class="wardrobe">
              ${items.map((w) => {
                const locked = w.hours > hours;
                const on = sl.equipped[w.cat] === w.id;
                const view = ['cabeza', 'ojos', 'cara', 'cuello'].includes(w.cat) ? 'head' : 'full';
                return `<button class="item ${on ? 'on' : ''} ${locked ? 'locked' : ''}" data-item="${w.id}" ${locked ? 'aria-disabled="true"' : ''}
                    aria-pressed="${on}" aria-label="${esc(w.name)}${locked ? `, se desbloquea a las ${w.hours} horas` : ''}">
                  <span class="thumb">${slothSVG({ view, mood: 'feliz', sloth: { ...sl, personality: 'tierno', equipped: { [w.cat]: w.id } } })}</span>
                  ${locked ? `<span class="lock">🔒 ${w.hours} h</span>` : ''}
                  <span class="i-name">${esc(w.name)}</span>
                  <span class="i-style">${esc(w.style)}${locked ? ` · faltan ${fmtHM((w.hours - hours) * 60)}` : ''}</span>
                </button>`;
              }).join('')}
            </div>
          </section>

          <section class="card form">
            <h2>✏️ Cómo es</h2>
            <label>Nombre<input id="sl-name" value="${esc(sl.name)}" maxlength="24"></label>
            <div class="field"><strong>Color de pelo</strong>
              <div class="swatches" style="margin-top:.4rem">
                ${FUR_PRESETS.map((f) => `<button type="button" class="swatch-btn ${f.color === sl.fur ? 'on' : ''}" style="background:${f.color}" data-fur="${f.color}" title="${f.label}" aria-label="${f.label}"></button>`).join('')}
                <label class="inline">Otro <input type="color" id="sl-fur" value="${sl.fur}"></label>
              </div>
            </div>
          </section>

          <section class="card">
            <h2>🎭 Personalidad</h2>
            <p class="hint">Cambia todas sus frases. Ahora: <strong>${pers.icon} ${pers.label}</strong>.</p>
            <div class="pers-grid" style="margin-top:.6rem">
              ${PERSONALITIES.map((p) => `<button class="pers ${p.id === sl.personality ? 'on' : ''}" data-pers="${p.id}"><strong>${p.icon} ${p.label}</strong><span>${p.desc}</span></button>`).join('')}
            </div>
          </section>

          <section class="card form">
            <h2>🔔 Apariciones</h2>
            <div class="chip-row" role="radiogroup" aria-label="Frecuencia">
              ${[['nunca', 'Nunca'], ['a_veces', 'A veces'], ['seguido', 'Seguido']].map(([v, l]) => `<button class="chip-opt ${sl.frequency === v ? 'on' : ''}" data-freq="${v}">${l}</button>`).join('')}
            </div>
            <label class="check"><input type="checkbox" id="sl-sound" ${sl.sound ? 'checked' : ''}> Gong suave cuando aparece el Maestro dramático</label>
            <div class="btn-row"><button class="btn ghost" id="sl-call">Llamarlo ahora</button></div>
          </section>
        </div>
      </div>
    </section>`;

  const v = $('#view');
  const big = $('#studio-sloth', v);
  const paintBig = () => { big.innerHTML = slothSVG({ view: 'full', mood: previewMood || Sloth.mood() }); };
  paintBig();
  big.onclick = () => { $('#studio-speech', v).textContent = Sloth.contextPhrase(); };
  const save = (reRender = true) => { Store.save(); Sloth.refresh(); if (reRender) renderSlothPage(); else paintBig(); };

  $$('[data-mood]', v).forEach((b) => (b.onclick = () => { previewMood = previewMood === b.dataset.mood ? null : b.dataset.mood; renderSlothPage(); }));
  $$('[data-wcat]', v).forEach((b) => (b.onclick = () => { wardrobeCat = b.dataset.wcat; renderSlothPage(); }));
  $$('[data-item]', v).forEach((b) => (b.onclick = () => {
    const w = wardrobeItem(b.dataset.item);
    if (w.hours > hours) { toast(`🔒 Se desbloquea con ${w.hours} h de estudio en el semestre. ¡Te faltan ${fmtHM((w.hours - hours) * 60)}!`); return; }
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
  $$('[data-pers]', v).forEach((b) => (b.onclick = () => {
    sl.personality = b.dataset.pers;
    save();
    $('#studio-speech').textContent = phrase('saludo');
  }));
  $$('[data-freq]', v).forEach((b) => (b.onclick = () => { sl.frequency = b.dataset.freq; Sloth.schedule(); save(); }));
  $('#sl-sound', v).onchange = (e) => { sl.sound = e.target.checked; save(false); };
  $('#sl-call', v).onclick = () => Sloth.show(Sloth.contextPhrase());
}
