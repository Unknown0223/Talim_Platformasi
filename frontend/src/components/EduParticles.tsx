import { useEffect, useRef } from "react";

type SubjectType =
  | "physics"
  | "chemistry"
  | "dna"
  | "code"
  | "math"
  | "logic"
  | "geodetic"
  | "atom"
  | "book"
  | "gear"
  | "formula"
  | "rocket";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  angle: number;
  spin: number;
  opacity: number;
  baseOpacity: number;
  pulse: number;
  pulseSpeed: number;
  color: string;
  type: SubjectType;
  glow: number;
};

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number }[];
  color: string;
};

const subjectTypes: SubjectType[] = [
  "physics",
  "chemistry",
  "dna",
  "code",
  "math",
  "logic",
  "geodetic",
  "atom",
  "book",
  "gear",
  "formula",
  "rocket",
];

const glowingColors = [
  "rgba(53, 99, 255, 1)", // IT (Blue)
  "rgba(139, 92, 246, 1)", // English (Violet)
  "rgba(236, 72, 153, 1)", // Chemistry (Pink)
  "rgba(16, 185, 129, 1)", // Mathematics (Emerald)
  "rgba(245, 158, 11, 1)", // Physics (Amber)
  "rgba(14, 165, 233, 1)", // Sky
  "rgba(244, 63, 94, 1)", // Rose
];

