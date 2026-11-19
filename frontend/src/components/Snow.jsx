import React, { useEffect, useMemo, useRef } from "react";

// Soft falling snow: mostly white, with some warm red and golden flakes, to match the
// cream / red / gold festive palette.
//
// - Flakes drift away from the mouse pointer.
// - `swell` adds extra flakes (used when the card is opened). The original flakes are
//   never regenerated, so toggling it does not make the snow jump.
const EXTRA = 30;
const PUSH_RADIUS = 130; // px around the pointer that flakes react to
const PUSH_MAX = 70; // px a flake gets pushed at most

export const Snow = ({ count = 48, swell = false }) => {
  const flakes = useMemo(() => {
    const rand = (min, max) => Math.random() * (max - min) + min;
    return Array.from({ length: count + EXTRA }).map((_, i) => {
      const extra = i >= count;
      const roll = Math.random();
      const isRed = roll < 0.16;
      const isGold = !isRed && roll < 0.36;
      const size = rand(3, 8);
      return {
        id: i,
        left: rand(0, 100),
        size,
        duration: rand(7, 15),
        // extra flakes start at the top and fall in, instead of popping in mid-air
        delay: extra ? rand(0, 5) : rand(-15, 0),
        drift: `${rand(-6, 6)}vw`,
        opacity: rand(0.5, 0.95),
        color: isRed ? "#c9414f" : isGold ? "#dcae45" : "#ffffff",
        glow: isRed
          ? "0 0 6px rgba(201,65,79,0.7)"
          : isGold
            ? "0 0 7px rgba(220,174,69,0.85)"
            : "0 0 5px rgba(255,255,255,0.85)",
      };
    });
  }, [count]);

  const shown = swell ? flakes : flakes.slice(0, count);
  const layerRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      mouse.current.active = true;
    };
    const onLeave = () => {
      mouse.current.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    const offsets = new WeakMap(); // current push applied to each flake
    let raf = 0;
    const tick = () => {
      const layer = layerRef.current;
      const m = mouse.current;
      if (layer) {
        for (const el of layer.children) {
          let o = offsets.get(el);
          if (!o) {
            o = { x: 0, y: 0 };
            offsets.set(el, o);
          }
          let tx = 0;
          let ty = 0;
          if (m.active) {
            // the bounding box already includes our own push, so take it back out
            const r = el.getBoundingClientRect();
            const dx = r.left + r.width / 2 - o.x - m.x;
            const dy = r.top + r.height / 2 - o.y - m.y;
            const d = Math.hypot(dx, dy);
            if (d < PUSH_RADIUS && d > 0.01) {
              const f = 1 - d / PUSH_RADIUS;
              tx = (dx / d) * PUSH_MAX * f;
              ty = (dy / d) * PUSH_MAX * f;
            }
          }
          o.x += (tx - o.x) * 0.12;
          o.y += (ty - o.y) * 0.12;
          if (Math.abs(o.x) > 0.05 || Math.abs(o.y) > 0.05) {
            el.style.translate = `${o.x}px ${o.y}px`;
          } else if (el.style.translate) {
            el.style.translate = "";
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={layerRef} className="snow-layer" data-testid="snow-layer" aria-hidden="true">
      {shown.map((f) => (
        <span
          key={f.id}
          className="flake"
          style={{
            left: `${f.left}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            background: f.color,
            opacity: f.opacity,
            boxShadow: f.glow,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            "--drift": f.drift,
          }}
        />
      ))}
    </div>
  );
};

export default Snow;
