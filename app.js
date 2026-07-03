/* =========================================================
   DD PUCV · Constructor de Dispositivos de Reflexión
   Vanilla JS — sin dependencias de build, listo para GitHub Pages
   ========================================================= */

(function () {
  'use strict';

  /* ---------------- CONFIG ---------------- */
  const STORAGE_KEY = 'dd_dispositivo_v1';
  const SETTINGS_KEY = 'dd_dispositivo_settings_v1';
  const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

  const STEPS = [
    { id: 1, label: 'Sujeto',     accentVar: '--red',    accentHex: '#E8251C', icon: '01' },
    { id: 2, label: 'Estímulo',   accentVar: '--yellow', accentHex: '#F4C318', icon: '02' },
    { id: 3, label: 'Modelo',     accentVar: '--cyan',   accentHex: '#3DB9E8', icon: '03' },
    { id: 4, label: 'Preguntas',  accentVar: '--purple', accentHex: '#7B4CB8', icon: '04' },
    { id: 5, label: 'Nivel',      accentVar: '--teal',   accentHex: '#00B2C8', icon: '05' },
  ];

  const SYSTEM_PROMPT = `Eres el acompañante IA del taller "Diseño de Dispositivos para la Reflexión en las Prácticas Profesionales" de la Dirección de Desarrollo Docente de la PUCV.
Ayudas a docentes y tutores de CUALQUIER carrera (no solo pedagogía) a diseñar un dispositivo de elicitación reflexiva para sus estudiantes en práctica profesional.
Conoces los fundamentos de Dewey (la reflexión nace de la perplejidad) y Schön (reflexión en la acción / sobre la acción), y los modelos ALACT (Korthagen), la Cebolla (Korthagen & Vasalos), el Ciclo de Gibbs y los niveles de Van Manen.
Responde siempre en español de Chile, en tono cercano y profesional, breve (máximo 120 palabras salvo que se te pida explícitamente una lista de preguntas), concreto y accionable. Nunca inventes citas académicas. No uses markdown con asteriscos para negritas; usa texto plano.`;

  /* ---------------- STATE ---------------- */
  let state = {
    step: 'intro', // 'intro' | 1-5 | 'final'
    furthest: 1,
    data: {
      sujeto: { carrera: '', momento: '', cantidad: '', contexto: '' },
      estimulo: { tipo: '', detalle: '' },
      modelo: { valor: '', justificacion: '' },
      preguntas: { descriptiva: '', analitica: '', critica: '' },
      nivel: { valor: '' },
    },
    chat: { 1: [], 2: [], 3: [], 4: [], 5: [] },
  };

let settings = { apiKey: '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', model: 'openai/gpt-oss-120b' };

  /* ---------------- PERSISTENCE ---------------- */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (e) { /* ignore corrupt state */ }
    try {
      const raw2 = localStorage.getItem(SETTINGS_KEY);
      if (raw2) settings = Object.assign(settings, JSON.parse(raw2));
    } catch (e) { /* ignore */ }
  }
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  /* ---------------- HELPERS ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => (s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function isStepComplete(id) {
    const d = state.data;
    switch (id) {
      case 1: return !!(d.sujeto.carrera && d.sujeto.momento && d.sujeto.contexto);
      case 2: return !!(d.estimulo.tipo && d.estimulo.detalle);
      case 3: return !!d.modelo.valor;
      case 4: return !!(d.preguntas.descriptiva && d.preguntas.analitica && d.preguntas.critica);
      case 5: return !!d.nivel.valor;
      default: return false;
    }
  }
  function completedCount() {
    return STEPS.filter((s) => isStepComplete(s.id)).length;
  }

  /* ---------------- RAIL ---------------- */
  function renderRail() {
    const list = $('#railList');
    list.innerHTML = '';
    STEPS.forEach((s) => {
      const li = document.createElement('li');
      li.className = 'rail__item';
      li.style.setProperty('--accent', `var(${s.accentVar})`);
      if (state.step === s.id) li.classList.add('is-active');
      if (isStepComplete(s.id)) li.classList.add('is-done');
      li.innerHTML = `<span class="rail__dot"><span>${s.icon}</span></span><span class="rail__label">${s.label}</span>`;
      li.addEventListener('click', () => {
        if (s.id <= state.furthest || isStepComplete(s.id)) goToStep(s.id);
      });
      list.appendChild(li);
    });
  }

  /* ---------------- NAVIGATION ---------------- */
  function goToStep(step) {
    state.step = step;
    if (typeof step === 'number') state.furthest = Math.max(state.furthest, step);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveState();
  }
  function goNext() {
    if (state.step === 'intro') return goToStep(1);
    if (typeof state.step === 'number') {
      if (state.step === 5) return goToStep('final');
      return goToStep(state.step + 1);
    }
  }
  function goBack() {
    if (typeof state.step === 'number') {
      if (state.step === 1) return goToStep('intro');
      return goToStep(state.step - 1);
    }
    if (state.step === 'final') return goToStep(5);
  }

  /* ---------------- RENDER PANELS ---------------- */
  function render() {
    $$('.panel').forEach((p) => { p.hidden = p.dataset.panel !== String(state.step); });
    $('#stepnav').hidden = state.step === 'intro' || state.step === 'final';
    $('#btnBack').disabled = false;
    const btnNext = $('#btnNext');
    if (typeof state.step === 'number') {
      btnNext.textContent = state.step === 5 ? 'Ver mi dispositivo →' : 'Continuar →';
      btnNext.disabled = !isStepComplete(state.step);
    }
    if (typeof state.step === 'number') {
      $('#progressBadge').textContent = `Paso ${state.step} de 5`;
    } else if (state.step === 'final') {
      $('#progressBadge').textContent = 'Dispositivo listo';
    } else {
      $('#progressBadge').textContent = 'Bienvenida';
    }
    renderRail();
    renderSidebar();
    if (typeof state.step === 'number') renderCompanion(state.step);
    if (state.step === 'final') renderFichaFinal();
    syncFieldsFromState();
  }

  function syncFieldsFromState() {
    const d = state.data;
    $('#f_carrera').value = d.sujeto.carrera;
    $('#f_momento').value = d.sujeto.momento;
    $('#f_cantidad').value = d.sujeto.cantidad;
    $('#f_contexto').value = d.sujeto.contexto;
    $('#f_estimulo_detalle').value = d.estimulo.detalle;
    $$('#estimuloChips .chip').forEach((c) => c.classList.toggle('is-selected', c.dataset.value === d.estimulo.tipo));
    $('#f_modelo_justif').value = d.modelo.justificacion;
    $$('#modeloGrid .model-card').forEach((c) => c.classList.toggle('is-selected', c.dataset.value === d.modelo.valor));
    updateModeloDescPreview();
    $('#f_p_desc').value = d.preguntas.descriptiva;
    $('#f_p_analitica').value = d.preguntas.analitica;
    $('#f_p_critica').value = d.preguntas.critica;
    $$('#nivelGrid .level-card').forEach((c) => c.classList.toggle('is-selected', c.dataset.value === d.nivel.valor));
    updateNivelDescPreview();
  }

  function updateModeloDescPreview() {
    const sel = $('#modeloGrid .model-card.is-selected');
    $('#modeloDescPreview').textContent = sel ? sel.dataset.desc : 'Selecciona un modelo para ver su descripción.';
  }
  function updateNivelDescPreview() {
    const sel = $('#nivelGrid .level-card.is-selected');
    $('#nivelDescPreview').textContent = sel ? sel.dataset.desc : 'Selecciona un nivel para ver su descripción.';
  }

  /* ---------------- SIDEBAR / FICHA EN VIVO ---------------- */
  function slotSummary() {
    const d = state.data;
    return [
      { id: 1, label: 'Sujeto', accentHex: STEPS[0].accentHex, value: d.sujeto.carrera ? `${d.sujeto.carrera}${d.sujeto.momento ? ' · ' + d.sujeto.momento : ''}` : '' },
      { id: 2, label: 'Estímulo', accentHex: STEPS[1].accentHex, value: d.estimulo.tipo || '' },
      { id: 3, label: 'Modelo', accentHex: STEPS[2].accentHex, value: d.modelo.valor || '' },
      { id: 4, label: 'Preguntas', accentHex: STEPS[3].accentHex, value: d.preguntas.descriptiva ? 'Preguntas definidas' : '' },
      { id: 5, label: 'Nivel', accentHex: STEPS[4].accentHex, value: d.nivel.valor || '' },
    ];
  }

  function renderSlotsInto(container) {
    container.innerHTML = '';
    slotSummary().forEach((s) => {
      const filled = isStepComplete(s.id);
      const li = document.createElement('li');
      li.className = 'slot' + (filled ? ' is-filled' : '');
      li.style.setProperty('--accent', s.accentHex);
      li.innerHTML = `<div class="slot__label"><span class="slot__dot"></span>${s.id} · ${s.label}</div>
        <div class="slot__value">${filled ? esc(s.value) : 'Aún sin completar'}</div>`;
      li.addEventListener('click', () => goToStep(s.id));
      li.style.cursor = 'pointer';
      container.appendChild(li);
    });
  }

  function renderSidebar() {
    renderSlotsInto($('#sidebarSlots'));
    renderSlotsInto($('#sheetSlots'));
    const n = completedCount();
    $('#progressFill').style.width = (n / 5 * 100) + '%';
    $('#progressText').textContent = `${n} de 5 componentes`;
    $('#fabText').textContent = `Ver ficha · ${n}/5`;
  }

  /* ---------------- FICHA FINAL (imprimible) ---------------- */
  function renderFichaFinal() {
    const d = state.data;
    const box = $('#fichaDoc');
    const empty = (v) => v ? esc(v) : '<span class="muted-empty">Sin completar</span>';
    const sujetoLine = [d.sujeto.carrera, d.sujeto.momento].filter(Boolean).join(' · ');
    box.innerHTML = `
      <div class="ficha-doc__header">
        <div>
          <h4>Ficha-Dispositivo de Reflexión Pedagógica</h4>
          <p>Prácticas profesionales · Dirección de Desarrollo Docente, PUCV</p>
        </div>
        <div class="ficha-doc__mark">100 años<br>PUCV<br>1928–2028</div>
      </div>

      <div class="ficha-doc__section" style="--accent:${STEPS[0].accentHex}">
        <h5>01 · Sujeto destinatario</h5>
        <p>${sujetoLine ? esc(sujetoLine) : '<span class="muted-empty">Sin completar</span>'}${d.sujeto.cantidad ? ' · ' + esc(String(d.sujeto.cantidad)) + ' estudiantes aprox.' : ''}</p>
        ${d.sujeto.contexto ? `<p>${esc(d.sujeto.contexto)}</p>` : ''}
      </div>

      <div class="ficha-doc__section" style="--accent:${STEPS[1].accentHex}">
        <h5>02 · Estímulo</h5>
        <p><strong>${empty(d.estimulo.tipo)}</strong></p>
        ${d.estimulo.detalle ? `<p>${esc(d.estimulo.detalle)}</p>` : ''}
      </div>

      <div class="ficha-doc__section" style="--accent:${STEPS[2].accentHex}">
        <h5>03 · Modelo reflexivo</h5>
        <p><strong>${empty(d.modelo.valor)}</strong></p>
        ${d.modelo.justificacion ? `<p>${esc(d.modelo.justificacion)}</p>` : ''}
      </div>

      <div class="ficha-doc__section" style="--accent:${STEPS[3].accentHex}">
        <h5>04 · Preguntas orientadoras</h5>
        <ul class="ficha-doc__questions">
          <li><strong>Descriptiva:</strong> ${empty(d.preguntas.descriptiva)}</li>
          <li><strong>Analítica:</strong> ${empty(d.preguntas.analitica)}</li>
          <li><strong>Crítica:</strong> ${empty(d.preguntas.critica)}</li>
        </ul>
      </div>

      <div class="ficha-doc__section" style="--accent:${STEPS[4].accentHex}">
        <h5>05 · Nivel de profundidad</h5>
        <p><strong>${empty(d.nivel.valor)}</strong></p>
      </div>

      <div class="ficha-doc__footer">
        <span>Diseñado con el Constructor de Dispositivos de Reflexión</span>
        <span>${new Date().toLocaleDateString('es-CL')}</span>
      </div>
    `;
  }

  /* ---------------- FIELD LISTENERS ---------------- */
  function attachFieldListeners() {
    $('#f_carrera').addEventListener('input', (e) => { state.data.sujeto.carrera = e.target.value; onDataChange(); });
    $('#f_momento').addEventListener('change', (e) => { state.data.sujeto.momento = e.target.value; onDataChange(); });
    $('#f_cantidad').addEventListener('input', (e) => { state.data.sujeto.cantidad = e.target.value; onDataChange(); });
    $('#f_contexto').addEventListener('input', (e) => { state.data.sujeto.contexto = e.target.value; onDataChange(); });

    $$('#estimuloChips .chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.data.estimulo.tipo = chip.dataset.value;
        $$('#estimuloChips .chip').forEach((c) => c.classList.toggle('is-selected', c === chip));
        onDataChange();
      });
    });
    $('#f_estimulo_detalle').addEventListener('input', (e) => { state.data.estimulo.detalle = e.target.value; onDataChange(); });

    $$('#modeloGrid .model-card').forEach((card) => {
      card.addEventListener('click', () => {
        state.data.modelo.valor = card.dataset.value;
        $$('#modeloGrid .model-card').forEach((c) => c.classList.toggle('is-selected', c === card));
        updateModeloDescPreview();
        onDataChange();
      });
    });
    $('#f_modelo_justif').addEventListener('input', (e) => { state.data.modelo.justificacion = e.target.value; onDataChange(); });

    $('#f_p_desc').addEventListener('input', (e) => { state.data.preguntas.descriptiva = e.target.value; onDataChange(); });
    $('#f_p_analitica').addEventListener('input', (e) => { state.data.preguntas.analitica = e.target.value; onDataChange(); });
    $('#f_p_critica').addEventListener('input', (e) => { state.data.preguntas.critica = e.target.value; onDataChange(); });
    $('#btnSugerirPreguntas').addEventListener('click', sugerirPreguntas);

    $$('#nivelGrid .level-card').forEach((card) => {
      card.addEventListener('click', () => {
        state.data.nivel.valor = card.dataset.value;
        $$('#nivelGrid .level-card').forEach((c) => c.classList.toggle('is-selected', c === card));
        updateNivelDescPreview();
        onDataChange();
      });
    });
  }

  function onDataChange() {
    renderSidebar();
    if (typeof state.step === 'number') {
      $('#btnNext').disabled = !isStepComplete(state.step);
      renderRail();
    }
    saveState();
  }

  /* ---------------- GROQ API ---------------- */
  function hasKey() { return !!settings.apiKey; }

  async function callGroq(messages, opts) {
    opts = opts || {};
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + settings.apiKey,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: messages,
        temperature: opts.temperature != null ? opts.temperature : 0.6,
        max_tokens: opts.maxTokens || 500,
      }),
    });
    if (!res.ok) {
      let detail = '';
      try { const j = await res.json(); detail = j.error && j.error.message ? j.error.message : JSON.stringify(j); } catch (e) { detail = res.statusText; }
      throw new Error(`Groq respondió ${res.status}: ${detail}`);
    }
    const json = await res.json();
    return json.choices && json.choices[0] && json.choices[0].message ? json.choices[0].message.content.trim() : '';
  }

  function contextSummary(uptoStep) {
    const d = state.data;
    const lines = [];
    if (uptoStep >= 1 && d.sujeto.carrera) lines.push(`Sujeto: estudiantes de ${d.sujeto.carrera}${d.sujeto.momento ? ' (' + d.sujeto.momento + ')' : ''}. ${d.sujeto.contexto || ''}`);
    if (uptoStep >= 2 && d.estimulo.tipo) lines.push(`Estímulo elegido: ${d.estimulo.tipo}. ${d.estimulo.detalle || ''}`);
    if (uptoStep >= 3 && d.modelo.valor) lines.push(`Modelo reflexivo elegido: ${d.modelo.valor}.`);
    if (uptoStep >= 4 && (d.preguntas.descriptiva || d.preguntas.analitica || d.preguntas.critica)) {
      lines.push(`Preguntas ya redactadas — descriptiva: "${d.preguntas.descriptiva}" · analítica: "${d.preguntas.analitica}" · crítica: "${d.preguntas.critica}"`);
    }
    if (uptoStep >= 5 && d.nivel.valor) lines.push(`Nivel de profundidad buscado: ${d.nivel.valor}.`);
    return lines.length ? lines.join('\n') : 'Aún no hay información previa de este dispositivo.';
  }

  const QUICK_PROMPTS = {
    1: 'Ayúdame a describir mejor a mi sujeto destinatario en 2-3 frases concretas para esta ficha.',
    2: 'Sugiéreme, en 2-3 frases, un estímulo concreto y bien aterrizado a mi contexto.',
    3: 'Explícame en simple por qué el modelo reflexivo que elegí (o cuál me conviene si no he elegido) calza con mi sujeto y estímulo.',
    4: 'Dame retroalimentación breve sobre mis preguntas orientadoras: ¿están bien calibradas por nivel?',
    5: 'Ayúdame a confirmar si el nivel de profundidad que busco es coherente con mi estímulo y mis preguntas.',
  };

  function renderCompanion(stepId) {
    const host = $(`.companion[data-companion="${stepId}"]`);
    if (!host) return;
    if (!hasKey()) {
      host.innerHTML = `
        <div class="companion__head">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>
          <strong>Acompañante IA</strong>
        </div>
        <div class="companion__body">
          <p class="companion__locked">Activa tu clave de Groq para recibir sugerencias en este paso.
            <button class="btn btn--sm" id="btnUnlockAI">Configurar acompañante</button>
          </p>
        </div>`;
      $('#btnUnlockAI', host).addEventListener('click', openSettings);
      return;
    }
    host.innerHTML = `
      <div class="companion__head">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>
        <div><strong>Acompañante IA</strong><br><span>${settings.model}</span></div>
      </div>
      <div class="companion__body">
        <div class="companion__quick">
          <button class="btn btn--sm" id="btnQuick">💬 Pídele una sugerencia</button>
        </div>
        <div class="companion__msgs" id="companionMsgs"></div>
        <form class="companion__ask" id="companionAsk">
          <input type="text" id="companionInput" placeholder="Pregúntale algo a tu acompañante…" autocomplete="off">
          <button class="btn btn--sm" type="submit">Enviar</button>
        </form>
      </div>`;
    renderMsgs(stepId);
    $('#btnQuick', host).addEventListener('click', () => askCompanion(stepId, QUICK_PROMPTS[stepId]));
    $('#companionAsk', host).addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#companionInput', host);
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      askCompanion(stepId, text);
    });
  }

  function renderMsgs(stepId) {
    const host = $(`.companion[data-companion="${stepId}"] #companionMsgs`);
    if (!host) return;
    host.innerHTML = '';
    (state.chat[stepId] || []).forEach((m) => {
      const div = document.createElement('div');
      div.className = 'msg ' + (m.role === 'user' ? 'msg--user' : m.role === 'error' ? 'msg--error' : 'msg--ai');
      div.textContent = m.content;
      host.appendChild(div);
    });
    host.scrollTop = host.scrollHeight;
  }

  async function askCompanion(stepId, question) {
    if (!question) return;
    state.chat[stepId] = state.chat[stepId] || [];
    state.chat[stepId].push({ role: 'user', content: question });
    renderMsgs(stepId);
    saveState();

    const host = $(`.companion[data-companion="${stepId}"] #companionMsgs`);
    const loading = document.createElement('div');
    loading.className = 'msg msg--ai msg--loading';
    loading.textContent = 'Pensando…';
    if (host) { host.appendChild(loading); host.scrollTop = host.scrollHeight; }

    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Contexto del dispositivo hasta ahora:\n${contextSummary(stepId)}\n\nPregunta del/la docente: ${question}` },
      ];
      const reply = await callGroq(messages, { maxTokens: 350 });
      state.chat[stepId].push({ role: 'assistant', content: reply || '(sin respuesta)' });
    } catch (err) {
      state.chat[stepId].push({ role: 'error', content: 'No se pudo contactar al acompañante IA. ' + err.message });
    }
    renderMsgs(stepId);
    saveState();
  }

  async function sugerirPreguntas() {
    if (!hasKey()) { openSettings(); return; }
    const btn = $('#btnSugerirPreguntas');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Pensando…';
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Contexto del dispositivo:\n${contextSummary(5)}\n\nRedacta EXACTAMENTE 3 preguntas orientadoras para la ficha de este dispositivo, una por nivel, en español de Chile. Responde solo con estas 3 líneas, sin numeración ni texto adicional:\nDESCRIPTIVA: <pregunta>\nANALITICA: <pregunta>\nCRITICA: <pregunta>` },
      ];
      const reply = await callGroq(messages, { maxTokens: 300, temperature: 0.7 });
      const get = (label) => {
        const m = reply.match(new RegExp(label + '\\s*:\\s*(.+)', 'i'));
        return m ? m[1].trim() : '';
      };
      const desc = get('DESCRIPTIVA');
      const analit = get('ANALITICA|ANALÍTICA');
      const crit = get('CRITICA|CRÍTICA');
      if (desc) { $('#f_p_desc').value = desc; state.data.preguntas.descriptiva = desc; }
      if (analit) { $('#f_p_analitica').value = analit; state.data.preguntas.analitica = analit; }
      if (crit) { $('#f_p_critica').value = crit; state.data.preguntas.critica = crit; }
      if (!desc && !analit && !crit) {
        state.chat[4] = state.chat[4] || [];
        state.chat[4].push({ role: 'assistant', content: reply });
        renderMsgs(4);
      }
      onDataChange();
    } catch (err) {
      state.chat[4] = state.chat[4] || [];
      state.chat[4].push({ role: 'error', content: 'No se pudo generar la sugerencia. ' + err.message });
      renderMsgs(4);
    }
    btn.disabled = false;
    btn.innerHTML = original;
  }

  /* ---------------- SETTINGS MODAL ---------------- */
  function openSettings() {
    $('#apiKeyInput').value = settings.apiKey;
    $('#modelSelect').value = settings.model;
    $('#modalSettings').classList.add('is-open');
  }
  function closeSettings() { $('#modalSettings').classList.remove('is-open'); }
  function saveSettingsFromModal() {
    settings.apiKey = $('#apiKeyInput').value.trim();
    settings.model = $('#modelSelect').value;
    saveSettings();
    closeSettings();
    if (typeof state.step === 'number') renderCompanion(state.step);
  }

  /* ---------------- MOBILE SHEET ---------------- */
  function openSheet() { $('#sheet').classList.add('is-open'); $('#scrim').classList.add('is-open'); }
  function closeSheet() { $('#sheet').classList.remove('is-open'); $('#scrim').classList.remove('is-open'); }

  /* ---------------- PDF EXPORT ---------------- */
  function downloadPdf() {
    const el = $('#fichaDoc');
    const carrera = (state.data.sujeto.carrera || 'dispositivo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filename = `ficha-dispositivo-${carrera || 'reflexion'}.pdf`;
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    if (window.html2pdf) {
      window.html2pdf().set(opt).from(el).save();
    } else {
      window.print();
    }
  }

  /* ---------------- RESET ---------------- */
  function resetAll() {
    if (!confirm('¿Empezar un dispositivo nuevo? Se borrará lo que llevas avanzado.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = {
      step: 'intro', furthest: 1,
      data: {
        sujeto: { carrera: '', momento: '', cantidad: '', contexto: '' },
        estimulo: { tipo: '', detalle: '' },
        modelo: { valor: '', justificacion: '' },
        preguntas: { descriptiva: '', analitica: '', critica: '' },
        nivel: { valor: '' },
      },
      chat: { 1: [], 2: [], 3: [], 4: [], 5: [] },
    };
    render();
  }

  /* ---------------- INIT ---------------- */
  function init() {
    loadState();
    attachFieldListeners();

    $('#btnStart').addEventListener('click', goNext);
    $('#btnNext').addEventListener('click', goNext);
    $('#btnBack').addEventListener('click', goBack);
    $('#btnReset').addEventListener('click', resetAll);
    $('#btnEditAgain').addEventListener('click', () => goToStep(1));
    $('#btnDownloadPdf').addEventListener('click', downloadPdf);

    $('#btnSettings').addEventListener('click', openSettings);
    $('#btnCloseSettings').addEventListener('click', closeSettings);
    $('#btnSaveSettings').addEventListener('click', saveSettingsFromModal);
    $('#modalSettings').addEventListener('click', (e) => { if (e.target.id === 'modalSettings') closeSettings(); });

    $('#fabFicha').addEventListener('click', openSheet);
    $('#sheetClose').addEventListener('click', closeSheet);
    $('#scrim').addEventListener('click', closeSheet);

    if (!hasKey()) {
      // Suggest setting up the companion on first visit, without blocking the flow.
      setTimeout(() => { if (!hasKey()) openSettings(); }, 600);
    }

    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
