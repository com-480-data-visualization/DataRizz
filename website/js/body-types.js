import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { AthleteRenderer } from "./AthleteRenderer.js";

(function () {
  "use strict";

  const DATA_PATH = "data/body_types.csv";

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

  let resizeTimer = null;
  let currentRenderer = null;
  let currentScene = null;
  let currentAnimationFrame = null;
  let scrollBridgeInstalled = false;
  let lastWheelMove = 0;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateScene, 150);
  });

  const medalRank = {
    Gold: 1,
    Silver: 2,
    Bronze: 3
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const root = document.querySelector(selectors.root);
    if (!root) return;

    showLoading(root);

    try {
      const [rows] = await Promise.all([
        d3.csv(DATA_PATH, d3.autoType),
        AthleteRenderer.loadModels(
          "models/man_outfit_gold.glb",
          "models/man_outfit_silver.glb",
          "models/man_outfit_bronze.glb",
          "models/woman_outfit_gold.glb",
          "models/woman_outfit_silver.glb",
          "models/woman_outfit_bronze.glb"
        )
      ]);

      state.rows = rows;
      state.columns = detectColumns(rows);

      removeLoading(root);
      setupControls();
      initializeState();
      refreshAllControls();
      updateScene();
    } catch (error) {
      console.error(error);
      showError("Could not load data or 3D models.");
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
          .filter(row => (
            String(row[c.season] || "").trim() === season &&
            Number(row[c.year]) === Number(year) &&
            normalizeGender(row[c.sex]) === gender &&
            isRealMedal(row[c.medal])
          ))
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
          .filter(row => (
            String(row[c.season] || "").trim() === season &&
            Number(row[c.year]) === Number(year) &&
            normalizeGender(row[c.sex]) === gender &&
            cleanLabel(row[c.sport]) === sport &&
            isRealMedal(row[c.medal])
          ))
          .map(row => normalizeDiscipline(row[c.event], row[c.sport]))
          .filter(Boolean)
      )
    ).sort(d3.ascending);
  }

  function getSelectedMedalists() {
    const c = state.columns;

    const filtered = state.rows.filter(row => (
      String(row[c.season] || "").trim() === state.season &&
      Number(row[c.year]) === Number(state.year) &&
      normalizeGender(row[c.sex]) === state.gender &&
      cleanLabel(row[c.sport]) === state.sport &&
      normalizeDiscipline(row[c.event], row[c.sport]) === state.discipline &&
      isRealMedal(row[c.medal])
    ));

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

      if (!grouped.has(medal)) grouped.set(medal, new Map());

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

  function updateScene() {
    const mount = document.querySelector(selectors.podium);
    if (!mount) return;

    cleanupCurrentScene();
    mount.innerHTML = "";

    if (!state.year || !state.sport || !state.discipline) {
      showError("No data available for this selection.");
      resizeBodytypeSelects();
      rebuildFullPageAfterLayout();
      return;
    }

    const medalists = getSelectedMedalists();

    const wrapper = document.createElement("div");
    wrapper.className = "bodytype-3d-wrapper";
    mount.appendChild(wrapper);

    const overlay = document.createElement("div");
    overlay.className = "bodytype-label-overlay";
    overlay.style.pointerEvents = "none";
    wrapper.appendChild(overlay);

    const canvasWrap = document.createElement("div");
    canvasWrap.className = "bodytype-canvas-wrap";
    canvasWrap.style.pointerEvents = "none";
    wrapper.appendChild(canvasWrap);

    const width = Math.max(canvasWrap.clientWidth || 1180, 900);
    const height = 520;

    const scene = new THREE.Scene();
    scene.background = null;
    currentScene = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    camera.position.set(0, 20, 28);
    camera.lookAt(0, 11, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    currentRenderer = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = "none";
    canvasWrap.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.55));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-6, 7, 6);
    scene.add(fillLight);

    const positions = {
      Silver: { x: -9.75, podiumHeight: 2.2, podiumWidth: 10.0, podiumDepth: 3.0 },
      Gold:   { x: 0,     podiumHeight: 3.2, podiumWidth: 9.5,  podiumDepth: 3.0 },
      Bronze: { x: 9.75,  podiumHeight: 1.5, podiumWidth: 10.0, podiumDepth: 3.0 }
    };

    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    addConnectedPodium(scene, positions);

    ["Silver", "Gold", "Bronze"].forEach(medal => {
      const athlete = medalists.find(d => d.medal === medal);
      const pos = positions[medal];

      addHuman(scene, athlete, pos);
      addAthleteOverlay(overlay, athlete, pos, camera, width, height);
    });

    function animate() {
      currentAnimationFrame = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }

    animate();
    resizeBodytypeSelects();
    rebuildFullPageAfterLayout();
  }

  function rebuildFullPageAfterLayout() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (
          window.fullpage_api &&
          typeof window.fullpage_api.reBuild === "function"
        ) {
          window.fullpage_api.reBuild();
        }
      });
    });
  }

  function cleanupCurrentScene() {
    if (currentAnimationFrame) {
      cancelAnimationFrame(currentAnimationFrame);
      currentAnimationFrame = null;
    }

    if (currentScene) {
      currentScene.traverse(object => {
        if (!object.isMesh) return;

        if (object.geometry) object.geometry.dispose();

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        materials.filter(Boolean).forEach(material => {
          Object.keys(material).forEach(key => {
            const value = material[key];
            if (value && typeof value.dispose === "function") {
              value.dispose();
            }
          });

          if (typeof material.dispose === "function") {
            material.dispose();
          }
        });
      });

      currentScene = null;
    }

    if (currentRenderer) {
      currentRenderer.dispose();
      currentRenderer.forceContextLoss();
      currentRenderer.domElement?.remove();
      currentRenderer = null;
    }
  }

  function addConnectedPodium(scene, pos) {
    const depth = pos.Gold.podiumDepth;

    const sideMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.8
    });

    const topMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 0.7
    });

    const mat = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];

    const silverLeft = pos.Silver.x - pos.Silver.podiumWidth / 2;
    const goldRight = pos.Gold.x + pos.Gold.podiumWidth / 2;
    const bronzeRight = pos.Bronze.x + pos.Bronze.podiumWidth / 2;

    const bronzeH = pos.Bronze.podiumHeight;
    const silverH = pos.Silver.podiumHeight;
    const goldH = pos.Gold.podiumHeight;

    const overlap = 0.02;
    const layers = [
      {
        w: bronzeRight - silverLeft,
        h: bronzeH,
        cx: (silverLeft + bronzeRight) / 2,
        cy: bronzeH / 2
      },
      {
        w: goldRight - silverLeft,
        h: silverH - bronzeH + overlap,
        cx: (silverLeft + goldRight) / 2,
        cy: bronzeH + (silverH - bronzeH + overlap) / 2 - overlap / 2
      },
      {
        w: pos.Gold.podiumWidth,
        h: goldH - silverH + overlap,
        cx: pos.Gold.x,
        cy: silverH + (goldH - silverH + overlap) / 2 - overlap / 2
      }
    ];

    layers.forEach(({ w, h, cx, cy }) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), mat);
      mesh.position.set(cx, cy, 0);
      scene.add(mesh);
    });

    const ringsW = 6.0;
    const ringsH = ringsW * (175 / 420);

    const ringsPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(ringsW, ringsH),
      new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(makeOlympicRingsCanvas()),
        transparent: true,
        depthWrite: false
      })
    );

    ringsPlane.position.set(
      pos.Gold.x,
      pos.Gold.podiumHeight / 2,
      depth / 2 + 0.01
    );

    scene.add(ringsPlane);
  }

  function makeOlympicRingsCanvas() {
    const W = 420;
    const H = 175;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");

    const rings = [
      { cx: 113, cy: 62, color: "#0085C7" },
      { cx: 210, cy: 62, color: "#000000" },
      { cx: 307, cy: 62, color: "#DF0024" },
      { cx: 162, cy: 112, color: "#F4C300" },
      { cx: 259, cy: 112, color: "#009F6B" }
    ];

    rings.forEach(r => {
      ctx.beginPath();
      ctx.arc(r.cx, r.cy, 38, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 9;
      ctx.stroke();
    });

    return canvas;
  }

  function addHuman(scene, athlete, pos) {
    const gender = state.gender === "Women" ? "woman" : "man";
    const group = AthleteRenderer.addHuman(scene, athlete, pos, gender);
    group.scale.multiplyScalar(0.85);
  }

  function addAthleteOverlay(container, athlete, pos, camera, canvasW, canvasH) {
    const div = document.createElement("div");
    div.className = "bodytype-athlete-label";

    const heightStr = athlete.height ? `${athlete.height} cm` : "– cm";
    const weightStr = athlete.weight ? `${athlete.weight} kg` : "– kg";

    div.innerHTML = `
      <div class="bodytype-athlete-name">${athlete.name}</div>
      <div class="bodytype-athlete-meta">${athlete.noc || ""}</div>
      <div class="bodytype-athlete-stats">${heightStr}&nbsp;·&nbsp;${weightStr}</div>
    `;

    const athleteCm = athlete.height || 170;
    const normalizedHeight = athleteCm / 170;
    const estimatedBodyHeight = 11.2 * normalizedHeight;
    const labelWorldY = pos.podiumHeight + estimatedBodyHeight + 5.2;

    const v = new THREE.Vector3(pos.x, labelWorldY, 0);
    v.project(camera);

    const sx = ((v.x + 1) / 2) * canvasW;
    const sy = (1 - (v.y + 1) / 2) * canvasH;

    div.style.left = `${sx}px`;
    div.style.top = `${Math.max(8, sy)}px`;
    div.style.transform = "translateX(-50%) translateY(-100%)";
    div.style.width = "230px";

    container.appendChild(div);
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

  function showLoading(root) {
    root.classList.add("is-loading");
    const div = document.createElement("div");
    div.className = "viz-loading";
    div.textContent = "Loading data, please wait…";
    root.appendChild(div);
  }

  function removeLoading(root) {
    root.classList.remove("is-loading");
    root.querySelectorAll(".viz-loading").forEach(el => el.remove());
  }

  function showError(message) {
    const mount = document.querySelector(selectors.podium);
    if (!mount) return;

    mount.innerHTML = `<div class="gender-error">${message}</div>`;
  }
})();