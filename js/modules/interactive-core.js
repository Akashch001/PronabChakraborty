/**
 * PRONAB / SYSTEM — Chapter 11: Three.js Core / Spatial System
 * Mathematical particle lattice in dynamic equilibrium.
 * 
 * Implements:
 * 1. Palette: Cream & warm white nodes on graphite (#0d0f12), disciplined inner core wireframe.
 * 2. States: EQUILIBRIUM -> POINTER ACTIVE -> SHOCKWAVE PULSE -> RESOLVING.
 * 3. Bounded shockwave lifecycle: Max 2 concurrent waves, clean damping, zero memory leaks.
 * 4. Responsive compute: 750 nodes (desktop), 500 (tablet), 320 (mobile).
 * 5. DPR Capping: 1.5 (desktop), 1.25 (tablet), 1.0 (mobile).
 * 6. Lifecycle: IntersectionObserver + PageVisibility pausing, emits 'spatial-core-loop-state'.
 * 7. Reduced motion: Single static render, 0 persistent RAF overhead.
 */

import * as THREE from '../vendor/three.module.js';

export class InteractiveCore {
  constructor() {
    this.container = document.getElementById('playground-canvas-container');
    this.canvas = document.getElementById('playground-core-canvas');
    this.stateEl = document.getElementById('core-state-val');
    this.nodeCountEl = document.getElementById('core-node-count');
    this.affordanceEl = document.getElementById('core-affordance-val');
    this.rendererValEl = document.getElementById('core-renderer-val');

    this.prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.particles = null;
    this.innerCore = null;
    
    // Responsive particle count
    this.particleCount = this.calculateParticleCount();
    this.positions = null;
    this.originalPositions = null;
    
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, isActive: false };
    this.isVisible = false;
    this.animationFrameId = null;
    this.shockwaves = [];
    this.systemState = 'EQUILIBRIUM';

