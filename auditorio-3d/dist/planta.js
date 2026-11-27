/* Planta baja H21. Metros, Y sobre el piso de sala y Z hacia las butacas. */
const plantaAuditorio = (() => {
  const anchoSala = 34.34, anchoAltar = 19.42, fondoAltar = 5.78;
  const ladoDer = anchoSala/2, ladoIzq = -ladoDer, fondo = -6.8;
  const frenteAltar = fondo + fondoAltar;
  const arranqueDerecho = fondo + 4.13, limiteSala = arranqueDerecho + 12.14;
  const extremoPB = limiteSala + 6.2; // Tramo bajo entrepiso aproximado.
  const contorno = [[ladoIzq,fondo],[ladoDer,fondo],[ladoDer,extremoPB],[ladoIzq,extremoPB]];
  // Trazado de las dos curvas del CAD. La referencia horizontal va del píxel 201 al 1135.
  const metrosPorPixel=anchoSala/(1135-201);
  function ala(signo, arranque, pixelInicio, profundidad){
    const inicio=(pixelInicio-201)*metrosPorPixel+ladoIzq;
    const puntos=[[signo*anchoAltar/2,arranque]];
    for(let i=0;i<=32;i++){
      const a=i*Math.PI/64;
      puntos.push([inicio+(signo*ladoDer-inicio)*Math.sin(a),arranque+profundidad*metrosPorPixel*(1-Math.cos(a))]);
    }
    return puntos;
  }
  const izquierda=ala(-1,fondo+4.01,305,111), derecha=ala(1,arranqueDerecho,1018,126);
  function paredEn(x){
    const curva=x<0?izquierda:derecha;
    const i=curva.findIndex(([px])=>Math.abs(px)>=Math.abs(x));
    if(i<=0)return curva[i===0?0:curva.length-1][1];
    const [ax,az]=curva[i-1],[bx,bz]=curva[i];
    return az+(bz-az)*(x-ax)/(bx-ax);
  }
  function enTarima(p, lateral, profundidad){
    const c=Math.cos(p.giro),s=Math.sin(p.giro);
    return [p.x+lateral*c+profundidad*s,p.z-lateral*s+profundidad*c];
  }
  // Mobiliario y pantallas estimados con las fotos 7720–7725.
  const pantallas=[izquierda,derecha].map(([a,b])=>({x:(a[0]+b[0])/2,z:a[1]+.14,w:1.8,h:1.01}));
  const danza=[-1,1].map(signo=>{
    const x=signo*14.32;
    const tarima={x,z:0,w:2.7,d:1.65,giro:-Math.atan((paredEn(x+.35)-paredEn(x-.35))/.70)};
    const esquinasTraseras=[-1,1].map(lado=>enTarima(tarima,lado*tarima.w/2,-tarima.d/2));
    tarima.z=Math.max(...esquinasTraseras.map(([px,dz])=>paredEn(px)-dz))+.22;
    return tarima;
  });
  function diagonal(signo){
    const tarima=danza[signo<0?0:1],cx=tarima.x-signo*.90,cz=tarima.z+3.95;
    const angulo=36*Math.PI/180,dx=2*Math.cos(angulo),dz=signo*2*Math.sin(angulo);
    return {a:[cx-dx,cz-dz],b:[cx+dx,cz+dz],y:6.96,alturaProvisional:true};
  }
  const puentes=[
    {id:'left',codigo:'DI',nombre:'Danza izquierda',...diagonal(-1),tipos:['F','P','P','F']},
    {id:'right',codigo:'DD',nombre:'Danza derecha',...diagonal(1),tipos:['F','P','P','F']},
    {id:'principal',codigo:'PR',nombre:'Principal',a:[-9.95,.35],b:[9.95,.35],y:6.96},
    {id:'top',codigo:'AL',nombre:'Sobre el altar',a:[-9.1,-2.75],b:[9.1,-2.75],y:7.60},
    {id:'back',codigo:'PO',nombre:'Posterior',a:[-9.1,-5.88],b:[9.1,-5.88],y:6.95}
  ];
  const porId=Object.fromEntries(puentes.map(p=>[p.id,p]));
  function punto(p,t) {return p.a.map((valor,i)=>valor+t*(p.b[i]-valor));}
  for(const p of puentes){
    const tipos=p.tipos||Array(8).fill('P');
    p.equipos=tipos.map((tipo,i)=>{
      const pos=punto(p,(i+.5)/tipos.length);
      let objetivo;
      if(p.tipos){
        const tarima=danza[p.id==='left'?0:1], fresnel=tipo==='F';
        const [x,z]=enTarima(tarima,(i<2?1:-1)*tarima.w*(fresnel?.22:.27),fresnel?.06:-.20);
        objetivo=[x,fresnel?1.85:.55,z];
      }else objetivo=[pos[0]*.89,1.33,p.id==='back'?-3.48:-3.08];
      return {tipo,numero:i+1,pos,objetivo};
    });
  }
  // Centros digitalizados del DUC sobre el ancho interior y el tramo acotado de 12,14 m.
  const filasSala = Array.from({length:5},(_,fila)=>({
    tipo:fila%2?'LD-01':'PL-01',
    puntos:Array.from({length:9},(_,col)=>[
      ladoIzq+(318+col*89.35-213)*anchoSala/(1202-213),
      arranqueDerecho+(343+fila*52-253)*12.14/(605-253)
    ])
  }));
  const pad=n=>String(n).padStart(2,'0');
  const ramas=[];
  let canal=1;
  for(const p of puentes){
    const puntos=p.equipos.map(({tipo,numero,pos})=>{
      const eq={codigo:p.codigo+'-'+pad(numero),tipo:tipo==='F'?'Fresnel':'PAR LED RGBAW',pos,
        canal,slots:16,visor:p.id+'-'+numero};
      canal+=16;return eq;
    });
    ramas.push({id:p.codigo,nombre:p.nombre,u:1,y:p.y,puntos});
  }
  canal=1;
  // Tres ramales con tres columnas contiguas cada uno. Serpentina vertical en cada columna.
  for(let sector=0;sector<3;sector++){
    const puntos=[];
    for(let k=0;k<3;k++)for(let paso=0;paso<5;paso++){
      const col=sector*3+k, f=k%2?paso:4-paso, fila=filasSala[f];
      puntos.push({codigo:'S'+(f+1)+'-'+pad(col+1),tipo:fila.tipo,pos:fila.puntos[col],
        canal,slots:10,visor:'house-'+(f*9+col+1)});canal+=10;
    }
    ramas.push({id:'S'+(sector+1),nombre:'Sala '+['izquierda','central','derecha'][sector],u:2,y:4.66,puntos});
  }
  // Secciones en abanico, con un bloque continuo frente a la escalera central.
  // Las imágenes permiten reconstruir el patrón, pero no contar el aforo del salón.
  const bloques=[[-11.36,1.38,8,9,-.33],[-5.93,.67,9,10,-.115],[0,.59,9,11,0],
    [5.93,.67,9,10,.115],[11.36,1.38,8,9,.33]];
  const asientos=[];
  for(const [cx,cz,columnas,filas,giro] of bloques){
    const c=Math.cos(giro),s=Math.sin(giro);
    for(let f=0;f<filas;f++)for(let col=0;col<columnas;col++){
      const dx=(col-(columnas-1)/2)*.56, dz=f*.82;
      asientos.push({x:cx+dx*c+dz*s,z:cz-dx*s+dz*c,giro});
    }
  }
  const panel={x:0,z:-6.36,w:13.82,base:.685,h:2.57};
  const barraZ=3.55, profundidadPuente=.34;
  const perfiles={
    P1:{nombre:'Chauvet SlimPAR Q12BT',canales:'010–017',tipo:'PAR de piso'},
    P2:{nombre:'ADJ COB Cannon Wash DW',canales:'235–238',tipo:'COB frontal'},
    P3:{nombre:'Chauvet EVE F-50Z',canales:'257–259',tipo:'Fresnel frontal'},
    P4:{nombre:'LED PAR Light 7 4in1',canales:'225–232',tipo:'PAR frontal'}
  };
  const frontales=[[-9.49,'P3'],[-6.94,'P2'],[-4.15,'P4'],[-1.65,'P4'],[1.64,'P4'],[4.18,'P4'],[6.92,'P2'],[9.48,'P3']];
  const frecuencias={};
  const existentes=frontales.map(([x,familia],i)=>{
    const numero=frecuencias[familia]=(frecuencias[familia]||0)+1;
    return {codigo:familia+'-'+pad(numero),familia,grupo:'front',visor:'front-'+(i+1),
      pos:[x,porId.principal.a[1]-profundidadPuente],lugar:'Puente principal',
      perfil:{key:familia,name:perfiles[familia].nombre,channels:perfiles[familia].canales}};
  });
  for(const [i,x] of [-6.3,-2.2,2,6.2].entries()){
    const codigo='MH'+(i+4),inicio=265+i*20;
    existentes.push({codigo,familia:'MH',grupo:'moving',visor:'moving-'+(i+1),pos:[x,barraZ],
      lugar:'Barra sobre público',perfil:{key:codigo,name:'Generic Spot Beam ST',channels:inicio+'–'+(inicio+17)}});
  }
  for(const [i,x] of [-6.24,-5.75,5.42,5.94].entries()){
    existentes.push({codigo:'P1-'+pad(i+1),familia:'P1',grupo:'par',visor:'par-'+(i+1),
      pos:[x,panel.z+.78],lugar:'Piso del escenario',pendienteDMX:true,
      perfil:{key:'P1',name:perfiles.P1.nombre,channels:perfiles.P1.canales}});
  }
  for(const [i,x] of [-4.5,-2.25,0,2.25,4.5].entries()){
    existentes.push({codigo:'BL-'+pad(i+1),familia:'BL',grupo:'bars',visor:'bars-'+(i+1),
      pos:[x,panel.z+.49],lugar:'Piso del escenario',pendienteDMX:true,estimado:true});
  }
  return {ramales:ramas,anchoSala,anchoAltar,fondoAltar,frenteAltar,arranqueDerecho,limiteSala,extremoPB,
    contorno,izquierda,derecha,fondo,ladoIzq,ladoDer,danza,enTarima,pantallas,paredEn,puentes,porId,punto,filasSala,asientos,
    ingreso:{x:ladoDer,z:3.1,ancho:2},
    sala:{altura:4.66,planoLectura:.75,haz:41,
      posiciones:[[-12,1.1],[12,1.1],[-4.3,1.32],[4.3,1.32],[-5.1,6.65],[5.1,6.65]],
      ampliacion:[[-13.5,6.4],[13.5,6.4]]},
    barraZ,profundidadPuente,panel,perfiles,existentes};
})();
if(typeof module !== 'undefined' && module.exports) module.exports=plantaAuditorio;
