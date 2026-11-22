/* Coordenadas relativas del croquis, vistas desde las butacas. Z crece hacia el público. */
const plantaAuditorio = (() => {
  function curva(a, b, c, d, pasos=14) {
    return Array.from({length:pasos+1}, (_,i)=>{
      const t=i/pasos, u=1-t;
      return a.map((n,k)=>u**3*n+3*u*u*t*b[k]+3*u*t*t*c[k]+t**3*d[k]);
    });
  }
  // Planta baja y detalles PB. El ancho de escena de la maqueta (12,20) fija
  // la escala relativa. Cada muro tiene un tramo recto antes del giro a sala.
  const izquierda=[[-6.10,-5.05],...curva([-8.62,-5.08],[-10.04,-4.65],[-11.13,-3.34],[-11.20,-1.68])];
  const derecha=[[6.10,-4.90],...curva([8.50,-4.91],[10.14,-4.90],[11.50,-3.77],[11.55,-2.51])];
  const fondo=-7.90, ladoIzq=izquierda.at(-1)[0], ladoDer=derecha.at(-1)[0];
  const contorno=[[ladoIzq,fondo],[ladoDer,fondo],[ladoDer,6.77],[10.96,7.2],
    [8.45,7.67],[-8.4,7.67],[ladoIzq,5.85]];
  return {
    contorno, izquierda, derecha, fondo, ladoIzq, ladoDer,
    danza:[-1,1].map(lado=>({x:lado*8.45,z:-3.35,w:2.18,d:1.56})),
    ingreso:{x:ladoDer,z:2.1,ancho:1.66},
    // Hipótesis dimensional de fotometría, en metros. Haz completo al 50 %.
    sala:{altura:4.66,planoLectura:.75,haz:41,
      posiciones:[[-7.2,1.1],[7.2,1.1],[-2.6,1.32],[2.6,1.32],[-3.1,4.85],[3.1,4.85]],
      ampliacion:[[-8.3,4.4],[8.3,4.4]]},
    frontalZ:-.53, barraZ:2.82, cannonX:[-3.90,-1.36,1.19,3.84],
    panel:{x:0,z:-6.36,w:8.72,base:.685,h:2.57},
    barrasX:[-2.65,-1.34,0,1.34,2.65], parX:[-4.24,-3.85,3.11,3.48]
  };
})();
