/**
 * PRONAB / SYSTEM — Selected Work Controller
 * Three Immersive Project Environments:
 *   - SYSTEM 01 — NEXUS WORLD (Architecture: Assemble -> Connect -> Activate)
 *   - SYSTEM 02 — PET BOOKING SYSTEM (User Journey: Select -> Progress -> Confirm)
 *   - SYSTEM 03 — LOCAL BUSINESS GROWTH OS (Data Lifecycle: Enter -> Qualify -> Route)
 * Master sequential spatial continuity on desktop with interaction holds;
 * Natural unpinned vertical flow on mobile;
 * Reduced-motion and lifecycle safeguards.
 */

export class HorizontalWork {
  constructor() {
    this.container = document.getElementById('work-pinned-container');
    this.track = document.getElementById('horizontal-track');
    this.environments = document.querySelectorAll('.project-environment');
    this.spatialIndicators = document.querySelectorAll('.spatial-ind-item');
    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.masterTimeline = null;
    this.nexusInterval = null;
    this.activeSystem = 1;

    this.init();
  }

  init() {
    this.initInteractivePrototypes();
    this.initProjectDisclosures();

    if (this.prefersReduced) {
      this.initReducedMotionState();
      return;
    }

    this.initChoreography();
  }

  /* --------------------------------------------------------------------------
     CHOREOGRAPHY: DESKTOP PINNED SPATIAL CONTINUITY & MOBILE VERTICAL FLOW
     -------------------------------------------------------------------------- */
  initChoreography() {
    if (!this.container || !this.track || !this.environments.length) return;

    const mm = gsap.matchMedia();

    // Desktop/Tablet (>= 900px): Pinned Spatial Continuity with Interaction Holds
    mm.add('(min-width: 900px)', () => {

      // Master Pinned Timeline
      this.masterTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '#work-pinned-container',
          start: 'top top',
          end: () => `+=${window.innerHeight * 4.2}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => this.handleScrollProgress(self.progress)
        }
      });

      // 1. Intro sequence: visible upon arrival, fades cleanly as user scrubs toward System 01
      this.masterTimeline.to(
        ['.intro-monumental-title', '.intro-systems-index', '.intro-statement-lead', '.intro-pre-tag', '.intro-scroll-hint'],
        {
          opacity: 0,
          y: -24,
          stagger: 0.04,
          duration: 0.7,
          ease: 'power2.in'
        },
        0.3
      );

      // Transition to Nexus World (shift track from 0 to -100vw)
      this.masterTimeline.to(
        this.track,
        {
          x: () => -window.innerWidth * 1,
          duration: 1.6,
          ease: 'power2.inOut'
        },
        1.0
      );

      // System 01 / Nexus Timeline: ASSEMBLE -> CONNECT -> ACTIVATE
      this.masterTimeline.fromTo(
        '.env-nexus .arch-node',
        { y: 20, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.12, duration: 0.8, ease: 'power3.out' },
        1.8
      );

      this.masterTimeline.fromTo(
        '.env-nexus .arch-worker-card',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: 'power2.out' },
        2.2
      );

      this.masterTimeline.fromTo(
        '.env-nexus .nexus-proto-shell',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
        2.4
      );

      // Interaction Hold 01: System 01 remains steady
      this.masterTimeline.to({}, { duration: 1.0 });

      // Transition to Pet Booking (shift track from -100vw to -200vw)
      this.masterTimeline.to(
        this.track,
        {
          x: () => -window.innerWidth * 2,
          duration: 1.6,
          ease: 'power2.inOut'
        },
        '+=0.2'
      );

      // System 02 / Pet Booking Timeline: SELECT -> PROGRESS -> CONFIRM
      this.masterTimeline.fromTo(
        '.env-pet .journey-step-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.14, duration: 0.8, ease: 'power3.out' },
        '>-0.4'
      );

      this.masterTimeline.fromTo(
        '.env-pet .pet-proto-shell',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
        '>-0.3'
      );

      // Interaction Hold 02: System 02 remains steady
      this.masterTimeline.to({}, { duration: 1.0 });

      // Transition to Growth OS (shift track from -200vw to -300vw)
      this.masterTimeline.to(
        this.track,
        {
          x: () => -window.innerWidth * 3,
          duration: 1.6,
          ease: 'power2.inOut'
        },
        '+=0.2'
      );

      // System 03 / Growth OS Timeline: ENTER -> QUALIFY -> ROUTE
      this.masterTimeline.fromTo(
        '.env-growth .lead-lifecycle-card',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '>-0.4'
      );

      this.masterTimeline.fromTo(
        '.env-growth .growth-proto-shell',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
        '>-0.3'
      );

      // Interaction Hold 03: System 03 remains steady
      this.masterTimeline.to({}, { duration: 1.0 });

      // Transition to Resolution (shift track from -300vw to -400vw)
      this.masterTimeline.to(
        this.track,
        {
          x: () => -window.innerWidth * 4,
          duration: 1.6,
          ease: 'power2.inOut'
        },
        '+=0.2'
      );

      // Resolution Exit Timeline: Bridge to Principles
      this.masterTimeline.fromTo(
        '.env-resolution .res-monumental-heading',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' },
        '>-0.4'
      );

      this.masterTimeline.fromTo(
        '.env-resolution .res-subtext',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '>-0.2'
      );
    });

    // Mobile / Tablet (< 900px): Natural Unpinned Vertical Flow
    mm.add('(max-width: 899px)', () => {
      // Clear inline transform from desktop resize
      if (this.track) {
        gsap.set(this.track, { clearProps: 'transform' });
      }

      this.environments.forEach(env => {
        gsap.fromTo(
          env,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: env,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // Visibility observer owns the mobile feed lifecycle.
      this.startNexusFeed();
    });
  }

  /* Update restrained spatial indicator & manage lifecycle pauses */
  handleScrollProgress(progress) {
    let activeIdx = 1;

    if (progress < 0.22) {
      activeIdx = 1;
      this.startNexusFeed();
    } else if (progress >= 0.22 && progress < 0.52) {
      activeIdx = 1;
      this.startNexusFeed();
    } else if (progress >= 0.52 && progress < 0.78) {
      activeIdx = 2;
      this.stopNexusFeed();
    } else {
      activeIdx = 3;
      this.stopNexusFeed();
    }

    if (activeIdx !== this.activeSystem) {
      this.activeSystem = activeIdx;
      this.spatialIndicators.forEach((ind, i) => {
        if (i + 1 === activeIdx) {
          ind.classList.add('is-active');
        } else {
          ind.classList.remove('is-active');
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     INTERACTIVE PROTOTYPES (Preserved & Enhanced Logic)
     -------------------------------------------------------------------------- */
  initInteractivePrototypes() {
    this.initNexusWorldPrototype();
    this.initPetBookingPrototype();
    this.initGrowthOSPrototype();
  }

  /* 01. Nexus World — Live Event-Driven Architecture Simulator */
  initNexusWorldPrototype() {
    const proto = document.getElementById('proto-nexus-world');
    if (!proto) return;

    const toggleBtns = document.querySelectorAll('.proto-nexus-btn');

    this.sampleEvents = [
      { type: 'AUTH', text: 'Auth payload validated via JWT token' },
      { type: 'BUS', text: 'Event published: order.created -> topic/v1' },
      { type: 'WORKER', text: 'Worker #01 payload transform in 1.8ms' },
      { type: 'SYNC', text: 'Worker #02 state synchronizer flushed 12 entity updates' },
      { type: 'API', text: 'Gateway GraphQL query executed in 11ms: getProjectTopology' },
      { type: 'DISPATCH', text: 'Worker #03 webhook delivered to downstream consumer' }
    ];

    this.eventIdx = 0;

    // Interactive node switches
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetNode = btn.getAttribute('data-node');
        const isNowActive = !btn.classList.contains('is-active');
        btn.classList.toggle('is-active', isNowActive);
        btn.setAttribute('aria-pressed', isNowActive ? 'true' : 'false');

        // Toggle corresponding nodes in architecture diagram
        const nodes = document.querySelectorAll(`.proto-arch-node[data-node="${targetNode}"]`);
        nodes.forEach(n => n.classList.toggle('is-active', isNowActive));

        const state = isNowActive ? 'DEPLOYED' : 'PAUSED';
        this.emitNexusEvent(`${targetNode.toUpperCase()} module transitioned to ${state}`, 'TOGGLE');
      });
    });

    // Initial seed events
    this.emitNexusEvent('Gateway initialized on port 8080', 'INIT');
    this.emitNexusEvent('Event Bus connected to topic/v1 broker', 'INIT');
    this.feedObserver = new IntersectionObserver(([entry]) => {
      this.feedVisible = entry.isIntersecting;
      if (this.feedVisible && !document.hidden) this.startNexusFeed();
      else this.stopNexusFeed();
    });
    this.feedObserver.observe(proto);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stopNexusFeed();
      else if (this.feedVisible) this.startNexusFeed();
    });
  }

  emitNexusEvent(customText, customType = 'SYSTEM') {
    const eventFeed = document.getElementById('proto-nexus-world');
    if (!eventFeed) return;

    const item = document.createElement('div');
    item.className = 'proto-event-line';
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
    item.innerHTML = `
      <span class="proto-ev-time">${time}</span>
      <span class="proto-ev-tag">${customType}</span>
      <span class="proto-ev-text">${customText}</span>
    `;
    eventFeed.prepend(item);

    while (eventFeed.children.length > 5) {
      eventFeed.removeChild(eventFeed.lastChild);
    }
  }

  startNexusFeed() {
    if (this.nexusInterval || !this.feedVisible || document.hidden || this.prefersReduced) return;
    this.nexusInterval = setInterval(() => {
      if (!this.sampleEvents) return;
      const ev = this.sampleEvents[this.eventIdx % this.sampleEvents.length];
      this.emitNexusEvent(ev.text, ev.type);
      this.eventIdx++;
    }, 3500);
  }

  stopNexusFeed() {
    if (this.nexusInterval) {
      clearInterval(this.nexusInterval);
      this.nexusInterval = null;
    }
  }

  /* 02. Pet Booking System — Live Interactive Scheduling Prototype */
  initPetBookingPrototype() {
    const proto = document.getElementById('proto-pet-booking');
    if (!proto) return;

    const servicePills = proto.querySelectorAll('.proto-service-pill');
    const slotPills = proto.querySelectorAll('.proto-slot-pill');
    const bookBtn = proto.querySelector('.proto-book-btn');
    const confirmationBox = proto.querySelector('.proto-confirm-banner');
    const serviceNameLabel = document.getElementById('proto-selected-service');

    let currentService = 'Full Grooming ($65)';
    let currentSlot = '10:00 AM';

    servicePills.forEach(pill => {
      pill.addEventListener('click', () => {
        servicePills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        currentService = pill.getAttribute('data-service');
        if (serviceNameLabel) serviceNameLabel.textContent = currentService;
        if (confirmationBox) confirmationBox.style.display = 'none';
      });
    });

    slotPills.forEach(pill => {
      pill.addEventListener('click', () => {
        slotPills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        currentSlot = pill.getAttribute('data-slot');
        if (confirmationBox) confirmationBox.style.display = 'none';
      });
    });

    if (bookBtn && confirmationBox) {
      bookBtn.addEventListener('click', () => {
        confirmationBox.innerHTML = `
          <div class="proto-confirm-check">✓</div>
          <div class="proto-confirm-msg">
            <strong>Booking Confirmed: ${currentService}</strong>
            <span>Scheduled for Tomorrow at ${currentSlot}. Provider calendar synced.</span>
          </div>
        `;
        confirmationBox.style.display = 'flex';
        gsap.fromTo(confirmationBox, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
      });
    }
  }

  /* 03. Local Business Growth OS — Live Lead Triage Stream */
  initGrowthOSPrototype() {
    const stream = document.getElementById('proto-growth-os');
    const triggerBtn = document.querySelector('.proto-sim-lead-btn');
    if (!stream || !triggerBtn) return;

    const sampleLeads = [
      { name: 'Dr. Sarah Lin', service: 'Dental Implant Consultation', score: 98, status: 'VIP AUTO-ROUTED · SMS CONFIRMED' },
      { name: 'Apex Logistics', service: 'Fleet Maintenance Contract', score: 92, status: 'CRM SYNCED · DISPATCH NOTIFIED' },
      { name: 'Mark Vance', service: 'Residential HVAC Emergency', score: 96, status: 'DIRECT DISPATCH · ON-CALL DIALED' },
      { name: 'Elena Rostova', service: 'Commercial Lease Advisory', score: 94, status: 'INSTANT SMS SENT · CALENDAR LINKED' },
      { name: 'Redwood Legal', service: 'Corporate Retainer Inquiry', score: 99, status: 'PARTNER AUTO-ASSIGNED · CRM UPDATED' }
    ];

    let leadIdx = 0;

    const pushLead = (lead) => {
      const card = document.createElement('div');
      card.className = 'proto-lead-card';
      card.innerHTML = `
        <div class="proto-lead-head">
          <span class="proto-lead-name">${lead.name}</span>
          <span class="proto-lead-score">${lead.score}% MATCH</span>
        </div>
        <div class="proto-lead-sub">${lead.service}</div>
        <div class="proto-lead-action">⚡ ${lead.status}</div>
      `;

      stream.prepend(card);
      gsap.fromTo(card, { opacity: 0, y: -10, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' });

      while (stream.children.length > 3) {
        stream.removeChild(stream.lastChild);
      }
    };

    triggerBtn.addEventListener('click', () => {
      const lead = sampleLeads[leadIdx % sampleLeads.length];
      leadIdx++;
      pushLead(lead);
    });
  }

  /* Accessible proposal details disclosure toggle */
  initProjectDisclosures() {
    const btns = document.querySelectorAll('.details-summary-btn');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('aria-controls');
        const drawer = document.getElementById(targetId);
        if (!drawer) return;

        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          gsap.to(drawer, {
            height: 0,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.inOut',
            onComplete: () => {
              drawer.style.display = 'none';
              btn.setAttribute('aria-expanded', 'false');
              const span = btn.querySelector('span');
              if (span) span.textContent = span.textContent.replace('Hide', 'View').replace('▴', '▾');
              ScrollTrigger.refresh();
            }
          });
        } else {
          drawer.style.display = 'block';
          drawer.style.height = 'auto';
          const height = drawer.offsetHeight;
          drawer.style.height = '0px';

          gsap.to(drawer, {
            height: height,
            opacity: 1,
            duration: 0.35,
            ease: 'power3.out',
            onComplete: () => {
              drawer.style.height = 'auto';
              btn.setAttribute('aria-expanded', 'true');
              const span = btn.querySelector('span');
              if (span) span.textContent = span.textContent.replace('View', 'Hide').replace('▾', '▴');
              ScrollTrigger.refresh();
            }
          });
        }
      });
    });
  }

  /* Reduced-motion Fallback State */
  initReducedMotionState() {
    if (this.track) {
      gsap.set(this.track, { clearProps: 'all' });
    }
    this.environments.forEach(env => {
      gsap.set(env, { opacity: 1, y: 0 });
    });
    // Run live prototype feed quietly
    this.startNexusFeed();
  }
}

