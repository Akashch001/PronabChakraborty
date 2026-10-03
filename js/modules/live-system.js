/**
 * PRONAB / SYSTEM — Chapter 03: Live System Telemetry Engine
 * Exposes real runtime behavior: Scroll velocity, frame time, DPR cap,
 * input sensor coordinates, WebGL state, and rolling event stream.
 */

export class LiveSystem {
  constructor(options = {}) {
    this.scrollEngine = options.scrollEngine || null;
    this.section = document.getElementById('system');

    // DOM Elements
    this.velocityValEl = document.getElementById('telemetry-velocity-val');
    this.velocityDirEl = document.getElementById('telemetry-velocity-dir');
    this.velocityBarEl = document.getElementById('telemetry-velocity-bar');
    this.frameTimeEl = document.getElementById('telemetry-frame-time');
    this.fpsBadgeEl = document.getElementById('telemetry-fps-badge');
    this.sceneEl = document.getElementById('telemetry-scene');
    this.dprEl = document.getElementById('telemetry-dpr');
    this.dprSubEl = document.getElementById('telemetry-dpr-sub');
    this.webglEl = document.getElementById('telemetry-webgl');
    this.webglBadgeEl = document.getElementById('telemetry-webgl-badge');
    this.inputModeEl = document.getElementById('telemetry-input-mode');
    this.pointerCoordsEl = document.getElementById('telemetry-pointer-coords');
    this.viewportEl = document.getElementById('telemetry-viewport');
    this.aspectBadgeEl = document.getElementById('telemetry-aspect-badge');
    this.streamEl = document.getElementById('telemetry-event-stream');

    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    // Telemetry State
    this.rafId = null;
    this.lastRafTime = performance.now();
    this.smoothedFrameTime = 16.67;
    this.lastDomUpdateTime = 0;
    this.domUpdateInterval = 250; // Throttle DOM updates to 4Hz
    this.isRunning = false;

    // Rolling Event Buffer (max 6 items)
    this.maxEvents = 6;
    this.events = [];
    this.lastScrollBurstTime = 0;

    this.init();
  }

  init() {
    if (!this.section) return;

    this.initStaticMetrics();
    this.initEventListeners();
    this.initEventStream();
    this.monitorVisible = false;
    this.monitorObserver = new IntersectionObserver(([entry]) => {
      this.monitorVisible = entry.isIntersecting;
      if (this.monitorVisible && !document.hidden) {
        this.renderEventStream();
        this.startFrameMonitoring();
      }
      else this.stopFrameMonitoring();
    });
    this.monitorObserver.observe(this.section);
    this.initScrollChoreography();

  }

  initStaticMetrics() {
    // DPR and GPU cap
    const nativeDpr = window.devicePixelRatio || 1;
    const cappedDpr = Math.min(nativeDpr, 1.5);
    if (this.dprEl) {
      this.dprEl.textContent = cappedDpr.toFixed(2);
    }
    if (this.dprSubEl) {
      this.dprSubEl.textContent = `NATIVE ${nativeDpr.toFixed(1)} → CAPPED 1.5`;
    }

    // Viewport
    this.updateViewportDisplay();

    // Input mode
    if (this.isTouch && this.inputModeEl) {
      this.inputModeEl.textContent = 'TOUCH';
      if (this.pointerCoordsEl) {
        this.pointerCoordsEl.textContent = 'TOUCH SENSOR ACTIVE';
      }
    }

    // WebGL
    this.checkWebglCapability();
  }

