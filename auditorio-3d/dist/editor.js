'use strict';

function iniciarEditor(model, coverage, setGroup, cameraLabel, revealAdded, describeScene) {
  const el = id => document.getElementById(id);
  const list = el('fixture-list');
  let selectedId = 'left-1', dragging = false, opened = false, aiming = false;
  const plan = plantaAuditorio;
  const destinations = {
    stage:{x:0,y:2.1,z:-3.6},
    left:{x:plan.danza[0].x,y:1.78,z:plan.danza[0].z},
    right:{x:plan.danza[1].x,y:1.78,z:plan.danza[1].z},
    banner:{x:plan.panel.x,y:plan.panel.base+plan.panel.h/2,z:plan.panel.z+.04},
    seats:{x:0,y:plan.sala.planoLectura,z:3.5}
  };
  const names = {principal:'PAR del principal',front:'Frontal',top:'Superior',back:'Contraluz',left:'Danza izquierda',right:'Danza derecha',
    moving:'Cabezas móviles',bars:'Barras de piso',par:'PAR de piso',house:'Sala',
    ambient:'Bañadores laterales',pixels:'Barras de píxeles',music:'Móviles de música'};
  const fmt = n => Number(n).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2});
  const indexOf = id => Number(id.split('-').pop())-1;
  const p2Positions = {'front-2':'Segunda desde la izquierda','front-7':'Segunda desde la derecha'};
  const fixtures = () => model.fixtures();
  const current = () => fixtures().find(f => f.id === selectedId);
  const isAdded = f => f.group === 'house' ? coverage.isAdded(indexOf(f.id)) : f.added;
  const say = message => { el('edit-status').textContent = message; };
  function updateOptics(f=current()) {
    if (!f) return;
    const target = {principal:'intérpretes del altar',left:'tarima izquierda', right:'tarima derecha', front:'rostros en el escenario', top:'escenario', back:'intérpretes desde atrás', house:'butacas y pasillos', bars:'banner trasero', par:'banner trasero', moving: f.aim.y > 1 ? 'muros laterales' : 'tarimas de danza', ambient:'muro lateral',music:'escenario'};
    const power=f.enabled ? 'Encendida' : 'Apagada';
    if(f.group==='pixels'){
      el('fixture-optics').textContent=power+' · Barra vertical visible desde las butacas.';
      return;
    }
    const zone=el('aim-zone');zone.value=f.aimLabel||'';
    const focus=f.aimLabel ? zone.selectedOptions[0].textContent+' (X '+fmt(f.aim.x)+' · Y '+fmt(f.aim.y)+' · Z '+fmt(f.aim.z)+' m)' : target[f.group];
    el('fixture-optics').textContent = power + ' · Haz representado de ' + Math.round(f.beamAngle) + '° · Dirigida hacia ' + focus + '.';
  }
  function syncFields(f) {
    if (!f) return;
    for (const [axis,range] of [['x',f.rangeX],['z',f.rangeZ]]) {
      const input = el('fixture-'+axis); input.disabled = !range;
      input.value = f[axis].toFixed(2);
      if (range) { input.min = range[0]; input.max = range[1]; }
    }
    el('fixture-aim').hidden=f.group==='house'||f.group==='pixels';
    const position = p2Positions[f.id];
    el('p2-reference').hidden = !position;
    if (!position) el('p2-reference').open = false;
    const origin = isAdded(f) ? 'Añadida en esta sesión' : {existing:'Existente',proposed:'Propuesta base',future:'Ampliación futura'}[f.origin];
    el('fixture-facts').textContent = (f.profile ? f.profile.key+' · '+f.profile.name+' · '+(f.added?'copia':'U0 '+f.profile.channels) : (f.codigoPlano?f.codigoPlano+' · óptica simulada':f.type))+' · '+origin+' · '+f.mount+' · '+fmt(f.y)+' m sobre el piso. '+
      (position ? position+' en el montaje de referencia, visto desde las butacas. ' : '')+
      (!f.rangeZ ? 'Se desplaza a lo largo de su barra.' : f.group === 'house' ? 'Su eje es vertical. Mover este colgante recalcula el mapa de lux.' : 'Se desplaza dentro de su zona de montaje.');
    if(f.patch)el('fixture-facts').textContent+=' Parche propuesto · '+f.patch.id+' · ramal '+f.patch.ramal+' · U'+f.patch.universo+' / '+String(f.patch.inicio).padStart(3,'0')+'.';
    updateOptics(f);
    el('remove-fixture').hidden = !isAdded(f);
    el('reset-fixture').hidden = f.group === 'house' && isAdded(f);
  }
  function refresh() {
    const items = fixtures();
    // Las opciones solo cambian al añadir, quitar o cambiar de distribución.
    const signature = items.map(f=>f.id).join(',');
    if (list.dataset.signature !== signature) {
      list.replaceChildren(); const sections = new Map();
      for (const f of items) {
        if (!sections.has(f.group)) {
          const section = document.createElement('optgroup'); section.label = names[f.group];
          sections.set(f.group,section); list.append(section);
        }
        const name=p2Positions[f.id] ? 'P2 · '+p2Positions[f.id] : names[f.group]+' · '+(f.profile ? f.profile.key+' '+f.profile.name : f.codigoPlano||f.type)+' '+(indexOf(f.id)+1);
        sections.get(f.group).append(new Option(name,f.id));
      }
      list.dataset.signature = signature;
    }
    if (!items.some(f=>f.id === selectedId)) {
      selectedId = items.find(f=>f.group === 'house')?.id || items[0]?.id;
      stopDrag();
      if (opened) model.selectFixture(selectedId);
    }
    list.value = selectedId; syncFields(items.find(f=>f.id === selectedId));
    if (opened && cameraLabel() === 'fixture') setDetailName();
  }
  function stopDrag() {
    dragging = false; aiming = false;
    model.dragFixture(null); model.pickAim(null);
    el('pick-aim').setAttribute('aria-pressed','false');
    el('cancel-aim').hidden=true; el('canvas-area').classList.remove('aiming');
    el('drag-fixture').setAttribute('aria-pressed','false');
    el('canvas-area').classList.remove('editing');
    el('gesture').textContent = 'Arrastra para mover la vista';
  }
  function setDetailName() {
    const f = current();
    if (f) el('view-name').textContent = p2Positions[f.id] ? 'P2 · '+p2Positions[f.id] : f.type+' '+(indexOf(f.id)+1)+' · '+names[f.group];
  }
  function applyPosition(id,x,z) {
    const f = fixtures().find(item=>item.id === id);
    if (!f) return false;
    if (!Number.isFinite(x) || (f.rangeZ && !Number.isFinite(z))) {say('Introduce una posición en metros.'); return false;}
    if (x < f.rangeX[0] || x > f.rangeX[1] || f.rangeZ && (z < f.rangeZ[0] || z > f.rangeZ[1])) {
      say('La posición queda fuera del soporte. X admite de '+fmt(f.rangeX[0])+' a '+fmt(f.rangeX[1])+' m'+
        (f.rangeZ ? ' y Z de '+fmt(f.rangeZ[0])+' a '+fmt(f.rangeZ[1])+' m.' : '.')); return false;
    }
    x = Number(x.toFixed(2)); z = f.rangeZ ? Number(z.toFixed(2)) : f.z;
    if (f.group === 'house') {
      if (!coverage.move(indexOf(id),x,z)) {say('Elige un punto dentro del sector del público.'); return false;}
    } else if (model.moveFixture(id,x,z) === false) {
      say('La posición queda fuera del soporte de esta luminaria.'); return false;
    }
    syncFields(current());
    const actual=current();say('Posición aplicada · X '+fmt(actual.x)+' m, Z '+fmt(actual.z)+' m.'); return true;
  }
  function choose(id) {
    const f = fixtures().find(item=>item.id === id);
    if (!f) return;
    stopDrag(); selectedId = id; list.value = id;
    setGroup(f.group); model.selectFixture(id); syncFields(f);
    if (cameraLabel() === 'fixture') { model.focusFixture(id); setDetailName(); }
    say('');
  }
  function open(value) {
    opened = value; el('fixture-editor').hidden = !value;
    el('open-editor').setAttribute('aria-expanded',String(value));
    if (!value) {stopDrag();model.selectFixture(null);return;}
    refresh();choose(selectedId);
  }
  el('open-editor').onclick = () => open(!opened);
  list.onchange = () => choose(list.value);
  el('apply-position').onclick = () => applyPosition(selectedId,el('fixture-x').valueAsNumber,el('fixture-z').valueAsNumber);
  for (const axis of ['x','z']) el('fixture-'+axis).onkeydown = e => {
    if (e.key === 'Enter') { e.preventDefault(); el('apply-position').click(); }
  };
  el('focus-fixture').onclick = () => {
    stopDrag();model.focusFixture(selectedId);setDetailName();el('viewer').scrollIntoView({block:'nearest'});
  };
  el('drag-fixture').onclick = () => {
    if (dragging) {stopDrag();say('');return;}
    stopDrag();model.cameraMode('top'); model.selectFixture(selectedId);
    model.dragFixture(selectedId,applyPosition); dragging = true;
    el('drag-fixture').setAttribute('aria-pressed','true');
    el('canvas-area').classList.add('editing'); el('gesture').textContent = 'Arrastra la luminaria marcada';
    say('Arrastra el equipo marcado en la planta para moverlo.');
    el('viewer').scrollIntoView({block:'nearest'});
  };
  function commitAim(target,label) {
    if (!model.setAim(selectedId,target,label)) {
      say('Selecciona un punto del auditorio alejado de la óptica.');return false;
    }
    stopDrag();model.selectFixture(selectedId);syncFields(current());describeScene();
    say(target ? 'Enfoque aplicado. La línea marca el eje del haz.' : 'Se recuperó el enfoque de referencia.');
    return true;
  }
  el('aim-zone').onchange = e => {
    const key=e.target.value;
    commitAim(destinations[key]||null,key||null);
  };
  function startAim() {
    if (aiming) {stopDrag();say('');return;}
    const f=current(); if (!f || f.group==='house')return;
    stopDrag();
    if (cameraLabel()==='fixture')model.cameraMode('orbit');
    model.selectFixture(selectedId);aiming=true;
    el('canvas-area').classList.add('aiming'); el('cancel-aim').hidden=false;
    el('pick-aim').setAttribute('aria-pressed','true');
    el('gesture').textContent='Toca el punto que quieres iluminar';
    say('Selecciona una superficie en el visor. El haz apuntará al punto que toques.');
    model.pickAim(point=>{
      if(point)commitAim(point,'custom');
      else {el('gesture').textContent='Toca el escenario, el muro o las butacas';}
    });
    el('viewer').scrollIntoView({block:'nearest'});
  }
  el('pick-aim').onclick=startAim;
  el('cancel-aim').onclick=()=>{stopDrag();say('');};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&aiming){stopDrag();say('');}});
  el('add-fixture').onclick = () => {
    const f = current();
    let id;
    revealAdded();
    if (f.group === 'house') {
      const index = coverage.add(indexOf(f.id)); if (index >= 0) id = 'house-'+(index+1);
    } else id = model.addFixture(f.id);
    if (!id) { say('No hay espacio libre en este soporte para otra luminaria.'); return; }
    selectedId = id;refresh();choose(id);say('Luminaria añadida en '+f.mount+'. Puedes ajustar su posición.');
  };
  el('remove-fixture').onclick = () => {
    const f = current(); if (!f || !isAdded(f)) return;
    stopDrag();
    selectedId = f.group+'-1';
    if (f.group === 'house') coverage.remove(indexOf(f.id)); else model.removeFixture(f.id);
    refresh(); choose(selectedId); describeScene(); say('Se quitó la luminaria añadida.');
  };
  el('reset-fixture').onclick = () => {
    const f = current();
    if (f.group === 'house') coverage.reset(indexOf(f.id)); else model.resetFixture(f.id);
    refresh();say('La luminaria volvió a su posición de partida.');
  };
  el('export-glb').onclick = async () => {
    const button = el('export-glb'); button.disabled = true;
    el('export-status').textContent = 'Preparando el modelo…';
    try {
      const blob = await window.exportarAuditorioGLB(model);
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = 'Auditorio-iluminacion.glb';
      document.body.append(link); link.click(); link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      el('export-status').textContent = 'GLB generado con las luminarias y posiciones actuales.';
    } catch (err) {
      el('export-status').textContent = 'No se pudo generar el GLB. Vuelve a intentar la descarga.';
      console.error('Exportación GLB',err);
    } finally {button.disabled = false;}
  };
  refresh();
  return {
    refresh,
    orient(id){if(!fixtures().some(f=>f.id===id&&f.group!=='house'&&f.group!=='pixels'))return;open(true);choose(id);startAim();},
    updateOptics() { if (opened) updateOptics(); },
    pick(id) { if (!id) return; if (!opened) open(true);choose(id); },
    cameraChanged(key) { if (dragging && key !== 'top') stopDrag(); if (key === 'fixture') setDetailName(); }
  };
}
