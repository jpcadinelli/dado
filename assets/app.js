import { DiceController, COLOR_PALETTE } from './dice.js';
import { TYPES, CLASSIC_CATEGORIES, MIX_CATEGORIES, readSetting, saveSetting, removeSetting, safeFaces } from './config.js';

const $ = id => document.getElementById(id);
const formatCount = n => `${String(n).padStart(2, '0')} ${n === 1 ? 'LANÇAMENTO' : 'LANÇAMENTOS'}`;
function announce(message) { const el = $('announcement'); if (el) el.textContent = message; }
function setResult(el, result, fallback = '—') {
  if (!el) return;
  el.textContent = result?.value ?? fallback;
  const color = result ? COLOR_PALETTE[result.index % COLOR_PALETTE.length][0] : '#f7f8ff';
  el.style.color = color;
  el.classList.remove('result-pop');
  void el.offsetWidth;
  el.classList.add('result-pop');
}
function pushHistory(target, history, count, limit = 5) {
  history.splice(limit);
  target.replaceChildren();
  if (!history.length) {
    const empty = document.createElement('span');
    empty.className = 'muted';
    empty.textContent = 'Os resultados aparecerão aqui.';
    target.append(empty);
    return;
  }
  for (const item of history) {
    const chip = document.createElement('span');
    chip.className = 'history-chip';
    chip.textContent = item.value;
    chip.style.setProperty('--chip', COLOR_PALETTE[item.index % COLOR_PALETTE.length][0]);
    chip.title = item.title;
    target.append(chip);
  }
  const counter = target.closest('.history')?.querySelector('.history-counter');
  if (counter) counter.textContent = formatCount(count);
}

function setupTraditional() {
  const history = [];
  let count = 0;
  const button = $('rollNumber');
  const die = new DiceController($('numberDie'), {
    title: 'dado numérico', variant: 'numeric', faces: TYPES.D6.faces,
    onTap: () => roll(),
    onStart: () => { button.disabled = true; button.textContent = 'Rolando…'; },
    onFinish: result => {
      count++;
      history.unshift(result);
      pushHistory($('numberHistory'), history, count);
      setResult($('numberResult'), result);
      $('numberLabel').textContent = `Saiu ${result.value}!`;
      button.disabled = false; button.textContent = 'Rolar novamente';
      announce(`Dado numérico: ${result.value}`);
    }
  });
  function roll() { return die.roll(); }
  button.addEventListener('click', roll);
  document.addEventListener('keydown', event => {
    if (event.code === 'Space' && !event.repeat && ['BODY','HTML'].includes(event.target.tagName)) {
      event.preventDefault(); roll();
    }
  });
}

function setupLetters() {
  let config = readSetting('category-profile', { preset: 'classic', faces: CLASSIC_CATEGORIES });
  if (!config || !['classic','mix','custom'].includes(config.preset) || (config.preset === 'custom' && !safeFaces(config.faces))) config = { preset: 'classic', faces: CLASSIC_CATEGORIES };
  const select = $('letterPreset');
  select.value = config.preset === 'mix' || config.preset === 'custom' ? config.preset : 'classic';
  const history = []; let count = 0;
  const button = $('rollLetter');
  const configFaces = () => select.value === 'mix' ? MIX_CATEGORIES : select.value === 'custom' ? (safeFaces(config.faces) ?? CLASSIC_CATEGORIES) : CLASSIC_CATEGORIES;
  const die = new DiceController($('letterDie'), {
    title: 'dado de letras', variant: 'letter', faces: configFaces(), onTap: () => die.roll(),
    onStart: () => { button.disabled = true; button.textContent = 'Rolando…'; },
    onFinish: result => {
      count++; history.unshift(result); pushHistory($('letterHistory'), history, count);
      setResult($('letterResult'), result);
      $('letterLabel').textContent = result.title;
      button.disabled = false; button.textContent = 'Rolar novamente';
      announce(`Categoria ${result.value}: ${result.title}`);
    }
  });
  button.addEventListener('click', () => die.roll());
  select.addEventListener('change', () => {
    if (die.running) { select.value = config.preset; return; }
    const preset = select.value;
    config = { preset, faces: preset === 'mix' ? MIX_CATEGORIES : preset === 'custom' ? (safeFaces(config.faces) ?? CLASSIC_CATEGORIES) : CLASSIC_CATEGORIES };
    saveSetting('category-profile', config);
    die.setFaces(config.faces);
    $('letterResult').textContent = '—'; $('letterLabel').textContent = 'Aguardando lançamento';
    showFields();
  });
  setupCategoryEditor(config, updated => {
    config = updated;
    select.value = 'custom';
    if (!die.running) die.setFaces(updated.faces);
    $('letterResult').textContent = '—'; $('letterLabel').textContent = 'Aguardando lançamento';
  });
  function showFields() { $('categoryEditor').hidden = select.value !== 'custom'; populateCategoryEditor(config.faces); }
  showFields();
}

