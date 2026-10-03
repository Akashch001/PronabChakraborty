/**
 * PRONAB / SYSTEM — Custom Lerp Cursor & Magnetic Affordances
 * High performance, lerp-interpolated cursor with contextual badges
 */

export class CustomCursor {
  constructor() {
    this.cursorWrap = document.getElementById('custom-cursor');
    this.cursorDot = document.getElementById('cursor-dot');
    this.cursorRing = document.getElementById('cursor-ring');
    this.cursorLabel = document.getElementById('cursor-label');

    this.mouse = { x: -100, y: -100 };
    this.ringPos = { x: -100, y: -100 };
    this.currentMode = 'default';
    this.hasMoved = false;

    // Check pointer capabilities
    this.isFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.isFinePointer && !this.prefersReduced && this.cursorWrap) {
      this.init();
    } else if (this.cursorWrap) {
      this.cursorWrap.style.display = 'none';
    }
  }

  init() {
    document.body.classList.add('has-custom-cursor');

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      if (!this.hasMoved) {
        this.hasMoved = true;
        this.ringPos.x = e.clientX;
        this.ringPos.y = e.clientY;
        this.cursorWrap.classList.add('is-active');
      }

      this.startRenderLoop();

      // Fast update for center dot
      if (this.cursorDot) {
        this.cursorDot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.cursorWrap.classList.remove('is-active');
    });

    window.addEventListener('mouseenter', () => {
      this.cursorWrap.classList.add('is-active');
    });

    const stopLoop = () => {
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopLoop();
    });
    window.addEventListener('pagehide', stopLoop);

    this.initMagneticElements();
    this.initContextHoverTargets();
  }

  startRenderLoop() {
    if (this.animationFrameId) return;
    const loop = () => {
      // Lerp ring position with 0.16 smoothing factor
      const ease = 0.16;
      this.ringPos.x += (this.mouse.x - this.ringPos.x) * ease;
      this.ringPos.y += (this.mouse.y - this.ringPos.y) * ease;

      if (this.cursorRing) {
        this.cursorRing.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0)`;
      }

      if (Math.abs(this.mouse.x - this.ringPos.x) + Math.abs(this.mouse.y - this.ringPos.y) > 0.1) {
        this.animationFrameId = requestAnimationFrame(loop);
      } else {
        this.animationFrameId = null;
      }
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  setCursorMode(mode, labelText = '') {
    if (!this.cursorWrap) return;
    this.currentMode = mode;
    this.cursorWrap.setAttribute('data-cursor-mode', mode);

    if (this.cursorLabel) {
      this.cursorLabel.textContent = labelText;
    }
  }

  initContextHoverTargets() {
    // Project chapters
    document.querySelectorAll('[data-cursor="view"]').forEach(el => {
      el.addEventListener('mouseenter', () => this.setCursorMode('view', 'VIEW'));
      el.addEventListener('mouseleave', () => this.setCursorMode('default', ''));
    });

    // Horizontal track or drag areas
    document.querySelectorAll('[data-cursor="drag"]').forEach(el => {
      el.addEventListener('mouseenter', () => this.setCursorMode('drag', 'DRAG'));
      el.addEventListener('mouseleave', () => this.setCursorMode('default', ''));
    });

    // Interactive canvas / playground
    document.querySelectorAll('[data-cursor="explore"]').forEach(el => {
      el.addEventListener('mouseenter', () => this.setCursorMode('explore', 'EXPLORE'));
      el.addEventListener('mouseleave', () => this.setCursorMode('default', ''));
    });

    // Code / Algorithm lab
    document.querySelectorAll('[data-cursor="run"]').forEach(el => {
      el.addEventListener('mouseenter', () => this.setCursorMode('run', 'SOLVE'));
      el.addEventListener('mouseleave', () => this.setCursorMode('default', ''));
    });

    // Links & external triggers
    document.querySelectorAll('a, button, [role="button"]').forEach(el => {
      if (!el.hasAttribute('data-cursor')) {
        el.addEventListener('mouseenter', () => this.setCursorMode('action', ''));
        el.addEventListener('mouseleave', () => this.setCursorMode('default', ''));
      }
    });
  }

  initMagneticElements() {
    const magneticItems = document.querySelectorAll('.magnetic-target');

    magneticItems.forEach(item => {
      let rect = null;

      const updateRect = () => {
        rect = item.getBoundingClientRect();
      };

      item.addEventListener('mouseenter', updateRect);
      window.addEventListener('scroll', updateRect, { passive: true });

      item.addEventListener('mousemove', (e) => {
        if (!rect) updateRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;

        // Subtle displacement (up to 8px)
        const moveX = distanceX * 0.22;
        const moveY = distanceY * 0.22;

        item.style.transform = `translate3d(${moveX.toFixed(1)}px, ${moveY.toFixed(1)}px, 0)`;
      });

      item.addEventListener('mouseleave', () => {
        item.style.transform = 'translate3d(0, 0, 0)';
        rect = null;
      });
    });
  }
}