export function EduParticles({ theme }: { theme: "dark" | "light" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const isDark = theme === "dark";
    const activeColors = isDark
      ? glowingColors
      : glowingColors.map((c) => c.replace("1)", "0.85)"));

    const particleCount = Math.min(48, Math.floor((width * height) / 26000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseRadius = Math.random() * 8 + 20;
      const baseOpacity = Math.random() * 0.55 + 0.35;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        baseRadius,
        radius: baseRadius,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.005,
        baseOpacity,
        opacity: baseOpacity,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.014,
        color: activeColors[Math.floor(Math.random() * activeColors.length)],
        type: subjectTypes[Math.floor(Math.random() * subjectTypes.length)],
        glow: 0,
      });
    }

    const sparks: Spark[] = [];
    const shootingStars: ShootingStar[] = [];

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const cx = e.clientX;
      const cy = e.clientY;
      const colorPick = activeColors[Math.floor(Math.random() * activeColors.length)];
      for (let i = 0; i < 14; i++) {
        const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
        const sp = 1.5 + Math.random() * 2.5;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0,
          maxLife: 50 + Math.random() * 30,
          color: colorPick,
          size: 1.5 + Math.random() * 1.8,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    document.addEventListener("mouseleave", handleMouseLeave);

    const drawBlueprintIcon = (p: Particle) => {
      const r = p.radius;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      const baseAlpha = p.opacity * (isDark ? 0.18 : 0.10) + p.glow * (isDark ? 0.22 : 0.18);
      ctx.strokeStyle = p.color.replace("1)", `${baseAlpha})`);
      ctx.fillStyle = p.color.replace("1)", `${baseAlpha * 0.14})`);
      ctx.lineWidth = 1.1 + p.glow * 0.6;

      if (isDark) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10 + p.glow * 18;
      } else {
        ctx.shadowColor = p.color.replace("1)", "0.45)");
        ctx.shadowBlur = 4 + p.glow * 12;
      }

      ctx.beginPath();

      switch (p.type) {
        case "physics":
          ctx.arc(0, 0, r / 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-r / 3.5, 0);
          ctx.lineTo(r / 3.5, 0);
          ctx.moveTo(0, -r / 3.5);
          ctx.lineTo(0, r / 3.5);
          ctx.stroke();
          for (let deg = 0; deg < 180; deg += 60) {
            ctx.beginPath();
            ctx.save();
            ctx.rotate((deg * Math.PI) / 180);
            ctx.ellipse(0, 0, r, r / 2.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(r, 0, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = p.color.replace("1)", `${baseAlpha * 1.5})`);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
          break;

        case "chemistry":
          ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          for (let side = 0; side < 6; side++) {
            const ang = (side * Math.PI) / 3;
            const x = Math.cos(ang) * r;
            const y = Math.sin(ang) * r;
            if (side === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          for (let branch = 0; branch < 6; branch += 2) {
            const ang = (branch * Math.PI) / 3;
            ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
            ctx.lineTo(Math.cos(ang) * (r * 1.45), Math.sin(ang) * (r * 1.45));
          }
          ctx.stroke();
          ctx.font = `500 8px 'Courier New', monospace`;
          ctx.fillStyle = p.color.replace("1)", `${baseAlpha * 1.8})`);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("H", Math.cos(0) * (r * 1.6), Math.sin(0) * (r * 1.6));
          ctx.fillText(
            "CH3",
            Math.cos((2 * Math.PI) / 3) * (r * 1.65),
            Math.sin((2 * Math.PI) / 3) * (r * 1.65),
          );
          break;

        case "dna": {
          const points = 18;
          ctx.beginPath();
          for (let step = -r; step <= r; step += (r * 2) / points) {
            const wave1 = Math.sin(step * 0.12 + p.pulse) * (r / 2.2);
            const wave2 = -Math.sin(step * 0.12 + p.pulse) * (r / 2.2);
            ctx.arc(step, wave1, 1.2, 0, Math.PI * 2);
            ctx.arc(step, wave2, 1.2, 0, Math.PI * 2);
            ctx.moveTo(step, wave1);
            ctx.lineTo(step, wave2);
          }
          ctx.stroke();
          break;
        }

        case "code":
          ctx.rect(-r, -r / 1.5, r * 2, r * 1.3);
          ctx.stroke();
          ctx.moveTo(-r, -r / 3);
          ctx.lineTo(r, -r / 3);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-r * 0.7, -r * 0.5, 1.8, 0, Math.PI * 2);
          ctx.arc(-r * 0.4, -r * 0.5, 1.8, 0, Math.PI * 2);
          ctx.arc(-r * 0.1, -r * 0.5, 1.8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-r * 0.5, -r * 0.1);
          ctx.lineTo(-r * 0.8, r * 0.15);
          ctx.lineTo(-r * 0.5, r * 0.4);
          ctx.moveTo(r * 0.5, -r * 0.1);
          ctx.lineTo(r * 0.8, r * 0.15);
          ctx.lineTo(r * 0.5, r * 0.4);
          ctx.moveTo(r * 0.2, -r * 0.2);
          ctx.lineTo(-r * 0.2, r * 0.5);
          ctx.stroke();
          break;

        case "math": {
          let currentR = r * 0.08;
          let angleSum = 0;
          ctx.moveTo(0, 0);
          for (let step = 0; step < 16; step++) {
            currentR *= 1.25;
            angleSum += Math.PI / 4;
            const x = Math.cos(angleSum) * currentR;
            const y = Math.sin(angleSum) * currentR;
            ctx.lineTo(x, y);
            ctx.strokeRect(-currentR, -currentR, currentR * 2, currentR * 2);
          }
          ctx.stroke();
          break;
        }

        case "logic":
          ctx.moveTo(-r, -r / 3);
          ctx.lineTo(-r / 3, -r / 3);
          ctx.moveTo(-r, r / 3);
          ctx.lineTo(-r / 3, r / 3);
          ctx.moveTo(-r / 3, -r / 2);
          ctx.lineTo(r / 6, -r / 2);
          ctx.quadraticCurveTo(r * 0.8, 0, r / 6, r / 2);
          ctx.lineTo(-r / 3, r / 2);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(r * 0.8, 0, 2.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.moveTo(r * 0.8 + 2.5, 0);
          ctx.lineTo(r * 1.3, 0);
          ctx.stroke();
          break;

        case "geodetic":
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
          for (let lat = -r + r / 3; lat < r; lat += r / 3) {
            ctx.beginPath();
            const w = Math.sqrt(r * r - lat * lat);
            ctx.ellipse(0, lat, w, w / 4, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.ellipse(0, 0, r / 2, r, 0, 0, Math.PI * 2);
          ctx.ellipse(0, 0, r / 4, r, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;

        case "atom":
          ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          for (let i = 0; i < 3; i++) {
            ctx.save();
            ctx.rotate((i * Math.PI) / 3 + p.pulse * 0.3);
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2);
            ctx.stroke();
            const orbitX = Math.cos(p.pulse * 1.5 + i) * r;
            const orbitY = Math.sin(p.pulse * 1.5 + i) * r * 0.4;
            ctx.beginPath();
            ctx.arc(orbitX, orbitY, 2.4, 0, Math.PI * 2);
            ctx.fillStyle = p.color.replace("1)", `${baseAlpha * 2})`);
            ctx.fill();
            ctx.restore();
          }
          break;

        case "book":
          ctx.moveTo(-r, -r * 0.6);
          ctx.lineTo(-r, r * 0.6);
          ctx.lineTo(0, r * 0.45);
          ctx.lineTo(0, -r * 0.7);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.7);
          ctx.lineTo(0, r * 0.45);
          ctx.lineTo(r, r * 0.6);
          ctx.lineTo(r, -r * 0.6);
          ctx.closePath();
          ctx.stroke();
          for (let line = 0; line < 3; line++) {
            const y = -r * 0.4 + line * r * 0.32;
            ctx.beginPath();
            ctx.moveTo(-r * 0.85, y);
            ctx.lineTo(-r * 0.15, y - line * 0.04);
            ctx.moveTo(r * 0.15, y - line * 0.04);
            ctx.lineTo(r * 0.85, y);
            ctx.stroke();
          }
          break;

        case "gear": {
          const teeth = 10;
          const inner = r * 0.55;
          const outer = r;
          ctx.beginPath();
          for (let i = 0; i < teeth * 2; i++) {
            const ang = (i * Math.PI) / teeth;
            const rad = i % 2 === 0 ? outer : inner;
            const x = Math.cos(ang) * rad;
            const y = Math.sin(ang) * rad;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "formula": {
          ctx.font = `600 ${Math.round(r * 0.7)}px 'Courier New', monospace`;
          ctx.fillStyle = p.color.replace("1)", `${baseAlpha * 1.7})`);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const formulas = ["E=mc²", "∫f(x)dx", "π·r²", "a²+b²", "Σx/n", "∇²ψ"];
          const idx = Math.floor((p.x + p.y) / 30) % formulas.length;
          ctx.fillText(formulas[Math.abs(idx) % formulas.length], 0, 0);
          ctx.beginPath();
          ctx.roundRect(-r * 1.4, -r * 0.55, r * 2.8, r * 1.1, 6);
          ctx.stroke();
          break;
        }

        case "rocket": {
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.quadraticCurveTo(r * 0.45, -r * 0.4, r * 0.45, r * 0.5);
          ctx.lineTo(-r * 0.45, r * 0.5);
          ctx.quadraticCurveTo(-r * 0.45, -r * 0.4, 0, -r);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, -r * 0.15, r * 0.18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-r * 0.45, r * 0.2);
          ctx.lineTo(-r * 0.85, r * 0.7);
          ctx.lineTo(-r * 0.4, r * 0.55);
          ctx.moveTo(r * 0.45, r * 0.2);
          ctx.lineTo(r * 0.85, r * 0.7);
          ctx.lineTo(r * 0.4, r * 0.55);
          ctx.stroke();
          ctx.beginPath();
          const flameLen = r * 0.4 + Math.sin(p.pulse * 4) * r * 0.18;
          ctx.moveTo(-r * 0.2, r * 0.5);
          ctx.lineTo(0, r * 0.5 + flameLen);
          ctx.lineTo(r * 0.2, r * 0.5);
          ctx.fillStyle = p.color.replace("1)", `${baseAlpha * 1.5})`);
          ctx.fill();
          break;
        }
      }

      ctx.restore();
    };

    const drawSparks = () => {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.96;
        s.vy *= 0.96;
        const lifeRatio = 1 - s.life / s.maxLife;
        if (lifeRatio <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.fillStyle = s.color.replace("1)", `${lifeRatio * (isDark ? 0.85 : 0.55)})`);
        if (isDark) {
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 10;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * lifeRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const drawShootingStars = () => {
      if (Math.random() < 0.0035 && shootingStars.length < 2) {
        const startEdge = Math.random();
        const start = startEdge < 0.5
          ? { x: Math.random() * width, y: -20 }
          : { x: -20, y: Math.random() * height * 0.5 };
        const angle = Math.PI / 4 + Math.random() * 0.4;
        const speed = 6 + Math.random() * 4;
        shootingStars.push({
          x: start.x,
          y: start.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 90,
          trail: [],
          color: activeColors[Math.floor(Math.random() * activeColors.length)],
        });
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.life++;
        star.x += star.vx;
        star.y += star.vy;
        star.trail.push({ x: star.x, y: star.y });
        if (star.trail.length > 18) star.trail.shift();

        const lifeRatio = 1 - star.life / star.maxLife;
        if (lifeRatio <= 0 || star.x > width + 50 || star.y > height + 50) {
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.lineCap = "round";
        for (let t = 1; t < star.trail.length; t++) {
          const prev = star.trail[t - 1];
          const cur = star.trail[t];
          const a = (t / star.trail.length) * lifeRatio * (isDark ? 0.9 : 0.55);
          ctx.strokeStyle = star.color.replace("1)", `${a})`);
          ctx.lineWidth = (t / star.trail.length) * 2.5;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(cur.x, cur.y);
          ctx.stroke();
        }
        if (isDark) {
          ctx.shadowColor = star.color;
          ctx.shadowBlur = 14;
        }
        ctx.fillStyle = star.color.replace("1)", `${lifeRatio})`);
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      const gridOpacity = isDark ? 0.045 : 0.025;

      ctx.strokeStyle = isDark
        ? `rgba(255, 255, 255, ${gridOpacity})`
        : `rgba(15, 23, 42, ${gridOpacity})`;
      ctx.lineWidth = 1;
      const gridSize = 65;
      const mouseOffsetX = mouseRef.current.active
        ? (mouseRef.current.x - width / 2) * 0.03
        : 0;
      const mouseOffsetY = mouseRef.current.active
        ? (mouseRef.current.y - height / 2) * 0.03
        : 0;

      for (let x = mouseOffsetX % gridSize; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = mouseOffsetY % gridSize; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const connectionDist = 170;
      const lineOpacityBase = isDark ? 0.08 : 0.045;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const fade = 1 - dist / connectionDist;
            const alpha = fade * lineOpacityBase * (1 + (p1.glow + p2.glow) * 0.6);
            const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            grad.addColorStop(0, p1.color.replace("1)", `${alpha})`));
            grad.addColorStop(1, p2.color.replace("1)", `${alpha})`));
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.pulse += p.pulseSpeed;
        p.radius = p.baseRadius * (1 + Math.sin(p.pulse) * 0.06);
        p.opacity = p.baseOpacity * (0.85 + Math.sin(p.pulse * 0.7) * 0.15);

        let nearMouse = false;
        if (mouseRef.current.active) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const force = (160 - dist) / 160;
            p.x += (dx / dist) * force * 1.7;
            p.y += (dy / dist) * force * 1.7;
            p.glow += (force - p.glow) * 0.18;
            nearMouse = true;
            if (Math.random() < force * 0.04) {
              sparks.push({
                x: p.x + (Math.random() - 0.5) * p.radius,
                y: p.y + (Math.random() - 0.5) * p.radius,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6 - 0.3,
                life: 0,
                maxLife: 28 + Math.random() * 14,
                color: p.color,
                size: 0.8 + Math.random() * 1.2,
              });
            }
          }
        }
        if (!nearMouse) p.glow += (0 - p.glow) * 0.06;

        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;
        if (p.y < -50) p.y = height + 50;
        if (p.y > height + 50) p.y = -50;

        drawBlueprintIcon(p);
      });

      drawSparks();
      drawShootingStars();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-50 h-full w-full"
    />
  );
}