function populateCategoryEditor(faces) {
  const input = $('categoryInputs');
  if (!input) return;
  input.replaceChildren();
  faces.forEach((face, i) => {
    const row = document.createElement('label'); row.className = 'category-row';
    const order = document.createElement('span'); order.textContent = `Face ${i + 1}`;
    const letter = document.createElement('input'); letter.name = `letter${i}`; letter.maxLength = 12; letter.value = face.value;
    letter.setAttribute('aria-label', `Letra da face ${i + 1}`);
    const title = document.createElement('input'); title.name = `title${i}`; title.maxLength = 70; title.value = face.title;
    title.setAttribute('aria-label', `Significado da face ${i + 1}`);
    row.append(order, letter, title); input.append(row);
  });
}
function setupCategoryEditor(initial, onSave) {
  const form = $('categoryForm');
  if (!form) return;
  populateCategoryEditor(initial.faces);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const candidate = Array.from({ length: 6 }, (_, i) => ({
      value: form.elements[`letter${i}`].value,
      title: form.elements[`title${i}`].value
    }));
    const faces = safeFaces(candidate);
    if (!faces) { $('categoryFeedback').textContent = 'Preencha as seis faces.'; return; }
    const state = { preset: 'custom', faces };
    saveSetting('category-profile', state);
    $('categoryFeedback').textContent = 'Categorias personalizadas salvas neste navegador.';
    onSave(state);
    announce('Configuração de categorias salva.');
  });
}

