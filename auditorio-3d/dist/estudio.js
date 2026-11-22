'use strict';

const byId = id => document.getElementById(id);
const cameras = {
  orbit: ['Perspectiva', 'Perspectiva general'],
  front: ['Escenario', 'Frente del escenario'],
  left: ['Danza izquierda', 'Tarima izquierda'],
  right: ['Danza derecha', 'Tarima derecha'],
  top: ['Planta', 'Distribución en planta'],
  side: ['Corte lateral', 'Corte longitudinal'],
  seats: ['Butacas', 'Desde las butacas']
};
const zones = {
  house: ['Sala RGBW', 'Colgantes sobre las butacas, con blanco regulable para lectura y color para eventos.'],
  front: ['Frontal existente', 'Dos Fresnel P3 en los extremos, dos COB P2 hacia el interior y cuatro PAR P4 en el centro. El enfoque se ajusta en cada aparato.'],
  top: ['Superior del escenario', 'Tres Fresnel sobre la banda y las voces distribuyen el blanco a lo ancho del escenario.'],
  back: ['Contraluz', 'Tres PAR detrás de los intérpretes perfilan las siluetas contra el fondo.'],
  left: ['Danza izquierda', 'Dos perfiles frontales cruzados iluminan las caras. Un Fresnel alto detrás de la tarima izquierda dibuja el contorno de brazos y hombros.'],
  right: ['Danza derecha', 'La tarima derecha replica el montaje junto a su escalera lateral. Dos perfiles dan luz frontal y un Fresnel entra en diagonal desde atrás.'],
  moving: ['Móviles MH4–MH7', 'Cuatro móviles sobre el público se orientan hacia las tarimas o hacia los muros.'],
  bars: ['Barras de piso', 'Las barras lineales de la base del banner distribuyen color de abajo hacia arriba.'],
  par: ['PAR LED de piso', 'Dos PAR de cada lado del escenario apuntan desde el piso hacia el banner trasero.']
};
const presets = {
  dance: {name:'Danza', levels:[16,30,20,60,100,100,78,85,72], color:'#599dff', aim:'dance',
    scenicColors:{back:'#18baba',moving:'#49e4ff',bars:'#244dff',par:'#2cd2e2'},
    description:'Los perfiles iluminan las caras en ambas tarimas y los Fresnel posteriores dibujan los hombros. Los móviles añaden un acento cian.'},
  sermon:{name:'Prédica', levels:[24,100,48,18,0,0,0,40,26], color:'#ffe3b5', aim:'dance',
    scenicColors:{back:'#ffa257',moving:'#ffe3b5',bars:'#e59a51',par:'#ffcf84'},
    description:'El blanco cálido concentra la atención en el púlpito. El fondo queda ámbar y las tarimas se apagan.'},
  event: {name:'Evento', levels:[35,50,35,80,12,12,95,100,95], color:'#aa7bfa', aim:'walls',
    scenicColors:{back:'#ff539e',moving:'#3ce2f4',bars:'#8a35fa',par:'#ff4098'},
    description:'El violeta y el magenta bañan el banner. Los cuatro móviles dirigen haces cian hacia los muros laterales.'},
  work:  {name:'Trabajo', levels:[100,80,100,0,85,85,0,0,0], color:'#fff4da', aim:'dance', scenicColors:{},
    description:'Luz blanca sobre el escenario, ambas tarimas y las butacas para ensayos y montaje.'},
  hall:  {name:'Solo sala', levels:[100,0,0,0,0,0,0,0,0], color:'#fff4da', aim:'dance', scenicColors:{},
    description:'Solo se encienden los colgantes del público. Esta escena corresponde al cálculo de cobertura en blanco al 100 %.'}
};
const palette = {'#fff4da':'Blanco', '#ffe3b5':'Ámbar', '#599dff':'Azul', '#aa7bfa':'Violeta'};
const icons = {
  expand:'M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6',
  minus:'M5 12h14', plus:'M5 12h14m-7-7v14',
  reset:'M4 8a8 8 0 1 1 .5 9M4 3v5h5',
  download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5'
};
document.querySelectorAll('[data-icon]').forEach(el => {
  el.innerHTML = '<svg aria-hidden="true" class="icon" viewBox="0 0 24 24"><path d="'+icons[el.dataset.icon]+'"/></svg>';
});
const state = {level:{}, on:{}, color:'#599dff', scenicColors:{}, aim:'dance', monochrome:false, scene:'dance'};
let selected = 'house';
let model, editor;
let currentCamera = 'orbit';
let lastPreset = 'dance';
let inventory = 'all';
const inventoryNotes = {
  existing:'Ocho frontales P2, P3 y P4, cuatro móviles MH4–MH7 sobre el público y cuatro PAR LED de piso. La cantidad de barras de piso es aproximada.',
  all:'El montaje completo reúne las luces instaladas y la propuesta para danza, escenario y público.',
  proposed:'Cada tarima tiene un truss frontal y un soporte posterior. Se añaden luces superiores y de contraluz en el escenario y colgantes en sala.'
};
const soloDescriptions = {
  existing:{
    dance:'Los móviles apuntan a las tarimas. El banner recibe azul y cian desde el piso.',
    sermon:'Los frontales iluminan a quien predica y las luces de piso dan un fondo ámbar.',
    event:'Los móviles pasan a los muros laterales y el banner combina violeta y magenta.',
    work:'Los frontales aportan blanco al escenario.',
    hall:'Los colgantes de sala son parte de la propuesta. El alumbrado general actual carece de fotometría en el modelo.'
  },
  proposed:{
    dance:'Dos perfiles se cruzan delante de cada tarima. Desde el lado de la escalera, un Fresnel posterior ilumina hombros y brazos.',
    sermon:'Los Fresnel superiores refuerzan el escenario y los colgantes dan luz tenue a las butacas.',
    event:'El contraluz baña las siluetas en magenta y la sala toma un tono violeta.',
    work:'Blanco para trabajar en las tarimas, el escenario y la sala.',
    hall:'Los colgantes iluminan el público en blanco al 100 %, como en el mapa de cobertura.'
  }
};
function previewUrl(camera, mode=inventory) {
  return 'recursos/vistas/' + (mode === 'all' ? '' : mode + '/') + (lastPreset === 'dance' ? '' : lastPreset + '/') + camera + '.webp';
}
function refreshPreviews() {
  byId('cameras').querySelectorAll('button').forEach(b => b.querySelector('img').src = previewUrl(b.dataset.camera).replace('recursos/vistas/','recursos/miniaturas/'));
  if (byId('viewer').classList.contains('static')) setViewLabel(currentCamera);
  updatePair();
}
function updatePair() {
  if (!byId('compare-pair').open) return;
  const camera = cameras[currentCamera] ? currentCamera : 'orbit';
  byId('before-image').src = previewUrl(camera,'existing');
  byId('after-image').src = previewUrl(camera,'all');
  byId('compare-caption').textContent = 'Montaje de referencia a 4,66 m · '+presets[lastPreset].name+' · '+cameras[camera][1]+'. La maqueta interactiva de arriba incorpora tus ajustes.';
}
function changeInventory(mode) {
  inventory = mode;
  model?.inventory(mode);
  byId('inventory').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.inventory === mode)));
  byId('inventory-description').textContent = inventoryNotes[mode];
  refreshPreviews(); sync(); editor?.refresh();
}
byId('inventory').querySelectorAll('button').forEach(b => b.onclick = () => changeInventory(b.dataset.inventory));
byId('compare-pair').ontoggle = updatePair;

