const canvas = document.getElementById('energyChart');
const ctx = canvas.getContext('2d');

let graphData = { t: [], ep: [], ec: [] };
let maxGraphTime = 5;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = 180 * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function drawGraph() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;
  ctx.clearRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#2a3142';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  if (graphData.t.length < 2) return;

  const maxEp = Math.max(...graphData.ep, 1);
  const scaleX = w / Math.max(maxGraphTime, graphData.t[graphData.t.length - 1]);
  const scaleY = (h - 10) / maxEp;

  // Potencial (cyan)
  ctx.beginPath();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  graphData.t.forEach((t, i) => {
    const x = t * scaleX;
    const y = h - graphData.ep[i] * scaleY;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Cinética (orange)
  ctx.beginPath();
  ctx.strokeStyle = '#ff6b35';
  graphData.t.forEach((t, i) => {
    const x = t * scaleX;
    const y = h - graphData.ec[i] * scaleY;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function resetGraph() {
  graphData = { t: [], ep: [], ec: [] };
  drawGraph();
}

const masaInput = document.getElementById('masa');
const alturaInput = document.getElementById('altura');
const gravedadInput = document.getElementById('gravedad');
const btnStart = document.getElementById('btnStart');
const btnReset = document.getElementById('btnReset');

const masaVal = document.getElementById('masaVal');
const alturaVal = document.getElementById('alturaVal');
const gravVal = document.getElementById('gravVal');

const objectEl = document.getElementById('object');
const heightMarker = document.getElementById('heightMarker');
const alturaActual = document.getElementById('alturaActual');
const tiempoEl = document.getElementById('tiempo');
const velEl = document.getElementById('vel');
const epEl = document.getElementById('ep');
const ecEl = document.getElementById('ec');
const emEl = document.getElementById('em');
const barPot = document.getElementById('barPot');
const barKin = document.getElementById('barKin');
const pctPot = document.getElementById('pctPot');
const pctKin = document.getElementById('pctKin');
const tableBody = document.getElementById('tableBody');

let animating = false;
let startTime = null;
let animationId = null;
let initialHeight = 20;
let mass = 2;
let g = 9.81;

function updateParams() {
  mass = parseFloat(masaInput.value);
  initialHeight = parseFloat(alturaInput.value);
  g = parseFloat(gravedadInput.value);
  masaVal.textContent = mass.toFixed(1);
  alturaVal.textContent = initialHeight;
  gravVal.textContent = g.toFixed(2);
  heightMarker.textContent = initialHeight + ' m';
  updateDisplay(0, initialHeight, 0);
  generateTable();
}

function updateDisplay(t, h, v) {
  const ep = mass * g * h;
  const ec = 0.5 * mass * v * v;
  const em = ep + ec;

  alturaActual.textContent = h.toFixed(1);
  tiempoEl.textContent = t.toFixed(2);
  velEl.textContent = v.toFixed(2);
  epEl.textContent = ep.toFixed(2);
  ecEl.textContent = ec.toFixed(2);
  emEl.textContent = em.toFixed(2);

  const maxEp = mass * g * initialHeight;
  const potPct = maxEp > 0 ? (ep / maxEp) * 100 : 0;
  const kinPct = maxEp > 0 ? (ec / maxEp) * 100 : 0;
  barPot.style.width = potPct + '%';
  barKin.style.width = kinPct + '%';
  pctPot.textContent = potPct.toFixed(0) + '%';
  pctKin.textContent = kinPct.toFixed(0) + '%';

  // Position object
  const zoneHeight = document.getElementById('dropZone').clientHeight - 28;
  const pos = (h / initialHeight) * zoneHeight;
  objectEl.style.bottom = pos + 'px';

  // Add to graph
  if (animating || graphData.t.length === 0) {
    graphData.t.push(t);
    graphData.ep.push(ep);
    graphData.ec.push(ec);
    if (graphData.t.length > 300) {
      graphData.t.shift();
      graphData.ep.shift();
      graphData.ec.shift();
    }
    drawGraph();
  }
}

function generateTable() {
  tableBody.innerHTML = '';
  const steps = [0, 0.25, 0.5, 0.75, 1];
  steps.forEach(frac => {
    const h = initialHeight * (1 - frac);
    const v = Math.sqrt(2 * g * (initialHeight - h));
    const ep = mass * g * h;
    const ec = 0.5 * mass * v * v;
    const em = ep + ec;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${(frac*100).toFixed(0)}%</td>
      <td>${h.toFixed(1)}</td>
      <td>${v.toFixed(2)}</td>
      <td>${ep.toFixed(1)}</td>
      <td>${ec.toFixed(1)}</td>
      <td>${em.toFixed(1)}</td>
    `;
    tableBody.appendChild(tr);
  });
}

function animate(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = (timestamp - startTime) / 1000;
  const fallTime = Math.sqrt(2 * initialHeight / g);
  const t = Math.min(elapsed, fallTime);
  const h = Math.max(0, initialHeight - 0.5 * g * t * t);
  const v = g * t;

  updateDisplay(t, h, v);

  if (t < fallTime && animating) {
    animationId = requestAnimationFrame(animate);
  } else {
    animating = false;
    btnStart.textContent = '▶ Iniciar caída';
  }
}

btnStart.addEventListener('click', () => {
  if (animating) return;
  animating = true;
  startTime = null;
  btnStart.textContent = 'En curso...';
  animationId = requestAnimationFrame(animate);
});

btnReset.addEventListener('click', () => {
  animating = false;
  if (animationId) cancelAnimationFrame(animationId);
  startTime = null;
  btnStart.textContent = '▶ Iniciar caída';
  resetGraph();
  updateParams();
});

masaInput.addEventListener('input', updateParams);
alturaInput.addEventListener('input', updateParams);
gravedadInput.addEventListener('input', updateParams);

// Init
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
updateParams();
drawGraph();
