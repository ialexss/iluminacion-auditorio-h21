const test = require('node:test');
const assert = require('node:assert/strict');
const plan = require('../dist/planta.js');

test('ancho de sala y altar en metros, con curvas independientes', () => {
  assert.equal(plan.ladoDer - plan.ladoIzq, 34.34);
  assert.equal(plan.anchoAltar, 19.42);
  assert.equal(plan.fondoAltar, 5.78);
  assert.notEqual(-plan.izquierda[1][0], plan.derecha[1][0]);
});

function local(pad, x, z) {
  const dx = x - pad.x, dz = z - pad.z;
  return [dx * Math.cos(pad.giro) - dz * Math.sin(pad.giro),
    dx * Math.sin(pad.giro) + dz * Math.cos(pad.giro)];
}
for (const [i, pad] of plan.danza.entries()) {
  const side = i ? 'right' : 'left', sign = Math.sign(pad.x);
  test(side + ' · pantalla libre, tarima delante de la pared y enfoque en la tarima', () => {
    const tv = plan.pantallas[i], p = plan.porId[side];
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      const [x, z] = plan.enTarima(pad, a * pad.w / 2, b * pad.d / 2);
      assert.ok(x * sign > tv.x * sign + tv.w / 2 + .06);
      assert.ok(z > plan.paredEn(x) + .065);
    }
    assert.ok(Math.abs(Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]) - 4) < 1e-9);
    assert.deepEqual(p.equipos.map(f => f.tipo), ['F', 'P', 'P', 'F']);
    for (const {pos, objetivo: [x, y, z], tipo} of p.equipos) {
      const [vx, vz] = local(pad, x, z);
      assert.ok(Math.abs(vx) < pad.w / 2 && Math.abs(vz) < pad.d / 2);
      assert.ok(pos[1] > z && y > .345 && y < p.y);
      if (tipo === 'F') assert.ok(y > 1.5);
    }
    const [primero,,, ultimo] = p.equipos;
    assert.ok(primero.pos[0] < ultimo.pos[0] && primero.objetivo[0] > ultimo.objetivo[0]);
  });
}

test('primera fila central frente a la escalera, con sillas dentro de sala y fuera de las tarimas', () => {
  assert.ok(plan.asientos.some(s => Math.abs(s.x) < .1 && s.z < 1));
  for (const s of plan.asientos) {
    assert.ok(Math.abs(s.x) + .3 < plan.ladoDer && s.z < plan.limiteSala);
    for (const pad of plan.danza) {
      const [x, z] = local(pad, s.x, s.z);
      assert.ok(Math.abs(x) > pad.w / 2 + .30 || Math.abs(z) > pad.d / 2 + .30);
    }
  }
});
