/** Contact owns its entrance and final frame; normal flow supplies the ending. */
export class ContactEnding {
  constructor() {
    this.contactSection = document.getElementById('contact');
    this.sideRail = document.querySelector('.side-rail');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) this.setupContactEnding();
  }

  setupContactEnding() {
    if (!this.contactSection) return;

    // Contact monumental headline reveal
    const headline = document.getElementById('contact-heading');
    if (headline) {
      gsap.fromTo(headline, {
        y: 40,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headline,
          id: 'contact-headline',
          start: 'top 90%',
          end: 'top 65%',
          scrub: true
        }
      });
    }

    // Primary action link reveal
    const primaryAction = document.querySelector('.contact-primary-block');
    if (primaryAction) {
      gsap.fromTo(primaryAction, {
        y: 25,
        opacity: 0
      }, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: primaryAction,
          id: 'contact-action',
          start: 'top 95%',
          end: 'clamp(top 75%)',
          scrub: true
        }
      });
    }

    // Hide side rail smoothly when entering bottom contact/footer zone
    if (this.sideRail) {
      gsap.fromTo(this.sideRail, { opacity: 1 }, {
        opacity: 0, ease: 'none',
        scrollTrigger: { id: 'contact-rail', trigger: this.contactSection,
          start: 'top 70%', end: 'top 55%', scrub: true }
      });
    }
  }
}
