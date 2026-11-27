/* Regenerar los planos vectoriales, las hojas de campo y la ficha imprimible desde la misma planta del visor. */
const fs=require('node:fs'), path=require('node:path');
const plan=require('../dist/planta.js');
const out=path.join(__dirname,'../dist/recursos/puentes');
fs.mkdirSync(out,{recursive:true});
const fmt=(n,d=2)=>n.toFixed(d).replace('.',',');
const addr=n=>String(n).padStart(3,'0');
const ramas=plan.ramales;
const trunk=ramas.map(r=>{
  let metros=0;for(let i=1;i<r.puntos.length;i++)metros+=Math.hypot(...r.puntos[i].pos.map((n,j)=>n-r.puntos[i-1].pos[j]));
  return {...r,metros};
});
function csv(name,headers,rows){
 const esc=v=>'"'+String(v).replaceAll('"','""')+'"';
 fs.writeFileSync(path.join(out,name),'\ufeff'+[headers,...rows].map(row=>row.map(esc).join(';')).join('\n')+'\n');
}
csv('patch-propuesto.csv',['Universo Art-Net','Ramal','Orden','ID de campo','Tipo','Inicio propuesto','Fin del bloque reservado','Modo y huella real (completar)','X (m)','Z (m)','Cota de referencia (m)','ID de maqueta','Prueba en sala'],ramas.flatMap(r=>r.puntos.map((p,i)=>[r.u,r.id,i+1,p.codigo,p.tipo,addr(p.canal),addr(p.canal+p.slots-1),'',fmt(p.pos[0]),fmt(p.pos[1]),fmt(r.y),p.visor,''])));
csv('tendido-por-tramo.csv',['Universo','Ramal','Desde','Hasta','Distancia en planta (m)','Recorrido medido con subida y holgura (m)','Cable o conector instalado','Ensayo'],ramas.flatMap(r=>r.puntos.map((p,i)=>[r.u,r.id,i?r.puntos[i-1].codigo:'SPL-U'+r.u,p.codigo,i?fmt(Math.hypot(...p.pos.map((v,k)=>v-r.puntos[i-1].pos[k]))):'Medir desde salida', '', '', ''])));
csv('potencia-por-zona.csv',['Zona de montaje','Equipos nuevos previstos','Cantidad','Tablero y circuito real','Tensión (V)','Modelos y corriente de placa','Corriente de arranque','Límite de enlace del fabricante','Recorrido medido (m)','Protección y sección validadas por electricista'],
  ramas.map(r=>[r.id+' · '+r.nombre,[...new Set(r.puntos.map(p=>p.tipo))].join(' / '),r.puntos.length,'','','','','','','']));
const familias={
 P1:{nombre:'PAR de piso (P1)',color:'#a53c0a',forma:'diamond'},
 P2:{nombre:'COB Cannon frontal (P2)',color:'#9c391b',forma:'hex'},
 P3:{nombre:'Fresnel frontal (P3)',color:'#962745',forma:'square'},
 P4:{nombre:'PAR frontal (P4)',color:'#81500e',forma:'circle'},
 MH:{nombre:'Cabeza móvil (MH4–MH7)',color:'#6b2c69',forma:'triangle'},
 BL:{nombre:'Barra LED de piso (BL)',color:'#67482f',forma:'bar'},
 F:{nombre:'Fresnel de danza',color:'#086c56',forma:'square'},
 P:{nombre:'PAR LED RGBAW',color:'#316216',forma:'circle'},
 'PL-01':{nombre:'PL-01 · filas 1, 3 y 5',color:'#534297',forma:'diamond'},
 'LD-01':{nombre:'LD-01 · filas 2 y 4',color:'#086b91',forma:'bar'}
};
const existentes=plan.existentes.map(f=>({...f,etapa:'existente'}));
const nuevos=ramas.flatMap(r=>r.puntos.map(f=>({...f,etapa:'nuevo',ramal:r.id,universo:r.u,
 familia:f.tipo==='Fresnel'?'F':f.tipo==='PAR LED RGBAW'?'P':f.tipo})));
