(function () {
  "use strict";

  const DATA_PATH = "data/fair_distribution.csv";

  const selectors = {
    root: "#fair-viz"
  };

  const state = {
    rows: [],
    columns: {},
    season: "Summer",
    year: null, 
    country1: null,
    country2: null,
    populationAdjustment: 100,
    gdpAdjustment: 100,
    rankingSeason: "Summer",
    rankingYear: null,
    expandedPredictionCountry: null,
    highlightedCountry: null,
  };

  const medalOrder = ["Gold", "Silver", "Bronze"];

  const medalColors = {
    Gold: "#f2c14e",
    Silver: "#cfd5db",
    Bronze: "#e09b4f"
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const root = document.querySelector(selectors.root);
    if (!root) return;

    showLoading(root);

    const rankingRoot = document.querySelector("#fair-ranking-viz");
    if (rankingRoot) showLoading(rankingRoot);

    try {
      const rows = await d3.csv(DATA_PATH, d3.autoType);

      state.rows = rows;
      state.columns = detectColumns(rows);

      ensureRequiredColumns();
      removeLoading(root);
      buildScaffold();
      initializeState();
      populateControls();
      bindControls();
      render();
    } catch (error) {
      console.error(error);
      showError(`Could not load ${DATA_PATH}.`);
    }
  }

  function detectColumns(rows) {
    const columns = Object.keys(rows[0] || {});

    return {
      year:       findColumn(columns, ["year", "Year"]),
      season:     findColumn(columns, ["season", "Season"]),
      team:       findColumn(columns, ["country", "Country"]),
      noc:        findColumn(columns, ["noc", "NOC"]),
      population: findColumn(columns, ["population", "Population"]),
      gdp:        findColumn(columns, ["gdp_per_capita"]),
      gold:       findColumn(columns, ["gold"]),
      silver:     findColumn(columns, ["silver"]),
      bronze:     findColumn(columns, ["bronze"]),
    };
  }

  function findColumn(columns, candidates) {
    return candidates.find(candidate => columns.includes(candidate)) || null;
  }

  function ensureRequiredColumns() {
    const c = state.columns;

    const missing = [];
    if (!c.year)   missing.push("year");
    if (!c.season) missing.push("season");
    if (!c.team)   missing.push("country");
    if (!c.gold)   missing.push("gold");
    if (missing.length > 0) throw new Error(`Missing columns: ${missing.join(", ")}`);
  }

  function buildScaffold() {
    const root = document.querySelector(selectors.root);

    root.innerHTML = `
      <div class="fair-controls">
        <label class="fair-control">
          <span>Season:</span>
          <select id="fair-season"></select>
        </label>

        <label class="fair-control">
          <span>Year:</span>
          <select id="fair-year"></select>
        </label>

        <label class="fair-control">
          <span>Country 1:</span>
          <select id="fair-country-1"></select>
        </label>

        <label class="fair-control">
          <span>Country 2:</span>
          <select id="fair-country-2"></select>
        </label>
      </div>

      <div class="fair-grid" id="fair-grid"></div>

      <div class="fair-note">
        Fair medals are computed as:

        <div class="formula">
          <span>actual medals</span>

          <span class="multiply">×</span>

          <span class="fraction">
            <span class="top">mean population</span>
            <span class="bottom">country population</span>
          </span>

          <span class="multiply">×</span>

          <span class="fraction">
            <span class="top">mean GDP</span>
            <span class="bottom">country GDP</span>
          </span>
        </div>
      </div>
    `;
  }

  function initializeState() {
    const seasons = getAvailableSeasons();
    state.season = seasons.includes("Summer") ? "Summer" : seasons[0];

    const years = getAvailableYears(state.season);
    state.year = years.includes(2016) ? 2016 : years[years.length - 1];

    const countries = getAvailableCountries(state.season, state.year);

    state.country1 = findPreferredCountry(countries, [
      "Switzerland",
      "SUI"
    ]) || countries[0] || null;

    state.country2 = findPreferredCountry(countries, [
      "United States",
      "United States of America",
      "USA"
    ]) || countries.find(country => country !== state.country1) || countries[0] || null;

    state.rankingSeason = state.season;
    state.rankingYear = state.year;
  }

  function findPreferredCountry(countries, preferredNames) {
    for (const preferred of preferredNames) {
      const found = countries.find(country => normalizeCountryForComparison(country) === normalizeCountryForComparison(preferred));
      if (found) return found;
    }

    return null;
  }

  function bindControls() {
    d3.select("#fair-season").on("change", function () {
      state.season = this.value;
      state.rankingSeason = this.value;

      const years = getAvailableYears(state.season);
      if (!years.includes(state.year)) {
        state.year = years[years.length - 1] || null;
      }
      if (!years.includes(state.rankingYear)) {
        state.rankingYear = years[years.length - 1] || null;
      }

      updateCountriesAfterSeasonOrYearChange();
      populateControls();
      render();

      const rankingSeasonEl = document.getElementById("fair-ranking-season");
      if (rankingSeasonEl) rankingSeasonEl.value = this.value;
    });

    d3.select("#fair-year").on("change", function () {
      state.year = Number(this.value);
      state.rankingYear = Number(this.value);

      updateCountriesAfterSeasonOrYearChange();
      populateControls();
      render();

      const rankingYearEl = document.getElementById("fair-ranking-year");
      if (rankingYearEl) rankingYearEl.value = this.value;
    });

    d3.select("#fair-country-1").on("change", function () {
      state.country1 = this.value;
      render();
    });

    d3.select("#fair-country-2").on("change", function () {
      state.country2 = this.value;
      render();
    });

    d3.select("#fair-pop-adjustment").on("input", function () {
      state.populationAdjustment = Number(this.value);
      d3.select("#fair-pop-value").text(`${state.populationAdjustment}%`);
      render();
    });

    d3.select("#fair-gdp-adjustment").on("input", function () {
      state.gdpAdjustment = Number(this.value);
      d3.select("#fair-gdp-value").text(`${state.gdpAdjustment}%`);
      render();
    });
  }

  function updateCountriesAfterSeasonOrYearChange() {
    const countries = getAvailableCountries(state.season, state.year);

    if (!countries.includes(state.country1)) {
      state.country1 = countries[0] || null;
    }

    if (!countries.includes(state.country2)) {
      state.country2 = countries.find(country => country !== state.country1) || countries[0] || null;
    }
  }

  function populateControls() {
    const seasons = getAvailableSeasons();
    const years = getAvailableYears(state.season);
    const countries = getAvailableCountries(state.season, state.year);

    d3.select("#fair-season")
      .selectAll("option")
      .data(seasons)
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    d3.select("#fair-year")
      .selectAll("option")
      .data(years)
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    d3.select("#fair-country-1")
      .selectAll("option")
      .data(countries)
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    d3.select("#fair-country-2")
      .selectAll("option")
      .data(countries)
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    d3.select("#fair-season").property("value", state.season);
    d3.select("#fair-year").property("value", state.year);
    d3.select("#fair-country-1").property("value", state.country1);
    d3.select("#fair-country-2").property("value", state.country2);
  }

  function getAvailableSeasons() {
    const c = state.columns;

    return Array.from(
      new Set(
        state.rows
          .map(row => String(row[c.season] || "").trim())
          .filter(Boolean)
      )
    ).sort(d3.ascending);
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

  function getAvailableCountries(season, year) {
    return Array.from(
      new Set(
        getRowsForSeasonYear(season, year)
          .map(row => getCountry(row))
          .filter(Boolean)
      )
    ).sort(d3.ascending);
  }

  function getRowsForSeasonYear(season, year) {
    const c = state.columns;

    return state.rows.filter(row => {
      return (
        String(row[c.season] || "").trim() === season &&
        Number(row[c.year]) === Number(year)
      );
    });
  }

  function getCountry(row) {
    return String(row[state.columns.team] || "").trim();
  }

  function cleanCountryName(value) {
    return String(value || "")
      .replace(/\s*-\s*\d+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeCountryForComparison(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s*-\s*\d+$/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function getEvent(row) {
    const c = state.columns;
    return cleanLabel(row[c.event] || row[c.sport] || "Unknown");
  }

  function cleanLabel(value) {
    return String(value || "").trim();
  }

  function normalizeMedal(value) {
    const text = String(value || "").trim().toLowerCase();

    if (text.includes("gold")) return "Gold";
    if (text.includes("silver")) return "Silver";
    if (text.includes("bronze")) return "Bronze";

    return "";
  }

  function getMedalCounts(country) {
    const c = state.columns;
    const row = getRowsForSeasonYear(state.season, state.year)
      .find(r => getCountry(r) === country);
    return {
      Gold:   row ? (Number(row[c.gold])   || 0) : 0,
      Silver: row ? (Number(row[c.silver]) || 0) : 0,
      Bronze: row ? (Number(row[c.bronze]) || 0) : 0,
    };
  }

  function getCountryIndicators(country) {
    const c = state.columns;
    const row = getRowsForSeasonYear(state.season, state.year)
      .find(r => getCountry(r) === country);
    return {
      population: row ? toNumber(row[c.population]) : null,
      gdp:        row ? toNumber(row[c.gdp])        : null,
    };
  }

  function getMeanIndicators() {
    const c = state.columns;
    const rows = getRowsForSeasonYear(state.season, state.year);

    const byCountry = new Map();

    rows.forEach(row => {
      const country = getCountry(row);
      if (!country) return;

      if (!byCountry.has(country)) {
        byCountry.set(country, {
          population: null,
          gdp: null
        });
      }

      const entry = byCountry.get(country);

      if (c.population) {
        const pop = toNumber(row[c.population]);
        if (entry.population === null && Number.isFinite(pop) && pop > 0) {
          entry.population = pop;
        }
      }

      if (c.gdp) {
        const currentGDP = toNumber(row[c.gdp]);
        if (entry.gdp === null && Number.isFinite(currentGDP) && currentGDP > 0) {
          entry.gdp = currentGDP;
        }
      }
    });

    const populations = [];
    const gdps = [];

    byCountry.forEach(value => {
      if (Number.isFinite(value.population) && value.population > 0) {
        populations.push(value.population);
      }

      if (Number.isFinite(value.gdp) && value.gdp > 0) {
        gdps.push(value.gdp);
      }
    });

    return {
      meanPopulation: d3.mean(populations) || null,
      meanGDP: d3.mean(gdps) || null
    };
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;

    const cleaned = String(value).replace(/,/g, "");
    const number = Number(cleaned);

    return Number.isFinite(number) ? number : null;
  }

  function computeFairCounts(country) {
    const actual = getMedalCounts(country);
    const indicators = getCountryIndicators(country);
    const means = getMeanIndicators();

    const population = indicators.population;
    const gdp = indicators.gdp;

    const meanPopulation = means.meanPopulation;
    const meanGDP = means.meanGDP;

    let factor = null;

    if (
      Number.isFinite(population) &&
      population > 0 &&
      Number.isFinite(gdp) &&
      gdp > 0 &&
      Number.isFinite(meanPopulation) &&
      meanPopulation > 0 &&
      Number.isFinite(meanGDP) &&
      meanGDP > 0
    ) {
      const populationFactor = meanPopulation / population;
      const gdpFactor = meanGDP / gdp;

      factor = populationFactor * gdpFactor;
    }

    const fair = {};

    medalOrder.forEach(medal => {
      fair[medal] = factor === null ? null : actual[medal] * factor;
    });

    return {
      actual,
      fair,
      factor,
      population,
      gdp,
      meanPopulation,
      meanGDP
    };
  }

  function getDisplayData(country, data) {
    const totalActual =
      data.actual.Gold + data.actual.Silver + data.actual.Bronze;

    if (totalActual > 0) {
      return {
        ...data,
        similarCountry: null
      };
    }

    const similarCountry = findSimilarGdpMedalCountry(country);

    if (!similarCountry) {
      return {
        ...data,
        similarCountry: null
      };
    }

    const similarData = computeFairCounts(similarCountry);

    return {
      ...data,
      fair: similarData.fair,
      similarCountry
    };
  }

  function findSimilarGdpMedalCountry(country) {
    const base = getCountryIndicators(country);
    if (!base.gdp && !base.population) return null;

    const countries = getAvailableCountries(state.season, state.year);

    const candidates = countries
      .filter(candidate => candidate !== country)
      .map(candidate => {
        const medals = getMedalCounts(candidate);
        const totalMedals = medals.Gold + medals.Silver + medals.Bronze;

        if (totalMedals === 0) return null;

        const indicators = getCountryIndicators(candidate);

        let distance = 0;
        let terms = 0;

        if (base.gdp && indicators.gdp) {
          distance += Math.abs(Math.log(indicators.gdp) - Math.log(base.gdp));
          terms++;
        }
        if (base.population && indicators.population) {
          distance += Math.abs(Math.log(indicators.population) - Math.log(base.population));
          terms++;
        }

        if (terms === 0) return null;

        return { country: candidate, distance: distance / terms };
      })
      .filter(Boolean)
      .sort((a, b) => d3.ascending(a.distance, b.distance));

    return candidates[0]?.country || null;
  }

  function render() {
    const grid = d3.select("#fair-grid");

    if (!state.country1 || !state.country2) {
      showError("No countries available for this season/year.");
      return;
    }

    const rawData1 = computeFairCounts(state.country1);
    const rawData2 = computeFairCounts(state.country2);

    const data1 = getDisplayData(state.country1, rawData1);
    const data2 = getDisplayData(state.country2, rawData2);

    const maxScale = d3.max([
      ...medalOrder.map(medal => data1.actual[medal] || 0),
      ...medalOrder.map(medal => data2.actual[medal] || 0),
      ...medalOrder.map(medal => data1.fair[medal] || 0),
      ...medalOrder.map(medal => data2.fair[medal] || 0),
      1
    ]);

    grid.html("");
    grid.append("div").html(renderCountryCard(state.country1, data1, maxScale));
    grid.append("div").html(renderCountryCard(state.country2, data2, maxScale));
    renderRankingTable();
    requestAnimationFrame(measureIconOverflow);
  }

  function renderMedalIcons(value, color) {
    const rounded = Math.round((value || 0) * 2) / 2;
    const fullCount = Math.floor(rounded);
    const hasHalf = rounded % 1 === 0.5;

    const full = Array(fullCount).fill(0).map(() =>
      `<div class="fair-medal-icon" style="background:${color}"></div>`
    ).join("");
    const half = hasHalf
      ? `<div class="fair-medal-half-wrap"><div class="fair-medal-icon" style="background:${color}"></div></div>`
      : "";

    return `<div class="fair-medal-icons" data-total="${rounded}">${full}${half}</div>`;
  }

  function measureIconOverflow() {
    document.querySelectorAll(".fair-medal-icons").forEach(container => {
      container.querySelectorAll(".fair-medal-overflow").forEach(el => el.remove());

      const ROW_HEIGHT = 16;
      const GAP = 3;
      const MAX_ROWS = 2;
      const maxH = MAX_ROWS * ROW_HEIGHT + (MAX_ROWS - 1) * GAP;

      if (container.scrollHeight <= maxH + 1) return;

      const total = parseFloat(container.dataset.total) || 0;
      const iconW = ROW_HEIGHT + GAP;
      const containerW = container.clientWidth;
      const iconsPerRow = Math.max(1, Math.floor((containerW + GAP) / iconW));
      const maxVisible = iconsPerRow * MAX_ROWS;

      const icons = Array.from(container.children).filter(
        el => el.classList.contains("fair-medal-icon") || el.classList.contains("fair-medal-half-wrap")
      );

      icons.slice(maxVisible).forEach(el => el.style.display = "none");

      const hidden = Math.ceil(total - maxVisible);
      if (hidden > 0) {
        const label = document.createElement("span");
        label.className = "fair-medal-overflow";
        label.textContent = `+${hidden}`;
        container.appendChild(label);
      }
    });
  }

  function renderCountryCard(country, data, maxScale) {
    const fairUnavailable = data.factor === null;

    return `
      <div class="fair-country-card">
        <div class="fair-country-title">${country}</div>

        <div class="fair-country-subtitle">
          Population: ${formatBig(data.population)} &nbsp;•&nbsp;
          GDP: ${formatBig(data.gdp)}
        </div>

        <div class="fair-box">
          <div class="fair-box-title">Actual medals</div>

          ${data.similarCountry ? `
            <div class="fair-warning fair-warning--lg">
              No medals for ${country}. Fair values are estimated from ${data.similarCountry},
              a medal-winning country with similar GDP and population.
            </div>
          ` : medalOrder.map(medal => {
            const value = data.actual[medal] || 0;
            return `
              <div class="fair-medal-row">
                <div class="fair-medal-label">${medal}</div>
                ${renderMedalIcons(value, medalColors[medal])}
                <div class="fair-medal-value">${value}</div>
              </div>
            `;
          }).join("")}
        </div>

        <div class="fair-box">
          <div class="fair-box-title">
            Fair medals with average population and average GDP
          </div>

          ${medalOrder.map(medal => {
            const value = data.fair[medal];
            return `
              <div class="fair-medal-row">
                <div class="fair-medal-label">${medal}</div>
                ${value === null ? `<div class="fair-medal-icons"></div>` : renderMedalIcons(value, medalColors[medal])}
                <div class="fair-medal-value">
                  ${value === null ? "n/a" : formatFair(value)}
                </div>
              </div>
            `;
          }).join("")}

          ${fairUnavailable && !data.similarCountry ? `
            <div class="fair-warning">
              Missing population or GDP data.
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  function formatFair(value) {
    if (value === null || !Number.isFinite(value)) return "–";

    return Math.abs(value - Math.round(value)) < 0.05
      ? String(Math.round(value))
      : d3.format(".1f")(value);
  }

  function formatBig(value) {
    if (value === null || !Number.isFinite(value)) return "–";

    if (value >= 1e12) return d3.format(".2s")(value).replace("T", "T");
    if (value >= 1e9) return d3.format(".2s")(value).replace("G", "B");
    if (value >= 1e6) return d3.format(".2s")(value).replace("M", "M");

    return d3.format(",.0f")(value);
  }

  function showLoading(root) {
    root.classList.add("is-loading");
    const slide = root.closest(".slide");
    if (slide) slide.classList.add("is-loading");
    const div = document.createElement("div");
    div.className = "fair-loading";
    div.textContent = "Loading data, please wait…";
    root.appendChild(div);
  }

  function removeLoading(root) {
    root.classList.remove("is-loading");
    const slide = root.closest(".slide");
    if (slide) slide.classList.remove("is-loading");
    root.querySelectorAll(".fair-loading").forEach(el => el.remove());
  }

  function showError(message) {
    const root = document.querySelector(selectors.root);
    if (!root) return;

    root.innerHTML = `<div class="fair-error">${message}</div>`;
  }

  function renderRankingTable() {
    const root = d3.select("#fair-ranking-viz");
    if (root.empty()) return;
    root.classed("is-loading", false);
    const slide = root.node().closest(".slide");
    if (slide) slide.classList.remove("is-loading");

    if (!state.rankingYear) {
      state.rankingSeason = state.season;
      state.rankingYear = state.year;
    }

    const years = getAvailableYears(state.rankingSeason);
    const countries = getAvailableCountries(state.rankingSeason, state.rankingYear);

    const previousSeason = state.season;
    const previousYear = state.year;

    state.season = state.rankingSeason;
    state.year = state.rankingYear;

    const rows = countries.map(country => {
      const data = computeFairCounts(country);
      return {
        country,
        actual: data.actual,
        fair: data.fair
      };
    });

    state.season = previousSeason;
    state.year = previousYear;

    const actualRanking = [...rows]
      .sort((a, b) =>
        d3.descending(a.actual.Gold, b.actual.Gold) ||
        d3.descending(a.actual.Silver, b.actual.Silver) ||
        d3.descending(a.actual.Bronze, b.actual.Bronze)
      )
      .slice(0, 300);

    const fairRanking = [...rows]
      .sort((a, b) =>
        d3.descending(a.fair.Gold || 0, b.fair.Gold || 0) ||
        d3.descending(a.fair.Silver || 0, b.fair.Silver || 0) ||
        d3.descending(a.fair.Bronze || 0, b.fair.Bronze || 0)
      )
      .slice(0, 300);

    root.html(`
      <div class="fair-ranking-controls">
        <label>
          Season:
          <select id="fair-ranking-season">
            ${getAvailableSeasons().map(season => `
              <option value="${season}" ${season === state.rankingSeason ? "selected" : ""}>${season}</option>
            `).join("")}
          </select>
        </label>

        <label>
          Year:
          <select id="fair-ranking-year">
            ${years.map(year => `
              <option value="${year}" ${year === state.rankingYear ? "selected" : ""}>${year}</option>
            `).join("")}
          </select>
        </label>
      </div>

      <div class="fair-ranking-layout">
        ${rankingTable("Actual medal ranking", actualRanking, "actual")}
        ${rankingTable("Fair medal ranking", fairRanking, "fair")}
      </div>
    `);

    d3.select("#fair-ranking-season").on("change", function () {
      state.rankingSeason = this.value;
      state.season = this.value;

      const newYears = getAvailableYears(state.rankingSeason);
      state.rankingYear = newYears.includes(state.rankingYear)
        ? state.rankingYear
        : newYears[newYears.length - 1];
      if (!newYears.includes(state.year)) {
        state.year = newYears[newYears.length - 1] || null;
      }

      renderRankingTable();

      const fairSeasonEl = document.getElementById("fair-season");
      if (fairSeasonEl) {
        fairSeasonEl.value = this.value;
        updateCountriesAfterSeasonOrYearChange();
        populateControls();
        render();
      }
    });

    d3.select("#fair-ranking-year").on("change", function () {
      state.rankingYear = Number(this.value);
      state.year = Number(this.value);

      renderRankingTable();

      const fairYearEl = document.getElementById("fair-year");
      if (fairYearEl) {
        fairYearEl.value = this.value;
        updateCountriesAfterSeasonOrYearChange();
        populateControls();
        render();
      }
    });

    // Click highlight country
    d3.selectAll(".fair-ranking-table tbody tr").style("cursor", "pointer")
      .on("click", function () {
        const country = d3.select(this).select("td:nth-child(2)").text().trim();
        const alreadyHighlighted = state.highlightedCountry === country;
        state.highlightedCountry = alreadyHighlighted ? null : country;
        if (state.highlightedCountry) {
          const container = this.closest(".fair-ranking-scroll");
          const thead = container ? container.querySelector("thead") : null;
          const theadHeight = thead ? thead.offsetHeight : 0;
          const sourceOffset = container
            ? this.offsetTop - container.scrollTop - theadHeight
            : 0;
          highlightCountryInRanking(state.highlightedCountry, this, sourceOffset);
        } else {
          clearRankingHighlight();
        }
      });

    if (state.highlightedCountry) {
      highlightCountryInRanking(state.highlightedCountry);
    }

    // Hover country
    d3.selectAll(".fair-ranking-table tbody tr")
      .on("mouseover", function () {
        const country = d3.select(this).select("td:nth-child(2)").text().trim();
        const indicators = getCountryIndicators(country);

        const tooltip = d3.select("body").select(".fair-ranking-tooltip");

        const html = `
          <strong>${country}</strong><br>
          Population: ${formatBig(indicators.population)}<br>
          GDP per capita: ${formatBig(indicators.gdp)}
        `;

        tooltip.html(html).style("opacity", 1);
      })
      .on("mousemove", function (event) {
        d3.select(".fair-ranking-tooltip")
          .style("left", `${event.pageX + 14}px`)
          .style("top", `${event.pageY + 14}px`);
      })
      .on("mouseleave", function () {
        d3.select(".fair-ranking-tooltip").style("opacity", 0);
      });

    if (d3.select("body").select(".fair-ranking-tooltip").empty()) {
      d3.select("body").append("div").attr("class", "fair-ranking-tooltip")
        .style("position", "fixed")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("background", "rgba(20,20,20,0.96)")
        .style("color", "white")
        .style("border", "1px solid rgba(255,255,255,0.18)")
        .style("border-radius", "10px")
        .style("padding", "10px 12px")
        .style("font-size", "14px")
        .style("font-family", "'Elms Sans', sans-serif")
        .style("line-height", "1.35")
        .style("max-width", "260px")
        .style("z-index", "99999")
        .style("box-shadow", "0 8px 25px rgba(0,0,0,0.35)");
    }
  }

  function rankingTable(title, rows, type) {
    return `
      <div class="fair-ranking-card">
        <p>${title}</p>
        <div class="fair-ranking-scroll">
          <table class="fair-ranking-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Country</th>
                <th>Gold</th>
                <th>Silver</th>
                <th>Bronze</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${row.country}</td>
                  <td>${formatFair(row[type].Gold)}</td>
                  <td>${formatFair(row[type].Silver)}</td>
                  <td>${formatFair(row[type].Bronze)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderWhatIfPrediction(country) {
    const indicators = getCountryIndicators(country);
    const means = getMeanIndicators();

    const allCountries = getAvailableCountries(state.season, state.year);

    const medalWinningCountries = allCountries.filter(c => {
      const medals = getMedalCounts(c);
      return medals.Gold + medals.Silver + medals.Bronze > 0;
    });

    const average = {
      Gold: d3.mean(medalWinningCountries, c => getMedalCounts(c).Gold) || 0,
      Silver: d3.mean(medalWinningCountries, c => getMedalCounts(c).Silver) || 0,
      Bronze: d3.mean(medalWinningCountries, c => getMedalCounts(c).Bronze) || 0
    };

    const populationRatio =
      indicators.population && means.meanPopulation
        ? means.meanPopulation / indicators.population
        : 1;

    const gdpRatio =
      indicators.gdp && means.meanGDP
        ? means.meanGDP / indicators.gdp
        : 1;

    const populationEffect = Math.pow(populationRatio, state.populationAdjustment / 100);
    const gdpEffect = Math.pow(gdpRatio, state.gdpAdjustment / 100);

    const factor = populationEffect * gdpEffect;

    return `
      <div class="fair-whatif-bars">
        ${medalOrder.map(medal => {
          const value = average[medal] * factor;

          return `
            <div class="fair-medal-row">
              <div class="fair-medal-label">${medal}</div>
              <div class="fair-bar-bg">
                <div class="fair-bar-fill"
                    style="width:${Math.min(100, value * 12)}%; background:${medalColors[medal]}"></div>
              </div>
              <div class="fair-medal-value">${formatFair(value)}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function highlightCountryInRanking(country, sourceRow, sourceOffset) {
    d3.selectAll(".fair-ranking-table tbody tr")
      .each(function () {
        const row = d3.select(this);
        const rowCountry = row.select("td:nth-child(2)").text().trim();
        const isMatch = rowCountry === country;

        row.style("background", isMatch ? "rgba(244, 180, 0, 0.25)" : null)
          .style("color", isMatch ? "#f4b400" : null)
          .style("font-weight", isMatch ? "800" : null)
          .attr("data-highlighted", isMatch ? "true" : null);

        if (isMatch && this !== sourceRow) {
          const container = this.closest(".fair-ranking-scroll");
          if (container) {
            const thead = container.querySelector("thead");
            const theadHeight = thead ? thead.offsetHeight : 0;
            const targetScrollTop = this.offsetTop - theadHeight - (sourceOffset ?? 0);
            container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
          }
        }
      });
  }

  function clearRankingHighlight() {
    d3.selectAll(".fair-ranking-table tbody tr")
      .style("background", null)
      .style("color", null)
      .style("font-weight", null)
      .attr("data-highlighted", null);
  }
})();