function setViewLabel(key) {
  currentCamera = key; updatePair();
  byId('view-name').textContent = cameras[key]?.[1] || 'Detalle de luminaria';
  editor?.cameraChanged(key);
  byId('cameras').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.camera === key)));
  if (!model && byId('viewer').classList.contains('static')) {
    byId('poster').src = previewUrl(key);
    byId('poster').alt = cameras[key][1];
  }
}
function setCamera(key) {
  if (model) model.cameraMode(key);
  else setViewLabel(key);
}
for (const [key, [name]] of Object.entries(cameras)) {
  const button = document.createElement('button');
  button.type = 'button'; button.dataset.camera = key; button.className = 'angle';
  const thumb = document.createElement('img');
  thumb.alt = ''; thumb.src = previewUrl(key).replace('recursos/vistas/','recursos/miniaturas/'); thumb.decoding = 'async';
  thumb.width = 192; thumb.height = 78;
  const caption = document.createElement('span'); caption.textContent = name;
  button.append(thumb, caption); button.addEventListener('click', () => setCamera(key));
  byId('cameras').append(button);
}
function actualizarDescripcion() {
  const hasCustom=model?.fixtures().some(f => f.aimLabel);
  byId('scene-caption').textContent = hasCustom
    ? 'Enfoque personalizado. Los destinos que elegiste se conservan al cambiar de escena.'
    : state.scene ? (soloDescriptions[inventory]?.[state.scene] || presets[state.scene].description) : 'Escena manual. El visor muestra los ajustes de cada grupo.';
}
function sync() {
  actualizarDescripcion();
  byId('presets').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.key === state.scene)));
  byId('zone').value = selected;
  byId('enabled').checked = state.on[selected];
  byId('dimmer').value = state.on[selected] ? state.level[selected] : 0;
  byId('percent').textContent = byId('dimmer').value+' %';
  byId('group-detail').textContent = zones[selected][1];
  byId('dance-rim').checked = state.danceRim!==false;
  byId('dance-rim').disabled = !model || inventory==='existing';
  byId('colors').hidden = selected !== 'house';
  byId('palette').value = state.color;
  byId('aim').hidden = selected !== 'moving';
  byId('aim-choice').value = state.aim;
  byId('show-color').checked = !state.monochrome;
  model?.update(state);
  editor?.updateOptics();
}
function selectZone(key) {
  selected = key;
  model?.locate(key);
  sync();
}
function applyPreset(key) {
  const preset = presets[key];
  state.danceRim = true;
  state.scene = key; state.color = preset.color; state.aim = preset.aim;
  state.scenicColors = preset.scenicColors;
  if (lastPreset !== key) {
    lastPreset = key;
    refreshPreviews();
  }
  Object.keys(zones).forEach((g, i) => {
    state.level[g] = preset.levels[i]; state.on[g] = preset.levels[i] > 0;
  });
  model?.locate(null);
  sync();
}
function customize() { state.scene = null; sync(); }
for (const [key, preset] of Object.entries(presets)) {
  const b = document.createElement('button'); b.type = 'button';
  b.dataset.key = key; b.textContent = preset.name;
  b.addEventListener('click', () => applyPreset(key));
  byId('presets').append(b);
}
for (const [key, [name]] of Object.entries(zones)) byId('zone').add(new Option(name,key));
for (const [value, name] of Object.entries(palette)) byId('palette').add(new Option(name,value));
byId('zone').onchange = e => selectZone(e.target.value);
byId('controls').ontoggle = () => model?.locate(byId('controls').open ? selected : null);
byId('dimmer').oninput = e => {
  state.level[selected] = Number(e.target.value); state.on[selected] = state.level[selected] > 0; customize();
};
byId('enabled').onchange = e => {
  state.on[selected] = e.target.checked;
  if (e.target.checked && !state.level[selected]) state.level[selected] = 65;
  customize();
};
byId('palette').onchange = e => { state.color = e.target.value; state.monochrome = false; customize(); };
byId('aim-choice').onchange = e => { state.aim = e.target.value; customize(); };
byId('show-color').onchange = e => { state.monochrome = !e.target.checked; sync(); };
byId('beams').onchange = e => model?.beams(e.target.checked);
byId('dance-rim').onchange = e => {state.danceRim=e.target.checked;customize();};
byId('labels').onchange = e => model?.labels(e.target.checked);
byId('roof').onchange = e => model?.roof(e.target.checked);
byId('zoom-in').onclick = () => model?.zoomBy(1.15);
byId('zoom-out').onclick = () => model?.zoomBy(1/1.15);
byId('reset-camera').onclick = () => setCamera('orbit');

