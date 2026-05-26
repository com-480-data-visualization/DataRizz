/* ============================================================
   Gender Evolution Visualization
   ============================================================
   Uses real data from data/olympics.csv
   Stops animation at 2016
   ============================================================ */

(function () {
  "use strict";

  const DATA_PATH = "data/gender_evolution.json";
  const STOP_YEAR = 2016;

  const selectors = {
    root: "#gender-viz",
    pie: "#gender-pie",
    men: "#gender-men",
    women: "#gender-women",
    play: "#gender-play",
    year: "#gender-year",
    currentYear: "#gender-current-year",
    summer: "#season-summer",
    winter: "#season-winter"
  };

  const genderConfig = {
    men: {
      label: "Men",
      acceptedValues: ["M", "Men", "Male", "man", "men", "male"],
      centerColor: "#b9d8fb"
    },
    women: {
      label: "Women",
      acceptedValues: ["F", "Women", "Female", "woman", "women", "female"],
      centerColor: "#efc3cb"
    }
  };

  const sportColorPalette = [
    "#a88ad6",
    "#f1d55b",
    "#91d18b",
    "#f4b183",
    "#9dc3e6",
    "#f4a6c6",
    "#c9c9c9",
    "#b4d6a3",
    "#ffd9a8",
    "#c7b3e6",
    "#b8e0d2",
    "#f6c1a6",
    "#d7c6f5",
    "#d2e7a2",
    "#a9d5ff",
    "#ffd6a5",
    "#caffbf",
    "#fdffb6",
    "#bdb2ff",
    "#ffadad",
    "#9bf6ff",
    "#ffc6ff",
    "#e0bbff",
    "#ffffb5",
    "#b5ead7",
    "#ffdac1",
    "#d0f4de",
    "#fcf6bd",
    "#a9def9",
    "#e4c1f9",
    "#ff99c8",
    "#cdb4db",
    "#bde0fe",
    "#ffc8dd",
    "#ffafcc",
    "#b8f2e6"
  ];

  const state = {
    dataBySeasonYear: new Map(),
    sportColorScale: null,
    currentSeason: "Summer",
    currentYear: null,
    availableYears: [],
    playing: false,
    timer: null
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const root = document.querySelector(selectors.root);
    if (!root) return;
    if (typeof d3 === "undefined") { showError("D3 is not loaded."); return; }

    try {
      const raw = await d3.json(DATA_PATH);

      // Rebuild the same Map structure the rest of the code expects
      state.dataBySeasonYear = new Map(
        Object.entries(raw).map(([season, years]) => [
          season,
          new Map(
            Object.entries(years).map(([year, yd]) => [
              year,
              {
                totals: yd.totals,
                men: new Map(
                  Object.entries(yd.sports).map(([sport, sd]) => [
                    sport,
                    new Map(Object.entries(sd.disciplines).map(([disc, counts]) => [disc, counts.men]))
                  ])
                ),
                women: new Map(
                  Object.entries(yd.sports).map(([sport, sd]) => [
                    sport,
                    new Map(Object.entries(sd.disciplines).map(([disc, counts]) => [disc, counts.women]))
                  ])
                ),
                compareSport: new Map(
                  Object.entries(yd.sports).map(([sport, sd]) => [
                    sport, { men: sd.men, women: sd.women }
                  ])
                ),
                compareEvent: new Map(
                  Object.entries(yd.sports).flatMap(([sport, sd]) =>
                    Object.entries(sd.disciplines).map(([disc, counts]) => [
                      `${sport}|||${disc}`, counts
                    ])
                  )
                )
              }
            ])
          )
        ])
      );

      state.sportColorScale = buildGlobalSportColorScale(state.dataBySeasonYear);
      setupControls();
      setSeason("Summer");
    } catch (error) {
      console.error(error);
      showError("Could not load gender data.");
    }
  }

  /* ============================================================
     Data preparation
     ============================================================ */

  function incrementCompare(map, key, genderKey) {
    if (!map.has(key)) {
      map.set(key, { men: 0, women: 0 });
    }

    map.get(key)[genderKey] += 1;
  }

  function findColumn(columns, candidates) {
    return candidates.find(candidate => columns.includes(candidate)) || null;
  }

  function normalizeGender(value) {
    const text = String(value || "").trim();

    if (genderConfig.men.acceptedValues.includes(text)) return "M";
    if (genderConfig.women.acceptedValues.includes(text)) return "F";

    return null;
  }

  function cleanLabel(value) {
    return String(value || "").trim();
  }

  function normalizeDisciplineName(value, sport) {
    let text = String(value || "").trim();
    const sportText = String(sport || "").trim();

    text = text
      .replace(/\bWomen's\b/gi, "")
      .replace(/\bWomens\b/gi, "")
      .replace(/\bMen's\b/gi, "")
      .replace(/\bMens\b/gi, "")
      .replace(/\bWomen\b/gi, "")
      .replace(/\bMen\b/gi, "")
      .replace(/\bFemale\b/gi, "")
      .replace(/\bMale\b/gi, "")
      .replace(/\bMixed\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (sportText) {
      const escapedSport = escapeRegExp(sportText);
      const sportAtStart = new RegExp("^" + escapedSport + "\\s+", "i");
      text = text.replace(sportAtStart, "").trim();

      const duplicatedSport = new RegExp("^" + escapedSport + "\\s+" + escapedSport + "$", "i");
      text = text.replace(duplicatedSport, sportText).trim();
    }

    text = text
      .replace(/\s*,\s*/g, ", ")
      .replace(/\s+-\s+/g, " - ")
      .replace(/^[-,:\s]+/, "")
      .replace(/[-,:\s]+$/, "")
      .replace(/\s+/g, " ")
      .trim();

    return text || sportText || String(value || "").trim();
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function mapToHierarchy(map, rootName) {
    const children = Array.from(map.entries())
      .map(([sport, events]) => ({
        name: sport,
        children: Array.from(events.entries())
          .map(([event, value]) => ({
            name: event,
            value
          }))
          .filter(d => d.value > 0)
          .sort((a, b) => d3.descending(a.value, b.value))
      }))
      .filter(d => d.children.length > 0)
      .sort((a, b) =>
        d3.descending(
          d3.sum(a.children, child => child.value),
          d3.sum(b.children, child => child.value)
        )
      );

    return {
      name: rootName,
      children
    };
  }

  function buildGlobalSportColorScale(grouped) {
    const allSports = new Set();

    grouped.forEach(seasonData => {
      seasonData.forEach(yearData => {
        yearData.men.forEach((_, sport) => allSports.add(sport));
        yearData.women.forEach((_, sport) => allSports.add(sport));
      });
    });

    return d3.scaleOrdinal()
      .domain(Array.from(allSports).sort())
      .range(sportColorPalette);
  }

  /* ============================================================
     Controls
     ============================================================ */

  function setupControls() {
    d3.select(selectors.summer).on("click", () => setSeason("Summer"));
    d3.select(selectors.winter).on("click", () => setSeason("Winter"));

    d3.select(selectors.year).on("input", function () {
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

    const seasonData = state.dataBySeasonYear.get(season);

    if (!seasonData || seasonData.size === 0) {
      showError(`No ${season} data found.`);
      return;
    }

    state.currentSeason = season;

    state.availableYears = Array.from(seasonData.keys())
      .map(Number)
      .sort((a, b) => a - b)
      .filter(year => year <= STOP_YEAR);

    const previousYear = state.currentYear;
    if (previousYear && state.availableYears.includes(previousYear)) {
      state.currentYear = previousYear;
    } else if (previousYear) {
      state.currentYear = state.availableYears.reduce((closest, y) =>
        Math.abs(y - previousYear) < Math.abs(closest - previousYear) ? y : closest
      );
    } else {
      state.currentYear = state.availableYears[0];
    }

    updateSeasonButtons();
    updateSliderLimits();
    update();
  }

  function updateSeasonButtons() {
    d3.select(selectors.summer).classed("active", state.currentSeason === "Summer");
    d3.select(selectors.winter).classed("active", state.currentSeason === "Winter");
  }

  function updateSliderLimits() {
    d3.select(selectors.year)
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
    state.playing = true;
    d3.select(selectors.play).text("II");

    state.timer = setInterval(() => {
      const currentIndex = state.availableYears.indexOf(state.currentYear);
      const lastIndex = state.availableYears.length - 1;

      if (currentIndex >= lastIndex) {
        state.currentYear = state.availableYears[lastIndex];
        d3.select(selectors.year).property("value", lastIndex);
        update();
        stopPlaying();
        return;
      }

      const nextIndex = currentIndex + 1;
      state.currentYear = state.availableYears[nextIndex];

      d3.select(selectors.year).property("value", nextIndex);
      update();
    }, 1400);
  }

  function stopPlaying() {
    state.playing = false;

    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }

    d3.select(selectors.play).text("▶");
  }

  /* ============================================================
     Main update
     ============================================================ */

  function getCurrentYearData() {
    const seasonData = state.dataBySeasonYear.get(state.currentSeason);
    if (!seasonData) return null;

    return seasonData.get(String(state.currentYear)) || null;
  }

  function update() {
    const yearData = getCurrentYearData();

    if (!yearData) {
      showError(`No data for ${state.currentSeason} ${state.currentYear}.`);
      return;
    }

    d3.select(selectors.currentYear).text(state.currentYear);

    drawPieChart(yearData.totals);

    drawSunburst({
      selector: selectors.men,
      title: "Men",
      data: mapToHierarchy(yearData.men, "Men"),
      genderKey: "men",
      compareSport: yearData.compareSport,
      compareEvent: yearData.compareEvent,
      colorScale: state.sportColorScale
    });

    drawSunburst({
      selector: selectors.women,
      title: "Women",
      data: mapToHierarchy(yearData.women, "Women"),
      genderKey: "women",
      compareSport: yearData.compareSport,
      compareEvent: yearData.compareEvent,
      colorScale: state.sportColorScale
    });

    if (window.fullpage_api && typeof window.fullpage_api.reBuild === "function") {
      window.fullpage_api.reBuild();
    }
  }

  /* ============================================================
     Pie chart
     ============================================================ */

  function drawPieChart(totals) {
    const container = d3.select(selectors.pie);
    container.selectAll("*").remove();

    const width = 290;
    const height = 195;
    const radius = 78;

    const total = totals.men + totals.women;

    const menPct = total ? Math.round((totals.men / total) * 100) : 0;
    const womenPct = total ? Math.round((totals.women / total) * 100) : 0;

    const pieData = [
      {
        key: "women",
        value: totals.women,
        percent: womenPct
      },
      {
        key: "men",
        value: totals.men,
        percent: menPct
      }
    ];

    const svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    const chartGroup = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    chartGroup
      .selectAll("path")
      .data(pie(pieData))
      .join("path")
      .attr("d", arc)
      .attr("fill", d => genderConfig[d.data.key].centerColor)
      .attr("stroke", "#111")
      .attr("stroke-width", 2.5);

    chartGroup
      .selectAll("text")
      .data(pie(pieData))
      .join("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-family", "'Elms Sans', sans-serif")
      .attr("font-size", 15)
      .attr("font-weight", 700)
      .attr("fill", "#111")
      .text(d => `${d.data.percent}%`);

    const legend = container.append("div").attr("class", "gender-pie-legend");

    [
      { key: "women", label: "Women" },
      { key: "men",   label: "Men"   }
    ].forEach(({ key, label }) => {
      const item = legend.append("div").attr("class", "gender-pie-legend-item");
      item.append("span")
        .attr("class", "gender-pie-legend-swatch")
        .style("background-color", genderConfig[key].centerColor);
      item.append("span").text(label);
    });
  }

  /* ============================================================
     Sunburst
     ============================================================ */

  function drawSunburst({
    selector,
    title,
    data,
    genderKey,
    compareSport,
    compareEvent,
    colorScale
  }) {
    const container = d3.select(selector);
    container.selectAll("*").remove();

    const wrapper = container
      .append("div")
      .attr("class", "gender-chart");

    const width = 460;
    const height = 460;

    const innerHole = 45;
    const sportRingThickness = 82;
    const disciplineRingThickness = 118;

    const root = d3.hierarchy(data)
      .sum(d => d.value || 0)
      .sort((a, b) => b.value - a.value);

    if (!root.value) {
      wrapper
        .append("div")
        .attr("class", "gender-empty")
        .text(`No ${title.toLowerCase()} data`);
      return;
    }

    d3.partition()
      .size([2 * Math.PI, 1])(root);

    const svg = wrapper
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
      .attr("class", "gender-sunburst-svg");

    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.006))
      .padRadius(innerHole)
      .innerRadius(d => {
        if (d.depth === 1) return innerHole;
        if (d.depth === 2) return innerHole + sportRingThickness;
        return innerHole;
      })
      .outerRadius(d => {
        if (d.depth === 1) return innerHole + sportRingThickness - 2;
        if (d.depth === 2) return innerHole + sportRingThickness + disciplineRingThickness - 2;
        return innerHole;
      });

    const nodes = root.descendants().filter(d => d.depth > 0);

    svg
      .append("circle")
      .attr("r", innerHole - 4)
      .attr("fill", genderConfig[genderKey].centerColor)
      .attr("stroke", "white")
      .attr("stroke-width", 2.5);

    svg
      .append("g")
      .selectAll("path")
      .data(nodes)
      .join("path")
      .attr("d", arc)
      .attr("fill", d => {
        const top = getTopAncestor(d);
        const baseColor = colorScale(top.data.name);
        const percentage = getGenderPercentageForNode(d, genderKey, compareSport, compareEvent);
        return shadeByPercentage(baseColor, percentage);
      })
      .attr("stroke", "#050505")
      .attr("stroke-width", 1)
      .on("mousemove", function (event, d) {
        showTooltip(event, buildTooltip(d, compareSport, compareEvent));
        d3.select(this).attr("stroke", "white").attr("stroke-width", 1.8);
      })
      .on("mouseleave", function () {
        hideTooltip();
        d3.select(this).attr("stroke", "#050505").attr("stroke-width", 1);
      });

    const labelGroup = svg
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle");

    const labels = labelGroup
      .selectAll("text")
      .data(nodes.filter(labelVisible))
      .join("text")
      .attr("transform", d =>
        labelTransform(d, innerHole, sportRingThickness, disciplineRingThickness)
      )
      .attr("font-family", "'Elms Sans', sans-serif")
      .attr("font-size", d => d.depth === 1 ? 11 : 9)
      .attr("font-weight", d => d.depth === 1 ? 700 : 400)
      .attr("fill", "#111");

    labels.each(function (d) {
      const textEl = d3.select(this);
      const lines = splitLabelIntoLines(
        d.data.name,
        d.depth === 1 ? 11 : 13,
        2
      );

      const lineHeight = d.depth === 1 ? 0.95 : 0.85;
      const startDy = lines.length === 1 ? "0.35em" : "-0.15em";

      lines.forEach((line, i) => {
        textEl
          .append("tspan")
          .attr("x", 0)
          .attr("dy", i === 0 ? startDy : `${lineHeight}em`)
          .text(line);
      });
    });

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-family", "'Elms Sans', sans-serif")
      .attr("font-size", 17)
      .attr("font-weight", 700)
      .attr("fill", "#111")
      .text(title);
  }

  function getGenderPercentageForNode(d, genderKey, compareSport, compareEvent) {
    let counts = { men: 0, women: 0 };

    if (d.depth === 1) {
      counts = compareSport.get(d.data.name) || counts;
    } else if (d.depth === 2) {
      const key = `${d.parent.data.name}|||${d.data.name}`;
      counts = compareEvent.get(key) || counts;
    }

    const total = counts.men + counts.women;
    if (!total) return 0;

    return counts[genderKey] / total;
  }

  function shadeByPercentage(baseColor, percentage) {
    const color = d3.hsl(baseColor);

    // Low percentage = lighter, high percentage = darker.
    color.l = 0.9 - percentage * 0.45;
    color.s = Math.min(0.95, color.s + percentage * 0.25);

    return color.formatHex();
  }

  function getTopAncestor(d) {
    let node = d;

    while (node.depth > 1) {
      node = node.parent;
    }

    return node;
  }

  function labelVisible(d) {
    const angle = d.x1 - d.x0;

    if (d.depth === 1) {
      return angle > 0.22;
    }

    if (d.depth === 2) {
      return angle > 0.08;
    }

    return false;
  }

  function labelTransform(d, innerHole, sportRingThickness, disciplineRingThickness) {
    const x = ((d.x0 + d.x1) / 2) * 180 / Math.PI;

    let y;
    if (d.depth === 1) {
      y = innerHole + sportRingThickness / 2;
    } else if (d.depth === 2) {
      y = innerHole + sportRingThickness + disciplineRingThickness / 2;
    } else {
      y = innerHole;
    }

    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  function splitLabelIntoLines(text, maxCharsPerLine, maxLines) {
    if (!text) return [""];

    const cleaned = String(text).trim();
    if (cleaned.length <= maxCharsPerLine) return [cleaned];

    const words = cleaned.split(/\s+/);
    const lines = [];
    let currentLine = "";

    words.forEach(word => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;

      if (candidate.length <= maxCharsPerLine) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
          currentLine = "";
        }
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    let finalLines = lines.slice(0, maxLines);

    if (lines.length > maxLines) {
      const remaining = lines.slice(maxLines - 1).join(" ");
      finalLines[maxLines - 1] = truncateText(remaining, maxCharsPerLine);
    } else {
      finalLines = finalLines.map((line, index) => {
        if (index === maxLines - 1) {
          return truncateText(line, maxCharsPerLine);
        }
        return line;
      });
    }

    return finalLines;
  }

  function truncateText(text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}…`;
  }

  /* ============================================================
     Tooltip
     ============================================================ */

  function buildTooltip(d, compareSport, compareEvent) {
    let counts = { men: 0, women: 0 };
    let level = "Category";

    if (d.depth === 1) {
      counts = compareSport.get(d.data.name) || counts;
      level = "Sport";
    } else if (d.depth === 2) {
      const key = `${d.parent.data.name}|||${d.data.name}`;
      counts = compareEvent.get(key) || counts;
      level = "Discipline";
    }

    const total = counts.men + counts.women;
    const menPct = total ? ((counts.men / total) * 100).toFixed(1) : "0.0";
    const womenPct = total ? ((counts.women / total) * 100).toFixed(1) : "0.0";

    return `
      <strong>${d.data.name}</strong><br>
      ${level}<br>
      Women: <strong>${womenPct}%</strong> (${counts.women})<br>
      Men: <strong>${menPct}%</strong> (${counts.men})<br>
      Total athletes: ${total}
    `;
  }

  function getTooltip() {
    let tooltip = d3.select("body").select(".gender-tooltip");

    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "gender-tooltip");
    }

    return tooltip;
  }

  function showTooltip(event, html) {
    getTooltip()
      .html(html)
      .style("left", `${event.clientX + 14}px`)
      .style("top", `${event.clientY + 14}px`)
      .style("opacity", 1);
  }

  function hideTooltip() {
    getTooltip().style("opacity", 0);
  }

  /* ============================================================
     Error
     ============================================================ */

  function showError(message) {
    const root = d3.select(selectors.root);

    root.selectAll("*").remove();

    root
      .append("div")
      .attr("class", "gender-error")
      .text(message);
  }
})();