import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

export const CursorGlow = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      setIsHovering(
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') != null ||
        target.closest('a') != null
      );
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-10 rounded-full mix-blend-screen will-change-transform hidden md:block"
      animate={{
        x: mousePosition.x - 225,
        y: mousePosition.y - 225,
        scale: isHovering ? 1.4 : 1,
        opacity: isHovering ? 0.95 : 0.65
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 140, mass: 0.7 }}
      style={{
        width: 450,
        height: 450,
        background: 'radial-gradient(circle, rgba(66,133,244,0.11) 0%, rgba(155,114,243,0.07) 35%, rgba(34,211,238,0.03) 65%, transparent 100%)',
      }}
    />
  );
};

export const LiveParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = [
      'rgba(66, 133, 244, alpha)',   // Google Blue
      'rgba(234, 67, 53, alpha)',   // Google Red
      'rgba(251, 188, 5, alpha)',   // Google Yellow
      'rgba(52, 168, 83, alpha)',   // Google Green
      'rgba(155, 114, 243, alpha)',  // Gemini Purple
      'rgba(34, 211, 238, alpha)'    // Gemini Cyan
    ];

    interface Particle {
      x: number;
      y: number;
      radius: number;
      baseColor: string;
      vx: number;
      vy: number;
      sinVal: number;
      sinSpeed: number;
      pulseSpeed: number;
    }

    const particles: Particle[] = [];
    const particleCount = Math.min(35, Math.floor((width * height) / 36000));

    for (let i = 0; i < particleCount; i++) {
      const colorTemplate = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3.2 + 1.0,
        baseColor: colorTemplate,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        sinVal: Math.random() * Math.PI * 2,
        sinSpeed: Math.random() * 0.008 + 0.003,
        pulseSpeed: Math.random() * 0.015 + 0.008,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.sinVal += p.sinSpeed;

        p.x += Math.sin(p.sinVal) * 0.1;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 200) {
          const force = (200 - dist) / 200;
          p.x -= dx * force * 0.015;
          p.y -= dy * force * 0.015;
        }

        const opacity = 0.12 + Math.sin(p.sinVal * 0.7) * 0.07;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.baseColor.replace('alpha', opacity.toFixed(3));
        ctx.fill();

        if (p.radius > 2.6) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = p.baseColor.replace('alpha', (opacity * 0.22).toFixed(3));
          ctx.fill();
        }
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pi = particles[i];
          const pj = particles[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 120) {
            const alpha = ((120 - dist) / 120) * 0.035;
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            const grad = ctx.createLinearGradient(pi.x, pi.y, pj.x, pj.y);
            grad.addColorStop(0, pi.baseColor.replace('alpha', alpha.toFixed(3)));
            grad.addColorStop(1, pj.baseColor.replace('alpha', alpha.toFixed(3)));
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] bg-transparent w-full h-full"
    />
  );
};
