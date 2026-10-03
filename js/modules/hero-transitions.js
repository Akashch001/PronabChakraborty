/**
 * PRONAB / SYSTEM — Preloader & Cinematic Hero -> Position Scrub Transformation
 * Orchestrates initial boot sequence and camera-like 3D typography expansion
 */

export class HeroTransitions {
  constructor() {
    this.preloader = document.getElementById('preloader');
    this.preloaderCount = document.getElementById('preloader-counter');
    this.preloaderBar = document.getElementById('preloader-progress-fill');
    this.preloaderStatus = document.getElementById('preloader-status-text');
    this.heroSection = document.getElementById('home');
    this.heroAmbientImg = document.getElementById('hero-ambient-img');

    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    this.setupHeroToPositionTransformation();
    this.runPreloaderSequence(() => {
      this.playHeroEntrance();
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    });
  }

  runPreloaderSequence(onComplete) {
    if (!this.preloader || this.prefersReduced) {
      if (this.preloader) this.preloader.style.display = 'none';
      if (onComplete) onComplete();
      return;
    }

    const counterObj = { val: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(this.preloader, {
          yPercent: -100,
          duration: 0.85,
          ease: 'power4.inOut',
          onComplete: () => {
            this.preloader.style.display = 'none';
            if (onComplete) onComplete();
          }
        });
      }
    });

    tl.to(counterObj, {
      val: 100,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => {
        const rounded = Math.floor(counterObj.val);
        if (this.preloaderCount) {
          this.preloaderCount.textContent = `${rounded < 10 ? '0' + rounded : rounded}%`;
        }
        if (this.preloaderBar) {
          this.preloaderBar.style.transform = `scaleX(${counterObj.val / 100})`;
        }
        if (this.preloaderStatus) {
          if (rounded < 40) {
            this.preloaderStatus.textContent = 'BOOTING SYSTEM ARCHITECTURE...';
          } else if (rounded < 80) {
            this.preloaderStatus.textContent = 'SYNCHRONIZING INTERFACES...';
          } else {
            this.preloaderStatus.textContent = 'SYSTEM CORE ONLINE';
          }
        }
      }
    });
  }

  playHeroEntrance() {
    if (this.prefersReduced) {
      gsap.set(['#hero-stage', '.hero-subject-cutout', '.hero-monumental-line', '.hero-meta-block', '.site-header'], {
        y: 0,
        x: 0,
        opacity: 1,
        scale: 1
      });
      return;
    }

    if (window.innerWidth < 860) {
      // Crisp mobile entrance without heavy delays
      gsap.fromTo(['#hero-stage', '.hero-subject-cutout', '.hero-monumental-line', '.hero-meta-block', '.site-header'], {
        opacity: 0,
        y: 15
      }, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: 'power2.out'
      });
      return;
    }

    const tl = gsap.timeline();

    // 1. Background atmosphere appears
    tl.fromTo('#hero-stage', {
      opacity: 0,
      scale: 1.05
    }, {
      opacity: 1,
      scale: 1,
      duration: 1.3,
      ease: 'power2.out'
    }, 0);

    // 2. Portrait rises subtly
    tl.fromTo('.hero-subject-cutout', {
      y: 40,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 1.2,
      ease: 'power3.out'
    }, 0.2);

    // 3. Monumental name becomes visible (behind subject)
    tl.fromTo('.hero-monumental-line', {
      y: 35,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 1.1,
      stagger: 0.1,
      ease: 'power4.out'
    }, 0.35);

    // 4. Minimal navigation appears
    tl.fromTo('.site-header', {
      y: -15,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out'
    }, 0.55);

    // 5. Small metadata appears
    tl.fromTo('.hero-meta-block', {
      y: 15,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power2.out'
    }, 0.65);
  }

  setupHeroToPositionTransformation() {
    if (this.prefersReduced || !this.heroSection) return;

    const mm = gsap.matchMedia();

    // Desktop & Tablet Choreography (>= 860px)
    mm.add('(min-width: 860px)', () => {
      // 1.8 viewport heights of scroll for cinematic, deliberate storytelling
      const pinDistance = window.innerHeight * 1.8;

      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero-pinned-wrapper',
          start: 'top top',
          end: `+=${pinDistance}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1
        }
      });

      // PHASE 1 (0.00 - 0.40): Identity transforms, letters move to edges, portrait pushes forwards/down through camera
      // PRONAB drifts left and crops toward edge
      masterTl.to('.hero-line-pronab', {
        xPercent: -35,
        opacity: 0.08,
        ease: 'power2.inOut',
        duration: 0.45
      }, 0);

      // CHAKRABORTY drifts right and crops toward edge
      masterTl.to('.hero-line-chakraborty', {
        xPercent: 35,
        opacity: 0.08,
        ease: 'power2.inOut',
        duration: 0.45
      }, 0);

      // Foreground portrait shifts in depth (camera pushing past subject)
      masterTl.to('.hero-subject-wrap', {
        scale: 1.12,
        y: 60,
        opacity: 0,
        ease: 'power2.in',
        duration: 0.38
      }, 0);

      // Corner metadata floats away
      masterTl.to('.hero-editorial-overlay', {
        y: -30,
        opacity: 0,
        ease: 'power1.out',
        duration: 0.25
      }, 0);

      // Background becomes dark graphite
      masterTl.to(this.heroAmbientImg, {
        scale: 1.15,
        opacity: 0.05,
        ease: 'power1.inOut',
        duration: 0.45
      }, 0);

      // PHASE 2 (0.22 - 0.60): Negative space opens, Chapter 02 / POSITION emerges through the center
      masterTl.fromTo('#position-stage', {
        opacity: 0,
        pointerEvents: 'none'
      }, {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.3,
        ease: 'power2.out'
      }, 0.25);

      masterTl.fromTo('.position-meta-row', {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out'
      }, 0.30);

      masterTl.fromTo('.position-monumental-headline .position-line', {
        opacity: 0,
        y: 35
      }, {
        opacity: 1,
        y: 0,
        stagger: 0.1,
        duration: 0.35,
        ease: 'power3.out'
      }, 0.35);

      // PHASE 3 (0.50 - 0.85): Progressive reveal of manifesto & punchline
      masterTl.fromTo('.position-manifesto-text', {
        opacity: 0,
        y: 25
      }, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      }, 0.50);

      masterTl.fromTo('.position-punchline-text', {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out'
      }, 0.65);

      // Hold reading frame steady so the statement is absorbed
      masterTl.to('#position-stage', {
        opacity: 1,
        duration: 0.25
      }, 0.75);
    });

    // Mobile Choreography (< 860px)
    mm.add('(max-width: 859px)', () => {
      const pinDistance = window.innerHeight * 1.15;

      const mobileTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero-pinned-wrapper',
          start: 'top top',
          end: `+=${pinDistance}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1
        }
      });

      mobileTl.to('.hero-line-pronab', { x: -28, opacity: 0.05, duration: 0.3 }, 0);
      mobileTl.to('.hero-line-chakraborty', { x: 28, opacity: 0.05, duration: 0.3 }, 0);
      mobileTl.to('.hero-subject-wrap', { opacity: 0, scale: 1.05, y: 25, duration: 0.25 }, 0);
      mobileTl.to('.hero-editorial-overlay', { opacity: 0, duration: 0.15 }, 0);

      mobileTl.fromTo('#position-stage', { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.18);
      mobileTl.fromTo('.position-monumental-headline', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.25 }, 0.22);
      mobileTl.fromTo('.position-manifesto-text', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25 }, 0.32);
      mobileTl.fromTo('.position-punchline-text', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.2 }, 0.42);
      mobileTl.to('#position-stage', { opacity: 1, duration: 0.3 }, 0.6);
    });
  }
}