const totalNuevos=nuevos.length;
const gruposFuturos=[
 {codigo:'AM',nombre:'Bañadores RGBW',cantidad:4,lugar:'Lados de las tarimas'},
 {codigo:'PX',nombre:'Barras de píxeles',cantidad:4,lugar:'Extremos del banner'},
 {codigo:'MW',nombre:'Móviles wash',cantidad:2,lugar:'Puente posterior'}
];
function inventario(f){
  const instalado=f.etapa==='existente';
  const control=instalado?(f.pendienteDMX?'Conexión DMX pendiente':'Perfil en captura de Lightkey'):
    'Dirección de inicio propuesta';
  const universo=instalado?(f.perfil?'0':''):f.universo;
  const patch=instalado?(f.perfil?.channels||''):addr(f.canal)+'–'+addr(f.canal+f.slots-1);
  return [f.codigo,f.etapa,familias[f.familia].nombre,
    instalado?f.lugar:f.ramal,1,...f.pos.map(v=>fmt(v)),f.visor,universo,patch,control,
    instalado?'Posición aproximada; verificar placa, modo y dirección reales':
    'Bloque reservado; verificar modo y huella DMX'];
}
csv('inventario-iluminacion.csv',['ID de campo','Etapa','Familia','Ubicación / ramal','Cantidad','X (m)','Z (m)','ID de maqueta','Universo Art-Net','Canales observados o reservados','Estado de control','Validación'],
 [...existentes.map(inventario),...nuevos.map(inventario),...gruposFuturos.map(f=>
  [f.codigo,'futura',f.nombre,f.lugar,f.cantidad,'','','','','','Parche pendiente','Compra opcional'])]);
