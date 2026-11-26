/* Maqueta conceptual. X recorre el ancho, Y la altura y Z avanza hacia las butacas. */
function crearAuditorio(host, onPick, onCameraChange, onFirstFrame) {
  const T = THREE, v = (x,y,z) => new T.Vector3(x,y,z);
  const renderer = new T.WebGLRenderer({antialias:true,alpha:true});
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.16;
  host.appendChild(renderer.domElement);
  const scene=new T.Scene(), perspective=new T.PerspectiveCamera(39,1,.1,150);
  const overhead=new T.OrthographicCamera(-12,12,10,-10,.1,100);
  overhead.up.set(0,0,-1);
  let camera=perspective;
  const fillLight=new T.HemisphereLight(0xf8f8f8,0x747474,.8);scene.add(fillLight);
  const key=new T.DirectionalLight(0xffffff,1.5); key.position.set(-5,13,9); scene.add(key);
  const rim=new T.DirectionalLight(0xe5e5e5,1.1); rim.position.set(8,8,-9); scene.add(rim);
  const stage=new T.Group(), ceiling=new T.Group(); scene.add(stage,ceiling);ceiling.visible=false;
  const rearGallery=new T.Group();scene.add(rearGallery);rearGallery.visible=false;
  const batches=new Map(), geometries={
    box:new T.BoxGeometry(1,1,1),tube:new T.CylinderGeometry(1,1,1,12),
    ball:new T.SphereGeometry(1,14,10),disc:new T.CylinderGeometry(1,1,1,36)
  };
  const mat=(color,shininess=12)=>new T.MeshPhongMaterial({color,shininess});
  const m={edge:mat('#363636'),base:mat('#282828'),floor:mat('#777777'),wall:mat('#646464'),
    fascia:mat('#737373'),pad:mat('#131313',4),padEdge:mat('#242424',5),rib:mat('#565656'),
    bridge:new T.MeshPhongMaterial({name:'Puente · negro mate',color:0x191919,specular:0x151515,shininess:16}),
    metal:mat('#8c8c8c',48),iron:mat('#252525',24),seat:mat('#4b4b4b'),seatBack:mat('#363636'),
    trunk:mat('#333333'),skin:mat('#aaaaaa'),shirt:mat('#989898'),lightShirt:mat('#d6d6d6'),
    silver:mat('#ababab',50),brass:mat('#919191',48),drum:mat('#555555')};
  const unitY=v(0,1,0), identity=new T.Quaternion();
  function piece(geo,material,pos,scale,rotation=identity,root=stage){
    let key=root.uuid+geo.uuid+material.uuid;
    if(!batches.has(key)) batches.set(key,{geo,material,root,matrices:[]});
    batches.get(key).matrices.push(new T.Matrix4().compose(pos,rotation,scale));
  }
  function box(x,y,z,w,h,d,material,yaw=0,root=stage){
    piece(geometries.box,material,v(x,y,z),v(w,h,d),new T.Quaternion().setFromAxisAngle(unitY,yaw),root);
  }
  function rod(a,b,r,material,root=stage,r2=r){
    const delta=b.clone().sub(a);
    piece(geometries.tube,material,a.clone().lerp(b,.5),v(r,delta.length(),r2),new T.Quaternion().setFromUnitVectors(unitY,delta.normalize()),root);
  }
  function ball(x,y,z,rx,ry,rz,material){piece(geometries.ball,material,v(x,y,z),v(rx,ry,rz))}
  function slab(shape,bottom,height,material){
    const geo=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:38});
    geo.rotateX(-Math.PI/2); const mesh=new T.Mesh(geo,material);mesh.position.y=bottom;stage.add(mesh);
  }
  const plan=plantaAuditorio, footprint=plan.contorno;
  const outline=new T.Shape(footprint.map(([x,z])=>new T.Vector2(x,-z)));
  slab(outline,-.4,.38,m.base);slab(outline,-.02,.035,m.floor);
  // Rear wall and shallow side returns form an open architectural cutaway.
  function wall(a,b,h){
    const dx=b[0]-a[0], dz=b[1]-a[1];
    box((a[0]+b[0])/2,h/2,(a[1]+b[1])/2,Math.hypot(dx,dz),h,.13,m.wall,-Math.atan2(dz,dx));
  }
  function walls(points,height){
    for(let i=1;i<points.length;i++)wall(points[i-1],points[i],height);
  }
  wall(footprint[0],footprint[1],7.9);
  wall(footprint[0],plan.izquierda.at(-1),4.45);
  wall(footprint[1],plan.derecha.at(-1),4.45);
  const entrada=plan.ingreso, jambA=entrada.z-entrada.ancho/2, jambB=entrada.z+entrada.ancho/2;
  wall(plan.izquierda.at(-1),footprint.at(-1),.27);
  wall(plan.derecha.at(-1),[entrada.x,jambA],.27);
  wall([entrada.x,jambB],footprint[2],.27);
  const doorGlass=new T.MeshPhongMaterial({color:0xcccccc,transparent:true,opacity:.22,depthWrite:false});
  for(const z of [jambA,entrada.z,jambB])box(entrada.x,1.14,z,.10,2.28,.055,m.metal);
  box(entrada.x,2.27,entrada.z,.1,.08,entrada.ancho,m.metal);
  for(const s of [-1,1])box(entrada.x,1.13,entrada.z+s*entrada.ancho/4,.04,2.18,entrada.ancho/2-.06,doorGlass);
  const bajoEntrepiso=mat('#595c5c');
  box(0,.016,(plan.limiteSala+plan.extremoPB)/2,plan.anchoSala-.06,.014,plan.extremoPB-plan.limiteSala,bajoEntrepiso);
  for(const x of [-12.4,-7.5,-2.6,2.3,7.2,12.1])box(x,1.31,plan.limiteSala+1.05,.16,2.62,.16,m.metal);
  // The rear gallery is schematic and closes the cutaway in the view from the stage.
  box(.025,2.55,plan.extremoPB,33.9,5.10,.14,m.wall,0,rearGallery);
  box(.025,2.73,(plan.limiteSala+plan.extremoPB)/2,33.9,.34,plan.extremoPB-plan.limiteSala,m.edge,0,rearGallery);
  box(.025,3.75,plan.limiteSala,33.9,.05,.06,m.metal,0,rearGallery);
  box(.025,3.32,plan.limiteSala,33.8,.79,.04,doorGlass,0,rearGallery);
  for(let i=0;i<=12;i++){
    const x=-16.8+i*2.80;
    box(x,3.32,plan.limiteSala,.038,.86,.06,m.metal,0,rearGallery);
    if(i%3===0)box(x,1.31,plan.limiteSala+.20,.13,2.62,.13,m.metal,0,rearGallery);
  }

  // The curved partitions face the dancers. Each wing opens directly onto the stage.
  for(const [side,curve] of [[-1,plan.izquierda],[1,plan.derecha]]){
    const x=side*plan.anchoAltar/2;
    const vertices=[...curve,[curve.at(-1)[0],plan.fondo],[x,plan.fondo]];
    slab(new T.Shape(vertices.map(([px,pz])=>new T.Vector2(px,-pz))),.02,.64,m.edge);
    walls(curve,4.18);
    wall([x,plan.fondo],[x,-6.6],4.18);wall([x,-5.46],curve[0],4.18);
    box(x,3.63,-6.13,.13,1.1,1.34,m.wall);
  }
  const deck=new T.Shape(), halfStage=plan.anchoAltar/2;
  deck.moveTo(-halfStage,-plan.fondo);deck.lineTo(halfStage,-plan.fondo);
  deck.lineTo(halfStage,-plan.frenteAltar+.37);
  deck.quadraticCurveTo(0,-plan.frenteAltar-.37,-halfStage,-plan.frenteAltar+.37);
  deck.closePath();slab(deck,.015,.655,m.fascia);
  // World-space tile map is clipped by the same curved footprint as the deck.
  const tileCanvas=document.createElement('canvas');tileCanvas.width=tileCanvas.height=256;
  const tileCtx=tileCanvas.getContext('2d');
  tileCtx.fillStyle='#646464';tileCtx.fillRect(0,0,256,256);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const shade=132+(row*5+col*3)%9,px=col*64,py=row*64;
    tileCtx.fillStyle='rgb('+[shade,shade,shade].join(',')+')';
    tileCtx.fillRect(px+1,py+1,63,63);
    tileCtx.fillStyle='rgba(255,255,255,.10)';tileCtx.fillRect(px+1,py+1,63,1);
  }
  const tiles=new T.CanvasTexture(tileCanvas);tiles.colorSpace=T.SRGBColorSpace;
  tiles.wrapS=tiles.wrapT=T.RepeatWrapping;tiles.repeat.set(1/2.56,1/2.56);
  tiles.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const tileTop=new T.Mesh(new T.ShapeGeometry(deck,38).rotateX(-Math.PI/2),new T.MeshPhongMaterial({map:tiles,shininess:22,specular:0x282828}));
  tileTop.position.y=.671;stage.add(tileTop);
  for(let i=0;i<3;i++)box(0,.1*(i+1),plan.frenteAltar+.64-i*.28,2.7,.2*(i+1),.33,m.edge);
  for(const s of [-1,1]){
    for(let i=0;i<2;i++)box(s*(halfStage+.56-i*.27),.1*(i+1),-3.62,.29,.2*(i+1),1.1,m.fascia);
  }
  const pads=plan.danza.map(({x,z})=>[x,z]);
  for(const {x,z,w,d} of plan.danza){box(x,.16,z,w,.31,d,m.padEdge);box(x,.327,z,w,.035,d,m.pad)}
  function screenTexture(){
    const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
    const grad=ctx.createLinearGradient(0,0,510,250);grad.addColorStop(0,'#bcbcbc');grad.addColorStop(.47,'#909090');grad.addColorStop(1,'#b3b3b3');ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);
    for(let j=0;j<4;j++){ctx.beginPath();ctx.moveTo(0,145+j*16);ctx.bezierCurveTo(135,45+j*17,260,250-j*15,512,105+j*25);ctx.lineTo(512,256);ctx.lineTo(0,256);ctx.fillStyle=['#838383','#767676','#646464','#555555'][j];ctx.fill()}
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
  }
  const displayMaterial=new T.MeshBasicMaterial({map:screenTexture(),toneMapped:false});
  function display(x,y,z,w,h,yaw){
    box(x,y,z,w+.12,h+.12,.12,m.iron,yaw);
    const panel=new T.Mesh(new T.PlaneGeometry(w,h),displayMaterial);panel.rotation.y=yaw;
    panel.position.set(x+.075*Math.sin(yaw),y,z+.075*Math.cos(yaw));stage.add(panel);
  }
  display(0,4.10,-6.06,4.40,2.30,0);
  for(const curve of [plan.izquierda,plan.derecha]){
    const [a,b]=curve, c=[(a[0]+b[0])/2,(a[1]+b[1])/2],yaw=-Math.atan((b[1]-a[1])/(b[0]-a[0]));
    display(c[0]+.14*Math.sin(yaw),2.45,c[1]+.14*Math.cos(yaw),1.58,.89,yaw);
  }
  // Matte faceted scenic banner, below and behind the projection screen.
  const banner=plan.panel, bannerVertices=[], bannerColors=[];
  function facetPoint(col,row){
    const relief=(col%2===row%2?.08:0);
    return [banner.x-banner.w/2+banner.w*col/10,banner.base+banner.h*row/3,banner.z+relief];
  }
  for(let col=0;col<10;col++)for(let row=0;row<3;row++){
    const a=facetPoint(col,row),b=facetPoint(col+1,row),c=facetPoint(col+1,row+1),d=facetPoint(col,row+1);
    for(const [i,tri] of [[a,b,c],[a,c,d]].entries()){
      bannerVertices.push(...tri.flat());
      const shade=.29+.045*((i+col*3+row)%4);
      for(let n=0;n<3;n++)bannerColors.push(shade,shade*1.03,shade*1.045);
    }
  }
  const bannerGeo=new T.BufferGeometry();
  bannerGeo.setAttribute('position',new T.Float32BufferAttribute(bannerVertices,3));
  bannerGeo.setAttribute('color',new T.Float32BufferAttribute(bannerColors,3));bannerGeo.computeVertexNormals();
  stage.add(new T.Mesh(bannerGeo,new T.MeshLambertMaterial({vertexColors:true})));
  rod(v(0,5.01,-2.17),v(0,3.7,-2.17),.035,m.iron);box(0,3.62,-2.17,.56,.21,.37,m.edge);
  // Audience faces the stage, including the two angled side seating blocks.
  for(const [cx,cz,cols,rows,angle] of plan.bloques){
    const cs=Math.cos(angle),sn=Math.sin(angle);
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const xx=(col-(cols-1)/2)*.66, x=cx+xx*cs+row*.85*sn,z=cz-xx*sn+row*.85*cs;
      box(x,.35,z,.51,.13,.43,m.seat,angle);
      box(x+.188*sn,.59,z+.188*cs,.51,.40,.09,m.seatBack,angle);
      box(x,.16,z,.14,.28,.18,m.iron,angle);
    }
  }
  // The lower front chord carries the lamps. The four chords and diagonals
  // distinguish the box trusses from the single pipe carrying the moving heads.
  const supports={};
  for(const key of ['front','moving','left','right','top','back']){
    const group=new T.Group();group.name='Soporte '+key;group.userData.supportGroup=key;stage.add(group);supports[key]=group;
  }
  function truss(x,y,z,span,depth,cells,root){
    const lo=x-span/2,hi=x+span/2,r=depth*.105;
    for(const dz of [-depth/2,depth/2]){
      for(const dy of [0,depth])rod(v(lo,y+dy,z+dz),v(hi,y+dy,z+dz),r,m.bridge,root);
      for(let i=0;i<cells;i++){
        const a=lo+span*i/cells,b=lo+span*(i+1)/cells;
        rod(v(a,y+(i%2)*depth,z+dz),v(b,y+((i+1)%2)*depth,z+dz),r*.60,m.bridge,root);
      }
    }
    for(let i=0;i<=cells;i++){
      const xx=lo+span*i/cells;
      for(const dy of [0,depth])rod(v(xx,y+dy,z-depth/2),v(xx,y+dy,z+depth/2),r*.7,m.bridge,root);
      if(i===0||i===cells)for(const dz of [-depth/2,depth/2])rod(v(xx,y,z+dz),v(xx,y+depth,z+dz),r*.72,m.bridge,root);
    }
  }
  function suspension(x,y,z,root){
    // The upper plate represents a support position to check on site.
    const placa=y+.48;
    box(x,placa,z,.20,.07,.24,m.bridge,0,root);
    rod(v(x,y,z),v(x,placa,z),.022,m.bridge,root);
  }
  const principal=plan.porId.principal, trussZ=principal.a[1], trussY=principal.y, frontDepth=.34;
  const railZ=plan.barraZ,railY=6.96;
  for(const p of plan.puentes){
    const root=p.id==='principal'?supports.front:supports[p.id];
    const [dx,dz]=p.b.map((n,i)=>n-p.a[i]), length=Math.hypot(dx,dz);
    const local=new T.Group();root.add(local);
    const mid=plan.punto(p,.5);
    local.position.set(mid[0],p.y,mid[1]);local.rotation.y=-Math.atan2(dz,dx);
    truss(0,0,-frontDepth/2,length,frontDepth,Math.ceil(length/.68),local);
    for(const t of [.08,.92])suspension((t-.5)*length,frontDepth,-frontDepth/2,local);
  }
  rod(v(-7.8,railY,railZ),v(7.8,railY,railZ),.062,m.bridge,supports.moving);
  for(const x of [-7,7])suspension(x,railY,railZ,supports.moving);
  for(const z of [-.2,2,4.2,6.4,8.6])for(const x of [-13,-9,-4.5,0,4.5,9,13]){
    box(x,7.98,z,2.9,.47,.10,m.rib,0,ceiling);rod(v(x,8.20,z),v(x,8.45,z),.015,m.metal,ceiling);
  }
  // Simple scale figures reveal the effect of the front and overhead light on faces.
  function person(x,y,z,shirt,pose=0){
    const at=(dx,dy,dz=0)=>v(x+dx,y+dy,z+dz);
    ball(x,y+1.47,z,.12,.151,.12,m.skin);ball(x,y+1.08,z,.188,.303,.115,shirt);
    for(const side of [-1,1]){
      rod(at(side*.095,.85),at(side*.115,.46),.073,m.trunk);rod(at(side*.115,.46),at(side*.16,.09),.061,m.trunk);
      const elbow=at(side*(pose?.36:.24),pose?1.33:.96,.02),hand=at(side*(pose?.56:.21),pose?1.51:.78,.04);
      rod(at(side*.15,1.26),elbow,.057,shirt);rod(elbow,hand,.046,m.skin);
    }
  }
  person(.25,.67,-2.76,m.lightShirt);person(-2.45,.67,-3.55,m.shirt);
  for(const [x,z] of pads)person(x,.346,z,m.lightShirt,1);
  const shadeCanvas=document.createElement('canvas');shadeCanvas.width=shadeCanvas.height=64;
  const shadeCtx=shadeCanvas.getContext('2d'),shade=shadeCtx.createRadialGradient(32,32,1,32,32,32);
  shade.addColorStop(0,'rgba(10,16,22,.57)');shade.addColorStop(.47,'rgba(10,16,22,.25)');shade.addColorStop(1,'rgba(10,16,22,0)');
  shadeCtx.fillStyle=shade;shadeCtx.fillRect(0,0,64,64);
  const shadeMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(shadeCanvas),transparent:true,depthWrite:false});
  for(const [x,y,z] of [[.25,.675,-2.76],[-2.45,.675,-3.55],...pads.map(([x,z])=>[x,.349,z])]){
    const patch=new T.Mesh(new T.PlaneGeometry(.98,.67),shadeMat);patch.rotation.x=-Math.PI/2;patch.position.set(x,y,z);stage.add(patch);
  }
  // Drum booth, cymbals, keys and floor monitors.
  const glass=new T.MeshPhongMaterial({color:0xbebebe,transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide});
  box(7.09,1.67,-4.87,1.86,1.98,.035,glass);box(8.01,1.67,-5.48,.035,1.98,1.25,glass);
  for(const x of [6.18,7.10,8.01])box(x,1.66,-7.36,.035,1.98,.035,m.metal);
  box(7.09,2.69,-5.47,1.91,.09,1.38,m.edge);
  rod(v(7.05,1.08,-5.05),v(7.05,1.08,-5.56),.36,m.drum);
  for(const [x,z] of [[6.54,-5.34],[7.62,-5.51]]){rod(v(x,.68,z),v(x,1.7,z),.025,m.silver);piece(geometries.disc,m.brass,v(x,1.7,z),v(.26,.034,.26))}
  box(-7.36,1.52,-5.15,1.58,.12,.48,m.iron);box(-7.36,1.59,-4.98,1.43,.025,.17,m.lightShirt);
  for(const s of [-1,1])rod(v(-7.36+s*.53,.68,-5.12),v(-7.36-s*.46,1.49,-5.12),.03,m.iron);
  for(const x of [-3.85,3.85])box(x,.82,-2.7,.68,.29,.37,m.iron);
  const grid=new T.GridHelper(62,62,0x666666,0x686868);grid.userData.excludeFromExport=true;grid.material.transparent=true;grid.material.opacity=.13;grid.position.y=-.47;scene.add(grid);
  const lights=[],pickables=[];
  const ringCanvas=document.createElement('canvas');ringCanvas.width=ringCanvas.height=64;
  const ringContext=ringCanvas.getContext('2d');ringContext.strokeStyle='#ffffff';ringContext.lineWidth=5;
  ringContext.beginPath();ringContext.arc(32,32,23,0,2*Math.PI);ringContext.stroke();
  const indicatorMat=new T.SpriteMaterial({map:new T.CanvasTexture(ringCanvas),depthTest:false,depthWrite:false,transparent:true,toneMapped:false});
  const coneGeometry=new T.ConeGeometry(1,1,36,1,true);coneGeometry.translate(0,-.5,0);
  const coneVertex='varying float along; varying vec3 n; varying vec3 eye; void main(){along=-position.y; vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);eye=-p.xyz;gl_Position=projectionMatrix*p;}';
  const coneFragment='uniform vec3 tint;uniform float level;varying float along;varying vec3 n;varying vec3 eye;void main(){float edge=abs(dot(normalize(n),normalize(eye)));float a=level*pow(max(0.,1.-along*.90),.65)*smoothstep(0.,.24,edge);gl_FragColor=vec4(tint,a);}';
  const rigAxes=new T.Matrix4();
  function aiming(pivot,dest){
    const direction=dest.clone().sub(pivot).normalize();
    const across=v(-direction.z,0,direction.x);
    if(across.lengthSq()<.0001)across.set(1,0,0);else across.normalize();
    const up=direction.clone().negate(),back=new T.Vector3().crossVectors(across,up);
    return {across,direction,rotation:new T.Quaternion().setFromRotationMatrix(rigAxes.makeBasis(across,up,back))};
  }
  const fixtureIndex=new Map(),serial={};
  const preexistingGroups=new Set(['front','moving','bars','par']);
  const futureGroups=new Set(['ambient','pixels','music']);
  let inventoryMode='all';
  const originOf=l=>futureGroups.has(l.group)?'future':!l.added&&preexistingGroups.has(l.group)?'existing':'proposed';
  function inInventory(l){
    if(!l?.installed)return false;
    const origin=originOf(l);
    return inventoryMode==='future'||(inventoryMode==='all'?origin!=='future':origin===inventoryMode);
  }
  const patch=new Map(plan.ramales.flatMap(r=>r.puntos.map(p=>[p.visor,{...p,ramal:r.id,universo:r.u}])));
  const cables=new T.Group();cables.name='Rutas DMX de referencia';cables.userData.excludeFromExport=true;scene.add(cables);
  const wireMaterials=[0x54f5b1,0xbba2ff,0x57edff,0x89adff].map(color=>new T.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.88}));
  let showCables=false;
  function drawCables(){
    for(const line of [...cables.children]){line.geometry.dispose();cables.remove(line);}
    if(!showCables||inventoryMode==='existing')return;
    for(const [n,r] of plan.ramales.entries()){
      const sala=r.u===2;
      if(sala&&housePoints.length!==45)continue;
      const equipos=r.puntos.map(p=>fixtureIndex.get(p.visor)).filter(inInventory);
      if(!equipos.length)continue;
      const first=equipos[0].source, altura=sala?houseHeight+.38:r.y+.13;
      const tray=v(sala?0:-13.8,1.1,13.75);
      const coords=[tray,v(tray.x,altura,tray.z)];
      if(sala)coords.push(v(first.x,altura,11.1));
      else {const x=-16.65+n*.19;coords.push(v(x,altura,12.9),v(x,altura,first.z+.22*n),v(first.x,altura,first.z+.22*n));}
      coords.push(...equipos.map(l=>v(l.source.x,altura,l.source.z)));
      const line=new T.Line(new T.BufferGeometry().setFromPoints(coords),wireMaterials[sala?n-4:0]);
      line.renderOrder=9;cables.add(line);
    }
  }
  function lamp(group,position,target,color,angle,power,type,railHeight,added=false){
    const pivot=v(...position),dest=v(...target),axis=aiming(pivot,dest);
    const id=group+'-'+(serial[group]=(serial[group]||0)+1);
    const fixtureRoot=new T.Group();fixtureRoot.name=id;fixtureRoot.userData.fixtureId=id;
    fixtureRoot.position.copy(pivot);scene.add(fixtureRoot);
    const holder=new T.Group(),mountYaw=new T.Group();fixtureRoot.add(holder,mountYaw);
    const pieces=new Map();
    function part(root,geo,material,off,scale,rot=identity){
      const key=root.uuid+geo.uuid+material.uuid;
      if(!pieces.has(key))pieces.set(key,{root,geo,material,matrices:[]});
      pieces.get(key).matrices.push(new T.Matrix4().compose(v(...off),rot,v(...scale)));
    }
    const shape=(geo,material,off,scale,tilt=identity)=>part(holder,geo,material,off,scale,tilt);
    const solid=(off,scale,tilt)=>shape(geometries.box,m.iron,off,scale,tilt);
    const collar=(y,r,h,material=m.metal)=>shape(geometries.tube,material,[0,y,0],[r,h,r]);
    const mounted=(root,off,scale,material=m.iron)=>part(root,geometries.box,material,off,scale);
    const shaft=(root,off,r,h,material=m.silver)=>part(root,geometries.tube,material,off,[r,h,r]);
    let bodyGeo=geometries.tube,bodyScale=[.16,.26,.16],bodyY=.015,depth=.145,radius=.137,pan,cable,plate;
    if(type==='profile'){
      bodyGeo=geometries.box;bodyScale=[.25,.26,.23];bodyY=.045;radius=.097;depth=.294;
      collar(-.14,.126,.16,m.iron);collar(-.235,.105,.11,m.iron);
      collar(-.28,.117,.025);collar(-.12,.134,.024);
      for(const sign of [-1,1])solid([sign*.138,-.05,0],[.053,.038,.090]);
      for(const y of [.04,.09,.14])solid([0,y,.123],[.21,.022,.025]);
    }else if(type==='fresnel'){
      depth=.147;radius=.115;bodyScale=[.146,.25,.146];collar(-.13,.153,.024);
      for(const sign of [-1,1]){
        solid([sign*.145,-.18,0],[.014,.108,.235],new T.Quaternion().setFromAxisAngle(v(0,0,1),sign*.32));
        solid([0,-.182,sign*.145],[.232,.096,.014],new T.Quaternion().setFromAxisAngle(v(1,0,0),-sign*.32));
      }
      collar(.11,.14,.022,m.metal);
    }else if(type==='strip'){
      bodyGeo=geometries.box;bodyScale=[1.13,.085,.13];bodyY=0;depth=.052;
      for(const dx of [-.44,.44]){
        mounted(mountYaw,[dx,.695-pivot.y,0],[.10,.046,.16]);
        shaft(mountYaw,[dx,(.70-pivot.y)/2,0],.015,pivot.y-.70);
      }
    }else if(type==='pixel'){
      bodyGeo=geometries.box;bodyScale=[.095,.07,1.26];bodyY=0;depth=.042;
      mounted(fixtureRoot,[0,.72-pivot.y,0],[.30,.045,.25]);
    }else if(type==='moving'){
      bodyGeo=geometries.ball;bodyScale=[.176,.185,.16];bodyY=0;depth=.166;radius=.102;
      const baseY=railHeight-.104;
      mounted(fixtureRoot,[0,railHeight-pivot.y,0],[.13,.16,.15],m.silver);
      mounted(fixtureRoot,[0,baseY-pivot.y,0],[.48,.115,.33]);
      pan=mountYaw;
      for(const dx of [-.198,.198]){
        const arm=new T.Mesh(geometries.box,m.iron);arm.position.set(dx,.105,0);arm.scale.set(.055,.29,.108);pan.add(arm);
      }
      const bridge=new T.Mesh(geometries.box,m.metal);bridge.position.y=.24;bridge.scale.set(.444,.048,.123);pan.add(bridge);
    }else if(type==='pendant'){
      bodyScale=[.154,.36,.154];bodyY=.18;depth=0;radius=.142;
      // The specified elevation is the lens, not the suspension or housing.
      cable=new T.Mesh(geometries.tube,m.silver);
      plate=new T.Mesh(geometries.box,m.metal);plate.scale.set(.14,.045,.14);
      holder.add(cable,plate);
    }else{
      bodyScale=[.167,.175,.167];depth=.108;radius=.142;collar(-.09,.174,.022);
      if(type==='parFloor'){
        mounted(fixtureRoot,[0,.703-pivot.y,0],[.32,.06,.32]);
        for(const sign of [-1,1])shaft(mountYaw,[sign*.155,(.717-pivot.y)/2,0],.018,pivot.y-.717);
      }
    }
    if(railHeight!==undefined&&type!=='moving'){
      const dy=railHeight-pivot.y,spread=type==='profile'?.147:.157;
      mounted(fixtureRoot,[0,dy,0],[.084,.125,.125],m.silver);
      shaft(fixtureRoot,[0,(dy+.19)/2,0],.028,dy-.19,m.iron);
      mounted(mountYaw,[0,.19,0],[2*spread,.041,.045]);
      for(const dx of [-spread,spread])mounted(mountYaw,[dx,.095,0],[.031,.19,.041]);
      mounted(mountYaw,[0,0,0],[2*spread,.041,.041],m.metal);
    }
    for(const {root,geo,material,matrices} of pieces.values()){
      const mesh=new T.InstancedMesh(geo,material,matrices.length);
      matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));root.add(mesh);
    }
    const housing=new T.Mesh(bodyGeo,m.iron);housing.position.y=bodyY;housing.scale.set(...bodyScale);holder.add(housing);
    housing.userData={group,fixtureId:id};pickables.push(housing);
    const lensMat=new T.MeshBasicMaterial({color,toneMapped:false});
    if(type==='pixel'){
      const pixels=new T.InstancedMesh(geometries.box,lensMat,12);
      for(let i=0;i<12;i++){
        pixels.setMatrixAt(i,new T.Matrix4().compose(v(0,-depth,(i-5.5)*.10),identity,v(.064,.015,.086)));
      }
      holder.add(pixels);
    }else{
      const lens=new T.Mesh(type==='strip'?geometries.box:geometries.disc,lensMat);
      lens.scale.copy(type==='strip'?v(1.04,.015,.070):v(radius,.014,radius));
      lens.position.y=-depth;holder.add(lens);lens.userData={group,fixtureId:id};pickables.push(lens);
    }
    const reach=type==='strip'?3.15:group==='par'?3.65:group==='ambient'?4.6:type==='pixel'?2:25;
    const light=new T.SpotLight(color,0,reach,angle,type==='profile'?.10:.46,1.65);
    light.name=group;light.userData.fixtureId=id;light.target.position.copy(dest);scene.add(light,light.target);
    // Architectural wash uses the shared photometric field below. Excluding
    // these emitters from direct shading keeps the GPU program size constant.
    if(type==='pendant')light.layers.set(1);
    const shader=new T.ShaderMaterial({vertexShader:coneVertex,fragmentShader:coneFragment,uniforms:{tint:{value:new T.Color(color)},level:{value:0}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
    const cone=new T.Mesh(coneGeometry,shader);cone.userData.excludeFromExport=true;scene.add(cone);
    const indicator=new T.Sprite(indicatorMat);indicator.userData.excludeFromExport=true;indicator.position.copy(pivot);indicator.scale.setScalar(.57);indicator.renderOrder=10;indicator.visible=false;scene.add(indicator);
    const l={id,group,type,source:pivot,dest,home:pivot.clone(),homeTarget:dest.clone(),manualAim:null,aimLabel:null,reach,
      light,fixtureRoot,holder,mountYaw,lensMat,shader,cone,color,power,angle,indicator,depth,pan,cable,plate,railHeight,added,installed:true};
    lights.push(l);fixtureIndex.set(id,l);point(l,dest);return l;
  }
  function point(l,dest){
    const {across,direction,rotation}=aiming(l.source,dest);
    l.holder.quaternion.copy(rotation);
    l.mountYaw.rotation.y=Math.atan2(-across.z,across.x);
    l.light.position.copy(l.source).addScaledVector(direction,l.depth);
    l.light.target.position.copy(dest);
    l.light.distance=l.manualAim ? Math.max(l.reach,l.light.position.distanceTo(dest)+2) : l.reach;
    l.cone.position.copy(l.light.position);l.cone.quaternion.copy(rotation);
    const length=l.cone.position.distanceTo(dest),radius=Math.tan(l.angle)*length;
    l.cone.scale.set(radius,length,radius);
  }
  // Orden visto desde las butacas. La separación y el enfoque inicial son aproximados.
  const frontProfiles={
    P3:['Chauvet EVE F-50Z','fresnel','#ffe2bb',.33,46,'257–259'],
    P2:['ADJ COB Cannon Wash DW','wash','#fff2d6',.43,46,'235–238'],
    P4:['U’King LED PAR Light 7 4in1','wash','#f3e8da',.32,27,'225–232']
  };
  for(const [x,key] of [[-9.49,'P3'],[-6.94,'P2'],[-4.15,'P4'],[-1.65,'P4'],[1.64,'P4'],[4.18,'P4'],[6.92,'P2'],[9.48,'P3']]){
    const [name,type,color,angle,power,channels]=frontProfiles[key];
    const unit=lamp('front',[x,trussY-.31,trussZ-frontDepth],[x*.72,1.55,-3.62],color,angle,power,type,trussY);
    unit.profile={key,name,channels};
  }
  for(const p of plan.puentes){
    const pad=p.id==='left'?plan.danza[0]:p.id==='right'?plan.danza[1]:null;
    for(const {tipo,numero,pos:[x,z]} of p.equipos){
      const fresnel=tipo==='F', lateral=(numero%2?1:-1)*.41;
      const target=pad?[pad.x+lateral,fresnel?1.6:.50,pad.z]:[x*.89,1.33,p.id==='back'?-3.48:-3.08];
      const color=fresnel?'#ffe2be':pad?'#92baff':p.id==='back'?'#b19aff':'#ffe7cb';
      lamp(p.id,[x,p.y-.32,z],target,color,fresnel?.29:.28,fresnel?100:72,fresnel?'fresnel':'wash',p.y);
    }
  }
  for(const [i,x] of plan.cannonX.entries()){
    const [tx,tz]=pads[x<0?0:1];
    const unit=lamp('moving',[x,railY-.40,railZ],[tx+(i%2?.37:-.37),.44,tz],'#cbb7ff',.135,115,'moving',railY);
    const start=265+i*20;
    unit.profile={key:'MH'+(i+4),name:'Generic Spot Beam ST',channels:start+'–'+(start+17)};
  }
  for(const x of plan.barrasX)lamp('bars',[x,.75,banner.z+.49],[x,2.14,banner.z+.04],'#38dcd8',.55,15,'strip');
  for(const [i,x] of plan.parX.entries()){
    const targetX=Math.sign(x)*(i%2===0?3.07:4.00);
    const unit=lamp('par',[x,.85,banner.z+.78],[targetX,2.41,banner.z+.035],'#558ffb',.34,48,'parFloor');
    unit.profile={key:'P1',name:'Chauvet SlimPAR Q12BT',channels:'010–017'};
  }
  // Future fixtures stay outside the base inventory and the photometric calculation.
  for(const side of [-1,1]){
    const wallX=side<0?plan.ladoIzq:plan.ladoDer;
    lamp('ambient',[side*13.05,.24,-2.33],[side*12.95,2.50,-2.60],'#4da7ff',.45,84,'wash');
    lamp('ambient',[wallX-side*1.35,.24,1.85],[wallX-side*.24,2.78,1.34],'#4da7ff',.48,105,'wash');
    for(const offset of [3.38,4.02]){
      const x=side*offset,y=offset<3.5?1.39:1.58;
      lamp('pixels',[x,y,-6.05],[x,y,-4.90],'#4db8ff',.80,0,'pixel');
    }
    lamp('music',[side*2.47,plan.porId.back.y-.42,plan.porId.back.a[1]],[side*1.48,1.24,-3.05],'#98bbff',.34,82,'moving',plan.porId.back.y);
  }
  const houseLamps=[];
  // Shared intensity field on the reading plane. The samples are candela at
  // 3,200 K from the Elation FUZE Pendant Compact 45° IES, averaged in azimuth
  // and sampled every 5°. The report uses both original photometric planes.
  const candela=[6964,6595,5654,4507,3576,2858,2269,1732,1171,638,278,81,15,6,1,0,0,0,0];
  const falloff=new Float32Array(401);
  for(let i=0;i<falloff.length;i++){
    const slope=i/100,step=Math.atan(slope)*180/(Math.PI*5),a=Math.floor(step);
    const intensity=candela[a]+(candela[a+1]-candela[a])*(step-a);
    falloff[i]=intensity/Math.pow(1+slope*slope,1.5);
  }
  const mapWidth=192,mapDepth=128,field=new Uint8Array(mapWidth*mapDepth*4);
  const houseMap=new T.DataTexture(field,mapWidth,mapDepth,T.RGBAFormat);
  houseMap.minFilter=houseMap.magFilter=T.LinearFilter;
  const houseUniform={map:{value:houseMap},tint:{value:new T.Color()},height:{value:plan.sala.altura}};
  function configureWash(material){
    material.onBeforeCompile=shader=>{
      shader.uniforms.uHouseMap=houseUniform.map;shader.uniforms.uHouseTint=houseUniform.tint;shader.uniforms.uHouseHeight=houseUniform.height;
      shader.vertexShader='varying vec3 vHousePosition;\n'+shader.vertexShader.replace('#include <project_vertex>',`
        #include <project_vertex>
        vec4 housePosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          housePosition = instanceMatrix * housePosition;
        #endif
        vHousePosition = (modelMatrix * housePosition).xyz;`);
      shader.fragmentShader='uniform sampler2D uHouseMap; uniform vec3 uHouseTint; uniform float uHouseHeight; varying vec3 vHousePosition;\n'+shader.fragmentShader.replace('#include <lights_fragment_end>',`
        #include <lights_fragment_end>
        vec2 houseUv=(vHousePosition.xz+vec2(18.0,7.0))/vec2(36.0,24.0);
        float facingUp=max(dot(normal,viewMatrix[1].xyz),0.0);
        float occupiedHeight=1.0-smoothstep(1.65,uHouseHeight,vHousePosition.y);
        float exposure=texture2D(uHouseMap,houseUv).r;
        reflectedLight.indirectDiffuse+=diffuseColor.rgb*uHouseTint*exposure*exposure*(.30+.70*facingUp)*occupiedHeight;`);
    };
  }
  // The world-space distribution changes only when position or height changes.
  // Intensity and colour are uniforms, independent of the number of pendants.
  function rebuildWash(points,height){
    const h=height-plan.sala.planoLectura,coefficient=.80/(h*h);
    const gridScale=100/h;
    let k=0;
    for(let row=0;row<mapDepth;row++)for(let col=0;col<mapWidth;col++){
      const x=(col+.5)*36/mapWidth-18,z=(row+.5)*24/mapDepth-7;
      let lux=0;
      for(const [cx,cz] of points){
        const dx=x-cx,dz=z-cz;
        const i=Math.min(400,Math.round(Math.sqrt(dx*dx+dz*dz)*gridScale));
        lux+=falloff[i]*coefficient;
      }
      field[k]=Math.min(255,Math.round(255*Math.sqrt(lux/1300)));
      field[k+3]=255;k+=4;
    }
    houseUniform.height.value=height;houseMap.needsUpdate=true;
  }
  let housePoints=[],houseHeight=plan.sala.altura;
  function houseLayout(positions,height=plan.sala.altura){
    if(!Array.isArray(positions)||!Number.isFinite(Number(height)))return;
    const points=positions.filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));
    const y=T.MathUtils.clamp(Number(height),3,8);
    if(houseHeight===y&&housePoints.length===points.length&&points.every(([x,z],i)=>x===housePoints[i][0]&&z===housePoints[i][1]))return;
    housePoints=points.map(([x,z])=>[x,z]);houseHeight=y;
    const supportTop=Math.max(6.96,y+.80);
    for(let i=0;i<Math.max(points.length,houseLamps.length);i++){
      let unit=houseLamps[i];
      if(i<points.length){
        const [x,z]=points[i];
        if(!unit){
          unit=lamp('house',[x,y,z],[x,plan.sala.planoLectura,z],'#ffffff',T.MathUtils.degToRad(plan.sala.haz/2),90,'pendant');
          houseLamps.push(unit);
        }
        unit.codigoPlano=points.length===45?plan.filasSala[Math.floor(i/9)].tipo:null;
        unit.source.set(x,y,z);unit.dest.set(x,plan.sala.planoLectura,z);
        unit.fixtureRoot.position.copy(unit.source);unit.indicator.position.copy(unit.source);point(unit,unit.dest);
        const length=supportTop-y-.36;
        unit.cable.position.set(0,.36+length/2,0);unit.cable.scale.set(.013,length,.013);
        unit.plate.position.set(0,supportTop-y,0);
      }
      unit.installed=i<points.length;unit.fixtureRoot.visible=unit.installed;
    }
    ceiling.position.y=inventoryMode==='existing'?0:Math.max(0,y-plan.sala.altura);
    rebuildWash(points,y);drawCables();
    if(layerState)update(layerState);
  }
  for(const {geo,material,root,matrices} of batches.values()){
    const instances=new T.InstancedMesh(geo,material,matrices.length);
    matrices.forEach((matrix,i)=>instances.setMatrixAt(i,matrix));root.add(instances);
  }
  // Soft local spill approximates the colored light returned by the scenic panel.
  const washMaterials=new Set();
  scene.traverse(obj=>{
    if(obj.isMesh&&(obj.material.isMeshPhongMaterial||obj.material.isMeshLambertMaterial))washMaterials.add(obj.material);
  });
  washMaterials.forEach(configureWash);
  const reflected=new T.PointLight(0xffffff,0,4.6,2);
  reflected.position.set(banner.x,1.58,banner.z+.30);scene.add(reflected);
  let layerState,showBeams=true,showLabels=true,neutral=true,marked=null,selectedFixture=null,detailId=null;
  let aimPick=null;
  const aimEnd=new T.Sprite(indicatorMat);aimEnd.scale.setScalar(.50);aimEnd.renderOrder=11;
  const pathGeometry=new T.BufferGeometry().setFromPoints([v(0,0,0),v(0,0,0)]);
  const aimPath=new T.Line(pathGeometry,new T.LineDashedMaterial({color:0xffffff,dashSize:.13,gapSize:.08,depthTest:false,transparent:true,opacity:.8}));
  aimPath.frustumCulled=false;aimPath.renderOrder=10;
  for(const helper of [aimPath,aimEnd]){helper.visible=false;helper.userData.excludeFromExport=true;scene.add(helper);}
  function drawAimGuide(){
    const l=fixtureIndex.get(selectedFixture);
    aimPath.visible=aimEnd.visible=inInventory(l)&&l.group!=='house'&&mode!=='fixture';
    if(!aimPath.visible)return;
    const a=l.light.position,b=l.light.target.position,positions=pathGeometry.attributes.position;
    positions.setXYZ(0,a.x,a.y,a.z);positions.setXYZ(1,b.x,b.y,b.z);positions.needsUpdate=true;
    aimPath.computeLineDistances();aimEnd.position.copy(b);
  }
  let dragId=null,dragHandler=null,dragPointer=null,dragFrame=0,dragPoint=null;
  let dirty=true,frame=0,mode='orbit',yaw=0,pitch=0,zoom=1,quality='high';
  const tags=document.getElementById('anchors');
  const labels=[];
  function tag(name,pos,views,support){
    const el=document.createElement('span');el.className='pin';el.textContent=name;tags.append(el);
    labels.push({el,pos,views,support});
  }
  const general=['orbit','top','seats'],section=['side'];
  tag('Escenario',v(0,.68,-4.2),[...general,'front']);
  tag('Danza izq.',v(pads[0][0],.35,pads[0][1]),general);
  tag('Danza der.',v(pads[1][0],.35,pads[1][1]),general);
  tag('Barra de móviles',v(-.70,railY,railZ),[...general,'side'],'moving');
  tag('Banner',v(-2.02,1.72,banner.z),[...general,'front']);
  tag('Ingreso',v(entrada.x,1.15,entrada.z),general);
  for(const p of plan.puentes){
    const mid=plan.punto(p,.5), lateral=p.id==='left'||p.id==='right';
    tag(lateral?p.nombre+' · 4 m':p.nombre,v(mid[0],p.y+.52,mid[1]),lateral?[p.id,'top']:['front','side','top'],p.id==='principal'?'front':p.id);
  }
  const cameraTarget=v(0,2.6,2.1);
  const bounds=footprint.map(([x,z])=>v(x,-.40,z));
  for(const [x,z] of [footprint[0],footprint[1],plan.izquierda.at(-1),plan.derecha.at(-1)])bounds.push(v(x,8.2,z));
  for(const p of plan.puentes)for(const [x,z] of [p.a,p.b])bounds.push(v(x,p.y+.8,z));
  function ortho(eye,target,halfHeight,aspect,near=.1){
    camera=overhead;
    const half=halfHeight/zoom;
    overhead.left=-half*aspect;overhead.right=half*aspect;overhead.top=half;overhead.bottom=-half;
    overhead.near=near;
    overhead.up.set(0,1,0);
    if(mode==='top'){
      // Keep north up at the starting point and avoid the pole when tilting.
      overhead.position.set(target.x+28*Math.sin(pitch)*Math.sin(yaw),target.y+28*Math.cos(pitch),target.z+28*Math.sin(pitch)*Math.cos(yaw));
      overhead.up.set(-Math.sin(yaw),0,-Math.cos(yaw));
    }else{
      const offset=new T.Spherical().setFromVector3(eye.clone().sub(target));
      offset.theta+=yaw;
      offset.phi=T.MathUtils.clamp(offset.phi+pitch,.12,1.83);
      overhead.position.setFromSpherical(offset).add(target);
    }
    overhead.lookAt(target);
  }
  function fromEye(eye,look,aspect,maxFov){
    const direction=new T.Spherical().setFromVector3(look.sub(eye));
    direction.theta+=yaw;
    direction.phi=T.MathUtils.clamp(direction.phi+pitch,.32,2.86);
    perspective.aspect=aspect;
    perspective.position.copy(eye);
    perspective.lookAt(new T.Vector3().setFromSpherical(direction).add(eye));
    perspective.fov=Math.min(maxFov,Math.max(44,T.MathUtils.radToDeg(2*Math.atan(1.27/aspect))))/zoom;
  }
  function setCamera(){
    const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),aspect=w/h;
    rearGallery.visible=mode==='stage';
    camera=perspective;
    if(mode==='top'){
      ortho(v(.15,28,.2),v(0,0,4.4),Math.max(12.15,18.6/aspect),aspect);
    }else if(mode==='side'){
      // Longitudinal section on the centreline, keeping the centre fixtures in view.
      const middle=Math.max(4.08,(houseHeight+.8)/2);
      ortho(v(23,middle,4.4),v(0,middle,4.4),Math.max(4.65,middle+.55,12.2/aspect),aspect,22.62);
    }else if(mode==='front'){
      ortho(v(0,6.7,19),v(0,3.8,-3.65),Math.max(4.5,15.6/aspect),aspect,15.72);
    }else if(mode==='left'||mode==='right'){
      const i=mode==='left'?0:1,[x,z]=pads[i],sign=i?-1:1;
      ortho(v(x+4.12*sign,3.85,z+5.85),v(x,3.7,z+1.2),Math.max(4.5,3.75/aspect),aspect,2.8);
    }else if(mode==='fixture'&&fixtureIndex.has(detailId)){
      const l=fixtureIndex.get(detailId),p=l.source;
      const direction=l.light.target.position.clone().sub(l.light.position).normalize();
      const across=aiming(p,l.light.target.position).across;
      const target=p.clone();target.y+=l.type==='pendant'?.15:.03;
      const eye=target.clone().addScaledVector(across,1.85).addScaledVector(direction,3.1);
      eye.y+=l.type==='pendant'?1.55:1.02;
      const extent=l.type==='strip'?.84:.72;
      ortho(eye,target,Math.max(extent*.86,extent/aspect),aspect,.15);
    }else if(mode==='seats'){
      fromEye(v(0,1.58,11.85),v(0,2.49,-4.0),aspect,140);
    }else if(mode==='stage'){
      fromEye(v(.15,2.28,-2.44),v(.15,1.47,4.0),aspect,125);
    }else{
      const angle=.29+yaw, elevation=T.MathUtils.clamp(.49-pitch,.09,1.49);
      const outward=v(Math.cos(elevation)*Math.sin(angle),Math.sin(elevation),Math.cos(elevation)*Math.cos(angle));
      const across=v(Math.cos(angle),0,-Math.sin(angle)),up=new T.Vector3().crossVectors(outward,across);
      const tangent=Math.tan(T.MathUtils.degToRad(37/2));
      let fit=1;
      for(const pt of bounds){
        const rel=pt.clone().sub(cameraTarget),proj=Math.max(Math.abs(rel.dot(across))/(tangent*aspect),Math.abs(rel.dot(up))/tangent);
        fit=Math.max(fit,rel.dot(outward)+proj);
      }
      perspective.aspect=aspect;perspective.fov=37;
      perspective.position.copy(cameraTarget).addScaledVector(outward,(fit*1.09)/zoom);perspective.lookAt(cameraTarget);
    }
    camera.updateProjectionMatrix();camera.updateMatrixWorld();
    const placed=[];
    for(const {el,pos,views,support} of labels){
      if(!showLabels||!views.includes(mode)||(support&&!supports[support].visible)){el.hidden=true;continue}
      const s=pos.clone().project(camera),px=(s.x+1)*w/2,py=(1-s.y)*h/2-9;
      const overlap=placed.some(([x,y])=>Math.abs(x-px)<70&&Math.abs(y-py)<22);
      el.hidden=Math.abs(s.x)>.91||Math.abs(s.y)>.87||s.z>1||s.z< -1||overlap;
      if(!el.hidden){el.style.left=px+'px';el.style.top=py+'px';placed.push([px,py])}
    }
  }
  let inView=true,firstFrame=true,motionTimer=0;
  let showMotion=false,motionStart=0;
  let bufferWidth=0,bufferHeight=0,bufferScale=0;
  function render(time){
    frame=0;
    if(!dirty||!inView)return;
    dirty=false;
    const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);
    // Limit the shaded pixels on large or Retina screens, especially while moving.
    const dpr=window.devicePixelRatio||1;
    let scale=Math.min(dpr,1.5);
    if(quality!=='high'){
      const pixelBudget=quality==='low'?300_000:motionTimer||showMotion?460_000:1_200_000;
      scale=Math.min(scale,Math.sqrt(pixelBudget/(width*height)));
    }
    if(width!==bufferWidth||height!==bufferHeight||scale!==bufferScale){
      renderer.setDrawingBufferSize(width,height,scale);
      bufferWidth=width;bufferHeight=height;bufferScale=scale;
    }
    if(showMotion){
      motionStart ||= time;
      const phase=(time-motionStart)/1000;
      for(const l of lights){
        if(l.group!=='music'||!l.light.visible||l.manualAim)continue;
        const side=Math.sign(l.home.x);
        const sweep=Math.sin(phase*(layerState.scene==='mellow'?.50:1.1)+side*.85);
        point(l,v(l.dest.x+1.15*sweep,l.dest.y+.43*Math.cos(phase+side),l.dest.z+.25*sweep));
      }
    }
    setCamera();
    renderer.render(scene,camera);
    if(firstFrame){firstFrame=false;onFirstFrame?.()}
    if(showMotion)refresh();
  }
  function refresh(){
    dirty=true;
    if(inView&&!frame)frame=requestAnimationFrame(render);
  }
  function refreshMotion(){
    if(quality!=='auto'){refresh();return}
    clearTimeout(motionTimer);
    motionTimer=setTimeout(()=>{motionTimer=0;refresh()},160);
    refresh();
  }
  function update(state){
    layerState=state;
    if(typeof state.monochrome==='boolean')neutral=state.monochrome;
    let nBars=0,nPar=0;
    for(const l of lights){
      if(!inInventory(l)||!['bars','par'].includes(l.group))continue;
      const target=l.manualAim||l.dest, dz=target.z-l.source.z;
      if(Math.abs(dz)<.001)continue;
      const t=(banner.z+.04-l.source.z)/dz;
      const x=l.source.x+t*(target.x-l.source.x), y=l.source.y+t*(target.y-l.source.y);
      if(t<=0||Math.abs(x-banner.x)>banner.w/2||y<banner.base||y>banner.base+banner.h)continue;
      if(l.group==='bars')nBars++;else nPar++;
    }
    const bars=state.on.bars?state.level.bars*nBars/(100*plan.barrasX.length):0;
    const pars=state.on.par?state.level.par*nPar/(100*plan.parX.length):0;
    const scenic=state.scenicColors||{};
    const roomColor=state.roomColor||state.color;
    const houseLevel=state.roomOff?0:state.level.house;
    houseUniform.tint.value.set(neutral?'#ffffff':roomColor).multiplyScalar(inventoryMode!=='existing'&&state.on.house?houseLevel*.066:0);
    reflected.intensity=2.2*bars+1.1*pars;
    reflected.color.set(neutral?'#ffffff':scenic.bars||'#38dcd8');
    if(!neutral)reflected.color.lerp(new T.Color(scenic.par||'#558ffb'),pars/(bars+pars||1));
    let active=0;
    for(const l of lights){
      const present=inInventory(l);l.fixtureRoot.visible=present;
      const rearDance=(l.group==='left'||l.group==='right')&&l.type==='wash';
      const roomFixture=l.group==='house'||l.group==='ambient';
      const level=present&&state.on[l.group]&&(!rearDance||state.danceRim!==false)&&!(roomFixture&&state.roomOff)?state.level[l.group]/100:0;
      l.level=level;
      active=Math.max(active,level);
      l.light.visible=level>0&&l.power>0;
      l.indicator.visible=present&&(selectedFixture?l.id===selectedFixture:l.group===marked)&&mode!=='fixture';
      const tint=l.group==='house'?roomColor:l.group==='ambient'?(state.roomColor||scenic.ambient||roomColor):scenic[l.group]||l.color;
      const c=new T.Color(neutral?'#ffffff':tint);
      l.light.color.copy(c);l.light.intensity=level*l.power*(l.group==='top'||l.group==='front'?.61:.85);
      l.lensMat.color.copy(c).multiplyScalar(.06+level*1.45);
      l.shader.uniforms.tint.value.copy(c);l.shader.uniforms.level.value=level*(l.group==='house'?.065:.095);
      l.cone.visible=showBeams&&level>.001&&l.power>0&&(!['left','right'].includes(mode)||l.group===mode||l.id===selectedFixture);
      const dest=l.manualAim||(l.group==='moving'&&state.aim==='walls'
        ? v(Math.sign(l.source.x)*12.12,2.13,(l.source.x<0?plan.izquierda:plan.derecha)[1][1]+.08) : l.dest);
      if(!l.light.target.position.equals(dest))point(l,dest);
    }
    fillLight.intensity=.19+active*.66;key.intensity=.17+active*.94;rim.intensity=.20+active*.64;
    drawAimGuide();refresh();
  }
  function cameraMode(which){
    if(mode!==which)dragFixture(null);
    mode=which;yaw=0;pitch=0;zoom=1;onCameraChange(mode);
    if(layerState)update(layerState);else refresh();
  }
  function zoomBy(step){
    const eyeLevel=mode==='seats'||mode==='stage';
    zoom=T.MathUtils.clamp(zoom*step,eyeLevel?.80:.68,eyeLevel?1.75:2.05);
    refreshMotion();
  }
  function orbit(dx,dy){
    if(dragId&&mode==='top')return;
    yaw-=dx*.007;
    pitch=T.MathUtils.clamp(pitch+dy*.006,-1.12,1.36);
    refreshMotion();
  }
  function setQuality(value){
    if(!['high','auto','low'].includes(value))return;
    quality=value;
    clearTimeout(motionTimer);motionTimer=0;
    refresh();
  }
  function playMotion(value){
    showMotion=value&&inventoryMode==='future';
    motionStart=0;
    if(layerState)update(layerState);
  }
  function fixtureInfo(l){
    const {group,type,source}=l;
    const types={profile:'Perfil LED',fresnel:'Fresnel LED',wash:'PAR LED',parFloor:'PAR LED',moving:'Cabeza móvil',strip:'Barra LED',pixel:'Barra de píxeles',pendant:'Colgante RGBWL'};
    let mount,rangeX,rangeZ=null;
    if(group==='left'||group==='right'){
      const p=plan.porId[group];
      mount='Puente diagonal de 4 m · altura provisional';rangeX=[p.a[0]+.12,p.b[0]-.12];
    }else if(group==='front'||group==='principal'){mount='Puente principal';rangeX=[-9.7,9.7];}
    else if(group==='top'||group==='back'){mount=plan.porId[group].nombre;rangeX=[-8.95,8.95];}
    else if(group==='moving'){mount='Segunda barra';rangeX=[-7.5,7.5];}
    else if(group==='music'){mount='Barra posterior propuesta';rangeX=[-8.95,8.95];}
    else if(group==='ambient'){mount='Soporte lateral a piso';rangeX=source.x<0?[-16,-12]:[12,16];rangeZ=[-2.4,2];}
    else if(group==='pixels'){mount='Base vertical junto al banner';rangeX=source.x<0?[-4.24,-2.9]:[2.9,4.24];rangeZ=[-6.15,-5.8];}
    else if(group==='house'){mount='Techo de sala';rangeX=[plan.ladoIzq+.16,plan.ladoDer-.16];rangeZ=[-.60,plan.limiteSala];}
    else{
      mount='Piso del escenario';rangeX=[-8.7,8.7];
      rangeZ=[-6.15,-3.12];
    }
    const {x,y,z}=l.light.target.position;
    const campo=group==='house'&&!l.codigoPlano?null:patch.get(l.id);
    return {id:l.id,group,profile:l.profile,aimLabel:l.aimLabel,origin:originOf(l),type:plan.porId[group]&&type==='wash'?'PAR LED RGBAW':types[type],x:source.x,y:source.y,z:source.z,mount,rangeX,rangeZ,added:l.added,
      codigoPlano:l.codigoPlano||null,
      patch:campo?{id:campo.codigo,ramal:campo.ramal,universo:campo.universo,inicio:campo.canal}:null,
      emitter:{x:l.light.position.x,y:l.light.position.y,z:l.light.position.z},aim:{x,y,z},
      enabled:l.level>0,color:'#'+l.light.color.getHexString(),intensity:l.light.intensity,angle:l.type==='pixel'?null:l.angle,
      beamAngle:l.type==='pixel'?null:T.MathUtils.radToDeg(2*l.angle),rotation:l.fixtureRoot.rotation.toArray().slice(0,3)};
  }
  function fixtures(){return lights.filter(inInventory).map(fixtureInfo)}
  function setAim(id,target,label){
    const l=fixtureIndex.get(id);
    if(!inInventory(l)||l.group==='house'||l.type==='pixel')return false;
    if(target){
      if(![target.x,target.y,target.z].every(Number.isFinite))return false;
      const dest=v(target.x,target.y,target.z);
      if(l.source.distanceTo(dest)<=l.depth+.06)return false;
      l.manualAim=dest;l.aimLabel=label;
    }else{l.manualAim=null;l.aimLabel=null;}
    update(layerState);return true;
  }
  function selectFixture(id){
    const l=fixtureIndex.get(id);selectedFixture=l&&inInventory(l)?id:null;marked=null;
    if(layerState)update(layerState);else refresh();
  }
  function focusFixture(id){
    const l=fixtureIndex.get(id);if(!l||!inInventory(l))return false;
    detailId=id;selectedFixture=id;marked=null;cameraMode('fixture');return true;
  }
  function railZAt(group,x,z){
    if(group!=='left'&&group!=='right')return z;
    const p=plan.porId[group];
    return plan.punto(p,(x-p.a[0])/(p.b[0]-p.a[0]))[1];
  }
  function moveFixture(id,x,z){
    const l=fixtureIndex.get(id);
    if(!l?.installed||l.group==='house'||!Number.isFinite(x))return null;
    const {rangeX,rangeZ}=fixtureInfo(l);
    x=T.MathUtils.clamp(x,...rangeX);
    z=rangeZ&&Number.isFinite(z)?T.MathUtils.clamp(z,...rangeZ):l.source.z;
    z=railZAt(l.group,x,z);
    l.source.set(x,l.home.y,z);l.fixtureRoot.position.copy(l.source);l.indicator.position.copy(l.source);
    l.dest.copy(l.homeTarget);
    if(l.type==='strip'||l.type==='pixel'){l.dest.x+=x-l.home.x;l.dest.z+=z-l.home.z}
    point(l,l.manualAim||l.dest);drawCables();
    if(layerState)update(layerState);else refresh();
    return fixtureInfo(l);
  }
  function addFixture(id){
    const original=fixtureIndex.get(id);
    if(!original?.installed||original.group==='house')return null;
    const {rangeX,rangeZ}=fixtureInfo(original);
    const width=original.type==='strip'?1.2:original.type==='moving'?.54:.38;
    const neighbors=lights.filter(l=>l.installed&&l.group===original.group);
    // Choose a clear location on the same support before trying a second floor row.
    let best=null;
    for(let dz=0;dz<=(rangeZ?3:0)&&!best;dz++){
      const z=rangeZ?T.MathUtils.clamp(original.source.z+dz*.43,...rangeZ):original.source.z;
      const candidates=[];
      for(let x=rangeX[0];x<=rangeX[1]+.001;x+=.04){
        if(neighbors.every(l=>Math.abs(l.source.x-x)>=width||Math.abs(l.source.z-z)>=.39))candidates.push(x);
      }
      candidates.sort((a,b)=>Math.abs(a-original.source.x)-Math.abs(b-original.source.x));
      if(candidates.length)best=[candidates[0],z];
    }
    if(!best)return null;
    const [x,baseZ]=best,z=railZAt(original.group,x,baseZ),p=original.source.clone().setX(x).setZ(z),target=original.dest.clone();
    if(original.type==='strip'||original.type==='pixel'){target.x+=x-original.source.x;target.z+=z-original.source.z}
    const l=lamp(original.group,p.toArray(),target.toArray(),original.color,original.angle,original.power,original.type,original.railHeight,true);
    l.profile=original.profile;
    if(original.manualAim){l.manualAim=original.manualAim.clone();l.aimLabel=original.aimLabel;}
    inventory(inventoryMode);return l.id;
  }
  function removeFixture(id){
    const l=fixtureIndex.get(id);
    if(!l?.added||l.group==='house')return false;
    for(const obj of [l.fixtureRoot,l.light,l.light.target,l.indicator,l.cone])scene.remove(obj);
    for(let i=pickables.length-1;i>=0;i--)if(pickables[i].userData.fixtureId===id)pickables.splice(i,1);
    l.fixtureRoot.traverse(obj=>{if(obj.isInstancedMesh)obj.dispose()});l.shader.dispose();l.lensMat.dispose();l.light.dispose();
    lights.splice(lights.indexOf(l),1);fixtureIndex.delete(id);
    if(dragId===id)dragFixture(null);if(selectedFixture===id)selectedFixture=null;
    if(detailId===id&&mode==='fixture'){detailId=null;cameraMode('orbit')}
    inventory(inventoryMode);return true;
  }
  function resetFixture(id){
    const l=fixtureIndex.get(id);return l?moveFixture(id,l.home.x,l.home.z):null;
  }
  function dragFixture(id,handler){
    if(dragFrame)cancelAnimationFrame(dragFrame);dragFrame=0;dragPoint=null;dragPointer=null;
    dragId=fixtureIndex.get(id)?.installed&&typeof handler==='function'?id:null;dragHandler=dragId?handler:null;
  }
  function deliverDrag(){
    dragFrame=0;
    if(dragId&&dragHandler&&dragPoint){
      const [x,z]=dragPoint;dragPoint=null;dragHandler(dragId,x,z);refreshMotion();
    }
  }
  function inventory(which){
    if(!['all','existing','proposed','future'].includes(which))return;
    inventoryMode=which;drawCables();
    if(which!=='future')showMotion=false;
    for(const [key,group] of Object.entries(supports)){
      group.visible=lights.some(l=>(l.group===key||(key==='front'&&l.group==='principal'))&&inInventory(l));
    }
    ceiling.position.y=which==='existing'?0:Math.max(0,houseHeight-plan.sala.altura);
    if(selectedFixture&&!inInventory(fixtureIndex.get(selectedFixture)))selectedFixture=null;
    if(dragId&&!inInventory(fixtureIndex.get(dragId)))dragFixture(null);
    if(detailId&&mode==='fixture'&&!inInventory(fixtureIndex.get(detailId))){detailId=null;cameraMode('orbit')}
    if(layerState)update(layerState);else refresh();
  }
  function exportScene(){
    scene.updateMatrixWorld(true);setCamera();
    return {scene,camera,renderer,lights:lights.filter(inInventory).map(l=>l.light),fixtures:fixtures()};
  }
  let start,previous,moved=false,pinchDistance=0;const pointers=new Map();
  const pickRay=new T.Raycaster(),cursor=new T.Vector2(),dragPlane=new T.Plane(v(0,1,0),0),at=v(0,0,0);
  const setCursor=e=>{const r=host.getBoundingClientRect();cursor.set(2*(e.clientX-r.left)/r.width-1,1-2*(e.clientY-r.top)/r.height);pickRay.setFromCamera(cursor,camera);return r};
  host.addEventListener('pointerdown',e=>{
    if(dragId&&mode==='top'){
      const l=fixtureIndex.get(dragId),r=setCursor(e),s=l.source.clone().project(camera);
      if(dragPointer!==null||Math.hypot((s.x-cursor.x)*r.width/2,(s.y-cursor.y)*r.height/2)>32)return;
      dragPointer=e.pointerId;dragPlane.constant=-l.source.y;host.setPointerCapture(e.pointerId);return;
    }
    host.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);previous=[e.clientX,e.clientY];start=previous;moved=pointers.size>1;pinchDistance=0;
  });
  host.addEventListener('pointermove',e=>{
    if(e.pointerId===dragPointer){
      setCursor(e);
      if(pickRay.ray.intersectPlane(dragPlane,at)){dragPoint=[at.x,at.z];if(!dragFrame)dragFrame=requestAnimationFrame(deliverDrag)}
      return;
    }
    if(!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,[e.clientX,e.clientY]);
    if(pointers.size===2){const [a,b]=pointers.values(),d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinchDistance>0)zoomBy(d/pinchDistance);pinchDistance=d;moved=true;return}
    const dx=e.clientX-previous[0],dy=e.clientY-previous[1];
    if(Math.hypot(e.clientX-start[0],e.clientY-start[1])>3)moved=true;
    if(moved)orbit(dx,dy);previous=[e.clientX,e.clientY];
  });
  function release(e){
    if(e.pointerId===dragPointer){
      if(dragFrame){cancelAnimationFrame(dragFrame);deliverDrag()}
      dragPointer=null;return;
    }
    if(!pointers.has(e.pointerId))return;
    if(!moved&&e.type==='pointerup'){
      setCursor(e);
      if(aimPick){
        const targets=stage.children.filter(obj=>obj.isMesh&&obj.visible);
        const hit=pickRay.intersectObjects(targets,false).find(hit=>{
          const depth=-hit.point.clone().applyMatrix4(camera.matrixWorldInverse).z;
          return depth>=camera.near && depth<=camera.far;
        });
        aimPick(hit?.point);
      }else{
        const hit=pickRay.intersectObjects(pickables).find(({object})=>inInventory(fixtureIndex.get(object.userData.fixtureId)));
        if(hit)onPick(hit.object.userData.group,hit.object.userData.fixtureId);
      }
    }
    pointers.delete(e.pointerId);if(pointers.size){previous=[...pointers.values()][0];start=previous;moved=true}pinchDistance=0;
  }
  host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);
  host.addEventListener('wheel',e=>{e.preventDefault();zoomBy(Math.exp(-Math.sign(e.deltaY)*.07))},{passive:false});
  host.addEventListener('keydown',e=>{const moves={ArrowLeft:[18,0],ArrowRight:[-18,0],ArrowUp:[0,14],ArrowDown:[0,-14]};
    if(moves[e.key]){e.preventDefault();orbit(...moves[e.key])}else if(['+','=','-'].includes(e.key)){e.preventDefault();zoomBy(e.key==='-'?.9:1.1)}});
  new ResizeObserver(refresh).observe(host);
  window.addEventListener('resize',refresh);
  if('IntersectionObserver' in window){
    new IntersectionObserver(([entry])=>{
      inView=entry.isIntersecting;
      if(inView&&dirty)refresh();
    }).observe(host);
  }
  houseLayout(plan.filasSala.flatMap(f=>f.puntos),plan.sala.altura);
  return {
    setAim,pickAim(handler){aimPick=handler;},update,cameraMode,zoomBy,setQuality,playMotion,houseLayout,inventory,fixtures,focusFixture,selectFixture,moveFixture,resetFixture,addFixture,removeFixture,dragFixture,exportScene,
    locate(group){selectedFixture=null;marked=group;for(const l of lights)l.indicator.visible=inInventory(l)&&l.group===group;drawAimGuide();refresh()},
    wiring(value){showCables=!!value;drawCables();refresh()},
    beams(value){showBeams=value;if(layerState)update(layerState)},
    labels(value){showLabels=value;refresh()},
    roof(value){ceiling.visible=value;refresh()},
    monochrome(value){neutral=!!value;if(layerState){layerState.monochrome=neutral;update(layerState)}},
    houseCount(count){houseLayout(Number(count)===8?plan.sala.posiciones.concat(plan.sala.ampliacion):plan.sala.posiciones,houseHeight)}
  };
}
