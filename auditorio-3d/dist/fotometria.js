/* Luz directa horizontal. Elation FUZE Pendant Compact, lente 45°, blanco a 3.200 K.
 * Datos absolutos en candelas cada grado (C0 y C180) del ensayo VFR-220815-8683-MS.
 * https://assets.centryngroup.com/dl/files/FUZ292__DL__006.zip
 * El plano del recinto es una hipótesis dimensional. E = 0,80 × Σ I(γ,C) cos(γ)/d².
 */
window.Fotometria = (() => {
  'use strict';
  const plan = plantaAuditorio;
  const c0 = [
    6964.138, 6923.211, 6872.993, 6772.646, 6672.301, 6538.356, 6386.618, 6227.93, 6031.621, 5835.312,
    5618.051, 5389.904, 5161.908, 4934.7, 4707.492, 4501.166, 4305.711, 4111.753, 3925.664, 3739.575,
    3573.886, 3418.616, 3265.523, 3123.525, 2981.527, 2848.585, 2720.28, 2594.357, 2480.615, 2366.873,
    2259.124, 2154.383, 2048.606, 1937.702, 1826.797, 1716.144, 1605.614, 1494.764, 1382.322, 1269.88,
    1157.551, 1045.277, 934.131, 828.422, 722.713, 634.786, 555.649, 478.508, 411.014, 343.52,
    287.971, 238.211, 190.529, 152.597, 114.665, 86.121, 62.039, 40.202, 28.933, 17.665,
    12.98, 11.022, 9.13, 7.319, 6.175, 5.236, 3.317, 2.932, 2.26, 1.588,
    0.926, 0.749, 0.572, 0.395, 0.218, 0.045, 0.036, 0.027, 0.018, 0.009,
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.0
  ];
  const c180 = [
    6964.138, 6976.087, 6933.21, 6890.334, 6777.555, 6652.24, 6505.51, 6319.025, 6132.54, 5914.007,
    5689.918, 5458.33, 5212.789, 4967.249, 4738.28, 4512.194, 4297.828, 4104.851, 3911.874, 3743.107,
    3578.568, 3421.724, 3278.954, 3136.184, 3001.464, 2868.102, 2740.432, 2622.978, 2505.523, 2391.752,
    2278.58, 2170.051, 2069.873, 1969.694, 1859.886, 1748.505, 1636.785, 1524.47, 1412.154, 1298.101,
    1183.774, 1068.937, 953.197, 837.457, 738.468, 642.13, 552.95, 476.196, 399.443, 333.091,
    268.326, 211.955, 170.183, 128.412, 100.696, 75.133, 53.886, 40.008, 26.131, 20.836,
    16.804, 13.513, 11.009, 8.966, 7.566, 5.826, 4.564, 4.006, 3.012, 2.018,
    1.024, 0.836, 0.656, 0.477, 0.297, 0.118, 0.093, 0.07, 0.047, 0.023,
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.0
  ];
  const recommended = 17;
  const layouts = {
    6: plan.sala.posiciones,
    8: [...plan.sala.posiciones, ...plan.sala.ampliacion],
    17: [
      [-10.3, .1], [-6.05, .13], [-1.8, .25], [2.2, .25], [6.2, .25], [10.42, -.22],
      [-9.66, 3.65], [-4.8, 3.55], [.1, 3.55], [5.1, 3.55], [10.32, 3.65],
      [-9.46, 6.55], [-5.8, 6.95], [-1.8, 6.95], [2.2, 6.95], [6.2, 6.95], [9.9, 6.6]
    ]
  };
  const seats = [];
  const seatBlocks = [
    [-6.76, .38, 4, 6, -.42], [-2.95, .13, 6, 7, -.12],
    [2.95, .13, 6, 7, .12], [6.72, .06, 4, 6, .43]
  ];
  for (const [x, z, columns, rows, rotation] of seatBlocks) {
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const side = (col - (columns - 1) / 2) * .66;
        seats.push([x + side * cos + row * .85 * sin, z - side * sin + row * .85 * cos]);
      }
    }
  }

  // Centros de celdas de 5 cm. La región incluye butacas y pasillos desde z = -0,60.
  const step = .05, height = 166, z0 = -.575;
  const x0 = (Math.floor(plan.ladoIzq / step) + .5) * step;
  const width = Math.ceil((plan.ladoDer - x0) / step);
  function publicFloor(x, z) {
    let inside = false;
    const vertices = plan.contorno;
    for (let i = 0, prev = vertices.length - 1; i < vertices.length; prev = i++) {
      const [ax, az] = vertices[i], [bx, bz] = vertices[prev];
      if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) inside = !inside;
    }
    if (!inside) return false;
    for (const pad of plan.danza) {
      if (Math.abs(x - pad.x) <= pad.w / 2 && Math.abs(z - pad.z) <= pad.d / 2) return false;
    }
    if (Math.abs(x) <= 1.35) {
      for (let stair = 0; stair < 3; stair++) {
        if (Math.abs(z - (-.48 - stair * .28)) <= .165) return false;
      }
    }
    return true;
  }
  let domain;
  function getDomain() {
    if (domain) return domain;
    const rows = new Int32Array(height * 2);
    rows.fill(-1);
    const mask = new Uint8Array(width * height);
    let size = 0;
    for (let iz = 0; iz < height; iz++) {
      for (let ix = 0; ix < width; ix++) {
        if (!publicFloor(x0 + step * ix, z0 + step * iz)) continue;
        mask[iz * width + ix] = 1;
        if (rows[2 * iz] < 0) rows[2 * iz] = ix;
        rows[2 * iz + 1] = ix;
        size++;
      }
    }
    domain = {mask, rows, size};
    return domain;
  }

  // Cache geometry per mounting point. Different heights reuse azimuth and distance
  // to every pixel; only the lamp's radial lux profile changes with height.
  const radialStep = .01;
  const geometryCache = new Map();
  function geometry(x, z) {
    const key = [x, z].join(',');
    if (geometryCache.has(key)) return geometryCache.get(key);
    const n = width * height;
    const radial = new Float32Array(n), azimuth = new Float32Array(n);
    for (let iz = 0; iz < height; iz++) {
      const dz = Math.abs(z0 + iz * step - z);
      for (let ix = 0; ix < width; ix++) {
        const dx = x0 + ix * step - x, index = iz * width + ix;
        radial[index] = Math.sqrt(dx * dx + dz * dz) / radialStep;
        azimuth[index] = Math.atan2(dz, dx) / Math.PI;
      }
    }
    const value = {radial, azimuth};
    if (geometryCache.size >= 48) geometryCache.delete(geometryCache.keys().next().value);
    geometryCache.set(key, value);
    return value;
  }
  function candela(table, degrees) {
    const degree = Math.floor(degrees);
    return table[degree] + (table[degree + 1] - table[degree]) * (degrees - degree);
  }
  function radialProfile(h) {
    // 26 m exceeds the diagonal of this public-floor grid for every supported mounting point.
    const samples = 2601;
    const first = new Float64Array(samples), delta = new Float64Array(samples);
    for (let i = 0; i < samples; i++) {
      const r = i * radialStep, d2 = r * r + h * h;
      const angle = Math.atan2(r, h) * 180 / Math.PI;
      const projection = .8 * h / (d2 * Math.sqrt(d2));
      first[i] = projection * candela(c0, angle);
      delta[i] = projection * candela(c180, angle) - first[i];
    }
    return {first, delta};
  }
  function directAtSeat(x, z, positions, h) {
    let value = 0;
    for (const [ox, oz] of positions) {
      const dx = x - ox, dz = z - oz, r2 = dx * dx + dz * dz, d2 = r2 + h * h;
      const angle = Math.atan2(Math.sqrt(r2), h) * 180 / Math.PI;
      const az = Math.atan2(Math.abs(dz), dx) / Math.PI;
      const first = candela(c0, angle);
      const luminousIntensity = first + az * (candela(c180, angle) - first);
      value += .8 * luminousIntensity * h / (d2 * Math.sqrt(d2));
    }
    return value;
  }

  const resultCache = new Map();
  function calculate(count, mountingHeight, plane, positions = layouts[count]) {
    count = Number(count);
    mountingHeight = Number(mountingHeight);
    plane = Number(plane);
    if (!Object.hasOwn(layouts, count) || !Number.isFinite(mountingHeight) ||
        mountingHeight < 3 || mountingHeight > 8 || ![0, .75].includes(plane)) {
      throw new RangeError('Elige una distribución disponible, una altura de 3 a 8 m y un plano de 0 o 0,75 m.');
    }
    const key = JSON.stringify([positions, mountingHeight, plane]);
    if (resultCache.has(key)) return resultCache.get(key);
    const h = mountingHeight - plane;
    const {first, delta} = radialProfile(h);
    const {mask, rows, size} = getDomain();
    const values = new Float32Array(width * height);
    for (const [x, z] of positions) {
      const {radial, azimuth} = geometry(x, z);
      for (let iz = 0; iz < height; iz++) {
        const start = rows[2 * iz], end = rows[2 * iz + 1];
        if (start < 0) continue;
        for (let idx = iz * width + start, last = iz * width + end; idx <= last; idx++) {
          const r = radial[idx], i = Math.floor(r), fraction = r - i;
          const a = first[i] + fraction * (first[i + 1] - first[i]);
          const b = delta[i] + fraction * (delta[i + 1] - delta[i]);
          values[idx] += a + azimuth[idx] * b;
        }
      }
    }
    let sum = 0, gridMin = Infinity, gridMax = 0, samples150 = 0, samples200 = 0;
    for (let idx = 0; idx < values.length; idx++) {
      if (!mask[idx]) { values[idx] = -1; continue; }
      const value = values[idx];
      sum += value;
      gridMin = Math.min(gridMin, value);
      gridMax = Math.max(gridMax, value);
      if (value >= 150) samples150++;
      if (value >= 200) samples200++;
    }
    const seatValues = seats.map(([x, z]) => directAtSeat(x, z, positions, h));
    const seatMean = seatValues.reduce((previous, value) => previous + value, 0) / seats.length;
    const seatMin = Math.min(...seatValues), gridMean = sum / size;
    const result = {
      count: positions.length, height: mountingHeight, plane, seatValues, seatMin, seatMean, seatMax: Math.max(...seatValues),
      seatUniformity: seatMin / seatMean, seats150: seatValues.filter(value => value >= 150).length,
      totalSeats: seats.length, gridMin, gridMean, gridMax, gridUniformity: gridMin / gridMean,
      totalArea: size * step * step, area150: samples150 * step * step, area200: samples200 * step * step,
      samples150, totalSamples: size, allSamples: samples150 === size,
      raster: {width, height, step, x0, z0, values}
    };
    if (resultCache.size === 6) resultCache.delete(resultCache.keys().next().value);
    resultCache.set(key, result);
    return result;
  }
  return {layouts, seats, recommended, calculate,
    withinHall: (x,z) => Number.isFinite(x) && Number.isFinite(z) && z >= -.60 && z <= 7.66 && publicFloor(x,z)
  };
})();
