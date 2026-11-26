/* Planta baja H21. Metros, Y sobre el piso de sala y Z hacia las butacas. */
const plantaAuditorio = (() => {
  const anchoSala = 34.34, anchoAltar = 19.42, fondoAltar = 5.78;
  const ladoDer = anchoSala/2, ladoIzq = -ladoDer, fondo = -6.8;
  const frenteAltar = fondo + fondoAltar;
  const arranqueDerecho = fondo + 4.13, limiteSala = arranqueDerecho + 12.14;
  const extremoPB = limiteSala + 6.2; // Tramo bajo entrepiso aproximado.
  const contorno = [[ladoIzq,fondo],[ladoDer,fondo],[ladoDer,extremoPB],[ladoIzq,extremoPB]];
  function ala(signo,arranque) {
    const puntos = [[signo*anchoAltar/2,arranque]];
    for(let i=0;i<=18;i++){
      const a=i*Math.PI/36;
      puntos.push([signo*(12.3+(ladoDer-12.3)*Math.sin(a)),arranque+4.75*(1-Math.cos(a))]);
    }
    return puntos;
  }
  const izquierda=ala(-1,fondo+4.01), derecha=ala(1,arranqueDerecho);
  const danza=[-1,1].map(s=>({x:s*12.45,z:-1.38,w:2.6,d:1.65}));
  // Tramos de montaje propuestos. Sus longitudes y vanos necesitan replanteo.
  function diagonal(signo){
    const cx=signo*12.88, cz=1.55, angulo=36*Math.PI/180;
    const dx=2*Math.cos(angulo), dz=signo*2*Math.sin(angulo);
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
    p.equipos=tipos.map((tipo,i)=>({tipo,numero:i+1,pos:punto(p,(i+.5)/tipos.length)}));
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
  const bloques=[[-10.6,2.45,4,6,-.42],[-3.85,1.15,6,7,-.12],[3.85,1.15,6,7,.12],[10.6,2.45,4,6,.42]];
  return {ramales:ramas,anchoSala,anchoAltar,fondoAltar,frenteAltar,arranqueDerecho,limiteSala,extremoPB,
    contorno,izquierda,derecha,fondo,ladoIzq,ladoDer,danza,puentes,porId,punto,filasSala,bloques,
    ingreso:{x:ladoDer,z:3.1,ancho:2},
    sala:{altura:4.66,planoLectura:.75,haz:41,
      posiciones:[[-12,1.1],[12,1.1],[-4.3,1.32],[4.3,1.32],[-5.1,6.65],[5.1,6.65]],
      ampliacion:[[-13.5,6.4],[13.5,6.4]]},
    frontalZ:porId.principal.a[1],barraZ:3.55,cannonX:[-6.3,-2.2,2,6.2],
    panel:{x:0,z:-6.36,w:13.82,base:.685,h:2.57},
    barrasX:[-4.5,-2.25,0,2.25,4.5],parX:[-6.24,-5.75,5.42,5.94]};
})();
if(typeof module !== 'undefined' && module.exports) module.exports=plantaAuditorio;
