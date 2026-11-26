/* Hoja de metrado local. Las posiciones son las del montaje base, antes de las ediciones del visor. */
(() => {
  const cuerpo=document.getElementById('wire-rows'), estado=document.getElementById('wire-result');
  const formato=n=>new Intl.NumberFormat('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const key='h21-metrado-puentes-20261126';
  let guardado={};
  try {guardado=JSON.parse(localStorage.getItem(key)||'{}')||{};} catch {}
  const filas=plantaAuditorio.ramales.map(r=>{
    const row=cuerpo.insertRow();
    const ruta=r.puntos.reduce((m,p,i,a)=>i?m+Math.hypot(p.pos[0]-a[i-1].pos[0],p.pos[1]-a[i-1].pos[1]):m,0);
    const nombre=document.createElement('th');nombre.scope='row';nombre.textContent=r.id+' · '+r.nombre;row.append(nombre);
    row.insertCell().textContent='U'+r.u+' / '+r.puntos.length;
    row.insertCell().textContent=formato(ruta)+' m';
    const medidas=guardado[r.id]||{};
    function campo(tipo,label){
      const input=document.createElement('input');
      input.type='number';input.min='0';input.step='.01';input.inputMode='decimal';input.placeholder='—';
      input.setAttribute('aria-label',label+' en metros · '+r.nombre);
      if(medidas[tipo]!==undefined)input.value=String(medidas[tipo]);
      row.insertCell().append(input);
      return input;
    }
    const troncal=campo('troncal','Recorrido al primer equipo'), enlaces=campo('enlaces','Recorrido total entre equipos');
    return {r,ruta,troncal,enlaces,resultado:row.insertCell()};
  });
  function valor(input){return input.value!==''&&input.validity.valid?input.valueAsNumber:null;}
  function actualizar(){
    let total=0,listos=0,planta=0;
    const mediciones={};
    for(const {r,ruta,troncal,enlaces,resultado} of filas){
      planta+=ruta;
      const a=valor(troncal),b=valor(enlaces);
      if(a!==null&&b!==null){resultado.textContent=formato(a+b)+' m';total+=a+b;listos++;}
      else resultado.textContent='Pendiente';
      mediciones[r.id]={};
      if(a!==null)mediciones[r.id].troncal=a;
      if(b!==null)mediciones[r.id].enlaces=b;
    }
    estado.textContent=formato(planta)+' m entre equipos en planta · '+listos+' de '+filas.length+' ramales medidos'+(listos?' · '+formato(total)+' m medidos':'')+'.';
    try {localStorage.setItem(key,JSON.stringify(mediciones));} catch {}
  }
  cuerpo.addEventListener('input',actualizar);actualizar();
  document.getElementById('wire-export').onclick=()=>{
    const rows=[['Ramal','Zona','Universo','Equipos','Entre equipos en planta (m)','Troncal medida (m)','Enlaces medidos (m)','Total medido (m)']];
    for(const {r,ruta,troncal,enlaces} of filas){
      const a=valor(troncal),b=valor(enlaces);
      rows.push([r.id,r.nombre,r.u,r.puntos.length,formato(ruta),a===null?'':formato(a),b===null?'':formato(b),a===null||b===null?'':formato(a+b)]);
    }
    const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob(['\ufeff',csv,'\r\n'],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='H21-metrado-DMX.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  };
})();
