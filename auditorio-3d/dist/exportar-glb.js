/* Exportación local de geometría y luces editables, con el exportador oficial de Three.js r160. */
(() => {
  'use strict';

  const libraryURL = new URL('recursos/three-gltf-exporter.js', document.currentScript?.src || document.baseURI);
  let loading;
  function loadExporter() {
    if (window.AuditorioGLTFExporter) return Promise.resolve(window.AuditorioGLTFExporter);
    if (!loading) {
      loading = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = libraryURL.href;
        script.onload = () => resolve(window.AuditorioGLTFExporter);
        script.onerror = () => {
          script.remove();
          loading = null;
          reject(new Error('No se pudo abrir el exportador local de Three.js.'));
        };
        document.head.append(script);
      });
    }
    return loading;
  }

  function buildSnapshot(model) {
    const source = model.exportScene();
    const T = THREE;
    const scene = new T.Scene();
    scene.name = 'Auditorio';
    scene.userData = {
      units: 'metres', up: 'Y',
      description: 'Maqueta de trabajo. Intensidades y color representan el estado del visor. Consultar la memoria técnica para fotometría.'
    };
    const architecture = new T.Group();
    architecture.name = 'Arquitectura y equipamiento';
    const lighting = new T.Group();
    lighting.name = 'Instalación de iluminación';
    scene.add(architecture, lighting);
    const fixtures = new Map();
    const inverse = new Map();
    for (const fixture of source.fixtures) {
      const group = new T.Group();
      group.name = fixture.id;
      group.position.set(fixture.x, fixture.y, fixture.z);
      group.updateMatrixWorld();
      group.userData = { ...fixture, fixtureId: fixture.id };
      fixtures.set(fixture.id, group);
      inverse.set(group, group.matrixWorld.clone().invert());
      lighting.add(group);
    }
    const geometries = new Map(), materials = new Map();
    function geometry(src) {
      if (!geometries.has(src)) geometries.set(src, src.clone());
      return geometries.get(src);
    }
    function material(src) {
      if (Array.isArray(src)) return src.map(material);
      if (materials.has(src)) return materials.get(src);
      let result;
      if (src.isMeshPhongMaterial || src.isMeshLambertMaterial) {
        result = new T.MeshStandardMaterial({
          color: src.color, map: src.map, emissive: src.emissive,
          emissiveMap: src.emissiveMap, emissiveIntensity: src.emissiveIntensity,
          vertexColors: src.vertexColors, side: src.side, transparent: src.transparent,
          opacity: src.opacity, alphaMap: src.alphaMap, alphaTest: src.alphaTest,
          roughness: src.isMeshPhongMaterial ? Math.min(1, Math.sqrt(2 / (src.shininess + 2)) * 2) : 1,
          metalness: 0
        });
      } else result = src.clone();
      if (result.color) {
        // Lens previews can use HDR colors; glTF base color stores reflectance in [0, 1].
        const peak = Math.max(1, result.color.r, result.color.g, result.color.b);
        result.color.multiplyScalar(1 / peak);
      }
      result.name = src.name;
      materials.set(src, result);
      return result;
    }
    function skip(obj) {
      return !obj.visible || obj.userData.excludeFromExport || obj.isSprite ||
        obj.isLine || obj.isPoints || obj.isLight || obj.isCamera;
    }
    const local = new T.Matrix4();
    const individual = new T.Matrix4();
    const world = new T.Matrix4();
    function appendMesh(src, parent, frame, name) {
      const mesh = new T.Mesh(geometry(src.geometry), material(src.material));
      mesh.name = name;
      local.copy(frame);
      if (inverse.has(parent)) local.premultiply(inverse.get(parent));
      local.decompose(mesh.position, mesh.quaternion, mesh.scale);
      parent.add(mesh);
    }
    function collect(obj, parent) {
      if (skip(obj)) return;
      const fixtureId = obj.userData.fixtureId;
      if (fixtureId) {
        if (!fixtures.has(fixtureId)) return;
        parent = fixtures.get(fixtureId);
      }
      if (obj.isMesh && ![obj.material].flat().some(item => item.isShaderMaterial)) {
        const name = obj.name || (parent === architecture ? 'Elemento' : 'Componente');
        if (obj.isInstancedMesh) {
          // Core glTF nodes share geometry and materials; viewers need no instancing extension.
          for (let i = 0; i < obj.count; i++) {
            obj.getMatrixAt(i, individual);
            world.multiplyMatrices(obj.matrixWorld, individual);
            appendMesh(obj, parent, world, name + ' ' + (i + 1));
          }
        } else appendMesh(obj, parent, obj.matrixWorld, name);
      }
      for (const child of obj.children) collect(child, parent);
    }
    collect(source.scene, architecture);
    const position = new T.Vector3(), target = new T.Vector3();
    const forward = new T.Vector3(0, 0, -1);
    for (const live of source.lights) {
      const parent = fixtures.get(live.userData.fixtureId);
      if (!parent || !live.isSpotLight) continue;
      const spot = new T.SpotLight();
      spot.name = parent.name + ' · emisión';
      spot.color.copy(live.color);
      spot.intensity = live.intensity;
      spot.angle = live.angle;
      spot.penumbra = live.penumbra;
      spot.distance = live.distance;
      spot.decay = 2;
      position.setFromMatrixPosition(live.matrixWorld);
      target.setFromMatrixPosition(live.target.matrixWorld).sub(position).normalize();
      spot.position.copy(position).applyMatrix4(inverse.get(parent));
      spot.quaternion.setFromUnitVectors(forward, target);
      // glTF spots point along local -Z. The target is implicit in the rotation.
      spot.target.position.set(0, 0, -1);
      spot.add(spot.target);
      parent.add(spot);
    }
    if (source.camera) {
      const camera = source.camera.clone(false);
      source.camera.matrixWorld.decompose(camera.position, camera.quaternion, camera.scale);
      camera.name = 'Vista del auditorio';
      scene.add(camera);
    }
    return {scene, geometries, materials};
  }

  window.exportarAuditorioGLB = async function exportarAuditorioGLB(model) {
    const snapshot = buildSnapshot(model);
    try {
      const Exporter = await loadExporter();
      const bytes = await new Exporter().parseAsync(snapshot.scene, {
        binary: true, onlyVisible: true, trs: true, maxTextureSize: 2048
      });
      return new Blob([bytes], { type: 'model/gltf-binary' });
    } finally {
      for (const item of snapshot.geometries.values()) item.dispose();
      for (const item of snapshot.materials.values()) item.dispose();
    }
  };
})();