function setupGame() {
  let config = readSetting('category-profile', { preset: 'classic', faces: CLASSIC_CATEGORIES });
  if (!['classic', 'mix', 'custom'].includes(config?.preset) || (config.preset === 'custom' && !safeFaces(config.faces))) config = { preset: 'classic', faces: CLASSIC_CATEGORIES };
  const select = $('letterPreset');
  select.value = config.preset;
  let number = null; let letter = null;
  let combined = false;
  let total = 0;
  const numberHistory = [], letterHistory = [], combinedHistory = [];
  const faces = () => config.preset === 'mix' ? MIX_CATEGORIES : config.preset === 'custom' ? (safeFaces(config.faces) ?? CLASSIC_CATEGORIES) : CLASSIC_CATEGORIES;
  const updateButtons = () => {
    $('rollNumber').disabled = combined || numeric.running;
    $('rollLetter').disabled = combined || alphabetic.running;
    $('rollBoth').disabled = combined || numeric.running || alphabetic.running;
    $('letterPreset').disabled = combined || alphabetic.running;
    const save = $('categoryForm')?.querySelector('[type=submit]'); if (save) save.disabled = combined || alphabetic.running;
  };
  const updateCombined = () => {
    $('combinedResult').textContent = number && letter ? `${number.value} + ${letter.value}` : '—';
    $('combinedCaption').textContent = number && letter ? `Número ${number.value} · ${letter.title}` : number ? `Número ${number.value} · aguardando categoria` : letter ? `Categoria ${letter.value} · aguardando número` : 'Role um ou os dois dados para começar';
  };
  const numeric = new DiceController($('numberDie'), {
    title: 'dado numérico', variant: 'numeric', faces: TYPES.D6.faces, onTap: () => rollNumber(),
    onStart: updateButtons,
    onFinish: result => {
      number = result; total++; numberHistory.unshift(result); pushHistory($('numberHistory'), numberHistory, numberHistory.length);
      setResult($('numberResult'), result); $('numberLabel').textContent = `Saiu ${result.value}`;
      updateCombined(); updateButtons(); announce(`Número sorteado: ${result.value}`);
    }
  });
  const alphabetic = new DiceController($('letterDie'), {
    title: 'dado de letras', variant: 'letter', faces: faces(), onTap: () => rollLetter(),
    onStart: updateButtons,
    onFinish: result => {
      letter = result; total++; letterHistory.unshift(result); pushHistory($('letterHistory'), letterHistory, letterHistory.length);
      setResult($('letterResult'), result); $('letterLabel').textContent = result.title;
      updateCombined(); updateButtons(); announce(`Categoria sorteada: ${result.value} — ${result.title}`);
    }
  });
  function rollNumber() { if (!combined) return numeric.roll(); return Promise.resolve(null); }
  function rollLetter() { if (!combined) return alphabetic.roll(); return Promise.resolve(null); }
  async function rollBoth() {
    if (combined || numeric.running || alphabetic.running) return;
    combined = true; updateButtons();
    const [n, l] = await Promise.all([numeric.roll(), alphabetic.roll()]);
    if (n && l) {
      combinedHistory.unshift({ value: `${n.value} + ${l.value}`, title: l.title, index: l.index });
      pushHistory($('combinedHistory'), combinedHistory, combinedHistory.length, 5);
      announce(`Lançamento conjunto: número ${n.value}, categoria ${l.value}, ${l.title}`);
    }
    combined = false; updateButtons();
  }
  $('rollNumber').addEventListener('click', rollNumber);
  $('rollLetter').addEventListener('click', rollLetter);
  $('rollBoth').addEventListener('click', rollBoth);
  select.addEventListener('change', () => {
    if (combined || alphabetic.running) { select.value = config.preset; return; }
    const preset = select.value;
    config = { preset, faces: preset === 'mix' ? MIX_CATEGORIES : preset === 'custom' ? (safeFaces(config.faces) ?? CLASSIC_CATEGORIES) : CLASSIC_CATEGORIES };
    saveSetting('category-profile', config);
    alphabetic.setFaces(faces());
    letter = null; setResult($('letterResult'), null); $('letterLabel').textContent = 'Aguardando lançamento';
    updateCombined(); showFields();
  });
  setupCategoryEditor(config, state => {
    if (combined || alphabetic.running) return;
    config = state; select.value = 'custom'; alphabetic.setFaces(faces());
    letter = null; setResult($('letterResult'), null); $('letterLabel').textContent = 'Aguardando lançamento';
    updateCombined(); showFields();
  });
  function showFields() {
    $('categoryEditor').hidden = config.preset !== 'custom';
    populateCategoryEditor(config.faces);
  }
  showFields();
  updateButtons();
}

