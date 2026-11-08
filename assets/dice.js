/** Motor sem dependências: resultados independentes da apresentação 3D. */
export const COLOR_PALETTE = [
  ['#a99aff', '#7969f2'], ['#ffd78b', '#efa950'],
  ['#73d8ff', '#3e9ddc'], ['#81ebc7', '#30bd9f'],
  ['#ffbb92', '#f17b6b'], ['#ffa1c4', '#e96eaa']
];

export function randomInteger(max) {
  if (!Number.isSafeInteger(max) || max < 1 || max > 0x100000000) throw new RangeError('Quantidade de faces inválida');
  const range = 0x100000000;
  const limit = Math.floor(range / max) * max;
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1);
    let value;
    do { globalThis.crypto.getRandomValues(buffer); value = buffer[0]; } while (value >= limit);
    return value % max;
  }
  return Math.floor(Math.random() * max);
}

export function facesFromCount(count) {
  if (!Number.isInteger(count) || count < 2 || count > 20) throw new RangeError('Use entre 2 e 20 faces');
  return Array.from({ length: count }, (_, i) => ({ value: String(i + 1), title: `Número ${i + 1}` }));
}

const FACE_POSITIONS = [
  { label: 'front', index: 0, x: 0, y: 0 },
  { label: 'back', index: 5, x: 0, y: 180 },
  { label: 'right', index: 2, x: 0, y: -90 },
  { label: 'left', index: 3, x: 0, y: 90 },
  { label: 'top', index: 1, x: -90, y: 0 },
  { label: 'bottom', index: 4, x: 90, y: 0 }
];
const isReducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function drawPips(face, count) {
  const spots = {
    1: ['c'], 2: ['tl', 'br'], 3: ['tl', 'c', 'br'],
    4: ['tl', 'tr', 'bl', 'br'],
    5: ['tl', 'tr', 'c', 'bl', 'br'],
    6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br']
  };
  for (const spot of (spots[count] ?? [])) {
    const pip = document.createElement('span');
    pip.className = `pip pip--${spot}`;
    face.append(pip);
  }
}
function polygon(sides) {
  return `polygon(${Array.from({ length: Math.max(3, Math.min(20, sides)) }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / Math.max(3, Math.min(20, sides));
    return `${(50 + 49 * Math.cos(angle)).toFixed(3)}% ${(50 + 49 * Math.sin(angle)).toFixed(3)}%`;
  }).join(',')})`;
}

/** D6 tem faces físicas em CSS 3D; os demais tipos usam um marcador poligonal animado. */
export class DiceController {
  constructor(host, { faces, title = 'Dado', variant = 'numeric', onTap = null, onStart = null, onFinish = null } = {}) {
    if (!host) throw new Error('Elemento de montagem inexistente');
    this.host = host;
    this.title = title;
    this.variant = variant;
    this.onTap = onTap;
    this.onStart = onStart;
    this.onFinish = onFinish;
    this.running = false;
    this.xTurns = 0;
    this.yTurns = 0;
    this.lastResult = null;
    this.faces = [];
    this.setFaces(faces ?? facesFromCount(6));
  }

  setFaces(faces) {
    if (this.running) return false;
    if (!Array.isArray(faces) || faces.length < 2 || faces.length > 20) throw new RangeError('O dado deve ter de 2 a 20 faces');
    this.faces = faces.map((entry, i) => ({
      value: String(entry.value ?? i + 1),
      title: String(entry.title ?? entry.value ?? i + 1)
    }));
    this.lastResult = null;
    this.host.replaceChildren();
    this.button = document.createElement('button');
    this.button.className = 'dice-hit';
    this.button.type = 'button';
    this.button.setAttribute('aria-label', `Rolar ${this.title}`);
    this.button.title = `Toque para rolar ${this.title.toLowerCase()}`;
    this.button.addEventListener('click', () => this.onTap?.());
    this.host.append(this.button);
    if (this.faces.length === 6) this.buildCube();
    else this.buildPoly();
    return true;
  }

  buildCube() {
    const float = document.createElement('span');
    float.className = 'dice-float';
    this.cube = document.createElement('span');
    this.cube.className = 'dice-cube';
    this.cube.style.transform = 'rotateX(-18deg) rotateY(-24deg)';
    for (let i = 0; i < FACE_POSITIONS.length; i++) {
      const { label, index } = FACE_POSITIONS[i];
      const tile = document.createElement('span');
      const face = this.faces[index];
      tile.className = `dice-face dice-face--${label}`;
      const colors = COLOR_PALETTE[index % COLOR_PALETTE.length];
      tile.style.setProperty('--face-start', colors[0]);
      tile.style.setProperty('--face-end', colors[1]);
      if (this.variant === 'numeric' && /^\d$/.test(face.value) && +face.value === index + 1) {
        drawPips(tile, index + 1);
      } else {
        const glyph = document.createElement('span');
        glyph.className = 'dice-glyph';
        glyph.textContent = face.value;
        tile.append(glyph);
      }
      this.cube.append(tile);
    }
    float.append(this.cube);
    this.button.append(float);
    this.float = float;
    this.poly = null;
  }

  buildPoly() {
    this.poly = document.createElement('span');
    this.poly.className = 'dice-poly';
    this.poly.style.clipPath = polygon(this.faces.length);
    this.poly.style.setProperty('--face-start', COLOR_PALETTE[0][0]);
    this.poly.style.setProperty('--face-end', COLOR_PALETTE[0][1]);
    this.glyph = document.createElement('span');
    this.glyph.className = 'dice-poly__glyph';
    this.glyph.textContent = '?';
    this.poly.append(this.glyph);
    this.button.append(this.poly);
    this.cube = null;
  }

  async roll() {
    if (this.running) return null;
    this.running = true;
    this.button.disabled = true;
    this.host.classList.add('is-rolling');
    this.onStart?.();
    const index = randomInteger(this.faces.length);
    const duration = isReducedMotion() ? 20 : 1550;
    if (this.cube) {
      // Índices de resultados na ordem das seis faces lógicas.
      const orientation = [
        { x: 0, y: 0 }, { x: -90, y: 0 }, { x: 0, y: -90 },
        { x: 0, y: 90 }, { x: 90, y: 0 }, { x: 0, y: 180 }
      ][index];
      this.xTurns += 3 + randomInteger(2);
      this.yTurns += 3 + randomInteger(2);
      this.cube.style.transitionDuration = `${duration}ms`;
      requestAnimationFrame(() => {
        this.cube.style.transform = `rotateX(${this.xTurns * 360 + orientation.x}deg) rotateY(${this.yTurns * 360 + orientation.y}deg)`;
      });
    } else if (this.poly) {
      this.poly.classList.add('dice-poly--rolling');
    }
    await delay(duration + 35);
    const selected = { ...this.faces[index], index };
    this.lastResult = selected;
    if (this.poly) {
      const colors = COLOR_PALETTE[index % COLOR_PALETTE.length];
      this.poly.style.setProperty('--face-start', colors[0]);
      this.poly.style.setProperty('--face-end', colors[1]);
      this.glyph.textContent = selected.value;
      this.poly.classList.remove('dice-poly--rolling');
    }
    this.host.classList.remove('is-rolling');
    this.host.classList.add('has-landed');
    setTimeout(() => this.host.classList.remove('has-landed'), 450);
    this.running = false;
    this.button.disabled = false;
    this.onFinish?.(selected);
    if (navigator.vibrate) navigator.vibrate(25);
    return selected;
  }
}
