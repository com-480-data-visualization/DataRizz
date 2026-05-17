import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

export class AthleteRenderer {
  static loader = new GLTFLoader();

  static cache = {
    man: null,
    woman: null
  };

  static loadModels(manUrl, womanUrl) {
    return Promise.all([
      this._load(manUrl).then(m => (this.cache.man = m)),
      this._load(womanUrl).then(m => (this.cache.woman = m))
    ]);
  }

  static _load(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(url, gltf => resolve(gltf.scene), undefined, reject);
    });
  }

  static addHuman(scene, athlete, pos, gender = "man") {
    const base = this.cache[gender].clone(true);

    const group = new THREE.Group();
    group.position.set(pos.x, pos.podiumHeight, 0);

    const height = athlete.height || 170;
    const weight = athlete.weight || 65;

    const heightScale = THREE.MathUtils.clamp(height / 175, 0.85, 1.2);
    const weightScale = THREE.MathUtils.clamp(weight / 70, 0.85, 1.25);

    base.scale.setScalar(heightScale);
    base.scale.x *= weightScale;
    base.scale.z *= weightScale;
    base.position.y = 0;

    base.traverse((obj) => {
      if (!obj.isMesh) return;
      const mat = obj.material;
      mat.transparent = false;
      mat.opacity = 1;
      mat.side = THREE.DoubleSide;
      if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
      if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
    });

    base.traverse((obj) => {
      if (!obj.isMesh) return;
      const name = obj.name.toLowerCase();
      if (name.includes("cloth") || name.includes("shirt") || name.includes("body")) {
        obj.material = new THREE.MeshStandardMaterial({
          color: 0xf2f2f2,
          roughness: 0.8
        });
      }
    });

    group.add(base);

    // Real bounding box so all positions adapt to any model scale
    const tempBox = new THREE.Box3().setFromObject(group);
    const modelWorldHeight = tempBox.max.y - tempBox.min.y;

    const chestWorldY = tempBox.min.y + modelWorldHeight * 0.72;
    const neckWorldY  = tempBox.min.y + modelWorldHeight * 0.88;
    const frontWorldZ = tempBox.max.z + 0.02;

    // Group-local Y (group sits at pos.podiumHeight)
    const chestLocalY = chestWorldY - pos.podiumHeight;
    const neckLocalY  = neckWorldY  - pos.podiumHeight;

    const medalRadius  = modelWorldHeight * 0.032;
    const strapRadius  = medalRadius * 0.12;
    const neckHalfWidth = modelWorldHeight * 0.045; // where straps leave the neck
    const neckZ = frontWorldZ - medalRadius * 1.5;  // straps start slightly behind

    // Two diagonal ribbon straps forming a V around the neck
    const strapMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.65 });
    const medalCenter = new THREE.Vector3(0, chestLocalY, frontWorldZ);

    [
      new THREE.Vector3(-neckHalfWidth, neckLocalY, neckZ),
      new THREE.Vector3( neckHalfWidth, neckLocalY, neckZ)
    ].forEach(strapStart => {
      this._addSegment(group, strapStart, medalCenter, strapRadius, strapMat);
    });

    // Medal disc (drawn after straps so it sits on top)
    const medalMat = new THREE.MeshStandardMaterial({
      color: this._medalColor(athlete.medal),
      metalness: 0.75,
      roughness: 0.25
    });
    const medalDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(medalRadius, medalRadius, medalRadius * 0.25, 32),
      medalMat
    );
    medalDisc.position.set(0, chestLocalY, frontWorldZ);
    medalDisc.rotation.x = Math.PI / 2;
    group.add(medalDisc);

    scene.add(group);
    return group;
  }

  // Draws a cylinder aligned between two arbitrary 3D points
  static _addSegment(group, from, to, radius, material) {
    const dir    = new THREE.Vector3().subVectors(to, from);
    const length = dir.length();
    const mid    = new THREE.Vector3().lerpVectors(from, to, 0.5);

    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 8),
      material
    );
    mesh.position.copy(mid);
    // CylinderGeometry is Y-up by default; rotate to align with dir
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    group.add(mesh);
  }

  static _medalColor(medal) {
    switch (medal) {
      case "Gold":   return 0xf4c542;
      case "Silver": return 0xcfd5db;
      case "Bronze": return 0xd88c32;
      default:       return 0xffffff;
    }
  }
}