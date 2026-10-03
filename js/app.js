/**
 * PRONAB / SYSTEM — Main Application Orchestrator
 * Connects Lenis Scroll Engine, GSAP ScrollTrigger, Custom Cursor,
 * 3D Transformations, Interactive Prototypes, and Algorithm Visualizer.
 */

import { ScrollEngine } from './modules/scroll.js';
import { CustomCursor } from './modules/cursor.js';
import { HeroTransitions } from './modules/hero-transitions.js';
import { LiveSystem } from './modules/live-system.js';
import { AboutReveal } from './modules/about-reveal.js';
import { HorizontalWork } from './modules/horizontal-work.js';
import { PrinciplesPinned } from './modules/principles-pinned.js';
import { PerformanceStory } from './modules/performance-story.js';
import { InteractiveCore } from './modules/interactive-core.js';
import { ContactEnding } from './modules/contact-ending.js';
import { NexusCulmination } from './modules/nexus-culmination.js';
import { DijkstraVisualizer } from './algorithm.js';

class PronabSystemApp {
  constructor() {
    this.scrollEngine = null;
    this.cursor = null;
    this.hero = null;
    this.liveSystem = null;
    this.about = null;
    this.work = null;
    this.principles = null;
    this.performance = null;
    this.interactiveCore = null;
    this.nexus = null;
    this.dijkstra = null;

    this.init();
  }

  init() {
    // 1. Initialize Global Scroll Engine (Lenis + ScrollTrigger)
    this.scrollEngine = new ScrollEngine();

    // 2. Initialize Custom Cursor & Magnetic System
    this.cursor = new CustomCursor();

    // 3. Initialize Preloader & Hero 3D Transformations
    this.hero = new HeroTransitions();

    // 4. Initialize Chapter 03: Live System Telemetry Engine
    this.liveSystem = new LiveSystem({ scrollEngine: this.scrollEngine });

    // 6. Initialize Horizontal Project Track & Live Mini-Prototypes
    this.work = new HorizontalWork();

    // 7. Initialize Pinned Principles Storytelling (Chapter 08)
    this.principles = new PrinciplesPinned();

    // 8. Initialize Performance Story (Chapter 10)
    this.performance = new PerformanceStory();

    // 9. Initialize Experimental WebGL Spatial Core (Chapter 11)
    this.interactiveCore = new InteractiveCore();

    // Initialize the final act in document order after upstream pins.
    this.nexus = new NexusCulmination();
    // Register downstream triggers after all upstream pins have their geometry.
    this.about = new AboutReveal();
    this.contact = new ContactEnding();

    // 9. Initialize Interactive Dijkstra Algorithm Engine
    this.initAlgorithmLab();

    // 10. Accessible Navigation & Mobile Drawer
    this.initMobileMenu();
    this.initScrollNavSpy();
    this.initAlgoDetailsDisclosure();
    this.handleUrlDirectNav();

    // Recalculate all pinned triggers once DOM and all modules are ready
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
      window.addEventListener('load', () => ScrollTrigger.refresh());
      // Lazy assets can change upstream flow after window.load. Refresh the
      // pin geometry only after those assets settle, including on reverse travel.
      let assetRefresh;
      document.addEventListener('load', (event) => {
        if (event.target.tagName !== 'IMG') return;
        clearTimeout(assetRefresh);
        assetRefresh = setTimeout(() => {
          this.scrollEngine.lenis?.resize();
          ScrollTrigger.refresh();
        }, 100);
      }, true);
    }

  }

  initMobileMenu() {
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const drawer = document.getElementById("mobile-drawer");
    const navLinks = drawer ? drawer.querySelectorAll(".mobile-nav-link") : [];

    if (!toggleBtn || !drawer) return;

    const openMenu = () => {
      drawer.classList.add("is-open");
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.innerHTML = `<span>Close</span>`;
      document.body.style.overflow = "hidden";
      const firstLink = drawer.querySelector("a");
      if (firstLink) firstLink.focus();
    };

    const closeMenu = () => {
      drawer.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.innerHTML = `<span>Menu</span>`;
      document.body.style.overflow = "";
      toggleBtn.focus();
    };

    toggleBtn.addEventListener("click", () => {
      const isOpen = drawer.classList.contains("is-open");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Navigation is handled once by initScrollNavSpy; the drawer only closes.
    navLinks.forEach(link => link.addEventListener('click', closeMenu));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        closeMenu();
      }
    });
  }

  initScrollNavSpy() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".desktop-nav a");

    // Attach smooth scroll handler to all internal anchor links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.length > 1) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            this.scrollEngine.scrollTo(target);
          }
        }
      });
    });

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach(link => {
            if (link.getAttribute("href") === `#${id}`) {
              link.classList.add("active");
            } else {
              link.classList.remove("active");
            }
          });
        }
      });
    }, {
      rootMargin: "-25% 0px -65% 0px"
    });

    sections.forEach(sec => observer.observe(sec));
  }

  initAlgoDetailsDisclosure() {
    const toggleBtn = document.getElementById("algo-details-toggle");
    const drawer = document.getElementById("algo-details-drawer");

    if (!toggleBtn || !drawer) return;

    toggleBtn.addEventListener("click", () => {
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      const textSpan = toggleBtn.querySelector(".toggle-text") || toggleBtn.querySelector("span");
      const arrowSpan = toggleBtn.querySelector(".toggle-arrow");

      if (isExpanded) {
        drawer.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
        if (textSpan) textSpan.textContent = "INSPECT RUNTIME DISTANCES & TRACE LOG";
        if (arrowSpan) arrowSpan.textContent = "▾";
      } else {
        drawer.classList.add("is-open");
        toggleBtn.setAttribute("aria-expanded", "true");
        if (textSpan) textSpan.textContent = "COLLAPSE RUNTIME DISTANCES & TRACE LOG";
        if (arrowSpan) arrowSpan.textContent = "▴";
      }
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    });
  }

  initAlgorithmLab() {
    try {
      this.dijkstra = new DijkstraVisualizer({
        svgContainer: document.getElementById("algo-svg-wrap"),
        distTableBody: document.getElementById("algo-dist-tbody"),
        logContainer: document.getElementById("algo-log-box"),
        statusBadge: document.getElementById("algo-status-badge"),
        resultContainer: document.getElementById("algo-final-result"),
        btnStart: document.getElementById("btn-algo-start"),
        btnStep: document.getElementById("btn-algo-step"),
        btnReset: document.getElementById("btn-algo-reset"),
        speedSelect: document.getElementById("algo-speed")
      });
    } catch (err) {
      console.error("Failed to initialize Dijkstra Visualizer:", err);
    }
  }

  handleUrlDirectNav() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('section') || (window.location.hash ? window.location.hash.slice(1) : null);
    if (targetId) {
      setTimeout(() => {
        this.scrollEngine.scrollTo(`#${targetId}`, { duration: 0.1 });
      }, 300);
    }
    if (urlParams.get('auto') === 'true') {
      setTimeout(() => {
        const startBtn = document.getElementById('btn-algo-start');
        if (startBtn) startBtn.click();
      }, 500);
    }
  }
}

// Boot application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.PronabApp ??= new PronabSystemApp();
});
