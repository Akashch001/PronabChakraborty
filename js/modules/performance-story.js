/**
 * PRONAB / SYSTEM — Chapter 10: Performance Story
 * Demonstrates 6 core performance engineering principles:
 * 01 / Compositor First
 * 02 / Frame Budget (16.67ms)
 * 03 / GPU Control (DPR Capping)
 * 04 / Offscreen Work (IntersectionObserver lifecycle)
 * 05 / Mobile Complexity (Adaptive choreography)
 * 06 / Reduced Motion (Accessibility first)
 *
 * Provides real runtime telemetry (live frame time, native vs capped DPR,
 * Three.js loop state, motion mode) and manages desktop pinned / mobile stacked transitions.
 */

export class PerformanceStory {
  constructor() {
    this.section = document.getElementById('performance');
    this.stage = document.getElementById('performance-principles-stage');
    this.panels = document.querySelectorAll('.perf-principle-panel');
    this.navItems = document.querySelectorAll('.perf-nav-item');
    this.stageCurrEl = document.getElementById('perf-stage-curr');
    this.progressFillEl = document.getElementById('perf-progress-fill');
    
    // Telemetry Elements
    this.liveFrameEl = document.getElementById('perf-live-frame');
    this.dprValEl = document.getElementById('perf-dpr-val');
    this.webglLoopEl = document.getElementById('perf-webgl-loop-val');
    this.motionModeEl = document.getElementById('perf-motion-mode-val');

    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isDesktop = window.innerWidth >= 860;
    this.timeline = null;
    this.currentStage = 0;
    this.liveRafId = null;

    if (this.section) {
      this.init();
    }
  }

  init() {
    this.initTelemetry();
    this.initChoreography();
    this.initNavClicks();
    this.bindLoopListener();

    window.addEventListener('resize', () => {
      const desktopNow = window.innerWidth >= 860;
      if (desktopNow !== this.isDesktop) {
        this.isDesktop = desktopNow;
        this.initChoreography();
      }
    }, { passive: true });
  }

