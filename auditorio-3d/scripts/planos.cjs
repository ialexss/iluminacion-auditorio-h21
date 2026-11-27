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
const colors={ink:'#172722',fine:'#77867e',paper:'#f8f9f4',metal:'#191919',green:'#057357',control:'#007958',amber:'#9d5634',pl:'#554591',ld:'#167984'};
const tr=(x,z)=>[425+x*19.8,203+(z+1.35)*19.8];
const coords=(points)=>points.map(p=>tr(...p).map(n=>n.toFixed(2)).join(',')).join(' ');
const label=(x,y,s,size=13,anchor='middle',attr='')=>`<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" ${attr}>${s}</text>`;
const line=(x1,y1,x2,y2,color=colors.fine,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
function dim(x1,y1,x2,y2,s,vertical=false){
 return line(x1,y1,x2,y2,colors.fine)+[0,1].map(i=>{const x=i?x2:x1,y=i?y2:y1;return line(x-(vertical?4:0),y-(vertical?0:4),x+(vertical?4:0),y+(vertical?0:4))}).join('')+
 (vertical?label(x1+7,(y1+y2)/2,s,12,'start'):label((x1+x2)/2,y1-5,s,13));
}
function sheet(wiring){
 const h=592;let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 910 ${h}" role="img" aria-labelledby="t d"><title id="t">${wiring?'Ramales DMX':'Planta de montaje acotada'}</title><desc id="d">Dos puentes de danza de 4 m en diagonal, tres puentes de ocho PAR y cinco filas de nueve puntos de sala.</desc><rect width="910" height="${h}" fill="${colors.paper}"/><g font-family="Helvetica,Arial,sans-serif" fill="${colors.ink}">`;
 s+=label(34,29,wiring?'CABLEADO  /  RAMALES DE DATOS':'PLANTA BAJA  /  MONTAJE PROPUESTO',13,'start','font-weight="bold" letter-spacing="1.8"');
 s+=label(876,29,'H21   ·   26.11.2026',12,'end');
 const poly=(pts,fill,stroke,extra='')=>`<polygon points="${coords(pts)}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
 const polyline=(pts,stroke,extra='')=>`<polyline points="${coords(pts)}" fill="none" stroke="${stroke}" ${extra}/>`;
 const W=plan.ladoDer,A=plan.anchoAltar/2;
 s+=poly([[-W,plan.fondo],[W,plan.fondo],[W,plan.extremoPB],[-W,plan.extremoPB]],'#fff','#a8b3ad');
 s+=poly([[-W,plan.limiteSala],[W,plan.limiteSala],[W,plan.extremoPB],[-W,plan.extremoPB]],'#e9ede8','none');
 for(const [sig,curve] of [[-1,plan.izquierda],[1,plan.derecha]])s+=poly([...curve,[sig*W,plan.fondo],[sig*A,plan.fondo]],'#e8ece6','#95a39a');
 s+=poly([[-A,plan.fondo],[A,plan.fondo],[A,plan.frenteAltar],[-A,plan.frenteAltar]],'#e3ebe3','#8c9d91');
 s+=label(425,140,'ALTAR',12,'middle','fill="#59675d" letter-spacing="2"');
 if(!wiring)for(const {x,z,giro} of plan.asientos){
   const [px,py]=tr(x,z);
   s+=`<rect x="${px-4.9}" y="${py-3.8}" width="9.8" height="7.6" rx="1" fill="#dce1da" transform="rotate(${-giro*180/Math.PI} ${px} ${py})"/>`;
 }
 for(const pantalla of plan.pantallas)s+=polyline([[pantalla.x-pantalla.w/2,pantalla.z],[pantalla.x+pantalla.w/2,pantalla.z]],'#3d6171','stroke-width="4"');
 for(const pad of plan.danza){
   s+=poly([[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>plan.enTarima(pad,i*pad.w/2,j*pad.d/2)),'#d9dfd6','#87988b');
   const [px,py]=tr(pad.x,pad.z);s+=label(px,py+4,'DANZA',9);
 }
 if(!wiring)for(const p of plan.puentes.filter(p=>p.tipos))for(const f of p.equipos){
   s+=polyline([f.pos,[f.objetivo[0],f.objetivo[2]]],f.tipo==='F'?'#387664':'#91689b','stroke-width="1.3" stroke-dasharray="3 2"');
 }
 for(const [i,p] of plan.puentes.entries()){
   const lateral=i<2;
   s+=polyline([p.a,p.b],colors.metal,'stroke-width="5" stroke-linecap="round"');
   for(const f of p.equipos){const [px,py]=tr(...f.pos);s+=f.tipo==='F'?`<rect x="${px-4}" y="${py-4}" width="8" height="8" fill="#fff" stroke="${colors.green}" stroke-width="2"/>`:`<circle cx="${px}" cy="${py}" r="3.8" fill="#4c7961" stroke="white" stroke-width="1.2"/>`;}
   const [px,py]=tr(...(lateral?(i?p.b:p.a):p.b));
   s+=label(px+(i===0?-10:9),py-6,p.codigo+(lateral?' · 4 m':''),12,i===0?'end':'start','font-weight="bold"');
 }
 for(const [i,row] of plan.filasSala.entries()){
   for(const pos of row.puntos){const [px,py]=tr(...pos);s+=`<circle cx="${px}" cy="${py}" r="4.3" fill="${i%2?colors.ld:colors.pl}"/>`;}
 }
 if(wiring){
  for(const [n,r] of ramas.entries()){
   const sala=r.u===2, color=sala?['#715995','#087a88','#496289'][n-5]:colors.control;
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
  s+=dim(xl,65,xr,65,'34,34 m · salón');
  s+=dim(tr(-A,0)[0],yt-9,tr(A,0)[0],yt-9,'19,42 m · altar');
  s+=dim(45,tr(0,plan.fondo)[1],45,tr(0,plan.frenteAltar)[1],'5,78 m',true);
  const y1=tr(0,plan.arranqueDerecho)[1],y2=tr(0,plan.limiteSala)[1];
  s+=line(xr,y1,813,y1,colors.fine,'stroke-dasharray="3 3"')+line(xr,y2,813,y2,colors.fine,'stroke-dasharray="3 3"')+dim(815,y1,815,y2,'12,14 m',true);
  s+=label(425,489,'Sector bajo el entrepiso · profundidad aproximada',13);
 }
 s+=label(34,563,wiring?'Trazo discontinuo · ruta propuesta hasta el primer equipo y secuencia de sala.':'■  Fresnel     ●  PAR RGBAW     ●  PL-01 (filas 1, 3 y 5)     ●  LD-01 (filas 2 y 4)',13,'start');
 s+=label(34,582,wiring?'Medir canalizaciones, bajadas y holguras en sitio. La posición de los distribuidores es orientativa.':'Fresnel y PAR de danza · ejes discontinuos dirigidos a cada tarima. Butacas estimadas por fotografía.',12,'start','fill="#526258"');
 return s+'</g></svg>';
}
fs.writeFileSync(path.join(out,'planta.svg'),sheet(false));
fs.writeFileSync(path.join(out,'ramales.svg'),sheet(true));
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
    const objetivo=[f.objetivo[0],f.objetivo[2]], c=f.tipo==='F'?'#167259':'#865497';
    const [x,y]=xy(f.pos),[tx,ty]=xy(objetivo);
    s+=path([f.pos,objetivo],c,2.2,'stroke-dasharray="6 3"');
    s+=`<circle cx="${tx}" cy="${ty}" r="3.3" fill="${c}"/><circle cx="${x}" cy="${y}" r="5" fill="${c}" stroke="white" stroke-width="1.5"/>`;
    s+=label(x-5,y+22,'DD-0'+f.numero,11,'middle');
  }
  s+=line(490,58,490,385,'#c3cdc3')+label(512,80,'Puente de 4,00 m',21,'start');
  s+=label(512,115,'DD-01 y DD-04 · Fresnel',15,'start','font-weight="bold" fill="#12634a"')+label(512,138,'Cruce blanco a la altura',14,'start')+label(512,157,'del rostro de los bailarines.',14,'start');
  s+=label(512,204,'DD-02 y DD-03 · PAR RGBAW',15,'start','font-weight="bold" fill="#754884"')+label(512,227,'Color dirigido a dos puntos',14,'start')+label(512,246,'del interior de la tarima.',14,'start');
  s+=label(512,301,'Hacia el altar ←',14,'start')+label(512,325,'Hacia el público ↓',14,'start');
  s+=line(30,498,30+2*scale,498,colors.ink,'stroke-width="3"')+label(30+scale,490,'2 m',12);
  s+=label(26,532,'Contorno según CAD. Tarima, monitor y enfoque propuestos según fotografía, pendientes de medición.',13,'start');
  return s+'</g></svg>';
}
fs.writeFileSync(path.join(out,'danza-derecha.svg'),detalleDanza());
module.exports={ramas:trunk,fmt,addr,out,plan};
