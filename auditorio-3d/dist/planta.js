/* Coordenadas relativas del croquis, vistas desde las butacas. Z crece hacia el público. */
const plantaAuditorio = (() => {
  function curva(a, b, c, d, pasos=14) {
    return Array.from({length:pasos+1}, (_,i)=>{
      const t=i/pasos, u=1-t;
      return a.map((n,k)=>u**3*n+3*u*u*t*b[k]+3*u*t*t*c[k]+t**3*d[k]);
    });
  }
  const izquierda=curva([-6.1,-4.15],[-7.68,-4.25],[-9.15,-3.15],[-10.02,-1.90]);
  const derecha=curva([6.1,-4.18],[7.86,-4.32],[9.47,-4.46],[10.34,-3.04]);
  const lateralIzq=curva(izquierda.at(-1),[-10.73,-.89],[-10.82,.4],[-10.84,2.17]);
  const lateralDer=curva(derecha.at(-1),[11.14,-1.94],[11.28,.46],[11.28,1.25]);
  const contorno=[[-6.42,-7.15],[6.42,-7.15],[10.34,-5.62],...lateralDer,
    [11.28,6.77],[10.96,7.2],[8.45,7.67],[-8.4,7.67],[-10.84,5.85],
    ...lateralIzq.slice().reverse(),[-10.02,-5.62]];
  return {
    contorno, izquierda, derecha, lateralIzq, lateralDer,
    // Dos tarimas simétricas junto a las escaleras laterales. Las cotas son orientativas.
    danza:[-1,1].map(lado=>({x:lado*7.93,z:-2.22,w:2.18,d:1.56})),
    ingreso:{x:11.28,z:2.1,ancho:1.66},
    // Hipótesis dimensional de fotometría, en metros. Haz completo al 50 %.
    sala:{altura:4.66,planoLectura:.75,haz:41,
      posiciones:[[-7.2,1.1],[7.2,1.1],[-2.6,1.32],[2.6,1.32],[-3.1,4.85],[3.1,4.85]],
      ampliacion:[[-8.3,4.4],[8.3,4.4]]},
    frontalZ:-.53, barraZ:2.82, cannonX:[-3.90,-1.36,1.19,3.84],
    panel:{x:0,z:-6.36,w:8.72,base:.685,h:2.57},
    barrasX:[-2.65,-1.34,0,1.34,2.65], parX:[-4.24,-3.85,3.11,3.48]
  };
})();
