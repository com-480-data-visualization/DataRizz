(function () {
  "use strict";

  const sectionLabels = {
    title: "Start",
    introduction: "Intro",
    gender: "Gender",
    delegations: "Medals",
    "body-types": "Bodies",
    geopolitics: "Politics",
    fair: "Fairness",
    conclusion: "Finish"
  };

  const state = {
    sections: [],
    currentSectionIndex: 0,
    currentSlideIndex: 0
  };

  function initRaceNavigation() {
    const oldNav = document.getElementById("race-nav");
    if (oldNav) oldNav.remove();

    state.sections = Array.from(document.querySelectorAll("#website > .section"))
      .filter(section => !section.classList.contains("fp-auto-height"))
      .map((section, index, array) => {
        const anchor = section.dataset.anchor || `section-${index}`;
        const slides = Array.from(section.querySelectorAll(".slide"));

        return {
          anchor,
          label: sectionLabels[anchor] || anchor,
          hasSlides: slides.length > 1,
          slideCount: slides.length,
          isStart: index === 0,
          isFinish: index === array.length - 1
        };
      });

    const nav = document.createElement("div");
    nav.id = "race-nav";

    nav.innerHTML = `
      <div class="race-track-shell">
        <div class="race-start">START</div>

        <div class="race-track">
          <div class="race-track-line"></div>
          <div class="race-track-progress"></div>
          <div class="race-checkpoints"></div>

          <div class="race-runner" aria-hidden="true">
            ${runnerSvg()}
          </div>
        </div>

        <div class="race-finish-wrap" aria-hidden="true">
            <div class="race-finish-label">FINISH</div>
        </div>
      </div>
    `;

    document.body.appendChild(nav);

    buildCheckpoints();
    updateRaceNavigation(0, 0, "down");
  }

  function buildCheckpoints() {
    const container = document.querySelector(".race-checkpoints");
    if (!container) return;

    container.innerHTML = "";

    state.sections.forEach((section, index) => {
      const checkpoint = document.createElement("button");

      checkpoint.className = "race-checkpoint";
      checkpoint.type = "button";
      checkpoint.dataset.index = index;
      checkpoint.style.top = `${getProgressPercent(index)}%`;

      checkpoint.innerHTML = `
        <span class="race-dot"></span>
        ${section.hasSlides ? `<span class="race-side-dot"></span>` : ""}
        <span class="race-label">${section.label}</span>
      `;

      checkpoint.addEventListener("click", () => {
        if (window.fullpage_api) {
          window.fullpage_api.moveTo(index + 1);
        }
      });

      container.appendChild(checkpoint);
    });
  }

  function updateRaceNavigation(sectionIndex = 0, slideIndex = 0, direction = "down") {
    const nav = document.getElementById("race-nav");
    if (!nav || !state.sections.length) return;

    const safeSectionIndex = clamp(sectionIndex, 0, state.sections.length - 1);
    const currentSection = state.sections[safeSectionIndex];

    state.currentSectionIndex = safeSectionIndex;
    state.currentSlideIndex = slideIndex;

    const progress = getProgressPercent(safeSectionIndex);

    nav.style.setProperty("--race-progress", `${progress}%`);

    const runner = nav.querySelector(".race-runner");
    if (runner) {
    runner.style.top = `${progress}%`;

    const shouldMoveRight =
        currentSection &&
        currentSection.hasSlides &&
        slideIndex > 0;

    // left of vertical line by default, move right when on horizontal slide
    runner.style.setProperty(
        "--runner-x",
        shouldMoveRight ? "60px" : "-20px"
    );
    }

    nav.classList.toggle("race-is-start", safeSectionIndex === 0);
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

    updateCheckpoints(safeSectionIndex, slideIndex);
  }

  function updateCheckpoints(activeSectionIndex, activeSlideIndex) {
    document.querySelectorAll(".race-checkpoint").forEach((checkpoint, index) => {
      const section = state.sections[index];

      checkpoint.classList.toggle("is-active", index === activeSectionIndex);
      checkpoint.classList.toggle("is-passed", index < activeSectionIndex);

      const sideDot = checkpoint.querySelector(".race-side-dot");

      if (sideDot && section) {
        const sidePassed =
          index < activeSectionIndex ||
          (index === activeSectionIndex && activeSlideIndex > 0);

        const sideActive =
          index === activeSectionIndex && activeSlideIndex > 0;

        sideDot.classList.toggle("is-passed-side", sidePassed);
        sideDot.classList.toggle("is-active-side", sideActive);
      }
    });
  }

  function getProgressPercent(index) {
    if (state.sections.length <= 1) return 0;
    return (index / (state.sections.length - 1)) * 100;
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
    document.addEventListener("DOMContentLoaded", initRaceNavigation);
  } else {
    initRaceNavigation();
  }
})();