'use strict';

const byId = id => document.getElementById(id);
const cameras = {
  orbit: ['Perspectiva', 'Perspectiva general'],
  front: ['Frente', 'Frente del escenario'],
  stage: ['Desde escenario', 'Desde el escenario hacia la sala'],
  left: ['Danza izquierda', 'Tarima izquierda'],
  right: ['Danza derecha', 'Tarima derecha'],
  top: ['Planta', 'Distribución en planta'],
  side: ['Corte lateral', 'Corte longitudinal'],
  seats: ['Desde butacas', 'Desde las butacas']
};
const zones = {
  house: ['Sala RGBW', 'Cinco filas de nueve puntos PL‑01 y LD‑01. Blanco de lectura y ambiente RGB según los modelos que se seleccionen.'],
  front: ['Frontal existente', 'Dos Fresnel P3 en los extremos, dos COB P2 hacia el interior y cuatro PAR P4 en el centro. El enfoque se ajusta en cada aparato.'],
  top: ['Superior del escenario', 'Ocho PAR LED RGBAW en el puente sobre el altar iluminan la banda y las voces.'],
  back: ['Contraluz', 'Ocho PAR LED RGBAW en el puente posterior separan a los intérpretes del fondo.'],
  left: ['Danza izquierda', 'Dos Fresnel blancos y dos PAR LED RGBAW comparten el puente diagonal izquierdo de 4 m.'],
  right: ['Danza derecha', 'Dos Fresnel blancos y dos PAR LED RGBAW comparten el puente diagonal derecho de 4 m.'],
  moving: ['Móviles MH4–MH7', 'Cuatro móviles sobre el público se orientan hacia las tarimas o hacia los muros.'],
  bars: ['Barras de piso', 'Cuatro barras de piso agrupadas al centro bañan los paneles negros del fondo.'],
  par: ['PAR LED de piso', 'Dos PAR de cada lado del escenario apuntan desde el piso hacia el banner trasero.'],
  ambient: ['Bañadores laterales', 'Cuatro bañadores RGB proyectan color en los muros junto a las tarimas.'],
  pixels: ['Barras de píxeles', 'Cuatro barras verticales enmarcan el banner.'],
  music: ['Móviles de música', 'Dos cabezas wash en la barra posterior se orientan dentro del escenario.'],
  principal: ['PAR del puente principal','Ocho PAR LED RGBAW nuevos comparten el puente con los ocho frontales existentes.']
};
const futureZones = new Set(['ambient','pixels','music']);
const presets = {
  dance: {name:'Danza', levels:[16,30,20,60,100,100,78,85,72,68,52,35,38], color:'#599dff', aim:'dance',
    scenicColors:{back:'#18baba',moving:'#49e4ff',bars:'#244dff',par:'#2cd2e2',ambient:'#4d77ff',pixels:'#46d9ff',music:'#5ec5ff'},
    description:'Dos Fresnel iluminan las caras en cada tarima. Los PAR laterales añaden color y los móviles dan un acento cian.'},
  sermon:{name:'Prédica', levels:[24,100,48,18,0,0,0,40,26,24,0,0,65], color:'#ffe3b5', aim:'dance',
    scenicColors:{back:'#ffa257',moving:'#ffe3b5',bars:'#e59a51',par:'#ffcf84',ambient:'#ffc590'},
    description:'El blanco cálido concentra la atención en el púlpito. El fondo queda ámbar y las tarimas se apagan.'},
  event: {name:'Evento', levels:[35,50,35,80,12,12,95,100,95,77,70,60,55], color:'#aa7bfa', aim:'walls',
    scenicColors:{back:'#ff539e',moving:'#3ce2f4',bars:'#8a35fa',par:'#ff4098',ambient:'#b05cff',pixels:'#ff77d7',music:'#42ccff'},
    description:'El violeta y el magenta bañan el banner. Los cuatro móviles dirigen haces cian hacia los muros laterales.'},
  hall:  {name:'Solo sala', levels:[100,0,0,0,0,0,0,0,0,0,0,0,0], color:'#fff4da', aim:'dance', scenicColors:{},
    description:'Solo se encienden los colgantes del público. En blanco al 100 %, esta escena corresponde al cálculo de cobertura.'},
  mellow:{name:'Adoración íntima',  levels:[24,64,37,25,12,12,0,38,32,43,52,24,38], color:'#5784df', aim:'dance',
    scenicColors:{principal:'#ffe4bc',top:'#c6d7ff',dancePar:'#5a78cf',back:'#699cff',bars:'#233fa9',par:'#7388fa',ambient:'#4268f2',pixels:'#ffac56',music:'#ffe1bb'},
    description:'Los PAR del principal iluminan las voces en cálido. El azul del altar y del posterior se acompaña con barras ámbar en los extremos del banner.'},
  music:{name:'Alabanza',  levels:[36,66,44,62,35,35,24,64,72,78,92,83,58], color:'#986aff', aim:'dance',
    scenicColors:{principal:'#ffe9d7',top:'#78c6ff',dancePar:'#ae67ff',back:'#7c7aff',moving:'#2bc8ff',bars:'#3f2cdb',par:'#586dff',ambient:'#bd5aff',pixels:'#52e5ff',music:'#4ae5fa'},
    description:'Al blanco del principal, el azul superior y el contraluz violeta se suman cuatro bañadores de muro, cuatro barras cian y dos móviles en el puente posterior.'}
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
let playing = false;
const inventoryNotes = {
  existing:'Ocho frontales P2, P3 y P4, cuatro móviles MH4–MH7 sobre el público y cuatro PAR LED de piso. Cuatro barras LED de piso completan el montaje existente.',
  all:'El montaje completo reúne las luces instaladas y la propuesta para danza, escenario y público.',
  proposed:'Dos diagonales de danza, ocho PAR en cada uno de los tres puentes de escenario y 45 puntos de sala en la distribución de referencia.',
  future:'El montaje completo incorpora 10 luminarias futuras. Incluye bañadores de muro, barras de fondo y dos móviles de música.'
};
const soloDescriptions = {
  all:{
    mellow:'Los PAR del principal dan blanco cálido a las voces. El altar y el posterior añaden azul suave.',
    music:'Los 24 PAR del escenario combinan blanco frontal, azul superior y contraluz violeta. Las diagonales dan blanco y color a danza.'
  },
  existing:{
    mellow:'Los frontales mantienen las voces en blanco y las luces de piso tiñen el banner de azul.',
    music:'Los frontales, las luces de piso y los cuatro móviles existentes acompañan la música.',
    dance:'Los móviles apuntan a las tarimas. El banner recibe azul y cian desde el piso.',
    sermon:'Los frontales iluminan a quien predica y las luces de piso dan un fondo ámbar.',
    event:'Los móviles pasan a los muros laterales y el banner combina violeta y magenta.',
    hall:'Los colgantes de sala son parte de la propuesta. El alumbrado general actual carece de fotometría en el modelo.'
  },
  proposed:{
    mellow:'Los tres puentes dan blanco y azul al altar. Los Fresnel laterales mantienen luz suave para danza.',
    music:'Ocho PAR por puente dibujan tres capas de escenario. Cada tarima recibe el cruce de los Fresnel y dos PAR violetas.',
    dance:'Cada diagonal cruza el blanco de dos Fresnel sobre una tarima y añade el color de dos PAR RGBAW.',
    sermon:'Los PAR del principal y del altar refuerzan los rostros. La sala queda en blanco tenue.',
    event:'El contraluz baña las siluetas en magenta y la sala toma un tono violeta.',
    hall:'Los colgantes iluminan el público en blanco al 100 %, como en el mapa de cobertura.'
  }
};
function previewUrl(camera, mode=inventory) {
  const cue=lastPreset;
  return 'recursos/vistas/' + (mode === 'all' ? '' : mode + '/') + (cue === 'dance' ? '' : cue + '/') + camera + '.webp?v=altar26';
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
  byId('compare-caption').textContent = 'Óptica de sala simulada a '+plantaAuditorio.sala.altura.toFixed(2).replace('.',',')+' m · '+presets[lastPreset].name+' · '+cameras[camera][1]+'. La maqueta interactiva muestra tus ajustes y la ampliación futura.';
}
function playMotion(value) {
  playing = value;
  byId('play-motion').setAttribute('aria-pressed',String(playing));
  byId('play-motion').textContent = playing ? 'Pausar móviles' : 'Animar móviles';
  model?.playMotion(playing);
}
function changeInventory(mode) {
  inventory = mode;
  model?.inventory(mode);
  if (mode !== 'future') {
    playMotion(false);
    if (futureZones.has(selected)) selected = 'house';
  }
  byId('inventory').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.inventory === mode)));
  for (const option of byId('zone').options) option.hidden = futureZones.has(option.value) && mode !== 'future';
  byId('play-motion').hidden = mode !== 'future';
  byId('room-look-note').textContent = mode === 'future' ? 'Color de colgantes y bañadores de muro.' : 'Color de los colgantes del público.';
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
  thumb.loading = 'lazy';
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
  byId('wire-layer').disabled = !model || inventory==='existing';
  byId('dance-rim').checked = state.danceRim!==false;
  byId('dance-rim').disabled = !model || inventory==='existing';
  byId('room-look').disabled = !model || inventory==='existing';
  if (playing && !state.on.music) playMotion(false);
  byId('play-motion').disabled = !model || !state.on.music;
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
  playMotion(false);
  byId('room-look').value = 'scene';
  state.roomColor = null; state.roomOff = false;
  state.danceRim = true;
  state.scene = key; state.color = preset.color; state.aim = preset.aim;
  state.scenicColors = preset.scenicColors;
  lastPreset = key;
  refreshPreviews();
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
byId('room-look').onchange = e => {
  const look = e.target.value;
  state.roomColor = look.startsWith('#') ? look : null;
  state.roomOff = look === 'off';
  state.monochrome = false;
  sync();
};
byId('play-motion').onclick = () => playMotion(!playing);
byId('aim-choice').onchange = e => { state.aim = e.target.value; customize(); };
byId('show-color').onchange = e => { state.monochrome = !e.target.checked; sync(); };
byId('beams').onchange = e => model?.beams(e.target.checked);
byId('dance-rim').onchange = e => {state.danceRim=e.target.checked;customize();};
byId('labels').onchange = e => model?.labels(e.target.checked);
byId('wire-layer').onchange = e => model?.wiring(e.target.checked);
byId('open-wire-plan').onclick=()=>{changeInventory('all');setCamera('top');byId('wire-layer').checked=true;model?.wiring(true);document.getElementById('maqueta').scrollIntoView();};
byId('roof').onchange = e => model?.roof(e.target.checked);
byId('zoom-in').onclick = () => model?.zoomBy(1.15);
byId('zoom-out').onclick = () => model?.zoomBy(1/1.15);
byId('reset-camera').onclick = () => setCamera(currentCamera);
const qualityInput = byId('viewer-quality');
try {
  const saved = localStorage.getItem('h21-viewer-quality');
  if (['high','auto','low'].includes(saved)) qualityInput.value = saved;
} catch { /* La calidad se puede cambiar aunque el navegador bloquee el almacenamiento. */ }
qualityInput.onchange = () => {
  model?.setQuality(qualityInput.value);
  try { localStorage.setItem('h21-viewer-quality',qualityInput.value); } catch { /* Preferencia de esta visita. */ }
};

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
const interactiveControls = document.querySelectorAll('.flags input,#controls select,#controls input,.camera-tools button,#viewer-height,#open-editor,#export-glb,#viewer-quality,#room-look,#play-motion');
interactiveControls.forEach(el => { el.disabled = true; });
let roomLayout;
const coverage = iniciarCobertura((positions,height) => {
  roomLayout = [positions,height];
  model?.houseLayout(...roomLayout);
  editor?.refresh();
});
const query = new URLSearchParams(location.search);
changeInventory(['existing','proposed','future'].includes(query.get('montaje')) ? query.get('montaje') : 'all');
const requestedPreset = query.get('escena');
if (Object.hasOwn(presets,requestedPreset)) applyPreset(requestedPreset);
if (query.get('comparar') === '1') {
  setCamera('seats');
  byId('compare-pair').open = true;
  updatePair();
}

