(function () {
  "use strict";

  const sectionLabels = {
    title: "Warm-up",
    introduction: "Starting Blocks",
    gender: "Gender",
    delegations: "Medals",
    "body-types": "Bodies",
    geopolitics: "Geopolitics",
    fair: "Fairness",
    conclusion: "Finish Line"
  };

  const config = {
    mainRunnerX: "-25px",   // runner position next to the vertical line
    firstSideRunnerX: 55,   // runner position on first side slide
    sideStep: 28            // distance between side slide dots
  };

  const state = {
    sections: [],
    currentSectionIndex: 0,
    currentSlideIndex: 0
  };

  async function fetchSvg(path) {
    const res = await fetch(path);
    return await res.text();
  }

  async function initRaceNavigation() {
    const oldNav = document.getElementById("race-nav");
    if (oldNav) oldNav.remove();

    const [warmUpHtml, waterBottleHtml] = await Promise.all([
      fetchSvg("img/warm_up.svg"),
      fetchSvg("img/water_bottle.svg")
    ]);

    state.sections = Array.from(document.querySelectorAll("#website > .section"))
      .filter(section => !section.classList.contains("fp-auto-height"))
      .map((section, index, array) => {
        const anchor = section.dataset.anchor || `section-${index}`;
        const slides = Array.from(section.querySelectorAll(".slide"));
        const slideCount = Math.max(1, slides.length);

        return {
          anchor,
          label: sectionLabels[anchor] || anchor,
          slideCount,
          extraSlides: Math.max(0, slideCount - 1),
          hasSlides: slideCount > 1,
          isStart: index === 0,
          isFinish: index === array.length - 1
        };
      });

    const nav = document.createElement("div");
    nav.id = "race-nav";

    nav.innerHTML = `
      <div class="race-track-shell">
        <button class="race-start-btn" type="button">
          ${warmUpHtml}
        </button>
        <span class="race-anchor-label">START</span>

        <div class="race-track">
          <div class="race-track-line"></div>
          <div class="race-track-progress"></div>
          <div class="race-checkpoints"></div>

          <div class="race-runner" aria-hidden="true">
            ${runnerSvg()}
          </div>
        </div>

        <span class="race-anchor-label">FINISH</span>
        <div class="race-finish-wrap">
          <button class="race-finish-btn" type="button">
            ${waterBottleHtml}
          </button>
          <span class="race-label">Cool Down</span>
        </div>
      </div>
    `;

    document.body.appendChild(nav);

    nav.querySelector(".race-start-btn").addEventListener("click", () => {
      if (window.fullpage_api) window.fullpage_api.moveTo(1, 0);
    });

    nav.querySelector(".race-finish-btn").addEventListener("click", () => {
      if (window.fullpage_api) window.fullpage_api.moveTo("footer");
    });

    buildCheckpoints();
    updateRaceNavigation(0, 0, "down");
    initFooterDetection(nav);
  }

  function initFooterDetection(nav) {
    const footerSection = document.querySelector('.fp-section[data-anchor="footer"]');
    if (!footerSection) return;

    const runner = nav.querySelector(".race-runner");
    let wasActive = footerSection.classList.contains("active");

    function applyFooterRunner() {
      nav.classList.add("race-is-footer");
      nav.classList.remove("race-is-start");
      nav.style.setProperty("--race-progress", "100%");
      if (runner) {
        runner.style.top = "calc(100% + 60px)";
        runner.style.setProperty("--runner-x", config.mainRunnerX);
      }
      updateCheckpoints(state.sections.length - 1, 0);
    }

    function restoreRunner() {
      nav.classList.remove("race-is-footer");
      if (runner) {
        const progress = getProgressPercent(state.currentSectionIndex);
        const lineProgress = state.currentSectionIndex === 0 ? 0 : progress;
        nav.style.setProperty("--race-progress", `${lineProgress}%`);
        runner.style.top = `${progress}%`;
      }
      updateCheckpoints(state.currentSectionIndex, state.currentSlideIndex);
    }

    const observer = new MutationObserver(() => {
      const isActive = footerSection.classList.contains("active");
      if (isActive && !wasActive) {
        wasActive = true;
        applyFooterRunner();
      } else if (!isActive && wasActive) {
        wasActive = false;
        restoreRunner();
      }
    });

    observer.observe(footerSection, { attributes: true, attributeFilter: ["class"] });
  }

  function buildCheckpoints() {
    const container = document.querySelector(".race-checkpoints");
    if (!container) return;

    container.innerHTML = "";

    state.sections.forEach((section, index) => {
      const checkpoint = document.createElement("button");
      checkpoint.className = "race-checkpoint";
      checkpoint.type = "button";
      checkpoint.dataset.index = String(index);
      checkpoint.style.top = `${getProgressPercent(index)}%`;

      const sideDots = Array.from({ length: section.extraSlides }, (_, i) => {
        const slideNumber = i + 1;
        const left = 66 + i * config.sideStep;

        return `
          <span
            class="race-side-dot"
            data-slide="${slideNumber}"
            style="left: ${left}px;"
          ></span>
        `;
      }).join("");

      const sidePathWidth =
        section.extraSlides > 0
          ? 18 + (section.extraSlides - 1) * config.sideStep
          : 0;

      checkpoint.style.setProperty("--side-path-width", `${sidePathWidth}px`);

      checkpoint.innerHTML = `
        ${index === 0 ? "" : `<span class="race-dot"></span>`}
        ${sideDots}
        <span class="race-label">${section.label}</span>
      `;

      checkpoint.addEventListener("click", (event) => {
        if (!window.fullpage_api) return;

        const sideDot = event.target.closest(".race-side-dot");

        if (sideDot) {
            const slideNumber = Number(sideDot.dataset.slide);
            window.fullpage_api.moveTo(index + 1, slideNumber);
            return;
        }    
        window.fullpage_api.moveTo(index + 1, 0);
      });

      container.appendChild(checkpoint);
    });
  }

  function updateRaceNavigation(sectionIndex = 0, slideIndex = 0, direction = "down") {
    const nav = document.getElementById("race-nav");
    if (!nav || !state.sections.length) return;

    // Footer section index is beyond our tracked sections — let the MutationObserver handle it
    if (sectionIndex >= state.sections.length) return;

    const safeSectionIndex = clamp(sectionIndex, 0, state.sections.length - 1);
    const currentSection = state.sections[safeSectionIndex];

    const safeSlideIndex = clamp(
      Number(slideIndex) || 0,
      0,
      currentSection.slideCount - 1
    );

    state.currentSectionIndex = safeSectionIndex;
    state.currentSlideIndex = safeSlideIndex;

    const progress = getProgressPercent(safeSectionIndex);

    // title page should not fill the line
    const lineProgress = safeSectionIndex === 0 ? 0 : progress;

    nav.style.setProperty("--race-progress", `${lineProgress}%`);

    updateRunner(nav, currentSection, progress, safeSlideIndex);
    updateNavClasses(nav, currentSection, safeSectionIndex, direction);
    updateCheckpoints(safeSectionIndex, safeSlideIndex);
  }

  function updateRunner(nav, currentSection, progress, slideIndex) {
    const runner = nav.querySelector(".race-runner");
    if (!runner) return;

    if (currentSection.hasSlides && slideIndex > 0) {
      runner.style.top = `calc(${progress}% - 30px)`;
      runner.style.setProperty("--runner-x", `${config.firstSideRunnerX + (slideIndex - 1) * config.sideStep}px`);
    } else {
      runner.style.top = `${progress}%`;
      runner.style.setProperty("--runner-x", config.mainRunnerX);
    }
  }

  function updateNavClasses(nav, currentSection, sectionIndex, direction) {
    nav.classList.toggle("race-is-start", sectionIndex === 0);
    nav.classList.toggle("race-is-finish", Boolean(currentSection?.isFinish));

    nav.classList.toggle("race-going-up", direction === "up");
    nav.classList.toggle("race-going-down", direction === "down");
    nav.classList.toggle("race-going-right", direction === "right");
    nav.classList.toggle("race-going-left", direction === "left");

    nav.classList.add("race-is-moving");

    window.clearTimeout(nav._raceTimer);
    nav._raceTimer = window.setTimeout(() => {
      nav.classList.remove("race-is-moving");
    }, 700);
  }

  function updateCheckpoints(activeSectionIndex, activeSlideIndex) {
    document.querySelectorAll(".race-checkpoint").forEach((checkpoint, index) => {
      checkpoint.classList.toggle("is-active", index === activeSectionIndex);
      checkpoint.classList.toggle("is-passed", index < activeSectionIndex);

      const sideDots = checkpoint.querySelectorAll(".race-side-dot");

      sideDots.forEach((sideDot) => {
        const slideNumber = Number(sideDot.dataset.slide);

        const sidePassed =
          index < activeSectionIndex ||
          (index === activeSectionIndex && activeSlideIndex > slideNumber);

        const sideActive =
          index === activeSectionIndex && activeSlideIndex === slideNumber;

        sideDot.classList.toggle("is-passed-side", sidePassed);
        sideDot.classList.toggle("is-active-side", sideActive);
      });
    });
  }

  function getProgressPercent(index) {
    if (state.sections.length <= 1) return 0;

    // title page: keep runner above start line
    if (index === 0) {
      return -10;
    }

    // start from Introduction section
    return ((index - 1) / (state.sections.length - 2)) * 100;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function runnerSvg() {
    return `
      <svg viewBox="0 0 80 80" class="runner-svg">
        <circle class="runner-head" cx="42" cy="14" r="7"></circle>
        <line class="runner-body" x1="42" y1="22" x2="37" y2="42"></line>

        <line class="runner-arm runner-arm-front" x1="39" y1="28" x2="20" y2="36"></line>
        <line class="runner-arm runner-arm-back" x1="39" y1="28" x2="58" y2="34"></line>

        <line class="runner-leg runner-leg-front" x1="37" y1="42" x2="20" y2="63"></line>
        <line class="runner-leg runner-leg-back" x1="37" y1="42" x2="59" y2="61"></line>
      </svg>
    `;
  }

  window.RaceNavigation = {
    init: initRaceNavigation,
    update: updateRaceNavigation
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initRaceNavigation());
  } else {
    initRaceNavigation();
  }
})();