const colors={ink:'#172722',fine:'#77867e',paper:'#f8f9f4',metal:'#191919',green:'#057357',control:'#007958',amber:'#9d5634',pl:'#554591',ld:'#167984'};
const tr=(x,z)=>[425+x*19.8,203+(z+1.35)*19.8];
const coords=(points)=>points.map(p=>tr(...p).map(n=>n.toFixed(2)).join(',')).join(' ');
const label=(x,y,s,size=13,anchor='middle',attr='')=>`<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" ${attr}>${s}</text>`;
const line=(x1,y1,x2,y2,color=colors.fine,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
function dim(x1,y1,x2,y2,s,vertical=false){
 return line(x1,y1,x2,y2,colors.fine)+[0,1].map(i=>{const x=i?x2:x1,y=i?y2:y1;return line(x-(vertical?4:0),y-(vertical?0:4),x+(vertical?4:0),y+(vertical?0:4))}).join('')+
 (vertical?label(x1+7,(y1+y2)/2,s,12,'start'):label((x1+x2)/2,y1-5,s,13));
}
function marca(x,y,familia,etapa,t=5.2){
 const {color,forma}=familias[familia];
 const relleno=etapa==='nuevo'?color:'#fff';
 const style=`fill="${relleno}" stroke="${color}" stroke-width="${etapa==='nuevo'?1:1.9}"`;
 const vertices=(pts)=>pts.map(([dx,dy])=>[x+dx*t,y+dy*t].join(',')).join(' ');
 if(forma==='circle')return `<circle cx="${x}" cy="${y}" r="${t}" ${style}/>`;
 if(forma==='square'||forma==='bar'){
   const alto=forma==='bar'?t*.45:t;
   return `<rect x="${x-t}" y="${y-alto}" width="${2*t}" height="${2*alto}" rx=".65" ${style}/>`;
 }
 const puntos=forma==='diamond'?[[0,-1.18],[1,0],[0,1.18],[-1,0]]:forma==='triangle'?[[0,-1.25],[1.08,.87],[-1.08,.87]]:
  [[-.55,-1],[.55,-1],[1.1,0],[.55,1],[-.55,1],[-1.1,0]];
 return `<polygon points="${vertices(puntos)}" ${style}/>`;
}
function inventarioLeyenda(items,x=851){
 let s='', y=82;
 for(const [etapa,titulo] of [['existente','EXISTENTES · CONTORNO'],['nuevo','NUEVOS · RELLENO']]){
   const grupo=items.filter(f=>f.etapa===etapa);
   if(!grupo.length)continue;
   s+=label(x,y,titulo,13,'start','font-weight="700" letter-spacing=".7"');
   y+=24;
   for(const [id,f] of Object.entries(familias)){
     const n=grupo.filter(item=>item.familia===id).length;
     if(!n)continue;
     s+=marca(x+8,y-5,id,etapa,6)+label(x+24,y,f.nombre,14,'start')+
       label(1113,y,n,14,'end','font-weight="bold"');
     y+=27;
   }
   y+=15;
 }
 if(items.some(f=>f.etapa==='existente')){
   s+=label(x,y,'P1 y BL pendientes de DMX.',13,'start');y+=19;
   s+=label(x,y,'Ubicaciones existentes orientativas.',12,'start');y+=20;
 }
 if(items.some(f=>f.etapa==='nuevo')){
   s+=label(x,y,'DI/DD · danza    PR · principal',13,'start');y+=19;
   s+=label(x,y,'AL · sobre altar    PO · posterior',13,'start');y+=19;
   s+=label(x,y,'S1–S5 en planta · filas de sala',13,'start');
 }
 return s;
}
function sheet(modo){
 const wiring=modo==='cableado', ambos=modo==='combinado';
 const items=modo==='existente'?existentes:ambos?[...existentes,...nuevos]:nuevos;
 const nombre={cableado:'Ramales DMX nuevos',combinado:'Equipos existentes + nuevos',
  existente:'Solo equipos existentes',propuesto:'Solo equipos nuevos'};
 const w=1140,h=592;
 let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d"><title id="t">${nombre[modo]}</title><desc id="d">Planta acotada de H21 con código por punto y leyenda por familia y estado de instalación.</desc><rect width="${w}" height="${h}" fill="${colors.paper}"/><g font-family="Helvetica,Arial,sans-serif" fill="${colors.ink}">`;
 s+=label(33,28,nombre[modo],22,'start','font-weight="bold"');
 s+=label(1113,27,'H21  /  SALÓN 01  ·  26.11.2026',12,'end','letter-spacing="1"');
 s+=line(33,44,1113,44,'#b6c2b8');
 s+=line(835,65,835,542,'#b6c2b8');
 const poly=(pts,fill,stroke,extra='')=>`<polygon points="${coords(pts)}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
 const polyline=(pts,stroke,extra='')=>`<polyline points="${coords(pts)}" fill="none" stroke="${stroke}" ${extra}/>`;
 const W=plan.ladoDer,A=plan.anchoAltar/2;
 s+=poly(plan.contorno,'#fff','#a8b3ad');
 s+=poly([[-W,plan.limiteSala],[W,plan.limiteSala],[W,plan.extremoPB],[-W,plan.extremoPB]],'#edf0eb','none');
 for(const [sig,curve] of [[-1,plan.izquierda],[1,plan.derecha]])s+=poly([...curve,[sig*W,plan.fondo],[sig*A,plan.fondo]],'#e8ece6','#95a39a');
 s+=poly([[-A,plan.fondo],[A,plan.fondo],[A,plan.frenteAltar],[-A,plan.frenteAltar]],'#e3ebe3','#8c9d91');
 s+=label(425,151,'ALTAR',11,'middle','fill="#68776a" letter-spacing="2"');
 if(!wiring)for(const {x,z,giro} of plan.asientos){
   const [px,py]=tr(x,z);
   s+=`<rect x="${px-4.9}" y="${py-3.8}" width="9.8" height="7.6" rx="1" fill="#edf0ec" transform="rotate(${-giro*180/Math.PI} ${px} ${py})"/>`;
 }
 for(const pantalla of plan.pantallas)s+=polyline([[pantalla.x-pantalla.w/2,pantalla.z],[pantalla.x+pantalla.w/2,pantalla.z]],'#82969c','stroke-width="3"');
 for(const pad of plan.danza){
   s+=poly([[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>plan.enTarima(pad,i*pad.w/2,j*pad.d/2)),'#d9dfd6','#87988b');
   const [px,py]=tr(pad.x,pad.z);s+=label(px,py+4,'DANZA',9);
 }
 if(modo!=='existente'&&!wiring)for(const p of plan.puentes.filter(p=>p.tipos))for(const f of p.equipos){
   s+=polyline([f.pos,[f.objetivo[0],f.objetivo[2]]],familias[f.tipo].color,'stroke-width="1.3" stroke-dasharray="3 2" opacity=".52"');
 }
 for(const p of plan.puentes){
   if(modo==='existente'&&p.id!=='principal')continue;
   s+=polyline([p.a,p.b],p.id==='principal'?'#354144':'#6b786f',
     p.id==='principal'?'stroke-width="3"':'stroke-width="2" stroke-dasharray="4 3"');
   const [px,py]=tr(...(p.id==='left'?p.a:p.b));
   s+=label(px+(p.id==='left'?-8:8),py+(p.tipos?13:-5),p.codigo+(p.tipos?' · 4 m':''),12,p.id==='left'?'end':'start','font-weight="bold"');
 }
 if(modo==='existente'||ambos){
   s+=polyline([[-7.8,plan.barraZ],[7.8,plan.barraZ]],'#72756d','stroke-width="2"');
   const [px,py]=tr(7.8,plan.barraZ);
   s+=label(px+7,py+4,'Barra de móviles',10,'start','fill="#595e56"');
 }
 if(wiring){
  for(const [n,r] of ramas.entries()){
   const sala=r.u===2, color=sala?['#694b93','#087a88','#496289'][n-5]:colors.control;
   const start=r.puntos[0].pos;
   if(sala){
    s+=polyline([[0,13.75],[start[0],11.1],start,...r.puntos.slice(1).map(p=>p.pos)],color,'stroke-width="1.8" stroke-dasharray="4 3"');
    const [px,py]=tr(start[0],10.85);s+=label(px,py,r.id,12,'middle','font-weight="bold"');
   }else{
    const lane=-16.65+n*.19, approach=start[1]+.22*n;
    s+=polyline([[-13.8,13.75],[lane,12.9],[lane,approach],[start[0],approach],start],color,'stroke-width="1.3" stroke-dasharray="3 3" opacity=".68"');
   }
  }
  for(const [x,str] of [[-13.8,'SPL-U1 · puentes'],[0,'SPL-U2 · sala']]){
   const [px,py]=tr(x,13.75);s+=`<rect x="${px-57}" y="${py-10}" width="114" height="20" fill="#173e32"/>`+label(px,py+4,str,11,'middle','fill="white"');
  }
 }else{
  const [xl,yt]=tr(-W,plan.fondo),[xr]=tr(W,plan.fondo);
  s+=dim(xl,70,xr,70,'34,34 m · salón');
  s+=dim(tr(-A,0)[0],yt-9,tr(A,0)[0],yt-9,'19,42 m · altar');
  s+=dim(45,tr(0,plan.fondo)[1],45,tr(0,plan.frenteAltar)[1],'5,78 m',true);
  const y1=tr(0,plan.arranqueDerecho)[1],y2=tr(0,plan.limiteSala)[1];
  s+=line(xr,y1,791,y1,colors.fine,'stroke-dasharray="3 3"')+
     line(xr,y2,791,y2,colors.fine,'stroke-dasharray="3 3"')+dim(791,y1,791,y2,'12,14 m',true);
  s+=label(425,489,'Sector bajo el entrepiso · profundidad aproximada',13);
 }
 for(const f of items){
   const [x,y]=tr(...f.pos);
   // Separar las dos caras del principal y los rótulos del piso en la planta combinada.
   let delta=0;
   if(!wiring && f.ramal==='PR')delta=-18;
   if(ambos && f.grupo==='front')delta=-35;
   if(ambos && f.ramal==='PO')delta=-9;
   const ladoPar=f.familia==='P1'?(f.codigo==='P1-01'||f.codigo==='P1-03'?-1:1):0;
   const ladoDanza=f.ramal==='DI'?-1:f.ramal==='DD'?1:0;
   const dx=ladoDanza*9+ladoPar*7;
   const dy=ladoDanza?3:ladoPar?(ladoPar<0?-12:16):f.universo===2&&!f.codigo.startsWith('S2-')?16:-9;
   const anchor=dx<0?'end':dx>0?'start':'middle';
   s+=`<g data-id="${f.codigo}" data-etapa="${f.etapa}"><title>${f.codigo} · ${familias[f.familia].nombre} · ${f.etapa}</title>`;
   if(delta)s+=line(x,y,x,y+delta,'#657461');
   s+=marca(x,y+delta,f.familia,f.etapa,f.universo===2?4.5:5);
   if(!wiring)s+=label(x+dx,y+dy+delta,f.codigo,9.7,anchor,
      `font-weight="bold" fill="${familias[f.familia].color}" paint-order="stroke" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"`);
   s+='</g>';
 }
 s+=inventarioLeyenda(items);
 s+=line(85,544,184,544,colors.ink,'stroke-width="2"')+label(135,537,'5 m',11);
 s+=label(85,568,wiring?'Trazos discontinuos · secuencia de los ramales nuevos. SPL-U1 y SPL-U2 · distribuidores de referencia.':
    'Punto de vista desde las butacas. Cada código corresponde a una fila del inventario.',12,'start');
 if(ambos||modo==='propuesto')s+=label(555,524,'Guías cortas · marcas separadas para leer equipos que coinciden en planta.',11,'middle','fill="#526258"');
 return s+'</g></svg>';
}
for(const [name,modo] of Object.entries({'planta.svg':'propuesto','planta-existente.svg':'existente',
 'planta-combinada.svg':'combinado','ramales.svg':'cableado'})){
 fs.writeFileSync(path.join(out,name),sheet(modo));
}
// Detalle a escala de los mismos puntos mostrados por el editor de enfoque y el plano.
function detalleDanza(){
  const p=plan.porId.right, pad=plan.danza[1], tv=plan.pantallas[1], scale=52;
  const xy=([x,z])=>[(x-9)*scale+24,(z+3.6)*scale+42];
  const path=(pts,stroke,width,extra='')=>`<polyline points="${pts.map(pt=>xy(pt).join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
  const labelAt=(pt,cap,size,props='')=>{const [x,y]=xy(pt);return label(x,y,cap,size,'middle',props);};
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 765 550" aria-labelledby="t d" role="img"><title id="t">Danza derecha · planta de enfoque</title><desc id="d">Pantalla hacia el altar, tarima girada hacia el muro exterior y cuatro ejes desde el puente diagonal.</desc><rect width="765" height="550" fill="#f8f9f4"/><g font-family="Helvetica,Arial,sans-serif" fill="#21342a">`;
  s+=label(26,25,'DANZA DERECHA  /  VISTA DESDE ARRIBA',13,'start','font-weight="bold" letter-spacing="1"');
  s+=path([...plan.derecha,[plan.ladoDer,3.9]],'#708077',3);
  s+=path([[tv.x-tv.w/2,tv.z],[tv.x+tv.w/2,tv.z]],'#315d71',7)+labelAt([tv.x,tv.z-.31],'Pantalla',13);
  const esquinas=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>plan.enTarima(pad,i*pad.w/2,j*pad.d/2));
  s+=`<polygon points="${esquinas.map(pt=>xy(pt).join(',')).join(' ')}" fill="#dce5d8" stroke="#82917e"/>`;
  s+=labelAt([pad.x,pad.z-.11],'Tarima',13,'font-weight="bold"');
  s+=path([p.a,p.b],colors.metal,7,'stroke-linecap="round"');
  for(const f of p.equipos){
    const objetivo=[f.objetivo[0],f.objetivo[2]], c=familias[f.tipo].color;
    const [x,y]=xy(f.pos),[tx,ty]=xy(objetivo);
    s+=path([f.pos,objetivo],c,2.2,'stroke-dasharray="6 3"');
    s+=`<circle cx="${tx}" cy="${ty}" r="3.3" fill="${c}"/>`+marca(x,y,f.tipo,'nuevo');
    s+=label(x-5,y+22,'DD-0'+f.numero,11,'middle');
  }
  s+=line(490,58,490,385,'#c3cdc3')+label(512,80,'Puente de 4,00 m',21,'start');
  s+=label(512,115,'DD-01 y DD-04 · Fresnel',15,'start','font-weight="bold" fill="#086c56"')+label(512,138,'Cruce blanco a la altura',14,'start')+label(512,157,'del rostro de los bailarines.',14,'start');
  s+=label(512,204,'DD-02 y DD-03 · PAR RGBAW',15,'start','font-weight="bold" fill="#316216"')+label(512,227,'Color dirigido a dos puntos',14,'start')+label(512,246,'del interior de la tarima.',14,'start');
  s+=label(512,301,'Hacia el altar ←',14,'start')+label(512,325,'Hacia el público ↓',14,'start');
  s+=line(30,498,30+2*scale,498,colors.ink,'stroke-width="3"')+label(30+scale,490,'2 m',12);
  s+=label(26,532,'Contorno según CAD. Tarima, monitor y enfoque propuestos según fotografía, pendientes de medición.',13,'start');
  return s+'</g></svg>';
}
fs.writeFileSync(path.join(out,'danza-derecha.svg'),detalleDanza());
module.exports={ramas:trunk,fmt,addr,out,plan,familias,existentes,nuevos,totalNuevos,gruposFuturos};
