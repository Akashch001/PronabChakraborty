/**
 * PRONAB / SYSTEM — Global Scroll Engine & Velocity Tracker
 * Lenis Smooth Scroll + GSAP ScrollTrigger Integration
 */

export class ScrollEngine {
  constructor() {
    this.lenis = null;
    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.velocity = 0;
    this.scrollProgress = 0;
    this.velocityListeners = [];
    this.init();
  }

  init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.error('GSAP or ScrollTrigger not loaded');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // If reduced motion is preferred, keep native scrolling and disable complex transforms
    if (this.prefersReduced) {
      document.documentElement.classList.add('reduced-motion');
      this.initNativeScrollTracking();
      return;
    }

    if (typeof Lenis !== 'undefined') {
      this.lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.8,
        infinite: false
      });

      // Synchronize Lenis with GSAP ScrollTrigger
      this.lenis.on('scroll', (e) => {
        ScrollTrigger.update();
        this.velocity = e.velocity || 0;
        this.notifyVelocity(this.velocity);
        this.updateGlobalProgress(e.progress);
      });

      gsap.ticker.add((time) => {
        this.lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    } else {
      this.initNativeScrollTracking();
    }

    this.initVelocitySkew();
  }

  initNativeScrollTracking() {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollY / docHeight : 0;
      this.updateGlobalProgress(progress);
      ScrollTrigger.update();
    }, { passive: true });
  }

  onVelocity(callback) {
    if (typeof callback === 'function') {
      this.velocityListeners.push(callback);
    }
  }

  notifyVelocity(v) {
    for (let i = 0; i < this.velocityListeners.length; i++) {
      this.velocityListeners[i](v);
    }
  }

  updateGlobalProgress(progress) {
    this.scrollProgress = progress;
    const bar = document.getElementById('global-scroll-progress-bar');
    if (bar) {
      bar.style.transform = `scaleX(${progress})`;
    }
  }

  initVelocitySkew() {
    if (this.prefersReduced) return;
    
    // Subtle kinetic typography tilt on high velocity scroll
    const skewElements = document.querySelectorAll('.kinetic-velocity-target:not(#nexus-heading):not(#about-story-headline):not(#contact-heading)');
    if (!skewElements.length) return;

    let targetSkew = 0;
    let currentSkew = 0;

    this.onVelocity((v) => {
      // Clamp subtle skew between -2.5 and 2.5 deg
      targetSkew = Math.max(-2.5, Math.min(2.5, v * 0.12));
    });

    gsap.ticker.add(() => {
      currentSkew += (targetSkew - currentSkew) * 0.15;
      targetSkew *= 0.92; // smooth decay when stopped
      if (Math.abs(currentSkew) > 0.01) {
        skewElements.forEach(el => {
          el.style.transform = `skewY(${currentSkew.toFixed(2)}deg)`;
        });
      } else {
        skewElements.forEach(el => {
          el.style.transform = 'skewY(0deg)';
        });
      }
    });
  }

  scrollTo(target, options = {}) {
    if (this.lenis) {
      this.lenis.scrollTo(target, {
        offset: options.offset || 0,
        duration: options.duration || 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      });
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
}
