import { useEffect, useRef, useState, useCallback } from 'react';

export type ParticleMode = 
  | 'idle'
  | 'document'     // stage 1: particles gather into a document-like rectangle outline
  | 'scanning'     // stage 2: particles flow horizontally like reading lines
  | 'clustering'   // stage 3: particles converge into date/deadline clusters
  | 'constellation'// stage 4: particles form connected nodes / calendar grid
  | 'settling'     // stage 5: particles settle into a calm, organized formation
  | 'error';       // subtle red warning scatter

export interface ParticleOptions {
  density?: 'low' | 'normal' | 'high';
  interactionRadius?: number;
  reducedMotion?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
  targetX?: number;
  targetY?: number;
  size: number;
  baseSize: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  glowColor: string;
  angle: number;
  angularSpeed: number;
  orbitRadius: number;
  mass: number;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  alpha: number;
}

const PALETTE = {
  navy: '#172B4D',
  cyan: '#79C8D0',
  gold: '#D9A928',
  softBlue: '#8FB7E8',
  sage: '#A8B8A0',
  red: '#D9574F'
};

export function useParticleSystem(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  mode: ParticleMode = 'idle',
  options: ParticleOptions = {}
) {
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean; isDown: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
    isDown: false
  });
  const animFrameRef = useRef<number | null>(null);
  const dimensionsRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 300,
    height: 200,
    dpr: 1
  });

  // Listen to prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const reduced = options.reducedMotion ?? isReducedMotion;

  // Initialize particles according to width & height
  const initParticles = useCallback((w: number, h: number) => {
    const isMobile = w < 640;
    let count = 48;
    if (options.density === 'low' || isMobile) count = 28;
    else if (options.density === 'high') count = 68;

    const newParticles: Particle[] = [];
    const colors = [
      { color: PALETTE.navy, glow: 'rgba(23, 43, 77, 0.4)', weight: 0.4 },
      { color: PALETTE.cyan, glow: 'rgba(121, 200, 208, 0.6)', weight: 0.35 },
      { color: PALETTE.gold, glow: 'rgba(217, 169, 40, 0.5)', weight: 0.15 },
      { color: PALETTE.softBlue, glow: 'rgba(143, 183, 232, 0.5)', weight: 0.1 }
    ];

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let picked = colors[0];
      let acc = 0;
      for (const c of colors) {
        acc += c.weight;
        if (rand <= acc) {
          picked = c;
          break;
        }
      }

      const x = Math.random() * w;
      const y = Math.random() * h;
      const baseSize = 2.2 + Math.random() * 2.8;
      const baseAlpha = 0.55 + Math.random() * 0.4;

      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        originX: x,
        originY: y,
        size: baseSize,
        baseSize,
        alpha: baseAlpha,
        baseAlpha,
        color: picked.color,
        glowColor: picked.glow,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.02,
        orbitRadius: 10 + Math.random() * 30,
        mass: 0.8 + Math.random() * 0.8
      });
    }

    particlesRef.current = newParticles;
  }, [options.density]);

  // Update target coordinates based on stages
  const updateTargetsForMode = useCallback((w: number, h: number, currentMode: ParticleMode) => {
    const particles = particlesRef.current;
    const n = particles.length;
    if (n === 0) return;

    const cx = w / 2;
    const cy = h / 2;

    if (currentMode === 'document') {
      // Gather into document rectangle outline with folded top-right corner
      const docW = Math.min(w * 0.5, 140);
      const docH = Math.min(h * 0.65, 170);
      const left = cx - docW / 2;
      const top = cy - docH / 2;

      // Distribute particles along rectangle perimeter and internal text guidelines
      particles.forEach((p, idx) => {
        const perimRatio = idx / n;
        if (perimRatio < 0.6) {
          // Perimeter
          const t = perimRatio / 0.6;
          if (t < 0.25) {
            p.targetX = left + t * 4 * docW;
            p.targetY = top;
          } else if (t < 0.5) {
            p.targetX = left + docW;
            p.targetY = top + (t - 0.25) * 4 * docH;
          } else if (t < 0.75) {
            p.targetX = left + docW - (t - 0.5) * 4 * docW;
            p.targetY = top + docH;
          } else {
            p.targetX = left;
            p.targetY = top + docH - (t - 0.75) * 4 * docH;
          }
        } else {
          // Internal document horizontal text lines
          const lineIdx = idx % 4;
          const lineY = top + docH * (0.3 + lineIdx * 0.16);
          const lineXRatio = ((idx * 7) % 10) / 10;
          p.targetX = left + 14 + lineXRatio * (docW - 28);
          p.targetY = lineY;
        }
      });
    } else if (currentMode === 'scanning') {
      // Horizontal flow suggesting text scanning
      particles.forEach((p, idx) => {
        const row = idx % 5;
        p.targetY = cy - 40 + row * 20;
        p.targetX = (cx - 100) + ((idx * 17) % 200);
      });
    } else if (currentMode === 'clustering') {
      // Three clusters representing: Title, Date & Time, Venue/Deadlines
      const clusters = [
        { x: cx - w * 0.22, y: cy },
        { x: cx, y: cy - 15 },
        { x: cx + w * 0.22, y: cy + 10 }
      ];
      particles.forEach((p, idx) => {
        const c = clusters[idx % clusters.length];
        const offsetAngle = (idx / n) * Math.PI * 2 * 3;
        const rad = 12 + (idx % 4) * 8;
        p.targetX = c.x + Math.cos(offsetAngle) * rad;
        p.targetY = c.y + Math.sin(offsetAngle) * rad;
      });
    } else if (currentMode === 'constellation') {
      // Coordinated constellation / calendar grid nodes
      const cols = 5;
      const rows = Math.ceil(n / cols);
      const gridW = Math.min(w * 0.65, 200);
      const gridH = Math.min(h * 0.5, 120);
      const startX = cx - gridW / 2;
      const startY = cy - gridH / 2;

      particles.forEach((p, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        p.targetX = startX + (c / (cols - 1)) * gridW;
        p.targetY = startY + ((r % rows) / Math.max(1, rows - 1)) * gridH;
      });
    } else if (currentMode === 'settling') {
      // Calm, concentric orbits settling smoothly
      particles.forEach((p, idx) => {
        const ring = (idx % 3) + 1;
        const rad = ring * 32;
        const angle = (idx / n) * Math.PI * 2;
        p.targetX = cx + Math.cos(angle) * rad;
        p.targetY = cy + Math.sin(angle) * rad;
      });
    } else if (currentMode === 'error') {
      // Red scattered dispersion
      particles.forEach((p) => {
        p.targetX = undefined;
        p.targetY = undefined;
        p.color = PALETTE.red;
        p.glowColor = 'rgba(217, 87, 79, 0.6)';
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = (Math.random() - 0.5) * 2;
      });
    } else {
      // Idle mode: free floating
      particles.forEach((p) => {
        p.targetX = undefined;
        p.targetY = undefined;
      });
    }
  }, []);

  // Dispatch click/tap ripple
  const triggerRipple = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ripplesRef.current.push({
      x,
      y,
      radius: 4,
      maxRadius: Math.min(rect.width, rect.height) * 0.45,
      strength: 4.5,
      alpha: 0.6
    });

    // Gentle dispersion on nearby particles
    particlesRef.current.forEach(p => {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < 120 && dist > 1) {
        const force = (1 - dist / 120) * 3.5;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    });
  }, [canvasRef]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let isRunning = true;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(rect.width, 100);
      const height = Math.max(rect.height, 100);

      dimensionsRef.current = { width, height, dpr };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particlesRef.current.length === 0) {
        initParticles(width, height);
      }
      updateTargetsForMode(width, height, mode);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(canvas);

    // Mouse & Touch listeners on canvas
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const onMouseEnter = () => {
      mouseRef.current.active = true;
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      mouseRef.current.isDown = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      triggerRipple(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.touches[0].clientX - rect.left;
        mouseRef.current.y = e.touches[0].clientY - rect.top;
        mouseRef.current.active = true;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        triggerRipple(e.touches[0].clientX, e.touches[0].clientY);
        mouseRef.current.active = true;
      }
    };

    const onTouchEnd = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    canvas.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('mouseenter', onMouseEnter);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);

    // Render loop
    const interactionRad = options.interactionRadius || 95;

    const render = () => {
      if (!isRunning) return;

      const { width, height } = dimensionsRef.current;
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // 1. Process Ripples
      const ripples = ripplesRef.current;
      for (let r = ripples.length - 1; r >= 0; r--) {
        const rip = ripples[r];
        rip.radius += 2.8;
        rip.alpha *= 0.94;

        if (rip.alpha <= 0.02 || rip.radius >= rip.maxRadius) {
          ripples.splice(r, 1);
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(121, 200, 208, ${rip.alpha * 0.7})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 2. Connecting Lines / Constellations between close particles
      if (!reduced) {
        const maxDist = mode === 'constellation' ? 65 : 48;
        ctx.lineWidth = 0.75;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const pi = particles[i];
            const pj = particles[j];
            const dx = pi.x - pj.x;
            const dy = pi.y - pj.y;
            const dist = Math.hypot(dx, dy);

            if (dist < maxDist) {
              const lineAlpha = (1 - dist / maxDist) * 0.22 * ((pi.alpha + pj.alpha) / 2);
              ctx.beginPath();
              ctx.moveTo(pi.x, pi.y);
              ctx.lineTo(pj.x, pj.y);
              ctx.strokeStyle = `rgba(23, 43, 77, ${lineAlpha})`;
              ctx.stroke();
            }
          }
        }
      }

      // 3. Update & Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (reduced) {
          // Reduced motion: static gentle position, no physics acceleration
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.baseSize, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.baseAlpha;
          ctx.fill();
          ctx.globalAlpha = 1;
          continue;
        }

        // Target seeking if stage is active
        if (p.targetX !== undefined && p.targetY !== undefined) {
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          const ease = 0.055;
          p.vx += dx * ease * 0.12;
          p.vy += dy * ease * 0.12;
          p.vx *= 0.88;
          p.vy *= 0.88;
        } else {
          // Idle floating with subtle damping
          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges smoothly
          if (p.x < -15) p.x = width + 15;
          if (p.x > width + 15) p.x = -15;
          if (p.y < -15) p.y = height + 15;
          if (p.y > height + 15) p.y = -15;
        }

        // Apply velocities
        p.x += p.vx;
        p.y += p.vy;

        // Mouse interaction (repel gently, scatter on click)
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.hypot(mdx, mdy);

          if (mdist < interactionRad && mdist > 1) {
            const force = (1 - mdist / interactionRad) * (mouse.isDown ? 2.5 : 1.2);
            p.vx += (mdx / mdist) * force;
            p.vy += (mdy / mdist) * force;
            p.size = p.baseSize * 1.35;
            p.alpha = Math.min(1, p.baseAlpha * 1.4);
          } else {
            p.size = p.baseSize;
            p.alpha = p.baseAlpha;
          }
        } else {
          p.size = p.baseSize;
          p.alpha = p.baseAlpha;
        }

        // Draw particle glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = p.glowColor;
        ctx.globalAlpha = p.alpha * 0.35;
        ctx.fill();
        ctx.restore();

        // Draw core particle
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseenter', onMouseEnter);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [canvasRef, initParticles, updateTargetsForMode, mode, reduced, options.interactionRadius, triggerRipple]);

  // When mode changes, calculate new targets
  useEffect(() => {
    const { width, height } = dimensionsRef.current;
    updateTargetsForMode(width, height, mode);
  }, [mode, updateTargetsForMode]);

  return {
    isReducedMotion: reduced,
    triggerRipple
  };
}
