/* ============================================================
   Medal Distribution Sankey Visualization
   ------------------------------------------------------------
   Shows:
   source: Continent or Country
   middle: Gold / Silver / Bronze
   target: Top 10 sports/disciplines

   Uses real data from data/olympics.csv
   Stops animation at 2016
   ============================================================ */

(function () {
  "use strict";

  const DATA_PATH = "data/olympics.csv";
  const STOP_YEAR = 2016;

  const selectors = {
    root: "#medal-viz",
    sankey: "#medal-sankey",
    seasonSelect: "#medal-season-select",
    modeSelect: "#medal-mode-select",
    yearSlider: "#medal-year",
    currentYear: "#medal-current-year",
    play: "#medal-play"
  };

  const state = {
    rows: [],
    columns: {},
    currentSeason: "Summer",
    currentMode: "continent",
    currentYear: null,
    availableYears: [],
    playing: false,
    timer: null
  };

  const medalOrder = ["Gold", "Silver", "Bronze"];

  const medalColors = {
    Gold: "#f4c542",
    Silver: "#cfcfcf",
    Bronze: "#cd7f32"
  };

  const continentOrder = [
    "Europe",
    "Americas",
    "Africa",
    "Asia",
    "Oceania",
    "Other"
  ];

  const continentColors = {
    Europe: "#a88ad6",
    Americas: "#8ecae6",
    Africa: "#91d18b",
    Asia: "#f4b183",
    Oceania: "#f4a6c6",
    Other: "#c9c9c9"
  };

  const countryToContinent = {
    AFG: "Asia",
    AHO: "Americas",
    ALB: "Europe",
    ALG: "Africa",
    AND: "Europe",
    ANG: "Africa",
    ANT: "Americas",
    ANZ: "Oceania",
    ARG: "Americas",
    ARM: "Europe",
    ARU: "Americas",
    ASA: "Oceania",
    AUS: "Oceania",
    AUT: "Europe",
    AZE: "Europe",
    BAH: "Americas",
    BAN: "Asia",
    BAR: "Americas",
    BDI: "Africa",
    BEL: "Europe",
    BEN: "Africa",
    BER: "Americas",
    BHU: "Asia",
    BIH: "Europe",
    BIZ: "Americas",
    BLR: "Europe",
    BOH: "Europe",
    BOL: "Americas",
    BOT: "Africa",
    BRA: "Americas",
    BRN: "Asia",
    BRU: "Asia",
    BUL: "Europe",
    BUR: "Africa",
    CAF: "Africa",
    CAM: "Asia",
    CAN: "Americas",
    CAY: "Americas",
    CGO: "Africa",
    CHA: "Africa",
    CHI: "Americas",
    CHN: "Asia",
    CIV: "Africa",
    CMR: "Africa",
    COD: "Africa",
    COK: "Oceania",
    COL: "Americas",
    COM: "Africa",
    CPV: "Africa",
    CRC: "Americas",
    CRO: "Europe",
    CUB: "Americas",
    CYP: "Europe",
    CZE: "Europe",
    DEN: "Europe",
    DJI: "Africa",
    DMA: "Americas",
    DOM: "Americas",
    ECU: "Americas",
    EGY: "Africa",
    ERI: "Africa",
    ESA: "Americas",
    ESP: "Europe",
    EST: "Europe",
    ETH: "Africa",
    EUN: "Europe",
    FIJ: "Oceania",
    FIN: "Europe",
    FRA: "Europe",
    FRG: "Europe",
    FSM: "Oceania",
    GAB: "Africa",
    GAM: "Africa",
    GBR: "Europe",
    GBS: "Africa",
    GDR: "Europe",
    GEO: "Europe",
    GEQ: "Africa",
    GER: "Europe",
    GHA: "Africa",
    GRE: "Europe",
    GRN: "Americas",
    GUA: "Americas",
    GUI: "Africa",
    GUM: "Oceania",
    GUY: "Americas",
    HAI: "Americas",
    HKG: "Asia",
    HON: "Americas",
    HUN: "Europe",
    INA: "Asia",
    IND: "Asia",
    IOA: "Other",
    IRI: "Asia",
    IRL: "Europe",
    IRQ: "Asia",
    ISL: "Europe",
    ISR: "Asia",
    ISV: "Americas",
    ITA: "Europe",
    IVB: "Americas",
    JAM: "Americas",
    JOR: "Asia",
    JPN: "Asia",
    KAZ: "Asia",
    KEN: "Africa",
    KGZ: "Asia",
    KIR: "Oceania",
    KOR: "Asia",
    KOS: "Europe",
    KSA: "Asia",
    KUW: "Asia",
    LAO: "Asia",
    LAT: "Europe",
    LBA: "Africa",
    LBR: "Africa",
    LCA: "Americas",
    LES: "Africa",
    LIB: "Asia",
    LIE: "Europe",
    LTU: "Europe",
    LUX: "Europe",
    MAD: "Africa",
    MAR: "Africa",
    MAS: "Asia",
    MAW: "Africa",
    MDA: "Europe",
    MDV: "Asia",
    MEX: "Americas",
    MGL: "Asia",
    MHL: "Oceania",
    MKD: "Europe",
    MLI: "Africa",
    MLT: "Europe",
    MNE: "Europe",
    MON: "Europe",
    MOZ: "Africa",
    MRI: "Africa",
    MTN: "Africa",
    MYA: "Asia",
    NAM: "Africa",
    NCA: "Americas",
    NED: "Europe",
    NEP: "Asia",
    NFL: "Americas",
    NGR: "Africa",
    NIG: "Africa",
    NOR: "Europe",
    NRU: "Oceania",
    NZL: "Oceania",
    OMA: "Asia",
    PAK: "Asia",
    PAN: "Americas",
    PAR: "Americas",
    PER: "Americas",
    PHI: "Asia",
    PLE: "Asia",
    PLW: "Oceania",
    PNG: "Oceania",
    POL: "Europe",
    POR: "Europe",
    PRK: "Asia",
    PUR: "Americas",
    QAT: "Asia",
    RHO: "Africa",
    ROT: "Other",
    ROU: "Europe",
    RSA: "Africa",
    RUS: "Europe",
    RWA: "Africa",
    SAA: "Europe",
    SAM: "Oceania",
    SCG: "Europe",
    SEN: "Africa",
    SEY: "Africa",
    SGP: "Asia",
    SKN: "Americas",
    SLE: "Africa",
    SLO: "Europe",
    SMR: "Europe",
    SOL: "Oceania",
    SOM: "Africa",
    SRB: "Europe",
    SRI: "Asia",
    SSD: "Africa",
    STP: "Africa",
    SUD: "Africa",
    SUI: "Europe",
    SUR: "Americas",
    SVK: "Europe",
    SWE: "Europe",
    SWZ: "Africa",
    SYR: "Asia",
    TAN: "Africa",
    TCH: "Europe",
    TGA: "Oceania",
    THA: "Asia",
    TJK: "Asia",
    TKM: "Asia",
    TLS: "Asia",
    TOG: "Africa",
    TPE: "Asia",
    TTO: "Americas",
    TUN: "Africa",
    TUR: "Europe",
    TUV: "Oceania",
    UAE: "Asia",
    UAR: "Africa",
    UGA: "Africa",
    UKR: "Europe",
    URS: "Europe",
    URU: "Americas",
    USA: "Americas",
    UZB: "Asia",
    VAN: "Oceania",
    VEN: "Americas",
    VIE: "Asia",
    VIN: "Americas",
    WIF: "Americas",
    YAR: "Asia",
    YEM: "Asia",
    YMD: "Asia",
    YUG: "Europe",
    ZAM: "Africa",
    ZIM: "Africa"
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!document.querySelector(selectors.root)) return;

    if (typeof d3 === "undefined") {
      showError("D3 is not loaded.");
      return;
    }

    if (typeof d3.sankey === "undefined") {
      showError("d3-sankey is not loaded. Add the d3-sankey script before delegations.js.");
      return;
    }

    try {
      const rows = await d3.csv(DATA_PATH, d3.autoType);

      state.rows = rows;
      state.columns = detectColumns(rows);

      setupControls();
      setSeason("Summer");
    } catch (error) {
      console.error(error);
      showError(`Could not load ${DATA_PATH}.`);
    }
  }

  function detectColumns(rows) {
    if (!rows || rows.length === 0) {
      throw new Error("CSV file is empty.");
    }

    const columns = Object.keys(rows[0]);

    return {
      year: findColumn(columns, ["Year", "year"]),
      season: findColumn(columns, ["Season", "season"]),
      noc: findColumn(columns, ["NOC", "noc"]),
      team: findColumn(columns, ["Team", "team", "Country", "country"]),
      sport: findColumn(columns, ["Sport", "sport"]),
      event: findColumn(columns, ["Event", "event", "Discipline", "discipline"]),
      medal: findColumn(columns, ["Medal", "medal"])
    };
  }

  function findColumn(columns, candidates) {
    return candidates.find(candidate => columns.includes(candidate)) || null;
  }

  function setupControls() {
    d3.select(selectors.seasonSelect).on("change", function () {
      setSeason(this.value);
    });

    d3.select(selectors.modeSelect).on("change", function () {
      state.currentMode = this.value;
      update();
    });

    d3.select(selectors.yearSlider).on("input", function () {
      stopPlaying();

      const index = Number(this.value);
      const year = state.availableYears[index];

      if (year !== undefined) {
        state.currentYear = year;
        update();
      }
    });

    d3.select(selectors.play).on("click", togglePlay);
  }

  function setSeason(season) {
    stopPlaying();

    state.currentSeason = season;
    d3.select(selectors.seasonSelect).property("value", season);

    state.availableYears = getAvailableYears(season);

    state.currentYear = state.availableYears.includes(1896)
      ? 1896
      : state.availableYears[0];

    updateSliderLimits();
    update();
  }

  function getAvailableYears(season) {
    const { year: yearCol, season: seasonCol } = state.columns;

    return Array.from(
      new Set(
        state.rows
          .filter(row => String(row[seasonCol] || "").trim() === season)
          .map(row => Number(row[yearCol]))
          .filter(year => Number.isFinite(year) && year <= STOP_YEAR)
      )
    ).sort((a, b) => a - b);
  }

  function updateSliderLimits() {
    d3.select(selectors.yearSlider)
      .attr("min", 0)
      .attr("max", Math.max(0, state.availableYears.length - 1))
      .attr("step", 1)
      .property("value", state.availableYears.indexOf(state.currentYear));
  }

  function togglePlay() {
    if (state.playing) {
      stopPlaying();
    } else {
      startPlaying();
    }
  }

  function startPlaying() {
    stopPlaying();

    const currentIndex = state.availableYears.indexOf(state.currentYear);
    const lastIndex = state.availableYears.length - 1;

    if (currentIndex >= lastIndex) {
      state.currentYear = state.availableYears[lastIndex];
      d3.select(selectors.yearSlider).property("value", lastIndex);
      update();
      stopPlaying();
      return;
    }

    state.playing = true;
    d3.select(selectors.play).text("Ⅱ");

    playNextYear();
  }

  function playNextYear() {
    if (!state.playing) return;

    const currentIndex = state.availableYears.indexOf(state.currentYear);
    const lastIndex = state.availableYears.length - 1;

    if (currentIndex >= lastIndex) {
      state.currentYear = state.availableYears[lastIndex];
      d3.select(selectors.yearSlider).property("value", lastIndex);
      update();
      stopPlaying();
      return;
    }

    const nextIndex = currentIndex + 1;

    state.currentYear = state.availableYears[nextIndex];
    d3.select(selectors.yearSlider).property("value", nextIndex);
    update();

    if (nextIndex >= lastIndex || state.currentYear >= STOP_YEAR) {
      state.currentYear = state.availableYears[lastIndex];
      d3.select(selectors.yearSlider).property("value", lastIndex);
      update();
      stopPlaying();
      return;
    }

    state.timer = setTimeout(playNextYear, 1300);
  }

  function stopPlaying() {
    state.playing = false;

    if (state.timer !== null) {
      clearTimeout(state.timer);
      state.timer = null;
    }

    d3.select(selectors.play).text("▶");
  }

  function update() {
    if (!state.currentYear) return;

    d3.select(selectors.currentYear).text(state.currentYear);

    const sankeyData = buildSankeyData({
      year: state.currentYear,
      season: state.currentSeason,
      mode: state.currentMode
    });

    drawSankey(sankeyData);
  }

  /* ============================================================
     Data processing
     ============================================================ */

  function buildSankeyData({ year, season, mode }) {
    const {
      year: yearCol,
      season: seasonCol,
      noc: nocCol,
      team: teamCol,
      sport: sportCol,
      event: eventCol,
      medal: medalCol
    } = state.columns;

    const rows = state.rows.filter(row => {
      const rowYear = Number(row[yearCol]);
      const rowSeason = String(row[seasonCol] || "").trim();
      const medal = normalizeMedal(row[medalCol]);

      return rowYear === year && rowSeason === season && medalOrder.includes(medal);
    });

    const medalUnits = new Map();

    rows.forEach(row => {
      const medal = normalizeMedal(row[medalCol]);
      const sport = cleanLabel(row[sportCol]);
      const event = eventCol ? cleanLabel(row[eventCol]) : sport;
      const discipline = cleanDiscipline(event, sport);

      const noc = nocCol ? cleanLabel(row[nocCol]) : "";
      const team = teamCol ? cleanLabel(row[teamCol]) : noc;

      const source = mode === "continent"
        ? getContinent(noc)
        : cleanCountryName(team || noc);

      const uniqueMedalKey = [
        year,
        season,
        source,
        sport,
        discipline,
        medal,
        team || noc
      ].join("|||");

      if (!medalUnits.has(uniqueMedalKey)) {
        medalUnits.set(uniqueMedalKey, {
          source,
          sport,
          discipline,
          medal,
          value: 1
        });
      }
    });

    const medalRows = Array.from(medalUnits.values());

    const topSports = getTopSports(medalRows, 10);
    const filteredRows = medalRows.filter(d => topSports.has(d.sport));

    const sourceToMedal = d3.rollups(
      filteredRows,
      values => d3.sum(values, d => d.value),
      d => d.source,
      d => d.medal
    );

    const medalToSport = d3.rollups(
      filteredRows,
      values => d3.sum(values, d => d.value),
      d => d.medal,
      d => d.sport
    );

    const sourceNames = new Set();
    const medalNames = new Set();
    const sportNames = new Set();

    filteredRows.forEach(row => {
      sourceNames.add(row.source);
      medalNames.add(row.medal);
      sportNames.add(row.sport);
    });

    const orderedSources = mode === "continent"
      ? continentOrder.filter(source => sourceNames.has(source))
      : Array.from(sourceNames).sort(d3.ascending);

    const orderedMedals = medalOrder.filter(medal => medalNames.has(medal));
    const orderedSports = Array.from(sportNames).sort(d3.ascending);

    const nodes = [
      ...orderedSources.map(name => ({ name, type: "source" })),
      ...orderedMedals.map(name => ({ name, type: "medal" })),
      ...orderedSports.map(name => ({ name, type: "sport" }))
    ];

    const nodeIndex = new Map(nodes.map((d, i) => [d.name, i]));
    const links = [];

    sourceToMedal.forEach(([source, medals]) => {
      medals.forEach(([medal, value]) => {
        if (!nodeIndex.has(source) || !nodeIndex.has(medal)) return;

        links.push({
          source: nodeIndex.get(source),
          target: nodeIndex.get(medal),
          value,
          kind: "source-medal",
          label: `${source} → ${medal}: ${value} medals`
        });
      });
    });

    medalToSport.forEach(([medal, sports]) => {
      sports.forEach(([sport, value]) => {
        if (!nodeIndex.has(medal) || !nodeIndex.has(sport)) return;

        links.push({
          source: nodeIndex.get(medal),
          target: nodeIndex.get(sport),
          value,
          kind: "medal-sport",
          label: `${medal} → ${sport}: ${value} medals`
        });
      });
    });

    return {
      nodes,
      links,
      year,
      season,
      mode,
      medalCount: d3.sum(filteredRows, d => d.value)
    };
  }

  function getTopSports(rows, limit) {
    const counts = d3.rollups(
      rows,
      values => d3.sum(values, d => d.value),
      d => d.sport
    );

    return new Set(
      counts
        .sort((a, b) => d3.descending(a[1], b[1]))
        .slice(0, limit)
        .map(([sport]) => sport)
    );
  }

  function normalizeMedal(value) {
    const text = String(value || "").trim();

    if (/gold/i.test(text)) return "Gold";
    if (/silver/i.test(text)) return "Silver";
    if (/bronze/i.test(text)) return "Bronze";

    return "";
  }

  function cleanLabel(value) {
    return String(value || "").trim();
  }

  function cleanCountryName(value) {
    return String(value || "")
      .replace(/\s*-\s*\d+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanDiscipline(event, sport) {
    let text = String(event || "").trim();
    const sportText = String(sport || "").trim();

    text = text
      .replace(/\bWomen's\b/gi, "")
      .replace(/\bWomens\b/gi, "")
      .replace(/\bMen's\b/gi, "")
      .replace(/\bMens\b/gi, "")
      .replace(/\bWomen\b/gi, "")
      .replace(/\bMen\b/gi, "")
      .replace(/\bMixed\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (sportText) {
      const escapedSport = escapeRegExp(sportText);
      text = text.replace(new RegExp("^" + escapedSport + "\\s+", "i"), "").trim();
    }

    return text || sportText || event;
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function getContinent(noc) {
    return countryToContinent[String(noc || "").trim()] || "Other";
  }

  /* ============================================================
     Drawing
     ============================================================ */

  function drawSankey(graph) {
    const root = d3.select(selectors.sankey);
    root.selectAll("*").remove();

    const width = 1280;
    const height = 650;
    const margin = { top: 70, right: 40, bottom: 30, left: 40 };

    const svg = root
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "medal-sankey-svg");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 32)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-family", "Arial, sans-serif")
      .attr("font-size", 24)
      .attr("font-weight", 700)
      .text(`Distribution of medals in ${graph.season} Olympics, ${graph.year}`);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 58)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.75)")
      .attr("font-family", "Arial, sans-serif")
      .attr("font-size", 14)
      .text(`Flows show ${graph.mode}s → medal type → top 10 sports · ${graph.medalCount} medals shown`);

    if (!graph.links.length) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-family", "Arial, sans-serif")
        .attr("font-size", 22)
        .text("No medal data available for this year.");

      return;
    }

    const sankey = d3.sankey()
      .nodeWidth(18)
      .nodePadding(12)
      .nodeAlign(d3.sankeyJustify)
      .nodeSort((a, b) => nodeSort(a, b, graph.mode))
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom]
      ]);

    const sankeyGraph = sankey({
      nodes: graph.nodes.map(d => ({ ...d })),
      links: graph.links.map(d => ({ ...d }))
    });

    const tooltip = getTooltip();

    svg.append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(sankeyGraph.links)
      .join("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke", d => colorForNode(d.source))
      .attr("stroke-opacity", 0.35)
      .attr("stroke-width", d => Math.max(1, d.width))
      .on("mousemove", function (event, d) {
        d3.select(this).attr("stroke-opacity", 0.75);

        tooltip
          .html(`<strong>${d.label}</strong>`)
          .style("left", `${event.pageX + 14}px`)
          .style("top", `${event.pageY + 14}px`)
          .style("opacity", 1);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-opacity", 0.35);
        tooltip.style("opacity", 0);
      });

    const node = svg.append("g")
      .selectAll("g")
      .data(sankeyGraph.nodes)
      .join("g");

    node.append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("height", d => Math.max(1, d.y1 - d.y0))
      .attr("width", d => d.x1 - d.x0)
      .attr("rx", 4)
      .attr("fill", d => colorForNode(d))
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .on("mousemove", function (event, d) {
        d3.select(this).attr("stroke-width", 2.5);

        tooltip
          .html(`<strong>${d.name}</strong><br>${Math.round(d.value)} medals`)
          .style("left", `${event.pageX + 14}px`)
          .style("top", `${event.pageY + 14}px`)
          .style("opacity", 1);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("stroke-width", 1);
        tooltip.style("opacity", 0);
      });

    node.append("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .attr("fill", "white")
      .attr("font-family", "Arial, sans-serif")
      .attr("font-size", 13)
      .attr("font-weight", d => d.type === "medal" ? 800 : 600)
      .text(d => shortenLabel(d.name, 22));
  }

  function nodeSort(a, b, mode) {
    const rankA = nodeRank(a, mode);
    const rankB = nodeRank(b, mode);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return d3.ascending(a.name, b.name);
  }

  function nodeRank(node, mode) {
    if (node.type === "source") {
      if (mode === "continent") {
        const index = continentOrder.indexOf(node.name);
        return index === -1 ? 999 : index;
      }

      return 100;
    }

    if (node.type === "medal") {
      const index = medalOrder.indexOf(node.name);
      return index === -1 ? 999 : index;
    }

    if (node.type === "sport") {
      return 500;
    }

    return 999;
  }

  function colorForNode(node) {
    if (node.type === "medal") {
      return medalColors[node.name] || "#ffffff";
    }

    if (node.type === "source") {
      return continentColors[node.name] || stringToColor(node.name);
    }

    return stringToColor(node.name);
  }

  function stringToColor(value) {
    const scale = d3.scaleOrdinal(d3.schemeTableau10);
    return scale(String(value || "Other"));
  }

  function shortenLabel(text, maxLength) {
    if (!text) return "";
    return text.length <= maxLength ? text : text.slice(0, maxLength - 1) + "…";
  }

  function getTooltip() {
    let tooltip = d3.select("body").select(".medal-tooltip");

    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "medal-tooltip")
        .style("opacity", 0);
    }

    return tooltip;
  }

  function showError(message) {
    d3.select(selectors.root)
      .selectAll("*")
      .remove();

    d3.select(selectors.root)
      .append("div")
      .attr("class", "gender-error")
      .text(message);
  }
})();