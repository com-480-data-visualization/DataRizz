(function () {
  "use strict";

  const DATA_PATH = "data/olympics.csv";

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
    gdpAdjustment: 100
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

    try {
      const rows = await d3.csv(DATA_PATH, d3.autoType);

      state.rows = rows;
      state.columns = detectColumns(rows);

      ensureRequiredColumns();
      injectStyles();
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
      year: findColumn(columns, ["Year", "year"]),
      season: findColumn(columns, ["Season", "season"]),
      medal: findColumn(columns, ["Medal", "medal"]),
      event: findColumn(columns, ["Event", "event", "Discipline", "discipline"]),
      sport: findColumn(columns, ["Sport", "sport"]),
      team: findColumn(columns, ["country", "Country", "team", "Team", "Region", "region"]),
      noc: findColumn(columns, ["NOC", "noc"]),
      population: findColumn(columns, [
        "Population",
        "population",
        "Pop",
        "pop",
        "CountryPopulation",
        "country_population",
        "population_total"
      ]),
      gdp: findColumn(columns, [
      "gdp_per_capita",
      "GDP_per_capita",
      "gdpPerCapita",
      "GDP",
      "gdp",
      "Gdp",
      "CountryGDP",
      "country_gdp",
      "gdp_total",
      "GDP_total"
      ])
    };
  }

  function findColumn(columns, candidates) {
    return candidates.find(candidate => columns.includes(candidate)) || null;
  }

  function ensureRequiredColumns() {
    const c = state.columns;

    const missing = [];

    if (!c.year) missing.push("Year");
    if (!c.season) missing.push("Season");
    if (!c.medal) missing.push("Medal");
    if (!c.team && !c.noc) missing.push("Team/Country or NOC");

    if (missing.length > 0) {
      throw new Error(`Missing columns: ${missing.join(", ")}`);
    }
  }

  function injectStyles() {
    if (document.getElementById("fair-distribution-inline-styles")) return;

    const style = document.createElement("style");
    style.id = "fair-distribution-inline-styles";

    style.textContent = `
      #fair-viz {
        color: white;
        width: 100%;
        max-width: 1440px;
        margin: 0 auto;
      }

      .fair-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 14px 18px;
        align-items: center;
        justify-content: center;
        margin-bottom: 22px;
      }

      .fair-control {
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
        font-size: 18px;
        font-weight: 700;
        white-space: nowrap;
      }

      .fair-control select {
        background: #bfe2eb;
        border: 2px solid #2c2c2c;
        border-radius: 10px;
        padding: 7px 12px;
        font-size: 18px;
        font-weight: 700;
        color: #111;
        cursor: pointer;
      }

      .fair-summary {
        display: flex;
        justify-content: center;
        gap: 14px;
        flex-wrap: wrap;
        margin-bottom: 22px;
        font-size: 14px;
        color: #dddddd;
      }

      .fair-summary-box {
        border: 1px solid rgba(255,255,255,0.22);
        border-radius: 12px;
        padding: 9px 15px;
        background: rgba(255,255,255,0.03);
      }

      .fair-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 28px;
        align-items: stretch;
      }

      .fair-country-card {
        border-radius: 16px;
        padding: 20px;
        background: rgba(255,255,255,0.03);
      }

      .fair-country-title {
        text-align: center;
        font-size: 24px;
        font-weight: 800;
        margin-bottom: 6px;
        color: white;
      }

      .fair-country-subtitle {
        text-align: center;
        font-size: 14px;
        color: #d0d0d0;
        margin-bottom: 18px;
      }

      .fair-box {
        border: 1px solid rgba(255,255,255,0.24);
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 16px;
        background: rgba(255,255,255,0.02);
      }

      .fair-box:last-child {
        margin-bottom: 0;
      }

      .fair-box-title {
        font-size: 16px;
        font-weight: 800;
        color: white;
        margin-bottom: 12px;
        text-align: center;
      }

      .fair-medal-row {
        display: grid;
        grid-template-columns: 72px 1fr 50px;
        align-items: center;
        gap: 12px;
        margin: 11px 0;
      }

      .fair-medal-label {
        font-size: 14px;
        font-weight: 800;
        color: white;
      }

      .fair-medal-value {
        font-size: 14px;
        font-weight: 800;
        color: white;
        text-align: right;
      }

      .fair-bar-bg {
        height: 14px;
        background: rgba(255,255,255,0.15);
        border-radius: 999px;
        overflow: hidden;
      }

      .fair-bar-fill {
        height: 100%;
        border-radius: 999px;
        min-width: 0;
      }

      .fair-note {
        text-align: center;
        margin-top: 22px;
        font-size: 18px;
        color: #d6d6d6;
        line-height: 1.5;
      }

      .fair-warning {
        color: #ffd166;
        font-size: 12px;
        text-align: center;
        margin-top: 8px;
      }

      .fair-error {
        color: white;
        text-align: center;
        padding: 24px;
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 12px;
      }

      @media (max-width: 950px) {
        .fair-grid {
          grid-template-columns: 1fr;
        }
      }

      .fair-prediction-wrapper {
        display: flex;
        justify-content: center;
        margin-bottom: 18px;
      }

      .fair-prediction-banner {
        width: 80%;
        background: rgba(255, 209, 102, 0.12);
        border: 1px solid rgba(255, 209, 102, 0.55);
        color: #ffd166;
        padding: 14px 18px;
        border-radius: 12px;
        text-align: center;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.45;
      }
    `;

    document.head.appendChild(style);
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

        <p class="fair-slider-explanation">
          Use the sliders to adjust how much weight population and GDP have in the fair medal calculation.
        </p>

        <div class="fair-sliders">
          <label class="fair-slider-control">
            <span>Population adjustment:</span>
            <input id="fair-pop-adjustment" type="range" min="0" max="200" value="100" step="10">
            <strong id="fair-pop-value">100%</strong>
          </label>

          <label class="fair-slider-control">
            <span>GDP adjustment:</span>
            <input id="fair-gdp-adjustment" type="range" min="0" max="200" value="100" step="10">
            <strong id="fair-gdp-value">100%</strong>
          </label>
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

      const years = getAvailableYears(state.season);
      if (!years.includes(state.year)) {
        state.year = years[years.length - 1] || null;
      }

      updateCountriesAfterSeasonOrYearChange();
      populateControls();
      render();
    });

    d3.select("#fair-year").on("change", function () {
      state.year = Number(this.value);

      updateCountriesAfterSeasonOrYearChange();
      populateControls();
      render();
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
    const c = state.columns;

    const value = row[c.team] || row[c.noc] || "";
    return cleanCountryName(value);
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
    const rows = getRowsForSeasonYear(state.season, state.year)
      .filter(row => getCountry(row) === country);

    const counts = {
      Gold: 0,
      Silver: 0,
      Bronze: 0
    };

    const seen = new Set();

    rows.forEach(row => {
      const medal = normalizeMedal(row[state.columns.medal]);
      if (!medalOrder.includes(medal)) return;

      /*
        Deduplicate medals by country + event + medal.
        This avoids counting every athlete in a team event as a separate medal.
      */
      const key = [
        country,
        getEvent(row),
        medal
      ].join("|||");

      if (seen.has(key)) return;

      seen.add(key);
      counts[medal] += 1;
    });

    return counts;
  }

  function getCountryIndicators(country) {
    const c = state.columns;

    const rows = getRowsForSeasonYear(state.season, state.year)
      .filter(row => getCountry(row) === country);

    let population = null;
    let gdp = null;

    for (const row of rows) {
      if (c.population) {
        const pop = toNumber(row[c.population]);
        if (population === null && Number.isFinite(pop) && pop > 0) {
          population = pop;
        }
      }

      if (c.gdp) {
        const currentGDP = toNumber(row[c.gdp]);
        if (gdp === null && Number.isFinite(currentGDP) && currentGDP > 0) {
          gdp = currentGDP;
        }
      }

      if (population !== null && gdp !== null) break;
    }

    return {
      population,
      gdp
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
      const populationFactor = Math.pow(meanPopulation / population, state.populationAdjustment / 100);
      const gdpFactor = Math.pow(meanGDP / gdp, state.gdpAdjustment / 100);

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

  function render() {
    const grid = d3.select("#fair-grid");

    if (!state.country1 || !state.country2) {
      showError("No countries available for this season/year.");
      return;
    }

    const data1 = computeFairCounts(state.country1);
    const data2 = computeFairCounts(state.country2);

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
  }

  function renderCountryCard(country, data, maxScale) {
    const fairUnavailable = data.factor === null;

    const allFairZero =
      !fairUnavailable &&
      medalOrder.every(medal => (data.fair[medal] || 0) === 0);

    return `
      <div class="fair-country-card">
        <div class="fair-country-title">${country}</div>
        <div class="fair-country-subtitle">
          Population: ${formatBig(data.population)} &nbsp;•&nbsp;
          GDP: ${formatBig(data.gdp)}
        </div>

        ${allFairZero ? `
          <div class="fair-prediction-wrapper">
            <div class="fair-prediction-banner">
              How would you predict their performance if they had the same GDP and population as the other countries?
            </div>
          </div>
        ` : ""}

        <div class="fair-box">
          <div class="fair-box-title">Actual medals</div>
          ${medalOrder.map(medal => {
            const value = data.actual[medal] || 0;
            const width = value === 0 ? 0 : Math.max(3, (100 * value) / maxScale);

            return `
              <div class="fair-medal-row">
                <div class="fair-medal-label">${medal}</div>
                <div class="fair-bar-bg">
                  <div class="fair-bar-fill"
                       style="width:${width}%; background:${medalColors[medal]}"></div>
                </div>
                <div class="fair-medal-value">${value}</div>
              </div>
            `;
          }).join("")}
        </div>

        <div class="fair-box">
          <div class="fair-box-title">Fair medals with average population and average GDP</div>
          ${medalOrder.map(medal => {
            const value = data.fair[medal];
            const width = value === null || value === 0
              ? 0
              : Math.max(3, (100 * value) / maxScale);

            return `
              <div class="fair-medal-row">
                <div class="fair-medal-label">${medal}</div>
                <div class="fair-bar-bg">
                  <div class="fair-bar-fill"
                       style="width:${width}%; background:${medalColors[medal]}"></div>
                </div>
                <div class="fair-medal-value">${formatFair(value)}</div>
              </div>
            `;
          }).join("")}

          ${fairUnavailable ? `
            <div class="fair-warning">
              Fair values are unavailable because population or GDP data is missing for this selection.
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

  function showError(message) {
    const root = document.querySelector(selectors.root);
    if (!root) return;

    root.innerHTML = `<div class="fair-error">${message}</div>`;
  }

  function renderRankingTable() {
    const root = d3.select("#fair-ranking-viz");
    if (root.empty()) return;

    const countries = getAvailableCountries(state.season, state.year);

    const rows = countries.map(country => {
      const data = computeFairCounts(country);

      return {
        country,
        actual: data.actual,
        fair: data.fair
      };
    });

    const actualRanking = rows
      .sort((a, b) =>
        d3.descending(a.actual.Gold, b.actual.Gold) ||
        d3.descending(a.actual.Silver, b.actual.Silver) ||
        d3.descending(a.actual.Bronze, b.actual.Bronze)
      )
      .slice(0, 10);

    const fairRanking = rows
      .sort((a, b) =>
        d3.descending(a.fair.Gold || 0, b.fair.Gold || 0) ||
        d3.descending(a.fair.Silver || 0, b.fair.Silver || 0) ||
        d3.descending(a.fair.Bronze || 0, b.fair.Bronze || 0)
      )
      .slice(0, 10);

    root.html(`
      <div class="fair-ranking-layout">
        ${rankingTable("Actual medal table", actualRanking, "actual")}
        ${rankingTable("Fair medal table", fairRanking, "fair")}
      </div>
    `);
  }

  function rankingTable(title, rows, type) {
    return `
      <div class="fair-ranking-card">
        <h2>${title}</h2>
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
    `;
  }
})();