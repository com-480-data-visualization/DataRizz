import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

(function () {
  "use strict";

  const DATA_PATH = "data/olympics.csv";

  const selectors = {
    root: "#bodytype-viz",
    season: "#bodytype-season",
    year: "#bodytype-year",
    gender: "#bodytype-gender",
    sport: "#bodytype-sport",
    discipline: "#bodytype-discipline",
    podium: "#bodytype-podium"
  };

  const state = {
    rows: [],
    columns: {},
    season: "Summer",
    year: null,
    gender: "Women",
    sport: null,
    discipline: null
  };

  const medalRank = {
    Gold: 1,
    Silver: 2,
    Bronze: 3
  };

  const podiumColors = {
    Gold: 0xf3e58d,
    Silver: 0xd5d9de,
    Bronze: 0xe3c38b
  };

  const medalColors = {
    Gold: 0xf4c542,
    Silver: 0xcfd5db,
    Bronze: 0xd88c32
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!document.querySelector(selectors.root)) return;

    try {
      const rows = await d3.csv(DATA_PATH, d3.autoType);
      state.rows = rows;
      state.columns = detectColumns(rows);

      setupControls();
      initializeState();
      refreshAllControls();
      updateScene();
    } catch (error) {
      console.error(error);
      showError(`Could not load ${DATA_PATH}.`);
    }
  }

  function detectColumns(rows) {
    const columns = Object.keys(rows[0] || {});

    return {
      year: findColumn(columns, ["Year", "year"]),
      season: findColumn(columns, ["Season", "season"]),
      sex: findColumn(columns, ["Sex", "sex", "Gender", "gender"]),
      sport: findColumn(columns, ["Sport", "sport"]),
      event: findColumn(columns, ["Event", "event", "Discipline", "discipline"]),
      medal: findColumn(columns, ["Medal", "medal"]),
      name: findColumn(columns, ["Name", "name"]),
      noc: findColumn(columns, ["NOC", "noc"]),
      team: findColumn(columns, ["Team", "team"]),
      height: findColumn(columns, ["Height", "height"]),
      weight: findColumn(columns, ["Weight", "weight"])
    };
  }

  function findColumn(columns, candidates) {
    return candidates.find(candidate => columns.includes(candidate)) || null;
  }

  function setupControls() {
    d3.select(selectors.season)
      .selectAll("option")
      .data(["Summer", "Winter"])
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    d3.select(selectors.gender)
      .selectAll("option")
      .data(["Women", "Men"])
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    d3.select(selectors.season).on("change", function () {
      state.season = this.value;
      refreshYears();
      refreshSports();
      refreshDisciplines();
      updateScene();
    });

    d3.select(selectors.year).on("change", function () {
      state.year = Number(this.value);
      refreshSports();
      refreshDisciplines();
      updateScene();
    });

    d3.select(selectors.gender).on("change", function () {
      state.gender = this.value;
      refreshSports();
      refreshDisciplines();
      updateScene();
    });

    d3.select(selectors.sport).on("change", function () {
      state.sport = this.value;
      refreshDisciplines();
      updateScene();
    });

    d3.select(selectors.discipline).on("change", function () {
      state.discipline = this.value;
      updateScene();
    });
  }

  function initializeState() {
    const years = getAvailableYears(state.season);
    state.year = years.includes(2016) ? 2016 : years[years.length - 1];

    const sports = getAvailableSports(state.season, state.year, state.gender);
    state.sport = sports.includes("Gymnastics") ? "Gymnastics" : sports[0] || null;

    const disciplines = getAvailableDisciplines(
      state.season,
      state.year,
      state.gender,
      state.sport
    );

    const vault = disciplines.find(d => d.toLowerCase().includes("vault"));
    state.discipline = vault || disciplines[0] || null;
  }

  function refreshAllControls() {
    d3.select(selectors.season).property("value", state.season);
    d3.select(selectors.gender).property("value", state.gender);

    refreshYears();
    refreshSports();
    refreshDisciplines();

    resizeBodytypeSelects();
  }

  function refreshYears() {
    const years = getAvailableYears(state.season);

    if (!years.includes(state.year)) {
      state.year = years[years.length - 1] || null;
    }

    d3.select(selectors.year)
      .selectAll("option")
      .data(years)
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    d3.select(selectors.year).property("value", state.year);
    resizeBodytypeSelects();
  }

  function refreshSports() {
    const sports = getAvailableSports(state.season, state.year, state.gender);

    if (!sports.includes(state.sport)) {
      state.sport = sports[0] || null;
    }

    d3.select(selectors.sport)
      .selectAll("option")
      .data(sports)
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    if (state.sport) {
      d3.select(selectors.sport).property("value", state.sport);
    }

    resizeBodytypeSelects();
  }

  function refreshDisciplines() {
    const disciplines = getAvailableDisciplines(
      state.season,
      state.year,
      state.gender,
      state.sport
    );

    if (!disciplines.includes(state.discipline)) {
      state.discipline = disciplines[0] || null;
    }

    d3.select(selectors.discipline)
      .selectAll("option")
      .data(disciplines)
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    if (state.discipline) {
      d3.select(selectors.discipline).property("value", state.discipline);
    }

    resizeBodytypeSelects();
  }

  function getAvailableYears(season) {
    const c = state.columns;

    return Array.from(
      new Set(
        state.rows
          .filter(row => String(row[c.season] || "").trim() === season)
          .map(row => Number(row[c.year]))
          .filter(Number.isFinite)
      )
    ).sort((a, b) => a - b);
  }

  function getAvailableSports(season, year, gender) {
    const c = state.columns;

    return Array.from(
      new Set(
        state.rows
          .filter(row => {
            return (
              String(row[c.season] || "").trim() === season &&
              Number(row[c.year]) === Number(year) &&
              normalizeGender(row[c.sex]) === gender &&
              isRealMedal(row[c.medal])
            );
          })
          .map(row => cleanLabel(row[c.sport]))
          .filter(Boolean)
      )
    ).sort(d3.ascending);
  }

  function getAvailableDisciplines(season, year, gender, sport) {
    const c = state.columns;

    return Array.from(
      new Set(
        state.rows
          .filter(row => {
            return (
              String(row[c.season] || "").trim() === season &&
              Number(row[c.year]) === Number(year) &&
              normalizeGender(row[c.sex]) === gender &&
              cleanLabel(row[c.sport]) === sport &&
              isRealMedal(row[c.medal])
            );
          })
          .map(row => normalizeDiscipline(row[c.event], row[c.sport]))
          .filter(Boolean)
      )
    ).sort(d3.ascending);
  }

  function getSelectedMedalists() {
    const c = state.columns;

    const filtered = state.rows.filter(row => {
      return (
        String(row[c.season] || "").trim() === state.season &&
        Number(row[c.year]) === Number(state.year) &&
        normalizeGender(row[c.sex]) === state.gender &&
        cleanLabel(row[c.sport]) === state.sport &&
        normalizeDiscipline(row[c.event], row[c.sport]) === state.discipline &&
        isRealMedal(row[c.medal])
      );
    });

    const grouped = new Map();

    filtered.forEach(row => {
      const medal = normalizeMedal(row[c.medal]);

      const key = [
        medal,
        cleanLabel(row[c.name]),
        cleanLabel(row[c.noc]),
        normalizeNumber(row[c.height]),
        normalizeNumber(row[c.weight])
      ].join("|||");

      if (!grouped.has(medal)) {
        grouped.set(medal, new Map());
      }

      if (!grouped.get(medal).has(key)) {
        grouped.get(medal).set(key, {
          medal,
          rank: medalRank[medal],
          name: cleanAthleteName(row[c.name]),
          noc: cleanLabel(row[c.noc]),
          team: cleanLabel(row[c.team]),
          height: normalizeNumber(row[c.height]),
          weight: normalizeNumber(row[c.weight])
        });
      }
    });

    return ["Silver", "Gold", "Bronze"].map(medal => {
      const entries = grouped.has(medal)
        ? Array.from(grouped.get(medal).values())
        : [];

      return entries[0] || {
        medal,
        rank: medalRank[medal],
        name: "No data",
        noc: "",
        team: "",
        height: 165,
        weight: 60
      };
    });
  }

  function normalizeGender(value) {
    const text = String(value || "").trim().toLowerCase();

    if (["f", "female", "women", "woman"].includes(text)) {
      return "Women";
    }

    return "Men";
  }

  function normalizeMedal(value) {
    const text = String(value || "").trim().toLowerCase();

    if (text.includes("gold")) return "Gold";
    if (text.includes("silver")) return "Silver";
    if (text.includes("bronze")) return "Bronze";

    return "";
  }

  function isRealMedal(value) {
    return ["Gold", "Silver", "Bronze"].includes(normalizeMedal(value));
  }

  function cleanLabel(value) {
    return String(value || "").trim();
  }

  function cleanAthleteName(value) {
    const text = String(value || "").trim();

    if (!text) return "Unknown athlete";

    return text
      .toLowerCase()
      .split(" ")
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function normalizeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function normalizeDiscipline(eventValue, sportValue) {
    let event = String(eventValue || "").trim();
    const sport = String(sportValue || "").trim();

    event = event
      .replace(/\bWomen'?s\b/gi, "")
      .replace(/\bMen'?s\b/gi, "")
      .replace(/\bWomen\b/gi, "")
      .replace(/\bMen\b/gi, "")
      .replace(/\bMixed\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (sport) {
      const escapedSport = sport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      event = event.replace(new RegExp("^" + escapedSport + "\\s*", "i"), "").trim();
    }

    return event || sport || "Unknown";
  }

  function updateScene() {
    const mount = document.querySelector(selectors.podium);
    mount.innerHTML = "";

    if (!state.year || !state.sport || !state.discipline) {
      showError("No data available for this selection.");
      resizeBodytypeSelects();
      return;
    }

    const medalists = getSelectedMedalists();

    const wrapper = document.createElement("div");
    wrapper.className = "bodytype-3d-wrapper";
    mount.appendChild(wrapper);

    const overlay = document.createElement("div");
    overlay.className = "bodytype-label-overlay";
    wrapper.appendChild(overlay);

    const canvasWrap = document.createElement("div");
    canvasWrap.className = "bodytype-canvas-wrap";
    wrapper.appendChild(canvasWrap);

    const width = canvasWrap.clientWidth || 1180;
    const height = 670;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 5.6, 15);
    camera.lookAt(0, 3.3, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    canvasWrap.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.55));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-6, 7, 6);
    scene.add(fillLight);

    const positions = {
      Silver: { x: -5.3, podiumHeight: 1.05, podiumWidth: 3.25, podiumDepth: 2.4 },
      Gold: { x: 0, podiumHeight: 1.45, podiumWidth: 3.8, podiumDepth: 2.4 },
      Bronze: { x: 5.3, podiumHeight: 0.9, podiumWidth: 3.25, podiumDepth: 2.4 }
    };

    ["Silver", "Gold", "Bronze"].forEach((medal, index) => {
      const athlete = medalists.find(d => d.medal === medal);
      const pos = positions[medal];

      addPodium(scene, pos, medal);
      addHuman(scene, athlete, pos);
      addAthleteOverlay(overlay, athlete, index);
    });

    renderer.render(scene, camera);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }

    animate();

    resizeBodytypeSelects();
  }

  function addPodium(scene, pos, medal) {
    const podium = new THREE.Mesh(
      new THREE.BoxGeometry(pos.podiumWidth, pos.podiumHeight, pos.podiumDepth),
      new THREE.MeshStandardMaterial({
        color: podiumColors[medal],
        roughness: 0.85
      })
    );

    podium.position.set(pos.x, pos.podiumHeight / 2, 0);
    scene.add(podium);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(pos.podiumWidth, pos.podiumHeight, pos.podiumDepth)
      ),
      new THREE.LineBasicMaterial({ color: 0x222222 })
    );

    edges.position.copy(podium.position);
    scene.add(edges);

    const rank = makeTextSprite(String(medalRank[medal]), {
      fontsize: 90,
      textColor: "#ffffff"
    });

    rank.position.set(pos.x, pos.podiumHeight * 0.5, pos.podiumDepth / 2 + 0.04);
    rank.scale.set(1.4, 0.7, 1);
    scene.add(rank);
  }

  function addHuman(scene, athlete, pos) {
    const heightCm = athlete.height || 165;
    const weightKg = athlete.weight || 60;

    const heightScale = THREE.MathUtils.clamp(heightCm / 165, 0.84, 1.16);
    const expectedWeight = 22 * Math.pow(heightCm / 100, 2);
    const widthScale = THREE.MathUtils.clamp(weightKg / expectedWeight, 0.8, 1.25);

    const group = new THREE.Group();
    group.position.x = pos.x;

    const skin = new THREE.MeshStandardMaterial({
      color: 0xf0ded2,
      roughness: 0.9
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x6f5140,
      roughness: 0.95
    });

    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x2f74d0,
      roughness: 0.6
    });

    const medalMat = new THREE.MeshStandardMaterial({
      color: medalColors[athlete.medal],
      metalness: 0.2,
      roughness: 0.45
    });

    const baseY = pos.podiumHeight;

    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.48 * widthScale, 1.75 * heightScale, 14, 26),
      skin
    );
    torso.position.set(0, baseY + 2.35 * heightScale, 0);
    torso.scale.set(1.05, 1, 0.62);
    group.add(torso);

    const chest = new THREE.Mesh(
      new THREE.SphereGeometry(0.56 * widthScale, 28, 18),
      skin
    );
    chest.position.set(0, baseY + 3.1 * heightScale, 0);
    chest.scale.set(1, 0.7, 0.55);
    group.add(chest);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.36 * widthScale, 30, 24),
      skin
    );
    head.position.set(0, baseY + 4.25 * heightScale, 0);
    group.add(head);

    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.39 * widthScale,
        26,
        14,
        0,
        Math.PI * 2,
        0,
        Math.PI / 1.75
      ),
      hairMat
    );
    hair.position.set(0, baseY + 4.35 * heightScale, 0);
    group.add(hair);

    addLimb(
      group,
      -0.78 * widthScale,
      baseY + 2.95 * heightScale,
      0,
      0.18 * widthScale,
      1.45 * heightScale,
      0.75,
      skin
    );

    addLimb(
      group,
      0.78 * widthScale,
      baseY + 2.95 * heightScale,
      0,
      0.18 * widthScale,
      1.45 * heightScale,
      -0.5,
      skin
    );

    addLimb(
      group,
      -0.26 * widthScale,
      baseY + 0.9 * heightScale,
      0,
      0.19 * widthScale,
      1.65 * heightScale,
      0.05,
      skin
    );

    addLimb(
      group,
      0.26 * widthScale,
      baseY + 0.9 * heightScale,
      0,
      0.19 * widthScale,
      1.65 * heightScale,
      -0.05,
      skin
    );

    const leftStrap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.1, 12),
      suitMat
    );
    leftStrap.position.set(-0.18 * widthScale, baseY + 3.32 * heightScale, 0.44);
    leftStrap.rotation.z = 0.23;
    group.add(leftStrap);

    const rightStrap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.1, 12),
      suitMat
    );
    rightStrap.position.set(0.18 * widthScale, baseY + 3.32 * heightScale, 0.44);
    rightStrap.rotation.z = -0.23;
    group.add(rightStrap);

    const medal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.04, 32),
      medalMat
    );
    medal.position.set(0, baseY + 3.14 * heightScale, 0.5);
    medal.rotation.x = Math.PI / 2;
    group.add(medal);

    scene.add(group);

    addHeightArrow(scene, pos, heightCm, heightScale);
    addWeightLabel(scene, pos, weightKg);
  }

  function addLimb(group, x, y, z, radius, length, rotationZ, material) {
    const limb = new THREE.Mesh(
      new THREE.CapsuleGeometry(radius, length, 10, 18),
      material
    );

    limb.position.set(x, y, z);
    limb.rotation.z = rotationZ;
    group.add(limb);
  }

  function addHeightArrow(scene, pos, heightCm, heightScale) {
    const x = pos.x + 1.55;
    const bottom = pos.podiumHeight;
    const top = pos.podiumHeight + 4.75 * heightScale;
    const z = 0.55;

    const mat = new THREE.LineBasicMaterial({ color: 0x222222 });

    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, bottom, z),
          new THREE.Vector3(x, top, z)
        ]),
        mat
      )
    );

    const text = makeTextSprite(`${(heightCm / 100).toFixed(2)} m`, {
      fontsize: 44,
      textColor: "#ffffff"
    });

    text.position.set(x + 0.65, (top + bottom) / 2, z);
    text.scale.set(1.35, 0.52, 1);
    scene.add(text);
  }

  function addWeightLabel(scene, pos, weightKg) {
    const text = makeTextSprite(`${weightKg} kg`, {
      fontsize: 44,
      textColor: "#111111",
      bgColor: "rgba(245,245,245,0.95)"
    });

    text.position.set(pos.x + 1.35, pos.podiumHeight + 0.45, 0.75);
    text.scale.set(1.15, 0.52, 1);
    scene.add(text);
  }

  function addAthleteOverlay(container, athlete, index) {
    const div = document.createElement("div");
    div.className = `bodytype-athlete-label bodytype-athlete-${index}`;

    div.innerHTML = `
      <div class="bodytype-athlete-name">${athlete.name}</div>
      <div class="bodytype-athlete-meta">${athlete.noc || ""}</div>
    `;

    container.appendChild(div);
  }

  function makeTextSprite(message, options = {}) {
    const fontsize = options.fontsize || 42;
    const textColor = options.textColor || "#111111";
    const bgColor = options.bgColor || "rgba(255,255,255,0)";

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    context.font = `${fontsize}px Arial`;

    const width = context.measureText(message).width + 40;
    const height = fontsize + 34;

    canvas.width = width;
    canvas.height = height;

    context.font = `${fontsize}px Arial`;
    context.fillStyle = bgColor;
    context.fillRect(0, 0, width, height);

    context.fillStyle = textColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(message, width / 2, height / 2);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    return new THREE.Sprite(material);
  }

  function resizeBodytypeSelects() {
    document.querySelectorAll(".bodytype-control select").forEach(select => {
      const selectedText = select.options[select.selectedIndex]?.text || "";

      const measurer = document.createElement("span");
      measurer.style.position = "absolute";
      measurer.style.visibility = "hidden";
      measurer.style.whiteSpace = "nowrap";
      measurer.style.font = window.getComputedStyle(select).font;
      measurer.textContent = selectedText;

      document.body.appendChild(measurer);

      const width = Math.ceil(measurer.getBoundingClientRect().width) + 62;
      const cappedWidth = Math.min(width, 420);

      select.style.width = `${cappedWidth}px`;

      document.body.removeChild(measurer);
    });
  }

  function showError(message) {
    const mount = document.querySelector(selectors.podium);
    if (!mount) return;

    mount.innerHTML = `<div class="gender-error">${message}</div>`;
  }
})();