  initTelemetry() {
    // 1. Native vs Capped DPR
    const nativeDpr = window.devicePixelRatio || 1;
    const cappedDpr = Math.min(nativeDpr, 1.5).toFixed(2);
    if (this.dprValEl) {
      this.dprValEl.innerHTML = `${cappedDpr} <span class="perf-tag-capped">CAPPED (NATIVE ${nativeDpr.toFixed(1)}×)</span>`;
    }

    // 2. Motion Mode
    if (this.motionModeEl) {
      this.motionModeEl.textContent = this.prefersReduced ? 'REDUCED MOTION' : 'FULL MOTION';
    }

    // 3. Live Frame Time Measurement via throttled requestAnimationFrame
    if (this.liveFrameEl && !this.prefersReduced) {
      let lastTime = performance.now();
      let frames = 0;
      let accumulated = 0;

      const measure = (now) => {
        const delta = now - lastTime;
        lastTime = now;

        if (delta > 0 && delta < 100) {
          accumulated += delta;
          frames++;
        }

        if (frames >= 30) {
          const avgFrameTime = (accumulated / frames).toFixed(1);
          const fps = Math.round(1000 / (accumulated / frames));
          this.liveFrameEl.innerHTML = `${avgFrameTime} MS <span class="perf-tag-live">${fps} FPS</span>`;
          frames = 0;
          accumulated = 0;
        }

        this.liveRafId = requestAnimationFrame(measure);
      };

      // Keep one monitor, suspended outside the section or in a hidden page.
      let visible = false;
      const syncMonitor = () => {
        if (visible && !document.hidden) {
          if (!this.liveRafId) {
            lastTime = performance.now();
            frames = 0;
            accumulated = 0;
            this.liveRafId = requestAnimationFrame(measure);
          }
        } else if (this.liveRafId) {
          cancelAnimationFrame(this.liveRafId);
          this.liveRafId = null;
        }
      };
      this.telemetryObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        syncMonitor();
      }, { threshold: 0.05 });
      this.telemetryObserver.observe(this.section);
      document.addEventListener('visibilitychange', syncMonitor);
      window.addEventListener('pagehide', () => {
        if (this.liveRafId) cancelAnimationFrame(this.liveRafId);
        this.liveRafId = null;
      });
      window.addEventListener('pageshow', syncMonitor);
    }
  }

  bindLoopListener() {
    // Listen for genuine Spatial Core loop state updates
    window.addEventListener('spatial-core-loop-state', (e) => {
      const isRunning = e.detail && e.detail.running;
      if (this.webglLoopEl) {
        if (isRunning) {
          this.webglLoopEl.textContent = 'RUNNING (ACTIVE)';
          this.webglLoopEl.classList.remove('status-paused');
          this.webglLoopEl.classList.add('status-running');
        } else {
          this.webglLoopEl.textContent = 'PAUSED (0% GPU)';
          this.webglLoopEl.classList.remove('status-running');
          this.webglLoopEl.classList.add('status-paused');
        }
      }
    });
  }

  initChoreography() {
    // Clean up existing timeline if any
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    if (this.prefersReduced || !this.isDesktop || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Mobile / Reduced Motion: All panels naturally visible, unpinned
      this.panels.forEach(panel => {
        panel.classList.add('active');
        panel.style.opacity = '1';
        panel.style.transform = 'none';
      });
      return;
    }

    // Desktop Pinned Choreography
    const stage = this.stage;
    const panels = Array.from(this.panels);
    const totalPanels = panels.length;

    if (!stage || totalPanels === 0) return;

    // Set initial states
    panels.forEach((p, idx) => {
      if (idx === 0) {
        p.classList.add('active');
        gsap.set(p, { opacity: 1, y: 0 });
      } else {
        p.classList.remove('active');
        gsap.set(p, { opacity: 0, y: 24 });
      }
    });

    this.timeline = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: 'top top+=80',
        end: `+=${totalPanels * 50}vh`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const stageIndex = Math.min(
            totalPanels - 1,
            Math.floor(progress * totalPanels)
          );
          this.setStage(stageIndex);
        }
      }
    });

    // Cross-fade between each consecutive panel
    for (let i = 0; i < totalPanels - 1; i++) {
      const current = panels[i];
      const next = panels[i + 1];

      this.timeline
        .to(current, {
          opacity: 0,
          y: -16,
          duration: 0.8,
          ease: 'power2.inOut'
        })
        .fromTo(next, 
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.inOut' },
          '-=0.3'
        );
    }
  }

  setStage(index) {
    if (this.currentStage === index) return;
    this.currentStage = index;

    // Update Stage Counter
    if (this.stageCurrEl) {
      this.stageCurrEl.textContent = String(index + 1).padStart(2, '0');
    }

    // Update Progress Rail
    if (this.progressFillEl) {
      const pct = ((index + 1) / this.panels.length) * 100;
      this.progressFillEl.style.width = `${pct}%`;
    }

    // Update Nav Sidebar
    this.navItems.forEach((item, idx) => {
      item.classList.toggle('active', idx === index);
    });

    // Update Panel Active Classes
    this.panels.forEach((p, idx) => {
      p.classList.toggle('active', idx === index);
    });
  }

  showStageDirectly(stageIdx) {
    if (stageIdx < 0 || stageIdx >= this.panels.length) return;
    this.setStage(stageIdx);

    if (this.isDesktop && !this.prefersReduced && typeof gsap !== 'undefined') {
      this.panels.forEach((p, idx) => {
        if (idx === stageIdx) {
          gsap.to(p, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        } else {
          gsap.to(p, { opacity: 0, y: idx < stageIdx ? -16 : 16, duration: 0.35, ease: 'power2.out' });
        }
      });
    }

    if (this.timeline && this.timeline.scrollTrigger) {
      const st = this.timeline.scrollTrigger;
      const targetProgress = (stageIdx + 0.1) / this.panels.length;
      const targetScroll = st.start + (st.end - st.start) * targetProgress;
      window.scrollTo({ top: targetScroll, behavior: 'instant' });
    }
  }

  initNavClicks() {
    this.navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const stageIdx = parseInt(item.getAttribute('data-stage'), 10);
        if (isNaN(stageIdx)) return;
        this.showStageDirectly(stageIdx);
      });
    });
  }
}