const viewer = byId('viewer');
function fullscreenLabel() {
  const active = document.fullscreenElement === viewer || viewer.classList.contains('expanded');
  const name = active ? 'Salir de pantalla completa' : 'Pantalla completa';
  byId('fullscreen').setAttribute('aria-label',name); byId('fullscreen').title = name;
}
byId('fullscreen').onclick = async () => {
  try {
    if (viewer.classList.contains('expanded')) viewer.classList.remove('expanded');
    else if (document.fullscreenElement) await document.exitFullscreen();
    else if (viewer.requestFullscreen) await viewer.requestFullscreen();
    else viewer.classList.add('expanded');
  } catch { viewer.classList.toggle('expanded'); }
  fullscreenLabel();
};
document.addEventListener('fullscreenchange',fullscreenLabel);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { viewer.classList.remove('expanded'); fullscreenLabel(); }
});

byId('coverage-plan').onclick = () => {
  changeInventory('all'); state.monochrome = false; applyPreset('hall'); setCamera('top');
  byId('beams').checked = true; model?.beams(true);
  byId('maqueta').scrollIntoView({block:'start'});
};
applyPreset('dance');
setViewLabel('orbit');
try {
  model = crearAuditorio(byId('canvas-area'), (key,id) => { if (editor && id) editor.pick(id); else selectZone(key); }, setViewLabel);
  sync(); model.labels(false);
  // Conservar la vista previa hasta que se haya dibujado el primer fotograma.
  requestAnimationFrame(() => requestAnimationFrame(() => { byId('poster').hidden = true; }));
} catch {
  viewer.classList.add('static'); byId('canvas-area').hidden = true;
  byId('gesture').textContent = 'Vista fija a 4,66 m · Elige escena y ángulo';
  viewer.querySelector('.viewer-type').textContent = 'Maqueta';
  document.querySelectorAll('.flags input,#controls select,#controls input,.camera-tools button,#viewer-height,#coverage-plan,#open-editor,#export-glb').forEach(el => el.disabled = true);
}
const coverage = iniciarCobertura((positions,height) => { model?.houseLayout(positions,height); editor?.refresh(); });
if (model) editor = iniciarEditor(model,coverage,key => { selected = key; sync(); },() => currentCamera,
  () => { if (inventory === 'existing') changeInventory('all'); },actualizarDescripcion);
