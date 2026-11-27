/* Genera el HTML de impresión. Pasar un directorio temporal como primer argumento. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {ramas,plan,fmt,addr,out,familias,existentes,nuevos,totalNuevos,gruposFuturos}=require('./planos.cjs');
const destino=process.argv[2];
if(!destino)throw new Error('Indica un directorio temporal para el HTML de impresión.');
fs.mkdirSync(destino,{recursive:true});

const perfiles=existentes.filter(f=>f.perfil).length;
const barras=existentes.filter(f=>f.familia==='BL').length;
const faseFutura=gruposFuturos.reduce((suma,f)=>suma+f.cantidad,0);
const totalFamilia=Object.fromEntries(Object.keys(familias).map(id=>[id,[...existentes,...nuevos].filter(f=>f.familia===id).length]));
const dist=path.resolve(out,'../..');
const web='https://lucesh21.landydrop.com/';
const img=(recurso,alt)=>`<img src="${pathToFileURL(path.join(dist,'recursos',recurso)).href}" alt="${alt}">`;
const tabla=(columnas,filas)=>`<table><thead><tr>${columnas.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${filas.map(f=>`<tr>${f.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const header=(seccion,titulo,cuerpo)=>({seccion,titulo,cuerpo});
const css=`
@page{size:A4;margin:0}*{box-sizing:border-box}
body{margin:0;color:#1b2b23;font:11pt/1.42 Helvetica,Arial,sans-serif}
.page{position:relative;width:210mm;height:296mm;padding:13mm 15mm 18mm;break-after:page}
.page:last-child{break-after:auto}
@media print{*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
header,footer{display:flex;justify-content:space-between;gap:15px;font:8.4pt/1.4 monospace;letter-spacing:.04em;color:#365645}
header{border-bottom:1px solid #567469;padding-bottom:7px}
footer{position:absolute;bottom:9mm;left:15mm;right:15mm;border-top:1px solid #9db2a3;padding-top:7px}
h1{font-size:29pt;font-weight:550;line-height:1.04;letter-spacing:-.8pt;margin:5.5mm 0 4mm}
h2{font-size:14pt;line-height:1.2;margin:4.8mm 0 1.4mm}
p,figure{margin:1.8mm 0 3.6mm}
ul,ol{padding-left:5.2mm;margin:2mm 0 4mm}li{margin-bottom:2mm}
.lead{font-size:13pt;line-height:1.34;color:#315b4a}
.fine,figcaption{font-size:9.3pt;color:#465b50}
table{width:100%;border-collapse:collapse;font-size:10pt;line-height:1.24;margin:2.5mm 0 3.6mm}
th,td{text-align:left;border-bottom:1px solid #c7d2c9;padding:1.7mm;vertical-align:top}
th{background:#edf2ec;color:#27493b}
img{display:block;width:100%;border:1px solid #c1cec2}
a{color:#195c44;text-underline-offset:2px}
.twocol{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.examples{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm}.examples img{height:30mm;object-fit:contain;background:#f7f9f6}.examples figure{margin:0}
`;
function archivo(nombre,titulo,paginas,extra=''){
 const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>H21 · ${titulo}</title><style>${css}${extra}</style></head><body>${paginas.map((p,i)=>`<section class="page">
 <header><b>H21 / SALÓN 01 · ${p.seccion}</b><span>26 NOV 2026</span></header>
 <h1>${p.titulo}</h1>${p.cuerpo}
 <footer><span>Proyecto de iluminación · ${titulo}</span><b>${i+1} / ${paginas.length}</b></footer>
 </section>`).join('')}</body></html>`;
 fs.writeFileSync(path.join(destino,nombre+'.html'),html);
}
const cantidadesBase=[
 ['Danza izquierda y derecha','2 Fresnel + 2 PAR RGBAW por tarima',8],
 ['Escenario · principal existente','8 PAR RGBAW adicionales',8],
 ['Escenario · sobre el altar','8 PAR RGBAW en puente nuevo',8],
 ['Escenario · posterior','8 PAR RGBAW en puente nuevo',8],
 ['Sala · cinco filas de nueve','27 PL-01 + 18 LD-01',45]
];
const notaExistentes=`Hay ${perfiles} posiciones asociadas a perfiles en la captura de Lightkey y ${barras} barras LED de piso junto al banner. Sus posiciones en el plano son orientativas. P1 y las barras ya están instalados. Su conexión a DMX está pendiente.`;
const notaFutura=`La fase musical añade ${faseFutura} equipos de manera opcional. Requiere su propio estudio de carga y parche antes de incorporarla.`;
const fotos=(n,alt,leyenda)=>`<figure>${img('montaje/'+n+'.webp',alt)}<figcaption>${leyenda}</figcaption></figure>`;

archivo('informe','Resumen del proyecto',[header('RESUMEN','Iluminación del auditorio',`
 <p class="lead">${totalNuevos} puntos nuevos para iluminar el altar, las dos tarimas y la sala.</p>
 ${img('puentes/planta-combinada.svg','Planta de iluminación existente y nueva con leyenda')}
 ${tabla(['Zona','Dotación nueva','Puntos'],cantidadesBase)}
 <p><b>Equipos existentes.</b> ${notaExistentes} Los ocho frontales del puente principal se conservan y se complementan con ocho PAR RGBAW nuevos.</p>
 <p><b>Luz de sala.</b> El plano DUC distribuye 27 PL-01 y 18 LD-01. El diseño integra regulación con Lightkey y un mando de pared para uso con el Mac apagado. ${notaFutura}</p>
 <p class="fine">Ancho de sala 34,34 m. Altar 19,42 × 5,78 m. Frente curvo y dos escaleras laterales. Cada diagonal de danza mide 4,00 m de largo. El aforo y las posiciones de mobiliario requieren levantamiento. <a href="${web}#referencias">Planos y leyendas en la web</a>.</p>`)]);

const filasExistentes=['P1','P2','P3','P4','MH','BL'].map(id=>{
 const grupo=existentes.filter(f=>f.familia===id);
 const f=grupo[0];
 return [familias[id].nombre,totalFamilia[id],f.lugar,
  id==='MH'?'265–282 / 285–302 / 305–322 / 325–342':f.perfil?.channels||'Por levantar',
  f.pendienteDMX?'Pendiente de conexión':'Verificar en equipo'];
});
const sandbox=vm.createContext({window:{}});
for(const f of ['planta.js','fotometria.js'])vm.runInContext(fs.readFileSync(path.join(dist,f),'utf8'),sandbox);
const fotometria=sandbox.window.Fotometria;
const alturas=[4.66,plan.sala.altura,7.60];
const resultados=alturas.map(h=>fotometria.calculate(plan.filasSala.flatMap(f=>f.puntos).length,h,.75));
const casoBase=resultados[1];
const casos=resultados.map(r=>{
 return [fmt(r.height),r.seats150+' / '+r.totalSeats,fmt(100*r.area150/r.totalArea,1)+' %',fmt(r.seatMin,1),fmt(r.gridMin,2),fmt(r.gridMean,1)];
});
archivo('informe-tecnico','Informe técnico',[
 header('INVENTARIO','Inventario y control de luces',`
 <p class="lead">Inventario U0 observado y reservas de la compra base.</p>
 <h2>Existentes en el auditorio</h2>
 ${tabla(['Familia','Ud.','Ubicación','Canales en U0','Estado'],filasExistentes)}
 <p class="fine">Los bloques de P1–P4 corresponden a los perfiles que muestra la captura, con posible direccionamiento compartido. Cotejar modelo, modo, dirección y respuesta en cada aparato antes de cambiar el parche.</p>
 <h2>Compra base · ${totalNuevos} puntos</h2>
 ${tabla(['Ramal','Destino','Universo','Bloque preliminar','Puntos'],ramas.map(r=>[r.id,r.nombre,'U'+r.u,addr(r.puntos[0].canal)+'–'+addr(r.puntos.at(-1).canal+r.puntos[0].slots-1),r.puntos.length]))}
 <p>U1 reserva 16 canales por equipo y U2, 10 por punto. Ajustar la reserva al modo real seleccionado. Los PAR del piso y sus barras requieren revisar la asignación y el cableado de U0.</p>
 <p class="fine"><a href="${web}recursos/puentes/inventario-iluminacion.csv">Inventario por ID de campo</a> · <a href="${web}recursos/puentes/patch-propuesto.csv">Parche preliminar</a>.</p>`),
 header('LUZ DE SALA','Cobertura blanca de sala',`
 <p class="lead">Simulación con el trazado de 45 puntos PL-01 y LD-01 del DUC.</p>
 <p>Se usa como ensayo una óptica común Elation FUZE Pendant Compact de 45° en blanco a 3.200 K. Cálculo horizontal directo en retícula de 5 cm, sobre el plano de lectura de 0,75 m. Factor de mantenimiento de 0,80. Se analizaron ${fmt(casoBase.totalArea)} m² delante del entrepiso.</p>
 ${tabla(['Altura óptica (m)','Sillas ≥150 lx','Área ≥150 lx','Mín. sillas (lx)','Mín. sala (lx)','Media sala (lx)'],casos)}
 <p>A ${fmt(casoBase.height)} m, el modelo estima ${casoBase.seats150} de ${casoBase.totalSeats} sillas en 150 lx o más. Se ensaya esa cota para dejar más espacio a los haces de escenario. Verificar estructura, suspensiones y enfoque en sitio. Los mínimos de borde muestran que hace falta comprobar huecos y recorridos. Las sillas se reconstruyeron con fotos y su número es ilustrativo.</p>
 <h2>Prueba de luz real</h2>
 <ol><li>Identificar los modelos PL-01 y LD-01. Incorporar cada archivo IES o LDT y la altura óptica medida.</li>
 <li>Medir con luxómetro en puntos centrales, bordes, pasillos, acceso y bajo el voladizo. Revisar reflejos en pantallas y deslumbramiento desde las primeras filas.</li>
 <li>Probar regulación baja, consistencia de blanco y parpadeo con la cámara del auditorio. Confirmar los valores aplicables según el uso y las exigencias del recinto.</li></ol>
 <p class="fine">El mapa modela un trayecto libre entre emisores y plano de cálculo. Bajo el entrepiso se requiere su propia luz local y mediciones. <a href="${web}#cobertura">Simulador y comparación de alturas</a> · <a href="https://assets.centryngroup.com/dl/files/FUZ292__DL__006.zip">IES de ensayo</a>.</p>
 <h2>Uso diario desde la pared</h2><p>Prever controlador arquitectónico con prioridad local, escena blanca guardada y pulsadores Encender y Apagar. Probar con el Mac apagado, pérdida de DMX y retorno a control de Lightkey. El alumbrado de emergencia usa su circuito independiente.</p>`),
 header('OPERACIÓN','Programación y puesta en servicio',`
 <p class="lead">Control por zonas y prueba de la instalación desde las butacas.</p>
 ${tabla(['Escena','Escenario y danza','Sala y fondo'],[
 ['Recepción / salida','Luz de escenario moderada','Blanco de sala para circulación'],
 ['Prédica','Frontal blanco, relleno superior y contraluz suave','Blanco tenue para lectura. Banner discreto'],
 ['Danza','Blanco cruzado con Fresnel y color en las tarimas con PAR','Ambiente suave manteniendo legibles los escalones'],
 ['Alabanza y adoración','Principal, superior y posterior graduados por separado','Ambiente RGB. Fase opcional con bañadores, barras y móviles wash']
 ])}
 <ol><li>Respaldar el show y verificar patch, modos y numeración de Art-Net nodo por nodo. Ensayar por separado P1 y barras de piso antes de unirlos a U0.</li>
 <li>Comprobar terminaciones, rotulado y respuesta por ramal. Enfocar los Fresnel en cruce, recortar sobre las tarimas y comprobar que la pantalla quede libre de reflejo.</li>
 <li>Medir en blanco de sala y revisar el pulso de las escenas con el operador habitual. Guardar un respaldo del parche, niveles y posiciones aprobadas.</li>
 <li>Probar el modo local de sala y las secuencias de encendido y recuperación. Registrar tensión, protecciones, carga y mantenimiento por circuito.</li></ol>
 <p>${notaFutura} <a href="${web}#ampliacion">Comparar las escenas en el montaje base y ampliado</a>.</p>
 <p class="fine">Documentación de control. <a href="https://www.lightkeyapp.com/en/help">Lightkey Help Center</a> · <a href="https://support.etcconnect.com/ETC/Getting_Started_with_ETC_and_FAQ/DMX512-Info">ETC · DMX512 Info</a>.</p>`)
]);

const presupuestoBase=[
 ['Fresnel LED con viseras',totalFamilia.F],['PAR LED RGBAW',totalFamilia.P],['Puntos PL-01',totalFamilia['PL-01']],['Puntos LD-01',totalFamilia['LD-01']],
 ['Puente diagonal de danza · 4 m',2],['Puente sobre altar y puente posterior',2],['Revisión y ampliación del puente principal',1],
 ['Nodo o salidas Art-Net', 'Según inventario'],['Distribuidores aislados U1 y U2',2],['Terminadores DMX 120 Ω',8],
 ['Cable de datos, potencia, herrajes y mano de obra','Por medir']
];
archivo('plan-iluminacion','Montaje y presupuesto',[
 header('MONTAJE','Qué se incorpora',`
 <p class="lead">Cuatro Fresnel, 28 PAR RGBAW y 45 puntos de sala en la fase base.</p>
 ${img('puentes/planta.svg','Planta de equipos nuevos con símbolos, colores y códigos')}
 ${tabla(['Zona','Dotación nueva','Puntos'],cantidadesBase)}
 <div class="examples">${fotos('fresnel','Fresnel con viseras','Fresnel · ejemplo de cuerpo y viseras')}${fotos('par','PAR LED','PAR · ejemplo multicolor')}${fotos('colgante','Colgante fotométrico','Óptica de ensayo para la sala')}</div>
 <p class="fine">Solicitar ficha por modelo. En los PAR, verificar emisores R, G, B, ámbar y blanco. PL-01 y LD-01 identifican posiciones del DUC y requieren ficha específica.</p>`),
 header('COTIZACIÓN','Planilla de compra en Bs',`
 <p class="lead">Cantidades para solicitar cotizaciones comparables.</p>
 ${tabla(['Fase base','Cantidad','Bs por unidad','Bs total'],presupuestoBase.map(f=>[...f,'&nbsp;','&nbsp;']))}
 <h2>Ampliación musical opcional</h2>
 ${tabla(['Familia','Cantidad','Montaje','Bs total'],gruposFuturos.map(f=>[f.nombre,f.cantidad,f.lugar,'&nbsp;']))}
 <p>Registrar marca, modelo, garantía, plazo, impuestos y montaje en cada oferta. El costo depende de las fichas de sala, el metrado en sitio y la estructura habilitada.</p>
 <p class="fine">P1–P4, MH4–MH7 y las cuatro barras de piso figuran en el inventario existente. Para P1 y las barras, cotizar conexión DMX y puesta en servicio.</p>`),
 header('SOPORTES','Instalación por fases',`
 <p class="lead">Completar la luz blanca y el control de sala antes de añadir los efectos musicales.</p>
 <h2>Puentes y posicionamiento</h2>
 <p>Validar el puente principal para los ocho PAR adicionales, los dos tramos laterales de 4 m y los dos puentes sobre el altar y detrás. Acabado negro mate. Revisar la capacidad de los anclajes, retención secundaria y espacio para mantenimiento con el responsable de estructura.</p>
 <p>Las alturas de referencia desde el piso son 6,96 m cerca del monitor, 7,60 m al comienzo del altar y 6,95 m en el altar. Las diagonales usan 6,96 m de manera provisional. Confirmar en sitio el eje y la cara inferior de cada estructura.</p>
 ${img('puentes/danza-derecha.svg','Detalle del enfoque de las luminarias de danza derecha')}
 <p class="fine">En cada diagonal, dos Fresnel en extremos cruzados y dos PAR RGBAW interiores. Confirmar el giro, el acceso y el recorte del haz respecto de la pantalla. <a href="${web}#cableado">Cotas y hojas de campo</a>.</p>`)
]);

archivo('planos-iluminacion','Planos de iluminación',[
 ['Combinado','planta-combinada.svg','Contorno para existentes. Relleno para puntos nuevos. Cruza cada código con el inventario.'],
 ['Existentes','planta-existente.svg',notaExistentes],
 ['Nuevos','planta.svg',`${totalNuevos} puntos de la fase base. DI y DD en danza, PR en el principal, AL sobre el altar, PO posterior y S1–S5 por fila de sala.`]
].map(([nombre,archivo,nota])=>header('PLANTA BAJA',nombre,`${img('puentes/'+archivo,'Planta de iluminación con leyenda de '+nombre)}
 <p class="fine">${nota} <a href="${web}recursos/puentes/inventario-iluminacion.csv">Inventario por código</a>.</p>`)),
 `@page{size:A3 landscape}.page{width:420mm;height:296mm;padding:10mm 15mm} h1{margin:4mm 0 3mm} .page img{width:385mm}`);