const requestedCamera = query.get('vista');
if (Object.hasOwn(cameras,requestedCamera)) setCamera(requestedCamera);

function startViewer() {
  const script = document.createElement('script');
  const host = byId('canvas-area');
  script.src = 'recursos/three.min.js';
  byId('gesture').textContent = 'Cargando vista 3D…';
  function usePreview() {
    host.hidden = true;
    byId('gesture').textContent = 'Vista fija a '+plantaAuditorio.sala.altura.toFixed(2).replace('.',',')+' m · Elige escena y ángulo';
    viewer.querySelector('.viewer-type').textContent = 'Maqueta';
  }
  script.onerror = usePreview;
  script.onload = () => {
    try {
      model = crearAuditorio(host, (key,id) => { if (editor && id) editor.pick(id); else selectZone(key); }, setViewLabel, () => {
        viewer.classList.remove('static');
        byId('poster').hidden = true;
      });
    } catch {
      usePreview();
      return;
    }
    model.houseLayout(...roomLayout);
    model.inventory(inventory);
    model.setQuality(qualityInput.value);
    model.beams(byId('beams').checked);
    model.wiring(byId('wire-layer').checked);
    model.labels(byId('labels').checked);
    model.cameraMode(currentCamera);
    editor = iniciarEditor(model,coverage,key => { selected = key; sync(); },() => currentCamera,
      () => { if (inventory === 'existing') changeInventory('all'); },actualizarDescripcion);
    interactiveControls.forEach(el => { el.disabled = false; });
    byId('gesture').textContent = 'Arrastra para mover la vista';
    sync();

    const aimOnOpen = query.get('orientar');
    const detailOnOpen = query.get('luz');
    if (aimOnOpen) editor.orient(aimOnOpen);
    else if (detailOnOpen && model.fixtures().some(f => f.id === detailOnOpen)) {
      editor.pick(detailOnOpen);
      model.focusFixture(detailOnOpen);
    }
  };
  document.head.append(script);
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    startViewer();
  }, {rootMargin:'160px'});
  observer.observe(viewer);
} else {
  startViewer();
}

for (const link of document.querySelectorAll('[data-demo]')) {
  link.addEventListener('click', event => {
    if (!model || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const destino=new URL(link.href);
    changeInventory(destino.searchParams.get('montaje') || 'all');
    state.monochrome = false;
    applyPreset(link.dataset.demo);
    setCamera(destino.searchParams.get('vista') || 'seats');
    byId('maqueta').scrollIntoView({block:'start'});
  });
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
for (const link of document.querySelectorAll('.mount-sheet a[href*="luz="]')) {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!editor) return;
    event.preventDefault();
    const params = new URL(link.href).searchParams;
    const id = params.get('luz');
    const mode = params.get('montaje');
    changeInventory(mode);
    if (!model.fixtures().some(f => f.id === id)) return;
    editor.pick(id); model.focusFixture(id);
    byId('maqueta').scrollIntoView({block:'start'});
  });
}
