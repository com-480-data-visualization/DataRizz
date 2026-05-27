/* ============================================================
   Countries That Never Won an Olympic Medal
   ------------------------------------------------------------
   Shows countries that participated but never won any medal.
   Includes:
   - world map of never-medaled countries
   - bar chart by continent or country
   Uses real data from data/olympics.csv
   ============================================================ */

(function () {
  "use strict";

  const DATA_PATH = "data/never_medaled.csv";
  const WORLD_GEOJSON_PATH =
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

  const STOP_YEAR = 2016;

  const selectors = {
    root: "#never-medaled-viz",
    seasonSelect: "#never-season-select",
    modeSelect: "#never-mode-select",
    yearSlider: "#never-year",
    currentYear: "#never-current-year",
    play: "#never-play"
  };

  const state = {
    rows: [],
    columns: {},
    worldGeo: null,
    currentSeason: "Summer",
    currentMode: "continent",
    currentYear: null,
    availableYears: [],
    playing: false,
    timer: null
  };

  const continentOrder = [
    "Africa",
    "Americas",
    "Asia",
    "Europe",
    "Oceania",
    "Other"
  ];

  const continentColors = {
    Africa: "#91d18b",
    Americas: "#8ecae6",
    Asia: "#f4b183",
    Europe: "#a88ad6",
    Oceania: "#f4a6c6",
    Other: "#c9c9c9"
  };

  const countryToContinent = {
    Afghanistan: "Asia",
    Albania: "Europe",
    Algeria: "Africa",
    Andorra: "Europe",
    Angola: "Africa",
    Antigua: "Americas",
    "Antigua and Barbuda": "Americas",
    Argentina: "Americas",
    Armenia: "Europe",
    Aruba: "Americas",
    Australia: "Oceania",
    Austria: "Europe",
    Azerbaijan: "Europe",
    Bahamas: "Americas",
    Bahrain: "Asia",
    Bangladesh: "Asia",
    Barbados: "Americas",
    Belarus: "Europe",
    Belgium: "Europe",
    Belize: "Americas",
    Benin: "Africa",
    Bermuda: "Americas",
    Bhutan: "Asia",
    Bolivia: "Americas",
    "Bosnia and Herzegovina": "Europe",
    Botswana: "Africa",
    Brazil: "Americas",
    Brunei: "Asia",
    Bulgaria: "Europe",
    "Burkina Faso": "Africa",
    Burundi: "Africa",
    Cambodia: "Asia",
    Cameroon: "Africa",
    Canada: "Americas",
    "Cape Verde": "Africa",
    "Central African Republic": "Africa",
    Chad: "Africa",
    Chile: "Americas",
    China: "Asia",
    Colombia: "Americas",
    Comoros: "Africa",
    Congo: "Africa",
    "Democratic Republic of the Congo": "Africa",
    "Cook Islands": "Oceania",
    "Costa Rica": "Americas",
    Croatia: "Europe",
    Cuba: "Americas",
    Cyprus: "Europe",
    Czechia: "Europe",
    Denmark: "Europe",
    Djibouti: "Africa",
    Dominica: "Americas",
    "Dominican Republic": "Americas",
    Ecuador: "Americas",
    Egypt: "Africa",
    "El Salvador": "Americas",
    "Equatorial Guinea": "Africa",
    Eritrea: "Africa",
    Estonia: "Europe",
    Ethiopia: "Africa",
    Fiji: "Oceania",
    Finland: "Europe",
    France: "Europe",
    Gabon: "Africa",
    Gambia: "Africa",
    Georgia: "Europe",
    Germany: "Europe",
    Ghana: "Africa",
    Greece: "Europe",
    Grenada: "Americas",
    Guam: "Oceania",
    Guatemala: "Americas",
    Guinea: "Africa",
    "Guinea-Bissau": "Africa",
    Guyana: "Americas",
    Haiti: "Americas",
    Honduras: "Americas",
    Hungary: "Europe",
    Iceland: "Europe",
    India: "Asia",
    Indonesia: "Asia",
    Iran: "Asia",
    Iraq: "Asia",
    Ireland: "Europe",
    Israel: "Asia",
    Italy: "Europe",
    Jamaica: "Americas",
    Japan: "Asia",
    Jordan: "Asia",
    Kazakhstan: "Asia",
    Kenya: "Africa",
    Kiribati: "Oceania",
    Kosovo: "Europe",
    Kuwait: "Asia",
    Kyrgyzstan: "Asia",
    Laos: "Asia",
    Latvia: "Europe",
    Lebanon: "Asia",
    Lesotho: "Africa",
    Liberia: "Africa",
    Libya: "Africa",
    Liechtenstein: "Europe",
    Lithuania: "Europe",
    Luxembourg: "Europe",
    Madagascar: "Africa",
    Malawi: "Africa",
    Malaysia: "Asia",
    Maldives: "Asia",
    Mali: "Africa",
    Malta: "Europe",
    "Marshall Islands": "Oceania",
    Mauritania: "Africa",
    Mauritius: "Africa",
    Mexico: "Americas",
    Micronesia: "Oceania",
    Moldova: "Europe",
    Monaco: "Europe",
    Mongolia: "Asia",
    Montenegro: "Europe",
    Morocco: "Africa",
    Mozambique: "Africa",
    Myanmar: "Asia",
    Namibia: "Africa",
    Nauru: "Oceania",
    Nepal: "Asia",
    Netherlands: "Europe",
    "New Zealand": "Oceania",
    Nicaragua: "Americas",
    Niger: "Africa",
    Nigeria: "Africa",
    Norway: "Europe",
    Oman: "Asia",
    Pakistan: "Asia",
    Palau: "Oceania",
    Palestine: "Asia",
    Panama: "Americas",
    "Papua New Guinea": "Oceania",
    Paraguay: "Americas",
    Peru: "Americas",
    Philippines: "Asia",
    Poland: "Europe",
    Portugal: "Europe",
    "Puerto Rico": "Americas",
    Qatar: "Asia",
    Romania: "Europe",
    Russia: "Europe",
    Rwanda: "Africa",
    Samoa: "Oceania",
    "San Marino": "Europe",
    "Sao Tome and Principe": "Africa",
    "Saudi Arabia": "Asia",
    Senegal: "Africa",
    Serbia: "Europe",
    Seychelles: "Africa",
    "Sierra Leone": "Africa",
    Singapore: "Asia",
    Slovakia: "Europe",
    Slovenia: "Europe",
    "Solomon Islands": "Oceania",
    Somalia: "Africa",
    "South Africa": "Africa",
    "South Korea": "Asia",
    Spain: "Europe",
    "Sri Lanka": "Asia",
    Sudan: "Africa",
    Suriname: "Americas",
    Sweden: "Europe",
    Switzerland: "Europe",
    Syria: "Asia",
    Taiwan: "Asia",
    Tajikistan: "Asia",
    Tanzania: "Africa",
    Thailand: "Asia",
    "Timor-Leste": "Asia",
    Togo: "Africa",
    Tonga: "Oceania",
    "Trinidad and Tobago": "Americas",
    Tunisia: "Africa",
    Turkey: "Europe",
    Turkmenistan: "Asia",
    Tuvalu: "Oceania",
    Uganda: "Africa",
    Ukraine: "Europe",
    "United Arab Emirates": "Asia",
    "United Kingdom": "Europe",
    "United States": "Americas",
    "United States of America": "Americas",
    Uruguay: "Americas",
    Uzbekistan: "Asia",
    Vanuatu: "Oceania",
    Venezuela: "Americas",
    Vietnam: "Asia",
    Yemen: "Asia",
    Zambia: "Africa",
    Zimbabwe: "Africa"
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const root = document.querySelector(selectors.root);
    if (!root) return;

    if (typeof d3 === "undefined") {
      showError("D3 is not loaded.");
      return;
    }

    showLoading(root);

    try {
      const [rows, worldGeo] = await Promise.all([
        d3.csv(DATA_PATH, d3.autoType),
        d3.json(WORLD_GEOJSON_PATH)
      ]);

      state.rows = rows;
      state.worldGeo = worldGeo;
      state.columns = detectColumns(rows);

      removeLoading(root);
      injectControls(root);
      setupControls();
      setSeason("Summer");
    } catch (error) {
      console.error(error);
      showError("Could not load never-medaled data.");
    }
  }

  function detectColumns(rows) {
    const columns = Object.keys(rows[0] || {});

    return {
      id: findColumn(columns, ["id", "ID", "athlete_id", "Athlete_ID"]),
      country: findColumn(columns, ["country", "Country", "team", "Team", "region", "Region"]),
      noc: findColumn(columns, ["NOC", "noc"]),
      medal: findColumn(columns, ["medal", "Medal"]),
      sport: findColumn(columns, ["sport", "Sport"]),
      year: findColumn(columns, ["year", "Year"]),
      season: findColumn(columns, ["season", "Season"])
    };
  }

  function findColumn(columns, candidates) {
    return candidates.find(candidate => columns.includes(candidate)) || null;
  }

  function injectControls(root) {
    if (root.querySelector(".never-controls")) return;

    root.insertAdjacentHTML("afterbegin", `
      <div class="never-controls">
        <div>
          <label for="never-season-select">Season:</label>
          <select id="never-season-select">
            <option value="Summer">Summer</option>
            <option value="Winter">Winter</option>
          </select>
        </div>

        <div>
          <label for="never-mode-select">Group by:</label>
          <select id="never-mode-select">
            <option value="continent">Continent</option>
            <option value="country">Country</option>
          </select>
        </div>
      </div>
    `);
  }

  function setupControls() {
    d3.select(selectors.seasonSelect).on("change", function () {
      setSeason(this.value);
      broadcastYear(state.currentYear);
    });

    d3.select(selectors.modeSelect).on("change", function () {
      state.currentMode = this.value;
      update();
      broadcastYear(state.currentYear);
    });

    d3.select(selectors.yearSlider).on("input", function () {
      stopPlaying();

      const index = Number(this.value);
      const year = state.availableYears[index];

      if (year !== undefined) {
        state.currentYear = year;
        update();
        broadcastYear(year);
      }
    });

    d3.select(selectors.play).on("click", togglePlay);

    window.addEventListener("olympic-year-change", event => {
      if (event.detail?.source === "never-medaled") return;

      const year = Number(event.detail?.year);
      const season = event.detail?.season || state.currentSeason;
      const mode = event.detail?.mode || state.currentMode;

      if (!Number.isFinite(year)) return;

      state.currentSeason = season;
      d3.select(selectors.seasonSelect).property("value", season);

      state.currentMode = mode;
      d3.select(selectors.modeSelect).property("value", mode);

      state.availableYears = getAvailableYears(season);

      if (state.availableYears.includes(year)) {
        state.currentYear = year;
      } else {
        state.currentYear = state.availableYears.reduce((closest, y) =>
          Math.abs(y - year) < Math.abs(closest - year) ? y : closest
        );
      }

      updateSliderLimits();
      update();
    });
  }

  function setSeason(season) {
    stopPlaying();

    state.currentSeason = season;
    d3.select(selectors.seasonSelect).property("value", season);

    state.availableYears = getAvailableYears(season);

    const previousYear = state.currentYear;
    if (previousYear && state.availableYears.includes(previousYear)) {
      state.currentYear = previousYear;
    } else if (previousYear && state.availableYears.length) {
      state.currentYear = state.availableYears.reduce((closest, y) =>
        Math.abs(y - previousYear) < Math.abs(closest - previousYear) ? y : closest
      );
    } else {
      state.currentYear = state.availableYears[0];
    }

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

    d3.select(selectors.currentYear).text(state.currentYear);
  }

  function update() {
    if (!state.currentYear) return;

    updateSliderLimits();
    render();
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

    if (currentIndex >= lastIndex) return;

    state.playing = true;
    d3.select(selectors.play).text("II");

    playNextYear();
  }

  function playNextYear() {
    if (!state.playing) return;

    const currentIndex = state.availableYears.indexOf(state.currentYear);
    const lastIndex = state.availableYears.length - 1;

    if (currentIndex >= lastIndex) {
      stopPlaying();
      return;
    }

    const nextIndex = currentIndex + 1;
    state.currentYear = state.availableYears[nextIndex];

    update();
    broadcastYear(state.currentYear);

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

  function broadcastYear(year) {
    window.dispatchEvent(new CustomEvent("olympic-year-change", {
      detail: {
        year,
        season: state.currentSeason,
        mode: state.currentMode,
        source: "never-medaled"
      }
    }));
  }

  function render() {
    const root = d3.select(selectors.root);
    root.selectAll(".never-layout, .never-medaled-error").remove();

    const data = computeNeverMedaledCountries();

    if (!data.neverMedaled.length) {
      showError("No never-medaled countries found in the dataset.");
      return;
    }

    const layout = root.append("div")
      .attr("class", "never-layout");

    const mapPanel = layout.append("div")
      .attr("class", "never-map-panel");

    const chartPanel = layout.append("div")
      .attr("class", "never-chart-panel");

    drawMap(mapPanel, data);
    drawBarChart(chartPanel, data.topBars, state.currentMode);
  }

  function computeNeverMedaledCountries() {
    const c = state.columns;

    const rowsForYear = state.rows.filter(row => {
      const rowYear = Number(row[c.year]);
      const rowSeason = String(row[c.season] || "").trim();

      return (
        Number.isFinite(rowYear) &&
        rowYear <= state.currentYear &&
        rowYear <= STOP_YEAR &&
        rowSeason === state.currentSeason
      );
    });

    if (!c.country || !c.medal || !c.sport) {
      throw new Error("Missing required columns: country, medal, or sport.");
    }

    const allCountries = new Map();
    const medalCountries = new Set();

    rowsForYear.forEach(row => {
      const country = normalizeCountryName(cleanCountry(row[c.country]));
      const medal = cleanLabel(row[c.medal]);
      const noc = c.noc ? cleanLabel(row[c.noc]) : "";

      if (country) {
        if (!allCountries.has(country)) {
          allCountries.set(country, {
            country,
            nocCounts: new Map()
          });
        }

        if (noc) {
          const record = allCountries.get(country);
          record.nocCounts.set(noc, (record.nocCounts.get(noc) || 0) + 1);
        }
      }

      if (country && isRealMedal(medal)) {
        medalCountries.add(country);
      }
    });

    const neverMedaledNames = Array.from(allCountries.keys())
      .filter(country => !medalCountries.has(country))
      .sort(d3.ascending);

    const neverSet = new Set(neverMedaledNames);

    const rowsForNeverMedaled = rowsForYear.filter(row => {
      const country = normalizeCountryName(cleanCountry(row[c.country]));
      return neverSet.has(country);
    });

    const byCountry = d3.rollups(
      rowsForNeverMedaled,
      values => {
        const country = normalizeCountryName(cleanCountry(values[0][c.country]));
        const sports = new Set(values.map(row => cleanLabel(row[c.sport])).filter(Boolean));
        const noc = getMostCommonNoc(values, c.noc);
        const continent = getContinent(country, noc);

        return {
          participations: values.length,
          sports: sports.size,
          firstYear: d3.min(values, row => c.year ? Number(row[c.year]) : null),
          lastYear: d3.max(values, row => c.year ? Number(row[c.year]) : null),
          continent
        };
      },
      row => normalizeCountryName(cleanCountry(row[c.country]))
    );

    const neverMedaledData = byCountry
      .map(([country, values]) => ({
        country,
        participations: values.participations,
        sports: values.sports,
        firstYear: values.firstYear,
        lastYear: values.lastYear,
        continent: values.continent
      }))
      .sort((a, b) => d3.descending(a.participations, b.participations));

    const byContinent = continentOrder.map(continent => {
      const countries = neverMedaledData.filter(d => d.continent === continent);

      return {
        continent,
        countries: countries.length,
        participations: d3.sum(countries, d => d.participations)
      };
    }).filter(d => d.countries > 0);

    const topCountries = neverMedaledData.slice(0, 10).map(d => ({
      name: d.country,
      type: "country",
      country: d.country,
      continent: d.continent,
      participations: d.participations,
      sports: d.sports,
      firstYear: d.firstYear,
      lastYear: d.lastYear
    }));

    const topContinents = byContinent
      .map(d => {
        const countries = neverMedaledData.filter(country => country.continent === d.continent);

        return {
          name: d.continent,
          type: "continent",
          continent: d.continent,
          countries: d.countries,
          participations: d.participations,
          sports: d3.sum(countries, country => country.sports),
          firstYear: d3.min(countries, country => country.firstYear),
          lastYear: d3.max(countries, country => country.lastYear)
        };
      })
      .sort((a, b) => d3.descending(a.participations, b.participations));

    return {
      neverMedaled: neverMedaledData,
      neverSet,
      topCountries,
      topContinents,
      topBars: state.currentMode === "continent" ? topContinents : topCountries,
      byContinent
    };
  }

  function drawMap(container, data) {
    const width = 900;
    const height = 520;

    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "never-map-svg");

    const projection = d3.geoNaturalEarth1()
      .fitExtent([[20, 20], [width - 10, height - 16]], state.worldGeo);

    const path = d3.geoPath().projection(projection);

    d3.select(".never-medaled-viz-title").text(
      `Countries That Participated Without Winning a Medal`
    );

    const byCountry = new Map(
      data.neverMedaled.map(d => [normalizeCountryName(d.country), d])
    );

    const tooltip = getTooltip();

    svg.append("g")
      .selectAll("path")
      .data(state.worldGeo.features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const country = normalizeCountryName(d.properties.name);
        const record = byCountry.get(country);

        if (!record) return "#0f0f0f";

        return continentColors[record.continent] || "#aeeaf2";
      })
      .attr("stroke", d => {
        const country = normalizeCountryName(d.properties.name);
        const record = byCountry.get(country);
        return record ? (continentColors[record.continent] || "#aeeaf2") : "#5b5b5b";
      })
      .attr("stroke-width", d => {
        const country = normalizeCountryName(d.properties.name);
        return byCountry.has(country) ? 1.6 : 0.6;
      })
      .style("cursor", d => byCountry.has(normalizeCountryName(d.properties.name)) ? "pointer" : "default")
      .on("mousemove", function (event, d) {
        const rawName = d.properties.name || "Unknown country";
        const country = normalizeCountryName(rawName);
        const record = byCountry.get(country);

        if (record) {
          d3.select(this)
            .attr("stroke-width", 1.8);

          tooltip
            .html(`
              <strong>${record.country}</strong><br>
              Continent: <strong>${record.continent}</strong><br>
              Participations: <strong>${d3.format(",")(record.participations)}</strong><br>
              Sports entered: <strong>${record.sports}</strong><br>
              Years: ${formatYearRange(record.firstYear, record.lastYear)}
            `)
            .style("left", `${event.pageX + 14}px`)
            .style("top", `${event.pageY + 14}px`)
            .style("opacity", 1);
        } else {
          tooltip.style("opacity", 0);
        }
      })
      .on("mouseleave", function () {
        d3.select(this)
          .attr("stroke-width", d => {
            const country = normalizeCountryName(d.properties.name);
            return byCountry.has(country) ? 1.6 : 0.6;
          });

        tooltip.style("opacity", 0);
      });

    const legendData = Object.entries(continentColors);
    const legendY = height - 8;
    const legendItemWidth = width / legendData.length;

    const legend = svg.append("g")
      .attr("transform", `translate(0, ${legendY})`);

    legendData.forEach(([continent, color], i) => {
      const x = i * legendItemWidth + legendItemWidth / 2;

      legend.append("rect")
        .attr("x", x - 28)
        .attr("y", -10)
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("fill", color);

      legend.append("text")
        .attr("x", x - 10)
        .attr("y", 0)
        .attr("dy", "0.1em")
        .attr("fill", "white")
        .attr("font-family", "'Elms Sans', sans-serif")
        .attr("font-size", 16)
        .attr("font-weight", 600)
        .text(continent);
    });
  }

  function drawBarChart(container, data, mode) {
    const width = 620;
    const rowHeight = mode === "continent" ? 42 : 31;
    const margin = { top: 36, right: 150, bottom: 42, left: 150 };
    const height = margin.top + margin.bottom + data.length * rowHeight;

    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "never-medaled-svg");

    const maxValue = d3.max(data, d => d.participations) || 1;

    const x = d3.scaleLinear()
      .domain([0, maxValue])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.18);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .attr("font-family", "Elms Sans, sans-serif")
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .attr("fill", "white")
      .text(mode === "continent"
        ? "Participations without a medal by continent"
        : "Most participations without a medal");

    svg.append("g")
      .selectAll("line")
      .data(x.ticks(4))
      .join("line")
      .attr("x1", d => x(d))
      .attr("x2", d => x(d))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "rgba(255,255,255,0.10)");

    svg.append("g")
      .selectAll("text")
      .data(data)
      .join("text")
      .attr("x", margin.left - 10)
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("fill", "white")
      .attr("font-family", "Elms Sans, sans-serif")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .text(d => shortenLabel(d.name, mode === "continent" ? 18 : 20));

    const tooltip = getTooltip();

    svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", margin.left)
      .attr("y", d => y(d.name))
      .attr("width", d => Math.max(2, x(d.participations) - margin.left))
      .attr("height", y.bandwidth())
      .attr("rx", 7)
      .attr("fill", d => continentColors[d.continent] || "#aeeaf2")
      .attr("opacity", 0.9)
      .on("mousemove", function (event, d) {
        d3.select(this).attr("opacity", 1);

        const detailLine = mode === "continent"
          ? `Countries: <strong>${d.countries}</strong><br>`
          : `Continent: <strong>${d.continent}</strong><br>`;

        tooltip
          .html(`
            <strong>${d.name}</strong><br>
            ${detailLine}
            Participations: <strong>${d3.format(",")(d.participations)}</strong><br>
            Sports entered: <strong>${d.sports}</strong><br>
            Years: ${formatYearRange(d.firstYear, d.lastYear)}
          `)
          .style("left", `${event.pageX + 14}px`)
          .style("top", `${event.pageY + 14}px`)
          .style("opacity", 1);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 0.9);
        tooltip.style("opacity", 0);
      });

    svg.append("g")
      .selectAll("text")
      .data(data)
      .join("text")
      .attr("x", d => x(d.participations) + 8)
      .attr("y", d => y(d.name) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-family", "Elms Sans, sans-serif")
      .attr("font-size", 12)
      .attr("font-weight", 700)
      .text(d => {
        if (mode === "continent") {
          return `${d3.format(",")(d.participations)} · ${d.countries} countries`;
        }

        return `${d3.format(",")(d.participations)} · ${d.sports} sports`;
      });

    const xAxis = d3.axisBottom(x)
      .ticks(4)
      .tickFormat(d3.format(","));

    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .call(g => g.select(".domain").attr("stroke", "rgba(255,255,255,0.35)"))
      .call(g => g.selectAll("line").attr("stroke", "rgba(255,255,255,0.35)"))
      .call(g => g.selectAll("text")
        .attr("fill", "rgba(255,255,255,0.75)")
        .attr("font-family", "Elms Sans, sans-serif")
        .attr("font-size", 14))
        .attr("font-weight", 700);

    svg.append("text")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", height - 8)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.72)")
      .attr("font-family", "Elms Sans, sans-serif")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .text("Athlete participations");
  }

  function getMostCommonNoc(values, nocCol) {
    if (!nocCol) return "";

    const counts = d3.rollups(
      values,
      v => v.length,
      row => cleanLabel(row[nocCol])
    ).filter(([noc]) => noc);

    counts.sort((a, b) => d3.descending(a[1], b[1]));

    return counts[0] ? counts[0][0] : "";
  }

  function getContinent(country, noc) {
    const normalized = normalizeCountryName(country);

    if (countryToContinent[normalized]) {
      return countryToContinent[normalized];
    }

    const nocToContinent = {
      AFG: "Asia", ALB: "Europe", ALG: "Africa", AND: "Europe", ANG: "Africa",
      ANT: "Americas", ARG: "Americas", ARM: "Europe", ARU: "Americas",
      ASA: "Oceania", AUS: "Oceania", AUT: "Europe", AZE: "Europe",
      BAH: "Americas", BAN: "Asia", BAR: "Americas", BDI: "Africa",
      BEL: "Europe", BEN: "Africa", BER: "Americas", BHU: "Asia",
      BIH: "Europe", BIZ: "Americas", BLR: "Europe", BOL: "Americas",
      BOT: "Africa", BRA: "Americas", BRN: "Asia", BRU: "Asia",
      BUL: "Europe", BUR: "Africa", CAF: "Africa", CAM: "Asia",
      CAN: "Americas", CAY: "Americas", CGO: "Africa", CHA: "Africa",
      CHI: "Americas", CHN: "Asia", CIV: "Africa", CMR: "Africa",
      COD: "Africa", COK: "Oceania", COL: "Americas", COM: "Africa",
      CPV: "Africa", CRC: "Americas", CRO: "Europe", CUB: "Americas",
      CYP: "Europe", CZE: "Europe", DEN: "Europe", DJI: "Africa",
      DMA: "Americas", DOM: "Americas", ECU: "Americas", EGY: "Africa",
      ERI: "Africa", ESA: "Americas", ESP: "Europe", EST: "Europe",
      ETH: "Africa", FIJ: "Oceania", FIN: "Europe", FRA: "Europe",
      GAB: "Africa", GAM: "Africa", GBR: "Europe", GBS: "Africa",
      GEO: "Europe", GEQ: "Africa", GER: "Europe", GHA: "Africa",
      GRE: "Europe", GRN: "Americas", GUA: "Americas", GUI: "Africa",
      GUM: "Oceania", GUY: "Americas", HAI: "Americas", HKG: "Asia",
      HON: "Americas", HUN: "Europe", INA: "Asia", IND: "Asia",
      IRI: "Asia", IRL: "Europe", IRQ: "Asia", ISL: "Europe",
      ISR: "Asia", ISV: "Americas", ITA: "Europe", IVB: "Americas",
      JAM: "Americas", JOR: "Asia", JPN: "Asia", KAZ: "Asia",
      KEN: "Africa", KGZ: "Asia", KIR: "Oceania", KOR: "Asia",
      KSA: "Asia", KUW: "Asia", LAO: "Asia", LAT: "Europe",
      LBA: "Africa", LBR: "Africa", LCA: "Americas", LES: "Africa",
      LIB: "Asia", LIE: "Europe", LTU: "Europe", LUX: "Europe",
      MAD: "Africa", MAR: "Africa", MAS: "Asia", MAW: "Africa",
      MDA: "Europe", MDV: "Asia", MEX: "Americas", MGL: "Asia",
      MHL: "Oceania", MKD: "Europe", MLI: "Africa", MLT: "Europe",
      MNE: "Europe", MON: "Europe", MOZ: "Africa", MRI: "Africa",
      MTN: "Africa", MYA: "Asia", NAM: "Africa", NCA: "Americas",
      NEP: "Asia", NGR: "Africa", NIG: "Africa", NRU: "Oceania",
      OMA: "Asia", PAK: "Asia", PAN: "Americas", PAR: "Americas",
      PER: "Americas", PHI: "Asia", PLE: "Asia", PLW: "Oceania",
      PNG: "Oceania", PRK: "Asia", PUR: "Americas", QAT: "Asia",
      RHO: "Africa", ROU: "Europe", RWA: "Africa", SAM: "Oceania",
      SEN: "Africa", SEY: "Africa", SGP: "Asia", SKN: "Americas",
      SLE: "Africa", SMR: "Europe", SOL: "Oceania", SOM: "Africa",
      SRI: "Asia", SSD: "Africa", STP: "Africa", SUD: "Africa",
      SUR: "Americas", SWZ: "Africa", SYR: "Asia", TAN: "Africa",
      TGA: "Oceania", THA: "Asia", TJK: "Asia", TKM: "Asia",
      TLS: "Asia", TOG: "Africa", TPE: "Asia", TTO: "Americas",
      TUN: "Africa", TUV: "Oceania", UAE: "Asia", UGA: "Africa",
      URU: "Americas", VAN: "Oceania", VEN: "Americas", VIE: "Asia",
      VIN: "Americas", YEM: "Asia", ZAM: "Africa", ZIM: "Africa"
    };

    return nocToContinent[noc] || "Other";
  }

  function cleanLabel(value) {
    return String(value || "").trim();
  }

  function cleanCountry(value) {
    return String(value || "")
      .replace(/\s*-\s*\d+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeCountryName(name) {
    const raw = String(name || "").trim();
    const key = raw.toLowerCase();

    const aliases = {
      usa: "United States of America",
      "united states": "United States of America",
      "united states of america": "United States of America",
      uk: "United Kingdom",
      "great britain": "United Kingdom",
      britain: "United Kingdom",
      england: "United Kingdom",
      "russian federation": "Russia",
      ussr: "Russia",
      "soviet union": "Russia",
      "south korea": "South Korea",
      "korea, south": "South Korea",
      "north korea": "North Korea",
      "korea, north": "North Korea",
      "czech republic": "Czechia",
      "ivory coast": "Côte d'Ivoire",
      "cote d'ivoire": "Côte d'Ivoire",
      laos: "Laos",
      "bosnia-herzegovina": "Bosnia and Herzegovina",
      "bosnia herzegovina": "Bosnia and Herzegovina",
      "sao tome & principe": "Sao Tome and Principe",
      "sao tome and principe": "Sao Tome and Principe",
      trinidad: "Trinidad and Tobago",
      antigua: "Antigua",
      "cape verde": "Cape Verde",
      "democratic republic of congo": "Democratic Republic of the Congo",
      "dr congo": "Democratic Republic of the Congo",
      congo: "Congo",
      "timor leste": "Timor-Leste"
    };

    return aliases[key] || raw;
  }

  function isRealMedal(value) {
    const text = String(value || "").trim().toLowerCase();

    return (
      text === "gold" ||
      text === "silver" ||
      text === "bronze"
    );
  }

  function shortenLabel(value, maxLength) {
    const text = String(value || "");

    if (text.length <= maxLength) return text;

    return `${text.slice(0, maxLength - 1)}…`;
  }

  function formatYearRange(firstYear, lastYear) {
    if (!Number.isFinite(firstYear) || !Number.isFinite(lastYear)) {
      return "unknown";
    }

    if (firstYear === lastYear) {
      return String(firstYear);
    }

    return `${firstYear}–${lastYear}`;
  }

  function getTooltip() {
    let tooltip = d3.select("body").select(".never-medaled-tooltip");

    if (tooltip.empty()) {
      tooltip = d3.select("body")
        .append("div")
        .attr("class", "never-medaled-tooltip");
    }

    return tooltip;
  }

  function showLoading(root) {
    root.classList.add("is-loading");
    const div = document.createElement("div");
    div.className = "never-loading";
    div.textContent = "Loading data, please wait…";
    root.appendChild(div);
  }

  function removeLoading(root) {
    root.classList.remove("is-loading");
    root.querySelectorAll(".never-loading").forEach(el => el.remove());
  }

  function showError(message) {
    const root = d3.select(selectors.root);

    root.selectAll(".never-layout, .never-medaled-error").remove();

    root
      .append("div")
      .attr("class", "never-medaled-error")
      .text(message);
  }
})();