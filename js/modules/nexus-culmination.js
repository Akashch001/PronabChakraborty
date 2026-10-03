/**
 * PRONAB / SYSTEM — Chapter 12: Nexus World Culmination
 * Parallax depth for atmospheric globe, progressive methodology stage sequence, and the Nexus exit bridge
 */

export class NexusCulmination {
  constructor() {
    this.nexusSection = document.getElementById('nexus');
    this.nexusGlobe = document.querySelector('.nexus-ambient-img');
    this.stageItems = document.querySelectorAll('.method-stage-item');
    this.trackerEl = document.getElementById('methodology-status-indicator');
    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    if (this.prefersReduced) {
      // In reduced motion, activate all stages immediately
      this.stageItems.forEach(item => item.classList.add('is-active'));
      return;
    }

    this.setupNexusAtmosphere();
    this.setupMethodologyProgression();
  }

  setupNexusAtmosphere() {
    if (!this.nexusSection || !this.nexusGlobe) return;

    // Atmospheric globe subtle scale and parallax (calm, zero HUD, zero glow)
    gsap.fromTo(this.nexusGlobe, {
      y: 40,
      scale: 1.04
    }, {
      y: -40,
      scale: 0.98,
      ease: 'none',
      scrollTrigger: {
        trigger: this.nexusSection,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });

    // Dissolve atmospheric globe as scene exits toward the human About chapter
    const exitBridge = document.getElementById('nexus-exit-bridge');
    if (exitBridge) {
      gsap.to(this.nexusGlobe, {
        opacity: 0.15,
        scrollTrigger: {
          trigger: exitBridge,
          start: 'top 85%',
          end: 'top 45%',
          scrub: true
        }
      });
    }
  }

  setupMethodologyProgression() {
    if (!this.stageItems.length) return;

    // One scroll-position owner: overlapping per-row callbacks picked different
    // stages at the same position when approached from opposite directions.
    const updateStage = () => {
      const line = window.innerHeight * 0.78;
      let active = 0;
      this.stageItems.forEach((item, idx) => {
        if (item.getBoundingClientRect().top <= line) active = idx;
      });
      this.setActiveStage(active);
    };
    ScrollTrigger.create({
      id: 'nexus-methodology',
      trigger: this.nexusSection,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: updateStage,
      onRefresh: updateStage
    });
    updateStage();
  }

  setActiveStage(activeIndex) {
    this.stageItems.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('is-active');
      } else {
        item.classList.remove('is-active');
      }
    });

    if (this.trackerEl) {
      const stageNum = String(activeIndex + 1).padStart(2, '0');
      this.trackerEl.textContent = `PROGRESSION // STAGE ${stageNum} OF 05`;
    }
  }

}
