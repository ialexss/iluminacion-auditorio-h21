'use strict';

function iniciarCobertura(colocarColgantes) {
  const {layouts, recommended, seats, calculate} = window.Fotometria;
  const el = id => document.getElementById(id);
  const number = (value, digits = 0) => value.toLocaleString('es-BO', {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  });
  // Conservar la distinción entre cobertura casi completa y completa al redondear.
  const percent = ratio => ratio < 1 && ratio > .999 ? '> 99,9 %' : number(100 * ratio, ratio === 1 ? 0 : 1) + ' %';
  const map = el('coverage-map');
  const mapContext = map.getContext('2d');
  const layer = document.createElement('canvas');
  const layerContext = layer.getContext('2d');
  const colors = [[111,99,146],[205,196,224],[194,227,208],[121,190,169],[66,151,138]];
  const edited = new Map();
  let count = recommended;
  const positions = () => edited.get(count) || layouts[count];
  const refSize = () => layouts[count].length;
  function save(points) {
    if (JSON.stringify(points) === JSON.stringify(layouts[count])) edited.delete(count);
    else edited.set(count, points);
    // Sincronizar equipo, selección, mapa y lux antes de la siguiente operación.
    if (nextFrame !== undefined) cancelAnimationFrame(nextFrame);
    update();
  }
  let nextFrame;
  let layoutKey = '';

  function drawMap(result) {
    const {width, height, step, x0, z0, values} = result.raster;
    if (layer.width !== width || layer.height !== height) {
      layer.width = width;
      layer.height = height;
    }
    const pixels = layerContext.createImageData(width, height);
    for (let i = 0; i < values.length; i++) {
      const lux = values[i];
      if (lux < 0) continue;
      const col = colors[lux < 100 ? 0 : lux < 150 ? 1 : lux < 200 ? 2 : lux < 300 ? 3 : 4];
      const offset = i * 4;
      pixels.data[offset] = col[0];
      pixels.data[offset + 1] = col[1];
      pixels.data[offset + 2] = col[2];
      pixels.data[offset + 3] = 255;
    }
    layerContext.putImageData(pixels, 0, 0);
    const border = 10;
    const scale = (map.width - border * 2) / width;
    const drawingHeight = Math.ceil(height * scale + border * 2);
    if (map.height !== drawingHeight) map.height = drawingHeight;
    mapContext.clearRect(0, 0, map.width, map.height);
    mapContext.imageSmoothingEnabled = false;
    mapContext.drawImage(layer, border, border, width * scale, height * scale);
    const px = x => border + ((x - x0) / step + .5) * scale;
    const py = z => border + ((z - z0) / step + .5) * scale;
    mapContext.fillStyle = '#24383a';
    mapContext.beginPath();
    for (const [x,z] of seats) {
      mapContext.moveTo(px(x) + 3.1, py(z));
      mapContext.arc(px(x), py(z), 3.1, 0, 2 * Math.PI);
    }
    mapContext.fill();
    for (const [x,z] of positions()) {
      const cx = px(x), cy = py(z);
      mapContext.fillStyle = '#fff';
      mapContext.strokeStyle = '#273433';
      mapContext.lineWidth = 2;
      mapContext.beginPath(); mapContext.arc(cx, cy, 8.5, 0, 2 * Math.PI);
      mapContext.fill(); mapContext.stroke();
      mapContext.beginPath();
      mapContext.moveTo(cx-4.5,cy); mapContext.lineTo(cx+4.5,cy);
      mapContext.moveTo(cx,cy-4.5); mapContext.lineTo(cx,cy+4.5);
      mapContext.stroke();
    }
    map.setAttribute('aria-label', 'Mapa con ' + result.count + ' colgantes a ' + number(result.height,2) +
      ' m. ' + result.seats150 + ' de ' + seats.length + ' butacas alcanzan 150 lux.');
  }

  function update() {
    nextFrame = undefined;
    const height = Number(el('height').value);
    const plane = Number(el('plane').value);
    const active = positions();
    const key = JSON.stringify([active,height]);
    if (key !== layoutKey) {
      colocarColgantes(active, height);
      layoutKey = key;
    }
    const r = calculate(count, height, plane, active);
    const areaRatio = r.area150 / r.totalArea;
    const complete = r.gridMin >= 150 && r.seats150 === seats.length;
    drawMap(r);
    el('seat-result').textContent = r.seats150 + ' / ' + seats.length;
    el('seat-percent').textContent = percent(r.seats150 / seats.length) + ' de las butacas';
    el('area-result').textContent = number(r.area150,1) + ' m²';
    el('area-percent').textContent = percent(areaRatio) + ' de ' + number(r.totalArea,1) + ' m²';
    el('min-result').textContent = number(r.gridMin,1) + ' lx';
    el('seat-min').textContent = number(r.seatMin,1) + ' lx en la butaca más oscura';
    el('layout-note').textContent = edited.has(count)
      ? 'Distribución editada · ' + active.length + ' puntos en sala.'
      : count === recommended ? 'Planta DUC · cinco filas de nueve puntos. Los lux usan una misma óptica de ensayo en ambos tipos.' : 'Distribución de referencia · ' + count + ' colgantes en sala.';
    const level = plane ? 'de lectura' : 'del piso';
    el('comparison-result').textContent = complete
      ? 'En la simulación a ' + number(height,2) + ' m, todas las butacas y los pasillos de la retícula alcanzan el objetivo en el plano ' + level + '.'
      : 'A ' + number(height,2) + ' m, ' + (seats.length - r.seats150 === 0 ? 'todas las butacas alcanzan el objetivo' : (seats.length - r.seats150) + ' butacas quedan por debajo de 150 lx') +
        '. En el plano ' + level + ', ' + (r.totalArea-r.area150 > 0 && r.totalArea-r.area150 < .1 ? 'menos de 0,1' : number(r.totalArea-r.area150,1)) + ' m² quedan bajo el umbral.';
    const diameter = 2 * (height - plane) * Math.tan(plantaAuditorio.sala.haz * Math.PI / 360);
    el('spot-diameter').textContent = number(diameter,2) + ' m';
    el('spot-area').textContent = number(Math.PI * diameter**2 / 4,2);
  }
  function scheduleUpdate() {
    if (nextFrame === undefined) nextFrame = requestAnimationFrame(update);
  }
  function changeHeight(value) {
    for (const id of ['height','viewer-height']) {
      el(id).value = value;
      el(id).setAttribute('aria-valuetext', number(Number(value),2) + ' metros sobre el piso');
      el(id+'-value').textContent = number(Number(value),2) + ' m';
    }
    scheduleUpdate();
  }
  for (const size of Object.keys(layouts).map(Number).sort((a,b) => a - b)) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.count = size;
    button.textContent = size===recommended?'45 · plano DUC':size+' · alternativa';
    button.setAttribute('aria-pressed',String(size === count));
    button.addEventListener('click', () => {
      count = size;
      for (const other of el('house-count').children) other.setAttribute('aria-pressed',String(other === button));
      if (nextFrame !== undefined) cancelAnimationFrame(nextFrame);
      update();
    });
    el('house-count').append(button);
  }
  for (const id of ['height','viewer-height']) el(id).addEventListener('input',e => changeHeight(e.target.value));
  el('plane').addEventListener('change',scheduleUpdate);
  changeHeight(el('height').value);
  cancelAnimationFrame(nextFrame);
  update();
  return {
    referenceCount: () => count,
    isAdded: index => index >= refSize(),
    move(index,x,z) {
      if (!positions()[index] || !window.Fotometria.withinHall(x,z)) return false;
      const points = positions().slice(); points[index] = [x,z]; save(points);
      return true;
    },
    add(index) {
      const [x,z] = positions()[index];
      for (const radius of [.65,1.05,1.55]) {
        for (let turn=0; turn<12; turn++) {
          const a = turn * Math.PI / 6;
          const nx = Number((x + radius*Math.cos(a)).toFixed(2)), nz = Number((z + radius*Math.sin(a)).toFixed(2));
          if (!window.Fotometria.withinHall(nx,nz) || positions().some(([px,pz]) => Math.hypot(px-nx,pz-nz)<.45)) continue;
          const points = [...positions(),[nx,nz]]; save(points); return points.length-1;
        }
      }
      return -1;
    },
    remove(index) {
      if (index < refSize() || index >= positions().length) return false;
      save(positions().filter((_,i) => i !== index)); return true;
    },
    reset(index) {
      if (!layouts[count][index]) return;
      const points = positions().slice(); points[index] = layouts[count][index];
      save(points);
    }
  };
}
