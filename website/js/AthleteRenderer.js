import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

export class AthleteRenderer {
  static loader = new GLTFLoader();

  static cache = {
    man_gold: null,
    man_silver: null,
    man_bronze: null,
    woman_gold: null,
    woman_silver: null,
    woman_bronze: null
  };

  static loadModels(manGoldUrl, manSilverUrl, manBronzeUrl, womanGoldUrl, womanSilverUrl, womanBronzeUrl) {
    return Promise.all([
      this._load(manGoldUrl).then(m => (this.cache.man_gold = m)),
      this._load(manSilverUrl).then(m => (this.cache.man_silver = m)),
      this._load(manBronzeUrl).then(m => (this.cache.man_bronze = m)),
      this._load(womanGoldUrl).then(m => (this.cache.woman_gold = m)),
      this._load(womanSilverUrl).then(m => (this.cache.woman_silver = m)),
      this._load(womanBronzeUrl).then(m => (this.cache.woman_bronze = m))
    ]);
  }

  static _load(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(url, gltf => resolve(gltf.scene), undefined, reject);
    });
  }

  static addHuman(scene, athlete, pos, gender = "man") {
    const cacheKey = `${gender}_${athlete.medal.toLowerCase()}`;

    const base = this.cache[cacheKey].clone(true);

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

    const medalMat = new THREE.MeshStandardMaterial({
      color: this._medalColor(athlete.medal),
      metalness: 0.8,
      roughness: 0.2
    });

    base.traverse((obj) => {
      if (!obj.isMesh) return;
      const mat = obj.material;
      mat.transparent = false;
      mat.opacity = 1;
      mat.side = THREE.DoubleSide;
      if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
      if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;

      if (!obj.name.includes("_basic")) {
        obj.material = medalMat;
      }
    });

    group.add(base);
    scene.add(group);
    return group;
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