function setupBuilder() {
  const host = $('builderDice');
  const selection = $('builderType');
  const entries = [];
  let id = 1;
  let isRollingAll = false;
  function save() {
    const data = entries.map(entry => ({ type: entry.type, title: entry.title, faces: entry.faces }));
    saveSetting('builder-list', data);
  }
  function syncControls() {
    $('rollAll').disabled = isRollingAll || entries.length === 0 || entries.some(x => x.die.running);
    $('clearBuilder').disabled = isRollingAll || entries.some(x => x.die.running) || entries.length === 0;
    $('addBuilder').disabled = isRollingAll || entries.length >= 6;
    $('builderType').disabled = isRollingAll;
    $('applyCustomFaces').disabled = isRollingAll;
    $('builderSummary').textContent = `${entries.length} ${entries.length === 1 ? 'dado configurado' : 'dados configurados'}`;
  }
  function add(type, custom = null, restore = false) {
    if (entries.length >= 6) return;
    const currentId = id++;
    const faces = custom?.faces ?? (TYPES[type]?.faces ?? TYPES.D6.faces);
    const title = custom?.title ?? type;
    const card = document.createElement('article'); card.className = 'builder-card';
    const head = document.createElement('div'); head.className = 'builder-card__head';
    const name = document.createElement('h3'); name.textContent = title;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'small-text-button'; remove.textContent = 'Remover';
    head.append(name, remove);
    const holder = document.createElement('div'); holder.className = 'builder-card__stage';
    const result = document.createElement('strong'); result.className = 'builder-card__result'; result.textContent = '—';
    const caption = document.createElement('span'); caption.className = 'builder-card__caption'; caption.textContent = 'Aguardando lançamento';
    const rollButton = document.createElement('button'); rollButton.type = 'button'; rollButton.className = 'button button--outline'; rollButton.textContent = 'Rolar este dado';
    card.append(head, holder, result, caption, rollButton);
    host.append(card);
    const entry = { id: currentId, type, title, faces, card, die: null, result: null, count: 0 };
    const die = new DiceController(holder, {
      title, variant: type === 'CUSTOM' ? 'letter' : 'numeric', faces,
      onTap: () => !isRollingAll && die.roll(),
      onStart: () => { rollButton.disabled = true; remove.disabled = true; syncControls(); },
      onFinish: picked => {
        entry.result = picked;
        entry.count++;
        setResult(result, picked);
        caption.textContent = picked.title === picked.value ? `${entry.count} ${entry.count === 1 ? 'jogada' : 'jogadas'}` : picked.title;
        rollButton.disabled = false; remove.disabled = false;
        syncControls();
        announce(`${title}: ${picked.value}`);
      }
    });
    entry.die = die;
    rollButton.addEventListener('click', () => { if (!isRollingAll) die.roll(); });
    remove.addEventListener('click', () => {
      if (entry.die.running || isRollingAll) return;
      host.removeChild(card);
      entries.splice(entries.indexOf(entry), 1);
      save(); syncControls();
    });
    entries.push(entry);
    if (!restore) save();
    syncControls();
  }
  function parseCustom() {
    const lines = $('customFaces').value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    if (lines.length !== 6) { $('builderFeedback').textContent = 'Informe exatamente seis faces, uma por linha.'; return null; }
    const prepared = safeFaces(lines.map(x => {
      const [value, ...description] = x.split('|'); return { value, title: description.join('|').trim() || value };
    }));
    if (!prepared) { $('builderFeedback').textContent = 'Nenhuma face pode ficar vazia.'; return null; }
    $('builderFeedback').textContent = 'Dado personalizado adicionado.';
    return prepared;
  }
  $('addBuilder').addEventListener('click', () => add(selection.value));
  $('applyCustomFaces').addEventListener('click', () => {
    const faces = parseCustom(); if (faces) add('CUSTOM', { title: 'Personalizado', faces });
  });
  $('rollAll').addEventListener('click', async () => {
    if (!entries.length || isRollingAll || entries.some(x => x.die.running)) return;
    isRollingAll = true; syncControls();
    const results = await Promise.all(entries.map(entry => entry.die.roll()));
    const values = results.filter(Boolean).map(x => x.value);
    const allNumeric = values.length && values.every(x => /^\d+$/.test(x));
    $('builderTotal').textContent = allNumeric ? `Soma: ${values.reduce((acc, x) => acc + Number(x), 0)}` : `Resultados: ${values.join(' · ')}`;
    isRollingAll = false; syncControls();
    announce($('builderTotal').textContent);
  });
  $('clearBuilder').addEventListener('click', () => {
    if (isRollingAll || entries.some(x => x.die.running)) return;
    entries.length = 0; host.replaceChildren(); $('builderTotal').textContent = '—'; save(); syncControls();
  });
  const stored = readSetting('builder-list', null);
  if (Array.isArray(stored) && stored.length) {
    stored.slice(0, 6).forEach(item => {
      if (item?.type === 'CUSTOM') {
        const faces = safeFaces(item.faces);
        if (faces) add('CUSTOM', { title: String(item.title || 'Personalizado').slice(0,30), faces }, true);
      } else if (TYPES[item?.type]) add(item.type, null, true);
    });
  }
  if (!entries.length && !Array.isArray(stored)) { add('D6', null, true); add('D6', null, true); }
  save(); syncControls();
}

const page = document.body.dataset.page;
if (page === 'traditional') setupTraditional();
else if (page === 'letters') setupLetters();
else if (page === 'image-action') setupGame();
else if (page === 'builder') setupBuilder();
