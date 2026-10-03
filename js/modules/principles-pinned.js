/**
 * PRONAB / SYSTEM — Chapter 08 / Core Principles
 * Architectural Asymmetric Pinned Manifesto
 * Left: Architectural Sticky Anchor (OBSERVE. ENGINEER. SHIP.)
 * Right: Controlled Editorial Narrative Stages (01, 02, 03)
 */

export class PrinciplesPinned {
  constructor() {
    this.section = document.getElementById('principles-section');
    this.manifestoWords = document.querySelectorAll('.manifesto-word');
    this.stageCards = document.querySelectorAll('.principle-stage-card');
    this.stepCurrent = document.querySelector('.step-current');
    this.progressBar = document.querySelector('.principles-progress-bar');
    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    if (!this.section || !this.stageCards.length) return;

    if (this.prefersReduced) {
      this.initReducedMotion();
      return;
    }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 860px)', () => {
      // Modest pin distance (1.8 viewport heights) so user never feels trapped
      const pinDistance = window.innerHeight * 1.8;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#principles-section',
          start: 'top top',
          end: `+=${pinDistance}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1
        }
      });

      // Initial visual state
      gsap.set(this.stageCards[0], { opacity: 1, y: 0, filter: 'blur(0px)' });
      gsap.set(this.stageCards[1], { opacity: 0.15, y: 40, filter: 'blur(1px)' });
      gsap.set(this.stageCards[2], { opacity: 0.15, y: 40, filter: 'blur(1px)' });
      if (this.progressBar) gsap.set(this.progressBar, { scaleY: 0.333 });
      this.setActiveWord(0);

      // Phase 1 -> Phase 2 (OBSERVE -> ENGINEER)
      tl.to(this.stageCards[0], {
        opacity: 0.15,
        y: -30,
        filter: 'blur(2px)',
        duration: 0.8,
        ease: 'power1.inOut'
      }, 0.5)
      .to(this.stageCards[1], {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power2.out',
        onStart: () => {
          this.setActiveWord(1);
          if (this.stepCurrent) this.stepCurrent.textContent = '02';
        },
        onReverseComplete: () => {
          this.setActiveWord(0);
          if (this.stepCurrent) this.stepCurrent.textContent = '01';
        }
      }, 0.5)
      .to(this.progressBar, {
        scaleY: 0.666,
        duration: 0.8,
        ease: 'none'
      }, 0.5);

      // Phase 2 -> Phase 3 (ENGINEER -> SHIP)
      tl.to(this.stageCards[1], {
        opacity: 0.15,
        y: -30,
        filter: 'blur(2px)',
        duration: 0.8,
        ease: 'power1.inOut'
      }, 1.3)
      .to(this.stageCards[2], {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power2.out',
        onStart: () => {
          this.setActiveWord(2);
          if (this.stepCurrent) this.stepCurrent.textContent = '03';
        },
        onReverseComplete: () => {
          this.setActiveWord(1);
          if (this.stepCurrent) this.stepCurrent.textContent = '02';
        }
      }, 1.3)
      .to(this.progressBar, {
        scaleY: 1.0,
        duration: 0.8,
        ease: 'none'
      }, 1.3);

      // Final quiet hold before exit bridge
      tl.to({}, { duration: 0.3 });
    });

    mm.add('(max-width: 859px)', () => {
      // Natural vertical narrative flow on mobile
      this.stageCards.forEach(card => {
        gsap.set(card, { opacity: 1, y: 0, filter: 'none' });
      });
      this.manifestoWords.forEach(w => {
        w.classList.add('is-active');
        w.classList.remove('is-quiet');
      });
      if (this.progressBar) {
        gsap.set(this.progressBar, { scaleY: 1 });
      }
    });
  }

  setActiveWord(activeIdx) {
    this.manifestoWords.forEach((word, idx) => {
      if (idx === activeIdx) {
        word.classList.add('is-active');
        word.classList.remove('is-quiet');
      } else {
        word.classList.remove('is-active');
        word.classList.add('is-quiet');
      }
    });
  }

  initReducedMotion() {
    this.stageCards.forEach(card => {
      card.style.opacity = '1';
      card.style.transform = 'none';
      card.style.filter = 'none';
    });
    this.manifestoWords.forEach(word => {
      word.classList.remove('is-quiet');
      word.classList.add('is-active');
    });
  }
}
