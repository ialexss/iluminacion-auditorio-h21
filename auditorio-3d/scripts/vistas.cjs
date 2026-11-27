/* Regenera las vistas fijas desde el visor. Requiere Playwright y un servidor local. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.H21_PLAYWRIGHT || 'playwright');

const root = path.resolve(__dirname, '../dist/recursos');
const base = process.argv[2] || 'http://127.0.0.1:8747/';
const montajes = process.argv.slice(3);
const modos = ['all', 'existing', 'proposed', 'future'];
const escenas = ['dance', 'sermon', 'event', 'hall', 'music', 'mellow'];
const angulos = ['top', 'front', 'left', 'right', 'side', 'seats', 'orbit', 'stage'];

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.H21_CHROME,
    args: process.env.H21_ANGLE === 'metal'
      ? ['--use-gl=angle', '--use-angle=metal']
      : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const capturas = new Map();
  try {
    const page = await browser.newPage({ viewport: { width: 1320, height: 850 } });
    const errores = [];
    page.on('pageerror', err => errores.push(err.message));
    await page.goto(base);
    await page.locator('#viewer').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => typeof model !== 'undefined' && model && document.querySelector('#poster').hidden,
      null, { timeout: 35000 });
    await page.evaluate(() => {
      const viewer = document.querySelector('#viewer');
      viewer.style.width = '1100px';
      viewer.style.height = '500px';
      model.setQuality('high');
      model.labels(false);
    });

    for (const montaje of montajes.length ? montajes : modos) {
      assert.ok(modos.includes(montaje), 'Montaje desconocido: ' + montaje);
      await page.evaluate(modo => changeInventory(modo), montaje);
      for (const escena of escenas) {
        await page.evaluate(cue => applyPreset(cue), escena);
        for (const angulo of angulos) {
          const { imagenes, pixeles } = await page.evaluate(async cameraName => {
            setCamera(cameraName);
            const { camera, scene, renderer } = model.exportScene();
            renderer.render(scene, camera);

            // Leer el framebuffer antes de que el compositor libere el dibujo de WebGL.
            const gl = renderer.getContext();
            const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
            const frame = new Uint8Array(width * height * 4);
            gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, frame);
            let pixeles = 0;
            for (let offset = 3; offset < frame.length; offset += 4) {
              if (frame[offset] > 32) pixeles++;
            }
            const snapshot = renderer.domElement.toDataURL('image/png');
            const modelImage = new Image();
            modelImage.src = snapshot;
            await modelImage.decode();

            const full = document.createElement('canvas');
            full.width = 1100;
            full.height = 500;
            const ctx = full.getContext('2d');
            const fondo = ctx.createRadialGradient(550, 200, 30, 550, 200, 650);
            fondo.addColorStop(0, '#353535');
            fondo.addColorStop(1, '#181818');
            ctx.fillStyle = fondo;
            ctx.fillRect(0, 0, 1100, 500);
            ctx.drawImage(modelImage, 0, 0, full.width, full.height);

            const thumb = document.createElement('canvas');
            thumb.width = 192;
            thumb.height = 87;
            thumb.getContext('2d').drawImage(full, 0, 0, thumb.width, thumb.height);
            return {
              pixeles: pixeles / (width * height),
              imagenes: [full, thumb].map(canvas => canvas.toDataURL('image/webp', .84).split(',')[1])
            };
          }, angulo);

          const ruta = path.join(montaje === 'all' ? '' : montaje, escena === 'dance' ? '' : escena, angulo + '.webp');
          const [vista, miniatura] = imagenes.map(data => Buffer.from(data, 'base64'));
          assert.ok(pixeles >= .04 && vista.length > 2400 && miniatura.length > 780, 'Captura vacía: ' + ruta + ' (' + pixeles.toFixed(3) + ', ' + vista.length + ' B, ' + miniatura.length + ' B)');
          capturas.set(path.join('vistas', ruta), vista);
          capturas.set(path.join('miniaturas', ruta), miniatura);
          if (montaje === 'future' && escena === 'music' && angulo === 'seats') capturas.set('ampliacion/alabanza.webp', vista);
          if (montaje === 'all' && escena === 'dance' && angulo === 'stage') capturas.set('ampliacion/desde-escenario.webp', vista);
        }
      }
      console.log('Verificado:', montaje);
    }
    const baseMusic = capturas.get('vistas/music/seats.webp');
    const futureMusic = capturas.get('vistas/future/music/seats.webp');
    if (baseMusic && futureMusic) assert.ok(!baseMusic.equals(futureMusic), 'Las dos escenas de Alabanza son idénticas');
    assert.deepEqual(errores, []);
    for (const [archivo, buffer] of capturas) fs.writeFileSync(path.join(root, archivo), buffer);
    console.log(capturas.size, 'archivos con escena visible.');
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error(err); process.exitCode = 1; });