  checkWebglCapability() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        if (this.webglEl) this.webglEl.textContent = 'STANDBY';
        if (this.webglBadgeEl) this.webglBadgeEl.textContent = 'GPU READY';
      } else {
        if (this.webglEl) this.webglEl.textContent = 'CANVAS FALLBACK';
        if (this.webglBadgeEl) this.webglBadgeEl.textContent = '2D CONTEXT';
      }
    } catch {
      if (this.webglEl) this.webglEl.textContent = 'OFFLINE';
    }
  }

  updateViewportDisplay() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (this.viewportEl) {
      this.viewportEl.textContent = `${w} × ${h}`;
    }
    if (this.aspectBadgeEl) {
      if (w >= 1024) {
        this.aspectBadgeEl.textContent = 'DESKTOP';
      } else if (w >= 768) {
        this.aspectBadgeEl.textContent = 'TABLET';
      } else {
        this.aspectBadgeEl.textContent = 'MOBILE';
      }
    }
  }

  initEventListeners() {
    // 1. Pointer sensor
    if (!this.isTouch) {
      window.addEventListener('pointermove', (e) => {
        const normX = (e.clientX / window.innerWidth).toFixed(2);
        const normY = (e.clientY / window.innerHeight).toFixed(2);
        if (this.pointerCoordsEl) {
          this.pointerCoordsEl.textContent = `X: ${normX} · Y: ${normY}`;
        }
      }, { passive: true });
    }

    // 2. Viewport Resize
    window.addEventListener('resize', () => {
      this.updateViewportDisplay();
      this.pushEvent('VIEWPORT', `RESIZED TO ${window.innerWidth}×${window.innerHeight}`);
    }, { passive: true });

    // 3. Page Visibility API
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopFrameMonitoring();
        this.pushEvent('MONITOR', 'TAB HIDDEN — RAF MONITOR SUSPENDED');
      } else if (this.monitorVisible) {
        this.startFrameMonitoring();
        this.pushEvent('MONITOR', 'TAB VISIBLE — RAF MONITOR RESUMED');
      }
    });

    // 4. Scroll Velocity Listener from ScrollEngine
    if (this.scrollEngine) {
      this.scrollEngine.onVelocity((v) => {
        this.handleVelocityUpdate(v);
      });
    } else {
      // Fallback scroll listener
      let lastScroll = window.scrollY;
      let lastTime = performance.now();
      window.addEventListener('scroll', () => {
        const now = performance.now();
        const dt = Math.max(now - lastTime, 1);
        const currentScroll = window.scrollY;
        const vel = (currentScroll - lastScroll) / dt;
        lastScroll = currentScroll;
        lastTime = now;
        this.handleVelocityUpdate(vel);
      }, { passive: true });
    }
  }

  handleVelocityUpdate(v) {
    if (!this.monitorVisible) return;
    const absV = Math.abs(v);
    
    // Direction & Format
    let dir = 'STATIONARY';
    let sign = '+';
    if (v > 0.05) {
      dir = 'DOWNWARD';
      sign = '+';
    } else if (v < -0.05) {
      dir = 'UPWARD';
      sign = '-';
    }

    if (this.velocityValEl) {
      this.velocityValEl.textContent = `${sign}${absV.toFixed(2)}`;
    }
    if (this.velocityDirEl) {
      this.velocityDirEl.textContent = dir;
    }
    if (this.velocityBarEl) {
      const scale = Math.min(Math.max(absV * 0.6, 0.04), 1.0);
      this.velocityBarEl.style.transform = `scaleX(${scale})`;
    }

    // Debounced velocity event in stream
    const now = performance.now();
    if (absV > 0.8 && now - this.lastScrollBurstTime > 3000) {
      this.lastScrollBurstTime = now;
      this.pushEvent('SCROLL', `VELOCITY BURST ${sign}${absV.toFixed(2)} PX/MS`);
    }
  }

  startFrameMonitoring() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastRafTime = performance.now();

    const monitorLoop = (time) => {
      if (!this.isRunning) return;

      const delta = time - this.lastRafTime;
      this.lastRafTime = time;

      // Filter extreme outliers (e.g., initial tab focus hitch)
      if (delta > 0 && delta < 200) {
        this.smoothedFrameTime = this.smoothedFrameTime * 0.85 + delta * 0.15;
      }

      // Throttled DOM update (4Hz)
      if (time - this.lastDomUpdateTime > this.domUpdateInterval) {
        this.lastDomUpdateTime = time;
        this.updateFrameDom();
      }

      this.rafId = requestAnimationFrame(monitorLoop);
    };

    this.rafId = requestAnimationFrame(monitorLoop);
  }

  stopFrameMonitoring() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  updateFrameDom() {
    if (this.frameTimeEl) {
      this.frameTimeEl.textContent = this.smoothedFrameTime.toFixed(1);
    }
    if (this.fpsBadgeEl) {
      const calculatedFps = Math.min(Math.round(1000 / this.smoothedFrameTime), 60);
      this.fpsBadgeEl.textContent = `${calculatedFps}.0 FPS`;
    }
  }

  initEventStream() {
    // Seed meaningful initial runtime events
    const initialEvents = [
      { time: this.getTimestamp(), tag: 'SYS', msg: 'SYSTEM ARCHITECTURE ONLINE' },
      { time: this.getTimestamp(), tag: 'CORE', msg: 'LENIS SMOOTH ENGINE SYNCHRONIZED' },
      { time: this.getTimestamp(), tag: 'STAGE', msg: 'CHAPTER 01 IDENTITY COMPOSITED' },
      { time: this.getTimestamp(), tag: 'MOTION', msg: 'CHAPTER 02 POSITION PHILOSOPHY ACTIVE' },
      { time: this.getTimestamp(), tag: 'SENSOR', msg: 'CHAPTER 03 RUNTIME TELEMETRY CONNECTED' }
    ];

    this.events = initialEvents;
    this.renderEventStream();
  }

  pushEvent(tag, msg) {
    const time = this.getTimestamp();
    this.events.unshift({ time, tag, msg });
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }
    this.renderEventStream();
  }

  getTimestamp() {
    const d = new Date();
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  renderEventStream() {
    if (!this.streamEl || this.monitorVisible === false) return;
    this.streamEl.innerHTML = this.events.map(ev => `
      <div class="stream-event-row">
        <span class="stream-time">${ev.time}</span>
        <span class="stream-tag">[${ev.tag}]</span>
        <span class="stream-msg">${ev.msg}</span>
      </div>
    `).join('');
  }

  initScrollChoreography() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (this.prefersReduced) {
      // In reduced motion, present cleanly without pin or transforms
      gsap.set(['.live-system-monumental-headline', '.instrument-card', '.live-system-stream-block', '.live-system-resolve-bridge'], {
        opacity: 1,
        y: 0
      });
      return;
    }

    const mm = gsap.matchMedia();

    // Desktop Pinned Telemetry Experience (>= 860px)
    mm.add('(min-width: 860px)', () => {
      const pinDistance = window.innerHeight * 1.5;

      const systemTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#live-system-pinned-container',
          start: 'top top',
          end: `+=${pinDistance}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          onEnter: () => {
            this.pushEvent('TRIGGER', 'ENTERED CHAPTER 03 / LIVE SYSTEM');
            if (this.sceneEl) this.sceneEl.textContent = '03 / LIVE SYSTEM';
          },
          onLeaveBack: () => {
            if (this.sceneEl) this.sceneEl.textContent = '02 / POSITION';
          }
        }
      });

      // Phase 1 (Initial): Statement is established immediately when entering
      gsap.set(['.live-system-monumental-headline', '.live-system-lead'], {
        opacity: 1,
        y: 0
      });

      // Phase 2 (0.05 - 0.35): Primary Scroll Velocity Gauge reveals
      systemTl.fromTo('.instrument-velocity-card', {
        opacity: 0,
        y: 25
      }, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      }, 0.05);

      // Phase 3 (0.25 - 0.65): Secondary Instruments Grid staggers in
      systemTl.fromTo('.instruments-grid .instrument-card', {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        stagger: 0.06,
        duration: 0.35,
        ease: 'power2.out'
      }, 0.25);

      // Phase 4 (0.50 - 0.85): Real Event Stream Block activates
      systemTl.fromTo('.live-system-stream-block', {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      }, 0.50);

      // Phase 5 (0.75 - 1.0): Telemetry stabilizes, Bridge to Selected Work lights up
      systemTl.fromTo('.live-system-resolve-bridge', {
        opacity: 0,
        y: 15
      }, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out'
      }, 0.75);
    });

    // Mobile Vertical Narrative Flow (< 860px)
    mm.add('(max-width: 859px)', () => {
      gsap.fromTo('.live-system-monumental-headline', {
        opacity: 0,
        y: 30
      }, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        scrollTrigger: {
          trigger: '#system',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      gsap.fromTo('.instrument-velocity-card, .instruments-grid .instrument-card', {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        stagger: 0.08,
        duration: 0.5,
        scrollTrigger: {
          trigger: '.live-system-instruments',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });

      gsap.fromTo('.live-system-stream-block', {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        scrollTrigger: {
          trigger: '.live-system-stream-block',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });
    });
  }
}
