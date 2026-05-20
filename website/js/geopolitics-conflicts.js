/* ============================================================
   Geopolitical Conflicts Visualization
   ------------------------------------------------------------
   Story logic:
   - Click an event in the text list to update the map.
   - The selected event is highlighted fully in yellow.
   - Boycott years show a button for participation impact.
   - Clicking the button opens a popup bar chart.
   - Clicking a highlighted country opens a popup medal chart.
   - Charts only show Summer Olympic years that exist in the dataset.
   - Bar tooltips show previous and next Summer Olympics comparison,
     including how much more or less the selected bar has.
   ============================================================ */

(function () {
  "use strict";

  const DATA_PATH = "data/olympics.csv";
  const WORLD_GEOJSON_PATH =
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

  const selectors = {
    mapRoot: "#geopolitics-map-viz",
    eventList: "#geo-event-list",
    participationButton: "#geo-participation-button"
  };

  const boycottYears = new Set([1976, 1980, 1984]);

  const state = {
    rows: [],
    columns: {},
    olympicYears: [],
    currentYear: null,
    worldGeo: null,
    events: []
  };

  const geopoliticalEvents = [
    {
      year: 1896,
      title: "First modern Olympics",
      description: "Athens hosted the first modern Olympic Games.",
      countries: ["Greece"],
      countryNotes: {
        Greece: "Host country of the first modern Olympic Games."
      }
    },
    {
      year: 1900,
      title: "Paris Olympics and first women athletes",
      description: "Women participated in the Olympic Games for the first time.",
      countries: ["France"],
      countryNotes: {
        France: "Host country where women first participated in the Olympic Games."
      }
    },
    {
      year: 1916,
      title: "Olympics cancelled during World War I",
      description: "The 1916 Olympic Games were cancelled because of World War I.",
      countries: ["Germany", "France", "United Kingdom", "Russia", "Austria"],
      countryNotes: {
        Germany: "Involved in World War I; the 1916 Games were cancelled during the conflict.",
        France: "Involved in World War I; the 1916 Games were cancelled during the conflict.",
        "United Kingdom": "Involved in World War I; the 1916 Games were cancelled during the conflict.",
        Russia: "Involved in World War I; the 1916 Games were cancelled during the conflict.",
        Austria: "Involved in World War I; the 1916 Games were cancelled during the conflict."
      }
    },
    {
      year: 1920,
      title: "Olympics resume after World War I",
      description: "The Antwerp Games marked the return of the Olympics after World War I.",
      countries: ["Belgium"],
      countryNotes: {
        Belgium: "Host country of the first Olympics after World War I."
      }
    },
    {
      year: 1936,
      title: "Berlin Olympics",
      description: "The Berlin Olympics were heavily used for political propaganda.",
      countries: ["Germany"],
      countryNotes: {
        Germany: "Host country of the Berlin Olympics, used heavily for Nazi propaganda."
      }
    },
    {
      year: 1940,
      title: "Olympics cancelled during World War II",
      description: "The 1940 Olympic Games were cancelled because of World War II.",
      countries: ["Germany", "Italy", "Japan", "France", "United Kingdom"],
      countryNotes: {
        Germany: "Major power involved in World War II; the 1940 Games were cancelled.",
        Italy: "Major power involved in World War II; the 1940 Games were cancelled.",
        Japan: "Major power involved in World War II; the 1940 Games were cancelled.",
        France: "Affected by World War II; the 1940 Games were cancelled.",
        "United Kingdom": "Affected by World War II; the 1940 Games were cancelled."
      }
    },
    {
      year: 1944,
      title: "Olympics cancelled during World War II",
      description: "The 1944 Olympic Games were also cancelled because of World War II.",
      countries: ["Germany", "Italy", "Japan", "United States of America", "United Kingdom", "Russia"],
      countryNotes: {
        Germany: "Major power involved in World War II; the 1944 Games were cancelled.",
        Italy: "Major power involved in World War II; the 1944 Games were cancelled.",
        Japan: "Major power involved in World War II; the 1944 Games were cancelled.",
        "United States of America": "Involved in World War II; the 1944 Games were cancelled.",
        "United Kingdom": "Involved in World War II; the 1944 Games were cancelled.",
        Russia: "Involved in World War II; the 1944 Games were cancelled."
      }
    },
    {
      year: 1948,
      title: "London austerity Games",
      description: "The first Olympics after World War II were hosted in London.",
      countries: ["United Kingdom"],
      countryNotes: {
        "United Kingdom": "Host country of the first Olympic Games after World War II."
      }
    },
    {
      year: 1956,
      title: "Melbourne Olympics during geopolitical tensions",
      description: "The Melbourne Games took place during the Suez Crisis and the Hungarian Revolution.",
      countries: ["Australia", "Egypt", "Hungary", "Russia", "Netherlands", "Spain", "Switzerland"],
      countryNotes: {
        Australia: "Host country of the 1956 Olympics.",
        Egypt: "Involved in the Suez Crisis; several nations boycotted.",
        Hungary: "The Hungarian Revolution shaped the political atmosphere of the Games.",
        Russia: "The Soviet role in Hungary strongly affected the political context.",
        Netherlands: "Boycotted the Games over the Soviet invasion of Hungary.",
        Spain: "Boycotted the Games over the Soviet invasion of Hungary.",
        Switzerland: "Boycotted the Games over the Soviet invasion of Hungary."
      }
    },
    {
      year: 1968,
      title: "Mexico City Olympics",
      description: "The Games were marked by the Black Power salute and broader political tensions.",
      countries: ["Mexico", "United States of America"],
      countryNotes: {
        Mexico: "Host country of the 1968 Olympics.",
        "United States of America": "American athletes Tommie Smith and John Carlos gave the Black Power salute."
      }
    },
    {
      year: 1972,
      title: "Munich attack",
      description: "The Munich Olympics were marked by a terrorist attack on the Israeli team.",
      countries: ["Germany", "Israel"],
      countryNotes: {
        Germany: "Host country where the Munich attack took place.",
        Israel: "The Israeli Olympic team was targeted in the Munich attack."
      }
    },
    {
      year: 1976,
      title: "Montreal boycott",
      description: "Several African nations boycotted the Games after the IOC refused to ban New Zealand, whose rugby team had maintained sporting relations with apartheid-era South Africa.",
      countries: [
        "Canada",
        "New Zealand",
        "Kenya",
        "Tanzania",
        "Nigeria",
        "Ethiopia",
        "Ghana",
        "Uganda",
        "Zambia"
      ],
      countryNotes: {
        Canada: "Host country of the 1976 Montreal Olympics.",
        "New Zealand": "Its rugby contacts with apartheid South Africa triggered the boycott.",
        Kenya: "One of the African nations that boycotted the 1976 Olympics.",
        Tanzania: "One of the African nations that boycotted the 1976 Olympics.",
        Nigeria: "One of the African nations that boycotted the 1976 Olympics.",
        Ethiopia: "One of the African nations that boycotted the 1976 Olympics.",
        Ghana: "One of the African nations that boycotted the 1976 Olympics.",
        Uganda: "One of the African nations that boycotted the 1976 Olympics.",
        Zambia: "One of the African nations that boycotted the 1976 Olympics."
      }
    },
    {
      year: 1980,
      title: "Moscow boycott",
      description: "The United States and many allies boycotted the Moscow Olympics.",
      countries: [
        "Russia",
        "United States of America",
        "Canada",
        "Japan",
        "China",
        "United Kingdom",
        "West Germany"
      ],
      countryNotes: {
        Russia: "Host country of the Moscow Olympics, then the USSR.",
        "United States of America": "Led the boycott of the 1980 Moscow Olympics.",
        Canada: "Joined the boycott led by the United States.",
        Japan: "Joined the boycott led by the United States.",
        China: "Part of the countries aligned against the Moscow Olympics.",
        "United Kingdom": "Partially joined the 1980 boycott context.",
        "West Germany": "Joined the boycott of the Moscow Olympics."
      }
    },
    {
      year: 1984,
      title: "Los Angeles boycott",
      description: "The USSR and several allies boycotted the Los Angeles Olympics.",
      countries: [
        "United States of America",
        "Russia",
        "Cuba",
        "Bulgaria",
        "Poland",
        "Hungary",
        "Mongolia",
        "Vietnam"
      ],
      countryNotes: {
        "United States of America": "Host country of the 1984 Los Angeles Olympics.",
        Russia: "Led the boycott of the Los Angeles Olympics, then the USSR.",
        Cuba: "Boycotted the 1984 Olympics with the Soviet bloc.",
        Bulgaria: "Boycotted the 1984 Olympics with the Soviet bloc.",
        Poland: "Boycotted the 1984 Olympics with the Soviet bloc.",
        Hungary: "Boycotted the 1984 Olympics with the Soviet bloc.",
        Mongolia: "Boycotted the 1984 Olympics with the Soviet bloc.",
        Vietnam: "Boycotted the 1984 Olympics with the Soviet bloc."
      }
    },
    {
      year: 1992,
      title: "Barcelona after the Cold War",
      description: "The Barcelona Games took place after the end of the Cold War.",
      countries: ["Spain", "Germany", "Russia"],
      countryNotes: {
        Spain: "Host country of the 1992 Barcelona Olympics.",
        Germany: "Competed in a new post-Cold-War context.",
        Russia: "Competed in a new post-Cold-War context after the end of the USSR."
      }
    },
    {
      year: 2008,
      title: "Beijing Olympics",
      description: "The Beijing Games were a major global showcase for China.",
      countries: ["China"],
      countryNotes: {
        China: "Host country of the 2008 Beijing Olympics."
      }
    },
    {
      year: 2012,
      title: "London Olympics and women in every sport",
      description: "The London Games were the first Olympics with women competing in every sport.",
      countries: ["United Kingdom"],
      countryNotes: {
        "United Kingdom": "Host country of the 2012 London Olympics."
      }
    },
    {
      year: 2016,
      title: "Rio Olympics",
      description: "The Rio Games were the first Olympics hosted in South America.",
      countries: ["Brazil"],
      countryNotes: {
        Brazil: "Host country of the first Olympics held in South America."
      }
    }
  ];

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!document.querySelector(selectors.mapRoot)) return;

    if (typeof d3 === "undefined") {
      console.error("D3 is not loaded.");
      return;
    }

    try {
      const [rows, worldGeo] = await Promise.all([
        d3.csv(DATA_PATH, d3.autoType),
        d3.json(WORLD_GEOJSON_PATH)
      ]);

      state.rows = rows;
      state.columns = detectColumns(rows);

      // IMPORTANT:
      // This keeps only Summer Olympic years, so the charts no longer show
      // empty Winter-only years such as 1984, 1994, 1998, 2002, 2006.
      state.olympicYears = getSummerOlympicYears(rows);

      state.worldGeo = worldGeo;

      state.events = geopoliticalEvents.map(event => ({
        ...event,
        hasOlympicData: state.olympicYears.includes(event.year)
      }));

      ensureTooltip();

      const initialYear = state.events[0]?.year || state.olympicYears[0];
      update(initialYear);
    } catch (error) {
      console.error(error);
      showGeoError("Could not load the geopolitics data.");
    }
  }

  function detectColumns(rows) {
    if (!rows || !rows.length) throw new Error("CSV is empty.");

    const columns = Object.keys(rows[0]);

    return {
      year: findColumn(columns, ["Year", "year"]),
      season: findColumn(columns, ["Season", "season"]),
      country: findColumn(columns, ["Country", "country", "Team", "team", "region", "Region", "NOC", "noc"]),
      medal: findColumn(columns, ["Medal", "medal"]),
      event: findColumn(columns, ["Event", "event"])
    };
  }

  function findColumn(columns, candidates) {
    return candidates.find(c => columns.includes(c)) || null;
  }

  function getSummerOlympicYears(rows) {
    const yearCol = state.columns.year || "Year";
    const seasonCol = state.columns.season || "Season";

    return Array.from(
      new Set(
        rows
          .filter(row => String(row[seasonCol] || "").trim() === "Summer")
          .map(row => Number(row[yearCol]))
          .filter(v => Number.isFinite(v))
      )
    ).sort((a, b) => a - b);
  }

  function update(year) {
    const selected = state.events.find(d => d.year === year) || state.events[0];

    state.currentYear = selected.year;

    drawMapPanel(selected);
    drawEventList(selected);
    updateActionButton(selected);
  }

  function updateActionButton(selected) {
    const button = d3.select(selectors.participationButton);

    if (boycottYears.has(selected.year)) {
      button
        .classed("visible", true)
        .text("Click to see how this boycott influenced participation")
        .on("click", () => {
          const participationData = addNeighborValues(
            computeParticipationAroundYear(selected.year, 16)
          );

          openGeoPopup(
            `Participating countries around the ${selected.year} boycott`,
            buildSelectedYearNote({
              selectedYear: selected.year,
              selectedLabel: selected.title,
              metricName: "participating countries",
              data: participationData,
              noDataReason: "This chart only shows Summer Olympic years present in the dataset."
            }),
            () => {
              drawBarChart({
                selector: "#geo-popup-chart",
                data: participationData,
                xKey: "year",
                yKey: "value",
                title: `Participation around ${selected.year}`,
                yLabel: "Participating countries",
                highlightValue: selected.year,
                tooltipFormatter: d => formatNeighborTooltip(d, "Participating countries")
              });
            }
          );
        });
    } else {
      button
        .classed("visible", false)
        .on("click", null);
    }
  }

  /* ============================================================
     Data computations
     ============================================================ */

  function computeParticipationAroundYear(selectedYear, windowSize) {
    const { year: yearCol, season: seasonCol, country: countryCol } = state.columns;
    if (!yearCol || !countryCol) return [];

    const minYear = selectedYear - windowSize;
    const maxYear = selectedYear + windowSize;

    // Only Summer Olympic years are used here.
    const relevantYears = state.olympicYears
      .filter(year => year >= minYear && year <= maxYear)
      .sort((a, b) => a - b);

    return relevantYears.map(year => {
      const countries = new Set();

      state.rows.forEach(row => {
        const rowYear = Number(row[yearCol]);
        const season = seasonCol ? String(row[seasonCol] || "").trim() : "Summer";

        if (rowYear === year && season === "Summer") {
          countries.add(cleanCountryName(row[countryCol]));
        }
      });

      return {
        year,
        value: countries.size
      };
    });
  }

  function computeCountryMedalsAcrossYears(countryName, selectedYear, windowSize) {
    const {
      year: yearCol,
      season: seasonCol,
      country: countryCol,
      medal: medalCol,
      event: eventCol
    } = state.columns;

    if (!yearCol || !countryCol || !medalCol) return [];

    const minYear = selectedYear - windowSize;
    const maxYear = selectedYear + windowSize;

    // Only Summer Olympic years are used here.
    const relevantYears = state.olympicYears
      .filter(year => year >= minYear && year <= maxYear)
      .sort((a, b) => a - b);

    return relevantYears.map(year => {
      const medalKeys = new Set();
      let participated = false;

      state.rows.forEach(row => {
        const rowYear = Number(row[yearCol]);
        const season = seasonCol ? String(row[seasonCol] || "").trim() : "Summer";
        const rowCountry = normalizeCountryName(cleanCountryName(row[countryCol]));

        if (
          rowYear === year &&
          season === "Summer" &&
          rowCountry === countryName
        ) {
          participated = true;

          if (isRealMedal(row[medalCol])) {
            const eventName = eventCol ? String(row[eventCol] || "Unknown Event") : "Unknown Event";
            const medalName = medalCol ? String(row[medalCol] || "") : "";
            medalKeys.add(`${eventName}|||${medalName}`);
          }
        }
      });

      return {
        year,
        value: medalKeys.size,
        participated
      };
    });
  }

  function addNeighborValues(data) {
    return data.map((d, i) => ({
      ...d,
      previousYear: data[i - 1] ? data[i - 1].year : null,
      previousValue: data[i - 1] ? data[i - 1].value : null,
      nextYear: data[i + 1] ? data[i + 1].year : null,
      nextValue: data[i + 1] ? data[i + 1].value : null
    }));
  }

  function isRealMedal(value) {
    if (value === null || value === undefined) return false;

    const text = String(value).trim().toLowerCase();

    return (
      text !== "" &&
      text !== "na" &&
      text !== "nan" &&
      text !== "none"
    );
  }

  /* ============================================================
     Map
     ============================================================ */

  function drawMapPanel(selected) {
    const root = d3.select(selectors.mapRoot);
    root.selectAll("*").remove();

    const width = 980;
    const height = 520;

    const svg = root
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "geo-map-svg");

    const projection = d3.geoNaturalEarth1()
      .fitExtent([[20, 20], [width - 20, height - 20]], state.worldGeo);

    const path = d3.geoPath().projection(projection);

    const involvedCountries = new Set(
      (selected.countries || []).map(name => normalizeCountryName(name))
    );

    svg.append("g")
      .selectAll("path")
      .data(state.worldGeo.features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const countryName = normalizeCountryName(d.properties.name);
        return involvedCountries.has(countryName) ? "#f4b400" : "#0f0f0f";
      })
      .attr("stroke", d => {
        const countryName = normalizeCountryName(d.properties.name);
        return involvedCountries.has(countryName) ? "#ffd166" : "#5b5b5b";
      })
      .attr("stroke-width", d => {
        const countryName = normalizeCountryName(d.properties.name);
        return involvedCountries.has(countryName) ? 1.6 : 0.6;
      })
      .style("cursor", d => {
        const countryName = normalizeCountryName(d.properties.name);
        return involvedCountries.has(countryName) ? "pointer" : "default";
      })
      .on("mousemove", function (event, d) {
        const rawName = d.properties.name || "Unknown country";
        const countryName = normalizeCountryName(rawName);
        const isInvolved = involvedCountries.has(countryName);

        if (isInvolved) {
          const note =
            getCountryNote(selected, countryName) ||
            selected.description ||
            "Involved in this geopolitical event.";

          showTooltip(event, `
            <strong>${rawName}</strong><br>
            <span style="color:#ffd166;">${selected.year} — ${selected.title}</span><br>
            ${note}<br>
            <span style="color:#f4b400;">Click to see medal performance</span>
          `);
        } else {
          showTooltip(
            event,
            `<strong>${rawName}</strong><br>Not specifically highlighted for ${selected.year}.`
          );
        }
      })
      .on("mouseleave", hideTooltip)
      .on("click", function (event, d) {
        const countryName = normalizeCountryName(d.properties.name || "");

        if (!involvedCountries.has(countryName)) return;

        openCountryMedalPopup(countryName, selected);
      });

    d3.select("#geo-hover-text")
      .text(`Hover countries to see how they are involved in ${selected.year}.`);
  }

  function openCountryMedalPopup(countryName, selected) {
    const data = addNeighborValues(
      computeCountryMedalsAcrossYears(countryName, selected.year, 16)
    );

    const selectedRow = data.find(d => d.year === selected.year);
    const selectedValue = selectedRow ? selectedRow.value : null;

    let note;

    if (!state.olympicYears.includes(selected.year)) {
      note = `${selected.year} does not appear in the Summer Olympic dataset because the Games were cancelled or not held. The chart skips that year and only shows nearby Summer Olympic Games.`;
    } else if (!selectedRow) {
      note = `${countryName} has no data point in ${selected.year}. The chart only shows Summer Olympic years present in the dataset.`;
    } else if (!selectedRow.participated) {
      note = `${countryName} has no participation data in ${selected.year}. For boycott years, this usually means the country was absent from the Games.`;
    } else if (selectedValue === 0) {
      note = `${countryName} participated in ${selected.year}, but won no medals in this dataset.`;
    } else {
      note = `${countryName} won ${selectedValue} medal${selectedValue === 1 ? "" : "s"} in ${selected.year}.`;
    }

    openGeoPopup(
      `${countryName}: medals around ${selected.year}`,
      note,
      () => {
        drawBarChart({
          selector: "#geo-popup-chart",
          data,
          xKey: "year",
          yKey: "value",
          yLabel: "Medals won",
          highlightValue: selected.year,
          tooltipFormatter: d => formatNeighborTooltip(d, "Medals")
        });
      }
    );
  }

  function getCountryNote(selected, countryName) {
    if (!selected.countryNotes) return null;

    const entries = Object.entries(selected.countryNotes);

    for (const [key, value] of entries) {
      if (normalizeCountryName(key) === countryName) {
        return value;
      }
    }

    return null;
  }

  function cleanCountryName(value) {
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
      ussr: "Russia",
      "soviet union": "Russia",
      "russian federation": "Russia",
      russia: "Russia",
      "west germany": "Germany",
      "east germany": "Germany",
      "south korea": "South Korea",
      "north korea": "North Korea",
      vietnam: "Vietnam",
      laos: "Laos",
      tanzania: "Tanzania",
      "czech republic": "Czechia"
    };

    return aliases[key] || raw;
  }

  /* ============================================================
     Event list
     ============================================================ */

  function drawEventList(selected) {
    const root = d3.select(selectors.eventList);
    root.selectAll("*").remove();

    root.append("h3").text("Some interesting years:");

    root.append("p")
      .attr("class", "geo-highlight-event")
      .html(`<strong>${selected.year}: ${selected.title}</strong>`);

    root.append("p")
      .attr("class", "geo-event-description")
      .text(selected.description);

    if (!selected.hasOlympicData) {
      root.append("p")
        .attr("class", "geo-note")
        .text("No Summer Olympic competition data exists in the CSV for this year because the Games were cancelled or absent.");
    }

    const list = root.append("ul").attr("class", "geo-events-list");

    state.events.forEach(d => {
      list.append("li")
        .classed("active", d.year === selected.year)
        .html(`<strong>${d.year}:</strong> <span>${d.title.replace(/boycott/gi, '<strong style="color:#ffd166;">boycott</strong>')}</span>`)
        .on("click", () => update(d.year));
    });
  }

  /* ============================================================
     Bar charts
     ============================================================ */

  function drawBarChart({
    selector,
    data,
    xKey,
    yKey,
    title,
    yLabel,
    highlightValue = null,
    tooltipFormatter = null
  }) {
    const root = d3.select(selector);
    root.selectAll("*").remove();

    const width = 880;
    const height = 330;
    const margin = { top: 48, right: 28, bottom: 72, left: 76 };

    const svg = root
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "geo-bar-svg");

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 24)
      .attr("font-family", "Arial, sans-serif")
      .attr("font-size", 18)
      .attr("font-weight", 700)
      .attr("fill", "white")
      .text(title);

    if (!data || data.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-family", "Arial, sans-serif")
        .attr("font-size", 22)
        .attr("fill", "white")
        .text("No data available");
      return;
    }

    const x = d3.scaleBand()
      .domain(data.map(d => String(d[xKey])))
      .range([margin.left, width - margin.right])
      .padding(0.25);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[yKey]) || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.append("g")
      .attr("stroke", "rgba(255,255,255,0.12)")
      .selectAll("line")
      .data(y.ticks(5))
      .join("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d));

    svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(String(d[xKey])))
      .attr("y", d => y(d[yKey]))
      .attr("width", x.bandwidth())
      .attr("height", d => y(0) - y(d[yKey]))
      .attr("rx", 4)
      .attr("fill", d => {
        if (highlightValue !== null && String(d[xKey]) === String(highlightValue)) {
          return "#f4b400";
        }

        return "#8ecae6";
      })
      .attr("stroke", d => {
        if (highlightValue !== null && String(d[xKey]) === String(highlightValue)) {
          return "#ffd166";
        }

        return "#d8f3ff";
      })
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mousemove", function (event, d) {
        const html = tooltipFormatter
          ? tooltipFormatter(d)
          : `<strong>${d[xKey]}</strong><br>${yLabel}: ${d[yKey]}`;

        showTooltip(event, html);
      })
      .on("mouseleave", hideTooltip);

    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .call(g => g.selectAll("text")
        .attr("fill", "white")
        .attr("font-family", "Arial, sans-serif")
        .attr("font-size", 12)
        .attr("transform", "rotate(-28)")
        .attr("text-anchor", "end"))
      .call(g => g.selectAll("path,line").attr("stroke", "white"));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.selectAll("text")
        .attr("fill", "white")
        .attr("font-family", "Arial, sans-serif")
        .attr("font-size", 12))
      .call(g => g.selectAll("path,line").attr("stroke", "white"));

    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 42)
      .attr("fill", "rgba(255,255,255,0.72)")
      .attr("font-family", "Arial, sans-serif")
      .attr("font-size", 12)
      .text(yLabel);
  }

  function formatNeighborTooltip(d, metricName) {
    const previousDiff = d.previousValue === null
      ? null
      : d.value - d.previousValue;

    const nextDiff = d.nextValue === null
      ? null
      : d.value - d.nextValue;

    const previous = d.previousYear === null
      ? "No previous Summer Olympics in this view"
      : `${d.previousYear}: ${d.previousValue} (${formatDifference(previousDiff)} vs previous)`;

    const next = d.nextYear === null
      ? "No next Summer Olympics in this view"
      : `${d.nextYear}: ${d.nextValue} (${formatDifference(nextDiff)} vs next)`;

    return `
      <strong>${d.year}</strong><br>
      ${metricName}: <strong>${d.value}</strong><br>
      Previous Summer Olympics: ${previous}<br>
      Next Summer Olympics: ${next}
    `;
  }

  function formatDifference(diff) {
    if (diff === null || diff === undefined) {
      return "no comparison";
    }

    if (diff > 0) {
      return `+${diff}`;
    }

    if (diff < 0) {
      return `${diff}`;
    }

    return "same";
  }

  function buildSelectedYearNote({
    selectedYear,
    selectedLabel,
    metricName,
    data,
    noDataReason
  }) {
    const selectedRow = data.find(d => d.year === selectedYear);

    if (!state.olympicYears.includes(selectedYear)) {
      return `${selectedYear} does not appear in the Summer Olympic dataset because the Games were cancelled or not held. The chart skips that year and only shows nearby Summer Olympic Games.`;
    }

    if (!selectedRow) {
      return `${selectedYear} is not shown as a bar because there is no Summer Olympic data for that year in the selected window. ${noDataReason}`;
    }

    return `${selectedYear}: ${selectedLabel}. The highlighted bar shows ${selectedRow.value} ${metricName}. Hover over any bar to compare it with the previous and next Summer Olympics shown.`;
  }

  /* ============================================================
     Popup
     ============================================================ */

  function openGeoPopup(title, note, drawCallback) {
    d3.select("body").select(".geo-popup-overlay").remove();

    const overlay = d3.select("body")
      .append("div")
      .attr("class", "geo-popup-overlay");

    const box = overlay.append("div")
      .attr("class", "geo-popup-box");

    const header = box.append("div")
      .attr("class", "geo-popup-header");

    const titleBlock = header.append("div")
      .attr("class", "geo-popup-title-block");

    titleBlock.append("div")
      .attr("class", "geo-popup-title")
      .text(title);

    if (note) {
      titleBlock.append("div")
        .attr("class", "geo-popup-note")
        .text(note);
    }

    header.append("button")
      .attr("class", "geo-popup-close")
      .text("Close")
      .on("click", () => overlay.remove());

    box.append("div")
      .attr("id", "geo-popup-chart");

    drawCallback();

    overlay.on("click", function (event) {
      if (event.target === this) {
        overlay.remove();
      }
    });
  }

  /* ============================================================
     Tooltip
     ============================================================ */

  function ensureTooltip() {
    if (document.querySelector(".geo-tooltip")) return;

    d3.select("body")
      .append("div")
      .attr("class", "geo-tooltip")
      .style("opacity", 0);
  }

  function showTooltip(event, html) {
    d3.select(".geo-tooltip")
      .html(html)
      .style("left", `${event.clientX + 14}px`)
      .style("top", `${event.clientY + 14}px`)
      .style("opacity", 1);
  }

  function hideTooltip() {
    d3.select(".geo-tooltip").style("opacity", 0);
  }

  /* ============================================================
     Error
     ============================================================ */

  function showGeoError(message) {
    d3.select(selectors.mapRoot)
      .selectAll("*")
      .remove();

    d3.select(selectors.mapRoot)
      .append("div")
      .attr("class", "gender-error")
      .text(message);
  }
})();