changeInventory('all');
if (new URLSearchParams(location.search).get('comparar') === '1') {
  setCamera('seats');
  byId('compare-pair').open = true;
  updatePair();
}

const query = new URLSearchParams(location.search);
const requestedCamera = query.get('vista');
if (Object.hasOwn(cameras,requestedCamera)) setCamera(requestedCamera);
const aimOnOpen = query.get('orientar');
const detailOnOpen = query.get('luz');
if (editor && aimOnOpen) editor.orient(aimOnOpen);
else if (editor && detailOnOpen && model.fixtures().some(f => f.id === detailOnOpen)) {
  editor.pick(detailOnOpen);
  model.focusFixture(detailOnOpen);
}

const sheetButtons = document.querySelectorAll('#mount-switch button');
for (const button of sheetButtons) {
  button.addEventListener('click', () => {
    for (const option of sheetButtons) {
      const active = option === button;
      option.setAttribute('aria-pressed', String(active));
      byId('sheet-' + option.dataset.sheet).hidden = !active;
    }
  });
}
for (const link of document.querySelectorAll('.mount-sheet a[href^="?luz="]')) {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!editor) return;
    event.preventDefault();
    const id = new URL(link.href).searchParams.get('luz');
    const mode = link.closest('.mount-sheet').id === 'sheet-existente' ? 'existing' : 'proposed';
    changeInventory(mode);
    if (!model.fixtures().some(f => f.id === id)) return;
    editor.pick(id); model.focusFixture(id);
    byId('maqueta').scrollIntoView({block:'start'});
  });
}