    if (this.container && this.canvas) {
      if (this.prefersReduced) {
        this.initReducedMotion();
      } else {
        this.init();
      }
    }
  }

  calculateParticleCount() {
    const w = window.innerWidth;
    if (w < 480) return 320;
    if (w < 860) return 500;
    return 750;
  }

  getTargetDPR() {
    const w = window.innerWidth;
    const native = window.devicePixelRatio || 1;
    if (w < 480) return 1.0;
    if (w < 860) return Math.min(native, 1.25);
    return Math.min(native, 1.5);
  }

  init() {
    try {
      const width = this.container.clientWidth || 800;
      const height = this.container.clientHeight || 520;

      // 1. Scene & Camera
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
      this.camera.position.z = 85;

      // 2. Renderer with strict DPR capping
      const targetDpr = this.getTargetDPR();
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(targetDpr);

      // 3. Build Geometries: Architectural Lattice (Cream / Graphite)
      this.buildParticleLattice();

      // 4. Update HUD metadata
      this.updateHUD();

      // 5. Pointer & Touch Listeners
      this.setupEventListeners();

      // 6. Visibility Observer (Pause when off-screen to save 100% GPU/CPU)
      const syncLoop = () => {
        const rect = this.container.getBoundingClientRect();
        const nexus = document.getElementById('nexus');
        const nexusActive = nexus && nexus.getBoundingClientRect().top <= window.innerHeight * 0.5;
        this.isVisible = rect.bottom > 70 && rect.top < window.innerHeight && !nexusActive;
        if (this.isVisible && !document.hidden) this.startLoop();
        else this.stopLoop();
      };
      this.visibilityObserver = new IntersectionObserver(syncLoop, { threshold: [0, 0.08] });
      this.visibilityObserver.observe(this.container);
      // Chapter activation is independent of intersection callback timing.
      window.addEventListener('scroll', syncLoop, { passive: true });
      window.addEventListener('resize', syncLoop, { passive: true });

      // 7. Page Visibility Listener (Pause on background tab)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopLoop();
        } else if (this.isVisible) {
          this.startLoop();
        }
      });

    } catch (err) {
      console.error('WebGL initialization failed; using the canvas fallback.', err);
      this.init2DFallback();
    }
  }

  initReducedMotion() {
    try {
      const width = this.container.clientWidth || 800;
      const height = this.container.clientHeight || 520;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
      this.camera.position.z = 85;

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(1.0);

      this.particleCount = 400;
      this.buildParticleLattice();
      this.renderer.render(this.scene, this.camera);

      this.systemState = 'STATIC EQUILIBRIUM';
      this.updateHUD();
      if (this.affordanceEl) this.affordanceEl.textContent = 'REDUCED MOTION ACTIVE';

      // Notify telemetry of paused state
      this.emitLoopState(false);
    } catch (e) {
      this.init2DFallback();
    }
  }

  init2DFallback() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const width = (this.canvas.width = this.container.clientWidth || 800);
    const height = (this.canvas.height = this.container.clientHeight || 500);

    const particles = [];
    const count = 150;
    const radius = Math.min(width, height) * 0.28;

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      particles.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
        size: 1.5
      });
    }

    const renderStatic2D = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const fov = 350;

      for (let i = 0; i < count; i++) {
        const p = particles[i];
        const scale = fov / (fov + p.z);
        const px = cx + p.x * scale;
        const py = cy + p.y * scale;

        ctx.fillStyle = 'rgba(244, 241, 234, 0.85)';
        ctx.beginPath();
        ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    renderStatic2D();
    if (this.rendererValEl) this.rendererValEl.textContent = '2D CANVAS FALLBACK';
    this.emitLoopState(false);
  }

  buildParticleLattice() {
    const count = this.particleCount;
    this.positions = new Float32Array(count * 3);
    this.originalPositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const radius = 32;

    for (let i = 0; i < count; i++) {
      // Golden spiral distribution on sphere
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      const x = radius * Math.cos(theta) * Math.sin(phi) + (Math.random() - 0.5) * 2;
      const y = radius * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * 2;
      const z = radius * Math.cos(phi) + (Math.random() - 0.5) * 2;

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;

      this.originalPositions[i * 3] = x;
      this.originalPositions[i * 3 + 1] = y;
      this.originalPositions[i * 3 + 2] = z;


      // Color scheme: Editorial Cream (#f4f1ea) with subtle depth luminance
      const depthFactor = (z + radius) / (2 * radius);
      const lum = 0.72 + depthFactor * 0.28;
      colors[i * 3] = 0.96 * lum;     // R
      colors[i * 3 + 1] = 0.94 * lum; // G
      colors[i * 3 + 2] = 0.90 * lum; // B
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);

    // Inner wireframe core geometry: Muted graphite/cream structural core
    const coreGeo = new THREE.IcosahedronGeometry(13.5, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x5a6578,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    this.innerCore = new THREE.Mesh(coreGeo, coreMat);
    this.scene.add(this.innerCore);
  }

  updateHUD() {
    if (this.stateEl) this.stateEl.textContent = this.systemState;
    if (this.nodeCountEl) this.nodeCountEl.textContent = `${this.particleCount} NODES`;
    if (this.rendererValEl) {
      const dpr = this.getTargetDPR().toFixed(2);
      this.rendererValEl.textContent = `THREE.JS / DPR ${dpr}`;
    }
  }

  setupEventListeners() {
    // 1. Throttled Resize
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!this.container || !this.renderer || !this.camera) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        const dpr = this.getTargetDPR();
        this.renderer.setPixelRatio(dpr);
        this.updateHUD();
      }, 150);
    }, { passive: true });

    // 2. Mouse Move
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.mouse.targetX = x * 14;
      this.mouse.targetY = y * 10;
      this.mouse.isActive = true;

      if (this.shockwaves.length === 0) {
        this.setState('POINTER ACTIVE');
      }
    });

    this.container.addEventListener('mouseleave', () => {
      this.mouse.targetX = 0;
      this.mouse.targetY = 0;
      this.mouse.isActive = false;
      if (this.shockwaves.length === 0) {
        this.setState('RESOLVING');
      }
    });

    // 3. Click / Tap Shockwave (Limit max 2 concurrent waves)
    const triggerPulse = () => {
      if (this.shockwaves.length >= 2) return;
      this.shockwaves.push({
        radius: 0,
        maxRadius: 42,
        speed: 1.5,
        strength: 4.8
      });
      this.setState('SHOCKWAVE PULSE');
    };

    this.container.addEventListener('click', triggerPulse);
  }

  setState(newState) {
    if (this.systemState === newState) return;
    this.systemState = newState;
    if (this.stateEl) this.stateEl.textContent = newState;
  }

  emitLoopState(running) {
    window.dispatchEvent(new CustomEvent('spatial-core-loop-state', {
      detail: { running }
    }));
  }

  startLoop() {
    if (this.animationFrameId || this.prefersReduced) return;
    this.emitLoopState(true);

    let time = 0;
    const render = () => {
      time += 0.008;

      // Smooth pointer lerp
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

      // Subtle rotation around equilibrium
      if (this.particles) {
        this.particles.rotation.y = time * 0.12 + this.mouse.x * 0.02;
        this.particles.rotation.x = Math.sin(time * 0.08) * 0.12 + this.mouse.y * 0.02;

        // Apply Shockwaves with bounded damping
        const pos = this.particles.geometry.attributes.position.array;
        
        for (let s = this.shockwaves.length - 1; s >= 0; s--) {
          const sw = this.shockwaves[s];
          sw.radius += sw.speed;

          for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 3;
            const ox = this.originalPositions[idx];
            const oy = this.originalPositions[idx + 1];
            const oz = this.originalPositions[idx + 2];
            const dist = Math.sqrt(ox * ox + oy * oy + oz * oz);

            if (Math.abs(dist - sw.radius) < 3.5) {
              const factor = (1 - (dist / sw.maxRadius)) * sw.strength;
              pos[idx] = ox + (ox / dist) * factor;
              pos[idx + 1] = oy + (oy / dist) * factor;
              pos[idx + 2] = oz + (oz / dist) * factor;
            }
          }

          if (sw.radius >= sw.maxRadius) {
            this.shockwaves.splice(s, 1);
            if (this.shockwaves.length === 0) {
              this.setState(this.mouse.isActive ? 'POINTER ACTIVE' : 'RESOLVING');
            }
          }
        }

        // Return particles gently to equilibrium positions
        if (this.shockwaves.length === 0) {
          let hasDiff = false;
          for (let i = 0; i < this.particleCount * 3; i++) {
            const diff = this.originalPositions[i] - pos[i];
            if (Math.abs(diff) > 0.01) {
              pos[i] += diff * 0.06;
              hasDiff = true;
            }
          }
          if (!hasDiff && !this.mouse.isActive) {
            this.setState('EQUILIBRIUM');
          }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
      }

      if (this.innerCore) {
        this.innerCore.rotation.y = -time * 0.18;
        this.innerCore.rotation.z = time * 0.08;
      }

      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  stopLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.emitLoopState(false);
    }
  }
}
