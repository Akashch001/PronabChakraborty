/**
 * PRONAB / SYSTEM — Chapter 13: Quiet Human Editorial Reveal
 * Calm, dignified portrait depth and typography entrance without spectacle
 */

export class AboutReveal {
  constructor() {
    this.aboutHeadline = document.getElementById('about-story-headline');
    this.portrait = document.querySelector('.person-portrait-img');
    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
  }

  init() {
    if (this.prefersReduced) return;

    this.setupHeadline();
    this.setupPortraitAndMeta();
  }

  setupHeadline() {
    if (!this.aboutHeadline) return;

    gsap.fromTo(this.aboutHeadline, {
      opacity: 0.15,
      y: 25
    }, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#about-story-block',
        id: 'about-headline',
        start: 'top 92%',
        end: 'top 72%',
        scrub: true
      }
    });
  }

  setupPortraitAndMeta() {
    // Subtle, calm portrait depth shift
    if (this.portrait) {
      gsap.fromTo(this.portrait, {
        y: 20,
        scale: 1.03
      }, {
        y: -15,
        scale: 1.0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.person-editorial-grid',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    // Stagger plain metadata rows quietly
    const metaRows = document.querySelectorAll('.about-meta-row');
    if (metaRows.length) {
      gsap.fromTo(metaRows, {
        y: 12,
        opacity: 0.15
      }, {
        y: 0,
        opacity: 1,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.about-plain-metadata',
          start: 'top 95%',
          end: 'top 75%',
          scrub: true
        }
      });
    }

    // Subtle entrance for exit bridge
    const exitBridge = document.getElementById('about-exit-bridge');
    if (exitBridge) {
      gsap.fromTo(exitBridge, {
        y: 20,
        opacity: 0.15
      }, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: exitBridge,
          start: 'top 95%',
          end: 'top 75%',
          scrub: true
        }
      });
    }
  }
}
