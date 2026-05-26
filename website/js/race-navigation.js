(function () {
  "use strict";

  const sectionLabels = {
    title: "Warm-up",
    introduction: "Starting Blocks",
    gender: "Gender",
    delegations: "Medals",
    "body-types": "Bodies",
    geopolitics: "Politics",
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

  function initRaceNavigation() {
    const oldNav = document.getElementById("race-nav");
    if (oldNav) oldNav.remove();

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
        <button class="race-start-btn" type="button" title="Go to Start">
          ${warmUpSvg()}
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
        <button class="race-finish-btn" type="button" title="Go to Finish">
          ${waterBottleSvg()}
        </button>
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
      if (runner) {
        runner.style.top = "calc(100% + 60px)";
      }
    }

    function restoreRunner() {
      nav.classList.remove("race-is-footer");
      if (runner) {
        const progress = getProgressPercent(state.currentSectionIndex);
        runner.style.top = `${progress}%`;
      }
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

  function warmUpSvg() {
    return `
      <svg width="36" height="72" viewBox="0 0 36 72" class="nav-anchor-svg warm-up-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.9 21.1262C9.2 21.1262 11.8 18.5262 11.8 15.2262C11.8 11.9262 9.2 9.32617 5.9 9.32617C2.6 9.32617 0 11.9262 0 15.2262C0 18.4262 2.7 21.1262 5.9 21.1262Z" fill="currentColor"/>
        <path d="M14.8 17.6254C14.8 17.6254 8.90002 22.7254 6.80002 25.0254C4.20002 27.9254 1.30002 34.2254 1.30002 34.2254C0.200018 37.0254 1.10002 39.3254 3.60002 40.6254L10.8 44.5254C13.6 46.2254 15.5 41.5254 12.6 40.0254L6.30002 35.9254L9.50002 30.8254L14.7 41.9254L8.50002 67.7254C7.80002 71.4254 13.3 72.6254 14.7 68.4254L21.6 42.5254L29.4 69.0254C31.1 72.8254 36.2 71.2254 35.2 67.3254L27.9 39.1254C27.9 39.1254 22.5 24.8254 21.3 21.9254L20.3 10.0254C19.8 6.32537 18.8 5.12537 15.4 3.82537L6.50002 0.125365C3.60002 -0.774635 2.10002 3.42537 4.60002 4.62537L14 9.22536L14.8 17.6254Z" fill="currentColor"/>
      </svg>
    `;
  }

  function waterBottleSvg() {
    return `
      <svg width="38" height="90" viewBox="0 0 38 90" class="nav-anchor-svg water-bottle-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M35.8945 35.0547C36.9453 32.957 37.5 30.6055 37.5 28.2578V25.7773C37.5 21.9414 35.1797 18.6484 31.875 17.1992V13.125C31.875 10.0234 29.3516 7.5 26.25 7.5H25.3125V4.6875C25.3125 2.1016 23.2109 0 20.625 0H16.875C14.2891 0 12.1875 2.1016 12.1875 4.6875V7.5H11.25C8.1484 7.5 5.625 10.0234 5.625 13.125V17.1992C2.3203 18.6484 0 21.9453 0 25.7773V28.2578C0 30.6055 0.554689 32.9531 1.6055 35.0547C2.39456 36.6367 2.8125 38.4063 2.8125 40.1719V41.3828C2.8125 43.1523 2.39453 44.9219 1.6055 46.5C0.554699 48.5977 0 50.9492 0 53.2969V80.6209C0 85.7889 4.207 89.9959 9.375 89.9959H28.125C33.293 89.9959 37.5 85.7889 37.5 80.6209V53.2969C37.5 50.9492 36.9453 48.6016 35.8945 46.5C35.1054 44.918 34.6875 43.1484 34.6875 41.3828V40.1719C34.6875 38.4024 35.1055 36.6328 35.8945 35.0547ZM15.9375 4.6837C15.9375 4.16808 16.3594 3.7462 16.875 3.7462H20.625C21.1406 3.7462 21.5625 4.16808 21.5625 4.6837V7.4962H15.9375V4.6837ZM9.375 13.1212C9.375 12.086 10.2148 11.2462 11.25 11.2462H26.25C27.2852 11.2462 28.125 12.086 28.125 13.1212V16.4024H9.375V13.1212ZM3.75 25.7772C3.75 22.6756 6.2734 20.1522 9.375 20.1522H28.125C31.2266 20.1522 33.75 22.6756 33.75 25.7772V28.2577C33.75 30.0272 33.332 31.7968 32.543 33.3749C31.4922 35.4726 30.9375 37.8241 30.9375 40.1718V41.3827C30.9375 43.7304 31.4922 46.078 32.543 48.1796C33.2149 49.5234 33.5977 50.9999 33.7032 52.496H3.7972C3.90267 50.9999 4.28548 49.5194 4.9574 48.1796C6.0082 46.0819 6.5629 43.7304 6.5629 41.3827V40.1718C6.5629 37.8241 6.00821 35.4765 4.9574 33.3749C4.16834 31.7929 3.7504 30.0233 3.7504 28.2577L3.75 25.7772ZM33.75 56.2462V74.9962H3.75V56.2462H33.75ZM28.125 86.2462H9.375C6.2734 86.2462 3.75 83.7228 3.75 80.6212V78.7462H33.75V80.6212C33.75 83.7228 31.2266 86.2462 28.125 86.2462Z" fill="currentColor"/>
      </svg>
    `;
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